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
  onSelectDate,
}: {
  runs: RunSummary[];
  today: string;
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
        isSelected: false,
        dateStr,
      });
    }
    return result;
  }, [calYear, calMonth, runByDate, today]);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 640 }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22 }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-neutral-300)", marginTop: 4 }}>
            Click a highlighted date to open that day&apos;s candidates
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-ghost" onClick={prevMonth} style={{ padding: "6px 12px" }}>
            ←
          </button>
          <button className="btn btn-ghost" onClick={nextMonth} style={{ padding: "6px 12px" }}>
            →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: "var(--space-4)", maxWidth: 640 }}>
        {WEEKDAY_LABELS.map((wd) => (
          <div
            key={wd}
            style={{ fontSize: 11, color: "var(--color-neutral-400)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}
          >
            {wd}
          </div>
        ))}
        {cells.map((cell) => (
          <button
            key={cell.key}
            disabled={cell.disabled}
            onClick={cell.dateStr ? () => onSelectDate(cell.dateStr as string) : undefined}
            style={{
              visibility: cell.day === "" ? "hidden" : "visible",
              position: "relative",
              aspectRatio: "1",
              border: cell.isToday ? "1px solid var(--color-accent-700)" : "1px solid var(--color-neutral-800)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: cell.disabled ? "var(--color-neutral-500)" : "var(--color-text)",
              cursor: cell.disabled ? "default" : "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              padding: 6,
              fontFamily: "inherit",
            }}
          >
            <span>{cell.day}</span>
            {cell.posted && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  boxShadow: "0 0 5px var(--color-accent)",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
