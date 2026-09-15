import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeRunDetail } from "@/lib/serialize";
import { isCronAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const run = await prisma.run.findUnique({
    where: { date: params.date },
    include: {
      candidates: { include: { score: true } },
      postedSelection: { include: { candidate: true } },
      engagement: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "No run for that date" }, { status: 404 });
  }

  return NextResponse.json(serializeRunDetail(run));
}

/** Deletes a date's Run (and its candidates/scores/posted selection/engagement, via cascade). */
export async function DELETE(req: NextRequest, { params }: { params: { date: string } }) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await prisma.run.findUnique({ where: { date: params.date } });
  if (!run) {
    return NextResponse.json({ error: "No run for that date" }, { status: 404 });
  }

  await prisma.run.delete({ where: { id: run.id } });
  return NextResponse.json({ ok: true });
}
