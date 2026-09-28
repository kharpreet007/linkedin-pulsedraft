export type StyleId =
  | "line_by_line"
  | "before_after"
  | "myth_vs_reality"
  | "problem_tension_reframe"
  | "numbered_list"
  | "insight_unpack"
  | "question_cascade";

export interface Style {
  id: StyleId;
  name: string;
  description: string;
  bestFor: string;
  /** The structural half of Remy's prompt — how the post is shaped, independent of tone. */
  instruction: string;
}

export const DEFAULT_STYLE: StyleId = "line_by_line";

export const STYLES: Style[] = [
  {
    id: "line_by_line",
    name: "Line-by-line narrative",
    description: "One thought per line, builds like a short story toward the payoff.",
    bestFor: "Best for emotionally-resonant or \"here's a moment that changed how I see X\" topics.",
    instruction:
      "Line-by-line narrative: one thought per line, each line on its own (separated by a newline), " +
      "building like a short story toward a payoff at the end.",
  },
  {
    id: "before_after",
    name: "Before/After contrast",
    description: "\"I used to think X. Now I think Y. Here's what changed.\" Very fast to read.",
    bestFor: "Makes your growth/perspective-shift visible — strong for signaling reflection and learning.",
    instruction:
      "Before/After contrast: state what you used to think or do, then what you think or do now, and briefly " +
      "what changed your mind. Two clear halves, fast to read.",
  },
  {
    id: "myth_vs_reality",
    name: "Myth vs. reality",
    description: "States a common belief, then dismantles it point by point.",
    bestFor: "Naturally argumentative without needing full contrarianism — reads as corrective, not combative.",
    instruction:
      "Myth vs. reality: state a common belief plainly, then dismantle it point by point. Read as corrective, " +
      "not combative.",
  },
  {
    id: "problem_tension_reframe",
    name: "Problem → tension → reframe",
    description: "Lay out a familiar problem, sit in the tension, then offer the reframe.",
    bestFor: "Demonstrates diagnosis skill, not just opinion.",
    instruction:
      "Problem → tension → reframe: lay out a familiar problem, sit in the tension for a beat by " +
      "explaining why the obvious fix doesn't work, then offer the reframe.",
  },
  {
    id: "numbered_list",
    name: "Numbered/skimmable list",
    description: "3-5 short numbered points under one theme, each a line or two.",
    bestFor: "Highest skimmability — use sparingly so it doesn't blend into feed noise.",
    instruction: "Numbered/skimmable list: 3-5 short numbered points under one theme, each one or two lines.",
  },
  {
    id: "insight_unpack",
    name: "Single insight + short unpack",
    description: "One sharp opening line as the whole thesis, then 3-4 lines unpacking why it's true.",
    bestFor: "The shortest style option — good for days you want something crisp rather than a full narrative arc.",
    instruction:
      "Single insight + short unpack: one sharp opening line as the whole thesis, then 3-4 lines unpacking why " +
      "it's true. Keep the whole post short — this is not a full narrative arc.",
  },
  {
    id: "question_cascade",
    name: "Question cascade",
    description: "A sequence of questions that narrow toward an implied answer, never stated outright.",
    bestFor: "Pairs naturally with the Socratic Questioner voice.",
    instruction:
      "Question cascade: the entire post is a sequence of questions that narrow toward an implied answer. " +
      "Never state the answer outright.",
  },
];

export function getStyle(id: string | null | undefined): Style {
  return STYLES.find((s) => s.id === id) ?? STYLES.find((s) => s.id === DEFAULT_STYLE)!;
}
