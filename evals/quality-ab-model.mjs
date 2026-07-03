// Idea-quality A/B: does the upgraded prompt help, and does Sonnet 5 help?
//   Arms: base prompt @ sonnet-4-6  |  new prompt @ sonnet-4-6  |  new prompt @ sonnet-5
//   Judge: claude-opus-4-8, absolute 1-5 score + order-swapped pairwise verdicts.
// Also re-checks playbook workflow dominance under the new anchor-roles prompt.
//
// Run: node evals/quality-ab-model.mjs   (direct Anthropic calls, no dev server needed)

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
const BASE_PROMPT = readFileSync(join(__dirname, "prompts", "primitives-frozen-2026-07-03.txt"), "utf8");
const NEW_PROMPT = readFileSync(join(__dirname, "prompts", "primitives-generate.txt"), "utf8");
const PLAYBOOK_PROMPT = readFileSync(join(__dirname, "prompts", "playbook-generate.txt"), "utf8");

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

const CATS = ["content", "automation", "research", "data", "coding", "ideation"];
const CATEGORY_TITLES = { content: "Content Creation", automation: "Task Automation", research: "Research & Synthesis", data: "Data & Insights", coding: "Technical Work", ideation: "Strategy & Ideation" };
const catField = () => ({ type: "array", minItems: 1, maxItems: 3, items: { type: "string" } });
const USE_CASES_TOOL = {
  name: "submit_use_cases",
  description: "Submit the personalized AI use cases. Each field is an array of 1 to 3 idea sentences (12 ideas total across all fields), each 15 to 20 words, each starting with a verb.",
  input_schema: { type: "object", required: CATS, properties: Object.fromEntries(CATS.map((c) => [c, catField()])) },
};
const RULE_IDS = ["destination", "safe", "script", "small", "visible"];
const PLAN_TOOL = {
  name: "submit_change_plan",
  description: "Submit the personalized change strategy. prioritizedRules names the 1-2 rules that get a third action; every other rule gets exactly 2 actions (11-12 total).",
  input_schema: {
    type: "object", required: ["prioritizedRules", ...RULE_IDS],
    properties: {
      prioritizedRules: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", enum: RULE_IDS } },
      ...Object.fromEntries(RULE_IDS.map((r) => [r, { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } }])),
    },
  },
};

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

async function anthropic(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  return data.content.find((b) => b.type === "tool_use").input;
}

async function generateIdeas(promptTpl, vars, model) {
  const body = {
    model, max_tokens: 2048,
    tools: [USE_CASES_TOOL], tool_choice: { type: "tool", name: USE_CASES_TOOL.name },
    messages: [{ role: "user", content: render(promptTpl, vars) }],
  };
  // Sonnet 5 runs adaptive thinking when the field is omitted, which conflicts
  // with forced tool_choice; disable explicitly (mirrors what a production
  // migration would do).
  if (model === "claude-sonnet-5") body.thinking = { type: "disabled" };
  return anthropic(body);
}

// Tool schemas aren't strictly enforced; coerce whatever came back to string[].
const asArr = (v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : []);
const listText = (ideas) => CATS.flatMap((c) => asArr(ideas[c]).map((t) => `[${CATEGORY_TITLES[c]}] ${t}`)).map((t, i) => `${i + 1}. ${t}`).join("\n");

const ABS_TOOL = {
  name: "score_ideas",
  description: "Score the quality of an AI use-case idea list for a specific manager.",
  input_schema: {
    type: "object", required: ["score", "standout", "weak", "verdict"],
    properties: {
      score: { type: "integer", minimum: 1, maximum: 5, description: "5 = a sharp manager would call these excellent; 3 = competent but predictable; 1 = generic filler" },
      standout: { type: "array", items: { type: "string" }, description: "Up to 3 ideas that clear the excellence bar, quoted" },
      weak: { type: "array", items: { type: "string" }, description: "Up to 3 weakest ideas with a short reason each" },
      verdict: { type: "string", description: "Two sentences: overall quality judgment" },
    },
  },
};
const PAIR_TOOL = {
  name: "pick_winner",
  description: "Compare two idea lists for the same manager.",
  input_schema: {
    type: "object", required: ["winner", "margin", "reason"],
    properties: {
      winner: { type: "string", enum: ["A", "B", "tie"] },
      margin: { type: "string", enum: ["slight", "clear"] },
      reason: { type: "string", description: "Two sentences max" },
    },
  },
};

