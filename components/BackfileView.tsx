"use client";

import { useEffect, useState } from "react";
import type { BackfileEntry } from "@/lib/types";
import { getBackfile } from "@/lib/api";
import { fmtHeader } from "@/lib/format";
import { copyToClipboard } from "@/lib/clipboard";
import { Skeleton } from "./Skeleton";

const PREVIEW_LINES = 3;

export default function BackfileView({ today }: { today: string }) {
  const [entries, setEntries] = useState<BackfileEntry[] | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

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
                  <button className="btn btn-secondary" onClick={() => handleCopy(entry)} style={{ fontSize: 12, padding: "6px 12px" }}>
                    {copiedDate === entry.date ? "Copied ✓" : "Copy"}
                  </button>
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
