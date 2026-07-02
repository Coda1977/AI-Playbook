// Substance tests for AI Playbook prompts.
//   Test 1: Synthesis swap test (specificity)
//   Test 2: Primitives idea quality vs baseline
//
// Run: node evals/substance-tests.mjs
// Requires ANTHROPIC_API_KEY in env (or via .env line below).

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
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY missing"); process.exit(1);
}

const MODEL = "claude-sonnet-4-6";
const JUDGE_MODEL = "claude-sonnet-4-6";

const MANAGERS = {
  A: {
    label: "Engineering Manager",
    role: "Engineering Manager at a 50-person SaaS startup, leads 7 engineers",
    helpWith: "Save time on repetitive tasks, Improve team productivity",
    responsibilities: "Lead a team of 7 engineers, sprint planning, 1:1s, OKRs, code review, hiring",
    managerFluency: "Capable",
    teamFluency: "Not yet started",
    failureRisks: "Senior engineers think AI produces bad code and will refuse to use it",
    successVision: "Every engineer using AI for at least one PR per week",
  },
  B: {
    label: "HR Business Partner",
    role: "HR Business Partner supporting a 300-person engineering org",
    helpWith: "Save time on repetitive tasks, Standardize quality",
    responsibilities: "Performance reviews, comp planning, ER cases, manager coaching, headcount planning",
    managerFluency: "Beginner",
    teamFluency: "Beginner",
    failureRisks: "Bias in AI-assisted decisions and legal exposure on perf reviews",
    successVision: "AI handles 70% of performance review prep work for the eng managers I support",
  },
  C: {
    label: "Marketing Director",
    role: "Marketing Director at a B2B fintech, 4 direct reports",
    helpWith: "Generate creative ideas faster, Better understand my customers",
    responsibilities: "Brand, demand gen, content calendar, paid acquisition, events, website",
    managerFluency: "Capable",
    teamFluency: "Beginner",
    failureRisks: "Brand voice drift if everyone uses AI differently",
    successVision: "AI is a creative partner for the team, not a replacement, by end of quarter",
  },
};

async function callClaude({ system, userMessage, maxTokens = 3000, tools, toolChoice }) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userMessage }],
  };
  if (system) body.system = system;
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  return await r.json();
}

async function callJudgeTool(prompt, tool) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 2000,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`Judge API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const tb = data.content.find(b => b.type === "tool_use");
  if (!tb) throw new Error("Judge did not return tool_use");
  return tb.input;
}

// ============================================================
// PRIMITIVES PROMPTS
// ============================================================

function fullPrimitivesPrompt(m) {
  return `You are helping a ${m.role} brainstorm how to use AI. Their responsibilities: ${m.responsibilities}. They want to: ${m.helpWith}.

Generate 2-3 specific, actionable AI use case ideas for EACH of these 6 categories:
1. Content Creation (text, presentations, reports)
2. Task Automation (repetitive processes, workflows)
3. Research & Synthesis (information retrieval, analysis)
4. Data & Insights (analysis, visualization)
5. Technical Work (spreadsheets, scripts, tools)
6. Strategy & Ideation (planning, brainstorming)

Respond in this exact JSON format:
{
  "content": ["idea 1", "idea 2"],
  "automation": ["idea 1", "idea 2"],
  "research": ["idea 1", "idea 2"],
  "data": ["idea 1", "idea 2"],
  "coding": ["idea 1", "idea 2"],
  "ideation": ["idea 1", "idea 2"]
}

Each idea should be specific to their role, under 40 words, and immediately actionable. No generic suggestions.

STYLE RULES (strict):
- NO em dashes anywhere.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism.
- No filler ("It's worth noting", "Importantly").`;
}

function baselinePrimitivesPrompt(m) {
  // Stripped-down baseline: same task, no scaffolding/role context dump beyond minimum.
  return `Suggest 2-3 AI use cases for this person in each of 6 categories.

Person: ${m.role}. They want help with: ${m.helpWith}.

Categories: content, automation, research, data, coding, ideation.

