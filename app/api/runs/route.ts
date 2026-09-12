import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = await prisma.run.findMany({
    orderBy: { date: "desc" },
    include: {
      candidates: { select: { id: true } },
      postedSelection: { include: { candidate: { include: { score: true } } } },
      engagement: true,
    },
  });

  return NextResponse.json(
    runs.map((run) => ({
      date: run.date,
      candidateCount: run.candidates.length,
      posted: !!run.postedSelection,
      postedSelection: run.postedSelection
        ? {
            candidateId: run.postedSelection.candidateId,
            topic: run.postedSelection.topicOverride ?? run.postedSelection.candidate.topic,
            theme: run.postedSelection.themeOverride ?? run.postedSelection.candidate.theme,
            scoreTotal: run.postedSelection.candidate.score?.total ?? null,
            postedAt: run.postedSelection.postedAt.toISOString(),
          }
        : null,
      engagement: run.engagement
        ? {
            impressions: run.engagement.impressions,
            likes: run.engagement.likes,
            comments: run.engagement.comments,
          }
        : null,
    }))
  );
}
