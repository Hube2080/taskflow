from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


SUPPORTED_TEXT_EXTENSIONS = {".txt", ".md"}
SUPPORTED_TABLE_EXTENSIONS = {".csv"}
SUPPORTED_EXTENSIONS = SUPPORTED_TEXT_EXTENSIONS | SUPPORTED_TABLE_EXTENSIONS

DEMO_TRANSCRIPTS = {
    "2026-04-20-antigone-focus.txt": """Antigone note. I want a calmer local dashboard for voice notes. The core need is not another busy analytics tool. I need orientation, recurring themes, and a way to see which concerns keep returning.

The most important themes are local-first setup, clean handoff, privacy, and turning raw transcripts into useful decisions. A recurring tension is speed versus quality. A recurring goal is to wake up to something inspectable and reliable.
""",
    "2026-04-21-produktdenken.md": """# Produktdenken und Manus Stil

Die Oberflaeche soll ruhig, hochwertig und klar sein. Keine generische Data-Science-Aesthetik, keine ueberladenen Charts. Ich will starke Typografie, gute Abstaende, wenige aber aussagekraeftige Karten und eine klare Hierarchie.

Wichtig ist, dass Themen, Cluster und Belege direkt zusammen sichtbar werden. Aus den Notizen sollen Muster, Ziele, Spannungen und offene Fragen erkennbar werden.
""",
    "demo_notes.csv": """timestamp,title,transcript
2026-04-22 08:15,Local stack,"Docker, Ollama and Open WebUI are useful, but the voice-note analysis should not depend on a cloud account. The setup needs one reliable morning command."
2026-04-22 18:40,Research graph,"I want to see relationships between themes: privacy, local models, project planning, emotional load, decisions, and future work. The graph should help me find connections, not decorate the page."
""",
}

TEXT_COLUMN_HINTS = [
    "transcript",
    "transcription",
    "text",
    "content",
    "note",
    "notes",
    "memo",
    "body",
    "message",
    "description",
    "summary",
    "notiz",
    "notizen",
    "inhalt",
]

TITLE_COLUMN_HINTS = ["title", "name", "subject", "headline", "titel"]
TIMESTAMP_COLUMN_HINTS = [
    "timestamp",
    "datetime",
    "date",
    "created_at",
    "recorded_at",
    "time",
    "datum",
    "zeit",
    "erstellt",
]


@dataclass(frozen=True)
class RepoLayout:
    root: Path
    raw_dir: Path
    unzip_dir: Path
    processed_dir: Path


def resolve_repo_root(root: str | Path | None = None) -> Path:
    if root is not None:
        return Path(root).expanduser().resolve()
    return Path(__file__).resolve().parents[4]


def ensure_layout(root: str | Path | None = None) -> RepoLayout:
    repo_root = resolve_repo_root(root)
    layout = RepoLayout(
        root=repo_root,
        raw_dir=repo_root / "data" / "raw_transcripts",
        unzip_dir=repo_root / "data" / "unzipped_imports",
        processed_dir=repo_root / "data" / "processed",
    )
    for directory in [layout.raw_dir, layout.unzip_dir, layout.processed_dir]:
        directory.mkdir(parents=True, exist_ok=True)
    return layout


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_note_id(*parts: Any) -> str:
    digest = hashlib.sha1("::".join(str(part) for part in parts).encode("utf-8")).hexdigest()
    return f"note_{digest[:16]}"


def decode_text(raw: bytes) -> tuple[str, str]:
    for encoding in ["utf-8-sig", "utf-8", "utf-16", "cp1252", "latin-1"]:
        try:
            return raw.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace"), "utf-8-replace"


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_timestamp(value: Any) -> str | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None

    try:
        parsed = pd.to_datetime(raw, errors="raise", utc=False)
        if not pd.isna(parsed):
            return parsed.isoformat()
    except Exception:
        pass

    compact = re.search(r"(20\d{2})[-_ ]?(\d{2})[-_ ]?(\d{2})[ T_-]?(\d{2})?[:_ -]?(\d{2})?[:_ -]?(\d{2})?", raw)
    if not compact:
        return None

    year, month, day, hour, minute, second = compact.groups()
    try:
        parsed_dt = datetime(
            int(year),
            int(month),
            int(day),
            int(hour or 0),
            int(minute or 0),
            int(second or 0),
        )
        return parsed_dt.isoformat()
    except ValueError:
        return None


def choose_column(columns: list[str], hints: list[str]) -> str | None:
    normalized = {column.lower().strip(): column for column in columns}
    for hint in hints:
        if hint in normalized:
            return normalized[hint]
    for column in columns:
        column_key = column.lower().strip()
        if any(hint in column_key for hint in hints):
            return column
    return None