Respond as JSON: {"content":[...], "automation":[...], "research":[...], "data":[...], "coding":[...], "ideation":[...]}`;
}

async function generatePrimitives(m, kind) {
  const prompt = kind === "full" ? fullPrimitivesPrompt(m) : baselinePrimitivesPrompt(m);
  const data = await callClaude({ userMessage: prompt, maxTokens: 2048 });
  const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const m2 = raw.match(/\{[\s\S]*\}/);
  if (!m2) throw new Error("No JSON in primitives output");
  return JSON.parse(m2[0]);
}

// ============================================================
// SYNTHESIS PROMPT (using sample use cases & actions inline)
// ============================================================

function synthesisPrompt(m) {
  // Use a small, realistic set of items for the synthesis to chew on.
  // To keep the test fair across managers, we use the FULL primitives prompt
  // outputs as input — but for the swap test we provide a fixed minimal set.
  return `You are an editorial synthesizer helping a manager walk out of a workshop with one cohesive plan rather than a checklist. You produce an opinionated one-page plan, not a redistribution of inputs.

CONTEXT, THIS SPECIFIC MANAGER:
- Role and team: ${m.role}
- What they want help with: ${m.helpWith}
- Key responsibilities: ${m.responsibilities}
- Manager AI fluency: ${m.managerFluency}
- Team AI fluency: ${m.teamFluency}
- Failure risks: ${m.failureRisks}
- 90-day vision: ${m.successVision}

ALL AI USE CASES (* marks starred items the manager prioritized):
${m._useCasesBlock}

ALL CHANGE ACTIONS (* marks starred items the manager prioritized):
${m._actionsBlock}

YOUR JOB:
Write a one-page plan with this structure:
1. title: A single sentence that names the manager's central tension or wedge.
2. lede: 60 to 100 words framing the plan's central thesis.
3. storylines: ONE or TWO storylines, never three. Each has eyebrowName, headline, thesis, prose (array of 2 paragraphs), useCases (array of strings, preserve original wording), actions (array of strings, preserve original wording).
4. thisWeek: array of exactly 3 concrete starting actions, each starting with a verb in imperative mood.

CRITICAL RULES:
- Synthesize the thesis from the strongest signal.
- Stars are signal, not filter.
- Storylines: ONE or TWO, never three.
- Each storyline's thesis must be distinct from the lede and from any other storyline's thesis.
- Never invent experiences, metrics, outcomes, or stories.
- NO EM DASHES. NO "isn't X, it's Y" or "not just X, it's Y" parallelism.

