import { NextRequest, NextResponse } from "next/server";
import { runRemy } from "@/lib/pipeline/remy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const topic = body?.topic;
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  try {
    const draft = await runRemy(topic.trim());
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("generate failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate a draft right now. Try again." },
      { status: 500 }
    );
  }
}
