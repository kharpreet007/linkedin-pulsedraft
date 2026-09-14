import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeRunDetail } from "@/lib/serialize";

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
