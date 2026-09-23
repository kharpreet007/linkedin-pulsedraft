import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDateKey } from "@/lib/date";

export const dynamic = "force-dynamic";

function deriveTopic(draft: string): string {
  const firstLine = draft.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  return firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine || "Untitled post";
}

/**
 * Publishes a hand-written post for a date, bypassing Scout/Remy/Val entirely — for the days
 * you'd rather write your own post than pick one of the generated candidates. Creates (or reuses)
 * that date's Run, adds the text as a new unscored Candidate, and makes it the day's
 * PostedSelection, replacing whatever was posted there before.
 */
export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  if (!isValidDateKey(params.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const draft = typeof body?.draft === "string" ? body.draft.trim() : "";
  if (!draft) {
    return NextResponse.json({ error: "draft is required" }, { status: 400 });
  }
  const topic = typeof body?.topic === "string" && body.topic.trim() ? body.topic.trim() : deriveTopic(draft);

  const run = await prisma.run.upsert({
    where: { date: params.date },
    create: { date: params.date },
    update: {},
  });

  const candidate = await prisma.candidate.create({
    data: { runId: run.id, topic, draft },
  });

  const selection = await prisma.postedSelection.upsert({
    where: { runId: run.id },
    create: { runId: run.id, candidateId: candidate.id },
    update: { candidateId: candidate.id, topicOverride: null, themeOverride: null },
  });

  return NextResponse.json({ date: run.date, candidateId: selection.candidateId });
}
