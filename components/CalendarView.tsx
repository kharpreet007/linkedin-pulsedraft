"use client";

import { useMemo, useState } from "react";
import type { RunSummary } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Cell {
  key: string;
  day: number | "";
  disabled: boolean;
  posted: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateStr: string | null;
}

export default function CalendarView({
  runs,
  today,
  selectedDate,
  onSelectDate,
}: {
  runs: RunSummary[];
  today: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const [todayYear, todayMonth] = today.split("-").map((n) => Number(n));
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);

  const runByDate = useMemo(() => new Map(runs.map((r) => [r.date, r])), [runs]);

  const cells = useMemo<Cell[]>(() => {
    const firstOfMonth = new Date(calYear, calMonth, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const result: Cell[] = [];
    for (let i = 0; i < startOffset; i++) {
      result.push({ key: `pad-${i}`, day: "", disabled: true, posted: false, isToday: false, isSelected: false, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const run = runByDate.get(dateStr);
      result.push({
        key: dateStr,
        day: d,
        disabled: !run,
        posted: !!run?.posted,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
        dateStr,
      });
    }
    return result;
  }, [calYear, calMonth, runByDate, today, selectedDate]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 680 }}>
        <div>
          <div className="page-title">
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <div className="page-subtitle">Click a highlighted date to open that day&apos;s candidates</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-ghost" onClick={prevMonth} style={{ padding: "7px 13px", fontSize: 15, lineHeight: 1 }}>
            ←
          </button>
          <button className="btn btn-ghost" onClick={nextMonth} style={{ padding: "7px 13px", fontSize: 15, lineHeight: 1 }}>
            →
          </button>
        </div>
      </div>

      {runs.length === 0 && (
        <div className="empty-state" style={{ maxWidth: 680, marginTop: "var(--space-4)" }}>
          No posts yet — today&apos;s pipeline runs automatically once a day, or trigger it manually
          against <code>/api/daily-run</code> to see today&apos;s 5 candidates right away.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: "var(--space-5)", maxWidth: 680 }}>
        {WEEKDAY_LABELS.map((wd) => (
          <div key={wd} className="eyebrow" style={{ textAlign: "center" }}>
            {wd}
          </div>
        ))}
        {cells.map((cell) => (
          <button
            key={cell.key}
            disabled={cell.disabled}
            onClick={cell.dateStr ? () => onSelectDate(cell.dateStr as string) : undefined}
            className={cell.disabled ? undefined : "calendar-cell"}
            style={{
              visibility: cell.day === "" ? "hidden" : "visible",
              position: "relative",
              aspectRatio: "1",
              border: cell.isSelected
                ? "1px solid var(--color-accent-500)"
                : cell.isToday
                  ? "1px solid var(--color-accent-700)"
                  : "1px solid var(--color-neutral-800)",
              borderRadius: "var(--radius-md)",
              background: cell.isSelected
                ? "var(--gradient-brand-soft)"
                : cell.disabled
                  ? "transparent"
                  : "var(--color-bg-elevated)",
              boxShadow: cell.isSelected ? "var(--shadow-glow)" : "none",
              color: cell.disabled ? "var(--color-neutral-600)" : "var(--color-text)",
              cursor: cell.disabled ? "default" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              padding: 7,
              fontFamily: "inherit",
              transition: "border-color 0.12s ease, background 0.12s ease, transform 0.12s ease",
            }}
          >
            <span>{cell.day}</span>
            {cell.posted && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gradient-brand)",
                  position: "absolute",
                  bottom: 7,
                  right: 7,
                  boxShadow: "0 0 8px rgba(167, 139, 250, 0.8)",
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-5)", fontSize: 12, color: "var(--color-neutral-400)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gradient-brand)" }} />
          Published
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid var(--color-accent-700)" }} />
          Today
        </span>
      </div>

      <style>{`
        .calendar-cell:hover:not(:disabled) {
          border-color: var(--color-accent-600) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}
