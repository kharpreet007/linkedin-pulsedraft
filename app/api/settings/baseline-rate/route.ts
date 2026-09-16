import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const KEY = "baseline_posts_per_week";

export async function GET() {
  const value = await getSetting(KEY);
  return NextResponse.json({ postsPerWeek: value ? Number(value) : null });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const postsPerWeek = Number(body?.postsPerWeek);
  if (!Number.isFinite(postsPerWeek) || postsPerWeek < 0) {
    return NextResponse.json({ error: "postsPerWeek must be a non-negative number" }, { status: 400 });
  }
  await setSetting(KEY, String(postsPerWeek));
  return NextResponse.json({ postsPerWeek });
}
