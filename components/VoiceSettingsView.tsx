"use client";

import { useEffect, useState } from "react";
import { fetchVoice, updateVoice } from "@/lib/api";
import { VOICES, type VoiceId } from "@/lib/voices";

/** Which voice Remy writes tomorrow's 5 candidates in. Doesn't touch Write a Post — that's
 *  always your own words — or any candidates already generated for past/existing dates. */
export default function VoiceSettingsView() {
  const [voice, setVoice] = useState<VoiceId | null>(null);
  const [saving, setSaving] = useState<VoiceId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVoice()
      .then((r) => setVoice(r.voice))
      .catch(() => setError("Could not load your current voice."));
  }, []);

  const choose = async (id: VoiceId) => {
    if (id === voice || saving) return;
    const previous = voice;
    setError("");
    setSaving(id);
    setVoice(id);
    try {
      await updateVoice(id);
    } catch (e) {
      setVoice(previous);
      setError(e instanceof Error ? e.message : "Could not save that voice. Try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <div>
        <div className="page-title">Voice</div>
        <div className="page-subtitle">Pick the writing style Remy uses for tomorrow's 5 generated candidates.</div>
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-3)" }}>{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
          alignItems: "stretch",
        }}
      >
        {VOICES.map((v) => {
          const isSelected = voice === v.id;
          return (
            <button
              key={v.id}
              onClick={() => choose(v.id)}
              disabled={saving !== null}
              className="card"
              style={{
                textAlign: "left",
                cursor: saving ? "default" : "pointer",
                border: isSelected ? "1.5px solid var(--color-accent-600)" : undefined,
                background: isSelected ? "rgba(10, 102, 194, 0.06)" : undefined,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <div className="card-title" style={{ fontSize: 15 }}>
                  {v.name} <span style={{ fontWeight: 400, color: "var(--color-neutral-400)" }}>· {v.label}</span>
                </div>
                {isSelected && (
                  <span className="tag" style={{ background: "var(--color-accent-600)", color: "#fff", flexShrink: 0 }}>
                    {saving === v.id ? "Saving…" : "Selected"}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-text)" }}>{v.description}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-neutral-400)" }}>{v.bestFor}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}