Respond with ONLY a JSON object (no markdown fences):
{"title":"...","lede":"...","storylines":[{"eyebrowName":"...","headline":"...","thesis":"...","prose":["",""],"useCases":["..."],"actions":["..."]}],"thisWeek":["...","...","..."]}`;
}

// Realistic per-manager use cases & actions inputs. Designed to be different shapes per manager.
const SAMPLE_INPUTS = {
  A: {
    useCases: {
      "Content Creation": ["* AI drafts PR descriptions from commit diffs", "AI generates sprint retro summaries"],
      "Task Automation": ["* Auto-generate weekly status from Jira", "AI assembles code review checklists from PR diff"],
      "Research & Synthesis": ["Summarize incident postmortems into pattern reports"],
    },
    actions: {
      "Start at the End": ["* Spend 90 min using Copilot on a refactor before asking the team", "Write a one-sentence Definition of Done for AI-assisted PRs"],
      "Make It Safe": ["* 1:1s with the two senior engineers about what they might fear losing", "Share your own Copilot mistakes publicly in #engineering"],
      "Start Small": ["Pilot AI-assisted PRs on one repo before rolling out"],
    },
  },
  B: {
    useCases: {
      "Content Creation": ["* AI drafts performance review summaries from quarterly notes"],
      "Task Automation": ["* Auto-populate calibration meeting prep sheets from review data"],
      "Research & Synthesis": ["Summarize 1:1 patterns across managers I support"],
      "Data & Insights": ["AI flags bias signals in draft review language"],
    },
    actions: {
      "Start at the End": ["* Write a 'what does fair review prep look like' standard"],
      "Make It Safe": ["* Establish a legal review checkpoint before AI-drafted feedback ships"],
      "Script the Steps": ["Build a prompt library that managers I support can reuse"],
    },
  },
  C: {
    useCases: {
      "Content Creation": ["* AI transforms one report into 5 distribution formats", "Brand-voice-aware blog drafting via system prompt library"],
      "Strategy & Ideation": ["* AI brainstorms vertical-specific campaign angles for fintech buyers"],
      "Data & Insights": ["AI analyzes top-converting content patterns by vertical"],
    },
    actions: {
      "Start at the End": ["* Define what 'creative partner not replacement' means concretely"],
      "Make It Safe": ["* Create Brand Voice Guardrails doc with examples + counter-examples"],
      "Script the Steps": ["Build a shared prompt library with locked brand-voice prefix"],
    },
  },
};

function blockify(items) {
  return Object.entries(items).map(([label, list]) => `\n${label}:\n${list.map(t => `  ${t}`).join("\n")}`).join("\n");
}

for (const [k, m] of Object.entries(MANAGERS)) {
  m._useCasesBlock = blockify(SAMPLE_INPUTS[k].useCases);
  m._actionsBlock = blockify(SAMPLE_INPUTS[k].actions);
}

async function generateSynthesis(m) {
  const prompt = synthesisPrompt(m);
  const data = await callClaude({ userMessage: prompt, maxTokens: 3000 });
  const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const m2 = raw.match(/\{[\s\S]*\}/);
  if (!m2) throw new Error("No JSON in synthesis output");
  return JSON.parse(m2[0]);
}

// ============================================================
// TEST 1: SYNTHESIS SWAP TEST
// ============================================================

async function runSwapTest() {
  console.log("\n========== TEST 1: SYNTHESIS SWAP TEST ==========\n");
  const plans = {};
  for (const k of Object.keys(MANAGERS)) {
    console.log(`Generating synthesis for ${k} (${MANAGERS[k].label})...`);
    plans[k] = await generateSynthesis(MANAGERS[k]);
  }

  const profilesBlock = Object.entries(MANAGERS).map(([k, m]) => (
    `MANAGER ${k}:\n- Role: ${m.role}\n- Manager fluency: ${m.managerFluency}\n- Team fluency: ${m.teamFluency}\n- Failure risks: ${m.failureRisks}\n- 90-day vision: ${m.successVision}\n`
  )).join("\n");

  const identifications = {};
  for (const k of Object.keys(MANAGERS)) {
    const plan = plans[k];
    const planText = `Title: ${plan.title}\n\nLede: ${plan.lede}\n\nStorylines:\n${(plan.storylines||[]).map(s => `[${s.eyebrowName}] ${s.headline}\nThesis: ${s.thesis}\n${(s.prose||[]).join("\n")}`).join("\n\n")}\n\nThis Week:\n${(plan.thisWeek||[]).map(a => `- ${a}`).join("\n")}`;

    const judgePrompt = `You are a hiring panel reviewer. Below are three manager profiles (A, B, C) and ONE plan that was generated for one of them.

${profilesBlock}

THE PLAN:
${planText}

Task: Identify which manager (A, B, or C) this plan was generated for. Then rate the plan's "specificity" on a 1-5 scale:
- 5 = unmistakably written for this specific manager, would not fit either of the others
- 4 = clearly tied to this manager, but with light editing could fit one other
- 3 = leans toward this manager but contains a lot of generic content
- 2 = could plausibly fit any of these three managers with minor edits
- 1 = generic, could be used for anyone

