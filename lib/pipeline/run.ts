import { prisma } from "@/lib/db";
import { runScout, runScoutByCategories } from "./scout";
import { runRemy } from "./remy";
import { runVal } from "./val";
import type { KanbanCategory } from "@prisma/client";

export interface DailyRunResult {
  date: string;
  created: boolean;
}

// Spaces out Gemini calls to stay under low per-minute rate limits on free-tier API keys.
const GEMINI_CALL_GAP_MS = 3000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const ranked = topics
    .map((t, index) => {
      const score = scoreByIndex.get(index);
      if (!score) {
        throw new Error(`Val did not return a score for candidate index ${index}`);
      }
      const total = score.hook + score.insight + score.authenticity + score.engagement + score.clarity;
      return { topic: t.topic, theme: t.theme, draft: drafts[index], score, total };
    })
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
          theme: c.theme,
          draft: c.draft,
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
 * Same Scout -> Remy -> Val flow as `runDailyPipeline`, but for the Calendar's per-date
 * generation: topics come only from `categories` (the Post Its subject list) instead of the
 * fixed PM/AI/Psychology split. By default this is meant for a date that doesn't have posts
 * yet — it throws rather than silently no-op'ing if the date already has candidates, so the
 * caller can tell the user it's not an empty day. Pass `force: true` to deliberately replace an
 * existing day's candidates instead (e.g. regenerating with different subjects from the day
 * view) — this also deletes that day's posted selection and engagement, if any.
 */
export async function runCategoryPipeline(
  date: string,
  categories: KanbanCategory[],
  { force = false }: { force?: boolean } = {}
): Promise<DailyRunResult> {
  const existing = await prisma.run.findUnique({
    where: { date },
    include: { candidates: true },
  });
  if (existing && existing.candidates.length > 0 && !force) {
    throw new Error("This date already has generated posts");
  }

  const topics = await runScoutByCategories(categories);
  const drafts: string[] = [];
  for (const t of topics) {
    await sleep(GEMINI_CALL_GAP_MS);
    drafts.push(await runRemy(t.topic));
  }

  const scoreInputs = topics.map((t, index) => ({ index, topic: t.topic, draft: drafts[index] }));
  await sleep(GEMINI_CALL_GAP_MS);
  const scores = await runVal(scoreInputs);
  const scoreByIndex = new Map(scores.map((s) => [s.index, s]));

  const ranked = topics
    .map((t, index) => {
      const score = scoreByIndex.get(index);
      if (!score) {
        throw new Error(`Val did not return a score for candidate index ${index}`);
      }
      const total = score.hook + score.insight + score.authenticity + score.engagement + score.clarity;
      return { topic: t.topic, category: t.category, draft: drafts[index], score, total };
    })
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
          category: c.category,
          draft: c.draft,
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
