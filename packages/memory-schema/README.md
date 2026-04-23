# Memory Schema Package

This package now holds the canonical SQLite schema definition for the minimal Antigone memory layer.

Current focus:

- explicit tables for `profile_memory`, `daily_context`, `routine_events`, and `saved_items`
- canonical DDL for the Node-side SQLite memory store
- a clean place for future migrations and schema evolution

The current store implementation reads this schema package rather than owning the DDL inline.