const QUALITY_CRITERIA = `Judge by what a sharp, busy manager would consider EXCELLENT:
1. Concrete input and output: the manager knows exactly what to paste and what comes back.
2. Tryable at the TEAM's stated fluency (a "not yet started" team cannot run integrations, pipelines, or scripts; Technical Work ideas the manager builds personally are exempt).
3. Specific to this person's actual work, never role-title filler.
4. At least a couple of ideas are non-obvious: an overlooked corner of the workload, not the first thing anyone would say.
5. Respects hard constraints stated in the failure risks (e.g. data privacy).`;

async function judgeAbs(vars, ideas) {
  return anthropic({
    model: JUDGE, max_tokens: 1500, thinking: { type: "adaptive" },
    tools: [ABS_TOOL], tool_choice: { type: "tool", name: ABS_TOOL.name },
    messages: [{ role: "user", content: `MANAGER:\n${JSON.stringify(vars, null, 1)}\n\nIDEA LIST:\n${listText(ideas)}\n\n${QUALITY_CRITERIA}` }],
  });
}
async function judgePairOnce(vars, ideasA, ideasB) {
  return anthropic({
    model: JUDGE, max_tokens: 1000, thinking: { type: "adaptive" },
    tools: [PAIR_TOOL], tool_choice: { type: "tool", name: PAIR_TOOL.name },
    messages: [{ role: "user", content: `MANAGER:\n${JSON.stringify(vars, null, 1)}\n\nLIST A:\n${listText(ideasA)}\n\nLIST B:\n${listText(ideasB)}\n\n${QUALITY_CRITERIA}\n\nWhich list would serve this manager better overall?` }],
  });
}
// Order-swapped double judgment to cancel position bias.
async function judgePair(vars, ideas1, ideas2) {
  const [ab, ba] = await Promise.all([judgePairOnce(vars, ideas1, ideas2), judgePairOnce(vars, ideas2, ideas1)]);
  const votes = { 1: 0, 2: 0 };
  if (ab.winner === "A") votes[1]++; else if (ab.winner === "B") votes[2]++;
  if (ba.winner === "A") votes[2]++; else if (ba.winner === "B") votes[1]++;
  const result = votes[1] > votes[2] ? "first" : votes[2] > votes[1] ? "second" : "tie";
  return { result, detail: [ab, ba] };
}

const DOM_TOOL = {
  name: "report_dominance",
  description: "Report the single most-repeated deliverable/workflow across the actions.",
  input_schema: { type: "object", required: ["theme", "count", "total"], properties: { theme: { type: "string" }, count: { type: "integer" }, total: { type: "integer" } } },
};

// starred ideas per persona: reuse the journey run's simulated stars.
const journey = JSON.parse(readFileSync(join(OUT, "journey-review.json"), "utf8"));
function starredBlockFor(key) {
  const r = journey.find((x) => x.key === key);
  if (!r || !r.stages.starredIdeas) return "(none yet)";
  return r.stages.starredIdeas.map((s) => {
    const m = s.match(/^\[(.+?)\] (.+)$/);
    return `- ${m[1]}: ${m[2]}`;
  }).join("\n");
}

// ------------------------------------------------------------------- main
mkdirSync(OUT, { recursive: true });
const report = [];
const summary = [];

