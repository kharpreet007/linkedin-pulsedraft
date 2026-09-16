"use client";

import { useEffect, useMemo, useState } from "react";
import type { RunSummary } from "@/lib/types";
import { fmtLabel } from "@/lib/format";
import { fetchBaselineRate, updateBaselineRate } from "@/lib/api";
import {
  computeWeeklyPostCounts,
  computePickAgreement,
  computeTrend,
  pearsonCorrelation,
  correlationLabel,
} from "@/lib/analytics";
import ScoreVsEngagementChart from "./ScoreVsEngagementChart";
import WeeklyPostRateChart from "./WeeklyPostRateChart";
import EngagementTrendChart from "./EngagementTrendChart";

export default function AnalyticsView({ runs, today }: { runs: RunSummary[]; today: string }) {
  const posted = useMemo(() => runs.filter((r) => r.postedSelection), [runs]);
  const postedChrono = useMemo(
    () => [...posted].sort((a, b) => a.postedSelection!.postedAt.localeCompare(b.postedSelection!.postedAt)),
    [posted]
  );

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

  const totals = posted.reduce(
    (acc, r) => {
      acc.impressions += r.engagement?.impressions ?? 0;
      acc.likes += r.engagement?.likes ?? 0;
      acc.comments += r.engagement?.comments ?? 0;
      return acc;
    },
    { impressions: 0, likes: 0, comments: 0 }
  );
  const postCount = posted.length || 1;
  const avgEngagement = Math.round((totals.likes + totals.comments) / postCount);

  const kpis = [
    { label: "Posts published", value: posted.length },
    { label: "Total impressions", value: totals.impressions },
    { label: "Total likes", value: totals.likes },
    { label: "Total comments", value: totals.comments },
    { label: "Avg engagement / post", value: avgEngagement },
  ];

  const byTheme = new Map<string, { theme: string; count: number; impressions: number; likes: number; comments: number }>();
  posted.forEach((r) => {
    if (!r.postedSelection) return;
    const key = r.postedSelection.theme;
    const row = byTheme.get(key) ?? { theme: key, count: 0, impressions: 0, likes: 0, comments: 0 };
    row.count += 1;
    row.impressions += r.engagement?.impressions ?? 0;
    row.likes += r.engagement?.likes ?? 0;
    row.comments += r.engagement?.comments ?? 0;
    byTheme.set(key, row);
  });
  const themeRows = [...byTheme.values()]
    .map((t) => ({
      theme: t.theme,
      count: t.count,
      avgImpressions: Math.round(t.impressions / t.count),
      avgLikes: Math.round(t.likes / t.count),
      avgComments: Math.round(t.comments / t.count),
    }))
    .sort((a, b) => b.avgLikes - a.avgLikes);

  const scoreVsResultRows = posted
    .filter((r) => r.postedSelection && r.postedSelection.scoreTotal !== null)
    .map((r) => {
      const impressions = r.engagement?.impressions ?? 0;
      const likes = r.engagement?.likes ?? 0;
      const comments = r.engagement?.comments ?? 0;
      return {
        date: fmtLabel(r.date, today),
        topic: r.postedSelection!.topic,
        score: r.postedSelection!.scoreTotal as number,
        engagement: likes + comments,
        impressions,
        likes,
        comments,
      };
    });
  const scoreCorrelation = pearsonCorrelation(
    scoreVsResultRows.map((r) => r.score),
    scoreVsResultRows.map((r) => r.engagement)
  );

  // Q1 — posting consistency: current cadence over the last 4 (of 10 charted) weeks vs. baseline.
  const weeklyCounts = useMemo(
    () => computeWeeklyPostCounts(posted.map((r) => r.postedSelection!.postedAt), today, 10),
    [posted, today]
  );
  const recentWeeks = weeklyCounts.slice(-4);
  const currentRate = recentWeeks.reduce((sum, w) => sum + w.count, 0) / recentWeeks.length;
  const vsBaselinePct = baseline && baseline > 0 ? Math.round(((currentRate - baseline) / baseline) * 100) : null;

  // Q2 — is Val's #1 pick actually chosen?
  const pickAgreement = useMemo(() => computePickAgreement(posted.map((r) => r.postedSelection!.rank)), [posted]);

  // Q5 — is engagement trending up, flat, or down?
  const trendPoints = postedChrono.map((r) => ({
    date: r.date,
    label: fmtLabel(r.date, today),
    engagement: (r.engagement?.likes ?? 0) + (r.engagement?.comments ?? 0),
  }));
  const trend = computeTrend(trendPoints.map((p) => p.engagement));

  return (
    <>
      <div>
        <div className="page-title">Analytics</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <div className="card-meta">{k.label}</div>
            <div className="stat-value" style={{ marginTop: 6 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

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
                    {vsBaselinePct >= 0 ? "+" : ""}
                    {vsBaselinePct}%
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-5)",
          alignItems: "start",
        }}
      >
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Val&apos;s score vs. actual results
          </div>
          {scoreVsResultRows.length > 0 && (
            <div style={{ marginBottom: "var(--space-3)" }}>
              <ScoreVsEngagementChart points={scoreVsResultRows} />
            </div>
          )}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-neutral-300)",
              marginBottom: "var(--space-3)",
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-neutral-800)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {scoreCorrelation !== null ? `r = ${scoreCorrelation.toFixed(2)} — ` : ""}
            {correlationLabel(scoreCorrelation, scoreVsResultRows.length)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {scoreVsResultRows.map((r, i) => (
              <div key={i} style={{ border: "1px solid var(--color-neutral-800)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{r.topic}</span>
                  <span className="tag tag-accent">{r.score}/50</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-400)", marginTop: 2 }}>{r.date}</div>
                <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-neutral-300)" }}>
                  <span>{r.impressions} impressions</span>
                  <span>{r.likes} likes</span>
                  <span>{r.comments} comments</span>
                </div>
              </div>
            ))}
            {scoreVsResultRows.length === 0 && (
              <div className="empty-state">No published posts yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Is Val&apos;s #1 pick actually chosen?
          </div>
          {pickAgreement.totalPosted > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                <div className="stat-value">{pickAgreement.rank1Pct}%</div>
                <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>
                  of {pickAgreement.totalPosted} posts were Val&apos;s #1 pick
                </div>
              </div>
              <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>
                Which rank got chosen
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((rank) => {
                  const count = pickAgreement.rankCounts[rank] ?? 0;
                  const pct = pickAgreement.totalPosted > 0 ? (count / pickAgreement.totalPosted) * 100 : 0;
                  return (
                    <div key={rank} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: 12, color: "var(--color-neutral-400)", width: 16 }}>#{rank}</span>
                      <div className="score-bar-track" style={{ flex: 1, marginTop: 0 }}>
                        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--color-neutral-400)", width: 24, textAlign: "right" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)", marginTop: "var(--space-3)" }}>
                {pickAgreement.rank1Pct >= 70
                  ? "High agreement — Val's ranking closely tracks what actually gets posted."
                  : pickAgreement.rank1Pct >= 40
                    ? "Moderate agreement — worth watching which subjects get overridden."
                    : "Frequent overrides — Val's scoring criteria may not match what you actually value yet."}
              </div>
            </>
          ) : (
            <div className="empty-state">No published posts yet.</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
          alignItems: "start",
        }}
      >
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Is engagement trending up?
          </div>
          {trendPoints.length > 0 ? (
            <>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <EngagementTrendChart points={trendPoints} />
              </div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>
                {trend === null && "Not enough posts yet to call a trend (need at least 4)."}
                {trend !== null && trend.direction === "up" && (
                  <>
                    <strong style={{ color: "var(--color-accent-300)" }}>Trending up</strong>
                    {trend.changePct !== null && ` — ${trend.changePct >= 0 ? "+" : ""}${Math.round(trend.changePct)}% from earlier posts to recent ones.`}
                    {" "}Consistent with real audience-building.
                  </>
                )}
                {trend !== null && trend.direction === "flat" && "Roughly flat — posting is steady but engagement isn't compounding yet."}
                {trend !== null && trend.direction === "down" && (
                  <>
                    <strong style={{ color: "var(--color-danger)" }}>Trending down</strong>
                    {trend.changePct !== null && ` — ${Math.round(trend.changePct)}% from earlier posts to recent ones.`}
                    {" "}If posting has stayed consistent, the content itself may not be landing.
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">No published posts yet.</div>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Performance by theme
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {themeRows.map((t) => (
              <div key={t.theme} style={{ border: "1px solid var(--color-neutral-800)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="tag tag-neutral">{t.theme}</span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>{t.count} posts</span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-neutral-300)" }}>
                  <span>{t.avgImpressions} impressions</span>
                  <span>{t.avgLikes} likes</span>
                  <span>{t.avgComments} comments</span>
                </div>
              </div>
            ))}
            {themeRows.length === 0 && (
              <div className="empty-state">No published posts yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
