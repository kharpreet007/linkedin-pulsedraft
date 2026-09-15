"use client";

import { useMemo, useState } from "react";
import type { Theme, TopicAssignment, TopicIdea } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const THEMES: Theme[] = ["PM", "AI", "Psychology"];

const SUGGESTED_TOPICS: { title: string; theme: Theme }[] = [
  { title: "Why roadmaps break trust with engineering", theme: "PM" },
  { title: "The feature nobody asked for that shipped anyway", theme: "PM" },
  { title: "Saying no to your loudest stakeholder", theme: "PM" },
  { title: "When metrics lie about what users actually want", theme: "PM" },
  { title: "Why 'quick win' features rarely are", theme: "PM" },
  { title: "The junior talent paradox: AI automating what used to train juniors", theme: "AI" },
  { title: "When AI agents hallucinate with total confidence", theme: "AI" },
  { title: "Why prompt engineering is really just clear thinking", theme: "AI" },
  { title: "The gap between AI demos and AI in production", theme: "AI" },
  { title: "What AI still can't replace about judgment calls", theme: "AI" },
  { title: "Why feedback feels personal even when it isn't", theme: "Psychology" },
  { title: "The psychology of standup dread", theme: "Psychology" },
  { title: "Why we overestimate how much people notice our mistakes", theme: "Psychology" },
  { title: "The quiet cost of always being \"on\" at work", theme: "Psychology" },
  { title: "Why praise in public and criticism in private isn't always right", theme: "Psychology" },
];

function themeCardClass(theme: Theme): string {
  if (theme === "PM") return "topic-card topic-card-pm";
  if (theme === "AI") return "topic-card topic-card-ai";
  return "topic-card topic-card-psychology";
}

export default function KanbanView({
  topics,
  assignments,
  today,
  onCreate,
  onGenerate,
  onMarkPublished,
  onRemoveAssignment,
  onDeleteTopic,
}: {
  topics: TopicIdea[];
  assignments: TopicAssignment[];
  today: string;
  onCreate: (title: string, theme: Theme) => void;
  onGenerate: (items: { topicId: string; date: string }[]) => void;
  onMarkPublished: (assignmentId: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onDeleteTopic: (topicId: string) => void;
}) {
  const [todayYear, todayMonth] = today.split("-").map((n) => Number(n));
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);
  const [pendingSubject, setPendingSubject] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const existingTitles = useMemo(() => new Set(topics.map((t) => t.title)), [topics]);
  const availableSubjects = SUGGESTED_TOPICS.filter((s) => !existingTitles.has(s.title));

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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const submitCreate = () => {
    const subject = availableSubjects.find((s) => s.title === pendingSubject);
    if (!subject) return;
    onCreate(subject.title, subject.theme);
    setPendingSubject("");
  };

  const generateCalendar = () => {
    const selected = topics.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;

    const queues: Record<Theme, TopicIdea[]> = { PM: [], AI: [], Psychology: [] };
    for (const t of selected) queues[t.theme].push(t);

    const cursor: Record<Theme, number> = { PM: 0, AI: 0, Psychology: 0 };
    const items: { topicId: string; date: string }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (assignedByDate.has(dateStr)) continue; // never overwrite an existing day

      const dayTheme = THEMES[(d - 1) % 3];
      const pool = queues[dayTheme];
      if (pool.length === 0) continue; // nothing selected for this theme — leave the day empty

      const topic = pool[cursor[dayTheme] % pool.length];
      cursor[dayTheme] += 1;
      items.push({ topicId: topic.id, date: dateStr });
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
            Pick topics, generate a month of assignments cycling through themes day by day — a manual
            planning board, separate from Scout&apos;s daily brainstorming
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
            Topic pool · {topics.length}
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <select
              className="input"
              value={pendingSubject}
              onChange={(e) => setPendingSubject(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="">Choose a subject…</option>
              {THEMES.map((th) => (
                <optgroup key={th} label={th}>
                  {availableSubjects
                    .filter((s) => s.theme === th)
                    .map((s) => (
                      <option key={s.title} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-primary" onClick={submitCreate} disabled={!pendingSubject}>
              Add
            </button>
          </div>

          <div className="eyebrow-sm" style={{ marginBottom: 6 }}>
            Select topics, then generate — an idea can be picked again and reused across
            several days
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: 320, overflowY: "auto" }}>
            {topics.map((t) => (
              <label key={t.id} className={themeCardClass(t.theme)} style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(t.id)}
                  onChange={() => toggleSelected(t.id)}
                  style={{ marginTop: 3 }}
                />
                <div style={{ flex: 1 }}>
                  <span className="tag tag-neutral">{t.theme}</span>
                  <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{t.title}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteTopic(t.id);
                  }}
                  className="link-btn"
                  style={{ fontSize: 14, lineHeight: 1 }}
                  aria-label={`Delete ${t.title}`}
                >
                  ×
                </button>
              </label>
            ))}
            {topics.length === 0 && <div className="empty-state" style={{ fontSize: 12 }}>No ideas yet — add one above.</div>}
          </div>

          <button
            className="btn btn-primary"
            onClick={generateCalendar}
            disabled={selectedIds.size === 0}
            style={{ width: "100%", marginTop: "var(--space-3)" }}
          >
            Generate {MONTH_NAMES[calMonth]} ({selectedIds.size} selected)
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
                  style={{
                    visibility: cell.day === "" ? "hidden" : "visible",
                    minHeight: 84,
                    borderRadius: "var(--radius-md)",
                    border: assigned ? undefined : "1px solid var(--color-neutral-800)",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  className={assigned ? themeCardClass(assigned.theme) : undefined}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-neutral-500)" }}>{cell.day}</div>
                  {assigned && (
                    <>
                      <div style={{ fontSize: 11, lineHeight: 1.3, marginTop: 4, flex: 1, overflow: "hidden" }}>{assigned.title}</div>
                      {assigned.status === "Published" ? (
                        <span className="tag tag-outline" style={{ fontSize: 9, alignSelf: "flex-start" }}>
                          Published
                        </span>
                      ) : (
                        <button
                          className="link-btn"
                          style={{ fontSize: 10, textAlign: "left" }}
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
