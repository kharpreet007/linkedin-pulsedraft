"use client";

import { useEffect, useState } from "react";
import { fetchVoice, updateVoice, fetchStyle, updateStyle } from "@/lib/api";
import { VOICES, type VoiceId } from "@/lib/voices";
import { STYLES, type StyleId } from "@/lib/styles";

interface PickerCard {
  id: string;
  title: string;
  description: string;
  bestFor: string;
}

function CardGrid({
  cards,
  selectedId,
  saving,
  onChoose,
}: {
  cards: PickerCard[];
  selectedId: string | null;
  saving: string | null;
  onChoose: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "var(--space-3)",
        marginTop: "var(--space-4)",
        alignItems: "stretch",
      }}
    >
      {cards.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChoose(c.id)}
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
                {c.title}
              </div>
              {isSelected && (
                <span className="tag" style={{ background: "var(--color-accent-600)", color: "#fff", flexShrink: 0 }}>
                  {saving === c.id ? "Saving…" : "Selected"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-text)" }}>{c.description}</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-neutral-400)" }}>{c.bestFor}</div>
          </button>
        );
      })}
    </div>
  );
}

const VOICE_CARDS: PickerCard[] = VOICES.map((v) => ({
  id: v.id,
  title: `${v.name} · ${v.label}`,
  description: v.description,
  bestFor: v.bestFor,
}));

const STYLE_CARDS: PickerCard[] = STYLES.map((s) => ({
  id: s.id,
  title: s.name,
  description: s.description,
  bestFor: s.bestFor,
}));

/** Voice controls tone (who's "speaking"); Style controls structure (how the post is shaped) — two
 *  independent dials Remy combines when writing tomorrow's 5 candidates. Doesn't touch Write a Post
 *  — that's always your own words — or any candidates already generated for past/existing dates. */
export default function VoiceSettingsView() {
  const [voice, setVoice] = useState<VoiceId | null>(null);
  const [savingVoice, setSavingVoice] = useState<VoiceId | null>(null);
  const [style, setStyle] = useState<StyleId | null>(null);
  const [savingStyle, setSavingStyle] = useState<StyleId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVoice()
      .then((r) => setVoice(r.voice))
      .catch(() => setError("Could not load your current voice."));
    fetchStyle()
      .then((r) => setStyle(r.style))
      .catch(() => setError((prev) => prev || "Could not load your current writing style."));
  }, []);

  const chooseVoice = async (id: string) => {
    const voiceId = id as VoiceId;
    if (voiceId === voice || savingVoice) return;
    const previous = voice;
    setError("");
    setSavingVoice(voiceId);
    setVoice(voiceId);
    try {
      await updateVoice(voiceId);
    } catch (e) {
      setVoice(previous);
      setError(e instanceof Error ? e.message : "Could not save that voice. Try again.");
    } finally {
      setSavingVoice(null);
    }
  };

  const chooseStyle = async (id: string) => {
    const styleId = id as StyleId;
    if (styleId === style || savingStyle) return;
    const previous = style;
    setError("");
    setSavingStyle(styleId);
    setStyle(styleId);
    try {
      await updateStyle(styleId);
    } catch (e) {
      setStyle(previous);
      setError(e instanceof Error ? e.message : "Could not save that writing style. Try again.");
    } finally {
      setSavingStyle(null);
    }
  };

  return (
    <>
      <div>
        <div className="page-title">Voice</div>
        <div className="page-subtitle">Pick the voice and writing style Remy uses for tomorrow's 5 generated candidates.</div>
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: "var(--space-3)" }}>{error}</div>}

      <CardGrid cards={VOICE_CARDS} selectedId={voice} saving={savingVoice} onChoose={chooseVoice} />

      <div className="page-title" style={{ fontSize: 18, marginTop: "var(--space-6)" }}>
        Choose your own writing style
      </div>
      <CardGrid cards={STYLE_CARDS} selectedId={style} saving={savingStyle} onChoose={chooseStyle} />
    </>
  );
}
