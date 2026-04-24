import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { VoiceMemoRecord } from "@shared/voiceMemos";

type VoiceMemoStoreShape = {
  memos: VoiceMemoRecord[];
};

const EMPTY_STORE: VoiceMemoStoreShape = {
  memos: [],
};

export class VoiceMemoStore {
  constructor(private readonly storePath: string) {}

  get path() {
    return this.storePath;
  }

  async list(): Promise<VoiceMemoRecord[]> {
    const data = await this.read();
    return [...data.memos].sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }

  async getById(id: string): Promise<VoiceMemoRecord | null> {
    const data = await this.read();
    return data.memos.find((memo) => memo.id === id) ?? null;
  }

  async findByHash(sourceHash: string): Promise<VoiceMemoRecord | null> {
    const data = await this.read();
    return data.memos.find((memo) => memo.sourceHash === sourceHash) ?? null;
  }

  async save(record: VoiceMemoRecord): Promise<VoiceMemoRecord> {
    const data = await this.read();
    const index = data.memos.findIndex((memo) => memo.id === record.id);

    if (index >= 0) {
      data.memos[index] = record;
    } else {
      data.memos.push(record);
    }

    await this.write(data);
    return record;
  }

  async update(
    id: string,
    updater: (current: VoiceMemoRecord) => VoiceMemoRecord
  ): Promise<VoiceMemoRecord> {
    const data = await this.read();
    const index = data.memos.findIndex((memo) => memo.id === id);
    if (index < 0) {
      throw new Error(`Voice memo ${id} not found`);
    }

    const next = updater(data.memos[index]!);
    data.memos[index] = next;
    await this.write(data);
    return next;
  }

  private async read(): Promise<VoiceMemoStoreShape> {
    try {
      const raw = await readFile(this.storePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<VoiceMemoStoreShape>;
      return {
        memos: Array.isArray(parsed.memos) ? parsed.memos : [],
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return EMPTY_STORE;
      }
      throw error;
    }
  }

  private async write(data: VoiceMemoStoreShape): Promise<void> {
    await mkdir(path.dirname(this.storePath), { recursive: true });
    const tmpPath = `${this.storePath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
    await rename(tmpPath, this.storePath);
  }
}
