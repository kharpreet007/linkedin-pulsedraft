import { getAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropic";

/** Same style rules as the original Post Generator prompt — kept in one place so the daily
 *  pipeline and the ad-hoc /api/generate endpoint never drift apart. */
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
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildRemyPrompt(topic) }],
  });

  const text = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error(`Remy returned no draft for topic: ${topic}`);
  }
  return text;
}
