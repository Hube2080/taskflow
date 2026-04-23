# Unified Antigone Repo Plan

## Goal

GitHub should become the shared source of truth for Antigone without forcing a risky overnight merge of two still-evolving systems.

The immediate goal is not “one folder.”
The immediate goal is:

- one repository
- one clear ownership model
- one shared naming and contract layer
- two runtimes that can keep moving safely

## Tonight's status

This plan is no longer purely aspirational.

Integrated tonight:

- shared contract package under `packages/contracts`
- shared SQLite memory schema package under `packages/memory-schema`
- shared runtime defaults under `packages/shared`
- Python local assistant relocated into `apps/local-assistant` with root compatibility wrappers

Still staged:

- the TypeScript web app remains in its current root-based location for tonight
- the future `apps/web` move is still a controlled next migration, not a rushed folder transplant

## Current systems

This repository currently contains two real systems:

### 1. Manus web app / companion product surface

Current shape:

- `client/` for React frontend
- `server/` for tRPC / Express backend
- `shared/` for TypeScript shared types
- `drizzle/` for the existing MySQL-oriented schema
- `package.json`, Vite, Vitest, pnpm-based JS/TS tooling at repo root

Current role:

- product surface
- frontend UX
- browser flows
- React/tRPC implementation of the current Antigone route and companion app

### 2. Local Python/macOS assistant runtime

Current shape:

- `app/` for Streamlit entrypoint
- `src/` for Python ingest / analysis / state / visualization / interaction code
- `scripts/` for setup and local runtime commands
- `requirements.txt` and `requirements-ml.txt`
- `samples/`, `data/`, `outputs/`

Current role:

- local runtime
- transcript ingestion and analysis
- local-first workflows
- machine-specific assistant utilities and operator scripts

## Recommended target structure

The safest clean target is a staged multi-app repository:

```text
apps/
  web/
  local-assistant/

packages/
  contracts/
  memory-schema/
  shared/

docs/
  architecture/
```

### Meaning of each area

#### `apps/web`

Future home of the current Manus-led web app.

This should eventually contain:

- React frontend
- TS server/tRPC backend
- web-specific tests
- web-specific build config

Expected migration source later:

- `client/`
- `server/`
- `shared/` parts that are web-specific
- selected root TS config files

#### `apps/local-assistant`

Future home of the current Python local runtime.

This should eventually contain:

- `app/`
- `src/`
- Python requirements / env docs
- local runtime scripts that belong to the assistant
- sample data and local assistant docs where appropriate

Important:

- this remains a separate runtime/service
- it should not be flattened into the web app
- it should not be forced into Node tooling

#### `packages/contracts`

Shared cross-system contracts.

This should become the canonical place for:

- memory record shapes
- API payload schemas
- voice-state contracts
- event names
- stable shared nouns used by Manus and Codex

Initial contract domains:

- `profile_memory`
- `daily_context`
- `routine_events`
- `saved_items`
- presence snapshot
- flow payloads
- lightweight voice / routine state contracts if needed

#### `packages/memory-schema`

Shared memory-layer definition.

This should become the canonical source for:

- SQLite schema DDL
- migrations
- table naming
- column naming
- memory evolution rules
- typed schema documentation

Important:

- the current Node-side SQLite memory implementation should remain the working implementation for now
- this package should later describe the schema and migrations, not immediately replace the running code tonight

#### `packages/shared`

Shared config and behavior definitions read by both systems.

Good future contents:

- tone / voice modes
- prompt fragments
- routine defaults
- check-in slot definitions
- UX copy defaults that should stay aligned across runtimes

This is the right place for shared prompt/config definitions and runtime defaults, not inside either runtime directly.

## Shared boundaries that should be canonical

These are the boundaries both systems should align on instead of drifting independently:

### Memory schema

Canonical categories:

- `profile_memory`
- `daily_context`
- `routine_events`
- `saved_items`

Canonical record responsibilities:

- `profile_memory`: stable preferences, medication basics, reminders, friction points
- `daily_context`: day-specific priorities and smallest next step
- `routine_events`: morning / midday / evening event history
- `saved_items`: thoughts, reminders, carry-forward items

### API contracts

Canonical interaction surfaces:

- presence snapshot
- morning planning payload
- routine event payload
- save-thought payload
- history / insights payloads

These should be named once and reused.
Manus should not invent parallel frontend-only payload names.

### Voice / state contracts

If Antigone later has more explicit voice-state or conversation-state behavior, it should use shared contract names for:

- tone mode
- current routine slot
- current presence state
- user state summary

### Shared config

