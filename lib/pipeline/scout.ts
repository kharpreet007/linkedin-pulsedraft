import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import type { Theme, KanbanCategory } from "@prisma/client";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";

export interface ScoutTopic {
  topic: string;
  theme: Theme;
}

export interface ScoutCategoryTopic {
  topic: string;
  category: KanbanCategory;
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

  const response = await ai.models.generateContent({
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

/**
 * Same shape as `runScout`, but for the Calendar's per-date generation flow: instead of the fixed
 * PM/AI/Psychology split, topics are brainstormed only within the subject areas the user picked
 * from the Post Its category list.
 */
export async function runScoutByCategories(categories: KanbanCategory[]): Promise<ScoutCategoryTopic[]> {
  if (categories.length === 0) {
    throw new Error("At least one category is required");
  }
  const ai = getGeminiClient();
  const labels = categories.map((c) => KANBAN_CATEGORY_LABELS[c]);

  const systemPrompt = `You are Scout, a research analyst for a LinkedIn content pipeline.
Your job is to brainstorm what's genuinely worth discussing right now within the given subject
areas — not generic advice topics.`;

  const userPrompt = `Brainstorm LinkedIn post topics across these subject areas: ${labels.join(", ")}.

Produce exactly 5 candidate topics for today's LinkedIn post, each phrased as a specific, punchy
post idea grounded in a concrete scenario rather than an abstract concept. Spread them across the
given subject areas as evenly as makes sense (repeat an area if there are fewer than 5 areas).`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            category: { type: Type.STRING, enum: categories },
          },
          required: ["topic", "category"],
        },
      },
    },
  });

  const text = response.text ?? "";
  let topics: ScoutCategoryTopic[];
  try {
    topics = JSON.parse(text) as ScoutCategoryTopic[];
  } catch {
    throw new Error("Scout returned invalid JSON: " + text.slice(0, 200));
  }

  if (!Array.isArray(topics) || topics.length !== 5) {
    throw new Error(
      `Scout returned ${Array.isArray(topics) ? topics.length : "a non-array"} topics, expected 5`
    );
  }

  return topics.map((t) => ({
    topic: String(t.topic).trim(),
    category: categories.includes(t.category) ? t.category : categories[0],
  }));
}
