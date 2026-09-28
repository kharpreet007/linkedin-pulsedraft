export type VoiceId = "sage" | "nova" | "ace" | "milo" | "quinn";

export interface Voice {
  id: VoiceId;
  name: string;
  label: string;
  description: string;
  bestFor: string;
  /** Drop-in replacement for the structural half of Remy's prompt — how the post opens, argues, and closes. */
  instruction: string;
}

export const DEFAULT_VOICE: VoiceId = "sage";

export const VOICES: Voice[] = [
  {
    id: "sage",
    name: "Sage",
    label: "Storyteller",
    description: "Opens with a specific scene or moment, first-person or observational (\"Picture a PM who...\").",
    bestFor: "Best when the insight is more emotional/experiential than analytical.",
    instruction:
      "Storyteller voice: open with a specific scene or concrete moment, told first-person or observationally " +
      '(e.g. "Picture a PM who..."). Ground the whole post in that one moment rather than generic advice. ' +
      "End with a genuine open-ended question inviting comments.",
  },
  {
    id: "nova",
    name: "Nova",
    label: "Data-Driven Analyst",
    description: "Anchors the whole post around one concrete number or comparison, builds the argument from that.",
    bestFor: "Best when you want to sound rigorous/credible rather than reflective.",
    instruction:
      "Data-driven analyst voice: anchor the entire post around one concrete number, statistic, or comparison, " +
      "and build the argument outward from it. Sound rigorous and credible, not reflective. " +
      "End with a question inviting readers to share their own numbers or experience.",
  },
  {
    id: "ace",
    name: "Ace",
    label: "Contrarian Operator",
    description: "Short, blunt, takes a position against conventional wisdom early and defends it.",
    bestFor: "Best when the topic has an obvious \"safe\" opinion you want to push against.",
    instruction:
      "Contrarian operator voice: short, blunt sentences. State a position against conventional wisdom within " +
      "the first two lines and defend it without hedging. End with a direct challenge inviting readers to disagree.",
  },
  {
    id: "milo",
    name: "Milo",
    label: "Framework Teacher",
    description: "Names a simple mental model (a 2x2, a 3-step rule, a \"there are two kinds of X\") and teaches it skimmably.",
    bestFor: "Best for looking like someone who's systematized their thinking.",
    instruction:
      "Framework teacher voice: name a simple mental model early (a 2x2, a numbered rule, a \"there are two kinds " +
      "of X\" framing) and teach it in a skimmable way, with short labeled lines for each part of the framework. " +
      "End with a question inviting readers to add to or challenge the framework.",
  },
  {
    id: "quinn",
    name: "Quinn",
    label: "Socratic Questioner",
    description: "Builds the whole post as a sequence of probing questions rather than statements.",
    bestFor: "Best when the topic is genuinely unresolved/debatable and you want to look thoughtful rather than certain.",
    instruction:
      "Socratic questioner voice: build the entire post as a sequence of probing questions rather than statements, " +
      "letting the reader arrive at the point themselves. Do not state the conclusion outright — end on the final " +
      "unresolved question, not a summary.",
  },
];

export function getVoice(id: string | null | undefined): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES.find((v) => v.id === DEFAULT_VOICE)!;
}
