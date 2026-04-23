from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import streamlit.components.v1 as components

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.analysis import run_analysis  # noqa: E402
from src.interaction import STYLE_MODES, load_style_config, save_style_config  # noqa: E402
from src.ingest import create_demo_zip, import_transcripts_zip  # noqa: E402
from src.state import add_checkin, add_medication_event, checkin_summary, list_checkins, list_medication_events, medication_summary  # noqa: E402
from src.state.insights import correlation_summary, low_mood_note_patterns  # noqa: E402


st.set_page_config(
    page_title="Antigone Notes Observatory",
    page_icon="A",
    layout="wide",
    initial_sidebar_state="expanded",
)


CSS = """
<style>
:root {
  --antigone-bg: #f6f1e8;
  --antigone-panel: rgba(255, 252, 246, 0.86);
  --antigone-panel-strong: #fffcf6;
  --antigone-ink: #24221d;
  --antigone-muted: #756f64;
  --antigone-line: rgba(84, 72, 54, 0.18);
  --antigone-accent: #2f5f55;
  --antigone-accent-soft: #dce8df;
  --antigone-gold: #9b7542;
}

html, body, [class*="css"] {
  font-family: "Avenir Next", "Helvetica Neue", sans-serif;
}

.stApp {
  color: var(--antigone-ink);
  background:
    radial-gradient(circle at 12% 0%, rgba(219, 200, 166, 0.36), transparent 32rem),
    radial-gradient(circle at 86% 4%, rgba(176, 199, 190, 0.36), transparent 28rem),
    linear-gradient(135deg, #f8f3ea 0%, #efe7da 100%);
}

.block-container {
  padding-top: 2.2rem;
  padding-bottom: 4rem;
  max-width: 1480px;
}

h1, h2, h3 {
  font-family: "Iowan Old Style", "Georgia", serif;
  letter-spacing: -0.025em;
}

[data-testid="stSidebar"] {
  background: rgba(255, 252, 246, 0.72);
  border-right: 1px solid var(--antigone-line);
}

.hero {
  border: 1px solid var(--antigone-line);
  border-radius: 34px;
  padding: 34px 38px;
  background:
    linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(238, 230, 216, 0.82)),
    radial-gradient(circle at 90% 0%, rgba(47, 95, 85, 0.12), transparent 26rem);
  box-shadow: 0 28px 80px rgba(72, 58, 39, 0.11);
}

.eyebrow {
  color: var(--antigone-accent);
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0.55rem 0 0.35rem;
  font-size: clamp(2.3rem, 4vw, 4.6rem);
  line-height: 0.96;
}

.hero p {
  max-width: 860px;
  color: var(--antigone-muted);
  font-size: 1.02rem;
  line-height: 1.75;
}

.soft-card {
  border: 1px solid var(--antigone-line);
  border-radius: 24px;
  padding: 22px;
  background: var(--antigone-panel);
  box-shadow: 0 18px 48px rgba(72, 58, 39, 0.08);
}

.metric-card {
  border: 1px solid var(--antigone-line);
  border-radius: 22px;
  padding: 18px 20px;
  background: rgba(255, 252, 246, 0.78);
}

.metric-label {
  color: var(--antigone-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.metric-value {
  margin-top: 0.25rem;
  font-family: "Iowan Old Style", "Georgia", serif;
  font-size: 2.15rem;
  font-weight: 700;
}

.cluster-card {
  border-left: 4px solid var(--antigone-accent);
  border-radius: 18px;
  padding: 18px 18px 14px;
  background: rgba(255, 252, 246, 0.78);
  margin-bottom: 14px;
}

.small-muted {
  color: var(--antigone-muted);
  font-size: 0.9rem;
}

.state-card {
  border: 1px solid var(--antigone-line);
  border-radius: 22px;
  padding: 18px 20px;
  background: rgba(255, 252, 246, 0.74);
  margin-bottom: 14px;
}

.state-card strong {
  color: var(--antigone-accent);
}

.tone-chip {
  display: inline-block;
  border: 1px solid rgba(47, 95, 85, 0.18);
  border-radius: 999px;
  padding: 6px 10px;
  margin: 0 6px 6px 0;
  background: rgba(220, 232, 223, 0.5);
  color: #294f47;
  font-size: 0.84rem;
}

.stTabs [data-baseweb="tab-list"] {
  gap: 8px;
}

.stTabs [data-baseweb="tab"] {
  border: 1px solid var(--antigone-line);
  border-radius: 999px;
  padding: 8px 16px;
  background: rgba(255, 252, 246, 0.62);
}
</style>
"""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def processed_root() -> Path:
    path = ROOT / "data" / "processed"
    path.mkdir(parents=True, exist_ok=True)
    return path


