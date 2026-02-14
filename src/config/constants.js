export const LS_KEY = "ai_change_playbook_combined_v1";

export const MIN_STARS_FOR_PLAYBOOK = 3;

export const C = {
  black: "#000000",
  charcoal: "#222222",
  darkGray: "#333333",
  white: "#ffffff",
  lightGray: "#cccccc",
  red: "#e30613",
  redHover: "#c00510",
  redLight: "#fff2f3",
  electricBlue: "#00a3e0",
  // Legacy aliases (used by components)
  ink: "#000000",
  accent: "#e30613",
  accentHover: "#c00510",
  accentGlow: "#e30613",
  accentFaint: "rgba(227,6,19,0.06)",
  muted: "#333333",
  card: "#ffffff",
  border: "#cccccc",
  borderStrong: "#999999",
  starredBg: "#fff2f3",
  starredBorder: "#e30613",
  success: "#00a3e0",
  gray200: "#cccccc",
  gray300: "#999999",
  gray500: "#666666",
  gray700: "#333333",
  gray900: "#000000",
  surface: "#f5f5f5",
  offWhite: "#fafafa",
};

export const uid = () => Math.random().toString(36).slice(2, 10);
