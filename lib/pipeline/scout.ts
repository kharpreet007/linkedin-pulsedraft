import { getGeminiClient, GEMINI_MODEL, extractJson } from "@/lib/gemini";
import type { Theme } from "@prisma/client";

export interface ScoutTopic {
  topic: string;
  theme: Theme;
}

const SYSTEM_PROMPT = `You are Scout, a research analyst for a LinkedIn content pipeline aimed at
product managers, AI practitioners, and people interested in workplace/user psychology.
Your job is to find what's genuinely being discussed right now — not generic advice topics.`;

const USER_PROMPT = `Search Reddit, Google, and Quora for discussions trending in the last few days
across three areas: product management, applied/practical AI, and user or workplace psychology.
Look for real threads, complaints, debates, or observations — not press releases or generic "top tips" content.

From what you find, produce exactly 5 candidate topics for today's LinkedIn post, each grounded in a
real discussion or observation you found. Spread them across the three themes (a mix, not all one theme).

Return ONLY a JSON array of exactly 5 objects, nothing else — no preamble, no markdown fence, no commentary:
[{"topic": "<a specific, punchy topic phrased as a post idea>", "theme": "PM" | "AI" | "Psychology"}, ...]`;

export async function runScout(): Promise<ScoutTopic[]> {
  const ai = getGeminiClient();

  // Google Search grounding and forced JSON output can't be combined in one request,
  // so the JSON-only instruction lives in the prompt and gets parsed out below instead.
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: USER_PROMPT,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? "";
  const topics = extractJson<ScoutTopic[]>(text);
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
