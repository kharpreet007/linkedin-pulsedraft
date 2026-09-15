import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDateKey } from "@/lib/date";
import type { KanbanCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const assignments = await prisma.topicAssignment.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(
    assignments.map((a) => ({ id: a.id, date: a.date, status: a.status, category: a.category }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = body?.assignments;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "assignments must be a non-empty array" }, { status: 400 });
  }
  for (const item of items) {
    if (!item || !VALID_CATEGORIES.includes(item.category) || !isValidDateKey(item.date)) {
      return NextResponse.json({ error: "each assignment needs a valid category and a YYYY-MM-DD date" }, { status: 400 });
    }
  }

  try {
    const result = await prisma.topicAssignment.createMany({
      data: items.map((item: { category: KanbanCategory; date: string }) => ({
        category: item.category,
        date: item.date,
      })),
      skipDuplicates: true, // a date already assigned is left untouched
    });
    return NextResponse.json({ created: result.count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create assignments" },
      { status: 400 }
    );
  }
}
