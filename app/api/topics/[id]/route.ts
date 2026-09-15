import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.topicIdea.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }
  await prisma.topicIdea.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
