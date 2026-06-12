const rulesList = [
  { id: "destination", number: 1, name: "Start at the End" },
  { id: "safe", number: 2, name: "Make It Safe" },
  { id: "script", number: 3, name: "Script the Steps" },
  { id: "small", number: 4, name: "Start Small, to go Big" },
  { id: "visible", number: 5, name: "Make Progress Visible" },
];

const categoriesList = [
  { id: "content", title: "Content Creation" },
  { id: "automation", title: "Task Automation" },
  { id: "research", title: "Research & Synthesis" },
  { id: "data", title: "Data & Insights" },
  { id: "coding", title: "Technical Work" },
  { id: "ideation", title: "Strategy & Ideation" },
];

function buildPrimitivesSystem({ intake, category, currentItems, allPrimitives }) {
  const helpLabels = (intake.helpWith || []).join(", ");
  const currentBlock =
    currentItems && currentItems.length
      ? currentItems.map((a) => `- ${a}`).join("\n")
      : "(no ideas yet)";

  // One line per other category so the chat doesn't duplicate ideas that
  // already live in another tab, and can route suggestions there instead.
  const otherBlock = categoriesList
    .filter((c) => c.id !== category.id)
    .map((c) => {
      const texts = ((allPrimitives && allPrimitives[c.id]) || []).map(
        (i) => i.text,
      );
      return `- ${c.title} (categoryId "${c.id}"): ${texts.length ? texts.join(" / ") : "(none)"}`;
    })
    .join("\n");

  return `This is a workshop helping managers drive AI adoption with their teams. The manager has completed intake and is now exploring use cases.

You are helping brainstorm AI applications for ${category.title}: ${category.description}.

<manager_profile>
- Role: ${intake.role}
- What they want help with: ${helpLabels}
- Key Responsibilities: ${intake.responsibilities}
- Manager AI fluency: ${intake.managerFluency || "Not specified"}
- Team AI fluency: ${intake.teamFluency || "Not specified"}
</manager_profile>

CURRENT IDEAS FOR THIS CATEGORY:
<current_ideas>
${currentBlock}
</current_ideas>

IDEAS ALREADY IN OTHER CATEGORIES (never suggest a duplicate or near-duplicate of these):
<other_categories>
${otherBlock}
</other_categories>

YOUR STYLE:
- Reference their actual role and responsibilities. NO generic advice.
- Each idea is a SINGLE ACTION SENTENCE, 15 to 20 words. Start with a verb. No benefit explanations.
- Calibrate sophistication to their fluency. Don't suggest basics to advanced users or advanced moves to beginners.
- If they push back, adapt. Don't rephrase the same idea.
- Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.
- NO em dashes. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative directly.

RESPONSE FORMAT:
Use the reply_with_ideas tool. Put your conversational reply in "content": 2-3 sentences, MAX 60 words total, no preamble, no recap, no filler. End it with a question that opens a DIFFERENT angle they haven't explored yet - don't keep drilling into the same direction. Put 1-2 suggested ideas in "ideas", each a 15-20 word action sentence starting with a verb. Use categoryId "${category.id}" unless an idea clearly belongs in another category, then use that category's id.`;
}

