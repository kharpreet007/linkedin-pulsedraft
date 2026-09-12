"use client";

import { useState } from "react";
import type { RunSummary, Theme } from "@/lib/types";
import { fmtLabel } from "@/lib/format";

const THEMES: Theme[] = ["PM", "AI", "Psychology"];

export default function DashboardView({
  runs,
  today,
  onEditSelection,
  onEditEngagement,
}: {
  runs: RunSummary[];
  today: string;
  onEditSelection: (date: string, patch: { topic?: string; theme?: Theme }) => void;
  onEditEngagement: (date: string, patch: { impressions?: number; likes?: number; comments?: number }) => void;
}) {
  const postedRuns = runs.filter((r) => r.postedSelection);

  return (
    <>
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22 }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "var(--color-neutral-300)", marginTop: 4 }}>
          Every post published so far, with its live engagement
        </div>
      </div>

      <table className="table" style={{ marginTop: "var(--space-4)", width: "100%" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Topic</th>
            <th>Theme</th>
            <th>Impressions</th>
            <th>Likes</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {postedRuns.map((run) => (
            <DashboardRow
              key={run.date}
              run={run}
              today={today}
              onEditSelection={onEditSelection}
              onEditEngagement={onEditEngagement}
            />
          ))}
        </tbody>
      </table>

      {postedRuns.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--color-neutral-400)", marginTop: "var(--space-2)" }}>
          No posts published yet. Pick a winner from the Calendar to see it here.
        </div>
      )}
    </>
  );
}

function DashboardRow({
  run,
  today,
  onEditSelection,
  onEditEngagement,
}: {
  run: RunSummary;
  today: string;
  onEditSelection: (date: string, patch: { topic?: string; theme?: Theme }) => void;
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
          style={{ minWidth: 200 }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={() => onEditSelection(run.date, { topic })}
        />
      </td>
      <td>
        <select
          className="input"
          style={{ minWidth: 120 }}
          value={run.postedSelection?.theme ?? "PM"}
          onChange={(e) => onEditSelection(run.date, { theme: e.target.value as Theme })}
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
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
