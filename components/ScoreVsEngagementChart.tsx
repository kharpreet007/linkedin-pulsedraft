"use client";

import { useRef, useState } from "react";

export interface ScorePoint {
  topic: string;
  date: string;
  score: number;
  engagement: number;
  impressions: number;
  likes: number;
  comments: number;
}

const WIDTH = 340;
const HEIGHT = 200;
const PAD_LEFT = 32;
const PAD_RIGHT = 10;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;

/** Single-series scatter — one dot per published post, Val's score (x) vs. actual engagement
 *  rate (y). No legend needed for a single series; details live in the hover/focus tooltip, with
 *  exact values always available in the list below. `engagement` is a rate (likes+comments /
 *  impressions), not a raw count, so it's comparable across posts with different reach and
 *  directly comparable to the per-dimension correlation chart shown alongside it. */
export default function ScoreVsEngagementChart({
  points,
  formatY = (v) => v.toFixed(3),
}: {
  points: ScorePoint[];
  formatY?: (v: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

  if (points.length === 0) return null;

  const maxEngagement = Math.max(...points.map((p) => p.engagement), 0.0001);
  const yMax = maxEngagement * 1.15;

  const xScale = (score: number) => PAD_LEFT + (score / 50) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const yScale = (value: number) => HEIGHT - PAD_BOTTOM - (value / yMax) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const showTooltip = (index: number, target: Element) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!containerRect) return;
    setHovered({
      index,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  };

  const active = hovered ? points[hovered.index] : null;

  return (
    <div>
      <div className="eyebrow-sm" style={{ marginBottom: 6 }}>
        Score (0–50) vs. engagement rate ((likes + comments) / impressions)
      </div>
      <div ref={containerRef} style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label="Scatter plot of Val's score versus actual engagement, one point per published post"
        >
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-neutral-800)" strokeWidth={1} />
          <line
            x1={PAD_LEFT}
            y1={HEIGHT - PAD_BOTTOM}
            x2={WIDTH - PAD_RIGHT}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--color-neutral-800)"
            strokeWidth={1}
          />

          {[0, yMax].map((v) => (
            <text key={v} x={PAD_LEFT - 6} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="var(--color-neutral-500)">
              {formatY(v)}
            </text>
          ))}
          {[0, 25, 50].map((v) => (
            <text key={v} x={xScale(v)} y={HEIGHT - PAD_BOTTOM + 14} textAnchor="middle" fontSize={9} fill="var(--color-neutral-500)">
              {v}
            </text>
          ))}

          {points.map((p, i) => {
            const cx = xScale(p.score);
            const cy = yScale(p.engagement);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={5} className="chart-dot" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  className="chart-dot-hit"
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.topic}: score ${p.score} out of 50, engagement rate ${formatY(p.engagement)}`}
                  onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={(e) => showTooltip(i, e.currentTarget)}
                  onBlur={() => setHovered(null)}
                />
              </g>
            );
          })}
        </svg>

        {active && hovered && (
          <div
            className="chart-tooltip"
            style={{ left: hovered.x, top: hovered.y, transform: "translate(-50%, calc(-100% - 10px))" }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{active.topic}</div>
            <div style={{ color: "var(--color-neutral-400)" }}>{active.date}</div>
            <div style={{ marginTop: 4 }}>
              <strong>{active.score}/50</strong> · {active.impressions} impressions · {active.likes} likes ·{" "}
              {active.comments} comments
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
