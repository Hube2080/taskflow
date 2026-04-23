# Next Steps

## Improve next

1. Import the real transcript ZIP and review the generated clusters, keywords, and graph in the Streamlit dashboard.
2. Install the optional Hugging Face embedding stack with `./scripts/setup_analysis_app.sh --with-ml` if the default TF-IDF/SVD clusters feel too shallow.
3. Tune the bilingual stopword list after seeing the real voice-note vocabulary.
4. Add a small "pin insight" flow so important excerpts can be collected into a morning review.
5. Add export buttons for selected clusters, supporting excerpts, and graph snapshots.
6. Use the check-in and medication tabs for several days before interpreting correlations.
7. Tune the voice/tone settings after seeing which mode feels most natural in real use.

## Productionize later

1. Add tests for ZIP traversal protection, CSV text-column inference, and analysis output shape.
2. Add configurable project profiles for different transcript collections.
3. Add a persistent lightweight database if imports grow beyond JSON/CSV comfort.
4. Add stable local model caching guidance for Hugging Face models on this Mac.
5. Decide whether this Streamlit sidecar should stay separate or become a route inside the existing React app.
6. Add editing/deletion flows for check-ins and medication events once the JSONL schema stabilizes.
7. Add backup/export controls for private state data before long-term use.

## Rough but acceptable for the overnight MVP

1. Cluster labels are deterministic keyword labels unless optional Ollama refinement is enabled.
2. The dashboard prioritizes inspection quality over complex editing workflows.
3. CSV inference is pragmatic and may need tuning for unusual exports.
4. Timeline support appears only when timestamps are available in filenames or CSV columns.
5. The current TypeScript Vitest run previously hung during planning; the Python sidecar is validated separately.
6. Check-in correlations intentionally use small, guarded heuristics and should not be treated as causal or clinical.
7. The voice/tone layer is a reusable configuration and guidance layer, not a full conversational engine yet.
