// Idea-quality A/B: does the current primitives prompt beat its predecessor?
//   Arms: excellence-bar single-pass @ sonnet-4-6 (frozen 2026-07-03)
//       | current prompt @ sonnet-4-6 (transformative license + injected floor
//         + commitment trim + modality coverage, i.e. the live endpoint)
//   Judge: claude-opus-4-8, absolute 1-5 score + order-swapped pairwise verdicts.
//   Judged by EXPECTED VALUE for the manager, never by idea size (Yonatan's
//   2026-07-03 decision: size is a dimension, not a value).
// Also re-checks playbook workflow dominance under the current playbook prompt.
//
// Findings this file already settled (do not relitigate): Sonnet 5 is not the
// quality lever (3-1-1 vs 4.6, flat absolute scores); the excellence-bar
// prompt beat the pre-bar baseline 4/5; the diverge/converge two-call
// pipeline was parity-at-best vs single-pass (1 win / 9 losses / 3 ties
// pairwise over 4 runs, absolute tied, no transformative ideas surfacing)
// and was dropped on 2026-07-03.
//
// Run: node evals/quality-ab-model.mjs   (direct Anthropic calls, no dev server needed)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { teamFluencyFloor } from "../lib/workshop.js";

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
const BASE_PROMPT = readFileSync(join(__dirname, "prompts", "primitives-singlepass-frozen-2026-07-03.txt"), "utf8");
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
    // Capable manager AND capable team: the case where transformative ideas
    // can clear the floors, and the persona Yonatan reviews personally.
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

const CATS = ["content", "automation", "research", "data", "coding", "ideation"];
const CATEGORY_TITLES = { content: "Content Creation", automation: "Task Automation", research: "Research & Synthesis", data: "Data & Insights", coding: "Technical Work", ideation: "Strategy & Ideation" };
const catField = () => ({ type: "array", minItems: 1, maxItems: 3, items: { type: "string" } });
// Legacy tool for the frozen-baseline arm (faithful to what shipped with the
// frozen prompt); the current arm adds the commitment fields.
const USE_CASES_TOOL = {
  name: "submit_use_cases",
  description: "Submit the personalized AI use cases. Each field is an array of 1 to 3 idea sentences (12 ideas total across all fields), each 15 to 20 words, each starting with a verb.",
  input_schema: { type: "object", required: CATS, properties: Object.fromEntries(CATS.map((c) => [c, catField()])) },
};
// Mirrors api/primitives-generate.js: the preloadedAssistant family is only
// required when someone (manager or team) could actually set one up.
function currentTool(vars) {
  const canPreload = !/^not yet/i.test(vars.managerFluency || "") || !/^not yet/i.test(vars.teamFluency || "");
  return {
    name: "submit_use_cases",
    description: "Submit the personalized AI use cases. focusCategories names the 1-2 best-fit categories (3 ideas each) and stretchCategory the biggest stretch (1 idea); every other category gets 2. Each idea is a 15 to 20 word sentence starting with a verb.",
    input_schema: {
      type: "object", required: [...CATS, "focusCategories", "stretchCategory"],
      properties: {
        ...Object.fromEntries(CATS.map((c) => [c, catField()])),
        focusCategories: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", enum: CATS }, description: "The 1-2 categories that best fit this manager; each gets 3 ideas" },
        stretchCategory: { type: "string", enum: CATS, description: "The category that is the biggest stretch for this role; it gets exactly 1 idea" },
        modalityCoverage: {
          type: "object",
          required: [...(canPreload ? ["preloadedAssistant"] : []), "critique", "rolePlay", "transcription"],
          properties: {
            preloadedAssistant: { type: "string", description: "The final idea (quoted verbatim) where someone chats with an assistant preloaded with the team's context" },
            critique: { type: "string", description: "The final idea (quoted verbatim) where AI critiques, red-teams, or pressure-tests something" },
            rolePlay: { type: "string", description: "The final idea (quoted verbatim) where someone rehearses or role-plays with AI" },
            transcription: { type: "string", description: "The final idea (quoted verbatim) where a meeting or conversation is transcribed and synthesized" },
          },
          description: "Proof of modality spread: name the final idea covering each family",
        },
      },
    },
  };
}
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

async function generateBase(vars) {
  return anthropic({
    model: GEN_MODEL, max_tokens: 2048,
    tools: [USE_CASES_TOOL], tool_choice: { type: "tool", name: USE_CASES_TOOL.name },
    messages: [{ role: "user", content: render(BASE_PROMPT, vars) }],
  });
}

// Mirrors api/primitives-generate.js: current prompt with injected fluency
// floor, then the server-side commitment trim.
async function generateCurrent(vars) {
  const tool = currentTool(vars);
  const raw = await anthropic({
    model: GEN_MODEL, max_tokens: 2048,
    tools: [tool], tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: render(NEW_PROMPT, { ...vars, teamFluencyFloor: teamFluencyFloor(vars.teamFluency) }) }],
  });
  const focus = Array.isArray(raw.focusCategories) ? raw.focusCategories.slice(0, 2) : [];
  const stretch = typeof raw.stretchCategory === "string" ? raw.stretchCategory : null;
  return Object.fromEntries(CATS.map((c) => {
    const limit = focus.includes(c) ? 3 : c === stretch ? 1 : 2;
    return [c, asArr(raw[c]).slice(0, limit)];
  }));
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
      score: { type: "integer", minimum: 1, maximum: 5, description: "5 = the highest-value set available for this manager; 3 = competent but predictable; 1 = generic filler" },
      standout: { type: "array", items: { type: "string" }, description: "Up to 3 ideas that clear the value bar, quoted" },
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

