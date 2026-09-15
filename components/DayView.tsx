"use client";

import { useState } from "react";
import type { Candidate, RunDetail } from "@/lib/types";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";
import { fmtHeader } from "@/lib/format";

const VAL_PICK_EMAIL = "kharpreet007@gmail.com";

function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand("copy");
  } catch {
    // clipboard unavailable — nothing more we can do
  }
  document.body.removeChild(el);
}

export default function DayView({
  run,
  today,
  onBack,
  onPublish,
}: {
  run: RunDetail;
  today: string;
  onBack: () => void;
  onPublish: (candidateId: string) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const postedId = run.postedSelection?.candidateId ?? null;
  const candidates = [...run.candidates].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const handleCopy = (candidate: Candidate) => {
    copyToClipboard(candidate.draft);
    onPublish(candidate.id);
    setCopiedId(candidate.id);
    setTimeout(() => setCopiedId((id) => (id === candidate.id ? null : id)), 1600);
  };

  const handleEmail = (candidate: Candidate) => {
    const subject = encodeURIComponent("Val's Pick — " + candidate.topic);
    const body = encodeURIComponent(candidate.draft + "\n\n—\nSent from LinkedIn Pulsedraft Draft Desk");
    window.location.href = `mailto:${VAL_PICK_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div>
        <button onClick={onBack} className="link-btn" style={{ marginBottom: "var(--space-2)" }}>
          ← Back to Calendar
        </button>
        <div className="page-title">{fmtHeader(run.date, today)}</div>
        <div className="page-subtitle">5 candidates from Scout · drafted by Remy · scored &amp; ranked by Val</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "var(--space-4)",
          alignItems: "start",
          marginTop: "var(--space-4)",
        }}
      >
        {candidates.map((c) => {
          const isPosted = postedId === c.id;
          const isCopied = copiedId === c.id;
          const isTopPick = c.rank === 1 || c.rank === 2;
          return (
            <div
              key={c.id}
              className="card"
              style={{
                border: isTopPick ? "1px solid rgba(167, 139, 250, 0.5)" : "1px solid var(--color-neutral-700)",
                background: isTopPick
                  ? "linear-gradient(180deg, rgba(139, 92, 246, 0.08), rgba(255,255,255,0)), var(--color-bg-elevated)"
                  : undefined,
                boxShadow: isTopPick ? "var(--shadow-glow)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span className={isTopPick ? "tag tag-accent" : "tag tag-neutral"}>
                    {isTopPick ? `Val's Pick #${c.rank}` : `#${c.rank}`}
                  </span>
                  <span className="tag tag-neutral">{c.theme ?? (c.category ? KANBAN_CATEGORY_LABELS[c.category] : "")}</span>
                </div>
                {isPosted && (
                  <span className="tag tag-outline" style={{ color: "var(--color-accent-300)", borderColor: "var(--color-accent-600)" }}>
                    Posted
                  </span>
                )}
              </div>

              <div className="card-title" style={{ fontSize: 15, lineHeight: 1.35, marginBottom: "var(--space-3)", minHeight: 40 }}>
                {c.topic}
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                  whiteSpace: "pre-line",
                  maxHeight: 280,
                  overflowY: "auto",
                  paddingRight: 4,
                  marginBottom: "var(--space-3)",
                  borderTop: "1px solid var(--color-neutral-800)",
                  borderBottom: "1px solid var(--color-neutral-800)",
                  paddingTop: "var(--space-3)",
                  paddingBottom: "var(--space-3)",
                }}
              >
                {c.draft}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginBottom: "var(--space-3)", textAlign: "center" }}>
                {c.score &&
                  (
                    [
                      ["Hook", c.score.hook],
                      ["Insight", c.score.insight],
                      ["Auth", c.score.authenticity],
                      ["Engage", c.score.engagement],
                      ["Clarity", c.score.clarity],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <div className="eyebrow-sm">{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginTop: 2 }}>{value}</div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${(value / 10) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <span className="tag tag-neutral" style={{ fontSize: 12 }}>
                  {c.score ? `${c.score.total} / 50` : "—"}
                </span>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {isTopPick && (
                    <button className="btn btn-secondary" onClick={() => handleEmail(c)} style={{ fontSize: 12, padding: "6px 12px" }}>
                      Email Val&apos;s Pick
                    </button>
                  )}
                  <button
                    className={`btn ${isTopPick ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handleCopy(c)}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {isCopied ? "Copied ✓" : "Copy draft"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
