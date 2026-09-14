"use client";

import { useMemo } from "react";
import type { RunSummary } from "@/lib/types";
import { fmtLabel } from "@/lib/format";

export default function AnalyticsView({ runs, today }: { runs: RunSummary[]; today: string }) {
  const posted = useMemo(() => runs.filter((r) => r.postedSelection), [runs]);

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
    .map((r) => ({
      date: fmtLabel(r.date, today),
      topic: r.postedSelection!.topic,
      score: r.postedSelection!.scoreTotal,
      impressions: r.engagement?.impressions ?? 0,
      likes: r.engagement?.likes ?? 0,
      comments: r.engagement?.comments ?? 0,
    }));

  return (
    <>
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.01em" }}>Analytics</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <div className="card-meta">{k.label}</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em" }}>
              {k.value}
            </div>
          </div>
        ))}
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
              <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>No published posts yet.</div>
            )}
          </div>
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
              <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>No published posts yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
