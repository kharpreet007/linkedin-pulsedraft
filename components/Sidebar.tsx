"use client";

import type { View } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

const ICONS: Record<View, JSX.Element> = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1.5" width="6" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 1v3M11.5 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  day: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  write: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10.5 2.5l3 3-8 8-3.5.5.5-3.5 8-8z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M9 4l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4.5" y="8" width="2" height="4" rx="0.6" fill="currentColor" />
      <rect x="8" y="5" width="2" height="7" rx="0.6" fill="currentColor" />
      <rect x="11.5" y="9.5" width="2" height="2.5" rx="0.6" fill="currentColor" />
    </svg>
  ),
  postits: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 2v12M10.5 2v12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  backfile: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 4l1.8-2h9.4l1.8 2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.2 8h3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  voice: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0V4A2.5 2.5 0 0 0 8 1.5z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 7.5v1a4.5 4.5 0 0 0 9 0v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 13v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "dashboard", label: "Dashboard" },
  { view: "postits", label: "Post Its" },
  { view: "calendar", label: "Calendar" },
  { view: "write", label: "Write a Post" },
  { view: "backfile", label: "Backfile" },
  { view: "voice", label: "Voice" },
  { view: "analytics", label: "Analytics" },
];

export default function Sidebar({
  activeView,
  onSelect,
}: {
  activeView: View;
  onSelect: (view: View) => void;
}) {
  return (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        background: "var(--color-neutral-800)",
        borderRight: "1px solid var(--color-neutral-700)",
        padding: "var(--space-5) var(--space-4)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(10, 102, 194, 0.25)",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M1 9.5H4.5L6.5 4L10 15L12 9.5H17"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Pulsedraft
          </div>
          <div style={{ fontSize: 11, color: "var(--color-neutral-400)", marginTop: 1 }}>Content Automation for LinkedIn</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === activeView || (item.view === "calendar" && activeView === "day");
          return (
            <button
              key={item.view}
              className={`nav-btn${isActive ? " active" : ""}`}
              onClick={() => onSelect(item.view)}
            >
              {ICONS[item.view]}
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <ThemeToggle />
      </div>
    </aside>
  );
}