def list_imports() -> list[dict[str, Any]]:
    manifests: list[dict[str, Any]] = []
    for manifest_path in processed_root().glob("*/manifest.json"):
        try:
            manifests.append(load_json(manifest_path))
        except Exception:
            continue
    manifests.sort(key=lambda item: item.get("imported_at", ""), reverse=True)
    return manifests


def latest_import_id() -> str | None:
    latest_path = processed_root() / "latest_import.txt"
    if latest_path.exists():
        value = latest_path.read_text(encoding="utf-8").strip()
        if value:
            return value
    imports = list_imports()
    return imports[0]["import_id"] if imports else None


def load_bundle(import_id: str) -> dict[str, Any] | None:
    bundle_path = processed_root() / import_id / "analysis_bundle.json"
    if not bundle_path.exists():
        return None
    return load_json(bundle_path)


def save_uploaded_zip(uploaded_file: Any) -> Path:
    upload_dir = ROOT / ".antigone-runtime" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", uploaded_file.name or "transcripts.zip")
    target = upload_dir / f"{datetime.now().strftime('%Y%m%d-%H%M%S')}_{safe_name}"
    target.write_bytes(uploaded_file.getbuffer())
    return target


def import_and_analyze(zip_path: Path) -> dict[str, Any]:
    manifest = import_transcripts_zip(zip_path, ROOT)
    return run_analysis(manifest["import_id"], ROOT)