Use the submit_judgment tool.`;

    const judgeTool = {
      name: "submit_judgment",
      description: "Submit identification + specificity scoring.",
      input_schema: {
        type: "object",
        required: ["guess", "confidence", "specificity_score", "specific_anchors", "generic_phrases", "reasoning"],
        properties: {
          guess: { type: "string", enum: ["A", "B", "C"] },
          confidence: { type: "integer", minimum: 1, maximum: 5 },
          specificity_score: { type: "integer", minimum: 1, maximum: 5 },
          specific_anchors: { type: "array", items: { type: "string" }, description: "Concrete details from the plan tying it to this manager" },
          generic_phrases: { type: "array", items: { type: "string" }, description: "Phrases from the plan that could apply to anyone" },
          reasoning: { type: "string" },
        },
      },
    };

    console.log(`Judging plan for ${k}...`);
    identifications[k] = await callJudgeTool(judgePrompt, judgeTool);
    console.log(`  guess=${identifications[k].guess} (correct=${k}), specificity=${identifications[k].specificity_score}/5`);
  }

  return { plans, identifications };
}

// ============================================================
// TEST 2: PRIMITIVES IDEA QUALITY (full vs baseline)
// ============================================================

async function runIdeaQualityTest() {
  console.log("\n========== TEST 2: IDEA QUALITY (FULL vs BASELINE) ==========\n");
  const results = {};
  for (const k of Object.keys(MANAGERS)) {
    console.log(`\n--- Manager ${k}: ${MANAGERS[k].label} ---`);
    console.log("Generating ideas WITH full prompt...");
    const full = await generatePrimitives(MANAGERS[k], "full");
    console.log("Generating ideas WITH baseline prompt...");
    const baseline = await generatePrimitives(MANAGERS[k], "baseline");

    const m = MANAGERS[k];
    const judgeOne = async (label, ideas) => {
      const flatIdeas = Object.entries(ideas).flatMap(([cat, arr]) => arr.map(i => `[${cat}] ${i}`));
      const judgePrompt = `You are scoring AI use case suggestions for a specific manager.

THE MANAGER:
- Role: ${m.role}
- Responsibilities: ${m.responsibilities}
- What they want help with: ${m.helpWith}
- Failure risks: ${m.failureRisks}
- 90-day vision: ${m.successVision}

IDEAS TO SCORE (${label}):
${flatIdeas.map((idea, i) => `${i+1}. ${idea}`).join("\n")}

For each idea, score 1-5 on three criteria:
- ACTIONABILITY: Could the manager do this in the next 7 days without confusion? (1=unclear/aspirational, 5=they know exactly what to click on Monday)
- SPECIFICITY: Does this reference details only this manager would have, or could it be copy-pasted to anyone in their function? (1=generic, 5=unmistakably for this person)
- IMPACT: Would doing this plausibly move them toward their stated 90-day vision? (1=irrelevant, 5=directly advances the vision)

