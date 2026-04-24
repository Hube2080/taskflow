import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { ANTIGONE_MEMORY_SQLITE_SCHEMA } from "../../../../packages/memory-schema/src/sqlite";
import type {
  AntigoneHistorySnapshot,
  DailyContextRecord,
  MorningPlanningInput,
  PresenceRoutineSlot,
  PresenceSnapshot,
  ProfileMemoryItem,
  ProfileMemoryUpsertInput,
  RoutineEventInput,
  RoutineEventRecord,
  RoutineEventType,
  SavedItemRecord,
  SaveThoughtInput,
} from "@shared/antigoneMemory";
import { DEFAULT_ROUTINE_TIMES, ROUTINE_EVENT_TYPES } from "@shared/antigoneMemory";
import { getRepoDataPath } from "../_core/repoRoot";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

const ROUTINE_LABELS: Record<RoutineEventType, string> = {
  morning_checkin: "Morning check-in",
  midday_checkin: "Midday meds / food / water",
  evening_reflection: "Evening reflection",
};

type ListRoutineInput = {
  scheduledDate?: string;
  limit?: number;
};

type ListSavedItemsInput = {
  status?: SavedItemRecord["status"];
  limit?: number;
  onlyActiveCarryForward?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatLocalTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days, 12, 0, 0, 0);
  return formatLocalDate(next);
}

