// Phase 3 prompt competition: hints prompt vs article-fueled article.
//   Arm A: prompts/playbook-generate.txt (production: condensed hints)
//          palette, context signals, quality checks)
//   Arm B: prompts/playbook-article.txt (Yonatan's full 5-rules article
//          verbatim as the knowledge base, minimal floors, creative freedom)
// Same schema, same personas, same server trim. Judge: claude-opus-4-8,
// balanced scorecard (behavior-change power, personalization, freshness),
// absolute per arm + order-swapped pairwise. Yonatan's read outranks.
//
// Run: node evals/playbook-ab.mjs   (direct Anthropic calls, no dev server)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const OUT = join(__dirname, "output");

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(APP_ROOT, ".env"))) {
  const env = readFileSync(join(APP_ROOT, ".env"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const JUDGE = "claude-opus-4-8";
const GEN_MODEL = "claude-sonnet-4-6";
const PROMPT_A = readFileSync(join(__dirname, "prompts", "playbook-generate.txt"), "utf8");
const PROMPT_B = readFileSync(join(__dirname, "prompts", "playbook-article.txt"), "utf8");

const PERSONAS = [
  {
    key: "cs-head", label: "Head of Customer Success",
    vars: {
      role: "Head of Customer Success at a 200-person SaaS company, leading a team of 12 CSMs",
      responsibilities: "Customer health monitoring, escalations, QBR preparation, renewals forecasting, onboarding playbooks, and CS team training",
      helpWith: "Save time on repetitive work, Scale my impact beyond my capacity",
      managerFluency: "Capable -- I use AI tools purposefully for specific tasks and can explain how they help",
      teamFluency: "Not yet started -- Most of my team hasn't engaged with AI tools in any meaningful way",
      failureRisks: "Two veteran CSMs see AI-written customer emails as impersonal and beneath their craft, and the rest of the team follows their lead",
      successVision: "Every CSM uses AI to prep QBRs and client calls, and we cut QBR prep time in half",
    },
  },
  {
    key: "eng-manager", label: "Engineering Manager",
    vars: {
      role: "Engineering Manager at a 60-person fintech SaaS, leads 8 backend and platform engineers",
      responsibilities: "Sprint planning, incident reviews, architecture decisions, code review standards, on-call rotations, hiring and onboarding engineers",
      helpWith: "Make better decisions with data, Keep up with information overload",
      managerFluency: "Not yet started -- I know I should be using AI but haven't found the right entry point yet",
      teamFluency: "Capable -- A few people use AI for specific tasks, but it's individual and inconsistent",
      failureRisks: "The team already thinks I'm behind on AI; if my first push is clumsy they'll quietly ignore it and keep doing their own thing",
      successVision: "Incident postmortems, sprint summaries, and architecture docs get first-drafted by AI, and I stop being the bottleneck",
    },
  },
  {
    key: "od-director", label: "Director of Organizational Development",
    vars: {
      role: "Director of Organizational Development at a 400-person SaaS company, leads 5 L&D partners",
      responsibilities: "Leadership development programs, manager training curricula, org design projects, engagement surveys, executive coaching",
      helpWith: "Improve the quality of what I produce, Take on things I can't do today",
      managerFluency: "Capable -- I use AI tools purposefully for specific tasks and can explain how they help",
      teamFluency: "Capable -- A few people use AI for specific tasks, but it's individual and inconsistent",
      failureRisks: "Facilitators fear AI-generated content will make programs feel generic and undercut their craft",
      successVision: "Program design cycles run twice as fast and managers keep practicing between sessions instead of forgetting everything after the workshop",
    },
  },
  {
    key: "hr-partner", label: "HR Business Partner",
    vars: {
      role: "HR Business Partner supporting a 300-person engineering org at a public SaaS company",
      responsibilities: "Performance review cycles, compensation planning, employee relations cases, manager coaching, headcount planning and org design",
      helpWith: "Improve the quality of what I produce, Make better decisions with data",
      managerFluency: "Capable -- I use AI tools purposefully for specific tasks and can explain how they help",
      teamFluency: "Not yet started -- Most of my team hasn't engaged with AI tools in any meaningful way",
      failureRisks: "Anything that smells like AI reading employee data will trigger legal and works-council pushback, and one bad privacy moment kills the whole effort",
      successVision: "Manager coaching prep and review-cycle calibration docs take half the time, without any employee data ever leaving approved tools",
    },
  },
];

const RULE_IDS = ["destination", "safe", "script", "small", "visible"];
const RULE_NAMES = { destination: "Start at the End", safe: "Make It Safe", script: "Script the Steps", small: "Start Small, to go Big", visible: "Make Progress Visible" };
const PLAN_TOOL = {
  name: "submit_change_plan",
  description: "Submit the personalized change strategy. prioritizedRules names the 1-2 rules that get a third action; every other rule gets exactly 2 actions (11-12 total). Each action is under 25 words and starts with a concrete verb.",
  input_schema: {
    type: "object", required: ["prioritizedRules", ...RULE_IDS],
    properties: {
      prioritizedRules: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", enum: RULE_IDS } },
      ...Object.fromEntries(RULE_IDS.map((r) => [r, { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } }])),
    },
  },
};

const render = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
const asArr = (v) => (Array.isArray(v) ? v.map(String) : []);

async function anthropic(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).content.find((b) => b.type === "tool_use").input;
}

// starred ideas per persona from the last journey run; od-director has none.
const journey = JSON.parse(readFileSync(join(OUT, "journey-review.json"), "utf8"));
function starredBlockFor(key) {
  const r = journey.find((x) => x.key === key);
  if (!r || !r.stages.starredIdeas) return "(none yet)";
  return r.stages.starredIdeas.map((s) => { const m = s.match(/^\[(.+?)\] (.+)$/); return `- ${m[1]}: ${m[2]}`; }).join("\n");
}

async function generatePlan(tpl, vars) {
  const raw = await anthropic({
    model: GEN_MODEL, max_tokens: 4096,
    tools: [PLAN_TOOL], tool_choice: { type: "tool", name: PLAN_TOOL.name },
    messages: [{ role: "user", content: render(tpl, vars) }],
  });
  const pri = asArr(raw.prioritizedRules).slice(0, 2);
  return Object.fromEntries(RULE_IDS.map((r) => [r, asArr(raw[r]).slice(0, pri.includes(r) ? 3 : 2)]));
}

const planText = (plan) => RULE_IDS.flatMap((r) => plan[r].map((a) => `[${RULE_NAMES[r]}] ${a}`)).map((t, i) => `${i + 1}. ${t}`).join("\n");

const ABS_TOOL = {
  name: "score_plan",
  description: "Score one change plan on three dimensions.",
  input_schema: {
    type: "object", required: ["behaviorChange", "personalization", "freshness", "verdict"],
    properties: {
      behaviorChange: { type: "integer", minimum: 1, maximum: 5, description: "Would this plan actually change how this team works: right fears named, right defaults changed, right pilot contained" },
      personalization: { type: "integer", minimum: 1, maximum: 5, description: "Unmistakably THIS manager's plan; intake specifics inside the actions; not transferable to another manager with the same title" },
      freshness: { type: "integer", minimum: 1, maximum: 5, description: "Moves a sharp manager would not have thought of; no stock-template feel" },
      verdict: { type: "string", description: "Two sentences" },
    },
  },
};
const PAIR_TOOL = {
  name: "pick_winner",
  description: "Compare two change plans for the same manager.",
  input_schema: {
    type: "object", required: ["behaviorChange", "personalization", "freshness", "overall", "reason"],
    properties: {
      behaviorChange: { type: "string", enum: ["A", "B", "tie"] },
      personalization: { type: "string", enum: ["A", "B", "tie"] },
      freshness: { type: "string", enum: ["A", "B", "tie"] },
      overall: { type: "string", enum: ["A", "B", "tie"] },
      reason: { type: "string", description: "Three sentences max" },
    },
  },
};

const CRITERIA = `Judge as the manager's own executive coach would. Dimensions:
1. BEHAVIOR-CHANGE POWER: would this plan actually change how this team works? Right fears named before benefits sold, defaults changed rather than announcements made, one contained pilot with expand-when criteria, a real visibility rhythm.
2. PERSONALIZATION: is this unmistakably THIS manager's plan? Intake specifics (the named fear, the team's actual rituals and deliverables, the vision's own finish line) inside the actions, not role-generic advice.
3. FRESHNESS: does anything here surprise? Moves a sharp manager would not have produced alone; no stock-template feel.
Floors (violations hurt any dimension they touch): actions are human moves by the manager or their own team, never client-facing management or workflow construction; nothing invents the manager's experiences or metrics.`;

async function judgeAbs(vars, plan) {
  return anthropic({
    model: JUDGE, max_tokens: 1200, thinking: { type: "adaptive" },
    tools: [ABS_TOOL], tool_choice: { type: "tool", name: ABS_TOOL.name },
    messages: [{ role: "user", content: `MANAGER:\n${JSON.stringify(vars, null, 1)}\n\nPLAN:\n${planText(plan)}\n\n${CRITERIA}` }],
  });
}
async function judgePairOnce(vars, planA, planB) {
  return anthropic({
    model: JUDGE, max_tokens: 1200, thinking: { type: "adaptive" },
    tools: [PAIR_TOOL], tool_choice: { type: "tool", name: PAIR_TOOL.name },
    messages: [{ role: "user", content: `MANAGER:\n${JSON.stringify(vars, null, 1)}\n\nPLAN A:\n${planText(planA)}\n\nPLAN B:\n${planText(planB)}\n\n${CRITERIA}\n\nPick the winner per dimension and overall.` }],
  });
}
async function judgePair(vars, plan1, plan2) {
  const [ab, ba] = await Promise.all([judgePairOnce(vars, plan1, plan2), judgePairOnce(vars, plan2, plan1)]);
  const tally = (dim) => {
    let v1 = 0, v2 = 0;
    if (ab[dim] === "A") v1++; else if (ab[dim] === "B") v2++;
    if (ba[dim] === "A") v2++; else if (ba[dim] === "B") v1++;
    return v1 > v2 ? "hints" : v2 > v1 ? "article" : "tie";
  };
  return { behaviorChange: tally("behaviorChange"), personalization: tally("personalization"), freshness: tally("freshness"), overall: tally("overall"), detail: [ab, ba] };
}

// ------------------------------------------------------------------- main
mkdirSync(OUT, { recursive: true });
const report = [];
const summary = [];

for (const p of PERSONAS) {
  console.log(`\n=== ${p.label}`);
  const vars = { ...p.vars, starredBlock: starredBlockFor(p.key) };
  const [planA, planB] = await Promise.all([generatePlan(PROMPT_A, vars), generatePlan(PROMPT_B, vars)]);
  const [sA, sB] = await Promise.all([judgeAbs(p.vars, planA), judgeAbs(p.vars, planB)]);
  const pair = await judgePair(p.vars, planA, planB); // 1 = hints, 2 = article
  const fmt = (s) => `bc${s.behaviorChange} pz${s.personalization} fr${s.freshness}`;
  console.log(`  hints: ${fmt(sA)} | article: ${fmt(sB)}`);
  console.log(`  pairwise -> behaviorChange: ${pair.behaviorChange}, personalization: ${pair.personalization}, freshness: ${pair.freshness}, OVERALL: ${pair.overall}`);
  report.push({ persona: p.label, key: p.key, plans: { hints: planA, article: planB }, absolute: { hints: sA, article: sB }, pair });
  summary.push({ persona: p.label, hints: fmt(sA), article: fmt(sB), overall: pair.overall });
}

writeFileSync(join(OUT, "playbook-ab.json"), JSON.stringify(report, null, 2));

const md = [`# Phase 3 knowledge test: condensed hints vs full article, same engineering`, "",
  "| Persona | Engineered (bc/pz/fr) | Freeform (bc/pz/fr) | Overall winner |", "|---|---|---|---|",
  ...summary.map((s) => `| ${s.persona} | ${s.hints} | ${s.article} | ${s.overall} |`),
];
for (const r of report) {
  md.push("", `## ${r.persona}`, "");
  for (const [arm, label] of [["hints", "Engineered (production)"], ["article", "Article-fueled article"]]) {
    const a = r.absolute[arm];
    md.push(`### ${label} — behaviorChange ${a.behaviorChange}/5, personalization ${a.personalization}/5, freshness ${a.freshness}/5`, `> ${a.verdict}`, "");
    for (const rule of RULE_IDS) for (const act of r.plans[arm][rule]) md.push(`- [${RULE_NAMES[rule]}] ${act}`);
    md.push("");
  }
  md.push(`### Pairwise: behaviorChange **${r.pair.behaviorChange}** · personalization **${r.pair.personalization}** · freshness **${r.pair.freshness}** · OVERALL **${r.pair.overall}**`, `> ${r.pair.detail[0].reason}`);
}
writeFileSync(join(OUT, "playbook-ab.md"), md.join("\n"));
console.log("\nWrote evals/output/playbook-ab.md and .json");
