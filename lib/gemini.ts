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
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
