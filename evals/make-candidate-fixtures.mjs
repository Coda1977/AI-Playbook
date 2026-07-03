// Regenerate the diverge-stage candidate fixtures that
// primitives-generate.config.yaml feeds into the converge prompt.
// promptfoo can't chain the two pipeline calls, so the config tests converge
// against these frozen longlists; rerun this whenever prompts/primitives-diverge.txt
// changes so the fixtures stay representative of real diverge output.
//
// Run: node evals/make-candidate-fixtures.mjs   (direct Anthropic call, no dev server)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { flagsDownscope } from "../lib/workshop.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const FIXTURES = join(__dirname, "fixtures");

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(APP_ROOT, ".env"))) {
  const env = readFileSync(join(APP_ROOT, ".env"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const DIVERGE_PROMPT = readFileSync(join(__dirname, "prompts", "primitives-diverge.txt"), "utf8");

const CATEGORY_TITLES = {
  content: "Content Creation", automation: "Task Automation",
  research: "Research & Synthesis", data: "Data & Insights",
  coding: "Technical Work", ideation: "Strategy & Ideation",
};

const CANDIDATES_TOOL = {
  name: "propose_candidates",
  description: "Propose the longlist of candidate AI use cases: 25 to 30 candidates spanning all six categories, both altitudes, and all modalities.",
  input_schema: {
    type: "object",
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array", minItems: 20, maxItems: 35,
        items: {
          type: "object", required: ["text", "categoryId"],
          properties: {
            text: { type: "string", description: "One sentence starting with a verb, naming the work it touches, 10 to 20 words" },
            categoryId: { type: "string", enum: Object.keys(CATEGORY_TITLES) },
          },
        },
      },
    },
  },
};

// Mirrors the test personas in primitives-generate.config.yaml.
const PERSONAS = [
  {
    key: "eng-manager",
    vars: {
      role: "Engineering Manager at a 50-person SaaS startup",
      responsibilities: "Lead a team of 7 engineers, run sprint planning, do 1:1s, write quarterly OKRs, review code, hire and onboard.",
      helpWith: "Save time on repetitive tasks, Improve team productivity",
      managerFluency: "Capable",
      teamFluency: "Not yet started",
      successVision: "Every engineer uses AI for at least one PR per week, and sprint planning prep takes half the time",
    },
  },
  {
    key: "marketing-director",
    vars: {
      role: "Marketing Director at a B2B fintech, 4 direct reports",
      responsibilities: "Own brand, demand gen, content calendar, paid acquisition, event marketing, and the website.",
      helpWith: "Generate creative ideas faster, Better understand my customers",
      managerFluency: "Adoptive",
      teamFluency: "Capable",
      successVision: "Campaign concepts go from brief to first draft in a day instead of a week",
    },
  },
  {
    key: "cs-lead",
    vars: {
      role: "Head of Customer Success at a 200-person company, leads team of 12",
      responsibilities: "Customer health monitoring, escalations, QBRs, renewals forecasting, onboarding playbooks, CS team training.",
      helpWith: "Help my team learn AI tools, Standardize quality",
      managerFluency: "Capable",
      teamFluency: "Not yet started",
      successVision: "Every CSM uses AI to prep QBRs and we cut prep time in half",
    },
  },
];

const render = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

async function diverge(vars) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 2048,
      tools: [CANDIDATES_TOOL], tool_choice: { type: "tool", name: CANDIDATES_TOOL.name },
      messages: [{ role: "user", content: render(DIVERGE_PROMPT, vars) }],
    }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  return data.content.find((b) => b.type === "tool_use").input.candidates;
}

mkdirSync(FIXTURES, { recursive: true });
for (const p of PERSONAS) {
  const candidates = (await diverge(p.vars)).filter((c) => c && typeof c.text === "string" && c.text.trim());
  const block = candidates
    .map((c, i) => {
      const flag = flagsDownscope(c.text, p.vars.teamFluency) ? " (downscope: exceeds team fluency as written)" : "";
      return `${i + 1}. [${CATEGORY_TITLES[c.categoryId] || "Uncategorized"}] ${c.text.trim()}${flag}`;
    })
    .join("\n");
  const file = join(FIXTURES, `candidates-${p.key}.txt`);
  writeFileSync(file, block + "\n");
  console.log(`${p.key}: ${candidates.length} candidates -> ${file}`);
}
