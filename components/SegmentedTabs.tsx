"use client";

import { useEffect, useRef, useState } from "react";

export interface TabOption {
  key: string;
  label: string;
}

/** Pill-style filter tabs with a sliding highlight behind the active one, measured from the
 *  actual button positions so it works regardless of label length or how many options there
 *  are — no animation library needed for a single moving rectangle. */
export default function SegmentedTabs({
  options,
  value,
  onChange,
}: {
  options: TabOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const el = btnRefs.current[value];
    const container = containerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setThumb({ left: elRect.left - containerRect.left, width: elRect.width });
  };

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={containerRef}
      role="tablist"
      style={{
        position: "relative",
        display: "inline-flex",
        gap: 2,
        padding: 4,
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-neutral-800)",
        borderRadius: "var(--radius-lg)",
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      {thumb && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: thumb.left,
            width: thumb.width,
            background: "var(--gradient-brand)",
            borderRadius: "var(--radius-md)",
            transition: "left 220ms cubic-bezier(.4,0,.2,1), width 220ms cubic-bezier(.4,0,.2,1)",
            zIndex: 0,
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.key}
          ref={(el) => {
            btnRefs.current[o.key] = el;
          }}
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          style={{
            position: "relative",
            zIndex: 1,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            color: value === o.key ? "#fff" : "var(--color-neutral-300)",
            borderRadius: "var(--radius-md)",
            transition: "color 150ms",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
