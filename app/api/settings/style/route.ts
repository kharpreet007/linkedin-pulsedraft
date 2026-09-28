import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_STYLE, STYLES, type StyleId } from "@/lib/styles";

export const dynamic = "force-dynamic";

const KEY = "pipeline_style";
const VALID_IDS = new Set(STYLES.map((s) => s.id));

export async function GET() {
  const value = await getSetting(KEY);
  const style = value && VALID_IDS.has(value as StyleId) ? (value as StyleId) : DEFAULT_STYLE;
  return NextResponse.json({ style });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const style = body?.style;
  if (typeof style !== "string" || !VALID_IDS.has(style as StyleId)) {
    return NextResponse.json({ error: "style must be one of: " + Array.from(VALID_IDS).join(", ") }, { status: 400 });
  }
  await setSetting(KEY, style);
  return NextResponse.json({ style });
}
