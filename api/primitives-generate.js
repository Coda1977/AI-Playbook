import { CATEGORIES } from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (rejectForeignOrigin(req, res)) return;

  const { intake } = req.body;
  if (!intake) {
    return res.status(400).json({ error: "Missing intake data" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");

  const categoriesBlock = CATEGORIES.map(
    (c) => `${c.number}. ${c.title} (${c.description})`,
  ).join("\n");

  const prompt = `You are helping a manager brainstorm how to use AI.

<manager_profile>
- Role and team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
- 90-day success vision: ${intake.successVision || "Not specified"}
</manager_profile>

AI FLUENCY CONTEXT:
- Calibrate idea sophistication to the fluency levels in the profile. For "Not yet started" or "Capable": suggest approachable, low-barrier ideas that someone could try this week with no special setup. For "Adoptive" or "Transformative": suggest advanced integration, workflow redesign, or multi-tool orchestration that goes beyond what they likely already do.
- The gap matters: a Transformative manager with a Not Yet Started team needs ideas the team can actually attempt, not ideas only the manager would understand.

Generate AI use case ideas across these 6 categories:
${categoriesBlock}

WHAT COUNTS AS A USE CASE (strict):
- Every idea applies AI to work the team already does: the deliverables, analyses, decisions, and communications in the manager's responsibilities.
- NEVER suggest ideas about the AI adoption effort itself: no AI adoption plans, no AI training sessions or exercises, no rollout strategies, no prompt libraries, no "teach the team to use AI" ideas. Driving adoption is a later phase of this workshop; here the manager only collects what AI could do for the work itself.
- The 90-day vision tells you WHICH work matters most, not what to plan. If the vision says "every CSM uses AI to prep QBRs," the use case is AI-assisted QBR prep, never a plan for getting CSMs to use AI.

HOW MANY IDEAS PER CATEGORY:
- Generate 12 ideas total across the 6 categories. Every category gets at least 1.
- Weight the count by fit: give 3 ideas to the one or two categories that best match their role, responsibilities, what they want help with, and their 90-day vision. Give 1 idea to a category that is a stretch for this role. Give 2 everywhere else.
- One sharp idea in a stretch category beats two filler ideas. Never pad a category to hit a number.
- If their 90-day vision names a concrete workflow or outcome, make sure at least one idea directly serves that work.

IDEA FORMAT (strict):
- Each idea is a SINGLE ACTION SENTENCE, 15 to 20 words. Not a description, not a paragraph.
- Start with a verb. Be specific to their role; reference their actual responsibilities where possible.
- No explanation of benefits, no "reducing X" or "saving Y." The action speaks for itself.

WHAT MAKES AN IDEA EXCELLENT (this is the bar):
- It names the input and the output, so the manager knows exactly what goes in and what comes back. "Turn last week's support tickets into a themed risk brief per account" is excellent; "use AI to analyze customer data" is filler.
- It is tryable at the TEAM'S current fluency. "Not yet started" teams: only ideas that work by pasting text into a chat tool. "Capable" teams: anything a person can set up themselves, reusable prompt templates, an AI assistant or project preloaded with the team's reference documents, meeting transcription, AI features inside tools they already use; still no custom engineering. "Adoptive"/"Transformative" teams: multi-step and automated workflows are fair game.
- SPAN THE MODALITIES. Pasting a prompt into a chatbot is ONE way to use AI. Across the 12 ideas, use at least four distinct modalities where fluency allows: (a) one-shot transformation of an existing artifact, (b) a persistent assistant or project preloaded with the team's frameworks and past work, (c) AI as thinking partner that critiques, red-teams, or pressure-tests a draft or design, (d) role-play and simulation for practicing conversations or facilitation, (e) transcription plus synthesis of live meetings or interviews, (f) AI features inside tools the team already uses, (g) for Adoptive+ teams, automated multi-step workflows that act, not just draft.
- Do not template the phrasing: no more than two ideas may start with the same verb, and "paste" may appear in at most two ideas total.
- At least 2 of the 12 ideas should make a seasoned manager think "I had not considered that": an overlooked corner of their actual workload paired with something AI does well. Non-obvious never means exotic.
- Acid test for every idea: is there an obvious first experiment the manager could run this week?
- Hard constraints in the failure risks are generation constraints. If veterans reject AI-written customer emails, no idea sends AI-written customer emails (drafting scaffolds the human rewrites is fine, and say so). If employee data must stay in approved tools, no idea feeds individual employee data to AI.

STYLE RULES (strict):
- NO em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative thesis directly.
- No filler ("It's worth noting", "Importantly").

Use the submit_use_cases tool to return your ideas for each category.`;

  const properties = {};
  for (const c of CATEGORIES) {
    properties[c.id] = {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
      description: `${c.title} (${c.description})`,
    };
  }

  const useCasesTool = {
    name: "submit_use_cases",
    description:
      "Submit the personalized AI use cases. Each field is an array of 1 to 3 idea sentences (12 ideas total across all fields), each 15 to 20 words, each starting with a verb.",
    input_schema: {
      type: "object",
      required: CATEGORIES.map((c) => c.id),
      properties,
    },
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        tools: [useCasesTool],
        tool_choice: { type: "tool", name: useCasesTool.name },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", response.status, errText);
      return res
        .status(502)
        .json({ error: `Claude API returned ${response.status}` });
    }

    const data = await response.json();
    const toolBlock = data.content?.find((b) => b.type === "tool_use");
    if (!toolBlock?.input) {
      console.error(
        "Expected tool_use block missing. stop_reason:",
        data.stop_reason,
        "| content types:",
        data.content?.map((b) => b.type).join(",") || "none",
        "| raw response:",
        JSON.stringify(data).slice(0, 1000),
      );
      return res
        .status(500)
        .json({ error: "Model did not return structured ideas" });
    }
    return res.status(200).json({ primitives: toolBlock.input });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Failed to generate ideas" });
  }
}
