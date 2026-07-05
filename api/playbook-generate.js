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
      ? `\n\nTHEIR STARRED AI USE CASES (optional context, from the imagination phase):\n<starred_use_cases>\n${starredPrimitives.map((p) => `- ${p.category}: ${p.text}`).join("\n")}\n</starred_use_cases>\n\nThese tell you what kinds of new work this team is drawn to; nothing more. You MAY name one in a few words when it makes an action sharper ("the QBR-prep experiment"). Never restate what a use case does, never write actions about producing or delivering them, and never build the plan around them. Which ideas to pursue, and how, is the manager's own call; this plan is about how they lead their people to a new way of working.`
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
- If the failure risks mention senior people resisting, prioritize Rule 2 (Make It Safe), especially naming what those people personally stand to lose (expertise, identity, standing), not just their stated objection, and creating space for honest conversation.
- If the failure risks mention previous failed attempts, prioritize Rule 4 (Start Small) and Rule 5 (Make Progress Visible), smaller scope, more communication, and name the failed attempt openly in one action; the team remembers it whether or not the plan does.
- If the failure risks name a different loss than fear of failure (judgment atrophy from over-reliance, brand voice, privacy), Rule 2 (Make It Safe) must protect against THAT loss; do not default to the standard fear-of-failure moves.
- If the 90-day vision is ambitious (e.g., "AI embedded in every workflow"), the plan needs concrete phasing via Rule 3 (Script the Steps) and Rule 4 (Start Small). If it's modest (e.g., "a few experiments"), match that energy.
- All participants work in SaaS companies. Tailor examples and actions to SaaS contexts, product teams, customer success, engineering, marketing, sales, support.
- Remember: the team is asking themselves five unspoken questions: (1) From what to what, specifics? (2) What does this mean for my daily work? (3) Will this actually make a difference? (4) How will success be measured? (5) Does my manager really believe in this? Help the manager address these questions through their actions.

MOVE PALETTE (a value preference, never a quota):
- Five moves: a conversation (1:1, team discussion), a structural default (template, checklist, changed ownership, a step embedded in an existing workflow), a practice field (sandbox, rehearsal, pilot), social proof (a bright spot shared, a demo), or measurement and follow-up (a metric, a rhythm of asking).
- Pick the move with the highest probability of changing behavior per unit of manager effort. When a default or template can carry the intent, prefer it over an announcement. Reserve meetings for what only conversation can do: naming fears, hearing people.
- Operationalize the rule's lever, never generic hygiene: Rule 1 makes the destination concrete and felt, Rule 2 names specific losses, Rule 3 changes a default or replicates a bright spot, Rule 4 builds the small-win ladder, Rule 5 builds a visibility rhythm.
- Fit-check stock moves: never assume an experimenting peer, a willing volunteer, or a venue the intake does not mention; a team that has not started has no bright spot to find yet. Use what is actually there.

CREATIVE LATITUDE, FUELED BY THE INTAKE:
- This plan is about leading THIS team to a new way of working. Ideate freely through each rule's lens; the raw material is the intake itself. Rule 1 speaks in the vision's own finish lines; Rule 2 names the fear the intake actually describes; Rules 3-5 take their scope from the rituals and deliverables in the responsibilities. The intake is your palette, the rules are your brushes.
- Two managers with different intakes must get visibly different plans. If an action would fit any manager with the same job title, sharpen it with a detail from this intake or replace it. Standard moves (a leader demo, a 1:1, a pilot) earn their place only when fitted to this team's specific fear, ritual, or moment.
- One vivid intake detail per action is enough; richness never excuses length. The 25-word discipline holds.

