// Thin-intake test for AI Playbook synthesis.
// Hypothesis: If a manager gives thin/lazy intake answers, the synthesis collapses to generic.
// Compares RICH vs THIN intake on the same 3 managers, scoring specificity for each.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(APP_ROOT, ".env"))) {
  const env = readFileSync(join(APP_ROOT, ".env"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const MODEL = "claude-sonnet-4-6";
const JUDGE_MODEL = "claude-sonnet-4-6";

// RICH = what a thoughtful workshop participant types
// THIN = what a tired/disengaged participant types (1-3 words per field)
const MANAGERS_RICH = {
  A: { label: "Engineering Manager",
       role: "Engineering Manager at a 50-person SaaS startup, leads 7 engineers",
       helpWith: "Save time on repetitive tasks, Improve team productivity",
       responsibilities: "Lead a team of 7 engineers, sprint planning, 1:1s, OKRs, code review, hiring",
       managerFluency: "Capable", teamFluency: "Not yet started",
       failureRisks: "Senior engineers think AI produces bad code and will refuse to use it",
       successVision: "Every engineer using AI for at least one PR per week" },
  B: { label: "HR Business Partner",
       role: "HR Business Partner supporting a 300-person engineering org",
       helpWith: "Save time on repetitive tasks, Standardize quality",
       responsibilities: "Performance reviews, comp planning, ER cases, manager coaching, headcount planning",
       managerFluency: "Beginner", teamFluency: "Beginner",
       failureRisks: "Bias in AI-assisted decisions and legal exposure on perf reviews",
       successVision: "AI handles 70% of performance review prep work for the eng managers I support" },
  C: { label: "Marketing Director",
       role: "Marketing Director at a B2B fintech, 4 direct reports",
       helpWith: "Generate creative ideas faster, Better understand my customers",
       responsibilities: "Brand, demand gen, content calendar, paid acquisition, events, website",
       managerFluency: "Capable", teamFluency: "Beginner",
       failureRisks: "Brand voice drift if everyone uses AI differently",
       successVision: "AI is a creative partner for the team, not a replacement, by end of quarter" },
};

const MANAGERS_THIN = {
  A: { label: "Engineering Manager (thin intake)",
       role: "Engineering Manager",
       helpWith: "Save time",
       responsibilities: "Manage engineers",
       managerFluency: "Capable", teamFluency: "Beginner",
       failureRisks: "People won't use it",
       successVision: "Team uses AI" },
  B: { label: "HR Business Partner (thin intake)",
       role: "HR Business Partner",
       helpWith: "Standardize quality",
       responsibilities: "HR stuff",
       managerFluency: "Beginner", teamFluency: "Beginner",
       failureRisks: "Bias",
       successVision: "AI helps with reviews" },
  C: { label: "Marketing Director (thin intake)",
       role: "Marketing Director",
       helpWith: "More ideas",
       responsibilities: "Marketing",
       managerFluency: "Capable", teamFluency: "Beginner",
       failureRisks: "Brand drift",
       successVision: "Better content" },
};

// Same sample use cases/actions block — keeps the synthesis input parallel,
// so the only varied dimension is the intake-text richness.
const SAMPLE_INPUTS = {
  A: { useCases: { "Content Creation": ["* AI drafts PR descriptions from commit diffs"], "Task Automation": ["* Auto-generate weekly status from Jira"] },
       actions: { "Start at the End": ["* Spend 90 min using Copilot on a refactor before asking the team"], "Make It Safe": ["* 1:1s with the two senior engineers"] } },
  B: { useCases: { "Content Creation": ["* AI drafts performance review summaries from quarterly notes"], "Data & Insights": ["AI flags bias signals in draft review language"] },
       actions: { "Start at the End": ["* Write a 'what does fair review prep look like' standard"], "Make It Safe": ["* Establish a legal review checkpoint before AI-drafted feedback ships"] } },
  C: { useCases: { "Content Creation": ["* AI transforms one report into 5 distribution formats"], "Strategy & Ideation": ["* AI brainstorms vertical-specific campaign angles for fintech buyers"] },
       actions: { "Start at the End": ["* Define what 'creative partner not replacement' means concretely"], "Make It Safe": ["* Create Brand Voice Guardrails doc with examples + counter-examples"] } },
};

function blockify(items) {
  return Object.entries(items).map(([label, list]) => `\n${label}:\n${list.map(t => `  ${t}`).join("\n")}`).join("\n");
}
for (const [k, m] of Object.entries(MANAGERS_RICH)) {
  m._useCasesBlock = blockify(SAMPLE_INPUTS[k].useCases);
  m._actionsBlock = blockify(SAMPLE_INPUTS[k].actions);
}
for (const [k, m] of Object.entries(MANAGERS_THIN)) {
  m._useCasesBlock = blockify(SAMPLE_INPUTS[k].useCases);
  m._actionsBlock = blockify(SAMPLE_INPUTS[k].actions);
}

function synthesisPrompt(m) {
  return `You are an editorial synthesizer helping a manager walk out of a workshop with one cohesive plan rather than a checklist. You produce an opinionated one-page plan, not a redistribution of inputs.

CONTEXT, THIS SPECIFIC MANAGER:
- Role and team: ${m.role}
- What they want help with: ${m.helpWith}
- Key responsibilities: ${m.responsibilities}
- Manager AI fluency: ${m.managerFluency}
- Team AI fluency: ${m.teamFluency}
- Failure risks: ${m.failureRisks}
- 90-day vision: ${m.successVision}

ALL AI USE CASES (* = starred):
${m._useCasesBlock}

ALL CHANGE ACTIONS (* = starred):
${m._actionsBlock}

YOUR JOB:
Write a one-page plan: title, lede (60-100 words), 1-2 storylines (each with eyebrowName, headline, thesis, prose array, useCases array, actions array), thisWeek array of exactly 3 verb-led actions.

CRITICAL RULES: storylines 1-2 never 3; never invent metrics/stories; NO em dashes; NO "isn't X, it's Y" parallelism.

Respond ONLY with JSON: {"title":"","lede":"","storylines":[{"eyebrowName":"","headline":"","thesis":"","prose":["",""],"useCases":[""],"actions":[""]}],"thisWeek":["","",""]}`;
}

async function callClaude(prompt, maxTokens = 3000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("");
}

async function callJudgeTool(prompt, tool) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: JUDGE_MODEL, max_tokens: 2000, tools: [tool], tool_choice: { type: "tool", name: tool.name }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Judge ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const tb = data.content.find(b => b.type === "tool_use");
  if (!tb) throw new Error("No tool_use");
  return tb.input;
}

async function generateSynthesis(m) {
  const raw = await callClaude(synthesisPrompt(m), 3000);
  const m2 = raw.match(/\{[\s\S]*\}/);
  if (!m2) throw new Error("No JSON in synthesis");
  return JSON.parse(m2[0]);
}

const judgeTool = {
  name: "submit_judgment",
  description: "Submit identification + specificity scoring for the plan.",
  input_schema: {
    type: "object",
    required: ["guess", "specificity_score", "thinness_signals", "reasoning"],
    properties: {
      guess: { type: "string", enum: ["A", "B", "C"] },
      specificity_score: { type: "integer", minimum: 1, maximum: 5,
        description: "5=unmistakably this manager, 1=generic; could fit anyone in that function." },
      thinness_signals: { type: "array", items: { type: "string" },
        description: "Phrases that suggest the model was working with thin inputs (vague, formulaic, leaning on generic patterns)." },
      reasoning: { type: "string", description: "1-2 sentences" },
    },
  },
};

async function judgePlan(plan, managers, correctKey) {
  const profilesBlock = Object.entries(managers).map(([k, m]) => (
    `MANAGER ${k}: ${m.label}\n- Role: ${m.role}\n- Manager/team fluency: ${m.managerFluency} / ${m.teamFluency}\n- Failure risks: ${m.failureRisks}\n- 90-day vision: ${m.successVision}`
  )).join("\n\n");
  const planText = `Title: ${plan.title}\n\nLede: ${plan.lede}\n\nStorylines:\n${(plan.storylines||[]).map(s => `[${s.eyebrowName}] ${s.headline}\nThesis: ${s.thesis}\n${(s.prose||[]).join("\n")}`).join("\n\n")}\n\nThis Week:\n${(plan.thisWeek||[]).map(a => `- ${a}`).join("\n")}`;
  return await callJudgeTool(
    `Three managers:\n\n${profilesBlock}\n\nThe plan below was generated for ONE of them.\n\nPLAN:\n${planText}\n\nIdentify which manager (A/B/C). Score specificity 1-5 (5=clearly this manager, 1=could fit anyone). List any "thinness signals" (vague phrases or formulaic patterns suggesting the model padded over weak inputs).`,
    judgeTool
  );
}

(async () => {
  const outDir = join(__dirname, "output");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  console.log("========== THIN INTAKE TEST ==========");
  console.log("Comparing synthesis quality with RICH vs THIN intake on same 3 managers.\n");

  const results = { rich: {}, thin: {} };

  for (const k of Object.keys(MANAGERS_RICH)) {
    console.log(`Generating synthesis (RICH) for ${k}...`);
    results.rich[k] = { plan: await generateSynthesis(MANAGERS_RICH[k]) };
  }
  for (const k of Object.keys(MANAGERS_THIN)) {
    console.log(`Generating synthesis (THIN) for ${k}...`);
    results.thin[k] = { plan: await generateSynthesis(MANAGERS_THIN[k]) };
  }

  console.log("\nJudging plans...");
  for (const k of Object.keys(MANAGERS_RICH)) {
    results.rich[k].judgment = await judgePlan(results.rich[k].plan, MANAGERS_RICH, k);
    results.thin[k].judgment = await judgePlan(results.thin[k].plan, MANAGERS_THIN, k);
    console.log(`  ${k}: RICH spec=${results.rich[k].judgment.specificity_score}/5 (guess=${results.rich[k].judgment.guess})  THIN spec=${results.thin[k].judgment.specificity_score}/5 (guess=${results.thin[k].judgment.guess})`);
  }

  writeFileSync(join(outDir, "thin-intake-results.json"), JSON.stringify(results, null, 2));

  console.log("\n========== SUMMARY ==========\n");
  console.log("| Manager | RICH spec | RICH guess | THIN spec | THIN guess |");
  console.log("|---------|-----------|------------|-----------|------------|");
  let richSum = 0, thinSum = 0, richCorrect = 0, thinCorrect = 0;
  for (const k of Object.keys(MANAGERS_RICH)) {
    const r = results.rich[k].judgment;
    const t = results.thin[k].judgment;
    richSum += r.specificity_score; thinSum += t.specificity_score;
    if (r.guess === k) richCorrect++;
    if (t.guess === k) thinCorrect++;
    console.log(`| ${k} | ${r.specificity_score}/5 | ${r.guess === k ? "✓ "+r.guess : "✗ "+r.guess} | ${t.specificity_score}/5 | ${t.guess === k ? "✓ "+t.guess : "✗ "+t.guess} |`);
  }
  console.log(`\nAvg specificity: RICH=${(richSum/3).toFixed(2)}/5  THIN=${(thinSum/3).toFixed(2)}/5  delta=${((richSum-thinSum)/3).toFixed(2)}`);
  console.log(`Identification accuracy: RICH=${richCorrect}/3  THIN=${thinCorrect}/3`);
  console.log(`\nFull results written to evals/output/thin-intake-results.json`);
})();