def metric_card(label: str, value: Any) -> None:
    st.markdown(
        f"""
        <div class="metric-card">
          <div class="metric-label">{label}</div>
          <div class="metric-value">{value}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_header(bundle: dict[str, Any] | None) -> None:
    summary_text = "Import a ZIP or run the demo to create the first local semantic map."
    if bundle:
        summary = bundle.get("summary", {})
        summary_text = (
            f"{summary.get('notes_count', 0)} notes mapped into "
            f"{summary.get('clusters_count', 0)} semantic clusters with "
            f"{summary.get('theme_edges_count', 0)} theme relationships."
        )
    st.markdown(
        f"""
        <div class="hero">
          <div class="eyebrow">Local-first voice-note intelligence</div>
          <h1>Antigone Notes Observatory</h1>
          <p>{summary_text} Built for calm morning inspection: themes, relationships, excerpts and artifacts stay local on this Mac.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_import_controls() -> None:
    st.sidebar.markdown("### Import")
    uploaded = st.sidebar.file_uploader("Upload transcript ZIP", type=["zip"])
    if st.sidebar.button("Import uploaded ZIP", disabled=uploaded is None, use_container_width=True):
        try:
            with st.spinner("Importing and analyzing uploaded ZIP..."):
                zip_path = save_uploaded_zip(uploaded)
                bundle = import_and_analyze(zip_path)
            st.sidebar.success(f"Imported {bundle['summary']['notes_count']} notes.")
            st.rerun()
        except Exception as error:
            st.sidebar.error(str(error))

    zip_path_text = st.sidebar.text_input("Or local ZIP path", placeholder="/path/to/transcripts.zip")
    if st.sidebar.button("Import local path", disabled=not zip_path_text.strip(), use_container_width=True):
        try:
            with st.spinner("Importing and analyzing local ZIP..."):
                bundle = import_and_analyze(Path(zip_path_text).expanduser())
            st.sidebar.success(f"Imported {bundle['summary']['notes_count']} notes.")
            st.rerun()
        except Exception as error:
            st.sidebar.error(str(error))

    if st.sidebar.button("Run demo import", use_container_width=True):
        try:
            with st.spinner("Creating demo ZIP and running analysis..."):
                demo_zip = create_demo_zip(ROOT)
                bundle = import_and_analyze(demo_zip)
            st.sidebar.success(f"Demo imported: {bundle['summary']['notes_count']} notes.")
            st.rerun()
        except Exception as error:
            st.sidebar.error(str(error))


def select_import() -> str | None:
    imports = list_imports()
    if not imports:
        return None
    latest = latest_import_id()
    import_ids = [item["import_id"] for item in imports]
    default_index = import_ids.index(latest) if latest in import_ids else 0
    return st.sidebar.selectbox("Analysis run", import_ids, index=default_index)


def render_overview(bundle: dict[str, Any]) -> None:
    summary = bundle["summary"]
    cols = st.columns(5)
    with cols[0]:
        metric_card("Notes", summary["notes_count"])
    with cols[1]:
        metric_card("Clusters", summary["clusters_count"])
    with cols[2]:
        metric_card("Keywords", summary["keywords_count"])
    with cols[3]:
        metric_card("Theme edges", summary["theme_edges_count"])
    with cols[4]:
        metric_card("Vectors", summary["vector_method"])

    st.markdown("### High-signal clusters")
    cluster_cols = st.columns(2)
    for index, cluster in enumerate(bundle.get("clusters", [])[:6]):
        with cluster_cols[index % 2]:
            st.markdown(
                f"""
                <div class="cluster-card">
                  <strong>{cluster['label']}</strong>
                  <div class="small-muted">{cluster['size']} notes | {', '.join(cluster.get('top_terms', [])[:6])}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    patterns = bundle.get("patterns", [])
    if patterns:
        st.markdown("### Recurring patterns")
        for pattern in patterns:
            with st.expander(f"{pattern['label']} ({pattern['count']})", expanded=False):
                for example in pattern.get("examples", []):
                    st.markdown(f"**{example['title']}**")
                    st.caption(", ".join(example.get("terms", [])))
                    st.write(example["excerpt"])


def render_import_status(bundle: dict[str, Any]) -> None:
    manifest = bundle.get("manifest", {})
    st.markdown("### Import / Data Status")
    st.write(
        {
            "import_id": manifest.get("import_id"),
            "source_zip_copy": manifest.get("source_zip_copy"),
            "notes_count": manifest.get("notes_count"),
            "supported_files": manifest.get("supported_files_count"),
            "skipped_files": manifest.get("skipped_files_count"),
            "processed_dir": manifest.get("processed_dir"),
        }
    )
    skipped = manifest.get("skipped_files", [])
    if skipped:
        st.markdown("#### Unsupported or skipped files")
        st.dataframe(pd.DataFrame(skipped), use_container_width=True, hide_index=True)
    else:
        st.success("No unsupported files were reported for this import.")


def render_wordcloud(bundle: dict[str, Any]) -> None:
    outputs = bundle.get("outputs", {})
    wordcloud_path = outputs.get("wordcloud_png")
    col_a, col_b = st.columns([1.05, 0.95], gap="large")
    with col_a:
        st.markdown("### Word Cloud")
        if wordcloud_path and Path(wordcloud_path).exists():
            st.image(wordcloud_path, use_container_width=True)
        else:
            st.info("No wordcloud artifact available yet.")
    with col_b:
        st.markdown("### Top Keywords")
        frame = pd.DataFrame(bundle.get("keywords", [])[:24])
        if not frame.empty:
            fig = px.bar(frame, x="count", y="term", orientation="h", color="count", color_continuous_scale="YlGn")
            fig.update_layout(height=640, yaxis={"categoryorder": "total ascending"}, paper_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig, use_container_width=True)


def render_themes(bundle: dict[str, Any]) -> None:
    st.markdown("### Themes")
    keywords = pd.DataFrame(bundle.get("keywords", [])[:40])
    ngrams = pd.DataFrame(bundle.get("ngrams", [])[:40])
    col_a, col_b = st.columns(2, gap="large")
    with col_a:
        st.markdown("#### Keywords")
        st.dataframe(keywords, use_container_width=True, hide_index=True)
    with col_b:
        st.markdown("#### Phrases")
        st.dataframe(ngrams, use_container_width=True, hide_index=True)

    st.markdown("#### Theme relationship edges")
    edges = pd.DataFrame(bundle.get("theme_edges", [])[:80])
    if edges.empty:
        st.info("No theme relationship edges were found.")
    else:
        st.dataframe(edges, use_container_width=True, hide_index=True)


def render_clusters(bundle: dict[str, Any]) -> None:
    st.markdown("### Semantic Cluster View")
    notes = pd.DataFrame(bundle.get("notes", []))
    if notes.empty:
        st.info("No notes available.")
        return
    fig = px.scatter(
        notes,
        x="x",
        y="y",
        color="cluster_label",
        hover_data=["title", "source_file", "excerpt"],
        text="title",
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_traces(textposition="top center", marker={"size": 15, "line": {"width": 1, "color": "#34423c"}})
    fig.update_layout(height=620, xaxis_visible=False, yaxis_visible=False, paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, use_container_width=True)

    clusters = bundle.get("clusters", [])
    labels = [f"{cluster['cluster_id']}: {cluster['label']}" for cluster in clusters]
    selected = st.selectbox("Inspect cluster", labels)
    selected_id = int(selected.split(":", 1)[0])
    cluster = next(cluster for cluster in clusters if cluster["cluster_id"] == selected_id)
    st.markdown(f"#### {cluster['label']}")
    st.caption(f"{cluster['size']} notes | top terms: {', '.join(cluster.get('top_terms', [])[:10])}")
    for item in cluster.get("representative_notes", []):
        with st.expander(item["title"], expanded=True):
            st.caption(item["source_file"])
            st.write(item["excerpt"])


def render_connections(bundle: dict[str, Any]) -> None:
    st.markdown("### Connections / Graph")
    outputs = bundle.get("outputs", {})
    html_path = outputs.get("theme_graph_html")
    if html_path and Path(html_path).exists():
        components.html(Path(html_path).read_text(encoding="utf-8"), height=720, scrolling=True)
    else:
        st.info("No graph HTML artifact available.")

    note_edges = pd.DataFrame(bundle.get("note_similarity_edges", [])[:80])
    st.markdown("#### Similar notes")
    if note_edges.empty:
        st.info("No note similarity edges available.")
    else:
        st.dataframe(note_edges, use_container_width=True, hide_index=True)


def render_notes_explorer(bundle: dict[str, Any]) -> None:
    st.markdown("### Notes Explorer")
    notes = pd.DataFrame(bundle.get("notes", []))
    if notes.empty:
        st.info("No notes available.")
        return

    col_a, col_b = st.columns([0.62, 0.38])
    with col_a:
        query = st.text_input("Search notes", placeholder="theme, person, concern, goal...")
    with col_b:
        cluster_labels = ["All clusters"] + sorted(notes["cluster_label"].dropna().unique().tolist())
        cluster_filter = st.selectbox("Cluster", cluster_labels)

    filtered = notes.copy()
    if query:
        query_lower = query.lower()
        filtered = filtered[
            filtered["title"].str.lower().str.contains(query_lower, na=False)
            | filtered["text"].str.lower().str.contains(query_lower, na=False)
            | filtered["source_file"].str.lower().str.contains(query_lower, na=False)
        ]
    if cluster_filter != "All clusters":
        filtered = filtered[filtered["cluster_label"] == cluster_filter]

    st.caption(f"{len(filtered)} notes shown")
    for _, note in filtered.head(50).iterrows():
        with st.expander(f"{note['title']} | {note['cluster_label']}", expanded=False):
            st.caption(f"{note['source_file']} | words: {note['word_count']} | timestamp: {note.get('timestamp') or 'none'}")
            st.write(note["text"])


def render_summary(bundle: dict[str, Any]) -> None:
    st.markdown("### Summary / Insights")
    summary = bundle["summary"]
    st.write(
        f"This run used **{summary['vector_method']}** for semantic grouping. "
        f"Hugging Face status: `{summary.get('vector_status')}`. "
        f"Timeline detected: `{summary.get('timeline_available')}`."
    )

    if bundle.get("timeline"):
        timeline_frame = pd.DataFrame(bundle["timeline"])
        fig = px.line(timeline_frame, x="date", y="count", markers=True)
        fig.update_layout(height=320, paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)

    ollama = bundle.get("ollama_insights", [])
    if ollama:
        st.markdown("#### Optional Ollama notes")
        for item in ollama:
            if "text" in item and item["text"]:
                st.write(item["text"])
            elif "error" in item:
                st.caption(f"Ollama insight skipped: {item['error']}")

    st.markdown("#### Output locations")
    st.json(bundle.get("outputs", {}), expanded=False)


def recent_frame(records: list[dict[str, Any]]) -> pd.DataFrame:
    frame = pd.DataFrame(records)
    if frame.empty:
        return frame
    preferred = [
        "date",
        "slot",
        "mood",
        "energy",
        "stress",
        "focus",
        "sleep_quality",
        "medication_status",
        "water_intake",
        "food_eaten",
        "medication_name",
        "dose",
        "planned_time",
        "actual_time",
        "status",
        "notes",
        "created_at",
    ]
    columns = [column for column in preferred if column in frame.columns]
    return frame[columns]


def render_daily_checkin() -> None:
    st.markdown("### Daily Check-In")
    st.caption("Private local tracking only. This is a reflection layer, not clinical advice.")
    summary = checkin_summary(ROOT)
    cols = st.columns(4)
    with cols[0]:
        metric_card("Total check-ins", summary["total"])
    with cols[1]:
        metric_card("Today", summary["today_count"])
    with cols[2]:
        metric_card("Slots today", len(summary["today_slots"]))
    with cols[3]:
        latest_slot = summary["latest"]["slot"] if summary.get("latest") else "none"
        metric_card("Latest", latest_slot)

    slot_labels = {
        "morning": "Morning check-in",
        "midday": "Midday meds + food + water",
        "evening": "Evening reflection / debrief",
    }
    tabs = st.tabs([slot_labels["morning"], slot_labels["midday"], slot_labels["evening"]])
    for tab, slot in zip(tabs, ["morning", "midday", "evening"]):
        with tab:
            with st.form(f"checkin_{slot}"):
                checkin_date = st.date_input("Date", value=date.today(), key=f"checkin_date_{slot}")
                col_a, col_b, col_c = st.columns(3)
                with col_a:
                    mood = st.slider("Mood", 1, 5, 3, key=f"mood_{slot}")
                    energy = st.slider("Energy", 1, 5, 3, key=f"energy_{slot}")
                with col_b:
                    stress = st.slider("Stress", 1, 5, 3, key=f"stress_{slot}")
                    focus = st.slider("Focus", 1, 5, 3, key=f"focus_{slot}")
                with col_c:
                    sleep_quality = st.slider("Sleep quality", 1, 5, 3, key=f"sleep_{slot}")
                    medication_status = st.selectbox(
                        "Medication",
                        ["not_logged", "taken", "skipped", "delayed"],
                        key=f"med_status_{slot}",
                    )
                food_eaten = st.text_input("Food eaten", placeholder="Short note, e.g. breakfast, soup, protein bar", key=f"food_{slot}")
                water_intake = st.number_input("Water intake (glasses)", min_value=0.0, max_value=30.0, value=0.0, step=0.5, key=f"water_{slot}")
                notes = st.text_area("Notes", placeholder="What feels relevant? Keep it brief if energy is low.", key=f"notes_{slot}")
                submitted = st.form_submit_button(f"Save {slot_labels[slot]}", use_container_width=True)
                if submitted:
                    add_checkin(
                        slot=slot,
                        mood=mood,
                        energy=energy,
                        stress=stress,
                        focus=focus,
                        sleep_quality=sleep_quality,
                        medication_status=medication_status,
                        food_eaten=food_eaten,
                        water_intake=water_intake,
                        notes=notes,
                        checkin_date=checkin_date.isoformat(),
                        root=ROOT,
                    )
                    st.success("Check-in saved locally.")
                    st.rerun()

    records = list_checkins(ROOT, limit=60)
    st.markdown("#### Recent check-ins")
    if records:
        st.dataframe(recent_frame(records), use_container_width=True, hide_index=True)
    else:
        st.info("No check-ins yet. Start with any one slot; the system does not require a perfect day.")


def render_medication_tracker() -> None:
    st.markdown("### Medication Tracker")
    st.caption("A lightweight private log for planned and actual medication events.")
    summary = medication_summary(ROOT)
    cols = st.columns(4)
    with cols[0]:
        metric_card("Total events", summary["total"])
    with cols[1]:
        metric_card("Today", summary["today_count"])
    with cols[2]:
        adherence = summary["adherence_average"]
        metric_card("Adherence", f"{adherence:.2f}" if adherence is not None else "n/a")
    with cols[3]:
        skipped = summary["status_counts"].get("skipped", 0)
        metric_card("Skipped", skipped)

    with st.form("medication_event"):
        event_date = st.date_input("Date", value=date.today(), key="med_date")
        col_a, col_b = st.columns(2)
        with col_a:
            medication_name = st.text_input("Medication name", placeholder="Name")
            dose = st.text_input("Dose", placeholder="e.g. 10 mg")
            planned_time = st.text_input("Planned time", placeholder="08:00")
        with col_b:
            actual_time = st.text_input("Actual time taken", placeholder="08:20, blank if skipped")
            status = st.selectbox("Status", ["taken", "skipped", "delayed"])
            notes = st.text_area("Optional notes", placeholder="Context, side effects, or reason for delay/skipping")
        submitted = st.form_submit_button("Save medication event", use_container_width=True)
        if submitted:
            if not medication_name.strip():
                st.error("Medication name is required.")
            else:
                add_medication_event(
                    medication_name=medication_name,
                    dose=dose,
                    planned_time=planned_time,
                    actual_time=actual_time,
                    status=status,
                    notes=notes,
                    event_date=event_date.isoformat(),
                    root=ROOT,
                )
                st.success("Medication event saved locally.")
                st.rerun()

    records = list_medication_events(ROOT, limit=80)
    st.markdown("#### Recent medication events")
    if records:
        st.dataframe(recent_frame(records), use_container_width=True, hide_index=True)
    else:
        st.info("No medication events yet.")


def render_state_insights(bundle: dict[str, Any] | None) -> None:
    st.markdown("### State Insights")
    st.caption("These are lightweight correlations for reflection. They are not causal claims or medical guidance.")
    checkins = list_checkins(ROOT)
    meds = list_medication_events(ROOT)
    insights = correlation_summary(checkins, meds)

    daily_checkins = pd.DataFrame(insights.get("daily_checkins", []))
    daily_meds = pd.DataFrame(insights.get("daily_medications", []))
    if daily_checkins.empty:
        st.info("Not enough check-in data yet. A few days of entries will unlock the charts.")
    else:
        col_a, col_b = st.columns(2, gap="large")
        with col_a:
            if {"sleep_quality", "mood"}.issubset(daily_checkins.columns):
                fig = px.scatter(daily_checkins, x="sleep_quality", y="mood", text="date", trendline=None)
                fig.update_layout(height=360, paper_bgcolor="rgba(0,0,0,0)")
                st.plotly_chart(fig, use_container_width=True)
        with col_b:
            if {"water_intake", "focus"}.issubset(daily_checkins.columns):
                fig = px.scatter(daily_checkins, x="water_intake", y="focus", text="date", trendline=None)
                fig.update_layout(height=360, paper_bgcolor="rgba(0,0,0,0)")
                st.plotly_chart(fig, use_container_width=True)

        if "food_logged" in daily_checkins.columns and "focus" in daily_checkins.columns:
            food_frame = daily_checkins.copy()
            food_frame["food_status"] = food_frame["food_logged"].map(lambda value: "food logged" if value else "no food logged")
            fig = px.box(food_frame, x="food_status", y="focus", points="all")
            fig.update_layout(height=320, paper_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig, use_container_width=True)

    mood_medication = pd.DataFrame(insights.get("mood_medication_frame", []))
    if not mood_medication.empty:
        fig = px.scatter(mood_medication, x="adherence_score", y="mood", text="date", size="medication_events")
        fig.update_layout(height=360, paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)
    elif daily_meds.empty:
        st.info("Medication adherence correlations will appear after medication events and check-ins share dates.")

    st.markdown("#### Correlation guardrails")
    correlations = insights.get("correlations", [])
    if correlations:
        for item in correlations:
            value = item.get("correlation")
            if value is None:
                st.markdown(f"- **{item['label']}**: not enough variation yet (`n={item['n']}`).")
            else:
                st.markdown(f"- **{item['label']}**: correlation `{value}` across `{item['n']}` daily points.")
    else:
        st.markdown("- Not enough data yet for correlation summaries.")

    patterns = low_mood_note_patterns(checkins, bundle)
    st.markdown("#### Low-mood / overload / shame pattern overlay")
    if patterns["low_mood_dates"]:
        st.caption(f"Low-mood dates: {', '.join(patterns['low_mood_dates'][:10])}")
    if patterns["terms"]:
        st.dataframe(pd.DataFrame(patterns["terms"]), use_container_width=True, hide_index=True)
    if patterns["matches"]:
        for match in patterns["matches"][:8]:
            with st.expander(match["title"] or match["source_file"], expanded=False):
                st.caption(
                    f"{match.get('source_file')} | terms: {', '.join(match.get('matched_terms') or []) or 'date adjacency'}"
                )
                st.write(match["excerpt"])
    else:
        st.info("No low-mood, overload, shame, or stress note patterns found yet.")


def render_voice_and_tone_settings() -> None:
    st.markdown("### Voice & Tone Settings")
    config = load_style_config(ROOT)
    modes = list(STYLE_MODES.keys())
    selected_index = modes.index(config["selected_mode"]) if config["selected_mode"] in modes else 0
    selected_mode = st.selectbox("Default response style", modes, index=selected_index)
    custom_notes = st.text_area(
        "Local custom notes for future Antigone prompts",
        value=config.get("custom_notes", ""),
        placeholder="E.g. keep suggestions small when stress is high; avoid pep-talk language.",
    )
    if st.button("Save voice/tone settings", use_container_width=True):
        config = save_style_config(selected_mode, custom_notes, ROOT)
        st.success("Voice/tone settings saved locally.")

    mode = STYLE_MODES[selected_mode]
    st.markdown(
        f"""
        <div class="state-card">
          <strong>{selected_mode}</strong>
          <div class="small-muted">{mode['description']}</div>
          <p>{mode['best_for']}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    col_a, col_b = st.columns(2, gap="large")
    with col_a:
        st.markdown("#### Prefer")
        st.markdown("".join(f"<span class='tone-chip'>{item}</span>" for item in mode["prefer"]), unsafe_allow_html=True)
    with col_b:
        st.markdown("#### Avoid")
        st.markdown("".join(f"<span class='tone-chip'>{item}</span>" for item in mode["avoid"]), unsafe_allow_html=True)

    st.markdown("#### Reusable prompt guidance")
    st.code(mode["prompt_guidance"], language="text")


def main() -> None:
    st.markdown(CSS, unsafe_allow_html=True)
    render_import_controls()
    selected_import = select_import()
    bundle = load_bundle(selected_import) if selected_import else None
    render_header(bundle)

    tabs = st.tabs(
        [
            "Overview",
            "Daily Check-In",
            "Medication",
            "State Insights",
            "Import / Data Status",
            "Word Cloud",
            "Themes",
            "Clusters",
            "Connections / Graph",
            "Notes Explorer",
            "Voice & Tone",
            "Summary / Insights",
        ]
    )
    with tabs[0]:
        if bundle:
            render_overview(bundle)
        else:
            st.info("No analysis bundle exists yet. Use the sidebar to import your ZIP or run the demo import.")
    with tabs[1]:
        render_daily_checkin()
    with tabs[2]:
        render_medication_tracker()
    with tabs[3]:
        render_state_insights(bundle)
    with tabs[4]:
        if bundle:
            render_import_status(bundle)
        else:
            st.info("Import status will appear after a transcript ZIP is imported.")
    with tabs[5]:
        if bundle:
            render_wordcloud(bundle)
        else:
            st.info("Word cloud output will appear after a transcript ZIP is imported.")
    with tabs[6]:
        if bundle:
            render_themes(bundle)
        else:
            st.info("Theme analysis will appear after a transcript ZIP is imported.")
    with tabs[7]:
        if bundle:
            render_clusters(bundle)
        else:
            st.info("Cluster analysis will appear after a transcript ZIP is imported.")
    with tabs[8]:
        if bundle:
            render_connections(bundle)
        else:
            st.info("Connection graph will appear after a transcript ZIP is imported.")
    with tabs[9]:
        if bundle:
            render_notes_explorer(bundle)
        else:
            st.info("Notes explorer will appear after a transcript ZIP is imported.")
    with tabs[10]:
        render_voice_and_tone_settings()
    with tabs[11]:
        if bundle:
            render_summary(bundle)
        else:
            st.info("Transcript summary will appear after a transcript ZIP is imported.")


if __name__ == "__main__":
    main()
