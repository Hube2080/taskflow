# Antigone Overnight Automation Plan

Date: 2026-04-14

## Goals for the night

- Leave the repo easier to operate tomorrow morning without changing the overall architecture tonight.
- Keep the legacy custom voice path available but clearly separated from the new Antigone direction.
- Validate the local helper scripts and record the actual machine state in concise documentation.
- Leave Docker, Ollama, Open WebUI, and `qwen2.5:3b` in a working morning-ready state.

## Safe tasks to execute autonomously tonight

- Align `PLANS.md`, `STATUS.md`, `NEXT_STEPS.md`, and `CHANGELOG_NIGHT_RUN.md`.
- Keep the current custom voice path in place and reinforce its legacy status in docs only.
- Confirm helper scripts are present, executable, and still conservative:
  - `scripts/check_status.sh`
  - `scripts/start_services.sh`
  - `scripts/stop_services.sh`
  - `scripts/benchmark_ollama.sh`
- Run repo-local checks against the confirmed local stack:
  - `./scripts/check_status.sh`
  - `./scripts/benchmark_ollama.sh`
- Make low-risk wording and consistency fixes if docs or the `#/antigone` placeholder drift from the actual setup.
- Allow `.antigone-runtime/` outputs only when produced by the helper scripts or benchmark flow.

## Risky tasks requiring human review tomorrow

- Any automation inside the Home Assistant VM running in UTM.
- Any attempt to validate or wire end-to-end voice orchestration through Home Assistant.
- Any Whisper or Piper setup work.
- Any change to the current `VOICE_MEMOS_DIR` default because it points at personal cloud storage.
- Any decision to hide, remove, or migrate the current custom voice workflow.
- Any broader decision about whether `taskflow` remains the host app or Antigone moves into a separate workspace.
- Any change that touches Apple account data, private user accounts, or login/account behavior.

## Tasks explicitly deferred

- Full Home Assistant setup completion.
- Home Assistant to Ollama orchestration wiring.
- Whisper and Piper setup through Home Assistant.
- Replacing the legacy voice-memo pipeline with a new local-first pipeline.
- Building a larger Antigone frontend beyond the current placeholder page.
- Adding new frameworks, dependencies, or system-wide services.
- Moving or reorganizing active in-progress source files.

## Explicit non-goals

- No risky VM automation tonight.
- No iCloud, Apple account, or private account interaction.
- No broad system changes.
- No dependency installation.
- No large frontend expansion.
- No TypeScript/app-wide refactor.
- No deletion or relocation of the legacy voice stack.
- No attempt to prove the final architecture end-to-end.

## Risks and guardrails

- Treat the current voice-memo/OpenAI path as legacy and sensitive, not as a target for expansion.
- Prefer reversible, repo-local changes over machine-level changes.
- If a validation step temporarily disrupts a service, restore the service and re-run status checks before finishing.
- Keep Open WebUI host checks tied to `http://localhost:3000`, not internal container port `8080`.
- Do not guess Home Assistant VM commands; document uncertainty instead.
- Preserve existing uncommitted work and avoid destructive cleanup.

## Expected deliverables by morning

- `PLANS.md`
- `CHANGELOG_NIGHT_RUN.md`
- `STATUS.md`
- `NEXT_STEPS.md`
- validated helper scripts in `scripts/`
- a confirmed morning-ready local state for Docker, Ollama, Open WebUI, and `qwen2.5:3b`