Use the submit_scoring tool.`;
      const scoringTool = {
        name: "submit_scoring",
        description: "Submit per-idea scores + summary.",
        input_schema: {
          type: "object",
          required: ["scores", "summary"],
          properties: {
            scores: {
              type: "array",
              items: {
                type: "object",
                required: ["idea_idx", "actionability", "specificity", "impact", "note"],
                properties: {
                  idea_idx: { type: "integer" },
                  actionability: { type: "integer", minimum: 1, maximum: 5 },
                  specificity: { type: "integer", minimum: 1, maximum: 5 },
                  impact: { type: "integer", minimum: 1, maximum: 5 },
                  note: { type: "string" },
                },
              },
            },
            summary: {
              type: "object",
              required: ["avg_actionability", "avg_specificity", "avg_impact", "total_avg", "verdict"],
              properties: {
                avg_actionability: { type: "number" },
                avg_specificity: { type: "number" },
                avg_impact: { type: "number" },
                total_avg: { type: "number" },
                verdict: { type: "string" },
              },
            },
          },
        },
      };
      return await callJudgeTool(judgePrompt, scoringTool);
    };

    const computeSummary = (raw) => {
      const scores = raw.scores || [];
      const avg = (key) => scores.length ? scores.reduce((a, s) => a + (s[key] || 0), 0) / scores.length : 0;
      const a = avg("actionability"), s = avg("specificity"), i = avg("impact");
      return { avg_actionability: a, avg_specificity: s, avg_impact: i, total_avg: (a + s + i) / 3, n: scores.length };
    };

    console.log("Judging FULL prompt ideas...");
    const fullRaw = await judgeOne("full prompt", full);
    const fullSummary = computeSummary(fullRaw);
    console.log(`  FULL (${fullSummary.n} ideas): act=${fullSummary.avg_actionability.toFixed(2)} spec=${fullSummary.avg_specificity.toFixed(2)} imp=${fullSummary.avg_impact.toFixed(2)} avg=${fullSummary.total_avg.toFixed(2)}`);

    console.log("Judging BASELINE prompt ideas...");
    const baseRaw = await judgeOne("baseline prompt", baseline);
    const baseSummary = computeSummary(baseRaw);
    console.log(`  BASE (${baseSummary.n} ideas): act=${baseSummary.avg_actionability.toFixed(2)} spec=${baseSummary.avg_specificity.toFixed(2)} imp=${baseSummary.avg_impact.toFixed(2)} avg=${baseSummary.total_avg.toFixed(2)}`);

    results[k] = { full, baseline, fullRaw, baseRaw, fullSummary, baseSummary };
  }
  return results;
}

// ============================================================
// MAIN
// ============================================================

(async () => {
  const outDir = join(__dirname, "output");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const swap = await runSwapTest();
  const ideas = await runIdeaQualityTest();

  writeFileSync(join(outDir, "substance-results.json"), JSON.stringify({ swap, ideas, managers: MANAGERS }, null, 2));

  // Summary
  console.log("\n========== SUMMARY ==========\n");

  console.log("Test 1 (Synthesis swap test):");
  let correct = 0;
  let specSum = 0;
  for (const k of Object.keys(MANAGERS)) {
    const r = swap.identifications[k];
    const ok = r.guess === k;
    if (ok) correct++;
    specSum += r.specificity_score;
    console.log(`  ${k} (${MANAGERS[k].label}): judge guessed ${r.guess} ${ok ? "[OK]" : "[WRONG]"}, specificity ${r.specificity_score}/5`);
  }
  console.log(`  Identification: ${correct}/${Object.keys(MANAGERS).length} correct`);
  console.log(`  Avg specificity: ${(specSum / Object.keys(MANAGERS).length).toFixed(2)}/5`);

  console.log("\nTest 2 (Idea quality, full vs baseline):");
  for (const k of Object.keys(MANAGERS)) {
    const r = ideas[k];
    const fAvg = r.fullSummary.total_avg;
    const bAvg = r.baseSummary.total_avg;
    const delta = (fAvg - bAvg).toFixed(2);
    console.log(`  ${k} (${MANAGERS[k].label}):`);
    console.log(`     FULL: act=${r.fullSummary.avg_actionability.toFixed(2)} spec=${r.fullSummary.avg_specificity.toFixed(2)} imp=${r.fullSummary.avg_impact.toFixed(2)} | avg=${fAvg.toFixed(2)}`);
    console.log(`     BASE: act=${r.baseSummary.avg_actionability.toFixed(2)} spec=${r.baseSummary.avg_specificity.toFixed(2)} imp=${r.baseSummary.avg_impact.toFixed(2)} | avg=${bAvg.toFixed(2)}`);
    console.log(`     DELTA: ${delta > 0 ? "+" : ""}${delta}`);
  }

  const fullAvgs = Object.values(ideas).map(r => r.fullSummary.total_avg);
  const baseAvgs = Object.values(ideas).map(r => r.baseSummary.total_avg);
  const fullMean = fullAvgs.reduce((a, b) => a + b, 0) / fullAvgs.length;
  const baseMean = baseAvgs.reduce((a, b) => a + b, 0) / baseAvgs.length;
  console.log(`\n  OVERALL: full=${fullMean.toFixed(2)}/5 baseline=${baseMean.toFixed(2)}/5 delta=${(fullMean - baseMean).toFixed(2)}`);

  console.log(`\nFull results written to evals/output/substance-results.json`);
})();