for (const p of PERSONAS) {
  console.log(`\n=== ${p.label}`);
  const [base46, new46, newS5] = await Promise.all([
    generateIdeas(BASE_PROMPT, p.vars, "claude-sonnet-4-6"),
    generateIdeas(NEW_PROMPT, p.vars, "claude-sonnet-4-6"),
    generateIdeas(NEW_PROMPT, p.vars, "claude-sonnet-5"),
  ]);
  const [sBase, sNew, sS5] = await Promise.all([judgeAbs(p.vars, base46), judgeAbs(p.vars, new46), judgeAbs(p.vars, newS5)]);
  const [promptEffect, modelEffect] = await Promise.all([
    judgePair(p.vars, base46, new46),   // first = base prompt, second = new prompt
    judgePair(p.vars, new46, newS5),    // first = sonnet 4.6, second = sonnet 5
  ]);
  console.log(`  scores: base-4.6 ${sBase.score} | new-4.6 ${sNew.score} | new-S5 ${sS5.score}`);
  console.log(`  prompt effect: ${promptEffect.result === "second" ? "NEW prompt wins" : promptEffect.result === "first" ? "BASE prompt wins" : "tie"}`);
  console.log(`  model effect:  ${modelEffect.result === "second" ? "SONNET 5 wins" : modelEffect.result === "first" ? "SONNET 4.6 wins" : "tie"}`);

  // dominance re-check with the new playbook prompt on the production model
  const planVars = { ...p.vars, starredBlock: starredBlockFor(p.key) };
  const rawPlan = await anthropic({
    model: "claude-sonnet-4-6", max_tokens: 4096,
    tools: [PLAN_TOOL], tool_choice: { type: "tool", name: PLAN_TOOL.name },
    messages: [{ role: "user", content: render(PLAYBOOK_PROMPT, planVars) }],
  });
  const pri = asArr(rawPlan.prioritizedRules).slice(0, 2);
  const plan = Object.fromEntries(RULE_IDS.map((r) => [r, asArr(rawPlan[r]).slice(0, pri.includes(r) ? 3 : 2)]));
  const actionsList = RULE_IDS.flatMap((r) => plan[r].map((a) => `[${r}] ${a}`)).join("\n");
  const dom = await anthropic({
    model: "claude-sonnet-4-6", max_tokens: 500,
    tools: [DOM_TOOL], tool_choice: { type: "tool", name: DOM_TOOL.name },
    messages: [{ role: "user", content: `Across these change-management actions, identify the single most-repeated deliverable or workflow and count how many actions center on it.\n\n${actionsList}` }],
  });
  console.log(`  dominance (new prompt): ${dom.theme} in ${dom.count}/${dom.total}`);

  report.push({ persona: p.label, key: p.key, ideas: { base46, new46, newS5 }, absolute: { base46: sBase, new46: sNew, newS5: sS5 }, promptEffect, modelEffect, plan, dominance: dom });
  summary.push({ persona: p.label, base46: sBase.score, new46: sNew.score, newS5: sS5.score, promptEffect: promptEffect.result, modelEffect: modelEffect.result, dominance: `${dom.theme} ${dom.count}/${dom.total}` });
}

writeFileSync(join(OUT, "quality-ab.json"), JSON.stringify(report, null, 2));

const md = [`# Idea Quality A/B — ${new Date().toISOString().slice(0, 16)}`, "",
  "| Persona | base@4.6 | new@4.6 | new@S5 | Prompt effect | Model effect | Dominance (new plan prompt) |", "|---|---|---|---|---|---|---|",
  ...summary.map((s) => `| ${s.persona} | ${s.base46}/5 | ${s.new46}/5 | ${s.newS5}/5 | ${s.promptEffect === "second" ? "new wins" : s.promptEffect === "first" ? "base wins" : "tie"} | ${s.modelEffect === "second" ? "S5 wins" : s.modelEffect === "first" ? "4.6 wins" : "tie"} | ${s.dominance} |`),
];
for (const r of report) {
  md.push("", `## ${r.persona}`, "");
  for (const [arm, label] of [["base46", "Base prompt @ Sonnet 4.6"], ["new46", "New prompt @ Sonnet 4.6"], ["newS5", "New prompt @ Sonnet 5"]]) {
    const a = r.absolute[arm];
    md.push(`### ${label} — ${a.score}/5`, `> ${a.verdict}`, "", listText(r.ideas[arm]).split("\n").map((l) => `- ${l.replace(/^\d+\. /, "")}`).join("\n"), "");
    if (a.standout?.length) md.push(`Standout: ${a.standout.join(" · ")}`, "");
    if (a.weak?.length) md.push(`Weak: ${a.weak.join(" · ")}`, "");
  }
  md.push(`### Pairwise`, `- Prompt effect (base vs new, both 4.6): **${r.promptEffect.result === "second" ? "new prompt wins" : r.promptEffect.result === "first" ? "base prompt wins" : "tie"}** — ${r.promptEffect.detail[0].reason}`, `- Model effect (4.6 vs 5, new prompt): **${r.modelEffect.result === "second" ? "Sonnet 5 wins" : r.modelEffect.result === "first" ? "Sonnet 4.6 wins" : "tie"}** — ${r.modelEffect.detail[0].reason}`);
  md.push("", `### Plan dominance under new anchor-roles prompt: ${r.dominance.theme} in ${r.dominance.count}/${r.dominance.total}`);
  for (const rule of RULE_IDS) for (const a of r.plan[rule]) md.push(`- [${rule}] ${a}`);
}
writeFileSync(join(OUT, "quality-ab.md"), md.join("\n"));
console.log("\nWrote evals/output/quality-ab.md and .json");
