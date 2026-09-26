"use client";

import type { KanbanCategory, RunSummary } from "@/lib/types";
import PostsTable from "./PostsTable";

export default function DashboardView({
  runs,
  today,
  onEditSelection,
  onEditEngagement,
}: {
  runs: RunSummary[];
  today: string;
  onEditSelection: (date: string, patch: { topic?: string; category?: KanbanCategory }) => void;
  onEditEngagement: (date: string, patch: { impressions?: number; likes?: number; comments?: number }) => void;
}) {
  const postedRuns = runs.filter((r) => r.postedSelection);

  return (
    <>
      <div>
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Every post published so far, with its live engagement</div>
      </div>

      <PostsTable
        runs={postedRuns}
        today={today}
        onEditSelection={onEditSelection}
        onEditEngagement={onEditEngagement}
        emptyMessage="No posts published yet. Pick a winner from the Calendar to see it here."
      />
    </>
  );
}
