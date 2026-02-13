export const LS_KEY = "ai_change_playbook_combined_v1";

export const MIN_STARS_FOR_PLAYBOOK = 3;

export const C = {
  black: "#0C0C0C",
  charcoal: "#1A1A1A",
  white: "#FFFFFF",
  offWhite: "#FAFAF8",
  surface: "#F5F5F3",
  red: "#DC2626",
  redHover: "#B91C1C",
  redLight: "#FEF2F2",
  redFaint: "rgba(220,38,38,0.06)",
  gray200: "#E5E5E0",
  gray300: "#D4D4CF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  // Legacy aliases (used by components)
  ink: "#0C0C0C",
  accent: "#DC2626",
  accentHover: "#B91C1C",
  accentGlow: "#DC2626",
  accentFaint: "rgba(220,38,38,0.06)",
  muted: "#6B7280",
  card: "#FAFAF8",
  border: "#E5E5E0",
  borderStrong: "#D4D4CF",
  starredBg: "#FEF2F2",
  starredBorder: "#FECACA",
  success: "#059669",
};

export const uid = () => Math.random().toString(36).slice(2, 10);
