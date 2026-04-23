import type { VoiceState } from "../../contracts/src/state";

export const DEFAULT_VOICE_RUNTIME: VoiceState = {
  interactionMode: "push_to_talk",
  sessionStatus: "idle",
  provider: "elevenlabs",
  wakeWordEnabled: false,
  visibleProviderSwitching: false,
  pinnedElevenLabsVoiceId: process.env.ANTIGONE_ELEVENLABS_VOICE_ID ?? null,
  updatedAt: new Date(0).toISOString(),
};

export const ELEVENLABS_VOICE_RUNTIME_CONFIG = {
  apiKeyEnv: "ELEVENLABS_API_KEY",
  pinnedVoiceIdEnv: "ANTIGONE_ELEVENLABS_VOICE_ID",
  hardPinnedFemaleVoiceOnly: true,
} as const;
