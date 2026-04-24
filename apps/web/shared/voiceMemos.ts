/**
 * Legacy note:
 * Shared types for the custom voice-memo workflow. Preserved for compatibility
 * while Antigone's main architecture shifts to the new local-first stack.
 */
export type VoiceMemoStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export type VoiceMemoEntity = {
  label: string;
  type: "person" | "topic" | "organization" | "place" | "other";
};

export type VoiceMemoLink = {
  projectId: string | null;
  ideaId: string | null;
  taskId: string | null;
  linkedAt: string | null;
};

export type VoiceMemoRecord = {
  id: string;
  sourcePath: string;
  fileName: string;
  sourceHash: string;
  fileSizeBytes: number;
  mimeType: string;
  importedAt: string;
  updatedAt: string;
  status: VoiceMemoStatus;
  errorMessage: string | null;
  rawTranscript: string;
  transcript: string;
  title: string;
  summary: string;
  topic: string;
  subtopic: string;
  entities: VoiceMemoEntity[];
  openQuestions: string[];
  searchText: string;
  embedding: number[] | null;
  links: VoiceMemoLink;
};

export type VoiceMemoSearchResult = VoiceMemoRecord & {
  score: number;
};

export type VoiceMemoImportSummary = {
  imported: number;
  skipped: number;
  failed: number;
  totalDiscovered: number;
  processedIds: string[];
};

export type VoiceMemoInsight = {
  title: string;
  summary: string;
  topic: string;
  subtopic: string;
  entities: VoiceMemoEntity[];
  openQuestions: string[];
  searchText: string;
};

export type VoiceMemoRuntimeStatus = {
  directory: string;
  configuredDirectory: string;
  hasDirectoryAccess: boolean;
  hasAiConfig: boolean;
  storePath: string;
  totalMemos: number;
  completedMemos: number;
  failedMemos: number;
  lastImportedAt: string | null;
};
