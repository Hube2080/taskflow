# Antigone Memory Layer

## What exists now

Antigone now has one pragmatic local memory store backed by SQLite at:

`/Users/hubertusvonhaller/Documents/Playground/taskflow/.taskflow-data/antigone-memory.sqlite`

It is intentionally simple tonight:

- one local structured infostore
- explicit categories instead of one generic blob
- readable table layout with timestamps and IDs
- wired into the React + TypeScript product surface at `#/antigone`
- canonical schema definition under `packages/memory-schema`
- canonical memory contracts under `packages/contracts`

This is Option 1: useful, inspectable, and ready to evolve later.

## Memory categories

### `profile_memory`

Stores relatively stable user information:

- preferred voice / tone
- medication basics
- recurring reminders
- leaving-home reminders
- known friction points
- stable preferences

Key columns:

- `id`
- `memory_type`
- `label`
- `value_text`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### `daily_context`

Stores day-specific anchoring information:

- `context_date`
- today’s 1–3 priorities
- smallest next step
- what should be deprioritized today
- state markers such as mood, energy, stress
- whether morning planning was completed

Key columns:

- `id`
- `context_date`
- `priority_1`
- `priority_2`
- `priority_3`
- `smallest_next_step`
- `deprioritized_today`
- `state_energy`
- `state_stress`
- `state_mood`
- `morning_planning_completed`
- `created_at`
- `updated_at`

### `routine_events`

Stores recurring daily check-in events:

- morning check-in
- midday meds / food / water check-in
- evening reflection

Key columns:

- `id`
- `event_type`
- `scheduled_date`
- `scheduled_time_local`
- `occurred_at`
- `completion_status`
- `mood`
- `energy`
- `stress`
- `focus`
- `sleep_quality`
- `medication_status`
- `food_text`
- `water_glasses`
- `reflection_text`
- `notes`
- `created_at`
- `updated_at`

### `saved_items`

Stores things that should survive the current moment:

- save this thought for tomorrow
- reminders to revisit later
- quick captured ideas
- carry-forward items
- reflection follow-ups

Key columns:

- `id`
- `item_type`
- `content`
- `target_date`
- `status`
- `source_event_id`
- `created_at`
- `updated_at`

## What writes to memory

### Morning Planning

Writes to:

- `daily_context`

Also marks today’s morning routine as completed in:

- `routine_events`

### Midday Check-In

Writes to:

- `routine_events`

### Evening Reflection

Writes to:

- `routine_events`

Can also write a follow-up item to:

- `saved_items`

### Save Thought

Writes to:

- `saved_items`

### Profile Memory editor

Writes to:

- `profile_memory`

## What reads from memory

### Presence

Reads from memory and shows:

- today’s priorities
- smallest next step
- next due routine check
- a relevant saved item when helpful

This is assembled as a server-side read model so the app does not have to rebuild presence logic client-side.

### Flow

Reads from:

- `daily_context`
- `saved_items`

Writes to:

- `daily_context`
- `routine_events`
- `saved_items`

### Insights

Reads lightweight history from:

- `daily_context`
- `routine_events`
- `saved_items`
- `profile_memory`

It currently powers:

- recent daily context history
- routine completion history
- carry-forward and saved-item history
- debug inspection counts and latest records

## Current product behavior

Already functional now:

- morning planning persists
- midday and evening routine events persist
- saved thoughts persist
- profile memory items persist
- presence reads stored memory after reload
- the Antigone route no longer starts from zero after refresh
- a debug memory view exposes DB path, counts, and recent records

Still intentionally lightweight:

- no semantic memory layer
- no automated summarization across weeks
- no separate insight store yet
- no user/account partitioning
- no deletion flows beyond saved-item archiving and profile pause/restore

## How this evolves later

Tonight’s schema is designed so it can grow into a layered memory engine without discarding the current work.

Likely future mapping:

- `profile_memory` -> Profile Store
- `daily_context` -> Daily Context Store
- `routine_events` -> Routine Store
- derived charts / summaries -> Insight Store
- transcript embeddings / semantic retrieval -> optional Semantic Store

That later evolution can add:

- richer derived tables
- semantic retrieval
- cross-day pattern summaries
- account scoping
- background compaction or synthesis

The important point is that tonight’s implementation already separates stable profile memory, day-level context, routine history, and saved carry-forward items instead of collapsing everything into one opaque blob.
