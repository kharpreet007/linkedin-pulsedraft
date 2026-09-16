"use client";

import { useState } from "react";
import { generateDraft } from "@/lib/api";

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

export default function GeneratorView() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setDraft("");
    try {
      const res = await generateDraft(trimmed);
      setDraft(res.draft.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate a draft right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    copyToClipboard(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <div>
        <div className="page-title">Post Generator</div>
        <div className="page-subtitle">Give Remy a topic — get back a full storyteller-style draft</div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", maxWidth: 640, marginTop: "var(--space-4)" }}>
        <input
          className="input"
          type="text"
          placeholder="e.g. Why roadmaps keep breaking trust"
          style={{ flex: 1 }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
        />
        <button className="btn btn-primary" onClick={generate} disabled={!topic.trim() || loading}>
          {loading ? "Writing…" : "Generate"}
        </button>
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{error}</div>}

      {draft && (
        <div className="card" style={{ maxWidth: 640, marginTop: "var(--space-4)" }}>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text)", whiteSpace: "pre-line" }}>{draft}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
            <button className="btn btn-secondary" onClick={copy} style={{ fontSize: 12, padding: "6px 12px" }}>
              {copied ? "Copied ✓" : "Copy draft"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
