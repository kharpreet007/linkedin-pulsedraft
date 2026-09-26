"use client";

import { useEffect, useState } from "react";
import { writeOwnPost } from "@/lib/api";
import { fmtHeader } from "@/lib/format";

/** For the days you'd rather write your own post than pick one of Scout/Remy/Val's candidates —
 *  skips the pipeline entirely and publishes straight to that date's Dashboard entry. */
export default function WriteAPostView({
  today,
  onPosted,
  onGoToDashboard,
  onGoToBackfile,
}: {
  today: string;
  onPosted: () => void;
  onGoToDashboard: () => void;
  onGoToBackfile: () => void;
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
      setError(e instanceof Error ? e.message : "Could not publish that draft. Try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <div>
        <div className="page-title">Write a Post</div>
        <div className="page-subtitle">Skip the pipeline — write your own post and publish it straight to the Dashboard.</div>
      </div>

      <div style={{ maxWidth: 640, marginTop: "var(--space-4)" }}>
        {postedFor && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              fontSize: 13,
              color: "var(--color-accent-300)",
              border: "1px solid var(--color-accent-600)",
              background: "rgba(10, 102, 194, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              marginBottom: "var(--space-4)",
            }}
          >
            <span>✓ Posted for {fmtHeader(postedFor, today)}.</span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-secondary" onClick={onGoToDashboard} style={{ fontSize: 12, padding: "6px 12px" }}>
                View on Dashboard
              </button>
              <button className="btn btn-secondary" onClick={onGoToBackfile} style={{ fontSize: 12, padding: "6px 12px" }}>
                View in Backfile
              </button>
            </div>
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <span style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>Date</span>
          <input className="input" type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <textarea
          className="input"
          placeholder="Write your post here..."
          rows={14}
          style={{ width: "100%", resize: "vertical", lineHeight: 1.6, fontSize: 14 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
          <button className="btn btn-primary" onClick={postDraft} disabled={!draft.trim() || !date || posting}>
            {posting ? "Posting…" : "Post Draft"}
          </button>
        </div>
      </div>
    </>
  );
}
