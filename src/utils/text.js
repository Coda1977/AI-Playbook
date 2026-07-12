// Truncates a role string at a word boundary. Shared by Header (the
// top-bar role chip) and SynthesisView (the Big Move poster byline) so
// both surfaces read the manager's role identically.
export function truncateRole(role, maxLen = 50) {
  if (!role || role.length <= maxLen) return role;
  const trimmed = role.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 20 ? trimmed.slice(0, lastSpace) + "..." : trimmed + "...";
}
