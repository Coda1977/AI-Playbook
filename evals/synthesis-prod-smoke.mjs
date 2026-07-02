// One-shot production smoke for /api/synthesis-generate after Tier 1 deploy.
// Fires 10 concurrent POSTs against the live endpoint with 5 distinct intake
// shapes (each shape repeated twice) and reports pass/fail per request.
//
// PASS  = HTTP 200 + body.synthesis with title, lede, storylines[1..2], thisWeek[3]
// FAIL  = any other status, network error, missing required field, malformed shape
//
// Usage:
//   node evals/synthesis-prod-smoke.mjs
//
// No env vars needed -- the server-side ANTHROPIC_API_KEY is already in
// Vercel project env. This client only hits the public alias.

const URL =
  "https://ai-playbook-nwfxqngoq-yonatan-primes-projects.vercel.app/api/synthesis-generate";

const INTAKES = [
  {
    label: "Eng Manager / Capable / Not yet started",
    intake: {
      role: "Engineering Manager at a 50-person SaaS startup, leads 7 engineers",
      helpWith: ["Save time on repetitive work", "Improve the quality of what I produce"],
      responsibilities: "Sprint planning, 1:1s, OKRs, code review, hiring",
      managerFluency: "Capable -- I use AI weekly for real work",
      teamFluency: "Not yet started -- the team has barely touched AI",
      failureRisks:
        "Two senior engineers think AI-generated code is beneath them, and others follow their lead",
      successVision: "Every engineer using AI for at least one PR per week",
    },
  },
  {
    label: "HRBP / Beginner / Beginner",
    intake: {
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
  },
  {
    label: "Marketing Director / Transformative / Capable",
    intake: {
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
  },
  {
    label: "CS Lead / Capable / Beginner -- thin intake",
    intake: {
      role: "Customer Success Lead",
      helpWith: ["Save time on repetitive work"],
      responsibilities: "Renewals, QBRs, onboarding",
      managerFluency: "Capable",
      teamFluency: "Beginner",
      failureRisks: "Team doesn't see the value",
      successVision: "Team uses AI for QBR prep",
    },
  },
  {
    label: "Product Manager / Beginner / Transformative -- inverted gap",
    intake: {
      role: "Product Manager owning the billing surface of a Series B SaaS product",
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
  },
];

// Minimal primitives + plan shapes (the synthesis prompt accepts these as-is).
function makeFixtures() {
  return {
    primitives: {
      content: [
        { text: "AI drafts your weekly status email", starred: true },
        { text: "AI summarizes last week's PR comments", starred: false },
      ],
      automation: [
        { text: "Auto-route Slack alerts via AI classification", starred: true },
      ],
      research: [{ text: "AI digest of competitor releases", starred: false }],
      data: [{ text: "AI-generated chart from CSV exports", starred: false }],
      coding: [{ text: "AI writes SQL from natural language", starred: false }],
      ideation: [{ text: "Brainstorm OKR drafts with AI", starred: true }],
    },
    plan: {
      destination: [
        {
          text: "Write a one-paragraph picture of your team in 90 days, share at standup",
          starred: true,
        },
        { text: "Pick one workflow you'll measure before/after", starred: false },
      ],
      safe: [
        { text: "Share your own AI miss in your next 1:1", starred: true },
        { text: "Set 'AI lab hour' Friday afternoons, no deliverables", starred: false },
      ],
      script: [
        { text: "Have your bright-spot engineer demo their workflow Tuesday", starred: false },
        { text: "Add an AI prompt template to the team wiki", starred: false },
      ],
      small: [
        { text: "Pick one PR per engineer per week as the pilot", starred: true },
        { text: "Define success criteria before scaling beyond the pilot", starred: false },
      ],
      visible: [
        { text: "Open every team meeting with one AI win or attempt", starred: false },
        { text: "Send a Friday recap with hours saved", starred: false },
      ],
    },
  };
}

function validateSynthesis(s) {
  if (!s || typeof s !== "object") return "synthesis missing";
  if (typeof s.title !== "string" || s.title.length === 0) return "title missing/empty";
  if (typeof s.lede !== "string" || s.lede.length === 0) return "lede missing/empty";
  if (!Array.isArray(s.storylines) || s.storylines.length < 1 || s.storylines.length > 2)
    return `storylines length=${s.storylines?.length}`;
  for (const sl of s.storylines) {
    for (const k of ["eyebrowName", "headline", "thesis"]) {
      if (typeof sl[k] !== "string" || !sl[k]) return `storyline.${k} missing`;
    }
    if (!Array.isArray(sl.prose) || sl.prose.length === 0) return "storyline.prose empty";
    if (!Array.isArray(sl.useCases)) return "storyline.useCases not array";
    if (!Array.isArray(sl.actions)) return "storyline.actions not array";
  }
  if (!Array.isArray(s.thisWeek) || s.thisWeek.length !== 3)
    return `thisWeek length=${s.thisWeek?.length}`;
  return null;
}

async function runOne(idx, intakeEntry) {
  const fixtures = makeFixtures();
  const t0 = Date.now();
  try {
    const res = await fetch(URL, {
      method: "POST",
      // The API rejects cross-origin posts; identify as same-origin ops traffic.
      headers: {
        "Content-Type": "application/json",
        Origin: new globalThis.URL(URL).origin,
      },
      body: JSON.stringify({ intake: intakeEntry.intake, ...fixtures }),
    });
    const ms = Date.now() - t0;
    let body;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      return {
        idx,
        ok: false,
        ms,
        status: res.status,
        intake: intakeEntry.label,
        reason: body?.error || `HTTP ${res.status}`,
      };
    }
    const validation = validateSynthesis(body?.synthesis);
    if (validation) {
      return {
        idx,
        ok: false,
        ms,
        status: res.status,
        intake: intakeEntry.label,
        reason: validation,
      };
    }
    return {
      idx,
      ok: true,
      ms,
      status: res.status,
      intake: intakeEntry.label,
      titleSnippet: body.synthesis.title.slice(0, 70),
      storylines: body.synthesis.storylines.length,
    };
  } catch (err) {
    return {
      idx,
      ok: false,
      ms: Date.now() - t0,
      intake: intakeEntry.label,
      reason: err?.message || "fetch failed",
    };
  }
}

const N = 10;
const requests = Array.from({ length: N }, (_, i) => ({
  idx: i + 1,
  intakeEntry: INTAKES[i % INTAKES.length],
}));

console.log(`Firing ${N} concurrent POSTs to ${URL} ...`);
const t0 = Date.now();
const results = await Promise.all(requests.map((r) => runOne(r.idx, r.intakeEntry)));
const wall = Date.now() - t0;

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

console.log("");
console.log("Per-request results:");
for (const r of results) {
  const tag = r.ok ? "PASS" : "FAIL";
  const detail = r.ok
    ? `title="${r.titleSnippet}..." storylines=${r.storylines}`
    : `reason=${r.reason} status=${r.status ?? "n/a"}`;
  console.log(`  #${String(r.idx).padStart(2, " ")} ${tag} ${String(r.ms).padStart(6, " ")}ms  [${r.intake}]  ${detail}`);
}

console.log("");
console.log(`Summary: ${passed}/${N} passed, ${failed} failed, wall=${wall}ms`);
console.log(`Median latency: ${median(results.map((r) => r.ms))}ms`);
console.log(`P95 latency:    ${p(results.map((r) => r.ms), 0.95)}ms`);

if (failed > 0) {
  process.exit(1);
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}
function p(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[idx];
}
