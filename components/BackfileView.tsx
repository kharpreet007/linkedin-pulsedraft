"use client";

import { useEffect, useState } from "react";
import type { BackfileEntry } from "@/lib/types";
import { getBackfile, deleteBackfilePost } from "@/lib/api";
import { fmtHeader } from "@/lib/format";
import { copyToClipboard } from "@/lib/clipboard";
import { Skeleton } from "./Skeleton";

const PREVIEW_LINES = 3;

export default function BackfileView({ today }: { today: string }) {
  const [entries, setEntries] = useState<BackfileEntry[] | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedDate, setCopiedDate] = useState<string | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setEntries(null);
    getBackfile(dateFilter || undefined)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [dateFilter]);

  const toggleExpanded = (date: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleCopy = (entry: BackfileEntry) => {
    copyToClipboard(entry.text);
    setCopiedDate(entry.date);
    setTimeout(() => setCopiedDate((d) => (d === entry.date ? null : d)), 1600);
  };

  const handleDelete = async (entry: BackfileEntry) => {
    if (!window.confirm(`Delete the post for ${fmtHeader(entry.date, today)}? This can't be undone.`)) return;
    setError("");
    setDeletingDate(entry.date);
    try {
      await deleteBackfilePost(entry.date);
      setEntries((prev) => prev?.filter((e) => e.date !== entry.date) ?? prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that post. Try again.");
    } finally {
      setDeletingDate(null);
    }
  };

  return (
    <>
      <div>
        <div className="page-title">Backfile</div>
        <div className="page-subtitle">Posts you've written yourself in Write a Post, by date</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
        <input
          className="input"
          type="date"
          style={{ width: 170 }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <button className="btn btn-ghost" onClick={() => setDateFilter("")} disabled={!dateFilter} style={{ fontSize: 12, padding: "6px 12px" }}>
          Clear
        </button>
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-3)" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        {entries === null &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton style={{ width: 160, height: 14 }} />
              <div style={{ marginTop: 10 }}>
                <Skeleton style={{ width: "60%", height: 18 }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Skeleton style={{ width: "100%", height: 60 }} />
              </div>
            </div>
          ))}

        {entries !== null &&
          entries.map((entry) => {
            const lines = entry.text.split("\n");
            const isExpanded = expanded.has(entry.date);
            const preview = isExpanded ? entry.text : lines.slice(0, PREVIEW_LINES).join("\n");
            const canExpand = lines.length > PREVIEW_LINES;

            return (
              <div key={entry.date} className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <span className="tag tag-neutral">{entry.theme}</span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-400)" }}>{fmtHeader(entry.date, today)}</span>
                </div>

                <div className="card-title" style={{ fontSize: 15, marginTop: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                  {entry.topic}
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text)", whiteSpace: "pre-line" }}>{preview}</div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-3)" }}>
                  {canExpand ? (
                    <button className="link-btn" onClick={() => toggleExpanded(entry.date)} style={{ fontSize: 12 }}>
                      {isExpanded ? "Collapse" : "Expand"}
                    </button>
                  ) : (
                    <span />
                  )}
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDelete(entry)}
                      disabled={deletingDate === entry.date}
                      style={{ fontSize: 12, padding: "6px 12px", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                    >
                      {deletingDate === entry.date ? "Deleting…" : "Delete"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleCopy(entry)} style={{ fontSize: 12, padding: "6px 12px" }}>
                      {copiedDate === entry.date ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {entries !== null && entries.length === 0 && (
          <div className="empty-state">
            {dateFilter ? "No post written on this date." : "No hand-written posts yet — add one from Write a Post."}
          </div>
        )}
      </div>
    </>
  );
}
