"use client";

import { useMemo, useState } from "react";
import type { KanbanCategory, TopicAssignment } from "@/lib/types";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_CATEGORIES = Object.keys(KANBAN_CATEGORY_LABELS) as KanbanCategory[];

export default function PostItsView({
  assignments,
  today,
  onAssign,
  onRemoveAssignment,
}: {
  assignments: TopicAssignment[];
  today: string;
  onAssign: (category: KanbanCategory, date: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const [todayYear, todayMonth] = today.split("-").map((n) => Number(n));
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = new Date(calYear, calMonth, 1).getDay();

  const assignedByDate = useMemo(() => {
    const map = new Map<string, TopicAssignment>();
    for (const a of assignments) {
      if (a.date.startsWith(monthKey)) map.set(a.date, a);
    }
    return map;
  }, [assignments, monthKey]);

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

  const cells: { day: number | ""; dateStr: string | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: "", dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="page-title">Post Its</div>
          <div className="page-subtitle">Drag a category onto a day to assign it there</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div className="page-title" style={{ fontSize: 15 }}>
            {MONTH_NAMES[calMonth]} {calYear}
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
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", marginTop: "var(--space-4)", alignItems: "flex-start" }}>
        <div className="postits-column" style={{ flex: "1 1 200px", maxWidth: 240, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
            Categories
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {ALL_CATEGORIES.map((c) => (
              <div
                key={c}
                className="topic-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", c)}
                style={{ cursor: "grab", fontSize: 13 }}
              >
                {KANBAN_CATEGORY_LABELS[c]}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
            {WEEKDAY_LABELS.map((wd) => (
              <div key={wd} className="eyebrow" style={{ textAlign: "center" }}>
                {wd}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {cells.map((cell, i) => {
              const assigned = cell.dateStr ? assignedByDate.get(cell.dateStr) : undefined;
              const isDragOver = cell.dateStr !== null && dragOverDate === cell.dateStr;
              return (
                <div
                  key={i}
                  className={assigned ? "topic-card" : undefined}
                  onDragOver={(e) => {
                    if (!cell.dateStr || assigned) return;
                    e.preventDefault();
                    setDragOverDate(cell.dateStr);
                  }}
                  onDragLeave={() => setDragOverDate((d) => (d === cell.dateStr ? null : d))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDate(null);
                    if (!cell.dateStr || assigned) return;
                    const category = e.dataTransfer.getData("text/plain") as KanbanCategory;
                    if (ALL_CATEGORIES.includes(category)) onAssign(category, cell.dateStr);
                  }}
                  style={{
                    visibility: cell.day === "" ? "hidden" : "visible",
                    minHeight: 84,
                    borderRadius: "var(--radius-md)",
                    border: assigned
                      ? undefined
                      : isDragOver
                        ? "1px solid var(--color-accent-600)"
                        : "1px solid var(--color-neutral-800)",
                    background: !assigned && isDragOver ? "var(--gradient-brand-soft)" : undefined,
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-neutral-500)" }}>{cell.day}</div>
                  {assigned && (
                    <>
                      <span className="tag tag-neutral" style={{ marginTop: 4, alignSelf: "flex-start", fontSize: 10 }}>
                        {KANBAN_CATEGORY_LABELS[assigned.category]}
                      </span>
                      <button
                        className="link-btn"
                        style={{ fontSize: 10, textAlign: "left", color: "var(--color-neutral-500)", marginTop: 4 }}
                        onClick={() => onRemoveAssignment(assigned.id)}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
