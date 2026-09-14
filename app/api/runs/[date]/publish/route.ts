import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  const body = await req.json().catch(() => null);
  const candidateId = body?.candidateId;
  if (!candidateId || typeof candidateId !== "string") {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { date: params.date } });
  if (!run) {
    return NextResponse.json({ error: "No run for that date" }, { status: 404 });
  }

  const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, runId: run.id } });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate does not belong to that run" }, { status: 400 });
  }

  const selection = await prisma.postedSelection.upsert({
    where: { runId: run.id },
    create: { runId: run.id, candidateId },
    // switching the pick clears any manual topic/theme edits made against the previous one
    update: { candidateId, topicOverride: null, themeOverride: null },
  });

  return NextResponse.json({ candidateId: selection.candidateId });
}
