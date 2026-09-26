"use client";

import { useState } from "react";
import type { KanbanCategory, RunSummary } from "@/lib/types";
import { KANBAN_CATEGORY_LABELS } from "@/lib/types";
import { fmtLabel } from "@/lib/format";

const CATEGORY_OPTIONS = Object.keys(KANBAN_CATEGORY_LABELS) as KanbanCategory[];

/** The editable Date/Topic/Category/Impressions/Likes/Comments table shared by the Dashboard
 *  (every posted run) and Backfill (just the ones you wrote yourself) — same columns, same
 *  inline-edit behavior, different filter on which runs get passed in. */
export default function PostsTable({
  runs,
  today,
  onEditSelection,
  onEditEngagement,
  emptyMessage,
}: {
  runs: RunSummary[];
  today: string;
  onEditSelection: (date: string, patch: { topic?: string; category?: KanbanCategory }) => void;
  onEditEngagement: (date: string, patch: { impressions?: number; likes?: number; comments?: number }) => void;
  emptyMessage: string;
}) {
  return (
    <>
      <table className="table" style={{ marginTop: "var(--space-4)", width: "100%" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Topic</th>
            <th>Category</th>
            <th>Impressions</th>
            <th>Likes</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <PostRow key={run.date} run={run} today={today} onEditSelection={onEditSelection} onEditEngagement={onEditEngagement} />
          ))}
        </tbody>
      </table>

      {runs.length === 0 && <div className="empty-state" style={{ marginTop: "var(--space-2)" }}>{emptyMessage}</div>}
    </>
  );
}

function PostRow({
  run,
  today,
  onEditSelection,
  onEditEngagement,
}: {
  run: RunSummary;
  today: string;
  onEditSelection: (date: string, patch: { topic?: string; category?: KanbanCategory }) => void;
  onEditEngagement: (date: string, patch: { impressions?: number; likes?: number; comments?: number }) => void;
}) {
  const [topic, setTopic] = useState(run.postedSelection?.topic ?? "");
  const [impressions, setImpressions] = useState(String(run.engagement?.impressions ?? 0));
  const [likes, setLikes] = useState(String(run.engagement?.likes ?? 0));
  const [comments, setComments] = useState(String(run.engagement?.comments ?? 0));

  return (
    <tr>
      <td>{fmtLabel(run.date, today)}</td>
      <td>
        <input
          className="input"
          type="text"
          title={topic}
          style={{ width: "100%", minWidth: 200, textOverflow: "ellipsis" }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={() => onEditSelection(run.date, { topic })}
        />
      </td>
      <td>
        <select
          className="input"
          style={{ minWidth: 150 }}
          value={run.postedSelection?.categoryKey ?? ""}
          onChange={(e) => onEditSelection(run.date, { category: e.target.value as KanbanCategory })}
        >
          {!run.postedSelection?.categoryKey && <option value="">—</option>}
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {KANBAN_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="input"
          type="number"
          min={0}
          style={{ width: 90 }}
          value={impressions}
          onChange={(e) => setImpressions(e.target.value)}
          onBlur={() => onEditEngagement(run.date, { impressions: Number(impressions) || 0 })}
        />
      </td>
      <td>
        <input
          className="input"
          type="number"
          min={0}
          style={{ width: 80 }}
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
          onBlur={() => onEditEngagement(run.date, { likes: Number(likes) || 0 })}
        />
      </td>
      <td>
        <input
          className="input"
          type="number"
          min={0}
          style={{ width: 80 }}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          onBlur={() => onEditEngagement(run.date, { comments: Number(comments) || 0 })}
        />
      </td>
    </tr>
  );
}
