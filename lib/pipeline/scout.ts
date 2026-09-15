import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { fetchTrendingRedditThreads } from "./reddit";
import type { Theme } from "@prisma/client";

export interface ScoutTopic {
  topic: string;
  theme: Theme;
}

const SYSTEM_PROMPT = `You are Scout, a research analyst for a LinkedIn content pipeline aimed at
product managers, AI practitioners, and people interested in workplace/user psychology.
Your job is to turn real, currently-trending Reddit discussions into sharp LinkedIn post topics —
not generic advice topics.`;

function buildPrompt(threads: { theme: Theme; subreddit: string; title: string }[]): string {
  const listing = threads
    .map((t) => `[${t.theme}] r/${t.subreddit}: "${t.title}"`)
    .join("\n");

  return `Here are real threads currently hot on Reddit across product management, AI, and
workplace/user psychology:

${listing}

From these, produce exactly 5 candidate topics for today's LinkedIn post. Each topic must be
grounded in one of the threads above (don't invent unrelated ideas), phrased as a specific, punchy
post idea rather than the raw thread title. Spread the 5 across the three themes (a mix, not all
one theme).`;
}

export async function runScout(): Promise<ScoutTopic[]> {
  const threads = await fetchTrendingRedditThreads();
  if (threads.length === 0) {
    throw new Error("Reddit returned no threads to scout from");
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(threads),
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
