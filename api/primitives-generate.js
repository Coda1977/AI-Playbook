export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { intake } = req.body;
  if (!intake) {
    return res.status(400).json({ error: "Missing intake data" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");

  const prompt = `You are helping a manager brainstorm how to use AI.

<manager_profile>
- Role and team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
</manager_profile>

AI FLUENCY CONTEXT:
- Calibrate idea sophistication to the fluency levels in the profile. For "Not yet started" or "Capable": suggest approachable, low-barrier ideas that someone could try this week with no special setup. For "Adoptive" or "Transformative": suggest advanced integration, workflow redesign, or multi-tool orchestration that goes beyond what they likely already do.
- The gap matters: a Transformative manager with a Not Yet Started team needs ideas the team can actually attempt, not ideas only the manager would understand.

Generate 2 specific AI use case ideas for EACH of these 6 categories:
1. Content Creation (text, presentations, reports)
2. Task Automation (repetitive processes, workflows)
3. Research & Synthesis (information retrieval, analysis)
4. Data & Insights (analysis, visualization)
5. Technical Work (spreadsheets, scripts, tools)
6. Strategy & Ideation (planning, brainstorming)

IDEA FORMAT (strict):
- Each idea is a SINGLE ACTION SENTENCE, 15 to 20 words. Not a description, not a paragraph.
- Start with a verb. Example: "Draft blog posts from talking points and tone guidelines for faster publishing."
- Be specific to their role. Reference their actual responsibilities where possible.
- No explanation of benefits, no "reducing X" or "saving Y." The action speaks for itself.

STYLE RULES (strict):
- NO em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative thesis directly.
- No filler ("It's worth noting", "Importantly").

Use the submit_use_cases tool to return your ideas for each category.`;

  const categoryField = (description) => ({
    type: "array",
    minItems: 2,
    maxItems: 2,
    items: { type: "string" },
    description,
  });

  const useCasesTool = {
    name: "submit_use_cases",
    description:
      "Submit the personalized AI use cases. Each field is an array of exactly 2 idea sentences, each 15 to 20 words, each starting with a verb.",
    input_schema: {
      type: "object",
      required: [
        "content",
        "automation",
        "research",
        "data",
        "coding",
        "ideation",
      ],
      properties: {
        content: categoryField("Content Creation (text, presentations, reports)"),
        automation: categoryField("Task Automation (repetitive processes, workflows)"),
        research: categoryField("Research & Synthesis (information retrieval, analysis)"),
        data: categoryField("Data & Insights (analysis, visualization)"),
        coding: categoryField("Technical Work (spreadsheets, scripts, tools)"),
        ideation: categoryField("Strategy & Ideation (planning, brainstorming)"),
      },
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
