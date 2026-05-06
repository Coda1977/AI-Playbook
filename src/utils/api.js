export async function generatePrimitives(intake) {
  const res = await fetch("/api/primitives-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intake }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  const data = await res.json();
  return data.primitives;
}

export async function generatePlaybook(intake, starredPrimitives) {
  const res = await fetch("/api/playbook-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intake, starredPrimitives }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  const data = await res.json();
  return data.plan;
}

export async function sendChat({ mode, intake, category, rule, currentItems, allPrimitives, allPlan, starredPrimitives, chatHistory, userMessage }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, intake, category, rule, currentItems, allPrimitives, allPlan, starredPrimitives, chatHistory, userMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  return await res.json();
}

export async function generateSynthesis(intake, primitives, plan) {
  const res = await fetch("/api/synthesis-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intake, primitives, plan }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  const data = await res.json();
  return data.synthesis;
}
