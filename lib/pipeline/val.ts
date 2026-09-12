import { getGeminiClient, GEMINI_MODEL, extractJson } from "@/lib/gemini";

export interface ValCandidateInput {
  index: number;
  topic: string;
  draft: string;
}

export interface ValScore {
  index: number;
  hook: number;
  insight: number;
  authenticity: number;
  engagement: number;
  clarity: number;
}

export async function runVal(candidates: ValCandidateInput[]): Promise<ValScore[]> {
  const ai = getGeminiClient();

  const prompt = `You are Val, a rigorous editor scoring LinkedIn post drafts before publication.
Score each of the following ${candidates.length} drafts on five dimensions, 0-10 each (integers only):
Hook (does the first line earn a click), Insight (is there a real, non-obvious idea), Authenticity
(does it read as a genuine specific moment, not generic advice), Engagement (does it invite real comments),
Clarity (is it easy to follow). Be discriminating — scores should meaningfully differ between drafts that
differ in quality, not cluster at the same value.

${candidates
  .map((c) => `--- Draft ${c.index} ---\nTopic: ${c.topic}\n${c.draft}`)
  .join("\n\n")}

Return a JSON array with exactly ${candidates.length} objects, one per draft, in this shape:
[{"index": number, "hook": number, "insight": number, "authenticity": number, "engagement": number, "clarity": number}, ...]`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  let scores: ValScore[];
  try {
    scores = JSON.parse(text) as ValScore[];
  } catch {
    scores = extractJson<ValScore[]>(text);
  }

  if (!Array.isArray(scores) || scores.length !== candidates.length) {
    throw new Error(
      `Val returned ${Array.isArray(scores) ? scores.length : "a non-array"} scores, expected ${candidates.length}`
    );
  }

  return scores.map((s) => ({
    index: Number(s.index),
    hook: clampScore(s.hook),
    insight: clampScore(s.insight),
    authenticity: clampScore(s.authenticity),
    engagement: clampScore(s.engagement),
    clarity: clampScore(s.clarity),
  }));
}

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 0;
}
