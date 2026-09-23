import { getGeminiClient, GEMINI_MODEL, generateContentWithRetry } from "@/lib/gemini";

/** Draft-writing prompt for the Gemini-based daily pipeline (runDailyPipeline). */
export function buildRemyPrompt(topic: string): string {
  return (
    'Write a LinkedIn post about this topic: "' +
    topic +
    '". ' +
    "Style rules, follow exactly: storyteller voice, short line-by-line format with one thought per line " +
    "(each line on its own, separated by a newline), 150-200 words total, no hashtags, no emojis, " +
    "grounded in a concrete specific moment or observation rather than generic advice, " +
    "end with a genuine open-ended question inviting comments. " +
    "Output ONLY the post text, nothing else — no preamble, no quotes, no title."
  );
}

export async function runRemy(topic: string): Promise<string> {
  const ai = getGeminiClient();

  const response = await generateContentWithRetry(ai, {
    model: GEMINI_MODEL,
    contents: buildRemyPrompt(topic),
  });

  const text = (response.text ?? "").trim();
  if (!text) {
    throw new Error(`Remy returned no draft for topic: ${topic}`);
  }
  return text;
}
