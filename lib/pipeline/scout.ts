import { getAnthropicClient, ANTHROPIC_MODEL, extractJson } from "@/lib/anthropic";
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
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
    messages: [{ role: "user", content: USER_PROMPT }],
  });

  const text = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n");

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