TASK:
First, decide which ONE or TWO rules the context signals above single out for this manager, and commit to them in the prioritizedRules field. Then generate EXACTLY 2 actions for every rule, except the prioritized rule(s) which get EXACTLY 3. That is 11 or 12 actions total, never more. Every action must be:
- Specific to THIS person's role, team, and situation, not interchangeable with someone else's plan
- Under 25 words each (hard limit). Quoted scripts count toward the limit and stay under ten words themselves; shorten the script rather than exceed it. Concise and punchy, no filler
- Concrete enough to start this week (verbs like "schedule," "ask," "send," "create," "announce", never "consider," "think about," "explore the idea of")
- Sensitive to their fluency levels (don't suggest advanced moves for not-yet-started teams, don't suggest basics for transformative teams)
- Sensitive to their failure risks (if people fear job loss, don't generate actions that ignore that fear)
- Connected across rules where natural (e.g., a small experiment from Rule 4 might connect to making progress visible in Rule 5)
- A change move about people, never workflow implementation: every action's subject is the manager or their team (their direct reports and day-to-day colleagues, never the clients, customers, or people the team serves), and any AI workflow is at most its object. If an action's real content is configuring, building, or operating an AI workflow, replace it with the human move around it: changing a default ("make the preloaded template the required starting point for launch briefs") is a change move; constructing the tooling ("build a prompt template") is not. Frame it as the default changing, never as the artifact being built. A client may appear inside a pilot's scope ("pilot it with one account"), never as the person whose feelings, first steps, or adoption the action manages.

QUALITY CHECK BEFORE RETURNING, VERIFY EACH ACTION:
1. Could this action belong to anyone, or is it specific to this person? (If anyone's, rewrite it.)
2. Does it start with a concrete verb? (If not, rewrite it.)
3. Is it under 25 words? (If not, tighten it; cut every unnecessary word.)
4. Would this person know exactly what to do Monday morning? (If not, make it more specific.)
5. If the action involves sharing a personal story, does it leave the content to the manager? (Say "share your AI experiment with the team" NOT "explain how automating X saved Y hours." Never invent experiences, metrics, or outcomes for the manager.)
6. STYLE: No em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses. No "isn't X, it's Y" or "not just X, it's Y" parallelism, state the affirmative directly.
7. COUNT: exactly 2 actions per rule, exactly 3 for the rule(s) in prioritizedRules. If any other rule ended up with 3, delete its weakest action.
8. SUBJECT: is the action about people adopting the change? If its real content is configuring, building, or operating an AI workflow, replace it with the human move around it.
9. TEMPLATE CHECK: would this exact plan fit a different manager with the same title? If yes, it is not done; work the intake's specifics (the named fear, the actual ritual, the vision's finish line) deeper into the actions.

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
      "Submit the personalized change strategy. prioritizedRules names the 1-2 rules that get a third action; every other rule gets exactly 2 actions (11-12 total). Each action is under 25 words and starts with a concrete verb.",
    input_schema: {
      type: "object",
      required: ["prioritizedRules", ...RULES.map((r) => r.id)],
      properties: {
        // Declared first so the model commits to its priorities before
        // writing actions; without this commitment it hands 3 actions to
        // most rules and overshoots the 11-12 total.
        prioritizedRules: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: { type: "string", enum: RULES.map((r) => r.id) },
          description:
            "The one or two rule ids the context signals prioritize for this manager. Only these rules get a third action.",
        },
        ...Object.fromEntries(RULES.map((r) => [r.id, ruleField(r)])),
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
    // prioritizedRules is the model's self-commitment, not plan content;
    // leaking it into the response would become a bogus sixth rule in state.
    // The model also reliably overshoots prose count limits (it hands 3
    // actions to more rules than it committed to), and the tool schema can't
    // express "3 only for the rules named in prioritizedRules". Enforce the
    // lighter-output contract deterministically: 2 actions per rule, 3 for
    // the 1-2 prioritized rules, 10-12 total.
    const { prioritizedRules, ...plan } = toolBlock.input;
    const prioritized = Array.isArray(prioritizedRules)
      ? prioritizedRules.slice(0, 2)
      : [];
    for (const r of RULES) {
      const actions = Array.isArray(plan[r.id]) ? plan[r.id] : [];
      plan[r.id] = actions.slice(0, prioritized.includes(r.id) ? 3 : 2);
    }
    return res.status(200).json({ plan });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Failed to generate plan" });
  }
}
