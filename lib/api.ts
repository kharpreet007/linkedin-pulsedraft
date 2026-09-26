import type { BackfileEntry, KanbanCategory, RunDetail, RunSummary, Theme, TopicAssignment } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchRuns(): Promise<RunSummary[]> {
  return fetch("/api/runs").then((res) => json<RunSummary[]>(res));
}

export async function fetchRunDetail(date: string): Promise<RunDetail | null> {
  const res = await fetch(`/api/runs/${date}`);
  if (res.status === 404) return null;
  return json<RunDetail>(res);
}

export function publishCandidate(date: string, candidateId: string): Promise<{ candidateId: string }> {
  return fetch(`/api/runs/${date}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId }),
  }).then((res) => json(res));
}

export function updateSelection(
  date: string,
  patch: { topic?: string; category?: KanbanCategory }
): Promise<{ topicOverride: string | null; themeOverride: Theme | null; categoryOverride: KanbanCategory | null }> {
  return fetch(`/api/runs/${date}/selection`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((res) => json(res));
}

export function updateEngagement(
  date: string,
  patch: { impressions?: number; likes?: number; comments?: number }
): Promise<{ impressions: number; likes: number; comments: number }> {
  return fetch(`/api/runs/${date}/engagement`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((res) => json(res));
}

export function writeOwnPost(date: string, draft: string): Promise<{ date: string; candidateId: string }> {
  return fetch(`/api/runs/${date}/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft }),
  }).then((res) => json(res));
}

export function getBackfile(date?: string): Promise<BackfileEntry[]> {
  const query = date ? `?date=${date}` : "";
  return fetch(`/api/backfile${query}`).then((res) => json<BackfileEntry[]>(res));
}

export function fetchAssignments(): Promise<TopicAssignment[]> {
  return fetch("/api/topic-assignments").then((res) => json<TopicAssignment[]>(res));
}

export function generateAssignments(items: { category: KanbanCategory; date: string }[]): Promise<{ created: number }> {
  return fetch("/api/topic-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignments: items }),
  }).then((res) => json(res));
}

export function deleteAssignment(id: string): Promise<{ ok: boolean }> {
  return fetch(`/api/topic-assignments/${id}`, { method: "DELETE" }).then((res) => json(res));
}

export function fetchBaselineRate(): Promise<{ postsPerWeek: number | null }> {
  return fetch("/api/settings/baseline-rate").then((res) => json(res));
}

export function updateBaselineRate(postsPerWeek: number): Promise<{ postsPerWeek: number }> {
  return fetch("/api/settings/baseline-rate", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postsPerWeek }),
  }).then((res) => json(res));
}
