# Status

Snapshot date: 2026-04-14

## Overnight plan

- Safe autonomous tasks tonight:
  documentation alignment, conservative repo cleanup, helper-script validation, health checks, and Ollama benchmarking.
- Risky tasks for tomorrow:
  any Home Assistant VM automation, Whisper/Piper setup, legacy voice-path migration, or private-path changes.
- Explicitly deferred:
  final voice orchestration, larger frontend work, and repo reorganization of active in-progress files.

## Working

- Docker Desktop responds locally
- Ollama responds locally on `http://localhost:11434`
- Model `qwen2.5:3b` is present in Ollama
- Open WebUI container `open-webui` is running
- Open WebUI is reachable on `http://localhost:3000`
- Helper scripts exist under `scripts/`
- Helper scripts are shell-syntax clean
- `scripts/check_status.sh` passes against the current local stack
- `scripts/benchmark_ollama.sh` completed successfully in this run
- Minimal Antigone placeholder UI exists at `#/antigone`

## Partial

- Home Assistant in UTM has been started manually but is not automated from this repo
- The repo still contains an older custom voice-memo path based on OpenAI-style processing and local file import
- `taskflow` remains the host app while the long-term Antigone shape is still being clarified
- `PLANS.md` now defines the safe, risky, and deferred overnight buckets for this transition pass

## Blocked or Unverified

- Home Assistant VM networking, voice pipeline, and device orchestration are not validated from this repo
- Whisper and Piper are not yet wired into the new architecture
- No attempt was made to prove end-to-end voice orchestration through Home Assistant
- No attempt was made to replace the legacy voice-memo path with a new local path in this run

## Intentionally not automated

- Any change to iCloud or private Apple account data
- Any direct automation inside the UTM Home Assistant VM without step-by-step validation
- Any automatic use of the personal cloud-storage path currently referenced by `VOICE_MEMOS_DIR`
- Any broad system changes outside the verified local Docker and Ollama checks
- Any migration or relocation of active in-progress voice-related source files
