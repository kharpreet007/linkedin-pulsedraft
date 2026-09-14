import { NextRequest, NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/pipeline/run";
import { todayInTimezone, isValidDateKey } from "@/lib/date";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet — fine for local dev, set one before deploying
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}

// Vercel Cron calls this with GET; POST is here too for manual triggers with the same auth.
export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
