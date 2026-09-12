import type { RunDetail, RunSummary, Theme } from "./types";

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

export function fetchRunDetail(date: string): Promise<RunDetail> {
  return fetch(`/api/runs/${date}`).then((res) => json<RunDetail>(res));
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
  patch: { topic?: string; theme?: Theme }
): Promise<{ topicOverride: string | null; themeOverride: Theme | null }> {
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

export function generateDraft(topic: string): Promise<{ draft: string }> {
  return fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  }).then((res) => json(res));
}
