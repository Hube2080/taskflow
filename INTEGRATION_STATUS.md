# Integration Status

## What was integrated tonight

The repository now has one controlled Antigone source-of-truth direction instead of two drifting experiments.

Integrated tonight:

- a real shared repository target structure with `apps/`, `packages/`, `data/`, and `docs/`
- the Python local assistant moved into `apps/local-assistant`
- the current web app moved into `apps/web`
- compatibility wrappers left at repo root so existing commands still work
- canonical shared contracts created under `packages/contracts`
- canonical SQLite memory schema created under `packages/memory-schema`
- shared runtime/voice defaults created under `packages/shared`
- the minimal structured Antigone memory layer remains wired into the web app and uses SQLite

## Fully working

- the minimal memory layer exists as a real structured store
- memory categories are explicit:
  - `profile_memory`
  - `daily_context`
  - `routine_events`
  - `saved_items`
- morning planning writes into `daily_context`
- midday and evening routines write into `routine_events`
- save thought writes into `saved_items`
- the Antigone web route uses the structured memory layer
- the Manus-led web app now has a canonical home under `apps/web`
- the Python assistant has a canonical home under `apps/local-assistant`
- root Python entrypoints remain backward compatible through wrappers
- root JS/TS commands remain backward compatible through a thin workspace bridge
- shared contracts now exist for:
  - memory categories
  - morning planning payload
  - routine event payload
  - presence summary payload
  - aura state
  - voice state

## Partially wired

- narrow compatibility shims still exist inside `apps/web/shared/` for `antigoneMemory` and `antigoneState`
- the new shared packages are canonical, but not every existing frontend/backend import has been migrated to direct package imports yet
- voice is defined as a shared contract/runtime direction, not as a fully implemented production voice stack inside the web app tonight

## Postponed

- a full layered memory engine:
  - Profile Store
  - Daily Context Store
  - Routine Store
  - Insight Store
  - Semantic Store
- wake word work
- broad visible provider switching
- deep bidirectional runtime coupling between Python and web surfaces
- any attempt to unify MySQL/Drizzle and the local SQLite memory store into one storage engine tonight

## Voice assumptions for now

Practical direction tonight:

- prefer tap-to-talk / push-to-talk
- do not prioritize wake word
- keep visible provider switching out of the main UX for now
- if ElevenLabs is configured, treat one pinned female voice as the premium path via:
  - `ELEVENLABS_API_KEY`
  - `ANTIGONE_ELEVENLABS_VOICE_ID`

The shared runtime defaults for this live in:

- `packages/shared`
- `packages/contracts`

## What Manus should assume tomorrow

- the repo is now the shared source of truth
- the memory nouns are fixed and should not be renamed in frontend work:
  - `profile_memory`
  - `daily_context`
  - `routine_events`
  - `saved_items`
- Presence, Flow, and Insights should be treated as views over those categories
- the current web app remains the active frontend surface for tomorrow’s work
- `apps/web` is now the canonical frontend location
- the Python runtime is no longer “floating”; its canonical home is `apps/local-assistant`
- shared contracts should be extended in `packages/contracts`, not invented ad hoc inside the frontend
- shared runtime defaults and voice/tone assumptions should be extended in `packages/shared`

## Source of truth

Current source-of-truth layers:

- repo structure and migration direction: `UNIFIED_REPO_PLAN.md`
- memory categories and responsibilities: `MEMORY_LAYER.md`
- current integrated reality and safe assumptions: `INTEGRATION_STATUS.md`
- canonical shared contracts: `packages/contracts`
- canonical memory schema: `packages/memory-schema`
- canonical shared runtime defaults: `packages/shared`
