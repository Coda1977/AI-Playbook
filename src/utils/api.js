// Slightly longer than the Vercel function maxDuration (90s) so the server
// has a chance to return a clean 5xx before the client aborts.
const REQUEST_TIMEOUT_MS = 105_000;

async function postJson(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    const err = new Error(e?.message || "Network request failed");
    err.kind = e?.name === "TimeoutError" ? "timeout" : "network";
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error || `API returned ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    e.kind = res.status >= 500 ? "server" : "client";
    throw e;
  }
  return res.json();
}

export async function generatePrimitives(intake) {
  const data = await postJson("/api/primitives-generate", { intake });
  return data.primitives;
}

export async function generatePlaybook(intake, starredPrimitives) {
  const data = await postJson("/api/playbook-generate", {
    intake,
    starredPrimitives,
  });
  return data.plan;
}

export async function sendChat({
  mode,
  intake,
  category,
  rule,
  currentItems,
  allPrimitives,
  allPlan,
  starredPrimitives,
  chatHistory,
  userMessage,
}) {
  return postJson("/api/chat", {
    mode,
    intake,
    category,
    rule,
    currentItems,
    allPrimitives,
    allPlan,
    starredPrimitives,
    chatHistory,
    userMessage,
  });
}

export async function generateSynthesis(intake, primitives, plan) {
  const data = await postJson("/api/synthesis-generate", {
    intake,
    primitives,
    plan,
  });
  return data.synthesis;
}

// Human-readable copy for a thrown error from postJson. Keeps the wire
// taxonomy (timeout / network / server / client) out of view text.
export function describeApiError(err, fallback) {
  if (!err) return fallback;
  if (err.kind === "timeout") {
    return "The request took too long. Check your network and try again.";
  }
  if (err.kind === "network") {
    return "Connection issue. Check your network and try again.";
  }
  if (err.kind === "server") {
    return "The AI service is temporarily unavailable. Try again in a moment.";
  }
  if (err.kind === "client") {
    return "We couldn't process that request. Please review your inputs and try again.";
  }
  return fallback || err.message || "Something went wrong.";
}
