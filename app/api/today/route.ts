import { NextResponse } from "next/server";
import { todayInTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ date: todayInTimezone() });
}
