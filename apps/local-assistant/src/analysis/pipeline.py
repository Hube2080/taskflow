from __future__ import annotations

import json
import math
import os
import re
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

from src.visualization.build_outputs import build_visual_outputs


STOPWORDS = {
    "a",
    "about",
    "aber",
    "alle",
    "als",
    "also",
    "am",
    "an",
    "and",
    "are",
    "as",
    "at",
    "auf",
    "aus",
    "be",
    "bei",
    "bin",
    "bis",
    "but",
    "by",
    "can",
    "das",
    "dass",
    "de",
    "dem",
    "den",
    "der",
    "des",
    "die",
    "dies",
    "diese",
    "dieser",
    "do",
    "du",
    "ein",
    "eine",
    "einem",
    "einen",
    "einer",
    "es",
    "for",
    "from",
    "fuer",
    "habe",
    "haben",
    "hat",
    "ich",
    "im",
    "in",
    "is",
    "it",
    "ist",
    "mit",
    "my",
    "nicht",
    "noch",
    "of",
    "on",
    "or",
    "sich",
    "sie",
    "so",
    "that",
    "the",
    "to",
    "und",
    "was",
    "we",
    "wenn",
    "wie",
    "will",
    "wir",
    "with",
    "zu",
    "zum",
    "zur",
}

PATTERN_GROUPS = {
    "recurring_concerns": {
        "terms": {"concern", "worry", "risk", "problem", "blocker", "fragile", "sorge", "angst", "risiko", "problem", "blockade"},
        "label": "Recurring concerns",
    },
    "goals": {
        "terms": {"goal", "need", "want", "outcome", "success", "ziel", "brauche", "will", "ergebnis", "morgen"},
        "label": "Goals and desired outcomes",
    },
    "tensions": {
        "terms": {"versus", "tension", "tradeoff", "but", "however", "spannung", "konflikt", "aber", "gegen"},
        "label": "Tensions and tradeoffs",
    },
    "local_first": {
        "terms": {"local", "privacy", "private", "ollama", "lokal", "privacy", "privat", "cloud", "offline"},
        "label": "Local-first orientation",
    },
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def clean_text(text: str) -> str:
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[\u0000-\u001f]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9_'-]{1,}", text.lower())
    cleaned: list[str] = []
    for token in tokens:
        token = token.strip("_'-")
        if len(token) < 3:
            continue
        if token in STOPWORDS:
            continue
        cleaned.append(token)
    return cleaned


def make_excerpt(text: str, max_chars: int = 360) -> str:
    compact = clean_text(text)
    if len(compact) <= max_chars:
        return compact
    cutoff = compact.rfind(".", 0, max_chars)
    if cutoff < 120:
        cutoff = max_chars
    return compact[:cutoff].strip() + "..."


def keyword_counts(notes: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, list[str]]]:
    token_map: dict[str, list[str]] = {}
    unigram_counter: Counter[str] = Counter()
    bigram_counter: Counter[str] = Counter()
    trigram_counter: Counter[str] = Counter()

    for note in notes:
        tokens = tokenize(note["text"])
        token_map[note["id"]] = tokens
        unigram_counter.update(tokens)
        bigram_counter.update(" ".join(pair) for pair in zip(tokens, tokens[1:]))
        trigram_counter.update(" ".join(triple) for triple in zip(tokens, tokens[1:], tokens[2:]))

    keywords = [{"term": term, "count": count} for term, count in unigram_counter.most_common(80)]
    ngrams = (
        [{"term": term, "count": count, "size": 2} for term, count in bigram_counter.most_common(50)]
        + [{"term": term, "count": count, "size": 3} for term, count in trigram_counter.most_common(30)]
    )
    ngrams.sort(key=lambda item: item["count"], reverse=True)
    return keywords, ngrams[:80], token_map


