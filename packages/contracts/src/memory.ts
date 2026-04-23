export const PROFILE_MEMORY_TYPES = [
  "preferred_voice_tone",
  "medication_basic",
  "recurring_reminder",
  "leaving_home_reminder",
  "friction_point",
  "stable_preference",
] as const;

export const ROUTINE_EVENT_TYPES = [
  "morning_checkin",
  "midday_checkin",
  "evening_reflection",
] as const;

export const ROUTINE_COMPLETION_STATUSES = ["pending", "completed", "skipped"] as const;

export const SAVED_ITEM_TYPES = [
  "thought",
  "idea",
  "reminder",
  "carry_forward",
  "reflection_followup",
] as const;

export const SAVED_ITEM_STATUSES = ["active", "done", "archived"] as const;

export const DEFAULT_ROUTINE_TIMES = {
  morning_checkin: "08:30",
  midday_checkin: "13:00",
  evening_reflection: "20:30",
} as const;

export type ProfileMemoryType = (typeof PROFILE_MEMORY_TYPES)[number];
export type RoutineEventType = (typeof ROUTINE_EVENT_TYPES)[number];
export type RoutineCompletionStatus = (typeof ROUTINE_COMPLETION_STATUSES)[number];
export type SavedItemType = (typeof SAVED_ITEM_TYPES)[number];
export type SavedItemStatus = (typeof SAVED_ITEM_STATUSES)[number];

export type ProfileMemoryItem = {
  id: string;
  memoryType: ProfileMemoryType;
  label: string;
  valueText: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyContextRecord = {
  id: string;
  contextDate: string;
  priority1: string | null;
  priority2: string | null;
  priority3: string | null;
  smallestNextStep: string | null;
  deprioritizedToday: string | null;
  stateEnergy: number | null;
  stateStress: number | null;
  stateMood: number | null;
  morningPlanningCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoutineEventRecord = {
  id: string;
  eventType: RoutineEventType;
  scheduledDate: string;
  scheduledTimeLocal: string;
  occurredAt: string | null;
  completionStatus: RoutineCompletionStatus;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  focus: number | null;
  sleepQuality: number | null;
  medicationStatus: string | null;
  foodText: string | null;
  waterGlasses: number | null;
  reflectionText: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedItemRecord = {
  id: string;
  itemType: SavedItemType;
  content: string;
  targetDate: string | null;
  status: SavedItemStatus;
  sourceEventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PresenceRoutineSlot = {
  eventType: RoutineEventType;
  scheduledDate: string;
  scheduledTimeLocal: string;
  overdue: boolean;
  label: string;
};

export type PresenceSnapshot = {
  date: string;
  priorities: string[];
  smallestNextStep: string | null;
  morningPlanningCompleted: boolean;
  nextDueRoutine: PresenceRoutineSlot;
  relevantSavedItem: SavedItemRecord | null;
};

export type MorningPlanningInput = {
  contextDate?: string;
  priority1?: string | null;
  priority2?: string | null;
  priority3?: string | null;
  smallestNextStep?: string | null;
  deprioritizedToday?: string | null;
  stateEnergy?: number | null;
  stateStress?: number | null;
  stateMood?: number | null;
  markMorningCheckinComplete?: boolean;
};

export type RoutineEventInput = {
  eventType: RoutineEventType;
  scheduledDate?: string;
  scheduledTimeLocal?: string;
  completionStatus?: RoutineCompletionStatus;
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
  focus?: number | null;
  sleepQuality?: number | null;
  medicationStatus?: string | null;
  foodText?: string | null;
  waterGlasses?: number | null;
  reflectionText?: string | null;
  notes?: string | null;
};

export type SaveThoughtInput = {
  content: string;
  itemType?: SavedItemType;
  targetDate?: string | null;
  sourceEventId?: string | null;
};

export type ProfileMemoryUpsertInput = {
  id?: string;
  memoryType: ProfileMemoryType;
  label: string;
  valueText: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type AntigoneHistorySnapshot = {
  dbPath: string;
  counts: {
    profileMemory: number;
    dailyContext: number;
    routineEvents: number;
    savedItems: number;
  };
  recentProfileMemory: ProfileMemoryItem[];
  recentDailyContext: DailyContextRecord[];
  recentRoutineEvents: RoutineEventRecord[];
  recentSavedItems: SavedItemRecord[];
};
