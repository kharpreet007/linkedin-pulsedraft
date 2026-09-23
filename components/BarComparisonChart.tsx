"use client";

import { useRef, useState } from "react";

export interface ComparisonBar {
  label: string;
  value: number | null;
  count: number;
}

const WIDTH = 460;
const ROW_HEIGHT = 28;
const PAD_LEFT = 156;
const PAD_RIGHT = 46;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;

/** Generic horizontal bar chart for comparing a rate across named groups (category, weekday,
 *  grounded/not, Val's pick vs. override, back-to-back vs. after a gap, …) — one shape reused for
 *  every "compare average engagement rate across a small set of buckets" question. Bars with no
 *  rate data (zero impressions) still render as an empty row with an "n/a" label. */
export default function BarComparisonChart({
  bars,
  formatValue,
  ariaLabel,
}: {
  bars: ComparisonBar[];
  formatValue: (v: number) => string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

  if (bars.length === 0) return null;

  const maxValue = Math.max(...bars.map((b) => b.value ?? 0), 0.0001);
  const height = PAD_TOP + PAD_BOTTOM + bars.length * ROW_HEIGHT;
  const barAreaWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const xScale = (v: number) => (v / maxValue) * barAreaWidth;

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

  const active = hovered ? bars[hovered.index] : null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={ariaLabel}>
        {bars.map((b, i) => {
          const y = PAD_TOP + i * ROW_HEIGHT;
          const barW = b.value !== null ? xScale(b.value) : 0;
          return (
            <g key={b.label}>
              <text x={PAD_LEFT - 8} y={y + ROW_HEIGHT / 2 + 4} textAnchor="end" fontSize={10} fill="var(--color-neutral-300)">
                {b.label}
              </text>
              <rect x={PAD_LEFT} y={y + 4} width={barAreaWidth} height={ROW_HEIGHT - 12} rx={3} fill="var(--color-neutral-800)" />
              {b.value !== null ? (
                <rect
                  x={PAD_LEFT}
                  y={y + 4}
                  width={Math.max(barW, 2)}
                  height={ROW_HEIGHT - 12}
                  rx={3}
                  fill="var(--gradient-brand)"
                  onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                  onMouseLeave={() => setHovered(null)}
                />
              ) : null}
              <rect
                x={PAD_LEFT}
                y={y}
                width={barAreaWidth}
                height={ROW_HEIGHT}
                fill="transparent"
                onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                onMouseLeave={() => setHovered(null)}
              />
              <text x={PAD_LEFT + barAreaWidth + 6} y={y + ROW_HEIGHT / 2 + 4} fontSize={10} fill="var(--color-neutral-500)">
                {b.value !== null ? formatValue(b.value) : "n/a"}
              </text>
            </g>
          );
        })}
      </svg>

      {active && hovered && (
        <div className="chart-tooltip" style={{ left: hovered.x, top: hovered.y, transform: "translate(-50%, calc(-100% - 10px))" }}>
          <div style={{ fontWeight: 600 }}>{active.label}</div>
          <div style={{ marginTop: 2 }}>
            {active.value !== null ? formatValue(active.value) : "No impression data yet"} · {active.count} post
            {active.count === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
