// Mirrors the server-side enforcement in api/primitives-generate.js: the
// model commits to focusCategories (3 ideas each) and stretchCategory (1),
// the server trims every category to its committed limit and strips the
// commitment fields. Assertions then run on what the client actually
// receives. Keep in sync with the handler.
module.exports = (output) => {
  let parsed;
  try {
    parsed = typeof output === "string" ? JSON.parse(output) : output;
  } catch {
    return output;
  }
  const obj =
    parsed && parsed.type === "tool_use" && parsed.input ? parsed.input : parsed;
  if (!obj || typeof obj !== "object") return output;
  const CATS = ["content", "automation", "research", "data", "coding", "ideation"];
  const focus = Array.isArray(obj.focusCategories)
    ? obj.focusCategories.slice(0, 2)
    : [];
  const stretch =
    typeof obj.stretchCategory === "string" ? obj.stretchCategory : null;
  const out = {};
  for (const c of CATS) {
    const arr = Array.isArray(obj[c])
      ? obj[c].filter((t) => typeof t === "string" && t.trim())
      : [];
    const limit = focus.includes(c) ? 3 : c === stretch ? 1 : 2;
    out[c] = arr.slice(0, limit);
  }
  return JSON.stringify(out);
};
