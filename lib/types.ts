export type Theme = "PM" | "AI" | "Psychology";

export interface RunSummary {
  date: string;
  candidateCount: number;
  posted: boolean;
  postedSelection: {
    candidateId: string;
    topic: string;
    theme: Theme;
    scoreTotal: number | null;
    postedAt: string;
  } | null;
  engagement: {
    impressions: number;
    likes: number;
    comments: number;
  } | null;
}

export interface CandidateScore {
  hook: number;
  insight: number;
  authenticity: number;
  engagement: number;
  clarity: number;
  total: number;
}

export interface Candidate {
  id: string;
  topic: string;
  theme: Theme;
  draft: string;
  rank: number | null;
  score: CandidateScore | null;
}

export interface RunDetail {
  date: string;
  candidates: Candidate[];
  postedSelection: {
    candidateId: string;
    topicOverride: string | null;
    themeOverride: Theme | null;
    postedAt: string;
  } | null;
  engagement: {
    impressions: number;
    likes: number;
    comments: number;
  } | null;
}

export type View = "dashboard" | "calendar" | "day" | "analytics" | "generator";
