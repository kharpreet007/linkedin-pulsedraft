"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { RunSummary } from "@/lib/types";
import { fmtLabel } from "@/lib/format";
import { fetchBaselineRate, updateBaselineRate } from "@/lib/api";
import {
  computeWeeklyPostCounts,
  computePickAgreement,
  computeTrend,
  pearsonCorrelation,
  correlationLabel,
  rate,
  groupByKey,
  weekdayName,
  orderByWeekday,
  computeDimensionCorrelations,
  computeOverrideComparison,
  computePostingGapEffect,
} from "@/lib/analytics";
import ScoreVsEngagementChart from "./ScoreVsEngagementChart";
import WeeklyPostRateChart from "./WeeklyPostRateChart";
import TrendLineChart from "./TrendLineChart";
import BarComparisonChart from "./BarComparisonChart";
import DimensionCorrelationChart from "./DimensionCorrelationChart";
import SegmentedTabs, { type TabOption } from "./SegmentedTabs";

type ViewTab = "all" | "posting" | "content" | "scoring" | "process";
const VIEW_TABS: TabOption[] = [
  { key: "all", label: "Overview" },
  { key: "posting", label: "Posting Habits" },
  { key: "content", label: "Content Strategy" },
  { key: "scoring", label: "Scoring Model" },
  { key: "process", label: "Process Health" },
];

const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);
const signedPct = (v: number | null) => (v === null ? "n/a" : `${v >= 0 ? "+" : ""}${v}%`);

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>{title}</div>
      <div className="page-subtitle" style={{ marginBottom: "var(--space-3)" }}>
        {subtitle}
      </div>
      {children}
    </div>
  );
}

const CARD_MIN_HEIGHT = 380;

/** Every metric tile shares one shape — title, a chart area that's vertically centered so it
 *  never looks pinned to the top of extra whitespace, and an optional footer stat pinned to the
 *  bottom. Combined with `grid`'s `alignItems: stretch`, this is what makes every card in a row
 *  match height instead of each one hugging its own content (the "some sections take too much
 *  space" problem). */
function MetricCard({
  title,
  empty,
  footer,
  children,
}: {
  title: string;
  empty: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: CARD_MIN_HEIGHT }}>
      <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
        {title}
      </div>
      {empty ? (
        <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Not enough data yet.
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
          {footer && <div style={{ marginTop: "var(--space-3)" }}>{footer}</div>}
        </>
      )}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: "var(--space-4)",
  alignItems: "stretch",
};

