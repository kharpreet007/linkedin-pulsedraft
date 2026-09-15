"use client";

import { useMemo, useState } from "react";
import type { Theme, TopicIdea, TopicStatus } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const THEMES: Theme[] = ["PM", "AI", "Psychology"];
const COLUMNS: { status: TopicStatus; label: string }[] = [
  { status: "Backlog", label: "Backlog" },
  { status: "Scheduled", label: "Scheduled" },
  { status: "Published", label: "Published" },
];

function themeCardClass(theme: Theme): string {
  if (theme === "PM") return "topic-card topic-card-pm";
  if (theme === "AI") return "topic-card topic-card-ai";
  return "topic-card topic-card-psychology";
}

export default function KanbanView({
  topics,
  today,
  onCreate,
  onMove,
  onSetDate,
  onDelete,
}: {
  topics: TopicIdea[];
  today: string;
  onCreate: (title: string, theme: Theme) => void;
  onMove: (id: string, status: TopicStatus) => void;
  onSetDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const [todayYear, todayMonth] = today.split("-").map((n) => Number(n));
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<Theme>("PM");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TopicStatus | null>(null);

  const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;

  const columnTopics = useMemo(() => {
    const grouped: Record<TopicStatus, TopicIdea[]> = { Backlog: [], Scheduled: [], Published: [] };
    for (const t of topics) {
      if (t.status === "Backlog") {
        grouped.Backlog.push(t);
      } else if (t.scheduledDate?.startsWith(monthKey)) {
        grouped[t.status].push(t);
      }
    }
    return grouped;
  }, [topics, monthKey]);

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
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, theme);
    setTitle("");
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="page-title">Kanban</div>
          <div className="page-subtitle">
            Plan topic ideas by theme and status — a manual planning board, separate from Scout&apos;s
            daily brainstorming
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

      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", maxWidth: 640 }}>
        <input
          className="input"
          type="text"
          placeholder="New topic idea…"
          style={{ flex: 1 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitCreate();
          }}
        />
        <select className="input" value={theme} onChange={(e) => setTheme(e.target.value as Theme)} style={{ width: 130 }}>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={submitCreate} disabled={!title.trim()}>
          Add
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
          alignItems: "start",
        }}
      >
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className={`kanban-column${dragOverCol === col.status ? " drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.status);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === col.status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMove(id, col.status);
              setDragOverCol(null);
              setDragId(null);
            }}
          >
            <div className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              {col.label} · {columnTopics[col.status].length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {columnTopics[col.status].map((t) => (
                <div
                  key={t.id}
                  className={themeCardClass(t.theme) + (dragId === t.id ? " dragging" : "")}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", t.id);
                    setDragId(t.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                    <span className="tag tag-neutral">{t.theme}</span>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="link-btn"
                      style={{ fontSize: 14, lineHeight: 1 }}
                      aria-label={`Delete ${t.title}`}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.4 }}>{t.title}</div>
                  {col.status !== "Backlog" && (
                    <input
                      type="date"
                      className="input"
                      style={{ marginTop: 8, fontSize: 12, padding: "5px 8px" }}
                      value={t.scheduledDate ?? ""}
                      onChange={(e) => onSetDate(t.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
              {columnTopics[col.status].length === 0 && (
                <div className="empty-state" style={{ fontSize: 12 }}>
                  {col.status === "Backlog" ? "No ideas yet — add one above." : "Drag a card here."}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
