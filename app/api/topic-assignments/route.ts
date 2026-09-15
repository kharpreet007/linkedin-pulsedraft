import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDateKey } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const assignments = await prisma.topicAssignment.findMany({
    include: { topic: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(
    assignments.map((a) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      topicId: a.topicId,
      title: a.topic.title,
      theme: a.topic.theme,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = body?.assignments;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "assignments must be a non-empty array" }, { status: 400 });
  }
  for (const item of items) {
    if (!item || typeof item.topicId !== "string" || !isValidDateKey(item.date)) {
      return NextResponse.json({ error: "each assignment needs a topicId and a YYYY-MM-DD date" }, { status: 400 });
    }
  }

  try {
    const result = await prisma.topicAssignment.createMany({
      data: items.map((item: { topicId: string; date: string }) => ({ topicId: item.topicId, date: item.date })),
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
