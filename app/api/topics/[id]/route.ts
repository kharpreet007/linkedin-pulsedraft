import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDateKey } from "@/lib/date";
import type { TopicStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: TopicStatus[] = ["Backlog", "Scheduled", "Published"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || (body.status === undefined && body.scheduledDate === undefined)) {
    return NextResponse.json({ error: "Provide status and/or scheduledDate" }, { status: 400 });
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status must be Backlog, Scheduled, or Published" }, { status: 400 });
  }
  if (body.scheduledDate !== undefined && body.scheduledDate !== null && !isValidDateKey(body.scheduledDate)) {
    return NextResponse.json({ error: "scheduledDate must be YYYY-MM-DD or null" }, { status: 400 });
  }

  const existing = await prisma.topicIdea.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // Moving out of Backlog needs a date to place it on the board; default to today if none set yet.
  const nextStatus: TopicStatus = body.status ?? existing.status;
  const needsDate = nextStatus !== "Backlog" && !existing.scheduledDate && body.scheduledDate === undefined;

  const updated = await prisma.topicIdea.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined ? { status: body.status as TopicStatus } : {}),
      ...(body.scheduledDate !== undefined ? { scheduledDate: body.scheduledDate } : {}),
      ...(needsDate ? { scheduledDate: new Date().toISOString().slice(0, 10) } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    theme: updated.theme,
    status: updated.status,
    scheduledDate: updated.scheduledDate,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.topicIdea.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }
  await prisma.topicIdea.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