export default function AnalyticsView({ runs, today }: { runs: RunSummary[]; today: string }) {
  const [tab, setTab] = useState<ViewTab>("all");
  const show = (key: ViewTab) => tab === "all" || tab === key;

  const posted = useMemo(() => runs.filter((r) => r.postedSelection), [runs]);
  const postedChrono = useMemo(() => [...posted].sort((a, b) => a.date.localeCompare(b.date)), [posted]);

  const [baseline, setBaseline] = useState<number | null>(null);
  const [baselineInput, setBaselineInput] = useState("");
  const [savingBaseline, setSavingBaseline] = useState(false);

  useEffect(() => {
    fetchBaselineRate()
      .then((r) => {
        setBaseline(r.postsPerWeek);
        setBaselineInput(r.postsPerWeek !== null ? String(r.postsPerWeek) : "");
      })
      .catch(() => {});
  }, []);

  const saveBaseline = () => {
    const value = Number(baselineInput);
    if (!Number.isFinite(value) || value < 0) return;
    setSavingBaseline(true);
    updateBaselineRate(value)
      .then((r) => setBaseline(r.postsPerWeek))
      .finally(() => setSavingBaseline(false));
  };

  // Normalized per-post rows — the shared shape every section below aggregates from.
  const postRows = useMemo(
    () =>
      postedChrono.map((r) => ({
        date: r.date,
        topic: r.postedSelection!.topic,
        category: r.postedSelection!.category,
        grounded: r.postedSelection!.grounded,
        rank: r.postedSelection!.rank,
        score: r.postedSelection!.score,
        impressions: r.engagement?.impressions ?? 0,
        likes: r.engagement?.likes ?? 0,
        comments: r.engagement?.comments ?? 0,
      })),
    [postedChrono]
  );
  const measured = useMemo(() => postRows.filter((r) => r.impressions > 0), [postRows]);

  const totals = postRows.reduce(
    (acc, r) => {
      acc.impressions += r.impressions;
      acc.likes += r.likes;
      acc.comments += r.comments;
      return acc;
    },
    { impressions: 0, likes: 0, comments: 0 }
  );
  const overallRate = rate(totals.likes + totals.comments, totals.impressions);
  const overallCommentRate = rate(totals.comments, totals.impressions);

  // Posting consistency (weekly cadence vs. your pre-tool baseline)
  const weeklyCounts = useMemo(
    () => computeWeeklyPostCounts(posted.map((r) => r.postedSelection!.postedAt), today, 10),
    [posted, today]
  );
  const recentWeeks = weeklyCounts.slice(-4);
  const currentRate = recentWeeks.reduce((sum, w) => sum + w.count, 0) / recentWeeks.length;
  const vsBaselinePct = baseline && baseline > 0 ? Math.round(((currentRate - baseline) / baseline) * 100) : null;

  // Q1 — which category actually performs best?
  const categoryGroups = useMemo(
    () => groupByKey(postRows, (r) => r.category).sort((a, b) => (b.avgRate ?? -1) - (a.avgRate ?? -1)),
    [postRows]
  );
  const bestCategory = categoryGroups.find((c) => c.avgRate !== null) ?? null;
  const worstCategory = [...categoryGroups].reverse().find((c) => c.avgRate !== null) ?? null;

  // Q2 — do web-search-grounded posts outperform general-knowledge ones?
  const groundedGroups = useMemo(
    () => groupByKey(postRows, (r) => (r.grounded ? "Grounded (real source)" : "General knowledge")),
    [postRows]
  );
  const grounded = groundedGroups.find((g) => g.key.startsWith("Grounded")) ?? null;
  const general = groundedGroups.find((g) => g.key.startsWith("General")) ?? null;
  const groundedLiftPct =
    grounded?.avgRate != null && general?.avgRate != null && general.avgRate > 0
      ? Math.round(((grounded.avgRate - general.avgRate) / general.avgRate) * 100)
      : null;

  // Q3 — is the real engagement RATE trending up, not just raw likes?
  const ratePoints = measured.map((r) => ({
    label: fmtLabel(r.date, today),
    value: rate(r.likes + r.comments, r.impressions) as number,
  }));
  const rateTrend = computeTrend(ratePoints.map((p) => p.value));

  // Q4 — is there a day-of-week effect?
  const dowGroups = useMemo(() => orderByWeekday(groupByKey(postRows, (r) => weekdayName(r.date))), [postRows]);
  const bestDow = [...dowGroups].sort((a, b) => (b.avgRate ?? -1) - (a.avgRate ?? -1)).find((d) => d.avgRate !== null) ?? null;
  const worstDow = [...dowGroups].sort((a, b) => (a.avgRate ?? Infinity) - (b.avgRate ?? Infinity)).find((d) => d.avgRate !== null) ?? null;

  // Val's total score vs. actual results, and which single dimension is doing the work
  const scoreVsResultRows = measured
    .filter((r) => r.score !== null)
    .map((r) => ({
      date: fmtLabel(r.date, today),
      topic: r.topic,
      score: r.score!.total,
      engagement: rate(r.likes + r.comments, r.impressions) as number,
      impressions: r.impressions,
      likes: r.likes,
      comments: r.comments,
    }));
  const scoreCorrelation = pearsonCorrelation(
    scoreVsResultRows.map((r) => r.score),
    scoreVsResultRows.map((r) => r.engagement)
  );
  const dimensionCorrelations = useMemo(
    () =>
      computeDimensionCorrelations(
        measured
          .filter((r) => r.score !== null)
          .map((r) => ({
            hook: r.score!.hook,
            insight: r.score!.insight,
            authenticity: r.score!.authenticity,
            engagement: r.score!.engagement,
            clarity: r.score!.clarity,
            actualRate: rate(r.likes + r.comments, r.impressions) as number,
          }))
      ),
    [measured]
  );
  const strongestDimension = dimensionCorrelations.reduce<(typeof dimensionCorrelations)[number] | null>(
    (best, d) => (d.r !== null && (best === null || Math.abs(d.r) > Math.abs(best.r as number)) ? d : best),
    null
  );
  const dimensionSampleSize = measured.filter((r) => r.score !== null).length;
  const MIN_DIMENSION_SAMPLE = 5;

  // Is Val's #1 pick actually chosen, and when it isn't, does the override pay off?
  const pickAgreement = useMemo(() => computePickAgreement(postRows.map((r) => r.rank)), [postRows]);
  const overrideComparison = useMemo(() => computeOverrideComparison(postRows), [postRows]);
  const overrideDeltaPct =
    overrideComparison.followedValAvgRate != null &&
    overrideComparison.overriddenAvgRate != null &&
    overrideComparison.followedValAvgRate > 0
      ? Math.round(
          ((overrideComparison.overriddenAvgRate - overrideComparison.followedValAvgRate) /
            overrideComparison.followedValAvgRate) *
            100
        )
      : null;

  // Is Val's scoring drifting over time (grade inflation/deflation), independent of engagement?
  const scoreDriftPoints = postRows
    .filter((r) => r.score !== null)
    .map((r) => ({ label: fmtLabel(r.date, today), value: r.score!.total }));
  const scoreDriftTrend = computeTrend(scoreDriftPoints.map((p) => p.value));

  // Does a posting gap hurt the next post's performance?
  const gapComparison = useMemo(() => computePostingGapEffect(postRows), [postRows]);
  const gapDeltaPct =
    gapComparison.backToBackAvgRate != null && gapComparison.afterGapAvgRate != null && gapComparison.backToBackAvgRate > 0
      ? Math.round(((gapComparison.afterGapAvgRate - gapComparison.backToBackAvgRate) / gapComparison.backToBackAvgRate) * 100)
      : null;

  const kpis = [
    { label: "Posts published", value: String(posted.length) },
    { label: "Total impressions", value: String(totals.impressions) },
    { label: "Avg engagement rate", value: pct(overallRate) },
    { label: "Best category", value: bestCategory ? bestCategory.key : "—" },
    { label: "Grounded lift", value: signedPct(groundedLiftPct) },
    { label: "Comment rate", value: pct(overallCommentRate) },
  ];

  return (
    <>
      <div>
        <div className="page-title">Analytics</div>
        <div className="page-subtitle">Everything a PM would want to know before deciding what to generate next.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--space-3)", marginTop: "var(--space-4)", alignItems: "stretch" }}>
        {kpis.map((k) => (
          <div className="card" key={k.label} style={{ minHeight: 92 }}>
            <div className="card-meta">{k.label}</div>
            <div
              className="stat-value"
              style={{ marginTop: 6, fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={k.value}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <SegmentedTabs options={VIEW_TABS} value={tab} onChange={(k) => setTab(k as ViewTab)} />
      </div>

      {show("posting") && (
        <div className="card" style={{ marginTop: "var(--space-5)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 16 }}>
              Posting consistently vs. before?
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <label style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>Your baseline (posts/week)</label>
              <input
                className="input"
                type="number"
                min={0}
                step="0.1"
                style={{ width: 70 }}
                value={baselineInput}
                onChange={(e) => setBaselineInput(e.target.value)}
                onBlur={saveBaseline}
                onKeyDown={(e) => e.key === "Enter" && saveBaseline()}
              />
              {savingBaseline && <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>Saving…</span>}
            </div>
          </div>

          {posted.length > 0 ? (
            <>
              <div style={{ marginTop: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <WeeklyPostRateChart weeks={weeklyCounts} baseline={baseline} />
              </div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>
                Averaging <strong>{currentRate.toFixed(1)} posts/week</strong> over the last 4 weeks
                {baseline !== null && baseline > 0 && vsBaselinePct !== null && (
                  <>
                    {" "}
                    — <strong style={{ color: vsBaselinePct >= 0 ? "var(--color-accent-300)" : "var(--color-danger)" }}>
                      {signedPct(vsBaselinePct)}
                    </strong>{" "}
                    vs. your {baseline}/week baseline.
                  </>
                )}
                {(baseline === null || baseline === 0) && " — set your baseline above to compare against your pre-tool cadence."}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: "var(--space-3)" }}>No published posts yet.</div>
          )}
        </div>
      )}

      {show("content") && (
      <Section title="Content strategy" subtitle="What should I actually generate more of?">
        <div style={grid}>
          <MetricCard
            title="Which category performs best?"
            empty={categoryGroups.length === 0}
            footer={
              bestCategory && (
                <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                  <strong style={{ color: "var(--color-accent-300)" }}>{bestCategory.key}</strong> leads at {pct(bestCategory.avgRate)}
                  {worstCategory && worstCategory.key !== bestCategory.key && <> · {worstCategory.key} trails at {pct(worstCategory.avgRate)}</>}.
                </div>
              )
            }
          >
            <BarComparisonChart
              bars={categoryGroups.map((c) => ({ label: c.key, value: c.avgRate, count: c.count }))}
              formatValue={pct}
              ariaLabel="Average engagement rate by category"
            />
          </MetricCard>

          <MetricCard
            title="Do grounded (real-source) posts win?"
            empty={!grounded || !general}
            footer={
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                {groundedLiftPct === null
                  ? "Need both grounded and general-knowledge posts with logged engagement to compare."
                  : groundedLiftPct >= 0
                    ? <>Grounded posts run <strong style={{ color: "var(--color-accent-300)" }}>{signedPct(groundedLiftPct)}</strong> vs. general-knowledge ones — the web-search feature is paying off.</>
                    : <>Grounded posts run <strong style={{ color: "var(--color-danger)" }}>{signedPct(groundedLiftPct)}</strong> vs. general-knowledge ones — worth a closer look at topic selection.</>}
              </div>
            }
          >
            <BarComparisonChart
              bars={[grounded, general].filter((g): g is NonNullable<typeof g> => !!g).map((g) => ({ label: g.key, value: g.avgRate, count: g.count }))}
              formatValue={pct}
              ariaLabel="Average engagement rate, grounded vs. general-knowledge posts"
            />
          </MetricCard>

          <MetricCard
            title="Is there a day-of-week effect?"
            empty={dowGroups.every((d) => d.count === 0)}
            footer={
              bestDow && (
                <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                  <strong style={{ color: "var(--color-accent-300)" }}>{bestDow.key}</strong> leads at {pct(bestDow.avgRate)}
                  {worstDow && worstDow.key !== bestDow.key && <> · {worstDow.key} trails at {pct(worstDow.avgRate)}</>}.
                </div>
              )
            }
          >
            <BarComparisonChart
              bars={dowGroups.map((d) => ({ label: d.key, value: d.avgRate, count: d.count }))}
              formatValue={pct}
              ariaLabel="Average engagement rate by day of week"
            />
          </MetricCard>

          <MetricCard
            title="Is engagement rate trending up?"
            empty={ratePoints.length === 0}
            footer={
              <div style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>
                {rateTrend === null && "Not enough measured posts yet to call a trend (need at least 4)."}
                {rateTrend !== null && rateTrend.direction === "up" && (
                  <>
                    <strong style={{ color: "var(--color-accent-300)" }}>Trending up</strong>
                    {rateTrend.changePct !== null && ` — ${signedPct(Math.round(rateTrend.changePct))} from earlier posts to recent ones.`}
                  </>
                )}
                {rateTrend !== null && rateTrend.direction === "flat" && "Roughly flat — posting is steady but the rate isn't compounding yet."}
                {rateTrend !== null && rateTrend.direction === "down" && (
                  <>
                    <strong style={{ color: "var(--color-danger)" }}>Trending down</strong>
                    {rateTrend.changePct !== null && ` — ${signedPct(Math.round(rateTrend.changePct))} from earlier posts to recent ones.`}
                  </>
                )}
              </div>
            }
          >
            <TrendLineChart points={ratePoints} ariaLabel="Engagement rate per post over time" formatValue={pct} formatAxisValue={pct} />
          </MetricCard>
        </div>
      </Section>
      )}

      {show("scoring") && (
      <Section title="Is the scoring model any good?" subtitle="Should I trust Val's ranking, and which part of it actually works?">
        <div style={grid}>
          <MetricCard
            title="Val's total score vs. actual results"
            empty={scoreVsResultRows.length === 0}
            footer={
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-neutral-300)",
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-neutral-800)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {scoreCorrelation !== null ? `r = ${scoreCorrelation.toFixed(2)} — ` : ""}
                {correlationLabel(scoreCorrelation, scoreVsResultRows.length)}
              </div>
            }
          >
            <ScoreVsEngagementChart points={scoreVsResultRows} formatY={pct} />
          </MetricCard>

          <MetricCard
            title="Which score dimension predicts it?"
            empty={dimensionCorrelations.every((d) => d.r === null)}
            footer={
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                {dimensionSampleSize < MIN_DIMENSION_SAMPLE ? (
                  <>
                    Only {dimensionSampleSize} measured post{dimensionSampleSize === 1 ? "" : "s"} so far — need at least{" "}
                    {MIN_DIMENSION_SAMPLE} before these correlations mean anything. Treat the chart as provisional.
                  </>
                ) : (
                  strongestDimension && (
                    <>
                      <strong style={{ color: "var(--color-accent-300)" }}>{strongestDimension.dimension}</strong> carries the strongest
                      signal (r = {strongestDimension.r!.toFixed(2)}, n = {dimensionSampleSize}) — the total score's predictive power
                      mostly comes from here.
                    </>
                  )
                )}
              </div>
            }
          >
            <DimensionCorrelationChart dimensions={dimensionCorrelations} />
          </MetricCard>

          <MetricCard title="Is Val's #1 pick actually chosen?" empty={pickAgreement.totalPosted === 0}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <div className="stat-value">{pickAgreement.rank1Pct}%</div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>of {pickAgreement.totalPosted} posts were Val&apos;s #1 pick</div>
            </div>
            <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>
              Which rank got chosen
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((rank) => {
                const count = pickAgreement.rankCounts[rank] ?? 0;
                const p = pickAgreement.totalPosted > 0 ? (count / pickAgreement.totalPosted) * 100 : 0;
                return (
                  <div key={rank} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: 12, color: "var(--color-neutral-400)", width: 16 }}>#{rank}</span>
                    <div className="score-bar-track" style={{ flex: 1, marginTop: 0 }}>
                      <div className="score-bar-fill" style={{ width: `${p}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-neutral-400)", width: 24, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </MetricCard>

          <MetricCard
            title="When you override Val, does it pay off?"
            empty={overrideComparison.followedValCount === 0 && overrideComparison.overriddenCount === 0}
            footer={
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                {overrideDeltaPct === null
                  ? "Need posts in both buckets with logged engagement to compare."
                  : overrideDeltaPct >= 0
                    ? <>Overrides run <strong style={{ color: "var(--color-accent-300)" }}>{signedPct(overrideDeltaPct)}</strong> vs. following Val — your instincts are beating the model.</>
                    : <>Overrides run <strong style={{ color: "var(--color-danger)" }}>{signedPct(overrideDeltaPct)}</strong> vs. following Val — trusting the #1 pick tends to work better.</>}
              </div>
            }
          >
            <BarComparisonChart
              bars={[
                { label: "Followed Val's #1", value: overrideComparison.followedValAvgRate, count: overrideComparison.followedValCount },
                { label: "Overrode to #2-#5", value: overrideComparison.overriddenAvgRate, count: overrideComparison.overriddenCount },
              ]}
              formatValue={pct}
              ariaLabel="Average engagement rate, followed Val's pick vs. overrode it"
            />
          </MetricCard>

          <MetricCard
            title="Is Val's scoring drifting over time?"
            empty={scoreDriftPoints.length === 0}
            footer={
              <div style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>
                {scoreDriftTrend === null && "Not enough scored posts yet to call a trend (need at least 4)."}
                {scoreDriftTrend !== null && scoreDriftTrend.direction === "up" && (
                  <>Scores are creeping <strong style={{ color: "var(--color-danger)" }}>up</strong>{scoreDriftTrend.changePct !== null && ` (${signedPct(Math.round(scoreDriftTrend.changePct))})`} — watch for grade inflation if this isn't matched by real engagement gains above.</>
                )}
                {scoreDriftTrend !== null && scoreDriftTrend.direction === "flat" && "Scoring is stable — no meaningful drift up or down."}
                {scoreDriftTrend !== null && scoreDriftTrend.direction === "down" && (
                  <>Scores are drifting <strong>down</strong>{scoreDriftTrend.changePct !== null && ` (${signedPct(Math.round(scoreDriftTrend.changePct))})`} — Val is grading more harshly than before.</>
                )}
              </div>
            }
          >
            <TrendLineChart points={scoreDriftPoints} ariaLabel="Val's average total score per post over time" formatValue={(v) => `${v.toFixed(0)}/50`} />
          </MetricCard>
        </div>
      </Section>
      )}

      {show("process") && (
      <Section title="Process health" subtitle="Is the day-to-day system itself working the way it should?">
        <div style={grid}>
          <MetricCard
            title="Does a posting gap hurt the next post?"
            empty={gapComparison.backToBackCount === 0 && gapComparison.afterGapCount === 0}
            footer={
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                {gapDeltaPct === null
                  ? "Need posts in both buckets with logged engagement to compare."
                  : gapDeltaPct < 0
                    ? <>Posts after a gap run <strong style={{ color: "var(--color-danger)" }}>{signedPct(gapDeltaPct)}</strong> vs. back-to-back — consistency itself seems to matter.</>
                    : <>Posts after a gap run <strong style={{ color: "var(--color-accent-300)" }}>{signedPct(gapDeltaPct)}</strong> vs. back-to-back — no real momentum penalty so far.</>}
              </div>
            }
          >
            <BarComparisonChart
              bars={[
                { label: "Back-to-back (≤1 day gap)", value: gapComparison.backToBackAvgRate, count: gapComparison.backToBackCount },
                { label: "After a gap (2+ days)", value: gapComparison.afterGapAvgRate, count: gapComparison.afterGapCount },
              ]}
              formatValue={pct}
              ariaLabel="Average engagement rate, back-to-back posts vs. posts after a gap"
            />
          </MetricCard>

          <MetricCard
            title="Are posts actually starting conversations?"
            empty={totals.likes + totals.comments === 0}
            footer={
              totals.likes + totals.comments > 0 && (
                <div style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>
                  Every draft is designed to end with an open question — this is the number that tests whether that&apos;s actually working.
                </div>
              )
            }
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <div className="stat-value">{pct(overallCommentRate)}</div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>of impressions turn into a comment</div>
            </div>
            {totals.likes + totals.comments > 0 && (
              <>
                <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>
                  Share of engagement: likes vs. comments
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "var(--color-neutral-800)" }}>
                  <div style={{ width: `${(totals.likes / (totals.likes + totals.comments)) * 100}%`, background: "var(--color-neutral-500)" }} />
                  <div style={{ width: `${(totals.comments / (totals.likes + totals.comments)) * 100}%`, background: "var(--gradient-brand)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-neutral-400)", marginTop: "var(--space-2)" }}>
                  <span>{totals.likes} likes</span>
                  <span>{totals.comments} comments</span>
                </div>
              </>
            )}
          </MetricCard>
        </div>
      </Section>
      )}
    </>
  );
}
