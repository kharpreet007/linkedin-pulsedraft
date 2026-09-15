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
const MAX_RANGE_DAYS = 366;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function KanbanView({
  assignments,
  today,
  onGenerate,
  onMarkPublished,
  onRemoveAssignment,
}: {
  assignments: TopicAssignment[];
  today: string;
  onGenerate: (items: { category: KanbanCategory; date: string }[]) => void;
  onMarkPublished: (assignmentId: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const [todayYear, todayMonth] = today.split("-").map((n) => Number(n));
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);
  const [selectedCategories, setSelectedCategories] = useState<Set<KanbanCategory>>(new Set());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => addDays(today, 29));

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

  const allAssignedDates = useMemo(() => new Set(assignments.map((a) => a.date)), [assignments]);

  const toggleCategory = (c: KanbanCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

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

  const canGenerate = selectedCategories.size >= 2 && startDate <= endDate;

  const generateCalendar = () => {
    if (!canGenerate) return;
    const categories = ALL_CATEGORIES.filter((c) => selectedCategories.has(c));

    const items: { category: KanbanCategory; date: string }[] = [];
    let cursor = 0;
    let date = startDate;
    let guard = 0;
    while (date <= endDate && guard < MAX_RANGE_DAYS) {
      if (!allAssignedDates.has(date)) {
        items.push({ category: categories[cursor % categories.length], date });
        cursor += 1;
      }
      date = addDays(date, 1);
      guard += 1;
    }

    if (items.length > 0) onGenerate(items);
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
          <div className="page-title">Kanban</div>
          <div className="page-subtitle">
            Pick categories and a date range — assignments cycle through them evenly, day by day
          </div>
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
        <div className="kanban-column" style={{ flex: "1 1 280px", maxWidth: 320, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
            Categories · {selectedCategories.size} selected
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
            {ALL_CATEGORIES.map((c) => (
              <label key={c} className="topic-card" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={selectedCategories.has(c)} onChange={() => toggleCategory(c)} />
                <span style={{ fontSize: 13 }}>{KANBAN_CATEGORY_LABELS[c]}</span>
              </label>
            ))}
          </div>

          <div className="eyebrow-sm" style={{ marginBottom: 6 }}>
            Date range
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, minWidth: 0, fontSize: 12 }}
            />
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, minWidth: 0, fontSize: 12 }}
            />
          </div>
          {startDate > endDate && (
            <div className="empty-state" style={{ fontSize: 12, marginBottom: "var(--space-3)" }}>
              Start date must be on or before the end date.
            </div>
          )}
          {selectedCategories.size === 1 && (
            <div className="empty-state" style={{ fontSize: 12, marginBottom: "var(--space-3)" }}>
              Pick at least 2 categories to cycle through.
            </div>
          )}

          <button className="btn btn-primary" onClick={generateCalendar} disabled={!canGenerate} style={{ width: "100%" }}>
            Generate ({selectedCategories.size} selected)
          </button>
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
              return (
                <div
                  key={i}
                  className={assigned ? "topic-card" : undefined}
                  style={{
                    visibility: cell.day === "" ? "hidden" : "visible",
                    minHeight: 84,
                    borderRadius: "var(--radius-md)",
                    border: assigned ? undefined : "1px solid var(--color-neutral-800)",
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
                      {assigned.status === "Published" ? (
                        <span className="tag tag-outline" style={{ fontSize: 9, alignSelf: "flex-start", marginTop: 4 }}>
                          Published
                        </span>
                      ) : (
                        <button
                          className="link-btn"
                          style={{ fontSize: 10, textAlign: "left", marginTop: 4 }}
                          onClick={() => onMarkPublished(assigned.id)}
                        >
                          Mark published
                        </button>
                      )}
                      <button
                        className="link-btn"
                        style={{ fontSize: 10, textAlign: "left", color: "var(--color-neutral-500)" }}
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
