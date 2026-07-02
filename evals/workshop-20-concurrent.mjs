// Workshop-load stress test for the AI Playbook API.
//
// Simulates 20 managers in a facilitated workshop, all moving through the
// three AI-generated phases in lock-step:
//   Stage 1: 20 concurrent POST /api/primitives-generate
//   Stage 2: 20 concurrent POST /api/playbook-generate
//   Stage 3: 20 concurrent POST /api/synthesis-generate
//
// This is the "everyone clicks Discover Use Cases at the same time" worst
// case. Real workshops will have natural spacing as users finish at
// different times -- this test is intentionally tighter than reality.
//
// PASS = all 20 requests at each stage return 200 with a valid response
//        shape (no parser failures, no 5xx, no timeouts)
// FAIL = any 4xx/5xx/timeout, or response shape that doesn't validate
//
// Usage:
//   node evals/workshop-20-concurrent.mjs
//
// No env vars needed. The server-side ANTHROPIC_API_KEY is in Vercel env.

const URL_BASE = "https://ai-playbook-yonatan-primes-projects.vercel.app";
const N = 20;

// Five distinct manager profiles; each "user" gets one of these (4x each).
const INTAKES = [
  {
    label: "Eng Manager / Capable / Not yet started",
    role: "Engineering Manager at a 50-person SaaS startup, leads 7 engineers",
    helpWith: ["Save time on repetitive work", "Improve the quality of what I produce"],
    responsibilities: "Sprint planning, 1:1s, OKRs, code review, hiring, on-call rotation",
    managerFluency: "Capable -- I use AI weekly for real work",
    teamFluency: "Not yet started -- the team has barely touched AI",
    failureRisks:
      "Two senior engineers think AI-generated code is beneath them, and others follow their lead",
    successVision: "Every engineer using AI for at least one PR per week",
  },
  {
    label: "HRBP / Beginner / Beginner",
    role: "HR Business Partner supporting a 300-person engineering org",
    helpWith: ["Save time on repetitive work", "Make better decisions with data"],
    responsibilities:
      "Performance reviews, comp planning, ER cases, manager coaching, headcount planning",
    managerFluency: "Beginner -- I have tried AI a few times",
    teamFluency: "Beginner -- the team has tried AI a few times",
    failureRisks: "Bias in AI-assisted decisions and legal exposure on perf reviews",
    successVision:
      "AI handles 70% of performance review prep work for the eng managers I support",
  },
  {
    label: "Marketing Director / Transformative / Capable",
    role: "Marketing Director at a B2B fintech, 4 direct reports",
    helpWith: ["Scale my impact beyond my capacity", "Take on things I can't do today"],
    responsibilities:
      "Demand gen, content strategy, campaign launches, MQL pipeline, stakeholder reporting",
    managerFluency: "Transformative -- AI is embedded in my daily workflow",
    teamFluency: "Capable -- the team uses AI weekly for real work",
    failureRisks:
      "Brand voice drift, our most senior writer thinks AI content is slop",
    successVision:
      "AI handles 60% of first drafts across blog, email, and landing pages",
  },
  {
    label: "CS Lead / Capable / Beginner",
    role: "Customer Success Lead for a Series B SaaS, 8 CSMs across enterprise and mid-market",
    helpWith: ["Save time on repetitive work", "Keep up with information overload"],
    responsibilities: "QBR prep, renewals, escalations, onboarding, churn prediction reviews",
    managerFluency: "Capable -- I use AI for QBR narratives and exec briefs",
    teamFluency: "Beginner -- a few CSMs tried it, most haven't started",
    failureRisks: "Customer-facing AI errors damage trust, and our top accounts are watching",
    successVision: "Every CSM uses AI for QBR prep, and we cut prep time in half",
  },
  {
    label: "Product Manager / Beginner / Transformative",
    role: "Product Manager owning billing surface of a Series B SaaS product",
    helpWith: ["Take on things I can't do today", "Improve the quality of what I produce"],
    responsibilities:
      "Roadmap planning, customer interviews, spec writing, design partnership, launch coordination",
    managerFluency: "Beginner -- I have tried AI a few times",
    teamFluency: "Transformative -- the team has AI embedded in daily workflow",
    failureRisks:
      "My team is far ahead of me and I will lose credibility if I do not catch up fast",
    successVision:
      "I drive every PRD from AI-assisted research and synthesis, matching the team's velocity",
  },
];