def choose_text_column(frame: pd.DataFrame) -> str | None:
    hinted = choose_column([str(column) for column in frame.columns], TEXT_COLUMN_HINTS)
    if hinted is not None:
        return hinted

    candidates: list[tuple[float, str]] = []
    for column in frame.columns:
        series = frame[column].dropna().astype(str)
        if series.empty:
            continue
        average_length = float(series.map(len).mean())
        if average_length >= 20:
            candidates.append((average_length, str(column)))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][1]


def read_csv_frame(path: Path) -> tuple[pd.DataFrame, str]:
    for encoding in ["utf-8-sig", "utf-8", "cp1252", "latin-1"]:
        try:
            frame = pd.read_csv(path, sep=None, engine="python", encoding=encoding)
            return frame, encoding
        except Exception:
            continue

    # Last-resort CSV parsing keeps the import useful for simple malformed files.
    text, encoding = decode_text(path.read_bytes())
    rows = list(csv.DictReader(text.splitlines()))
    return pd.DataFrame(rows), encoding


def safe_extract_zip(zip_path: Path, destination: Path) -> dict[str, Any]:
    destination.mkdir(parents=True, exist_ok=True)
    destination_resolved = destination.resolve()
    extracted: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []

    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            raw_name = member.filename
            if not raw_name or raw_name.endswith("/"):
                continue

            target = (destination / raw_name).resolve()
            if not target.is_relative_to(destination_resolved):
                skipped.append({"path": raw_name, "reason": "unsafe path outside import folder"})
                continue

            if target.exists():
                skipped.append({"path": raw_name, "reason": "duplicate path inside zip"})
                continue

            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source, target.open("xb") as output:
                shutil.copyfileobj(source, output)

            extracted.append(
                {
                    "path": raw_name,
                    "extracted_path": str(target),
                    "size_bytes": member.file_size,
                    "zip_timestamp": datetime(*member.date_time).isoformat(),
                }
            )

    return {"extracted": extracted, "skipped": skipped}


def note_from_text_file(path: Path, import_id: str, base_dir: Path) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    raw = path.read_bytes()
    text, encoding = decode_text(raw)
    normalized = normalize_text(text)
    rel_path = path.relative_to(base_dir).as_posix()
    file_hash = hashlib.sha256(raw).hexdigest()
    metadata = {
        "source_file": rel_path,
        "source_path": str(path),
        "source_type": "file",
        "file_hash": file_hash,
        "encoding": encoding,
        "extension": path.suffix.lower(),
        "timestamp": parse_timestamp(path.stem),
    }
    if not normalized:
        return None, {**metadata, "reason": "empty supported text file"}

    title = path.stem.replace("_", " ").replace("-", " ").strip() or path.name
    return (
        {
            "id": stable_note_id(import_id, rel_path, file_hash),
            "import_id": import_id,
            "title": title,
            "text": normalized,
            "source_file": rel_path,
            "source_type": "file",
            "row_index": None,
            "timestamp": metadata["timestamp"],
            "char_count": len(normalized),
            "word_count": len(re.findall(r"\b\w+\b", normalized, flags=re.UNICODE)),
            "metadata": metadata,
        },
        metadata,
    )


