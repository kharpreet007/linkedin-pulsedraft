/** Pure math/aggregation helpers for the Analytics view — kept dependency-free and testable. */

/** The Monday (UTC) that starts the week containing `dateStr` (YYYY-MM-DD or an ISO timestamp). */
export function weekStartKey(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyCount {
  weekStart: string;
  count: number;
}

/** Buckets post dates into the last `weeksBack` calendar weeks (Mon-Sun), ending with the week
 *  containing `todayStr` — weeks with no posts still appear as zero so a drop-off is visible. */
export function computeWeeklyPostCounts(postedAtDates: string[], todayStr: string, weeksBack = 10): WeeklyCount[] {
  const counts = new Map<string, number>();
  for (const d of postedAtDates) {
    const wk = weekStartKey(d);
    counts.set(wk, (counts.get(wk) ?? 0) + 1);
  }

  const weeks: WeeklyCount[] = [];
  const cursor = new Date(weekStartKey(todayStr) + "T00:00:00Z");
  cursor.setUTCDate(cursor.getUTCDate() - 7 * (weeksBack - 1));
  for (let i = 0; i < weeksBack; i++) {
    const key = cursor.toISOString().slice(0, 10);
    weeks.push({ weekStart: key, count: counts.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weeks;
}

/** Pearson correlation coefficient, or null when it isn't meaningful (fewer than 2 points, or
 *  one series has zero variance). */
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

/** Plain-language verdict for a correlation coefficient — refuses to call it either way below a
 *  minimum sample size, since a "strong" r from 3 posts is noise, not a finding. */
export function correlationLabel(r: number | null, n: number, minSample = 5): string {
  if (r === null || n < minSample) return `Not enough data yet (need at least ${minSample} published posts)`;
  const abs = Math.abs(r);
  const direction = r >= 0 ? "positive" : "negative";
  if (abs < 0.2) return "No meaningful correlation";
  if (abs < 0.5) return `Weak ${direction} correlation`;
  if (abs < 0.8) return `Moderate ${direction} correlation`;
  return `Strong ${direction} correlation`;
}

export interface TrendResult {
  direction: "up" | "down" | "flat";
  changePct: number | null;
}

/** Compares the average of the first half of a chronologically-ordered series to the second half
 *  — simple and explainable for the small sample sizes this app actually sees, rather than fitting
 *  a regression line that would overstate confidence with only a handful of posts. */
export function computeTrend(valuesInChronoOrder: number[]): TrendResult | null {
  const n = valuesInChronoOrder.length;
  if (n < 4) return null;
  const mid = Math.floor(n / 2);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const firstAvg = avg(valuesInChronoOrder.slice(0, mid));
  const secondAvg = avg(valuesInChronoOrder.slice(mid));
  if (firstAvg === 0) {
    return { direction: secondAvg > 0 ? "up" : "flat", changePct: null };
  }
  const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
  const direction = changePct > 5 ? "up" : changePct < -5 ? "down" : "flat";
  return { direction, changePct };
}

export interface PickAgreement {
  totalPosted: number;
  rank1Count: number;
  rank1Pct: number;
  rankCounts: Record<number, number>;
}

/** How often the candidate actually posted was Val's #1 pick vs. an override to #2-#5. */
export function computePickAgreement(ranks: (number | null)[]): PickAgreement {
  const known = ranks.filter((r): r is number => r !== null);
  const rankCounts: Record<number, number> = {};
  for (const r of known) rankCounts[r] = (rankCounts[r] ?? 0) + 1;
  const rank1Count = rankCounts[1] ?? 0;
  return {
    totalPosted: known.length,
    rank1Count,
    rank1Pct: known.length > 0 ? Math.round((rank1Count / known.length) * 100) : 0,
    rankCounts,
  };
}
