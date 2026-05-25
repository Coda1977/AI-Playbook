const RULE_NAMES = {
  destination: "Start at the End",
  safe: "Make It Safe",
  script: "Script the Steps",
  small: "Start Small, to go Big",
  visible: "Make Progress Visible",
};

const CATEGORY_NAMES = {
  content: "Content Creation",
  automation: "Task Automation",
  research: "Research & Synthesis",
  data: "Data & Insights",
  coding: "Technical Work",
  ideation: "Strategy & Ideation",
};

function buildItemsBlock(items, nameMap) {
  const lines = [];
  for (const [key, list] of Object.entries(items || {})) {
    const label = nameMap[key] || key;
    lines.push(`\n${label}:`);
    for (const item of list || []) {
      const star = item.starred ? "* " : "  ";
      lines.push(`  ${star}${item.text}`);
    }
  }
  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { intake, primitives, plan } = req.body;
  if (!intake || !primitives || !plan) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");
  const useCasesBlock = buildItemsBlock(primitives, CATEGORY_NAMES);
  const actionsBlock = buildItemsBlock(plan, RULE_NAMES);

  const prompt = `You are an editorial synthesizer helping a manager walk out of a workshop with one tight takeaway rather than a report.

CONTEXT, THIS SPECIFIC MANAGER:
- Role and team: ${intake.role}
- What they want help with: ${helpLabels}
- Key responsibilities: ${intake.responsibilities}
- Manager AI fluency: ${intake.managerFluency}
- Team AI fluency: ${intake.teamFluency}
- Failure risks: ${intake.failureRisks}
- 90-day vision: ${intake.successVision}

ALL AI USE CASES (* marks starred items the manager prioritized):
${useCasesBlock}

ALL CHANGE ACTIONS (* marks starred items the manager prioritized):
${actionsBlock}

YOUR JOB:
Write a one-screen takeaway with this structure:
1. title: A single sentence that names the manager's central tension or insight.
2. narrative: ONE paragraph, 60 to 80 words. This is the entire story. Distill the insight that connects their starred use cases and change actions into one coherent thread. Not a summary of items, but the WHY behind them: why these choices make sense for this person in this role at this moment. This paragraph must be specific enough that it could not belong to anyone else.
3. thisWeek: array of exactly 3 concrete starting actions, each starting with a verb in imperative mood. These should be the sharpest, most actionable next steps drawn from their starred items.

CRITICAL RULES:
- The narrative is not a summary. It is the insight that makes the starred items cohere.
- Never re-list use cases or actions in the narrative. The manager already has those on the Review screen.
- Never invent experiences, metrics, outcomes, or stories for this manager.
- NO EM DASHES anywhere. Use periods, commas, colons, semicolons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative directly.
- 60 to 80 words for the narrative. Count them. If over 80, cut.

QUALITY CHECKS (verify before returning):
- Could this narrative belong to anyone, or is it specific to this manager? If anyone's, rewrite.
- Are all thisWeek actions concrete enough that the manager knows what to do Monday morning?
- Is the narrative under 80 words?

Use the submit_one_page_plan tool to return the takeaway.`;

  const planTool = {
    name: "submit_one_page_plan",
    description:
      "Submit the manager's one-screen takeaway. Title is one sentence; narrative is 60-80 words distilling the core insight; thisWeek is exactly 3 imperative starting actions.",
    input_schema: {
      type: "object",
      required: ["title", "narrative", "thisWeek"],
      properties: {
        title: {
          type: "string",
          description:
            "Single sentence that names the manager's central tension or insight.",
        },
        narrative: {
          type: "string",
          description:
            "60 to 80 words. One paragraph distilling the insight that connects their choices. Not a summary, the WHY.",
        },
        thisWeek: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string" },
          description:
            "Exactly 3 concrete starting actions, each starting with a verb in imperative mood.",
        },
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
        max_tokens: 4096,
        tools: [planTool],
        tool_choice: { type: "tool", name: planTool.name },
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
        .json({ error: "Model did not return structured plan" });
    }

    const synthesis = {
      ...toolBlock.input,
      generatedAt: new Date().toISOString(),
    };
    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("Synthesis generation error:", err);
    return res.status(500).json({ error: "Failed to generate synthesis" });
  }
}
