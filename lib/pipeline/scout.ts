import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL, generateContentWithRetry } from "@/lib/gemini";
import type { Theme } from "@prisma/client";

export interface ScoutTopic {
  topic: string;
  theme: Theme;
}

const SYSTEM_PROMPT = `You are Scout, a research analyst for a LinkedIn content pipeline aimed at
product managers, AI practitioners, and people interested in workplace/user psychology.
Your job is to brainstorm what's genuinely worth discussing right now — not generic advice topics.`;

const USER_PROMPT = `Brainstorm discussion topics across three areas: product management,
applied/practical AI, and user or workplace psychology. Think about real complaints, debates, or
observations people in these fields tend to have — not press releases or generic "top tips" content.

Produce exactly 5 candidate topics for today's LinkedIn post, each phrased as a specific, punchy
post idea grounded in a concrete scenario rather than an abstract concept. Spread them across the
three themes (a mix, not all one theme).`;

export async function runScout(): Promise<ScoutTopic[]> {
  const ai = getGeminiClient();

  const response = await generateContentWithRetry(ai, {
    model: GEMINI_MODEL,
    contents: USER_PROMPT,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            theme: { type: Type.STRING, enum: ["PM", "AI", "Psychology"] },
          },
          required: ["topic", "theme"],
        },
      },
    },
  });

  const text = response.text ?? "";
  let topics: ScoutTopic[];
  try {
    topics = JSON.parse(text) as ScoutTopic[];
  } catch {
    throw new Error("Scout returned invalid JSON: " + text.slice(0, 200));
  }

  if (!Array.isArray(topics) || topics.length !== 5) {
    throw new Error(
      `Scout returned ${Array.isArray(topics) ? topics.length : "a non-array"} topics, expected 5`
    );
  }

  return topics.map((t) => ({ topic: String(t.topic).trim(), theme: normalizeTheme(t.theme) }));
}

function normalizeTheme(value: unknown): Theme {
  const s = String(value).trim().toLowerCase();
  if (s === "ai") return "AI";
  if (s === "psychology") return "Psychology";
  return "PM";
}
