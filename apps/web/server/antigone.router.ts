import { z } from "zod";
import {
  PROFILE_MEMORY_TYPES,
  ROUTINE_COMPLETION_STATUSES,
  ROUTINE_EVENT_TYPES,
  SAVED_ITEM_STATUSES,
  SAVED_ITEM_TYPES,
} from "@shared/antigoneMemory";
import { publicProcedure, router } from "./_core/trpc";
import type { AntigoneMemoryStore } from "./antigoneMemory";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const profileUpsertInput = z.object({
  id: z.string().min(1).optional(),
  memoryType: z.enum(PROFILE_MEMORY_TYPES),
  label: z.string().trim().min(1),
  valueText: z.string().trim().min(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const dailyContextByDateInput = z
  .object({
    date: dateStringSchema.optional(),
  })
  .optional();

const saveMorningPlanInput = z.object({
  contextDate: dateStringSchema.optional(),
  priority1: z.string().trim().max(240).optional().nullable(),
  priority2: z.string().trim().max(240).optional().nullable(),
  priority3: z.string().trim().max(240).optional().nullable(),
  smallestNextStep: z.string().trim().max(500).optional().nullable(),
  deprioritizedToday: z.string().trim().max(500).optional().nullable(),
  stateEnergy: z.number().int().min(1).max(5).optional().nullable(),
  stateStress: z.number().int().min(1).max(5).optional().nullable(),
  stateMood: z.number().int().min(1).max(5).optional().nullable(),
  markMorningCheckinComplete: z.boolean().optional(),
});

const routineListInput = z
  .object({
    scheduledDate: dateStringSchema.optional(),
    limit: z.number().int().min(1).max(90).optional(),
  })
  .optional();

const routineRecordInput = z.object({
  eventType: z.enum(ROUTINE_EVENT_TYPES),
  scheduledDate: dateStringSchema.optional(),
  scheduledTimeLocal: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  completionStatus: z.enum(ROUTINE_COMPLETION_STATUSES).optional(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  stress: z.number().int().min(1).max(5).optional().nullable(),
  focus: z.number().int().min(1).max(5).optional().nullable(),
  sleepQuality: z.number().int().min(1).max(5).optional().nullable(),
  medicationStatus: z.string().trim().max(120).optional().nullable(),
  foodText: z.string().trim().max(500).optional().nullable(),
  waterGlasses: z.number().int().min(0).max(20).optional().nullable(),
  reflectionText: z.string().trim().max(1200).optional().nullable(),
  notes: z.string().trim().max(1200).optional().nullable(),
});

const savedItemsListInput = z
  .object({
    status: z.enum(SAVED_ITEM_STATUSES).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    onlyActiveCarryForward: z.boolean().optional(),
  })
  .optional();

const saveThoughtInput = z.object({
  content: z.string().trim().min(1).max(1200),
  itemType: z.enum(SAVED_ITEM_TYPES).optional(),
  targetDate: dateStringSchema.optional().nullable(),
  sourceEventId: z.string().min(1).optional().nullable(),
});

const archiveSavedItemInput = z.object({
  id: z.string().min(1),
});

const historyInput = z
  .object({
    limit: z.number().int().min(1).max(30).optional(),
  })
  .optional();

export function createAntigoneRouter(getStore: () => AntigoneMemoryStore) {
  return router({
    presence: publicProcedure.query(() => getStore().getPresenceSnapshot()),
    profile: router({
      list: publicProcedure.query(() => getStore().listProfileMemory()),
      upsert: publicProcedure.input(profileUpsertInput).mutation(({ input }) => {
        return getStore().upsertProfileMemory(input);
      }),
    }),
    dailyContext: router({
      byDate: publicProcedure.input(dailyContextByDateInput).query(({ input }) => {
        return getStore().getDailyContextByDate(input?.date);
      }),
      saveMorningPlan: publicProcedure.input(saveMorningPlanInput).mutation(({ input }) => {
        return getStore().saveMorningPlan(input);
      }),
    }),
    routine: router({
      list: publicProcedure.input(routineListInput).query(({ input }) => {
        return getStore().listRoutineEvents(input);
      }),
      record: publicProcedure.input(routineRecordInput).mutation(({ input }) => {
        return getStore().recordRoutineEvent(input);
      }),
    }),
    savedItems: router({
      list: publicProcedure.input(savedItemsListInput).query(({ input }) => {
        return getStore().listSavedItems(input);
      }),
      saveThought: publicProcedure.input(saveThoughtInput).mutation(({ input }) => {
        return getStore().saveThought(input);
      }),
      archive: publicProcedure.input(archiveSavedItemInput).mutation(({ input }) => {
        return getStore().archiveSavedItem(input.id);
      }),
    }),
    insights: router({
      history: publicProcedure.input(historyInput).query(({ input }) => {
        return getStore().getHistory(input?.limit);
      }),
    }),
  });
}
