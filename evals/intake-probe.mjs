// Probe step: take thin intake answers, simulate what a manager would say if
// asked one targeted follow-up per field. Outputs expanded intake JSON for use
// in the intake-probe promptfoo config.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(APP_ROOT, ".env"))) {
  const env = readFileSync(join(APP_ROOT, ".env"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
}

const MODEL = "claude-sonnet-4-6";

// THIN profiles to expand (same as in thin-intake-ab.config.yaml).
const THIN = {
  A: { label: "Engineering Manager",
       role: "Engineering Manager",
       helpWith: "Save time",
       responsibilities: "Manage engineers",
       managerFluency: "Capable", teamFluency: "Beginner",
       failureRisks: "People won't use it",
       successVision: "Team uses AI" },
  B: { label: "HR Business Partner",
       role: "HR Business Partner",
       helpWith: "Standardize quality",
       responsibilities: "HR stuff",
       managerFluency: "Beginner", teamFluency: "Beginner",
       failureRisks: "Bias",
       successVision: "AI helps with reviews" },
  C: { label: "Marketing Director",
       role: "Marketing Director",
       helpWith: "More ideas",
       responsibilities: "Marketing",
       managerFluency: "Capable", teamFluency: "Beginner",
       failureRisks: "Brand drift",
       successVision: "Better content" },
};

const probeTool = {
  name: "submit_expanded_intake",
  description: "Submit expanded intake fields, simulating what a manager would say if asked one targeted follow-up per field.",
  input_schema: {
    type: "object",
    required: ["role", "helpWith", "responsibilities", "failureRisks", "successVision"],
    properties: {
      role: { type: "string", description: "Expanded role description with team size, company context, level of seniority" },
      helpWith: { type: "string", description: "Expanded with the specific tasks they want help with" },
      responsibilities: { type: "string", description: "5-7 specific responsibilities, comma-separated" },
      failureRisks: { type: "string", description: "Expanded with WHY they fear this and what specifically would go wrong" },
      successVision: { type: "string", description: "Expanded with the concrete behaviors/artifacts they want to see by 90 days" },
    },
  },
};

async function probeManager(k, thin) {
  const prompt = `You are a workshop intake assistant. A manager has given thin one-line answers. For each field, the manager has been asked one targeted follow-up question to elaborate.

Simulate a thoughtful response a TYPICAL manager in this role would give — specific and concrete, but not over-engineered. Stay realistic. Don't invent facts that wouldn't be true of most people in this role.

THIN ANSWERS FROM ${thin.label}:
- Role: "${thin.role}"
- Help with: "${thin.helpWith}"
- Responsibilities: "${thin.responsibilities}"
- Manager fluency: "${thin.managerFluency}", Team fluency: "${thin.teamFluency}"
- Failure risks: "${thin.failureRisks}"
- 90-day vision: "${thin.successVision}"

For each field, expand to what a real manager would say if asked:
- Role: follow-up "Tell me about your team and company size." Expand to include team size, company stage, level.
- Help with: follow-up "Which tasks specifically eat the most time?" Expand to 2-3 concrete task examples.
- Responsibilities: follow-up "Walk me through a typical week." Expand to 5-7 specific responsibilities.
- Failure risks: follow-up "What specifically worries you about this? Have you seen it happen before?" Expand to a concrete failure scenario.
- 90-day vision: follow-up "What would I see if I walked into your team's meeting in 90 days?" Expand to concrete observable behaviors.

Use the submit_expanded_intake tool.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      tools: [probeTool],
      tool_choice: { type: "tool", name: probeTool.name },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`Probe API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const tb = data.content.find(b => b.type === "tool_use");
  if (!tb) throw new Error("Probe did not return tool_use");
  return { ...thin, ...tb.input };  // merge expanded fields back over thin defaults
}

(async () => {
  const probed = {};
  for (const [k, thin] of Object.entries(THIN)) {
    console.log(`Probing ${k} (${thin.label})...`);
    probed[k] = await probeManager(k, thin);
    console.log(`  → role: ${probed[k].role.slice(0, 80)}`);
    console.log(`  → vision: ${probed[k].successVision.slice(0, 80)}`);
  }
  writeFileSync(join(__dirname, "probed-intakes.json"), JSON.stringify(probed, null, 2));
  console.log(`\nSaved to evals/probed-intakes.json`);
})();
