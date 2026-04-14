# Next Steps

## Morning-safe checks

1. Run `scripts/check_status.sh` and confirm the local stack still matches tonight's snapshot.
2. Run `scripts/benchmark_ollama.sh` and record one morning baseline for `qwen2.5:3b`.
3. Open Open WebUI on `http://localhost:3000` and confirm the Ollama connection still works through the UI.
4. Review the new `#/antigone` placeholder page and decide what the first real operator features should be.
5. Decide whether the legacy voice-memo workflow should remain read-only, be deprecated in the UI, or be hidden later.

## Manual-review items

1. Continue Home Assistant setup in the UTM VM manually and validate network access before any automation.
2. Choose the first Home Assistant voice path deliberately:
   either Whisper and Piper directly in Home Assistant, or another local STT/TTS path routed through it.
3. Validate how Home Assistant should talk to Ollama and which parts belong in Home Assistant versus Open WebUI.
4. Revisit the current `VOICE_MEMOS_DIR` default before any future cleanup, because it points at personal cloud storage.
5. Only automate VM-related steps after each manual command is proven safe and reversible.

## Explicitly deferred

1. Replacing the legacy voice-memo pipeline with a new local-first path.
2. Building a larger Antigone frontend beyond the current placeholder route.
3. Reorganizing active in-progress source files into new directories.
4. Introducing any new dependencies or system-wide services.

## Morning reading order

1. `PLANS.md`
2. `STATUS.md`
3. `CHANGELOG_NIGHT_RUN.md`
4. `RUNBOOK.md`
5. `NEXT_STEPS.md`
