# Manus UI Refinement Prompt

You are refining the local Antigone voice-notes dashboard UI.

Context:

- The app is a local-first Streamlit dashboard in `/Users/hubertusvonhaller/Documents/Playground/taskflow/app/antigone_dashboard.py`.
- It analyzes ZIP archives of transcribed voice notes.
- It supports `.txt`, `.md`, and `.csv` transcripts.
- Outputs include word clouds, semantic clusters, top keywords, relationship graphs, notes explorer, and summary insights.
- The implementation is intentionally a working MVP, not a final product surface.

Design direction:

- Calm, premium, structured, and high-signal.
- Manus-inspired in spirit: restrained, polished, visually clear, with strong hierarchy and elegant spacing.
- Not playful, not cluttered, not a generic notebook, and not corporate boring.
- The UI should feel like a private research observatory for personal voice-note intelligence.

Refinement goals:

1. Improve information architecture across Overview, Import, Word Cloud, Themes, Clusters, Graph, Notes Explorer, and Summary.
2. Make theme and cluster cards feel more editorial and less table-like.
3. Improve drilldown behavior so excerpts, supporting notes, and relationships are easy to inspect.
4. Preserve local-first trust cues: source ZIP, import id, data folders, and generated artifacts should be visible but not noisy.
5. Keep visualizations restrained and purposeful; avoid decorative chart clutter.
6. Use refined typography, warm neutral backgrounds, subtle borders, and measured accent colors.
7. Keep the app practical for morning review: fast orientation first, depth second.

Please propose a stronger UI direction and return concrete Streamlit/CSS changes that keep the existing Python analysis pipeline intact.
