"use client";

import { useRef, useState } from "react";

export interface TrendPoint {
  label: string;
  value: number;
  tooltip?: string;
}

const WIDTH = 480;
const HEIGHT = 180;
const PAD_LEFT = 32;
const PAD_RIGHT = 10;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;

/** Generic line chart for any single numeric series over time (engagement rate, score drift, …) —
 *  the trajectory matters more than any single point, so this favors a clean line over a scatter. */
export default function TrendLineChart({
  points,
  ariaLabel,
  formatValue = (v) => String(v),
  formatAxisValue = formatValue,
}: {
  points: TrendPoint[];
  ariaLabel: string;
  formatValue?: (v: number) => string;
  formatAxisValue?: (v: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

  if (points.length === 0) return null;

  const maxValue = Math.max(...points.map((p) => p.value), 0);
  const minValue = Math.min(...points.map((p) => p.value), 0);
  const yMax = maxValue === 0 ? 1 : maxValue * 1.15;
  const yMin = minValue < 0 ? minValue * 1.15 : 0;

  const xScale = (i: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_LEFT + (i / (points.length - 1)) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const yScale = (value: number) =>
    HEIGHT - PAD_BOTTOM - ((value - yMin) / (yMax - yMin)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.value)}`).join(" ");

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
  const tickEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={ariaLabel}>
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-neutral-800)" strokeWidth={1} />
        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--color-neutral-800)"
          strokeWidth={1}
        />

        {[yMin, yMax].map((v) => (
          <text key={v} x={PAD_LEFT - 6} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="var(--color-neutral-500)">
            {formatAxisValue(v)}
          </text>
        ))}

        <path d={linePath} fill="none" stroke="var(--gradient-brand)" strokeWidth={2} />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(p.value)} r={4} className="chart-dot" />
            <circle
              cx={xScale(i)}
              cy={yScale(p.value)}
              r={12}
              className="chart-dot-hit"
              tabIndex={0}
              role="button"
              aria-label={`${p.label}: ${formatValue(p.value)}`}
              onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
              onMouseLeave={() => setHovered(null)}
              onFocus={(e) => showTooltip(i, e.currentTarget)}
              onBlur={() => setHovered(null)}
            />
            {i % tickEvery === 0 && (
              <text
                x={xScale(i)}
                y={HEIGHT - PAD_BOTTOM + 14}
                textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                fontSize={9}
                fill="var(--color-neutral-500)"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {active && hovered && (
        <div className="chart-tooltip" style={{ left: hovered.x, top: hovered.y, transform: "translate(-50%, calc(-100% - 10px))" }}>
          <div style={{ fontWeight: 600 }}>{active.label}</div>
          <div style={{ marginTop: 2 }}>{active.tooltip ?? formatValue(active.value)}</div>
        </div>
      )}
    </div>
  );
}
