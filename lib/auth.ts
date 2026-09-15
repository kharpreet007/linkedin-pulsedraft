import { NextRequest } from "next/server";

/** Shared by any admin-only route (the daily cron trigger, manual run deletion, etc). */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet — fine for local dev, set one before deploying
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