function pickIntake(i) {
  return INTAKES[i % INTAKES.length];
}

function fixturesFromPrimitives(primitives) {
  // Convert primitives-generate response (plain string arrays per category)
  // into the {text, starred} shape that synthesis-generate expects. Star
  // the first idea in 3 different categories so synthesis gets some signal.
  const out = {};
  let starsLeft = 3;
  for (const [key, list] of Object.entries(primitives || {})) {
    out[key] = (list || []).map((text, idx) => {
      const star = starsLeft > 0 && idx === 0;
      if (star) starsLeft--;
      return { text, starred: !!star };
    });
  }
  return out;
}

function fixturesFromPlan(plan) {
  const out = {};
  let starsLeft = 2;
  for (const [key, list] of Object.entries(plan || {})) {
    out[key] = (list || []).map((text, idx) => {
      const star = starsLeft > 0 && idx === 0;
      if (star) starsLeft--;
      return { text, starred: !!star };
    });
  }
  return out;
}

function starredPrimitivesFromMap(primitivesMap) {
  const out = [];
  for (const [cat, list] of Object.entries(primitivesMap || {})) {
    for (const item of list || []) {
      if (item.starred) out.push({ category: cat, text: item.text });
    }
  }
  return out;
}

async function callJson(path, body) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${URL_BASE}${path}`, {
      method: "POST",
      // The API rejects cross-origin posts; identify as same-origin ops traffic.
      headers: { "Content-Type": "application/json", Origin: URL_BASE },
      body: JSON.stringify(body),
    });
    const ms = Date.now() - t0;
    let parsed;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      return { ok: false, ms, status: res.status, body: parsed, error: parsed?.error || `HTTP ${res.status}` };
    }
    return { ok: true, ms, status: res.status, body: parsed };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: err?.message || "fetch failed" };
  }
}

function validatePrimitives(p) {
  if (!p || typeof p !== "object") return "primitives missing";
  const required = ["content", "automation", "research", "data", "coding", "ideation"];
  for (const k of required) {
    if (!Array.isArray(p[k]) || p[k].length === 0) return `${k} empty/missing`;
  }
  return null;
}

function validatePlan(p) {
  if (!p || typeof p !== "object") return "plan missing";
  const required = ["destination", "safe", "script", "small", "visible"];
  for (const k of required) {
    if (!Array.isArray(p[k]) || p[k].length < 2) return `${k} too few items`;
  }
  return null;
}

function validateSynthesis(s) {
  if (!s || typeof s !== "object") return "synthesis missing";
  if (typeof s.title !== "string" || !s.title) return "title missing";
  if (typeof s.lede !== "string" || !s.lede) return "lede missing";
  if (!Array.isArray(s.storylines) || s.storylines.length < 1 || s.storylines.length > 2)
    return `storylines length=${s.storylines?.length}`;
  for (const sl of s.storylines) {
    for (const k of ["eyebrowName", "headline", "thesis"]) {
      if (typeof sl[k] !== "string" || !sl[k]) return `storyline.${k} missing`;
    }
  }
  if (!Array.isArray(s.thisWeek) || s.thisWeek.length !== 3) return `thisWeek length=${s.thisWeek?.length}`;
  return null;
}

function summarize(label, results) {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)];
  const p95 = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))];
  const max = Math.max(...latencies);
  console.log(`\n${label}: ${passed}/${results.length} passed, ${failed} failed`);
  console.log(`  median=${median}ms  p95=${p95}ms  max=${max}ms`);
  if (failed > 0) {
    console.log(`  failure breakdown:`);
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`    #${r.idx} status=${r.status ?? "n/a"} reason=${r.reason || r.error}`);
    }
  }
  return { passed, failed, median, p95, max };
}

// --- Stage 1: 20 concurrent primitives-generate ---
console.log(`\n=== Stage 1: ${N} concurrent /api/primitives-generate ===`);
console.log(`Target: ${URL_BASE}`);
const t0 = Date.now();
const stage1Promises = Array.from({ length: N }, (_, i) =>
  callJson("/api/primitives-generate", { intake: pickIntake(i) }).then((r) => {
    const reason = r.ok ? validatePrimitives(r.body?.primitives) : null;
    return {
      idx: i + 1,
      label: pickIntake(i).label,
      ok: r.ok && !reason,
      ms: r.ms,
      status: r.status,
      reason: reason || r.error,
      primitives: r.body?.primitives,
    };
  }),
);
const stage1 = await Promise.all(stage1Promises);
const s1 = summarize("Stage 1 (primitives-generate)", stage1);