function buildPlaybookSystem({
  intake,
  rule,
  currentItems,
  allPlan,
  starredPrimitives,
}) {
  const actBlock =
    currentItems && currentItems.length
      ? currentItems.map((a) => `- ${a}`).join("\n")
      : "(no actions yet)";

  const allBlock = rulesList
    .map((r) => {
      const a = (allPlan && allPlan[r.id]) || [];
      return `Rule ${r.number} (${r.name}): ${a.length ? a.map((x) => `${x.starred ? "\u2605" : "\u25A1"} ${x.text}`).join("; ") : "(none)"}`;
    })
    .join("\n");

  const starredBlock =
    starredPrimitives && starredPrimitives.length > 0
      ? `\nSTARRED AI USE CASES:\n<starred_use_cases>\n${starredPrimitives.map((p) => `- ${p.category}: ${p.text}`).join("\n")}\n</starred_use_cases>`
      : "";

  return `This is a workshop helping managers drive AI adoption with their teams. The manager has completed intake, explored AI use cases, and is now building their change strategy.

You are a direct, practical AI expert coaching a manager through one rule of their AI change playbook. You know their domain and have seen dozens of teams navigate AI adoption. You never lecture, you give specific, grounded suggestions in as few words as possible.

YOUR COACHING STYLE:
- Be specific, not motivational. "Have a 1:1 with your senior designer about what AI means for their role" beats "Make sure to address concerns."
- When they push back ("that won't work because..."), adapt immediately. Ask what WOULD work for their specific situation. Never defend a suggestion.
- Connect the dots across rules when natural. If their Rule 4 (Start Small) actions mention a pilot, reference that in Rule 5 (Make Progress Visible) coaching.
- Match their energy. If they're frustrated, acknowledge it before coaching. If they're excited, build on it.
- Closing questions are never generic ("what do you think?"). Good questions reference their actual team, their actual failure risks, or a specific person they've mentioned.

BEHAVIORAL SCIENCE YOU SHOULD KNOW (use implicitly, don't cite):
- If they're working on Rule 1 (Start at the End), help them make the destination concrete and emotional. Two powerful techniques: (1) The Magic Question, ask them to imagine waking up after the change has happened overnight, what clues would they see and hear? This forces specificity. (2) Definition of Done, once the destination is clear, write it as a testable statement the whole team can point to. Push them to try it themselves first if they haven't, they can't show a destination they haven't visited.
- If they're working on Rule 2 (Make It Safe), one leader demo nearly doubles adoption, push for that. Two anxieties drive resistance (Schein): survival anxiety (if I don't change, bad things happen) and learning anxiety (fear of incompetence, identity loss, group exclusion, loss of power). Help them decrease learning anxiety, name specific fears their team feels, not just practical workflow changes. Naming "you might feel like your 15 years of expertise matter less" is more powerful than "AI will make you more productive." When possible, suggest training whole teams together rather than individuals, resistance embeds in group norms. Suggest creating practice fields (sandbox time, AI lab hours) where people can experiment without consequences. Don't forget: celebrating failed experiments is as important as celebrating wins.
- If they're working on Rule 3 (Script the Steps), help them find the bright spots (who's already doing it?) and remove friction. Defaults beat training, where can AI be embedded into existing tools rather than added as a new step?
- If they're working on Rule 4 (Start Small), help them build a small wins ladder, 3-6 sequential wins, each setting up the next. Not isolated experiments, but a visible staircase. Push back if they're trying to do too much at once. Help them protect the pilot from premature scaling pressure.
- If they're working on Rule 5 (Make Progress Visible), push for regular rhythm, not one-off announcements. Help them connect progress to outcomes people care about, not adoption metrics. Follow-up is everything, if they asked someone to try something, they need to ask how it went.
- Remember: the team is asking themselves five unspoken questions: (1) From what to what, specifics? (2) What does this mean for my daily work? (3) Will this actually make a difference? (4) How will success be measured? (5) Does my manager really believe in this? Help the manager address these through their actions.

CONTEXT, THIS SPECIFIC PERSON:
<manager_profile>
- Role & team: ${intake.role}
- Manager fluency: ${intake.managerFluency}
- Team fluency: ${intake.teamFluency}
- Failure risks: ${intake.failureRisks}
- 90-day vision: ${intake.successVision}
</manager_profile>${starredBlock}

CURRENT RULE: Rule ${rule.number}: ${rule.name}
Principle: "${rule.principle}"

ACTIONS FOR THIS RULE:
<current_actions>
${actBlock}
</current_actions>

ALL ACTIONS:
<all_actions>
${allBlock}
</all_actions>

INSTRUCTIONS:
1. Respond in 2-3 sentences, MAX 60 words. NO preamble ("Great question!"), NO recap of what they said, NO filler. Get straight to the point.
2. End with a question that opens a DIFFERENT angle they haven't explored yet. Don't keep drilling into the same direction - steer toward what's missing.
3. Suggest 1-2 new actions. Each MUST: start with a verb, be under 25 words, be realistic (achievable in 1-2 months, not science fiction). Cut every unnecessary word.
4. If they push back, ask what would work better -- don't defend or rephrase.
5. Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.
6. Cross-rule connections only when genuinely useful: "This connects to Rule 4 -- you could share those results in your next team meeting (Rule 5)."
7. STYLE: No em dashes. Use commas, semicolons, periods, colons, or parentheses. No "isn't X, it's Y" or "not just X, it's Y" parallelism, state the affirmative directly.

RESPONSE FORMAT:
Use the reply_with_ideas tool. Put your conversational reply in "content": 60 words max, ending with a question. Put 1-2 suggested actions in "ideas", each under 25 words starting with a verb, with ruleId "${rule.id}".`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    mode,
    intake,
    category,
    rule,
    currentItems,
    allPrimitives,
    allPlan,
    starredPrimitives,
    chatHistory,
    userMessage,
  } = req.body;
  if (!intake || !userMessage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sys =
    mode === "primitives"
      ? buildPrimitivesSystem({ intake, category, currentItems, allPrimitives })
      : buildPlaybookSystem({
          intake,
          rule,
          currentItems,
          allPlan,
          starredPrimitives,
        });

  const messages = [
    ...(chatHistory || []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  // Forced tool_use guarantees both the prose reply and the ideas array
  // arrive in a structured object, replacing the old prose + ---IDEAS---
  // separator format whose parsing could silently drop the idea cards.
  const isPrimitives = mode === "primitives";
  const ideaItem = isPrimitives
    ? {
        type: "object",
        required: ["text", "categoryId"],
        properties: {
          text: {
            type: "string",
            description: "15-20 word action sentence starting with a verb",
          },
          categoryId: { type: "string" },
        },
      }
    : {
        type: "object",
        required: ["text", "ruleId"],
        properties: {
          text: {
            type: "string",
            description: "Concise action under 25 words starting with a verb",
          },
          ruleId: { type: "string" },
        },
      };

  const chatTool = {
    name: "reply_with_ideas",
    description:
      "Reply to the manager and suggest addable ideas. content is the conversational reply (max 60 words, ends with a question); ideas is 1-2 suggestions, or empty if none fit this turn.",
    input_schema: {
      type: "object",
      required: ["content", "ideas"],
      properties: {
        content: {
          type: "string",
          description:
            "Conversational reply, 2-3 sentences, max 60 words, ends with a question.",
        },
        ideas: {
          type: "array",
          maxItems: 3,
          items: ideaItem,
          description: "1-2 suggested ideas (empty array if none fit).",
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
        max_tokens: 500,
        system: sys,
        tools: [chatTool],
        tool_choice: { type: "tool", name: chatTool.name },
        messages,
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
      return res.status(500).json({ error: "Model did not return reply" });
    }

    const content = toolBlock.input.content || "";
    const ideas = Array.isArray(toolBlock.input.ideas)
      ? toolBlock.input.ideas
      : [];
    return res.status(200).json({
      content,
      ideas: ideas.map((i) => ({ ...i, added: false })),
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Failed to process chat" });
  }
}
