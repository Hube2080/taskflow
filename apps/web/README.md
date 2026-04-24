# Antigone Web App

`apps/web` is the canonical home of the Manus-led React + TypeScript app.

It contains:

- the Vite client in `client/`
- the Express/tRPC backend in `server/`
- web-local shared shims in `shared/`
- the legacy Drizzle/MySQL schema in `drizzle/`

Shared source-of-truth packages live outside this app:

- `packages/contracts`
- `packages/memory-schema`
- `packages/shared`

For now, `apps/web/shared/antigoneMemory.ts` and `apps/web/shared/antigoneState.ts` remain intentional compatibility shims so the existing UI can keep stable imports while resolving to the canonical shared contracts.
