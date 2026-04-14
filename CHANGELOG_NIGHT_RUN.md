# Night Run Changelog

Date: 2026-04-14

## Summary

The repo was cleaned up for a safer Antigone transition pass. The legacy custom voice path was left in place but clearly marked, the new local-first architecture was documented, and simple operator scripts were added for status, start/stop, and Ollama benchmarking.

## What changed

- Added `PLANS.md` with explicit safe, risky, and deferred overnight buckets
- Added root documentation for status, runbook, next steps, and this night summary
- Added `scripts/check_status.sh`
- Added `scripts/start_services.sh`
- Added `scripts/stop_services.sh`
- Added `scripts/benchmark_ollama.sh`
- Added a minimal Antigone placeholder page and route in the existing frontend
- Added lightweight legacy notes to the existing custom voice-memo code path
- Added a repo-local runtime folder convention for reversible script state

## What was not changed

- No risky Home Assistant VM automation
- No changes to iCloud or private Apple account data
- No removal or relocation of the current voice-memo implementation
- No new framework or dependency installation

## What was verified

- Docker, Ollama, Open WebUI, and `qwen2.5:3b` can be checked through the repo-local helper scripts
- The overnight plan, status snapshot, and next-step list now use the same safe/risky/deferred framing
- All helper scripts passed shell syntax checks
- `scripts/check_status.sh` passed with Docker, Ollama, Open WebUI, and `qwen2.5:3b` healthy
- `scripts/benchmark_ollama.sh` completed and wrote a fresh report to `.antigone-runtime/benchmarks/ollama-benchmark-20260414-023619.txt`
