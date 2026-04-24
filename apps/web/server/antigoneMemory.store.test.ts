import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { AntigoneMemoryStore } from "./antigoneMemory";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("AntigoneMemoryStore", () => {
  let tempDir: string;
  let storePath: string;
  let store: AntigoneMemoryStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "antigone-memory-"));
    storePath = path.join(tempDir, "antigone-memory.sqlite");
    store = new AntigoneMemoryStore(storePath);
  });

  afterEach(async () => {
    store.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("bootstraps schema and upserts morning planning by date", () => {
    const first = store.saveMorningPlan({
      contextDate: "2026-04-23",
      priority1: "Stabilize the day",
      smallestNextStep: "Open the dashboard",
      stateMood: 3,
      stateEnergy: 2,
      stateStress: 4,
    });
    const second = store.saveMorningPlan({
      contextDate: "2026-04-23",
      priority1: "Ship the memory layer",
      priority2: "Keep the scope calm",
      smallestNextStep: "Review the Antigone route",
      stateMood: 4,
      stateEnergy: 3,
      stateStress: 2,
    });

    expect(first?.morningPlanningCompleted).toBe(true);
    expect(second?.priority1).toBe("Ship the memory layer");
    expect(second?.priority2).toBe("Keep the scope calm");
    expect(store.getHistory().counts.dailyContext).toBe(1);

    const morningEvents = store
      .listRoutineEvents({ scheduledDate: "2026-04-23", limit: 10 })
      .filter((event) => event.eventType === "morning_checkin");

    expect(morningEvents).toHaveLength(1);
    expect(morningEvents[0]?.completionStatus).toBe("completed");
  });

  it("appends routine events, profile memory, and saved thoughts", () => {
    store.upsertProfileMemory({
      memoryType: "preferred_voice_tone",
      label: "Default tone",
      valueText: "Calm, clear, low-shame",
    });
    store.recordRoutineEvent({
      eventType: "midday_checkin",
      scheduledDate: "2026-04-23",
      completionStatus: "completed",
      medicationStatus: "taken",
      waterGlasses: 3,
      foodText: "Lunch and fruit",
    });
    store.recordRoutineEvent({
      eventType: "evening_reflection",
      scheduledDate: "2026-04-23",
      completionStatus: "completed",
      reflectionText: "The smallest next step helped.",
    });
    store.saveThought({
      content: "Save this thought for tomorrow",
      itemType: "carry_forward",
      targetDate: "2026-04-24",
    });

    const history = store.getHistory();

    expect(history.counts.profileMemory).toBe(1);
    expect(history.counts.routineEvents).toBe(2);
    expect(history.counts.savedItems).toBe(1);
    expect(history.recentSavedItems[0]?.itemType).toBe("carry_forward");
    expect(history.recentRoutineEvents.some((event) => event.eventType === "midday_checkin")).toBe(true);
    expect(history.recentRoutineEvents.some((event) => event.eventType === "evening_reflection")).toBe(true);
  });

  it("derives presence from stored history and next due routine", () => {
    store.saveMorningPlan({
      contextDate: "2026-04-23",
      priority1: "Protect focus",
      priority2: "Take meds on time",
      smallestNextStep: "Answer one important message",
      stateMood: 3,
      stateEnergy: 3,
      stateStress: 2,
    });
    store.recordRoutineEvent({
      eventType: "midday_checkin",
      scheduledDate: "2026-04-23",
      completionStatus: "completed",
      medicationStatus: "taken",
    });
    store.saveThought({
      content: "Carry the kind phrasing into tomorrow",
      targetDate: "2026-04-23",
    });

    const snapshot = store.getPresenceSnapshot(new Date(2026, 3, 23, 14, 30));

    expect(snapshot.priorities).toEqual(["Protect focus", "Take meds on time"]);
    expect(snapshot.smallestNextStep).toBe("Answer one important message");
    expect(snapshot.nextDueRoutine.eventType).toBe("evening_reflection");
    expect(snapshot.relevantSavedItem?.content).toBe("Carry the kind phrasing into tomorrow");

    store.recordRoutineEvent({
      eventType: "evening_reflection",
      scheduledDate: "2026-04-23",
      completionStatus: "completed",
      reflectionText: "Closed the day cleanly.",
    });

    const closedDaySnapshot = store.getPresenceSnapshot(new Date(2026, 3, 23, 22, 0));
    expect(closedDaySnapshot.nextDueRoutine.eventType).toBe("morning_checkin");
    expect(closedDaySnapshot.nextDueRoutine.scheduledDate).toBe("2026-04-24");
  });

  it("uses the local date by default for unscheduled writes", () => {
    const today = formatLocalDate(new Date());
    store.saveThought({ content: "Untargeted quick capture" });
    store.recordRoutineEvent({ eventType: "midday_checkin" });

    const routine = store.listRoutineEvents({ scheduledDate: today, limit: 5 });
    const saved = store.listSavedItems({ status: "active", limit: 5 });

    expect(routine[0]?.scheduledDate).toBe(today);
    expect(saved[0]?.content).toBe("Untargeted quick capture");
  });
});
