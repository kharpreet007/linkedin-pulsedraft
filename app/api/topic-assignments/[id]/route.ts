import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.topicAssignment.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  await prisma.topicAssignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
