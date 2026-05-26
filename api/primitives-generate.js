export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { intake } = req.body;
  if (!intake) {
    return res.status(400).json({ error: "Missing intake data" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");

  const prompt = `You are helping a ${intake.role} brainstorm how to use AI. Their responsibilities: ${intake.responsibilities}. They want to: ${helpLabels}.

AI FLUENCY CONTEXT:
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
- Calibrate idea sophistication to these levels. For "Not yet started" or "Capable": suggest approachable, low-barrier ideas that someone could try this week with no special setup. For "Adoptive" or "Transformative": suggest advanced integration, workflow redesign, or multi-tool orchestration that goes beyond what they likely already do.
- The gap matters: a Transformative manager with a Not Yet Started team needs ideas the team can actually attempt, not ideas only the manager would understand.

Generate 2 specific AI use case ideas for EACH of these 6 categories:
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

IDEA FORMAT (strict):
- Each idea is a SINGLE ACTION SENTENCE, 15 to 20 words. Not a description, not a paragraph.
- Start with a verb. Example: "Draft blog posts from talking points and tone guidelines for faster publishing."
- Be specific to their role. Reference their actual responsibilities where possible.
- No explanation of benefits, no "reducing X" or "saving Y." The action speaks for itself.

STYLE RULES (strict):
- NO em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative thesis directly.
- No filler ("It's worth noting", "Importantly").`;

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
        max_tokens: 1024,
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
    const raw = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Could not parse AI response" });
    }

    const primitives = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ primitives });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Failed to generate ideas" });
  }
}
