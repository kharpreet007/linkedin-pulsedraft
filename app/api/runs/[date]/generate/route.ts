import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runCategoryPipeline } from "@/lib/pipeline/run";
import { serializeRunDetail } from "@/lib/serialize";
import { isValidDateKey } from "@/lib/date";
import type { KanbanCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  if (!isValidDateKey(params.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const categories = Array.isArray(body?.categories) ? (body.categories as unknown[]) : null;
  if (!categories || categories.length === 0 || !categories.every((c) => VALID_CATEGORIES.includes(c as KanbanCategory))) {
    return NextResponse.json({ error: "categories must be a non-empty array of valid categories" }, { status: 400 });
  }

  const force = body?.replace === true;

  try {
    await runCategoryPipeline(params.date, categories as KanbanCategory[], { force });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate posts for that date";
    console.error("category generate failed", err);
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
    return NextResponse.json({ error: "Run not found after generation" }, { status: 500 });
  }

  return NextResponse.json(serializeRunDetail(run));
}
