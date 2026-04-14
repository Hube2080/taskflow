import { beforeEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { VoiceMemoService } from "./voiceMemos.service";
import { VoiceMemoStore } from "./voiceMemos.store";
import type { VoiceMemoAiClient } from "./voiceMemos.ai";

class FakeAiClient implements VoiceMemoAiClient {
  hasConfig() {
    return true;
  }

  async transcribe(input: { buffer: Buffer; fileName: string; mimeType: string }) {
    return input.buffer.toString("utf8");
  }

  async extractStructure(input: { transcript: string; fileName: string }) {
    return {
      title: `${input.fileName} Titel`,
      summary: input.transcript.includes("Aurora")
        ? "Memo ueber Aurora im Dating-Kontext."
        : "Memo ueber Projektarbeit.",
      topic: input.transcript.includes("Aurora") ? "Dating" : "Arbeit",
      subtopic: input.transcript.includes("Aurora") ? "Aurora" : "Roadmap",
      entities: input.transcript.includes("Aurora")
        ? [{ label: "Aurora", type: "person" as const }]
        : [{ label: "Roadmap", type: "topic" as const }],
      openQuestions: input.transcript.includes("?") ? ["Was ist der naechste Schritt?"] : [],
      searchText: input.transcript.includes("Aurora") ? "dating beziehung aurora" : "arbeit roadmap team",
    };
  }

  async embed(text: string) {
    const normalized = text.toLowerCase();
    if (normalized.includes("aurora")) return [1, 0, 0];
    if (normalized.includes("dating") || normalized.includes("beziehung") || normalized.includes("romance")) {
      return [0, 1, 0];
    }
    return [0, 0, 1];
  }
}

describe("VoiceMemoService", () => {
  let tempDir: string;
  let recordingsDir: string;
  let storePath: string;
  let service: VoiceMemoService;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "voice-memos-"));
    recordingsDir = path.join(tempDir, "Recordings");
    storePath = path.join(tempDir, "voice-memos.json");
    await rm(recordingsDir, { recursive: true, force: true });
    await mkdir(recordingsDir, { recursive: true });
    service = new VoiceMemoService(new VoiceMemoStore(storePath), new FakeAiClient(), recordingsDir);
  });

  it("imports an audio file and stores transcript plus insights", async () => {
    const filePath = path.join(recordingsDir, "memo-a.m4a");
    await writeFile(filePath, "Aurora hat mir gestern geschrieben. Was bedeutet das?", "utf8");

    const result = await service.importFromDirectory();
    const all = await service.list();

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(all).toHaveLength(1);
    expect(all[0]?.status).toBe("completed");
    expect(all[0]?.title).toContain("memo-a.m4a");
    expect(all[0]?.topic).toBe("Dating");
    expect(all[0]?.entities[0]?.label).toBe("Aurora");

    const persisted = JSON.parse(await readFile(storePath, "utf8")) as { memos: Array<{ id: string }> };
    expect(persisted.memos).toHaveLength(1);
  });

  it("deduplicates files with the same hash on repeated import", async () => {
    const filePath = path.join(recordingsDir, "memo-b.m4a");
    await writeFile(filePath, "Aurora und ich sprechen ueber Dating.", "utf8");

    const first = await service.importFromDirectory();
    const second = await service.importFromDirectory();
    const all = await service.list();

    expect(first.imported).toBe(1);
    expect(second.skipped).toBe(1);
    expect(all).toHaveLength(1);
  });

  it("returns semantic matches even without keyword overlap", async () => {
    await writeFile(path.join(recordingsDir, "memo-c.m4a"), "Aurora und ich sprechen ueber Dating.", "utf8");
    await writeFile(path.join(recordingsDir, "memo-d.m4a"), "Roadmap fuer das neue Projekt abstimmen.", "utf8");
    await service.importFromDirectory();

    const results = await service.list("romance");

    expect(results).toHaveLength(1);
    expect(results[0]?.topic).toBe("Dating");
    expect(results[0]?.score).toBeGreaterThan(0);
  });
});
