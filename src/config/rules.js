// Canonical rule definitions live in lib/workshop.js (shared with api/).
export { RULES } from "../../lib/workshop.js";

export const FLUENCY_OPTIONS = [
  {
    level: 1,
    label: "Not yet started",
    managerDesc:
      "I know I should be using AI but haven't found the right entry point yet",
    teamDesc:
      "Most of my team hasn't engaged with AI tools in any meaningful way",
  },
  {
    level: 2,
    label: "Capable",
    managerDesc:
      "I use AI tools purposefully for specific tasks and can explain how they help",
    teamDesc:
      "A few people use AI for specific tasks, but it's individual and inconsistent",
  },
  {
    level: 3,
    label: "Adoptive",
    managerDesc:
      "AI is a regular part of how I work, integrated across multiple tools and workflows",
    teamDesc:
      "Most of the team uses AI regularly. It's becoming part of how we work",
  },
  {
    level: 4,
    label: "Transformative",
    managerDesc:
      "I think AI-first when solving problems and have scaled AI usage across my team or function",
    teamDesc:
      "AI is embedded in our workflows and the team actively looks for new ways to apply it",
  },
];

export const PLAYBOOK_GEN_STEPS = [
  {
    rule: 1,
    tip: "People can't move toward what they can't picture, and won't move toward what they don't feel.",
  },
  {
    rule: 2,
    tip: "A single leader demo can nearly double AI adoption on a team.",
  },
  {
    rule: 3,
    tip: "Defaults beat willpower. Tell them what to do Monday morning.",
  },
  {
    rule: 4,
    tip: "Small wins build patterns that attract allies and deter opponents.",
  },
  { rule: 5, tip: "Most change efforts under-communicate by 10x or more." },
];

export const SYNTHESIS_GEN_STEPS = [
  {
    step: 1,
    name: "Reading your intake",
    tip: "Understanding your role, team, and what success looks like.",
  },
  {
    step: 2,
    name: "Mapping your use cases",
    tip: "Looking for themes across what you starred.",
  },
  {
    step: 3,
    name: "Mapping your change actions",
    tip: "Identifying the moves that matter most.",
  },
  {
    step: 4,
    name: "Finding the storylines",
    tip: "One or two narratives that hold your plan together.",
  },
  {
    step: 5,
    name: "Writing your one-page plan",
    tip: "Turning fragments into a story.",
  },
];
