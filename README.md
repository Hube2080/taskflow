# Antigone Night Run

This repository now serves two purposes during the Antigone transition:

- preserve and evolve the current Manus-led web app in `apps/web`
- document and support the new local-first Antigone stack built around Ollama, Open WebUI, and Home Assistant

This was intentionally handled as a conservative transition pass. No risky automation was added for the UTM Home Assistant VM, private Apple data, or personal cloud-storage paths.

## Working now

- Docker Desktop is reachable locally
- Ollama is reachable locally
- `qwen2.5:3b` is available in Ollama
- Open WebUI is running locally in Docker
- Open WebUI is exposed on `http://localhost:3000`
- this repo now contains helper scripts for status checks, startup, shutdown, and Ollama benchmarking

## Partially done

- Home Assistant exists in UTM but remains a manual setup path
- the Antigone web experience now lives in `apps/web` and uses the shared memory/contracts structure
- the older custom voice path is still present and intentionally not removed

## Legacy components

These areas belong to the older custom assistant approach and are preserved for compatibility and auditability:

- `apps/web/server/_core/voiceTranscription.ts`
- `apps/web/server/voiceMemos.*`
- `apps/web/shared/voiceMemos.ts`
- `apps/web/client/src/pages/VoiceMemosView.tsx`

Important: the current voice-memo configuration includes a default path into personal cloud storage. That path was not modified or automated in this run.

## Manual next steps

- Continue Home Assistant VM setup manually and validate networking before any automation
- Decide how Whisper and Piper should be introduced through Home Assistant
- Decide whether Open WebUI remains the main operator UI or becomes one panel within a broader Antigone frontend
- Review `NEXT_STEPS.md` for the morning action list

## Operator docs

- See [STATUS.md](/Users/hubertusvonhaller/Documents/Playground/taskflow/STATUS.md) for tonight's verified snapshot
- See [RUNBOOK.md](/Users/hubertusvonhaller/Documents/Playground/taskflow/RUNBOOK.md) for commands and failure handling
- See [NEXT_STEPS.md](/Users/hubertusvonhaller/Documents/Playground/taskflow/NEXT_STEPS.md) for the recommended follow-up sequence
- See [CHANGELOG_NIGHT_RUN.md](/Users/hubertusvonhaller/Documents/Playground/taskflow/CHANGELOG_NIGHT_RUN.md) for the concise morning summary
- See [MIGRATION_STATUS.md](/Users/hubertusvonhaller/Documents/Playground/taskflow/MIGRATION_STATUS.md) for the `apps/web` migration handoff
