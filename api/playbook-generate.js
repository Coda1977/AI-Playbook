import { RULES } from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (rejectForeignOrigin(req, res)) return;

  const { intake, starredPrimitives } = req.body;
  if (!intake) {
    return res.status(400).json({ error: "Missing intake data" });
  }

  const helpLabels = (intake.helpWith || []).join(", ");

  const rulesBlock = RULES.map(
    (r) =>
      `Rule ${r.number} (id: "${r.id}"): ${r.name}\nPrinciple: "${r.principle}"\n${r.promptHint}`,
  ).join("\n\n");

  const starredBlock =
    starredPrimitives && starredPrimitives.length > 0
      ? `\n\nSTARRED AI USE CASES (the manager chose these as most important):\n<starred_use_cases>\n${starredPrimitives.map((p) => `- ${p.category}: ${p.text}`).join("\n")}\n</starred_use_cases>\n\nIMPORTANT: Reference these specific AI use cases in your actions where natural. For example, if they starred a content creation idea, Rule 3 (Script the Steps) actions should mention that specific use case as a concrete starting point. Make the playbook connect to the AI use cases they actually care about.`
      : "";

  const prompt = `You are a practical leadership coach helping a manager create a personalized AI change playbook. You generate specific, actionable steps grounded in behavioral science, not generic corporate advice.

KEY PRINCIPLES THAT GUIDE EVERYTHING YOU GENERATE:
- 80% of AI projects fail, and the root cause is almost never technology, it's unaddressed human resistance, missing psychological safety, and poor change management.
- People can't move toward what they can't picture, and won't move toward what they don't feel. A vivid destination combined with emotional resonance is what drives action.
- People won't try what they can't afford to fail at (Edmondson). Psychological safety is the prerequisite for learning. Two anxieties operate during change (Schein): survival anxiety (if I don't change, bad things happen) and learning anxiety (fear of incompetence, identity loss, group exclusion, loss of power). Change starts only when survival anxiety > learning anxiety, decrease learning anxiety rather than just increasing fear. Name what people are losing before selling what they'll gain.
- Behavior change requires specific instructions, not inspiration (Heath brothers). Defaults beat willpower (Thaler/Sunstein). Find bright spots and replicate them.
- Small wins build patterns that attract allies (Weick). Begin contained, expand with proof, not all at once.
- Progress that isn't visible doesn't build momentum, convert skeptics, or sustain energy. Most change efforts under-communicate by 10x (Kotter).

CONTEXT, THIS SPECIFIC PERSON:
<manager_profile>
- Role & team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency}
- Team's AI fluency: ${intake.teamFluency}
- What would make AI adoption fail: ${intake.failureRisks}
- 90-day success vision: ${intake.successVision}
</manager_profile>${starredBlock}

IMPORTANT CONTEXT SIGNALS TO PAY ATTENTION TO:
- The gap between manager fluency and team fluency is critical. A Transformative manager with a Not Yet Started team needs to slow down and build safety. A Capable manager with a Capable team needs momentum and scripted steps.
- If the manager is "Not yet started," their own AI learning is action #1 in Rule 1 (Start at the End), they must try it first before asking anyone else to.
- If the failure risks mention senior people resisting, prioritize Rule 2 (Make It Safe), especially acknowledging losses and creating space for honest conversation.
- If the failure risks mention previous failed attempts, prioritize Rule 4 (Start Small) and Rule 5 (Make Progress Visible), smaller scope, more communication.
- If the 90-day vision is ambitious (e.g., "AI embedded in every workflow"), the plan needs concrete phasing via Rule 3 (Script the Steps) and Rule 4 (Start Small). If it's modest (e.g., "a few experiments"), match that energy.
- All participants work in SaaS companies. Tailor examples and actions to SaaS contexts, product teams, customer success, engineering, marketing, sales, support.
- Remember: the team is asking themselves five unspoken questions: (1) From what to what, specifics? (2) What does this mean for my daily work? (3) Will this actually make a difference? (4) How will success be measured? (5) Does my manager really believe in this? Help the manager address these questions through their actions.

TASK:
Generate 2 actions per rule by default. Express priority through the count: give a THIRD action only to the one or two rules the context signals above single out for this manager (11 or 12 actions total, never more). Every action must be:
- Specific to THIS person's role, team, and situation, not interchangeable with someone else's plan
- Under 25 words each, concise and punchy, no filler
- Concrete enough to start this week (verbs like "schedule," "ask," "send," "create," "announce", never "consider," "think about," "explore the idea of")
- Sensitive to their fluency levels (don't suggest advanced moves for not-yet-started teams, don't suggest basics for transformative teams)
- Sensitive to their failure risks (if people fear job loss, don't generate actions that ignore that fear)
- Connected across rules where natural (e.g., a small experiment from Rule 4 might connect to making progress visible in Rule 5)

QUALITY CHECK BEFORE RETURNING, VERIFY EACH ACTION:
1. Could this action belong to anyone, or is it specific to this person? (If anyone's, rewrite it.)
2. Does it start with a concrete verb? (If not, rewrite it.)
3. Is it under 25 words? (If not, tighten it; cut every unnecessary word.)
4. Would this person know exactly what to do Monday morning? (If not, make it more specific.)
5. If the action involves sharing a personal story, does it leave the content to the manager? (Say "share your AI experiment with the team" NOT "explain how automating X saved Y hours." Never invent experiences, metrics, or outcomes for the manager.)
6. STYLE: No em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses. No "isn't X, it's Y" or "not just X, it's Y" parallelism, state the affirmative directly.

RULES:
${rulesBlock}

Use the submit_change_plan tool to return your actions for each rule.`;

  const ruleField = (r) => ({
    type: "array",
    minItems: 2,
    maxItems: 3,
    items: { type: "string" },
    description: `Rule ${r.number}: ${r.name}`,
  });

  const planTool = {
    name: "submit_change_plan",
    description:
      "Submit the personalized change strategy. Each field is an array of 2 action sentences (3 only for the one or two prioritized rules), each under 25 words, each starting with a concrete verb.",
    input_schema: {
      type: "object",
      required: RULES.map((r) => r.id),
      properties: Object.fromEntries(RULES.map((r) => [r.id, ruleField(r)])),
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
    return res.status(200).json({ plan: toolBlock.input });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Failed to generate plan" });
  }
}
