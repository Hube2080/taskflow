/**
 * Legacy note:
 * Voice memo ingestion and AI enrichment are preserved as the legacy custom path.
 * This night run does not expand or automate this flow further.
 */
import { createHash, randomUUID } from "crypto";
import { access, readFile, readdir, stat } from "fs/promises";
import path from "path";
import { constants as fsConstants } from "fs";
import type {
  VoiceMemoImportSummary,
  VoiceMemoInsight,
  VoiceMemoRecord,
  VoiceMemoRuntimeStatus,
  VoiceMemoSearchResult,
} from "@shared/voiceMemos";
import { ENV } from "./_core/env";
import type { VoiceMemoAiClient } from "./voiceMemos.ai";
import { OpenAiVoiceMemoClient } from "./voiceMemos.ai";
import { VoiceMemoStore } from "./voiceMemos.store";

const AUDIO_EXTENSIONS = new Set([".m4a", ".mp3", ".wav", ".mp4", ".mpeg", ".webm", ".ogg"]);

function inferMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".m4a":
      return "audio/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".webm":
      return "audio/webm";
    case ".mp4":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let index = 0; index < a.length; index++) {
    dot += a[index]! * b[index]!;
    magA += a[index]! * a[index]!;
    magB += b[index]! * b[index]!;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function scoreKeywordMatch(record: VoiceMemoRecord, query: string) {
  const haystacks = [
    record.title,
    record.summary,
    record.topic,
    record.subtopic,
    record.transcript,
    record.searchText,
    ...record.entities.map((entity) => entity.label),
  ]
    .join("\n")
    .toLowerCase();

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;
  if (!haystacks.includes(normalizedQuery)) return 0;
  const occurrences = haystacks.split(normalizedQuery).length - 1;
  return Math.min(1, 0.25 + occurrences * 0.15);
}

function buildSearchText(transcript: string, insight: VoiceMemoInsight) {
  return [
    insight.title,
    insight.summary,
    insight.topic,
    insight.subtopic,
    insight.searchText,
    ...insight.entities.map((entity) => entity.label),
    transcript,
  ]
    .filter(Boolean)
    .join("\n");
}

async function fileExistsReadable(targetPath: string) {
  try {
    await access(targetPath, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export class VoiceMemoService {
  constructor(
    private readonly store = new VoiceMemoStore(ENV.voiceMemoStorePath),
    private readonly aiClient: VoiceMemoAiClient = new OpenAiVoiceMemoClient(),
    private readonly configuredDirectory = ENV.voiceMemosDirectory
  ) {}

  get storePath() {
    return this.store.path;
  }

  get directory() {
    return this.configuredDirectory;
  }

  async getStatus(): Promise<VoiceMemoRuntimeStatus> {
    const memos = await this.store.list();
    return {
      directory: this.configuredDirectory,
      configuredDirectory: this.configuredDirectory,
      hasDirectoryAccess: await fileExistsReadable(this.configuredDirectory),
      hasAiConfig: this.aiClient.hasConfig(),
      storePath: this.store.path,
      totalMemos: memos.length,
      completedMemos: memos.filter((memo) => memo.status === "completed").length,
      failedMemos: memos.filter((memo) => memo.status === "failed").length,
      lastImportedAt: memos[0]?.importedAt ?? null,
    };
  }

  async list(query?: string): Promise<VoiceMemoSearchResult[]> {
    const records = await this.store.list();
    return this.rankRecords(records, query);
  }

  async getById(id: string): Promise<VoiceMemoRecord | null> {
    return this.store.getById(id);
  }

  async link(input: { memoId: string; projectId?: string | null; ideaId?: string | null; taskId?: string | null }) {
    const now = new Date().toISOString();
    return this.store.update(input.memoId, (current) => ({
      ...current,
      updatedAt: now,
      links: {
        projectId: input.projectId ?? current.links.projectId,
        ideaId: input.ideaId ?? current.links.ideaId,
        taskId: input.taskId ?? current.links.taskId,
        linkedAt: now,
      },
    }));
  }

  async importFromDirectory(directory = this.configuredDirectory): Promise<VoiceMemoImportSummary> {
    const hasAccess = await fileExistsReadable(directory);
    if (!hasAccess) {
      throw new Error(`Voice memo directory is not readable: ${directory}`);
    }
    if (!this.aiClient.hasConfig()) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const entries = await readdir(directory);
    const audioFiles = entries
      .filter((entry) => AUDIO_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "de"));

    const result: VoiceMemoImportSummary = {
      imported: 0,
      skipped: 0,
      failed: 0,
      totalDiscovered: audioFiles.length,
      processedIds: [],
    };

    for (const fileName of audioFiles) {
      const fullPath = path.join(directory, fileName);
      try {
        const processed = await this.processImport(fullPath);
        result.processedIds.push(processed.record.id);
        if (processed.outcome === "skipped") {
          result.skipped += 1;
        } else if (processed.outcome === "failed") {
          result.failed += 1;
        } else {
          result.imported += 1;
        }
      } catch {
        result.failed += 1;
      }
    }

    return result;
  }

  async importFile(sourcePath: string): Promise<VoiceMemoRecord> {
    const processed = await this.processImport(sourcePath);
    return processed.record;
  }

  private async processImport(
    sourcePath: string
  ): Promise<{ record: VoiceMemoRecord; outcome: "imported" | "skipped" | "failed" }> {
    const [stats, buffer] = await Promise.all([stat(sourcePath), readFile(sourcePath)]);
    const sourceHash = createHash("sha256").update(buffer).digest("hex");
    const existing = await this.store.findByHash(sourceHash);
    if (existing) {
      return { record: existing, outcome: "skipped" };
    }

    const now = new Date().toISOString();
    const pendingRecord: VoiceMemoRecord = {
      id: `memo_${randomUUID()}`,
      sourcePath,
      fileName: path.basename(sourcePath),
      sourceHash,
      fileSizeBytes: stats.size,
      mimeType: inferMimeType(sourcePath),
      importedAt: now,
      updatedAt: now,
      status: "processing",
      errorMessage: null,
      rawTranscript: "",
      transcript: "",
      title: "",
      summary: "",
      topic: "",
      subtopic: "",
      entities: [],
      openQuestions: [],
      searchText: "",
      embedding: null,
      links: {
        projectId: null,
        ideaId: null,
        taskId: null,
        linkedAt: null,
      },
    };
    await this.store.save(pendingRecord);

    try {
      const transcript = await this.aiClient.transcribe({
        buffer,
        fileName: pendingRecord.fileName,
        mimeType: pendingRecord.mimeType,
      });
      const insight = await this.aiClient.extractStructure({
        transcript,
        fileName: pendingRecord.fileName,
      });
      const searchText = buildSearchText(transcript, insight);
      const embedding = await this.aiClient.embed(searchText);
      const completedRecord: VoiceMemoRecord = {
        ...pendingRecord,
        updatedAt: new Date().toISOString(),
        status: "completed",
        rawTranscript: transcript,
        transcript,
        title: insight.title || pendingRecord.fileName,
        summary: insight.summary,
        topic: insight.topic,
        subtopic: insight.subtopic,
        entities: insight.entities,
        openQuestions: insight.openQuestions,
        searchText,
        embedding,
      };
      await this.store.save(completedRecord);
      return { record: completedRecord, outcome: "imported" };
    } catch (error) {
      const failedRecord: VoiceMemoRecord = {
        ...pendingRecord,
        updatedAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown import error",
      };
      await this.store.save(failedRecord);
      return { record: failedRecord, outcome: "failed" };
    }
  }

  private async rankRecords(records: VoiceMemoRecord[], query?: string): Promise<VoiceMemoSearchResult[]> {
    const normalizedQuery = query?.trim() ?? "";
    if (!normalizedQuery) {
      return records.map((record) => ({ ...record, score: 1 }));
    }

    let queryEmbedding: number[] | null = null;
    if (this.aiClient.hasConfig()) {
      try {
        queryEmbedding = await this.aiClient.embed(normalizedQuery);
      } catch {
        queryEmbedding = null;
      }
    }

    return records
      .map((record) => {
        const keywordScore = scoreKeywordMatch(record, normalizedQuery);
        const embeddingScore =
          queryEmbedding && record.embedding ? Math.max(0, cosineSimilarity(queryEmbedding, record.embedding)) : 0;
        const score = Math.max(keywordScore, embeddingScore);
        return {
          ...record,
          score,
        };
      })
      .filter((record) => record.score > 0)
      .sort((a, b) => b.score - a.score || b.importedAt.localeCompare(a.importedAt));
  }
}

export const voiceMemoService = new VoiceMemoService();