function parseLocalDateTime(dateString: string, timeString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0);
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeRating(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function normalizeWaterGlasses(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

function mapProfileMemory(row: Record<string, unknown> | undefined): ProfileMemoryItem | null {
  if (!row) return null;
  return {
    id: String(row.id),
    memoryType: row.memory_type as ProfileMemoryItem["memoryType"],
    label: String(row.label),
    valueText: String(row.value_text),
    isActive: Number(row.is_active) === 1,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapDailyContext(row: Record<string, unknown> | undefined): DailyContextRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    contextDate: String(row.context_date),
    priority1: (row.priority_1 as string | null) ?? null,
    priority2: (row.priority_2 as string | null) ?? null,
    priority3: (row.priority_3 as string | null) ?? null,
    smallestNextStep: (row.smallest_next_step as string | null) ?? null,
    deprioritizedToday: (row.deprioritized_today as string | null) ?? null,
    stateEnergy: row.state_energy === null || row.state_energy === undefined ? null : Number(row.state_energy),
    stateStress: row.state_stress === null || row.state_stress === undefined ? null : Number(row.state_stress),
    stateMood: row.state_mood === null || row.state_mood === undefined ? null : Number(row.state_mood),
    morningPlanningCompleted: Number(row.morning_planning_completed) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapRoutineEvent(row: Record<string, unknown> | undefined): RoutineEventRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    eventType: row.event_type as RoutineEventRecord["eventType"],
    scheduledDate: String(row.scheduled_date),
    scheduledTimeLocal: String(row.scheduled_time_local),
    occurredAt: (row.occurred_at as string | null) ?? null,
    completionStatus: row.completion_status as RoutineEventRecord["completionStatus"],
    mood: row.mood === null || row.mood === undefined ? null : Number(row.mood),
    energy: row.energy === null || row.energy === undefined ? null : Number(row.energy),
    stress: row.stress === null || row.stress === undefined ? null : Number(row.stress),
    focus: row.focus === null || row.focus === undefined ? null : Number(row.focus),
    sleepQuality: row.sleep_quality === null || row.sleep_quality === undefined ? null : Number(row.sleep_quality),
    medicationStatus: (row.medication_status as string | null) ?? null,
    foodText: (row.food_text as string | null) ?? null,
    waterGlasses: row.water_glasses === null || row.water_glasses === undefined ? null : Number(row.water_glasses),
    reflectionText: (row.reflection_text as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSavedItem(row: Record<string, unknown> | undefined): SavedItemRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    itemType: row.item_type as SavedItemRecord["itemType"],
    content: String(row.content),
    targetDate: (row.target_date as string | null) ?? null,
    status: row.status as SavedItemRecord["status"],
    sourceEventId: (row.source_event_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class AntigoneMemoryStore {
  readonly path: string;
  private readonly db: DatabaseSync;

  constructor(storePath: string) {
    this.path = storePath;
    mkdirSync(path.dirname(storePath), { recursive: true });
    this.db = new DatabaseSync(storePath);
    this.bootstrap();
  }

  close() {
    this.db.close();
  }

  listProfileMemory() {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM profile_memory
          ORDER BY is_active DESC, memory_type ASC, sort_order ASC, updated_at DESC
        `
      )
      .all() as Record<string, unknown>[];

    return rows
      .map(mapProfileMemory)
      .filter((item): item is ProfileMemoryItem => item !== null);
  }

  upsertProfileMemory(input: ProfileMemoryUpsertInput) {
    const id = input.id ?? `profile_${randomUUID()}`;
    const timestamp = nowIso();

    this.db
      .prepare(
        `
          INSERT INTO profile_memory (
            id, memory_type, label, value_text, is_active, sort_order, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            memory_type = excluded.memory_type,
            label = excluded.label,
            value_text = excluded.value_text,
            is_active = excluded.is_active,
            sort_order = excluded.sort_order,
            updated_at = excluded.updated_at
        `
      )
      .run(
        id,
        input.memoryType,
        input.label.trim(),
        input.valueText.trim(),
        input.isActive === false ? 0 : 1,
        input.sortOrder ?? 0,
        timestamp,
        timestamp
      );

    return this.getProfileMemoryById(id);
  }

  getDailyContextByDate(dateString = formatLocalDate()) {
    const row = this.db
      .prepare(
        `
          SELECT *
          FROM daily_context
          WHERE context_date = ?
          LIMIT 1
        `
      )
      .get(dateString) as Record<string, unknown> | undefined;

    return mapDailyContext(row);
  }

  saveMorningPlan(input: MorningPlanningInput) {
    const contextDate = input.contextDate ?? formatLocalDate();
    const existing = this.getDailyContextByDate(contextDate);
    const id = existing?.id ?? `daily_${contextDate}`;
    const timestamp = nowIso();

    this.db
      .prepare(
        `
          INSERT INTO daily_context (
            id,
            context_date,
            priority_1,
            priority_2,
            priority_3,
            smallest_next_step,
            deprioritized_today,
            state_energy,
            state_stress,
            state_mood,
            morning_planning_completed,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          ON CONFLICT(context_date) DO UPDATE SET
            priority_1 = excluded.priority_1,
            priority_2 = excluded.priority_2,
            priority_3 = excluded.priority_3,
            smallest_next_step = excluded.smallest_next_step,
            deprioritized_today = excluded.deprioritized_today,
            state_energy = excluded.state_energy,
            state_stress = excluded.state_stress,
            state_mood = excluded.state_mood,
            morning_planning_completed = 1,
            updated_at = excluded.updated_at
        `
      )
      .run(
        id,
        contextDate,
        normalizeText(input.priority1),
        normalizeText(input.priority2),
        normalizeText(input.priority3),
        normalizeText(input.smallestNextStep),
        normalizeText(input.deprioritizedToday),
        normalizeRating(input.stateEnergy),
        normalizeRating(input.stateStress),
        normalizeRating(input.stateMood),
        existing?.createdAt ?? timestamp,
        timestamp
      );

    if (input.markMorningCheckinComplete !== false) {
      this.upsertMorningCheckin({
        scheduledDate: contextDate,
        mood: input.stateMood ?? null,
        energy: input.stateEnergy ?? null,
        stress: input.stateStress ?? null,
        notes: normalizeText(input.smallestNextStep),
      });
    }

    return this.getDailyContextByDate(contextDate);
  }

  listRoutineEvents(input: ListRoutineInput = {}) {
    const limit = Math.max(1, Math.min(input.limit ?? 30, 90));
    let sql = `
      SELECT *
      FROM routine_events
    `;
    const params: string[] = [];

    if (input.scheduledDate) {
      sql += ` WHERE scheduled_date = ?`;
      params.push(input.scheduledDate);
    }

    sql += ` ORDER BY scheduled_date DESC, scheduled_time_local DESC, created_at DESC LIMIT ${limit}`;

    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];

    return rows
      .map(mapRoutineEvent)
      .filter((item): item is RoutineEventRecord => item !== null);
  }

  recordRoutineEvent(input: RoutineEventInput) {
    const timestamp = nowIso();
    const scheduledDate = input.scheduledDate ?? formatLocalDate();
    const scheduledTimeLocal = input.scheduledTimeLocal ?? DEFAULT_ROUTINE_TIMES[input.eventType];
    const completionStatus = input.completionStatus ?? "completed";
    const id = `routine_${randomUUID()}`;

    this.db
      .prepare(
        `
          INSERT INTO routine_events (
            id,
            event_type,
            scheduled_date,
            scheduled_time_local,
            occurred_at,
            completion_status,
            mood,
            energy,
            stress,
            focus,
            sleep_quality,
            medication_status,
            food_text,
            water_glasses,
            reflection_text,
            notes,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        input.eventType,
        scheduledDate,
        scheduledTimeLocal,
        completionStatus === "pending" ? null : timestamp,
        completionStatus,
        normalizeRating(input.mood),
        normalizeRating(input.energy),
        normalizeRating(input.stress),
        normalizeRating(input.focus),
        normalizeRating(input.sleepQuality),
        normalizeText(input.medicationStatus),
        normalizeText(input.foodText),
        normalizeWaterGlasses(input.waterGlasses),
        normalizeText(input.reflectionText),
        normalizeText(input.notes),
        timestamp,
        timestamp
      );

    return this.getRoutineEventById(id);
  }

  listSavedItems(input: ListSavedItemsInput = {}) {
    const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM saved_items
          ORDER BY
            CASE WHEN target_date IS NULL THEN 1 ELSE 0 END ASC,
            target_date ASC,
            created_at DESC
        `
      )
      .all() as Record<string, unknown>[];

    return rows
      .map(mapSavedItem)
      .filter((item): item is SavedItemRecord => item !== null)
      .filter((item) => (input.status ? item.status === input.status : true))
      .filter((item) =>
        input.onlyActiveCarryForward
          ? item.status === "active" && (item.itemType === "carry_forward" || item.itemType === "reflection_followup")
          : true
      )
      .slice(0, limit);
  }

  saveThought(input: SaveThoughtInput) {
    const timestamp = nowIso();
    const id = `saved_${randomUUID()}`;

    this.db
      .prepare(
        `
          INSERT INTO saved_items (
            id,
            item_type,
            content,
            target_date,
            status,
            source_event_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
        `
      )
      .run(
        id,
        input.itemType ?? "thought",
        input.content.trim(),
        normalizeText(input.targetDate),
        normalizeText(input.sourceEventId),
        timestamp,
        timestamp
      );

    return this.getSavedItemById(id);
  }

  archiveSavedItem(id: string) {
    this.db
      .prepare(
        `
          UPDATE saved_items
          SET status = 'archived', updated_at = ?
          WHERE id = ?
        `
      )
      .run(nowIso(), id);

    return this.getSavedItemById(id);
  }

  getPresenceSnapshot(now = new Date()): PresenceSnapshot {
    const today = formatLocalDate(now);
    const todayContext = this.getDailyContextByDate(today);
    const priorities = [todayContext?.priority1, todayContext?.priority2, todayContext?.priority3].filter(
      (value): value is string => Boolean(value)
    );

    return {
      date: today,
      priorities,
      smallestNextStep: todayContext?.smallestNextStep ?? null,
      morningPlanningCompleted: todayContext?.morningPlanningCompleted ?? false,
      nextDueRoutine: this.resolveNextDueRoutine(now),
      relevantSavedItem: this.findRelevantSavedItem(today),
    };
  }

  getHistory(limit = 7): AntigoneHistorySnapshot {
    const safeLimit = Math.max(1, Math.min(limit, 30));

    return {
      dbPath: this.path,
      counts: {
        profileMemory: this.countRows("profile_memory"),
        dailyContext: this.countRows("daily_context"),
        routineEvents: this.countRows("routine_events"),
        savedItems: this.countRows("saved_items"),
      },
      recentProfileMemory: this.listProfileMemory().slice(0, safeLimit),
      recentDailyContext: this.listDailyContext(safeLimit),
      recentRoutineEvents: this.listRoutineEvents({ limit: safeLimit * 3 }),
      recentSavedItems: this.listSavedItems({ limit: safeLimit * 3 }),
    };
  }

  private bootstrap() {
    this.db.exec(ANTIGONE_MEMORY_SQLITE_SCHEMA);
  }

  private countRows(tableName: "profile_memory" | "daily_context" | "routine_events" | "saved_items") {
    const row = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
    return Number(row.count ?? 0);
  }

  private listDailyContext(limit = 7) {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM daily_context
          ORDER BY context_date DESC
          LIMIT ${Math.max(1, Math.min(limit, 30))}
        `
      )
      .all() as Record<string, unknown>[];

    return rows
      .map(mapDailyContext)
      .filter((item): item is DailyContextRecord => item !== null);
  }

  private getProfileMemoryById(id: string) {
    const row = this.db.prepare(`SELECT * FROM profile_memory WHERE id = ? LIMIT 1`).get(id) as
      | Record<string, unknown>
      | undefined;
    return mapProfileMemory(row);
  }

  private getRoutineEventById(id: string) {
    const row = this.db.prepare(`SELECT * FROM routine_events WHERE id = ? LIMIT 1`).get(id) as
      | Record<string, unknown>
      | undefined;
    return mapRoutineEvent(row);
  }

  private getSavedItemById(id: string) {
    const row = this.db.prepare(`SELECT * FROM saved_items WHERE id = ? LIMIT 1`).get(id) as
      | Record<string, unknown>
      | undefined;
    return mapSavedItem(row);
  }

  private upsertMorningCheckin(input: {
    scheduledDate: string;
    mood: number | null;
    energy: number | null;
    stress: number | null;
    notes: string | null;
  }) {
    const existingRow = this.db
      .prepare(
        `
          SELECT *
          FROM routine_events
          WHERE scheduled_date = ? AND event_type = 'morning_checkin'
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get(input.scheduledDate) as Record<string, unknown> | undefined;
    const existing = mapRoutineEvent(existingRow);
    const timestamp = nowIso();

    if (existing) {
      this.db
        .prepare(
          `
            UPDATE routine_events
            SET
              completion_status = 'completed',
              occurred_at = ?,
              mood = ?,
              energy = ?,
              stress = ?,
              notes = ?,
              updated_at = ?
            WHERE id = ?
          `
        )
        .run(
          timestamp,
          normalizeRating(input.mood),
          normalizeRating(input.energy),
          normalizeRating(input.stress),
          input.notes,
          timestamp,
          existing.id
        );
      return;
    }

    this.recordRoutineEvent({
      eventType: "morning_checkin",
      scheduledDate: input.scheduledDate,
      completionStatus: "completed",
      mood: input.mood,
      energy: input.energy,
      stress: input.stress,
      notes: input.notes,
    });
  }

  private resolveNextDueRoutine(now: Date): PresenceRoutineSlot {
    const today = formatLocalDate(now);
    const todayEvents = this.listRoutineEvents({ scheduledDate: today, limit: 12 });
    const completedTypes = new Set(
      todayEvents.filter((event) => event.completionStatus !== "pending").map((event) => event.eventType)
    );

    for (const eventType of ROUTINE_EVENT_TYPES) {
      if (!completedTypes.has(eventType)) {
        const scheduledTimeLocal = DEFAULT_ROUTINE_TIMES[eventType];
        return {
          eventType,
          scheduledDate: today,
          scheduledTimeLocal,
          overdue: parseLocalDateTime(today, scheduledTimeLocal).getTime() < now.getTime(),
          label: ROUTINE_LABELS[eventType],
        };
      }
    }

    return {
      eventType: "morning_checkin",
      scheduledDate: addDays(today, 1),
      scheduledTimeLocal: DEFAULT_ROUTINE_TIMES.morning_checkin,
      overdue: false,
      label: ROUTINE_LABELS.morning_checkin,
    };
  }

  private findRelevantSavedItem(today: string) {
    const activeItems = this.listSavedItems({ status: "active", limit: 50 });
    const dueItem =
      [...activeItems]
        .filter((item) => Boolean(item.targetDate) && (item.targetDate ?? "") <= today)
        .sort((left, right) => {
          if (left.targetDate === right.targetDate) {
            return right.createdAt.localeCompare(left.createdAt);
          }
          return (right.targetDate ?? "").localeCompare(left.targetDate ?? "");
        })[0] ?? null;

    if (dueItem) {
      return dueItem;
    }

    return [...activeItems]
      .filter((item) => item.targetDate === null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  }
}

export function createDefaultAntigoneMemoryPath() {
  return getRepoDataPath(".taskflow-data", "antigone-memory.sqlite");
}

export function formatMemoryDebugNow() {
  return {
    localDate: formatLocalDate(),
    localTime: formatLocalTime(),
  };
}
