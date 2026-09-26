"use client";

import { useEffect, useState } from "react";
import type { KanbanCategory, RunSummary } from "@/lib/types";
import { writeOwnPost } from "@/lib/api";
import { fmtHeader } from "@/lib/format";
import PostsTable from "./PostsTable";

/** Posts you wrote yourself (via Write a Post) never went through Scout/Remy/Val, so they have
 *  no score — that's the one thing that reliably tells a hand-written post apart from a
 *  generated one, the same way "grounded" is inferred from sourceUrl elsewhere in this app. */
function isBackfilled(run: RunSummary): boolean {
  return !!run.postedSelection && run.postedSelection.score === null;
}

export default function BackfillView({
  runs,
  today,
  onPosted,
  onEditSelection,
  onEditEngagement,
}: {
  runs: RunSummary[];
  today: string;
  onPosted: () => void;
  onEditSelection: (date: string, patch: { topic?: string; category?: KanbanCategory }) => void;
  onEditEngagement: (date: string, patch: { impressions?: number; likes?: number; comments?: number }) => void;
}) {
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [postedFor, setPostedFor] = useState<string | null>(null);

  useEffect(() => {
    setDate((prev) => (prev === "" ? today : prev));
  }, [today]);

  const postDraft = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !date) return;
    setPosting(true);
    setError("");
    try {
      await writeOwnPost(date, trimmed);
      setPostedFor(date);
      setDraft("");
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const backfilledRuns = runs.filter(isBackfilled);

  return (
    <>
      <div>
        <div className="page-title">Backfill</div>
        <div className="page-subtitle">Your own hand-written posts, tracked by date — separate from the AI-generated ones.</div>
      </div>

      <div className="card" style={{ marginTop: "var(--space-4)" }}>
        <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
          Add a post for a date
        </div>

        {postedFor && (
          <div
            style={{
              fontSize: 13,
              color: "var(--color-accent-300)",
              border: "1px solid var(--color-accent-600)",
              background: "rgba(10, 102, 194, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            ✓ Saved for {fmtHeader(postedFor, today)} — it now appears in the table below.
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <span style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>Date</span>
          <input className="input" type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <textarea
          className="input"
          placeholder="Write the post you published (or plan to publish) for this date..."
          rows={8}
          style={{ width: "100%", resize: "vertical", lineHeight: 1.6, fontSize: 14 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
          <button className="btn btn-primary" onClick={postDraft} disabled={!draft.trim() || !date || posting}>
            {posting ? "Saving…" : "Add to Backfill"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: "var(--space-5)" }}>
        <div className="card-title" style={{ fontSize: 16, marginBottom: "var(--space-2)" }}>
          Your backfilled posts
        </div>
        <PostsTable
          runs={backfilledRuns}
          today={today}
          onEditSelection={onEditSelection}
          onEditEngagement={onEditEngagement}
          emptyMessage="Nothing backfilled yet — add your first hand-written post above."
        />
      </div>
    </>
  );
}