The following should eventually be shared across both systems:

- tone modes
- routine default times
- prompt/style guidance
- user-facing labels for memory categories

## Safest migration path

Do not do a giant structural merge tonight.

### Phase 0: GitHub becomes the coordination source of truth

Do now:

- keep `origin` GitHub repo as the canonical coordination point
- keep branch-based work
- keep generated data, local DBs, outputs, and machine-local runtime state out of Git
- treat repo structure, contracts, and migration docs as the shared truth first

Do not do now:

- publish local runtime state
- commit private transcript data
- couple machine-local paths into shared product logic

### Phase 1: Establish target repo shape without moving working systems

Do now:

- create top-level `apps/` and `packages/` placeholders
- document where the current systems will land
- keep current code where it is
- declare shared package responsibilities

Outcome:

- Manus and Codex can start building toward the same structure immediately
- nothing working is broken

### Phase 2: Freeze shared nouns and contracts

Next safe step after tonight:

- move or mirror the current memory contracts into `packages/contracts`
- move schema documentation and migrations into `packages/memory-schema`
- move tone / shared config definitions into `packages/shared`

Important:

- this phase should happen before any major folder moves
- frontend work should align to these packages even if imports still temporarily come from current root locations

### Phase 3: Migrate the web app into `apps/web`

Do later, deliberately:

- move `client/`, `server/`, and web build config into `apps/web`
- update TS path aliases, Vite root, tests, and scripts
- keep routes and runtime behavior unchanged during the move

This should be a dedicated migration step, not mixed with feature work.

### Phase 4: Migrate the Python assistant into `apps/local-assistant`

Do later, separately:

- move `app/`, `src/`, `requirements*.txt`, and relevant scripts into `apps/local-assistant`
- preserve current run commands with small wrapper scripts during the transition
- keep data, outputs, and local env behavior stable

This should not be bundled with the web migration.

### Phase 5: Converge on shared memory ownership

Only after the structure is stable:

- decide whether the Node memory layer remains the canonical writer
- decide whether Python reads the same SQLite schema directly
- or whether Python reads through exported snapshots / APIs

Do not force this decision tonight.

## Safest next practical step

The next safe practical step is:

1. Keep both working systems where they are tonight.
2. Start treating the new top-level target layout as the agreed destination.
3. Move shared memory contracts first.
4. Let Manus continue Sprint 9 memory work against the current web app, but using the canonical memory nouns and boundaries from this plan.
5. Schedule the actual `apps/web` and `apps/local-assistant` moves as separate migration steps.

## What Manus needs to know

Manus should keep frontend work aligned to these rules:

- The web app is the future `apps/web`.
- Do not create a second memory vocabulary.
- Use the canonical categories:
  - `profile_memory`
  - `daily_context`
  - `routine_events`
  - `saved_items`
- Treat Presence, Flow, and Insights as views over those shared categories.
- Do not bind frontend logic directly to Python data folders such as `data/`, `outputs/`, or local notebook-style artifacts.
- Do not assume the Streamlit app is the long-term frontend shell.
- Put shared prompt/tone/config ideas into `packages/shared`, not ad hoc inside page components.

## What should NOT be merged yet

These things should stay separate for now:

- the Python runtime and the React runtime
- JS/TS build tooling and Python environment/tooling
- the existing MySQL/Drizzle app schema and the new local SQLite memory schema
- legacy voice-memo flows and the new memory layer
- generated transcript outputs, local DBs, and private runtime data
- machine-specific scripts mixed into the web app package

Also do not do yet:

- a blind folder flattening
- a single shared mutable runtime without ownership boundaries
- direct cross-runtime imports between Python code and TS app code

## Risks

Main risks if this is done too fast:

- breaking the currently working web app
- breaking the currently working local assistant
- mixing MySQL, SQLite, and local runtime state without clear ownership
- making Manus frontend work depend on unstable backend folder moves
- encoding private local-machine paths into shared architecture

## What can be done tonight vs later

### Safe tonight

- document the target structure
- scaffold neutral top-level directories
- define shared package responsibilities
- freeze the canonical memory nouns and boundaries

### Later

- move web files into `apps/web`
- move Python files into `apps/local-assistant`
- add workspace tooling
- centralize contracts and schema packages
- choose the long-term shared memory ownership model

## Recommendation

Use GitHub as the source of truth for:

- repository structure
- contracts
- migration phases
- shared package boundaries

Do not use GitHub tonight as the reason to force an immediate code move.

The clean move is:

- agree on the destination now
- scaffold it safely
- migrate by boundary
- keep both systems shipping while converging inside one repo
