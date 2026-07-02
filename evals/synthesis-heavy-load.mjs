// Heavy-load probe for /api/synthesis-generate.
// Same shape as synthesis-prod-smoke.mjs, but each intake field is loaded with
// 400+ words of context, and primitives/plan are filled to near-maximum
// item counts. Goal: confirm we're not creeping toward the 60s server kill
// under realistic workshop-power-user conditions.

const URL =
  "https://ai-playbook-nwfxqngoq-yonatan-primes-projects.vercel.app/api/synthesis-generate";

// ~450-word filler designed to look like genuine manager intake -- specific,
// not lorem-ipsum, so the AI processes it as real content (and burns tokens).
const HEAVY_RESPONSIBILITIES = `I lead a 12-person engineering organization split across three squads: platform (4 engineers, builds shared infra, owns CI/CD, deploys, observability, secrets, internal SDKs, and the shared component library), product (5 engineers, ships customer-facing features in our React/Node/Postgres stack, owns the billing surface, the admin console, and the public API), and growth (3 engineers, builds experiments, the marketing site, the docs site, and the developer-facing onboarding flow). Day to day I run weekly 1:1s with all 12 engineers, biweekly squad retros, weekly leadership sync with the CTO and Head of Product, monthly business review with the CEO and CFO, ad-hoc incident commander rotations, quarterly performance reviews, hiring loop calibration sessions, candidate phone screens, comp planning, headcount planning, OKR setting and tracking, sprint planning facilitation, ticket triage when escalated, customer-facing escalations for premium accounts, vendor evaluations for tooling, security review participation, on-call rotation policy ownership, technical roadmap drafting, architecture review meetings, code review for senior engineer promotions, mentorship for two junior engineers, partnership with the design lead on system patterns, and writing the weekly engineering newsletter. Outside of meetings I write technical specs, review architecture proposals, draft and respond to RFCs, and try to spend at least four hours a week pairing with engineers on hard problems so I do not become a manager who has forgotten the work. I also own the engineering brand externally, which means I write our engineering blog roughly once a month, sit on the conference talk selection committee, run our open source contribution program, and review every external technical communication before it goes out. I am the primary point of contact for engineering candidates from senior+ levels through the funnel.`;

const HEAVY_FAILURE_RISKS = `My two staff-level engineers (one on platform, one on product) are deeply skeptical of AI-generated code. Both have 15+ years of experience and have built their professional identity around craft and rigor. The platform staff engineer told me last quarter that he thinks coding assistants are 'autocomplete with a marketing budget' and that he would consider it a personal failure if his team started shipping AI-generated PRs without thorough human review. He is influential, especially with the platform team's three other engineers, who all defer to him on technical opinions. The product staff engineer is more measured but has expressed similar concerns about the quality and provenance of AI-generated code, particularly for security-sensitive features in the billing surface. If either of these two pushes back hard on an AI rollout, the rest of the team will follow their lead. Beyond the staff engineers, I have a senior engineer on growth who was burned by an AI-generated migration script that corrupted a staging database six months ago, before she joined us; she is open to AI but skittish. Three of my engineers are in their first or second year of the industry and are quietly excited about AI but defer to seniors in any group conversation. I also have a concern about external optics: our top three enterprise customers have been asking pointed questions about how AI is used in our codebase, and if we adopt aggressively without a clear story, sales will face uncomfortable conversations.`;

const HEAVY_SUCCESS_VISION = `In 90 days, every one of my 12 engineers will be using AI as part of their day-to-day workflow, but the specific shape of that usage will be different per role. The platform team will use AI for boilerplate generation, test scaffolding, and migration script drafting (always with thorough human review). The product team will use AI for first-draft component implementations, copy generation for empty states and error messages, and rubber-ducking complex bug investigations. The growth team will use AI for landing page variants, marketing copy, and experiment design. We will have at least three documented case studies on our internal wiki showing concrete time-savings and quality improvements. The staff engineers will have publicly endorsed at least one specific AI use case each, which will be the signal to the rest of the team that the new normal is real. We will have established AI usage norms in our engineering handbook, including review standards, attribution conventions, and a list of explicitly-excluded use cases (security review, comp decisions, performance evaluations). Adoption will be measured not by 'PRs touched by AI' but by 'hours saved per engineer per week as self-reported in our weekly pulse.' We will have at least one customer-facing artifact that names our AI usage and our review standards explicitly. And critically, I will have used AI extensively myself in my own management workflow.`;

function bigIntake(label) {
  return {
    label,
    intake: {
      role: "VP Engineering at a Series B SaaS company, 12 engineers across 3 squads (platform, product, growth)",
      helpWith: [
        "Save time on repetitive work",
        "Improve the quality of what I produce",
        "Take on things I can't do today",
        "Make better decisions with data",
        "Keep up with information overload",
        "Scale my impact beyond my capacity",
      ],
      responsibilities: HEAVY_RESPONSIBILITIES,
      managerFluency:
        "Capable -- I use AI daily for spec drafting, meeting prep, and 1:1 retrospective synthesis. I am comfortable with Claude and ChatGPT.",
      teamFluency:
        "Mixed and skewed skeptical -- 3 enthusiasts, 6 cautiously open, 2 staff engineers actively skeptical, 1 senior burned by a past incident",
      failureRisks: HEAVY_FAILURE_RISKS,
      successVision: HEAVY_SUCCESS_VISION,
    },
  };
}

