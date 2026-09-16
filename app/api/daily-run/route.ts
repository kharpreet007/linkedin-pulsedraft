import { NextRequest, NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/pipeline/run";
import { todayInTimezone, isValidDateKey } from "@/lib/date";
import { isCronAuthorized } from "@/lib/auth";
import { friendlyGeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam && isValidDateKey(dateParam) ? dateParam : todayInTimezone();
  const force = url.searchParams.get("force") === "true";

  try {
    const result = await runDailyPipeline(date, { force });
    return NextResponse.json(result);
  } catch (err) {
    console.error("daily-run failed", err);
    return NextResponse.json({ error: friendlyGeminiError(err) }, { status: 500 });
  }
}

// Vercel Cron calls this with GET; POST is here too for manual triggers with the same auth.
export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
