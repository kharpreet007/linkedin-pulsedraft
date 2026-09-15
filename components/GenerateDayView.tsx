"use client";

import { useState } from "react";
import type { KanbanCategory, RunDetail } from "@/lib/types";
import { generateRunForDate } from "@/lib/api";
import { fmtHeader } from "@/lib/format";
import CategoryPicker from "@/components/CategoryPicker";

export default function GenerateDayView({
  date,
  today,
  onBack,
  onGenerated,
}: {
  date: string;
  today: string;
  onBack: () => void;
  onGenerated: (detail: RunDetail) => void;
}) {
  const [selected, setSelected] = useState<KanbanCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (c: KanbanCategory) => {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleGenerate = async () => {
    if (selected.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await generateRunForDate(date, selected);
      onGenerated(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate posts for that date");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <button onClick={onBack} className="link-btn" style={{ marginBottom: "var(--space-2)" }}>
          ← Back to Calendar
        </button>
        <div className="page-title">{fmtHeader(date, today)}</div>
        <div className="page-subtitle">No posts yet — choose subjects and generate 5 candidates for this day</div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: "var(--space-4)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
          Subjects
        </div>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <CategoryPicker selected={selected} onToggle={toggle} disabled={loading} />
        </div>

        {error && <div style={{ fontSize: 13, color: "var(--color-accent-300)", marginBottom: "var(--space-3)" }}>{error}</div>}

        <button className="btn btn-primary" onClick={handleGenerate} disabled={selected.length === 0 || loading}>
          {loading
            ? "Generating…"
            : `Generate 5 posts${selected.length ? ` (${selected.length} subject${selected.length > 1 ? "s" : ""})` : ""}`}
        </button>
        {loading && (
          <div style={{ fontSize: 12, color: "var(--color-neutral-400)", marginTop: "var(--space-2)" }}>
            Scout is brainstorming, Remy is drafting, and Val is scoring — this can take a minute or two.
          </div>
        )}
      </div>
    </>
  );
}
