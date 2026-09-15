import type { Run, Candidate, Score, PostedSelection, Engagement } from "@prisma/client";

export type RunWithRelations = Run & {
  candidates: (Candidate & { score: Score | null })[];
  postedSelection: (PostedSelection & { candidate: Candidate }) | null;
  engagement: Engagement | null;
};

export function serializeRunDetail(run: RunWithRelations) {
  return {
    date: run.date,
    candidates: run.candidates
      .slice()
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .map((c) => ({
        id: c.id,
        topic: c.topic,
        theme: c.theme,
        category: c.category,
        draft: c.draft,
        rank: c.rank,
        score: c.score
          ? {
              hook: c.score.hook,
              insight: c.score.insight,
              authenticity: c.score.authenticity,
              engagement: c.score.engagement,
              clarity: c.score.clarity,
              total: c.score.total,
            }
          : null,
      })),
    postedSelection: run.postedSelection
      ? {
          candidateId: run.postedSelection.candidateId,
          topicOverride: run.postedSelection.topicOverride,
          themeOverride: run.postedSelection.themeOverride,
          postedAt: run.postedSelection.postedAt.toISOString(),
        }
      : null,
    engagement: run.engagement
      ? {
          impressions: run.engagement.impressions,
          likes: run.engagement.likes,
          comments: run.engagement.comments,
        }
      : null,
  };
}

export type SerializedRunDetail = ReturnType<typeof serializeRunDetail>;
