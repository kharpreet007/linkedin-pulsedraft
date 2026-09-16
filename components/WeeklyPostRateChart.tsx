"use client";

import { useRef, useState } from "react";
import type { WeeklyCount } from "@/lib/analytics";

const WIDTH = 480;
const HEIGHT = 180;
const PAD_LEFT = 28;
const PAD_RIGHT = 10;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;

function fmtWeek(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** One bar per week of posts published, with a dashed reference line at the user's baseline. */
export default function WeeklyPostRateChart({ weeks, baseline }: { weeks: WeeklyCount[]; baseline: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

  const maxCount = Math.max(...weeks.map((w) => w.count), baseline ?? 0, 1);
  const yMax = Math.ceil(maxCount * 1.2);

  const barWidth = (WIDTH - PAD_LEFT - PAD_RIGHT) / weeks.length;
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

  const active = hovered ? weeks[hovered.index] : null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Bar chart of posts published per week"
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
            {v}
          </text>
        ))}

        {baseline !== null && baseline > 0 && (
          <line
            x1={PAD_LEFT}
            y1={yScale(baseline)}
            x2={WIDTH - PAD_RIGHT}
            y2={yScale(baseline)}
            stroke="var(--color-danger)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {weeks.map((w, i) => {
          const x = PAD_LEFT + i * barWidth;
          const barH = HEIGHT - PAD_BOTTOM - yScale(w.count);
          const isFirst = i === 0;
          const isLast = i === weeks.length - 1;
          const showLabel = isFirst || isLast || weeks.length <= 6 || i % 2 === 0;
          const anchor = isFirst ? "start" : isLast ? "end" : "middle";
          const labelX = isFirst ? x : isLast ? x + barWidth : x + barWidth / 2;
          return (
            <g key={w.weekStart}>
              <rect
                x={x + barWidth * 0.15}
                y={yScale(w.count)}
                width={barWidth * 0.7}
                height={Math.max(barH, w.count > 0 ? 2 : 0)}
                rx={2}
                fill="var(--gradient-brand)"
                onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                onMouseLeave={() => setHovered(null)}
              />
              <rect
                x={x}
                y={PAD_TOP}
                width={barWidth}
                height={HEIGHT - PAD_TOP - PAD_BOTTOM}
                fill="transparent"
                onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                onMouseLeave={() => setHovered(null)}
              />
              {showLabel && (
                <text x={labelX} y={HEIGHT - PAD_BOTTOM + 14} textAnchor={anchor} fontSize={9} fill="var(--color-neutral-500)">
                  {fmtWeek(w.weekStart)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {active && hovered && (
        <div
          className="chart-tooltip"
          style={{ left: hovered.x, top: hovered.y, transform: "translate(-50%, calc(-100% - 10px))" }}
        >
          <div style={{ fontWeight: 600 }}>Week of {fmtWeek(active.weekStart)}</div>
          <div style={{ marginTop: 2 }}>{active.count} post{active.count === 1 ? "" : "s"}</div>
        </div>
      )}
    </div>
  );
}
