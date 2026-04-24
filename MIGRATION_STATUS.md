# Migration Status

## What Was Moved

The current React + TypeScript web app has been moved into `apps/web/`.

Moved into `apps/web`:

- `client/`
- `server/`
- `shared/`
- `drizzle/`
- `components.json`
- `vite.config.ts`
- `vitest.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `drizzle.config.ts`
- the web app `package.json`

`apps/web` is now the canonical frontend and web-backend location.

## What Still Remains Temporarily In Root

These root-level items remain intentionally:

- `package.json` as a thin workspace command bridge to `apps/web`
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `node_modules/`, and `patches/` as workspace/package-manager infrastructure
- `.env` and `.env.local` as repo-level environment files
- `apps/local-assistant/` as the canonical Python/local runtime
- repo-wide docs, scripts, data, outputs, and shared packages under `packages/`

There is no longer a canonical web source tree at the repo root.

## Compatibility Wrappers Still In Place

These compatibility layers remain on purpose for a low-risk migration:

- root `package.json` forwards common commands like `dev`, `build`, `check`, and `test` to `apps/web`
- `apps/web/shared/antigoneMemory.ts` re-exports the canonical memory contracts from `packages/contracts`
- `apps/web/shared/antigoneState.ts` re-exports the canonical state contracts from `packages/contracts`

These shims are transitional, documented, and intentionally narrow. They exist to avoid a large import-churn sprint during the structural move.

## Canonical Frontend Location For Manus

Use `apps/web` as the frontend source of truth going forward.

That includes:

- frontend page work in `apps/web/client/`
- web backend and tRPC work in `apps/web/server/`
- local web-app shims in `apps/web/shared/`

For shared cross-runtime contracts and definitions, use:

- `packages/contracts`
- `packages/memory-schema`
- `packages/shared`

## Shared Memory Assumptions

The web app remains aligned to the same memory categories:

- `profile_memory`
- `daily_context`
- `routine_events`
- `saved_items`

Presence, Flow, and the Antigone memory views should keep treating those as the stable memory nouns.

## What To Test Next

Run these next:

1. `pnpm --dir apps/web check`
2. `pnpm --dir apps/web test -- server/antigoneMemory.store.test.ts server/antigone.router.test.ts`
3. `pnpm --dir apps/web dev`
4. Open the Antigone route and verify:
   - Presence still shows today’s priorities and smallest next step
   - Morning Planning still persists
   - Midday and evening routines still persist
   - Save Thought still persists
   - memory debug data still points to repo-level `.taskflow-data/antigone-memory.sqlite`

## Current Verification Notes

- The web app import graph resolves from `apps/web`.
- The SQLite memory store still points at repo-level `.taskflow-data/antigone-memory.sqlite`.
- The voice-memo JSON store still points at repo-level `.taskflow-data/voice-memos.json`.
- `apps/local-assistant` remains intact and separate from the web runtime.

The remaining thing to watch is dev-server startup speed. This repo has already shown some slow/hanging behavior in broader checks, so if a run feels slow, treat that as a runtime verification item rather than a reason to revert the structural migration.