def try_hf_embeddings(texts: list[str]) -> tuple[np.ndarray | None, str | None]:
    if os.environ.get("ANTIGONE_DISABLE_HF", "").lower() in {"1", "true", "yes"}:
        return None, "disabled by ANTIGONE_DISABLE_HF"
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        model_name = os.environ.get("ANTIGONE_HF_EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        model = SentenceTransformer(model_name)
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return np.asarray(embeddings, dtype=float), f"huggingface:{model_name}"
    except Exception as error:
        return None, f"hf unavailable: {error}"


def fallback_vectors(texts: list[str]) -> tuple[np.ndarray, list[str], str]:
    vectorizer = TfidfVectorizer(
        tokenizer=tokenize,
        token_pattern=None,
        lowercase=False,
        ngram_range=(1, 2),
        min_df=1,
        max_features=2500,
    )
    matrix = vectorizer.fit_transform(texts)
    feature_names = list(vectorizer.get_feature_names_out())
    if matrix.shape[0] >= 3 and matrix.shape[1] >= 3:
        components = min(50, matrix.shape[0] - 1, matrix.shape[1] - 1)
        if components >= 2:
            semantic = TruncatedSVD(n_components=components, random_state=42).fit_transform(matrix)
        else:
            semantic = matrix.toarray()
    else:
        semantic = matrix.toarray()
    return normalize(semantic), feature_names, "tfidf-svd"


def compute_semantic_vectors(texts: list[str]) -> tuple[np.ndarray, list[str], str, str | None]:
    hf_vectors, hf_status = try_hf_embeddings(texts)
    _, feature_names, fallback_method = fallback_vectors(texts)
    if hf_vectors is not None:
        return hf_vectors, feature_names, "hf-embeddings", hf_status
    fallback, _, _ = fallback_vectors(texts)
    return fallback, feature_names, fallback_method, hf_status


def choose_cluster_count(note_count: int) -> int:
    if note_count <= 1:
        return 1
    if note_count == 2:
        return 2
    return max(2, min(8, round(math.sqrt(note_count)) + 1, note_count))


def cluster_notes(notes: list[dict[str, Any]], vectors: np.ndarray, token_map: dict[str, list[str]]) -> tuple[list[int], list[dict[str, Any]]]:
    note_count = len(notes)
    cluster_count = choose_cluster_count(note_count)
    if note_count == 0:
        return [], []
    if cluster_count == 1:
        labels = [0] * note_count
        centers = np.mean(vectors, axis=0, keepdims=True)
    else:
        model = KMeans(n_clusters=cluster_count, random_state=42, n_init="auto")
        labels = model.fit_predict(vectors).tolist()
        centers = model.cluster_centers_

    clusters: list[dict[str, Any]] = []
    for cluster_id in sorted(set(labels)):
        member_indexes = [index for index, label in enumerate(labels) if label == cluster_id]
        term_counter: Counter[str] = Counter()
        for index in member_indexes:
            term_counter.update(token_map.get(notes[index]["id"], []))
        top_terms = [term for term, _ in term_counter.most_common(8)]
        label = " / ".join(top_terms[:3]) if top_terms else f"Cluster {cluster_id + 1}"

        centroid = centers[cluster_id] if cluster_id < len(centers) else np.mean(vectors[member_indexes], axis=0)
        distances = [(float(np.linalg.norm(vectors[index] - centroid)), index) for index in member_indexes]
        distances.sort(key=lambda item: item[0])
        representatives = []
        for _, index in distances[:3]:
            representatives.append(
                {
                    "note_id": notes[index]["id"],
                    "title": notes[index]["title"],
                    "source_file": notes[index]["source_file"],
                    "excerpt": make_excerpt(notes[index]["text"]),
                }
            )

        clusters.append(
            {
                "cluster_id": int(cluster_id),
                "label": label,
                "size": len(member_indexes),
                "top_terms": top_terms,
                "representative_notes": representatives,
            }
        )

    return [int(label) for label in labels], clusters


def semantic_edges(notes: list[dict[str, Any]], vectors: np.ndarray) -> list[dict[str, Any]]:
    if len(notes) < 2:
        return []
    similarities = cosine_similarity(vectors)
    candidates: list[dict[str, Any]] = []
    for i in range(len(notes)):
        for j in range(i + 1, len(notes)):
            score = float(similarities[i, j])
            if score >= 0.18:
                candidates.append(
                    {
                        "source": notes[i]["id"],
                        "target": notes[j]["id"],
                        "source_title": notes[i]["title"],
                        "target_title": notes[j]["title"],
                        "similarity": round(score, 4),
                    }
                )
    candidates.sort(key=lambda item: item["similarity"], reverse=True)
    return candidates[:80]


def theme_relationships(notes: list[dict[str, Any]], token_map: dict[str, list[str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    node_weights: Counter[str] = Counter()
    edge_weights: Counter[tuple[str, str]] = Counter()
    for note in notes:
        unique_terms = []
        seen = set()
        for token in token_map.get(note["id"], []):
            if token in seen:
                continue
            seen.add(token)
            unique_terms.append(token)
            if len(unique_terms) >= 10:
                break
        node_weights.update(unique_terms)
        for index, source in enumerate(unique_terms):
            for target in unique_terms[index + 1 :]:
                edge_weights[tuple(sorted((source, target)))] += 1

    nodes = [{"id": term, "label": term, "weight": weight} for term, weight in node_weights.most_common(60)]
    allowed = {node["id"] for node in nodes}
    edges = [
        {"source": source, "target": target, "weight": weight}
        for (source, target), weight in edge_weights.most_common(120)
        if source in allowed and target in allowed and weight >= 1
    ]
    return nodes, edges


def cluster_coordinates(vectors: np.ndarray) -> list[dict[str, float]]:
    if vectors.shape[0] == 0:
        return []
    if vectors.shape[0] == 1:
        return [{"x": 0.0, "y": 0.0}]
    components = min(2, vectors.shape[0], vectors.shape[1])
    if components == 1:
        projected = vectors[:, :1]
        return [{"x": float(value[0]), "y": 0.0} for value in projected]
    projected = PCA(n_components=2, random_state=42).fit_transform(vectors)
    return [{"x": float(row[0]), "y": float(row[1])} for row in projected]


def timeline(notes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: Counter[str] = Counter()
    for note in notes:
        timestamp = note.get("timestamp")
        if not timestamp:
            continue
        try:
            day = pd.to_datetime(timestamp).date().isoformat()
        except Exception:
            continue
        buckets[day] += 1
    return [{"date": date, "count": count} for date, count in sorted(buckets.items())]


def detect_patterns(notes: list[dict[str, Any]], token_map: dict[str, list[str]]) -> list[dict[str, Any]]:
    patterns = []
    for key, config in PATTERN_GROUPS.items():
        terms = config["terms"]
        matches = []
        for note in notes:
            note_tokens = set(token_map.get(note["id"], []))
            hit_terms = sorted(note_tokens & terms)
            if hit_terms:
                matches.append(
                    {
                        "note_id": note["id"],
                        "title": note["title"],
                        "terms": hit_terms,
                        "excerpt": make_excerpt(note["text"], 240),
                    }
                )
        if matches:
            patterns.append(
                {
                    "id": key,
                    "label": config["label"],
                    "count": len(matches),
                    "examples": matches[:4],
                }
            )
    return patterns


def maybe_ollama_cluster_insights(clusters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if os.environ.get("ANTIGONE_USE_OLLAMA", "").lower() not in {"1", "true", "yes"}:
        return []
    prompt = {
        "model": os.environ.get("ANTIGONE_OLLAMA_MODEL", "qwen2.5:3b"),
        "prompt": (
            "Create concise German-English insight labels for these voice-note clusters. "
            "Return plain text with one line per cluster.\n\n"
            + json.dumps(clusters, ensure_ascii=False)[:6000]
        ),
        "stream": False,
    }
    try:
        request = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=json.dumps(prompt).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return [{"source": "ollama", "text": payload.get("response", "").strip()}]
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as error:
        return [{"source": "ollama", "error": str(error)}]


def run_analysis(import_id: str | None = None, root: str | Path | None = None) -> dict[str, Any]:
    repo_root = Path(root).expanduser().resolve() if root else Path(__file__).resolve().parents[4]
    processed_root = repo_root / "data" / "processed"
    if import_id is None:
        latest_path = processed_root / "latest_import.txt"
        if not latest_path.exists():
            raise FileNotFoundError("No latest import found. Import a ZIP first.")
        import_id = latest_path.read_text(encoding="utf-8").strip()

    import_dir = processed_root / import_id
    notes_path = import_dir / "notes.json"
    manifest_path = import_dir / "manifest.json"
    if not notes_path.exists():
        raise FileNotFoundError(f"Missing notes for import {import_id}: {notes_path}")

    raw_notes = load_json(notes_path)
    notes = [{**note, "clean_text": clean_text(note["text"])} for note in raw_notes if clean_text(note.get("text", ""))]
    if not notes:
        raise ValueError(f"Import {import_id} contains no usable transcript text.")

    keywords, ngrams, token_map = keyword_counts(notes)
    texts = [note["clean_text"] for note in notes]
    vectors, feature_names, vector_method, vector_status = compute_semantic_vectors(texts)
    labels, clusters = cluster_notes(notes, vectors, token_map)
    coordinates = cluster_coordinates(vectors)

    enriched_notes = []
    for index, note in enumerate(notes):
        enriched_notes.append(
            {
                **note,
                "cluster_id": labels[index],
                "cluster_label": next((cluster["label"] for cluster in clusters if cluster["cluster_id"] == labels[index]), ""),
                "x": coordinates[index]["x"],
                "y": coordinates[index]["y"],
                "excerpt": make_excerpt(note["text"]),
            }
        )

    theme_nodes, theme_edges = theme_relationships(enriched_notes, token_map)
    note_edges = semantic_edges(enriched_notes, vectors)
    timeline_data = timeline(enriched_notes)
    patterns = detect_patterns(enriched_notes, token_map)
    ollama_insights = maybe_ollama_cluster_insights(clusters)

    bundle = {
        "import_id": import_id,
        "created_at": datetime.now().isoformat(),
        "manifest": load_json(manifest_path) if manifest_path.exists() else {},
        "summary": {
            "notes_count": len(enriched_notes),
            "clusters_count": len(clusters),
            "keywords_count": len(keywords),
            "theme_edges_count": len(theme_edges),
            "note_similarity_edges_count": len(note_edges),
            "vector_method": vector_method,
            "vector_status": vector_status,
            "feature_count": len(feature_names),
            "timeline_available": bool(timeline_data),
        },
        "notes": enriched_notes,
        "keywords": keywords,
        "ngrams": ngrams,
        "clusters": clusters,
        "note_similarity_edges": note_edges,
        "theme_nodes": theme_nodes,
        "theme_edges": theme_edges,
        "timeline": timeline_data,
        "patterns": patterns,
        "ollama_insights": ollama_insights,
    }

    analysis_path = import_dir / "analysis_bundle.json"
    write_json(analysis_path, bundle)
    pd.DataFrame(enriched_notes).to_csv(import_dir / "notes_with_clusters.csv", index=False)
    pd.DataFrame(keywords).to_csv(import_dir / "keywords.csv", index=False)
    pd.DataFrame(ngrams).to_csv(import_dir / "ngrams.csv", index=False)
    pd.DataFrame(clusters).to_csv(import_dir / "clusters.csv", index=False)
    pd.DataFrame(note_edges).to_csv(import_dir / "similarity_edges.csv", index=False)
    pd.DataFrame(theme_edges).to_csv(import_dir / "theme_edges.csv", index=False)
    pd.DataFrame(timeline_data).to_csv(import_dir / "timeline.csv", index=False)

    output_manifest = build_visual_outputs(bundle, repo_root)
    bundle["outputs"] = output_manifest
    write_json(analysis_path, bundle)
    write_json(repo_root / "outputs" / "analysis" / f"{import_id}_analysis_bundle.json", bundle)
    return bundle
