export type Theme = "PM" | "AI" | "Psychology";

export interface RunSummary {
  date: string;
  candidateCount: number;
  posted: boolean;
  postedSelection: {
    candidateId: string;
    topic: string;
    category: string;
    grounded: boolean;
    score: CandidateScore | null;
    rank: number | null;
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
  theme: Theme | null;
  category: KanbanCategory | null;
  draft: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
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

export type View = "dashboard" | "calendar" | "day" | "analytics" | "write" | "postits";

export type AssignmentStatus = "Scheduled" | "Published";

export type KanbanCategory =
  | "Business"
  | "Logistics"
  | "SupplyChain"
  | "Transportation"
  | "ProjectManagement"
  | "ProductManagement"
  | "GenAI"
  | "Psychology"
  | "Finance";

export const KANBAN_CATEGORY_LABELS: Record<KanbanCategory, string> = {
  Business: "Business",
  Logistics: "Logistics",
  SupplyChain: "Supply Chain",
  Transportation: "Transportation",
  ProjectManagement: "Project Management",
  ProductManagement: "Product Management",
  GenAI: "Gen-AI",
  Psychology: "Psychology",
  Finance: "Finance",
};

export interface TopicAssignment {
  id: string;
  date: string;
  status: AssignmentStatus;
  category: KanbanCategory;
}
