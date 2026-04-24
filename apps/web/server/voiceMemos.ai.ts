/**
 * Legacy note:
 * This OpenAI-backed memo pipeline is part of the older custom assistant stack.
 * Keep it stable for now, but treat it as legacy while Antigone moves toward
 * local-model orchestration through Ollama, Open WebUI, and Home Assistant.
 */
import { basename } from "path";
import type { VoiceMemoEntity, VoiceMemoInsight } from "@shared/voiceMemos";
import { ENV } from "./_core/env";

type OpenAIChatMessage = {
  role: "system" | "user";
  content: string;
};

export type VoiceMemoAiClient = {
  hasConfig(): boolean;
  transcribe(input: { buffer: Buffer; fileName: string; mimeType: string }): Promise<string>;
  extractStructure(input: { transcript: string; fileName: string }): Promise<VoiceMemoInsight>;
  embed(text: string): Promise<number[]>;
};

const STRUCTURE_SCHEMA = {
  name: "voice_memo_insight",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      topic: { type: "string" },
      subtopic: { type: "string" },
      entities: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            type: {
              type: "string",
              enum: ["person", "topic", "organization", "place", "other"],
            },
          },
          required: ["label", "type"],
        },
      },
      openQuestions: {
        type: "array",
        items: { type: "string" },
      },
      searchText: { type: "string" },
    },
    required: ["title", "summary", "topic", "subtopic", "entities", "openQuestions", "searchText"],
  },
} as const;

function resolveBaseUrl() {
  return ENV.openAIBaseUrl.replace(/\/$/, "");
}

function resolveApiKey() {
  return ENV.openAIApiKey;
}

function normalizeEntityType(value: string): VoiceMemoEntity["type"] {
  if (value === "person" || value === "topic" || value === "organization" || value === "place") {
    return value;
  }
  return "other";
}

async function callJson<T>(pathname: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${resolveBaseUrl()}${pathname}`, init);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `OpenAI request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
    );
  }
  return (await response.json()) as T;
}

export class OpenAiVoiceMemoClient implements VoiceMemoAiClient {
  hasConfig() {
    return Boolean(resolveApiKey());
  }

  async transcribe(input: { buffer: Buffer; fileName: string; mimeType: string }) {
    if (!this.hasConfig()) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const form = new FormData();
    const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimeType });
    form.append("file", blob, basename(input.fileName));
    form.append("model", ENV.openAITranscriptionModel);

    const response = await fetch(`${resolveBaseUrl()}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resolveApiKey()}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `OpenAI transcription failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    const data = (await response.json()) as { text?: string };
    if (!data.text?.trim()) {
      throw new Error("OpenAI transcription response did not include text");
    }
    return data.text.trim();
  }

  async extractStructure(input: { transcript: string; fileName: string }) {
    if (!this.hasConfig()) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const payload = {
      model: ENV.openAIStructuringModel,
      messages: [
        {
          role: "system",
          content:
            "You analyze voice memo transcripts for a personal knowledge assistant. Return concise, specific metadata in German when possible.",
        },
        {
          role: "user",
          content: [
            `Dateiname: ${input.fileName}`,
            "Erstelle daraus einen prägnanten Titel, eine kurze Zusammenfassung, Thema, Unterthema, relevante Entitäten, offene Fragen und kompakten Suchtext.",
            "Wenn etwas unklar ist, bleibe vorsichtig und erfinde keine Fakten.",
            "",
            input.transcript,
          ].join("\n"),
        },
      ] satisfies OpenAIChatMessage[],
      response_format: {
        type: "json_schema",
        json_schema: STRUCTURE_SCHEMA,
      },
    };

    const data = await callJson<{
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }>("/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolveApiKey()}`,
      },
      body: JSON.stringify(payload),
    });

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI structuring response did not include content");
    }

    const parsed = JSON.parse(content) as VoiceMemoInsight;
    return {
      title: parsed.title.trim(),
      summary: parsed.summary.trim(),
      topic: parsed.topic.trim(),
      subtopic: parsed.subtopic.trim(),
      entities: parsed.entities.map((entity) => ({
        label: entity.label.trim(),
        type: normalizeEntityType(entity.type),
      })),
      openQuestions: parsed.openQuestions.map((question) => question.trim()).filter(Boolean),
      searchText: parsed.searchText.trim(),
    };
  }

  async embed(text: string) {
    if (!this.hasConfig()) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const data = await callJson<{
      data?: Array<{
        embedding?: number[];
      }>;
    }>("/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolveApiKey()}`,
      },
      body: JSON.stringify({
        model: ENV.openAIEmbeddingModel,
        input: text,
      }),
    });

    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("OpenAI embedding response did not include a vector");
    }
    return embedding;
  }
}
