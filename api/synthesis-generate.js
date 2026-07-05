import { RULE_NAMES, CATEGORY_NAMES } from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";

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
  if (rejectForeignOrigin(req, res)) return;

  const { intake, primitives, plan } = req.body;
  if (!intake || !primitives || !plan) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");
  const useCasesBlock = buildItemsBlock(primitives, CATEGORY_NAMES);
  const actionsBlock = buildItemsBlock(plan, RULE_NAMES);

  const prompt = `You are helping a manager leave a workshop with one clear move to make, not a report to file.

CONTEXT, THIS SPECIFIC MANAGER:
<manager_profile>
- Role and team: ${intake.role}
- What they want help with: ${helpLabels}
- Key responsibilities: ${intake.responsibilities}
- Manager AI fluency: ${intake.managerFluency}
- Team AI fluency: ${intake.teamFluency}
- Failure risks: ${intake.failureRisks}
- 90-day vision: ${intake.successVision}
</manager_profile>

ALL AI USE CASES (* marks starred items the manager prioritized):
<ai_use_cases>
${useCasesBlock}
</ai_use_cases>

ALL CHANGE ACTIONS (* marks starred items the manager prioritized):
<change_actions>
${actionsBlock}
</change_actions>

YOUR JOB:
Look across everything this manager starred. Find the ONE coherent move that ties the most important items together. Name it. List the actions that make it up.

1. bigMoveTitle: A short, punchy action phrase, 8 to 12 words MAX. Starts with a verb. Names one concrete outcome. No narrative framing, no "before X happens" clauses, no mentioning the role. Never add a deadline or timeframe unless the manager's own starred items or 90-day vision state one. Good: "Make AI-drafted QBRs the default across your customer success team." Good: "Move sprint planning and release notes to AI-generated first drafts." Bad: "A manager who already uses AI must now make it team-wide before inconsistent adoption becomes the ceiling." (too long, too narrative, mentions the role).
2. actions: Array of 4 to 6 concrete actions that comprise this big move. Mix AI use cases to try AND change actions to take, ordered by priority (most important first). Each action is one imperative sentence starting with a verb. Preserve original wording from the starred items where possible, but tighten to under 20 words each.

CRITICAL RULES:
- The big move is ONE focus, not a summary of everything. A thread is ONE workflow or deliverable family; if the title needs an "and" to cover your actions, that is two threads, so pick the one the manager's stars weight most and move the other to leftOut. Every starred item lands in exactly one place: in actions if it serves the title's single thread, in leftOut with a reason if it serves any other. Never both, never neither.
- The starred items (marked *) are the manager's chosen priorities. Build the move around them and draw the actions primarily from starred items, both use cases and change actions. Use an unstarred item only when the move genuinely needs it to hold together.
- Actions are ordered by priority. First action = most important thing to do tomorrow.
- Mix use cases and change actions freely. The manager doesn't care about the distinction; they care about what to do.
- When an action draws on a use case, write it as a person DOING its first probe ("Run next week's 360 debrief through the new brief format"), never as a restated workflow description ("Build a standing knowledge base that..."). Every action is a human move: no action may start with "Build", "Create", or "Set up"; assign the work to someone or run its first probe instead.
- No two actions may cover the same piece of work. If one action assigns something to a person, no other action restates that work as an instruction.
- Actions belong to the manager and their own team. Clients, customers, or the people the team serves may appear as the pilot's scope, never as the actor whose behavior an action manages.
- Never invent experiences, metrics, outcomes, or stories.
- NO EM DASHES anywhere. Use periods, commas, colons, semicolons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative directly.

QUALITY CHECKS:
- Is the bigMoveTitle specific to this manager? If it could belong to anyone, rewrite.
- Does every action serve the single thread the title names? If an action serves a different thread, move its source item to leftOut instead.
- Would the manager know exactly what to do tomorrow from action #1?
- Are there 4-6 actions, not more?

Use the submit_one_page_plan tool to return the big move.`;

  const planTool = {
    name: "submit_one_page_plan",
    description:
      "Submit the manager's big move. bigMoveTitle is one specific sentence; actions is 4-6 prioritized imperative sentences mixing use cases and change actions.",
    input_schema: {
      type: "object",
      required: ["bigMoveTitle", "actions", "leftOut"],
      properties: {
        bigMoveTitle: {
          type: "string",
          description:
            "8 to 12 word action phrase starting with a verb. One concrete outcome, no narrative.",
        },
        actions: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          items: { type: "string" },
          description:
            "4 to 6 prioritized actions (mix of use cases and change actions), each an imperative sentence under 20 words.",
        },
        leftOut: {
          type: "array",
          items: { type: "string" },
          description:
            "Each starred item you excluded from the move (short quote) plus the reason it serves a different thread than the title. Empty ONLY if every starred item genuinely serves the title's single thread.",
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

    // leftOut is the model's self-commitment to a single thread, not plan
    // content; log it for observability, keep it out of the response.
    const { leftOut, ...move } = toolBlock.input;
    if (Array.isArray(leftOut) && leftOut.length) {
      console.log("Big Move leftOut:", leftOut.join(" | "));
    }
    const synthesis = {
      ...move,
      generatedAt: new Date().toISOString(),
    };
    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("Synthesis generation error:", err);
    return res.status(500).json({ error: "Failed to generate synthesis" });
  }
}
