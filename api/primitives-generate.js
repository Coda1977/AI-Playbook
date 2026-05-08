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
        max_tokens: 2048,
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
