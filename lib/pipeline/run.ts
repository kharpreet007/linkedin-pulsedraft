import { prisma } from "@/lib/db";
import { runScout } from "./scout";
import { runRemy } from "./remy";
import { runVal } from "./val";
import type { KanbanCategory, Theme } from "@prisma/client";

export interface DailyRunResult {
  date: string;
  created: boolean;
}

// Spaces out Gemini calls to stay under low per-minute rate limits on free-tier API keys.
const GEMINI_CALL_GAP_MS = 3000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RankedCandidateInput {
  topic: string;
  theme?: Theme | null;
  category?: KanbanCategory | null;
  draft: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  score: {
    hook: number;
    insight: number;
    authenticity: number;
    engagement: number;
    clarity: number;
  };
}

/**
 * Shared persistence step for both ways a day's 5 candidates get created (the automatic daily
 * pipeline, and the ingest endpoint for externally-generated content): ranks by total score and
 * writes the Run/Candidate/Score rows. Throws if the date already has candidates, unless `force`
 * is set (which replaces them, cascading away any posted selection/engagement — only for a
 * deliberate redo).
 */
export async function persistRankedRun(
  date: string,
  candidates: RankedCandidateInput[],
  { force = false }: { force?: boolean } = {}
): Promise<DailyRunResult> {
  const existing = await prisma.run.findUnique({
    where: { date },
    include: { candidates: true },
  });
  if (existing && existing.candidates.length > 0 && !force) {
    throw new Error("This date already has generated posts");
  }

  const ranked = candidates
    .map((c) => ({
      ...c,
      total: c.score.hook + c.score.insight + c.score.authenticity + c.score.engagement + c.score.clarity,
    }))
    .sort((a, b) => b.total - a.total)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.run.delete({ where: { id: existing.id } });
    }
    const run = await tx.run.create({ data: { date } });
    for (const c of ranked) {
      await tx.candidate.create({
        data: {
          runId: run.id,
          topic: c.topic,
          theme: c.theme ?? null,
          category: c.category ?? null,
          draft: c.draft,
          sourceUrl: c.sourceUrl ?? null,
          sourceTitle: c.sourceTitle ?? null,
          rank: c.rank,
          score: {
            create: {
              hook: c.score.hook,
              insight: c.score.insight,
              authenticity: c.score.authenticity,
              engagement: c.score.engagement,
              clarity: c.score.clarity,
              total: c.total,
            },
          },
        },
      });
    }
  });

  return { date, created: true };
}

/**
 * Runs Scout -> Remy -> Val for `date` and persists the result. Idempotent: if a Run already
 * exists for that date with candidates, it's left alone unless `force` is set. `force` deletes
 * the existing Run first, which cascades away any PostedSelection/Engagement already recorded
 * for that date — only pass it for an intentional manual redo.
 */
export async function runDailyPipeline(
  date: string,
  { force = false }: { force?: boolean } = {}
): Promise<DailyRunResult> {
  const existing = await prisma.run.findUnique({
    where: { date },
    include: { candidates: true },
  });
  if (existing && existing.candidates.length > 0 && !force) {
    return { date, created: false };
  }

  const topics = await runScout();
  // Sequential, not Promise.all, with a gap between each: firing all 5 Remy calls back-to-back
  // spikes requests-per-minute enough to trip Gemini's rate limit on lower-tier API keys.
  const drafts: string[] = [];
  for (const t of topics) {
    await sleep(GEMINI_CALL_GAP_MS);
    drafts.push(await runRemy(t.topic));
  }

  const scoreInputs = topics.map((t, index) => ({ index, topic: t.topic, draft: drafts[index] }));
  await sleep(GEMINI_CALL_GAP_MS);
  const scores = await runVal(scoreInputs);
  const scoreByIndex = new Map(scores.map((s) => [s.index, s]));

  const candidates: RankedCandidateInput[] = topics.map((t, index) => {
    const score = scoreByIndex.get(index);
    if (!score) {
      throw new Error(`Val did not return a score for candidate index ${index}`);
    }
    return { topic: t.topic, theme: t.theme, draft: drafts[index], score };
  });

  return persistRankedRun(date, candidates, { force: true });
}
