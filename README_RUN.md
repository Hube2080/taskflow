# Antigone Local Voice-Notes Dashboard

## What was built

This repo now includes a separate local-first Python/Streamlit sidecar for analyzing transcribed voice notes from ZIP archives. It does not replace or modify the existing TypeScript app or the legacy OpenAI-backed voice-memo path.

The canonical home of that Python runtime is now:

`apps/local-assistant/`

The MVP supports:

- ZIP import for `.txt`, `.md`, and `.csv` transcript files
- safe extraction into controlled local folders
- bilingual German/English tokenization and stopword handling
- keyword and n-gram analysis
- semantic clustering with a local Hugging Face embedding path when installed
- automatic fallback to scikit-learn TF-IDF/SVD vectors
- similarity edges, theme co-occurrence, representative excerpts, and simple pattern detection
- word cloud, theme graph, cluster view, CSV/JSON analysis artifacts, and a polished Streamlit dashboard
- local daily check-ins, medication tracking, state insights, and configurable voice/tone settings

## One short morning sequence

```bash
cd /Users/hubertusvonhaller/Documents/Playground/taskflow
./scripts/setup_analysis_app.sh
./scripts/run_analysis_dashboard.sh
```

Open the dashboard at:

```text
http://localhost:8501
```

## Optional Hugging Face embedding setup

The default setup is intentionally reliable and installs the core dashboard stack only. To add the optional local Hugging Face sentence-transformer path:

```bash
./scripts/setup_analysis_app.sh --with-ml
```

If the Hugging Face model is unavailable, the pipeline falls back to scikit-learn automatically.

Runtime note: on this machine the stable Python environment is linked from `.venv` to `/Users/hubertusvonhaller/.cache/antigone-taskflow-venv`. This avoids slow package reads from the Documents project folder while keeping the repo command path unchanged.

## Import a ZIP

From the dashboard:

- Use the sidebar ZIP uploader, or
- paste a local ZIP path into the sidebar, or
- click `Run demo import`.

From the terminal:

```bash
./scripts/import_transcripts.sh /path/to/transcribed_voice_notes.zip
```

Demo path:

```bash
./scripts/import_transcripts.sh --demo
```

## Data and output folders

Private/generated data is intentionally git-ignored.

```text
data/raw_transcripts/      copied original ZIPs by import id
data/unzipped_imports/     safely extracted ZIP contents by import id
data/processed/            manifests, normalized notes, CSVs, analysis bundles
outputs/wordclouds/        generated word cloud PNG files
outputs/graphs/            generated theme graph and cluster HTML/JSON files
outputs/analysis/          copied analysis bundle JSON files
data/checkins/             private JSONL daily check-in records
data/medications/          private JSONL medication records
data/settings/             private local interaction-style settings
```

## Check-ins, medication, and tone settings

The dashboard includes local-only tabs for:

- `Daily Check-In`: morning, midday, and evening entries for mood, energy, stress, focus, sleep, medication status, food, water, and notes
- `Medication`: medication name, dose, planned time, actual time, status, and notes
- `State Insights`: lightweight charts and guarded correlations such as mood vs sleep and focus vs water
- `Voice & Tone`: selectable response-style modes for future Antigone prompts and UI behavior

These records are private runtime data and are ignored by git.

## Useful commands

```bash
python3 --version
./scripts/check_status.sh
./scripts/setup_analysis_app.sh
./scripts/import_transcripts.sh --demo
./scripts/run_analysis_dashboard.sh
```

## Notes

- The Streamlit sidecar is the recommended morning path.
- The existing Node/TypeScript app remains in place.
- The Python runtime now lives canonically under `apps/local-assistant/`, with root wrappers left in place for compatibility.
- On this machine, the existing Node tarball works only when its `bin` directory is explicitly added to `PATH`; the Python dashboard does not depend on Node.
- Check-in and medication insights are for personal reflection only. They are not medical advice or clinical decision support.
