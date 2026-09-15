import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Theme } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_THEMES: Theme[] = ["PM", "AI", "Psychology"];

export async function GET() {
  const topics = await prisma.topicIdea.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(
    topics.map((t) => ({
      id: t.id,
      title: t.title,
      theme: t.theme,
      status: t.status,
      scheduledDate: t.scheduledDate,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title = body?.title;
  const theme = body?.theme;
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!VALID_THEMES.includes(theme)) {
    return NextResponse.json({ error: "theme must be PM, AI, or Psychology" }, { status: 400 });
  }

  const topic = await prisma.topicIdea.create({
    data: { title: title.trim(), theme: theme as Theme },
  });

  return NextResponse.json({
    id: topic.id,
    title: topic.title,
    theme: topic.theme,
    status: topic.status,
    scheduledDate: topic.scheduledDate,
  });
}