if (s1.failed > 0) {
  console.log("\nStage 1 had failures; running stages 2/3 only on the users that passed stage 1.");
}

// --- Stage 2: 20 concurrent playbook-generate (using starred from stage 1) ---
console.log(`\n=== Stage 2: ${N} concurrent /api/playbook-generate ===`);
const stage2Promises = stage1.map((s, i) => {
  if (!s.ok || !s.primitives) {
    return Promise.resolve({
      idx: i + 1,
      label: s.label,
      ok: false,
      ms: 0,
      reason: "skipped (stage 1 failed)",
    });
  }
  const fixturesPrim = fixturesFromPrimitives(s.primitives);
  const starred = starredPrimitivesFromMap(fixturesPrim);
  return callJson("/api/playbook-generate", {
    intake: pickIntake(i),
    starredPrimitives: starred,
  }).then((r) => {
    const reason = r.ok ? validatePlan(r.body?.plan) : null;
    return {
      idx: i + 1,
      label: s.label,
      ok: r.ok && !reason,
      ms: r.ms,
      status: r.status,
      reason: reason || r.error,
      plan: r.body?.plan,
      primitives: s.primitives,
    };
  });
});
const stage2 = await Promise.all(stage2Promises);
const s2 = summarize("Stage 2 (playbook-generate)", stage2);

// --- Stage 3: 20 concurrent synthesis-generate (the T1 critical path) ---
console.log(`\n=== Stage 3: ${N} concurrent /api/synthesis-generate ===`);
const stage3Promises = stage2.map((s, i) => {
  if (!s.ok || !s.plan || !s.primitives) {
    return Promise.resolve({
      idx: i + 1,
      label: s.label,
      ok: false,
      ms: 0,
      reason: "skipped (stage 2 failed)",
    });
  }
  const primitivesFix = fixturesFromPrimitives(s.primitives);
  const planFix = fixturesFromPlan(s.plan);
  return callJson("/api/synthesis-generate", {
    intake: pickIntake(i),
    primitives: primitivesFix,
    plan: planFix,
  }).then((r) => {
    const reason = r.ok ? validateSynthesis(r.body?.synthesis) : null;
    return {
      idx: i + 1,
      label: s.label,
      ok: r.ok && !reason,
      ms: r.ms,
      status: r.status,
      reason: reason || r.error,
      titleSnippet: r.body?.synthesis?.title?.slice(0, 60),
    };
  });
});
const stage3 = await Promise.all(stage3Promises);
const s3 = summarize("Stage 3 (synthesis-generate)", stage3);

console.log("\n=== Per-user synthesis titles ===");
for (const r of stage3.filter((x) => x.ok).slice(0, 5)) {
  console.log(`  #${String(r.idx).padStart(2, " ")} [${r.label}] "${r.titleSnippet}..."`);
}
if (stage3.filter((x) => x.ok).length > 5) {
  console.log(`  ... (${stage3.filter((x) => x.ok).length - 5} more)`);
}

const wall = Date.now() - t0;
console.log("\n=== OVERALL ===");
console.log(`Wall time across all three stages: ${(wall / 1000).toFixed(1)}s`);
console.log(`Stage 1 (primitives):  ${s1.passed}/${N}  median=${s1.median}ms  p95=${s1.p95}ms  max=${s1.max}ms`);
console.log(`Stage 2 (playbook):    ${s2.passed}/${N}  median=${s2.median}ms  p95=${s2.p95}ms  max=${s2.max}ms`);
console.log(`Stage 3 (synthesis):   ${s3.passed}/${N}  median=${s3.median}ms  p95=${s3.p95}ms  max=${s3.max}ms`);

const totalPassed = s1.passed + s2.passed + s3.passed;
const totalRequests = N * 3;
console.log(`\nTotal: ${totalPassed}/${totalRequests} requests passed (${((totalPassed / totalRequests) * 100).toFixed(1)}%)`);

if (s1.failed > 0 || s2.failed > 0 || s3.failed > 0) {
  process.exit(1);
}
