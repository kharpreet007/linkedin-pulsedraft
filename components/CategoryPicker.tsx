"use client";

import type { KanbanCategory } from "@/lib/types";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";

const ALL_CATEGORIES = Object.keys(KANBAN_CATEGORY_LABELS) as KanbanCategory[];

export default function CategoryPicker({
  selected,
  onToggle,
  disabled,
}: {
  selected: KanbanCategory[];
  onToggle: (c: KanbanCategory) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
        gap: "var(--space-2)",
      }}
    >
      {ALL_CATEGORIES.map((c) => {
        const checked = selected.includes(c);
        return (
          <label
            key={c}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              border: checked ? "1px solid var(--color-accent-600)" : "1px solid var(--color-neutral-800)",
              background: checked ? "var(--gradient-brand-soft)" : "var(--color-bg-elevated)",
              cursor: disabled ? "default" : "pointer",
            }}
          >
            <input type="checkbox" checked={checked} onChange={() => onToggle(c)} disabled={disabled} />
            {KANBAN_CATEGORY_LABELS[c]}
          </label>
        );
      })}
    </div>
  );
}
