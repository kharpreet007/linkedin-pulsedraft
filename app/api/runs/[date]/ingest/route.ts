import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { persistRankedRun, type RankedCandidateInput } from "@/lib/pipeline/run";
import { serializeRunDetail } from "@/lib/serialize";
import { isValidDateKey } from "@/lib/date";
import { isCronAuthorized } from "@/lib/auth";
import type { KanbanCategory, Theme } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_THEMES: Theme[] = ["PM", "AI", "Psychology"];
const VALID_CATEGORIES: KanbanCategory[] = [
  "Business",
  "Logistics",
  "SupplyChain",
  "Transportation",
  "ProjectManagement",
  "ProductManagement",
  "GenAI",
  "Psychology",
  "Finance",
];
const SCORE_FIELDS = ["hook", "insight", "authenticity", "engagement", "clarity"] as const;

function parseCandidate(raw: unknown, index: number): RankedCandidateInput {
  const c = raw as Record<string, unknown>;
  if (!c || typeof c !== "object") throw new Error(`Candidate ${index}: must be an object`);
  if (typeof c.topic !== "string" || !c.topic.trim()) throw new Error(`Candidate ${index}: topic is required`);
  if (typeof c.draft !== "string" || !c.draft.trim()) throw new Error(`Candidate ${index}: draft is required`);
  if (c.theme !== undefined && c.theme !== null && !VALID_THEMES.includes(c.theme as Theme)) {
    throw new Error(`Candidate ${index}: theme must be one of ${VALID_THEMES.join(", ")}`);
  }
  if (c.category !== undefined && c.category !== null && !VALID_CATEGORIES.includes(c.category as KanbanCategory)) {
    throw new Error(`Candidate ${index}: category must be one of ${VALID_CATEGORIES.join(", ")}`);
  }
  if (c.theme && c.category) throw new Error(`Candidate ${index}: set theme or category, not both`);
  if (c.sourceUrl !== undefined && c.sourceUrl !== null) {
    if (typeof c.sourceUrl !== "string" || !/^https?:\/\//.test(c.sourceUrl)) {
      throw new Error(`Candidate ${index}: sourceUrl must be an http(s) URL`);
    }
  }
  if (c.sourceTitle !== undefined && c.sourceTitle !== null && typeof c.sourceTitle !== "string") {
    throw new Error(`Candidate ${index}: sourceTitle must be a string`);
  }

  const score = c.score as Record<string, unknown> | undefined;
  if (!score || typeof score !== "object") throw new Error(`Candidate ${index}: score is required`);
  const parsedScore: Record<string, number> = {};
  for (const field of SCORE_FIELDS) {
    const value = Number(score[field]);
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new Error(`Candidate ${index}: score.${field} must be an integer 0-10`);
    }
    parsedScore[field] = value;
  }

  return {
    topic: c.topic.trim(),
    draft: c.draft.trim(),
    theme: (c.theme as Theme | undefined) ?? null,
    category: (c.category as KanbanCategory | undefined) ?? null,
    sourceUrl: (c.sourceUrl as string | undefined)?.trim() ?? null,
    sourceTitle: (c.sourceTitle as string | undefined)?.trim() ?? null,
    score: parsedScore as RankedCandidateInput["score"],
  };
}

/**
 * Accepts 5 already-written topic/draft/score sets and saves them as a date's Run — the same
 * end state as the automatic daily pipeline or the Calendar's category generation, without this
 * app making any Gemini call itself. Meant for a caller (human or agent) that already did the
 * Scout/Remy/Val work elsewhere and just needs it persisted.
 */
export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isValidDateKey(params.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.candidates) || body.candidates.length !== 5) {
    return NextResponse.json({ error: "candidates must be an array of exactly 5 items" }, { status: 400 });
  }

  let candidates: RankedCandidateInput[];
  try {
    candidates = body.candidates.map((c: unknown, i: number) => parseCandidate(c, i));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid candidate" }, { status: 400 });
  }

  const force = body.force === true;

  try {
    await persistRankedRun(params.date, candidates, { force });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save this run";
    return NextResponse.json({ error: message }, { status: message.includes("already has") ? 409 : 500 });
  }

  const run = await prisma.run.findUnique({
    where: { date: params.date },
    include: {
      candidates: { include: { score: true } },
      postedSelection: { include: { candidate: true } },
      engagement: true,
    },
  });
  if (!run) {
    return NextResponse.json({ error: "Run not found after ingest" }, { status: 500 });
  }

  return NextResponse.json(serializeRunDetail(run));
}
