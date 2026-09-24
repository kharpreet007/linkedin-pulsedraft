import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

export async function PATCH(req: NextRequest, { params }: { params: { date: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || (body.topic === undefined && body.theme === undefined && body.category === undefined)) {
    return NextResponse.json({ error: "Provide topic, theme, and/or category" }, { status: 400 });
  }
  if (body.theme !== undefined && !VALID_THEMES.includes(body.theme)) {
    return NextResponse.json({ error: "theme must be PM, AI, or Psychology" }, { status: 400 });
  }
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: `category must be one of ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const run = await prisma.run.findUnique({
    where: { date: params.date },
    include: { postedSelection: true },
  });
  if (!run || !run.postedSelection) {
    return NextResponse.json({ error: "No posted selection for that date" }, { status: 404 });
  }

  const updated = await prisma.postedSelection.update({
    where: { runId: run.id },
    data: {
      ...(body.topic !== undefined ? { topicOverride: body.topic || null } : {}),
      ...(body.theme !== undefined ? { themeOverride: body.theme as Theme } : {}),
      ...(body.category !== undefined ? { categoryOverride: body.category as KanbanCategory } : {}),
    },
  });

  return NextResponse.json({
    topicOverride: updated.topicOverride,
    themeOverride: updated.themeOverride,
    categoryOverride: updated.categoryOverride,
  });
}