def notes_from_csv_file(path: Path, import_id: str, base_dir: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    frame, encoding = read_csv_frame(path)
    rel_path = path.relative_to(base_dir).as_posix()
    text_column = choose_text_column(frame)
    title_column = choose_column([str(column) for column in frame.columns], TITLE_COLUMN_HINTS)
    timestamp_column = choose_column([str(column) for column in frame.columns], TIMESTAMP_COLUMN_HINTS)
    file_hash = file_sha256(path)
    notes: list[dict[str, Any]] = []

    metadata = {
        "source_file": rel_path,
        "source_path": str(path),
        "source_type": "csv",
        "file_hash": file_hash,
        "encoding": encoding,
        "extension": ".csv",
        "rows": int(len(frame)),
        "columns": [str(column) for column in frame.columns],
        "text_column": text_column,
        "title_column": title_column,
        "timestamp_column": timestamp_column,
    }

    if text_column is None:
        return [], {**metadata, "reason": "no likely transcript/text column found"}

    for row_index, row in frame.iterrows():
        text = normalize_text("" if pd.isna(row[text_column]) else str(row[text_column]))
        if not text:
            continue
        title = None
        if title_column and not pd.isna(row[title_column]):
            title = str(row[title_column]).strip()
        timestamp = None
        if timestamp_column and not pd.isna(row[timestamp_column]):
            timestamp = parse_timestamp(row[timestamp_column])
        timestamp = timestamp or parse_timestamp(path.stem)

        notes.append(
            {
                "id": stable_note_id(import_id, rel_path, row_index, text[:120]),
                "import_id": import_id,
                "title": title or f"{path.stem} row {int(row_index) + 1}",
                "text": text,
                "source_file": rel_path,
                "source_type": "csv_row",
                "row_index": int(row_index),
                "timestamp": timestamp,
                "char_count": len(text),
                "word_count": len(re.findall(r"\b\w+\b", text, flags=re.UNICODE)),
                "metadata": {
                    **metadata,
                    "row_index": int(row_index),
                    "row": {
                        str(column): None if pd.isna(value) else str(value)
                        for column, value in row.items()
                    },
                },
            }
        )

    return notes, metadata


def discover_supported_notes(import_id: str, extracted_dir: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, str]]]:
    notes: list[dict[str, Any]] = []
    supported_files: list[dict[str, Any]] = []
    skipped_files: list[dict[str, str]] = []

    for path in sorted(extracted_dir.rglob("*")):
        if not path.is_file():
            continue
        rel_path = path.relative_to(extracted_dir).as_posix()
        extension = path.suffix.lower()
        if extension in SUPPORTED_TEXT_EXTENSIONS:
            note, metadata = note_from_text_file(path, import_id, extracted_dir)
            supported_files.append(metadata)
            if note is None:
                skipped_files.append({"path": rel_path, "reason": metadata.get("reason", "empty file")})
            else:
                notes.append(note)
        elif extension in SUPPORTED_TABLE_EXTENSIONS:
            csv_notes, metadata = notes_from_csv_file(path, import_id, extracted_dir)
            supported_files.append(metadata)
            if not csv_notes:
                skipped_files.append({"path": rel_path, "reason": metadata.get("reason", "no usable rows")})
            notes.extend(csv_notes)
        else:
            skipped_files.append({"path": rel_path, "reason": f"unsupported extension {extension or '[none]'}"})

    return notes, supported_files, skipped_files


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def import_transcripts_zip(zip_path: str | Path, root: str | Path | None = None) -> dict[str, Any]:
    source_zip = Path(zip_path).expanduser().resolve()
    if not source_zip.exists():
        raise FileNotFoundError(f"ZIP file not found: {source_zip}")
    if source_zip.suffix.lower() != ".zip":
        raise ValueError(f"Expected a .zip archive, got: {source_zip}")

    layout = ensure_layout(root)
    zip_hash = file_sha256(source_zip)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    import_id = f"{timestamp}-{zip_hash[:8]}"
    raw_import_dir = layout.raw_dir / import_id
    extracted_dir = layout.unzip_dir / import_id
    processed_dir = layout.processed_dir / import_id
    raw_import_dir.mkdir(parents=True, exist_ok=False)
    processed_dir.mkdir(parents=True, exist_ok=False)

    copied_zip = raw_import_dir / source_zip.name
    shutil.copy2(source_zip, copied_zip)

    extraction_report = safe_extract_zip(source_zip, extracted_dir)
    notes, supported_files, skipped_files = discover_supported_notes(import_id, extracted_dir)
    skipped_files.extend(extraction_report["skipped"])

    notes_path = processed_dir / "notes.json"
    manifest_path = processed_dir / "manifest.json"
    write_json(notes_path, notes)
    pd.DataFrame(notes).to_csv(processed_dir / "notes.csv", index=False)

    manifest = {
        "import_id": import_id,
        "imported_at": datetime.now().isoformat(),
        "source_zip": str(source_zip),
        "source_zip_copy": str(copied_zip),
        "source_zip_sha256": zip_hash,
        "raw_dir": str(raw_import_dir),
        "extracted_dir": str(extracted_dir),
        "processed_dir": str(processed_dir),
        "notes_path": str(notes_path),
        "notes_count": len(notes),
        "supported_files_count": len(supported_files),
        "skipped_files_count": len(skipped_files),
        "supported_extensions": sorted(SUPPORTED_EXTENSIONS),
        "extracted_files": extraction_report["extracted"],
        "supported_files": supported_files,
        "skipped_files": skipped_files,
    }
    write_json(manifest_path, manifest)
    (layout.processed_dir / "latest_import.txt").write_text(import_id, encoding="utf-8")
    return manifest


def create_demo_zip(root: str | Path | None = None) -> Path:
    repo_root = resolve_repo_root(root)
    runtime_dir = repo_root / ".antigone-runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    zip_path = runtime_dir / "demo_voice_notes.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in DEMO_TRANSCRIPTS.items():
            archive.writestr(name, content)

    return zip_path
