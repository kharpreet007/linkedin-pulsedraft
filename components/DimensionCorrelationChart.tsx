"use client";

import { useRef, useState } from "react";
import type { DimensionCorrelation } from "@/lib/analytics";

const WIDTH = 460;
const ROW_HEIGHT = 30;
const PAD_LEFT = 156;
const PAD_RIGHT = 40;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;

/** Diverging horizontal bar chart for correlation coefficients (fixed -1..1 domain, bars grow
 *  left or right from a center zero line) — shows which of Val's five score dimensions actually
 *  tracks real engagement, and which ones don't (or work backwards). */
export default function DimensionCorrelationChart({ dimensions }: { dimensions: DimensionCorrelation[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

  if (dimensions.length === 0) return null;

  const height = PAD_TOP + PAD_BOTTOM + dimensions.length * ROW_HEIGHT;
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const zeroX = PAD_LEFT + plotWidth / 2;
  const xScale = (r: number) => zeroX + (r / 1) * (plotWidth / 2);

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

  const active = hovered ? dimensions[hovered.index] : null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Diverging bar chart of each score dimension's correlation with actual engagement, from -1 to 1"
      >
        <line x1={zeroX} y1={0} x2={zeroX} y2={height} stroke="var(--color-neutral-700)" strokeWidth={1} />
        {[-1, 1].map((v) => (
          <text key={v} x={xScale(v)} y={height - 1} textAnchor={v < 0 ? "start" : "end"} fontSize={9} fill="var(--color-neutral-500)">
            {v}
          </text>
        ))}

        {dimensions.map((d, i) => {
          const y = PAD_TOP + i * ROW_HEIGHT;
          const r = d.r ?? 0;
          const barX = r >= 0 ? zeroX : xScale(r);
          const barW = Math.abs(xScale(r) - zeroX);
          return (
            <g key={d.dimension}>
              <text x={PAD_LEFT - 8} y={y + ROW_HEIGHT / 2 + 4} textAnchor="end" fontSize={10} fill="var(--color-neutral-300)">
                {d.dimension}
              </text>
              {d.r !== null ? (
                <rect
                  x={barX}
                  y={y + 5}
                  width={Math.max(barW, 2)}
                  height={ROW_HEIGHT - 14}
                  rx={3}
                  fill={r >= 0 ? "var(--gradient-brand)" : "var(--color-danger)"}
                  onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                  onMouseLeave={() => setHovered(null)}
                />
              ) : null}
              <rect
                x={PAD_LEFT}
                y={y}
                width={plotWidth}
                height={ROW_HEIGHT}
                fill="transparent"
                onMouseEnter={(e) => showTooltip(i, e.currentTarget)}
                onMouseLeave={() => setHovered(null)}
              />
              <text x={WIDTH - PAD_RIGHT + 6} y={y + ROW_HEIGHT / 2 + 4} fontSize={10} fill="var(--color-neutral-500)">
                {d.r !== null ? d.r.toFixed(2) : "n/a"}
              </text>
            </g>
          );
        })}
      </svg>

      {active && hovered && (
        <div className="chart-tooltip" style={{ left: hovered.x, top: hovered.y, transform: "translate(-50%, calc(-100% - 10px))" }}>
          <div style={{ fontWeight: 600 }}>{active.dimension}</div>
          <div style={{ marginTop: 2 }}>{active.r !== null ? `r = ${active.r.toFixed(2)}` : "Not enough data"}</div>
        </div>
      )}
    </div>
  );
}
