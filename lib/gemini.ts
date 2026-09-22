import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Gemini model names rotate fairly often — override via env if this default 404s.
// Current list: https://ai.google.dev/gemini-api/docs/models
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

type GenerateContentArgs = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /"code"\s*:\s*(503|429)/.test(message) || /UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);
}

/**
 * Gemini's free/shared capacity returns 503 ("model is currently experiencing high demand") or
 * 429 (rate limit) fairly often under normal use, and both tend to clear up within seconds — so
 * retry those a couple of times with backoff before giving up, instead of surfacing a transient
 * blip straight to the user.
 */
export async function generateContentWithRetry(ai: GoogleGenAI, req: GenerateContentArgs) {
  const maxAttempts = 3;
  const baseDelayMs = 4000;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(req);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryableGeminiError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
  throw lastErr;
}

/** Turns Gemini's raw error JSON into something worth showing a user, for overload/rate-limit
 *  cases that survived all retries; anything else is passed through as-is. */
export function friendlyGeminiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/"code"\s*:\s*503/.test(message) || /UNAVAILABLE/i.test(message)) {
    return "Gemini is currently overloaded with requests. This usually clears up within a few minutes — please try again shortly.";
  }
  if (/"code"\s*:\s*429/.test(message) || /RESOURCE_EXHAUSTED/i.test(message)) {
    return "Hit Gemini's rate limit. Wait a minute and try again.";
  }
  return message;
}

/**
 * Pulls the last balanced {...} or [...] JSON value out of a model response.
 * Models asked for "JSON only" still sometimes wrap it in prose or a code fence —
 * this matters especially for Scout, which can't use strict JSON mode because it
 * also uses the googleSearch tool (the two aren't combinable in one request).
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
