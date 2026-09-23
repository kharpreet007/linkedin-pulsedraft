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

/** (numerator / impressions), or null when there's no impression data to normalize against —
 *  raw like/comment counts aren't comparable across posts with wildly different reach, so every
 *  cross-post comparison in this module should use a rate, not a raw count. */
export function rate(numerator: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return numerator / impressions;
}

export interface GroupStat {
  key: string;
  count: number;
  avgRate: number | null;
  avgImpressions: number;
  avgLikes: number;
  avgComments: number;
}

interface EngagementLike {
  impressions: number;
  likes: number;
  comments: number;
}

/** Groups posts by an arbitrary key (category, weekday, grounded/not, …) and averages their
 *  engagement rate — the shared aggregation behind most of the "what should we make more of"
 *  questions. Groups with no impression data still appear (avgRate null) rather than vanishing. */
export function groupByKey<T extends EngagementLike>(items: T[], keyOf: (item: T) => string): GroupStat[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return [...groups.entries()].map(([key, group]) => {
    const rates = group.map((g) => rate(g.likes + g.comments, g.impressions)).filter((r): r is number => r !== null);
    return {
      key,
      count: group.length,
      avgRate: rates.length > 0 ? avg(rates) : null,
      avgImpressions: Math.round(avg(group.map((g) => g.impressions))),
      avgLikes: Math.round(avg(group.map((g) => g.likes))),
      avgComments: Math.round(avg(group.map((g) => g.comments))),
    };
  });
}

/** Mon-Sun label for a YYYY-MM-DD date key, independent of local timezone. */
export function weekdayName(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Reorders a weekday GroupStat[] into Mon..Sun (any group key groupByKey didn't see is filled
 *  in as a zero-count placeholder so the chart always shows all 7 days). */
export function orderByWeekday(groups: GroupStat[]): GroupStat[] {
  const byKey = new Map(groups.map((g) => [g.key, g]));
  return WEEKDAY_ORDER.map(
    (day) => byKey.get(day) ?? { key: day, count: 0, avgRate: null, avgImpressions: 0, avgLikes: 0, avgComments: 0 }
  );
}

export interface DimensionCorrelation {
  dimension: string;
  r: number | null;
}

/** For each of Val's five score dimensions, correlates that dimension alone against actual
 *  engagement rate — the total-score correlation says whether Val's judgment works overall, this
 *  says which specific dimension is actually carrying that signal (or dragging it down). */
export function computeDimensionCorrelations(
  posts: { hook: number; insight: number; authenticity: number; engagement: number; clarity: number; actualRate: number }[]
): DimensionCorrelation[] {
  const dims = [
    ["Hook", (p: (typeof posts)[number]) => p.hook],
    ["Insight", (p: (typeof posts)[number]) => p.insight],
    ["Authenticity", (p: (typeof posts)[number]) => p.authenticity],
    ["Engagement (Val)", (p: (typeof posts)[number]) => p.engagement],
    ["Clarity", (p: (typeof posts)[number]) => p.clarity],
  ] as const;
  const ys = posts.map((p) => p.actualRate);
  return dims.map(([dimension, pick]) => ({
    dimension,
    r: pearsonCorrelation(posts.map(pick), ys),
  }));
}

export interface OverrideComparison {
  followedValCount: number;
  followedValAvgRate: number | null;
  overriddenCount: number;
  overriddenAvgRate: number | null;
}

/** Splits posted candidates into "Val's #1 pick" vs. "an override" and compares their average
 *  engagement rate — not a paired before/after (the un-posted #1 pick has no engagement data by
 *  definition), but it tells you whether overriding tends to pay off or not, on average. */
export function computeOverrideComparison(posts: { rank: number | null; impressions: number; likes: number; comments: number }[]): OverrideComparison {
  const withRank = posts.filter((p): p is typeof p & { rank: number } => p.rank !== null);
  const followed = withRank.filter((p) => p.rank === 1);
  const overridden = withRank.filter((p) => p.rank !== 1);
  const avgRate = (group: typeof withRank) => {
    const rates = group.map((p) => rate(p.likes + p.comments, p.impressions)).filter((r): r is number => r !== null);
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
  };
  return {
    followedValCount: followed.length,
    followedValAvgRate: avgRate(followed),
    overriddenCount: overridden.length,
    overriddenAvgRate: avgRate(overridden),
  };
}

/** Whole days between two YYYY-MM-DD date keys. */
export function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier.slice(0, 10) + "T00:00:00Z").getTime();
  const b = new Date(later.slice(0, 10) + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export interface GapComparison {
  backToBackCount: number;
  backToBackAvgRate: number | null;
  afterGapCount: number;
  afterGapAvgRate: number | null;
}

/** Compares engagement rate for posts published the day right after the previous post
 *  ("back-to-back") vs. posts that followed a gap of 2+ days — a cheap proxy for whether
 *  consistency itself feeds the algorithm, independent of content quality. Needs posts in
 *  chronological order by run date. */
export function computePostingGapEffect(
  postsChrono: { date: string; impressions: number; likes: number; comments: number }[]
): GapComparison {
  const backToBack: typeof postsChrono = [];
  const afterGap: typeof postsChrono = [];
  for (let i = 1; i < postsChrono.length; i++) {
    const gap = daysBetween(postsChrono[i - 1].date, postsChrono[i].date);
    (gap <= 1 ? backToBack : afterGap).push(postsChrono[i]);
  }
  const avgRate = (group: typeof postsChrono) => {
    const rates = group.map((p) => rate(p.likes + p.comments, p.impressions)).filter((r): r is number => r !== null);
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
  };
  return {
    backToBackCount: backToBack.length,
    backToBackAvgRate: avgRate(backToBack),
    afterGapCount: afterGap.length,
    afterGapAvgRate: avgRate(afterGap),
  };
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
