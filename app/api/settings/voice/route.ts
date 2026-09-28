import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_VOICE, VOICES, type VoiceId } from "@/lib/voices";

export const dynamic = "force-dynamic";

const KEY = "pipeline_voice";
const VALID_IDS = new Set(VOICES.map((v) => v.id));

export async function GET() {
  const value = await getSetting(KEY);
  const voice = value && VALID_IDS.has(value as VoiceId) ? (value as VoiceId) : DEFAULT_VOICE;
  return NextResponse.json({ voice });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const voice = body?.voice;
  if (typeof voice !== "string" || !VALID_IDS.has(voice as VoiceId)) {
    return NextResponse.json({ error: "voice must be one of: " + Array.from(VALID_IDS).join(", ") }, { status: 400 });
  }
  await setSetting(KEY, voice);
  return NextResponse.json({ voice });
}
