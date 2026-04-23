export const ANTIGONE_MEMORY_SCHEMA_VERSION = 1;

export const ANTIGONE_MEMORY_SQLITE_SCHEMA = `
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS profile_memory (
    id TEXT PRIMARY KEY,
    memory_type TEXT NOT NULL CHECK (memory_type IN (
      'preferred_voice_tone',
      'medication_basic',
      'recurring_reminder',
      'leaving_home_reminder',
      'friction_point',
      'stable_preference'
    )),
    label TEXT NOT NULL,
    value_text TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_context (
    id TEXT PRIMARY KEY,
    context_date TEXT NOT NULL UNIQUE,
    priority_1 TEXT,
    priority_2 TEXT,
    priority_3 TEXT,
    smallest_next_step TEXT,
    deprioritized_today TEXT,
    state_energy INTEGER,
    state_stress INTEGER,
    state_mood INTEGER,
    morning_planning_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS routine_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
      'morning_checkin',
      'midday_checkin',
      'evening_reflection'
    )),
    scheduled_date TEXT NOT NULL,
    scheduled_time_local TEXT NOT NULL,
    occurred_at TEXT,
    completion_status TEXT NOT NULL CHECK (completion_status IN ('pending', 'completed', 'skipped')),
    mood INTEGER,
    energy INTEGER,
    stress INTEGER,
    focus INTEGER,
    sleep_quality INTEGER,
    medication_status TEXT,
    food_text TEXT,
    water_glasses INTEGER,
    reflection_text TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_items (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL CHECK (item_type IN (
      'thought',
      'idea',
      'reminder',
      'carry_forward',
      'reflection_followup'
    )),
    content TEXT NOT NULL,
    target_date TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'done', 'archived')),
    source_event_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (source_event_id) REFERENCES routine_events(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_daily_context_date ON daily_context(context_date);
  CREATE INDEX IF NOT EXISTS idx_routine_events_date_type ON routine_events(scheduled_date, event_type);
  CREATE INDEX IF NOT EXISTS idx_saved_items_status_target ON saved_items(status, target_date);
  CREATE INDEX IF NOT EXISTS idx_profile_memory_type_active ON profile_memory(memory_type, is_active);
`;