// Heavy fixtures: every primitive category filled to the user-natural max,
// many starred. Plan filled to 3 per rule (the max enforced by the tool schema).
function heavyFixtures() {
  const star = (text, starred = true) => ({ text, starred });
  return {
    primitives: {
      content: [
        star("AI drafts the weekly engineering newsletter from a list of PR titles and incident retros"),
        star("AI generates first-draft launch announcements from a feature spec and a tone reference"),
        star("AI writes empty-state and error-message copy across the product"),
        { text: "AI summarizes long Slack threads into a 3-bullet decision log", starred: false },
        { text: "AI rewrites architecture RFCs for a non-technical executive audience", starred: false },
      ],
      automation: [
        star("AI auto-triages incoming bug reports by likely team owner and severity"),
        star("AI summarizes overnight CI failures and posts to the morning standup channel"),
        { text: "AI routes customer escalations to the right squad lead with a one-line context summary", starred: false },
      ],
      research: [
        star("AI digest of competitor pricing and feature releases, weekly"),
        { text: "AI synthesizes 20 customer interview transcripts into themes", starred: false },
        { text: "AI maintains a living competitor matrix from public sources", starred: false },
      ],
      data: [
        star("AI generates SQL from natural language for sales and CS leadership"),
        { text: "AI builds a weekly metrics narrative from raw Looker dashboards", starred: false },
        { text: "AI surfaces anomalies in deployment frequency and lead-time data", starred: false },
      ],
      coding: [
        star("AI scaffolds boilerplate for new microservices following our platform conventions"),
        star("AI writes the first cut of database migration scripts with safety checks"),
        { text: "AI generates test cases for new endpoints based on the OpenAPI spec", starred: false },
        { text: "AI refactors legacy callback-based code to async/await", starred: false },
      ],
      ideation: [
        star("AI runs structured brainstorms for quarterly OKR drafts using a SMART template"),
        { text: "AI surfaces counter-arguments to my architecture proposals before I share them", starred: false },
        { text: "AI generates 5 alternative framings for a difficult 1:1 conversation", starred: false },
      ],
    },
    plan: {
      destination: [
        star("Write a one-page picture of the team's AI workflow in 90 days, share it at next all-hands"),
        star("Schedule a 30-minute working session with each staff engineer to co-author what 'good AI usage' means for their team"),
        star("Define three specific success metrics: hours saved per engineer per week, AI-touched PR review time, and self-reported confidence"),
      ],
      safe: [
        star("In your next 1:1 with each staff engineer, share a concrete AI miss you had and what you learned"),
        star("Block 'AI lab hour' every Friday afternoon on the team calendar, explicitly no deliverables expected"),
        { text: "Publish a one-page 'AI usage norms' draft, invite the staff engineers to red-team it before publishing", starred: false },
      ],
      script: [
        star("Identify the one engineer already getting AI wins, ask them to demo at Tuesday's standup"),
        star("Add an AI prompt template to the team wiki for the three most common workflows"),
        { text: "Embed AI suggestions into the existing PR template as an optional checkbox", starred: false },
      ],
      small: [
        star("Pick one workflow per squad as the pilot for the first 30 days; protect from scaling pressure"),
        star("Define explicit 'expand when' criteria before starting any pilot: number of users, weeks of data, success metric thresholds"),
        { text: "Pair the most enthusiastic engineer in each squad with the most skeptical for the pilot week", starred: false },
      ],
      visible: [
        star("Open every weekly engineering meeting with one AI win or attempt from the prior week"),
        star("Send a Friday recap email with hours saved by the team, framed in terms of outcomes the business cares about"),
        { text: "Publish a quarterly external blog post about your team's AI journey, with named engineer contributors", starred: false },
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
  const fixtures = heavyFixtures();
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
        reason: body?.error || `HTTP ${res.status}`,
      };
    }
    const validation = validateSynthesis(body?.synthesis);
    if (validation) {
      return { idx, ok: false, ms, status: res.status, reason: validation };
    }
    return {
      idx,
      ok: true,
      ms,
      status: res.status,
      titleSnippet: body.synthesis.title.slice(0, 70),
      storylines: body.synthesis.storylines.length,
    };
  } catch (err) {
    return {
      idx,
      ok: false,
      ms: Date.now() - t0,
      reason: err?.message || "fetch failed",
    };
  }
}

// Compute input size, for reference.
const sample = JSON.stringify({
  intake: bigIntake("sample").intake,
  ...heavyFixtures(),
});
console.log(`Heavy payload size: ${sample.length} bytes (~${Math.round(sample.length / 4)} input tokens, rough)`);

const N = 10;
const requests = Array.from({ length: N }, (_, i) =>
  bigIntake(`heavy-${i + 1}`),
);

console.log(`Firing ${N} concurrent heavy POSTs to ${URL} ...`);
const t0 = Date.now();
const results = await Promise.all(requests.map((r, i) => runOne(i + 1, r)));
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
  console.log(
    `  #${String(r.idx).padStart(2, " ")} ${tag} ${String(r.ms).padStart(6, " ")}ms  ${detail}`,
  );
}

console.log("");
const latencies = results.map((r) => r.ms);
console.log(`Summary: ${passed}/${N} passed, ${failed} failed, wall=${wall}ms`);
console.log(`Min:    ${Math.min(...latencies)}ms`);
console.log(`Median: ${median(latencies)}ms`);
console.log(`P95:    ${p(latencies, 0.95)}ms`);
console.log(`Max:    ${Math.max(...latencies)}ms`);
console.log("");
console.log(
  `Server kill threshold (vercel.json maxDuration): 60000ms. Headroom from worst observed: ${60000 - Math.max(...latencies)}ms.`,
);

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[m - 1] + s[m]) / 2) : s[m];
}
function p(arr, q) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
}
