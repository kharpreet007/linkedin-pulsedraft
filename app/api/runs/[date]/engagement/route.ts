import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const FIELDS = ["impressions", "likes", "comments"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { date: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const fields: Record<string, number> = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: `${key} must be a non-negative number` }, { status: 400 });
      }
      fields[key] = Math.round(n);
    }
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of impressions, likes, comments" },
      { status: 400 }
    );
  }

  const run = await prisma.run.findUnique({ where: { date: params.date } });
  if (!run) {
    return NextResponse.json({ error: "No run for that date" }, { status: 404 });
  }

  const engagement = await prisma.engagement.upsert({
    where: { runId: run.id },
    create: { runId: run.id, impressions: 0, likes: 0, comments: 0, ...fields },
    update: fields,
  });

  return NextResponse.json({
    impressions: engagement.impressions,
    likes: engagement.likes,
    comments: engagement.comments,
  });
}
