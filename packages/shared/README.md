# Shared Package

This package now holds shared runtime configuration and cross-surface defaults that should stay aligned between:

- the Manus-led web app
- the local Python assistant/runtime

Current focus:

- practical voice runtime defaults
- pinned premium voice configuration shape
- shared interaction assumptions such as push-to-talk over wake word

This package is intentionally narrower than `packages/contracts`.
`packages/contracts` defines data shapes.
`packages/shared` defines shared behavior defaults and runtime assumptions.
