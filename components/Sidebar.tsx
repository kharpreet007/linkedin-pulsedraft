"use client";

import type { View } from "@/lib/types";

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "dashboard", label: "Dashboard" },
  { view: "calendar", label: "Calendar" },
  { view: "generator", label: "Post Generator" },
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
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid var(--color-neutral-700)",
        padding: "var(--space-4)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17, letterSpacing: "-0.01em" }}>
          LinkedIn PulseCraft
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-300)", marginTop: 2 }}>Draft Desk</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === activeView || (item.view === "calendar" && activeView === "day");
          return (
            <button
              key={item.view}
              className={`nav-btn${isActive ? " active" : ""}`}
              onClick={() => onSelect(item.view)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
