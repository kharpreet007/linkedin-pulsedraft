import { getGeminiClient, GEMINI_MODEL, generateContentWithRetry } from "@/lib/gemini";
import { getVoice, type VoiceId } from "@/lib/voices";
import { getStyle, type StyleId } from "@/lib/styles";

/** Draft-writing prompt for the Gemini-based daily pipeline (runDailyPipeline). Voice controls tone
 *  (who's "speaking" and how they open/close); Style controls structure (how the post is shaped) —
 *  the two are independent dials, so any combination is valid even if some pair more naturally. */
export function buildRemyPrompt(topic: string, voiceId: VoiceId, styleId: StyleId): string {
  const voice = getVoice(voiceId);
  const style = getStyle(styleId);
  return (
    'Write a LinkedIn post about this topic: "' +
    topic +
    '". ' +
    `Voice rules, follow exactly: ${voice.instruction} ` +
    `Structure rules, follow exactly: ${style.instruction} ` +
    "Also: 150-200 words total, no hashtags, no emojis. " +
    "Output ONLY the post text, nothing else — no preamble, no quotes, no title."
  );
}

export async function runRemy(topic: string, voiceId: VoiceId, styleId: StyleId): Promise<string> {
  const ai = getGeminiClient();

  const response = await generateContentWithRetry(ai, {
    model: GEMINI_MODEL,
    contents: buildRemyPrompt(topic, voiceId, styleId),
  });

  const text = (response.text ?? "").trim();
  if (!text) {
    throw new Error(`Remy returned no draft for topic: ${topic}`);
  }
  return text;
}
