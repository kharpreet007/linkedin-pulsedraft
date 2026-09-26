import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";
import { isValidDateKey } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * One entry per published post — whether it came from the Scout/Remy/Val pipeline (a Calendar
 * pick) or was hand-written via Write a Post — so every post you've ever published can be found
 * by date in one place. A hand-written post is identified the same way "grounded" is elsewhere
 * in this app: by the absence of a Score row, since Write a Post never creates one.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (date && !isValidDateKey(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const runs = await prisma.run.findMany({
    where: {
      postedSelection: { isNot: null },
      ...(date ? { date } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      postedSelection: { include: { candidate: { include: { score: true } } } },
    },
  });

  const entries = runs
    .filter((run) => run.postedSelection)
    .map((run) => {
      const selection = run.postedSelection!;
      const candidate = selection.candidate;
      const themeKey = selection.categoryOverride ?? candidate.category ?? null;
      return {
        date: run.date,
        topic: selection.topicOverride ?? candidate.topic,
        theme:
          (themeKey ? KANBAN_CATEGORY_LABELS[themeKey] : null) ??
          selection.themeOverride ??
          candidate.theme ??
          "—",
        text: candidate.draft,
        source: candidate.score === null ? ("own" as const) : ("pipeline" as const),
      };
    });

  return NextResponse.json(entries);
}
