export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openAIApiKey: process.env.OPENAI_API_KEY ?? "",
  openAIBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAITranscriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1",
  openAIStructuringModel: process.env.OPENAI_STRUCTURING_MODEL ?? "gpt-4o-mini",
  openAIEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  voiceMemosDirectory:
    process.env.VOICE_MEMOS_DIR ??
    "/Users/hubertusvonhaller/Library/CloudStorage/GoogleDrive-hubertus.haller@gmail.com/Meine Ablage/00_ProjectHube/My AI Assistant /Test Sprachmemos",
  voiceMemoStorePath:
    process.env.VOICE_MEMO_STORE_PATH ?? `${process.cwd()}/.taskflow-data/voice-memos.json`,
};
