# Known Issues

## Blockers

- No real transcript ZIP was provided in the repo. The implementation includes a demo ZIP flow and supports user-supplied ZIP paths/uploads.
- Optional Hugging Face embeddings require installing `requirements-ml.txt`, which can be heavier than the core MVP setup.
- No real check-in or medication history exists yet unless entered through the dashboard.

## Limitations

- The default semantic path uses scikit-learn TF-IDF/SVD vectors unless `sentence-transformers` is installed and the model can load locally.
- Cluster labels are generated from top terms. They are useful for orientation but not yet editorially polished.
- CSV import infers likely text, title, and timestamp columns by column names and average text length.
- Unsupported file types are preserved in the extracted import folder but not analyzed.
- Word clouds are useful as a quick surface but should not be treated as the primary insight layer.
- Check-in and medication records are append-only JSONL for now; there is no edit/delete UI yet.
- Correlation charts need several days of data and variation before they become useful.
- The voice/tone settings are configuration guidance for future responses, not a live assistant runtime.

## Assumptions

- Input ZIP files contain already-transcribed text, not raw audio.
- The first local dashboard should be a Streamlit sidecar, not a full React integration.
- Private transcripts and generated outputs should remain local and ignored by git.
- Ollama is optional for this MVP. The pipeline must remain useful without LLM calls.
- Medication and state tracking are for private reflection only and are not medical advice.

## Existing repo note

- During planning, `pnpm test` started but did not return useful output before it was stopped. The Node app is not the critical path for this Streamlit MVP.
- `node` and `pnpm` are not globally available in the current shell PATH, but the local Node tarball under `/Users/hubertusvonhaller/Documents/Playground/node-v22.14.0-darwin-arm64/bin` is usable when explicitly added to `PATH`.
- A first Framework Python 3.12 `.venv` became extremely slow when reading package files from the Documents project folder. The current `.venv` is a symlink to `/Users/hubertusvonhaller/.cache/antigone-taskflow-venv`, which restored reliable Streamlit startup.
