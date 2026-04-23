import type {
  MorningPlanningInput,
  PresenceSnapshot,
  RoutineEventInput,
} from "./memory";

export const AURA_STATES = [
  "grounded",
  "steady",
  "focused",
  "stretched",
  "tender",
  "recovery",
] as const;

export const AURA_INTENSITIES = ["low", "medium", "high"] as const;

export const VOICE_INTERACTION_MODES = ["tap_to_talk", "push_to_talk"] as const;
export const VOICE_SESSION_STATUSES = [
  "idle",
  "listening",
  "transcribing",
  "thinking",
  "speaking",
  "error",
] as const;
export const VOICE_PROVIDERS = ["system", "elevenlabs"] as const;

export type AuraState = (typeof AURA_STATES)[number];
export type AuraIntensity = (typeof AURA_INTENSITIES)[number];
export type VoiceInteractionMode = (typeof VOICE_INTERACTION_MODES)[number];
export type VoiceSessionStatus = (typeof VOICE_SESSION_STATUSES)[number];
export type VoiceProvider = (typeof VOICE_PROVIDERS)[number];

export type AuraStateSnapshot = {
  state: AuraState;
  intensity: AuraIntensity;
  summary: string | null;
  updatedAt: string;
};

export type VoiceState = {
  interactionMode: VoiceInteractionMode;
  sessionStatus: VoiceSessionStatus;
  provider: VoiceProvider;
  wakeWordEnabled: boolean;
  visibleProviderSwitching: boolean;
  pinnedElevenLabsVoiceId: string | null;
  updatedAt: string;
};

export type MorningPlanningPayload = MorningPlanningInput;
export type RoutineEventPayload = RoutineEventInput;
export type PresenceSummaryPayload = PresenceSnapshot;