const QUALITY_CRITERIA = `Judge by EXPECTED VALUE for this specific manager: is this the highest-value set available for this person?
1. Recurrence and reach: how often the pain each idea hits occurs, and how many people it touches.
2. Pain relief: how much the manager or team suffers doing that work today.
3. Proximity to the stated 90-day vision: work the vision names outranks work it does not.
4. Adoption probability: given the team's fluency, the failure risks, and named resistance, will this actually get used?

FLOORS every idea must clear (a violation is a defect):
- Serves an outcome the manager owns, within their own authority.
- Feasible at the TEAM's stated fluency (a "not yet started" team runs ideas only by pasting text into a chat tool or chatting with an assistant the manager set up for them; ideas the manager runs personally are exempt and may use the manager's fluency).
- Respects hard constraints stated in the failure risks (e.g. data privacy, no AI-written customer emails).
- Applies AI to the work itself, never to the AI adoption effort.
- Absorbable by this team within a quarter.

Also value: concrete input and output per idea (the manager knows what goes in and what comes back); modality spread (a monoculture of paste-a-prompt transactions is a defect); a couple of genuinely non-obvious ideas.

IMPORTANT: Do NOT reward or penalize an idea for its size or ambition in itself. A small idea hitting a daily pain can be the highest-value item on the list; a transformative idea that clears the floors and states its first probe is equally legitimate. Judge value, never altitude.`;

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
  const [base, current] = await Promise.all([
    generateBase(p.vars),
    generateCurrent(p.vars),
  ]);
  const [sBase, sCurrent] = await Promise.all([judgeAbs(p.vars, base), judgeAbs(p.vars, current)]);
  const promptEffect = await judgePair(p.vars, base, current); // first = frozen baseline, second = current prompt
  console.log(`  scores: baseline ${sBase.score} | current ${sCurrent.score}`);
  console.log(`  pairwise: ${promptEffect.result === "second" ? "CURRENT wins" : promptEffect.result === "first" ? "BASELINE wins" : "tie"}`);

  // dominance re-check with the current playbook prompt on the production model
  const planVars = { ...p.vars, starredBlock: starredBlockFor(p.key) };
  const rawPlan = await anthropic({
    model: GEN_MODEL, max_tokens: 4096,
    tools: [PLAN_TOOL], tool_choice: { type: "tool", name: PLAN_TOOL.name },
    messages: [{ role: "user", content: render(PLAYBOOK_PROMPT, planVars) }],
  });
  const pri = asArr(rawPlan.prioritizedRules).slice(0, 2);
  const plan = Object.fromEntries(RULE_IDS.map((r) => [r, asArr(rawPlan[r]).slice(0, pri.includes(r) ? 3 : 2)]));
  const actionsList = RULE_IDS.flatMap((r) => plan[r].map((a) => `[${r}] ${a}`)).join("\n");
  const dom = await anthropic({
    model: GEN_MODEL, max_tokens: 500,
    tools: [DOM_TOOL], tool_choice: { type: "tool", name: DOM_TOOL.name },
    messages: [{ role: "user", content: `Across these change-management actions, identify the single most-repeated deliverable or workflow and count how many actions center on it.\n\n${actionsList}` }],
  });
  console.log(`  dominance (current plan prompt): ${dom.theme} in ${dom.count}/${dom.total}`);

  report.push({ persona: p.label, key: p.key, ideas: { base, current }, absolute: { base: sBase, current: sCurrent }, promptEffect, plan, dominance: dom });
  summary.push({ persona: p.label, base: sBase.score, current: sCurrent.score, promptEffect: promptEffect.result, dominance: `${dom.theme} ${dom.count}/${dom.total}` });
}

writeFileSync(join(OUT, "quality-ab.json"), JSON.stringify(report, null, 2));

const md = [`# Idea Quality A/B: frozen baseline vs current prompt — ${new Date().toISOString().slice(0, 16)}`, "",
  "| Persona | baseline | current | Pairwise | Dominance (plan prompt) |", "|---|---|---|---|---|",
  ...summary.map((s) => `| ${s.persona} | ${s.base}/5 | ${s.current}/5 | ${s.promptEffect === "second" ? "current wins" : s.promptEffect === "first" ? "baseline wins" : "tie"} | ${s.dominance} |`),
];
for (const r of report) {
  md.push("", `## ${r.persona}`, "");
  for (const [arm, label] of [["base", "Excellence-bar single-pass (frozen 2026-07-03)"], ["current", "Current prompt (transformative license + structural enforcement)"]]) {
    const a = r.absolute[arm];
    md.push(`### ${label} — ${a.score}/5`, `> ${a.verdict}`, "", listText(r.ideas[arm]).split("\n").map((l) => `- ${l.replace(/^\d+\. /, "")}`).join("\n"), "");
    if (a.standout?.length) md.push(`Standout: ${a.standout.join(" · ")}`, "");
    if (a.weak?.length) md.push(`Weak: ${a.weak.join(" · ")}`, "");
  }
  md.push(`### Pairwise (baseline vs current): **${r.promptEffect.result === "second" ? "current wins" : r.promptEffect.result === "first" ? "baseline wins" : "tie"}** — ${r.promptEffect.detail[0].reason}`);
  md.push("", `### Plan dominance under current playbook prompt: ${r.dominance.theme} in ${r.dominance.count}/${r.dominance.total}`);
  for (const rule of RULE_IDS) for (const a of r.plan[rule]) md.push(`- [${rule}] ${a}`);
}
writeFileSync(join(OUT, "quality-ab.md"), md.join("\n"));
console.log("\nWrote evals/output/quality-ab.md and .json");
