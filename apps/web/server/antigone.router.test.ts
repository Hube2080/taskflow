import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import type { TrpcContext } from "./_core/context";
import { AntigoneMemoryStore } from "./antigoneMemory";
import { createAntigoneRouter } from "./antigone.router";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneDay(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + 1, 12, 0, 0, 0);
  return formatLocalDate(next);
}

describe("antigone router", () => {
  let tempDir: string;
  let store: AntigoneMemoryStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "antigone-router-"));
    store = new AntigoneMemoryStore(path.join(tempDir, "antigone-memory.sqlite"));
  });

  afterEach(async () => {
    store.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists morning planning, routine events, saved thoughts, and presence", async () => {
    const today = formatLocalDate(new Date());
    const tomorrow = addOneDay(today);
    const antigoneRouter = createAntigoneRouter(() => store);
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "http",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => undefined,
      } as TrpcContext["res"],
    };
    const caller = antigoneRouter.createCaller(ctx);

    const morning = await caller.dailyContext.saveMorningPlan({
      contextDate: today,
      priority1: "Make the day legible",
      priority2: "Protect medication timing",
      smallestNextStep: "Open Antigone and decide the next move",
      stateMood: 3,
      stateEnergy: 2,
      stateStress: 4,
    });
    const midday = await caller.routine.record({
      eventType: "midday_checkin",
      scheduledDate: today,
      completionStatus: "completed",
      medicationStatus: "taken",
      waterGlasses: 2,
      foodText: "Sandwich and tea",
      notes: "Calmer after eating.",
    });
    const evening = await caller.routine.record({
      eventType: "evening_reflection",
      scheduledDate: today,
      completionStatus: "completed",
      reflectionText: "The day got easier after the first concrete step.",
      notes: "Keep the startup ritual small.",
    });
    const savedThought = await caller.savedItems.saveThought({
      content: "Review the ritual tomorrow morning",
      itemType: "carry_forward",
      targetDate: tomorrow,
      sourceEventId: evening?.id ?? null,
    });
    const reloadedDailyContext = await caller.dailyContext.byDate({ date: today });
    const routineHistory = await caller.routine.list({ scheduledDate: today, limit: 10 });
    const presence = await caller.presence();
    const savedItems = await caller.savedItems.list({ status: "active", limit: 10 });
    const history = await caller.insights.history({ limit: 7 });

    expect(morning?.priority1).toBe("Make the day legible");
    expect(reloadedDailyContext?.smallestNextStep).toBe("Open Antigone and decide the next move");
    expect(midday?.eventType).toBe("midday_checkin");
    expect(evening?.eventType).toBe("evening_reflection");
    expect(routineHistory.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(["morning_checkin", "midday_checkin", "evening_reflection"])
    );
    expect(savedThought?.content).toBe("Review the ritual tomorrow morning");
    expect(savedItems.some((item) => item.id === savedThought?.id)).toBe(true);
    expect(presence.priorities).toEqual(["Make the day legible", "Protect medication timing"]);
    expect(presence.nextDueRoutine.eventType).toBe("morning_checkin");
    expect(presence.nextDueRoutine.scheduledDate).toBe(tomorrow);
    expect(history.counts.dailyContext).toBe(1);
    expect(history.counts.routineEvents).toBe(3);
    expect(history.counts.savedItems).toBe(1);
  }, 20_000);
});
