import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AssignmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: AssignmentStatus[] = ["Scheduled", "Published"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status must be Scheduled or Published" }, { status: 400 });
  }

  const existing = await prisma.topicAssignment.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const updated = await prisma.topicAssignment.update({
    where: { id: params.id },
    data: { status: body.status as AssignmentStatus },
  });

  return NextResponse.json({ id: updated.id, date: updated.date, status: updated.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.topicAssignment.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  await prisma.topicAssignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
