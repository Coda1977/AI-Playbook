// Canonical category definitions live in lib/workshop.js (shared with api/).
export { CATEGORIES } from "../../lib/workshop.js";

export const HELP_OPTIONS = [
  { id: "time", label: "Save time on repetitive work" },
  { id: "quality", label: "Improve the quality of what I produce" },
  { id: "capability", label: "Take on things I can't do today" },
  { id: "decisions", label: "Make better decisions with data" },
  { id: "overload", label: "Keep up with information overload" },
  { id: "scale", label: "Scale my impact beyond my capacity" },
];

export const PRIMITIVES_GEN_STEPS = [
  { category: 1, tip: "What content could AI help you create faster and better?" },
  { category: 2, tip: "Which repetitive tasks follow a pattern AI could learn?" },
  { category: 3, tip: "Where does research and synthesis slow you down?" },
  { category: 4, tip: "What data patterns could AI surface for you?" },
  { category: 5, tip: "What technical work could AI handle or assist with?" },
  { category: 6, tip: "Where could an AI brainstorming partner help most?" },
];
