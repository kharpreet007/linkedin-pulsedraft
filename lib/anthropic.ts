import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/**
 * Pulls the last balanced {...} or [...] JSON value out of a model response.
 * Models asked for "JSON only" still sometimes wrap it in prose or a code fence.
 */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new Error("No JSON found in model response: " + text.slice(0, 200));
  }
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let end = -1;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === open) depth++;
    else if (candidate[i] === close) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    throw new Error("Unbalanced JSON in model response: " + text.slice(0, 200));
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
