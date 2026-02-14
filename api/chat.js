const rulesList = [
  { id: "destination", number: 1, name: "Start at the End" },
  { id: "safe", number: 2, name: "Make It Safe" },
  { id: "script", number: 3, name: "Script the Steps" },
  { id: "small", number: 4, name: "Start Small, to go Big" },
  { id: "visible", number: 5, name: "Make Progress Visible" },
];

function buildPrimitivesSystem({ intake, category, currentItems }) {
  const helpLabels = (intake.helpWith || []).join(", ");
  const currentBlock = currentItems && currentItems.length
    ? currentItems.map((a) => `- ${a}`).join("\n")
    : "(no ideas yet)";

  return `This is a workshop helping managers drive AI adoption with their teams. The manager has completed intake and is now exploring use cases.

You are helping brainstorm AI applications for ${category.title}: ${category.description}.

MANAGER PROFILE:
- Role: ${intake.role}
- What they want help with: ${helpLabels}
- Key Responsibilities: ${intake.responsibilities}

CURRENT IDEAS FOR THIS CATEGORY:
${currentBlock}

YOUR STYLE:
- Reference their actual role and responsibilities. NO generic advice.
- Each idea MUST be under 40 words. If it's over, cut it.
- If they push back, adapt. Don't rephrase the same idea.
- Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.

RESPONSE FORMAT:
First, write your response as plain text. HARD LIMIT: 2-3 sentences, MAX 60 words total. No preamble, no recap, no filler. End with a question that opens a DIFFERENT angle they haven't explored yet - don't keep drilling into the same direction.
Then write exactly this separator on its own line:
---IDEAS---
Then write a JSON array of suggested ideas (no markdown fences):
[{"text": "Specific actionable AI idea under 40 words", "categoryId": "${category.id}"}]

BREVITY IS MANDATORY. NEVER write more than 60 words before ---IDEAS---. Count them.`;
}

function buildPlaybookSystem({ intake, rule, currentItems, allPlan, starredPrimitives }) {
  const actBlock = currentItems && currentItems.length
    ? currentItems.map((a) => `- ${a}`).join("\n")
    : "(no actions yet)";

  const allBlock = rulesList
    .map((r) => {
      const a = (allPlan && allPlan[r.id]) || [];
      return `Rule ${r.number} (${r.name}): ${a.length ? a.map((x) => `${x.starred ? "\u2605" : "\u25A1"} ${x.text}`).join("; ") : "(none)"}`;
    })
    .join("\n");

  const starredBlock = starredPrimitives && starredPrimitives.length > 0
    ? `\nSTARRED AI USE CASES:\n${starredPrimitives.map((p) => `- ${p.category}: ${p.text}`).join("\n")}`
    : "";

  return `This is a workshop helping managers drive AI adoption with their teams. The manager has completed intake, explored AI use cases, and is now building their change strategy.

You are a direct, practical AI expert coaching a manager through one rule of their AI change playbook. You know their domain and have seen dozens of teams navigate AI adoption. You never lecture \u2014 you give specific, grounded suggestions in as few words as possible.

YOUR COACHING STYLE:
- Be specific, not motivational. "Have a 1:1 with your senior designer about what AI means for their role" beats "Make sure to address concerns."
- When they push back ("that won't work because..."), adapt immediately. Ask what WOULD work for their specific situation. Never defend a suggestion.
- Connect the dots across rules when natural. If their Rule 4 (Start Small) actions mention a pilot, reference that in Rule 5 (Make Progress Visible) coaching.
- Match their energy. If they're frustrated, acknowledge it before coaching. If they're excited, build on it.
- End every response with a probing question that pushes them deeper into their specific situation \u2014 never generic ("what do you think?"). Good questions reference their actual team, their actual failure risks, or a specific person they've mentioned.

BEHAVIORAL SCIENCE YOU SHOULD KNOW (use implicitly, don't cite):
- If they're working on Rule 1 (Start at the End), help them make the destination concrete and emotional. "By June, we'll do X in 10 minutes instead of 2 hours" beats "we're adopting AI." Push them to try it themselves first if they haven't \u2014 they can't show a destination they haven't visited.
- If they're working on Rule 2 (Make It Safe), one leader demo nearly doubles adoption \u2014 push for that. Help them name specific losses their team feels (expertise, status, autonomy), not just practical workflow changes. Naming "you might feel like your 15 years of expertise matter less" is more powerful than "AI will make you more productive." Don't forget: celebrating failed experiments is as important as celebrating wins.
- If they're working on Rule 3 (Script the Steps), help them find the bright spots (who's already doing it?) and remove friction. Defaults beat training \u2014 where can AI be embedded into existing tools rather than added as a new step?
- If they're working on Rule 4 (Start Small), each win should set up the next, slightly bigger experiment. Push back if they're trying to do too much at once. Help them protect the pilot from premature scaling pressure.
- If they're working on Rule 5 (Make Progress Visible), push for regular rhythm, not one-off announcements. Help them connect progress to outcomes people care about, not adoption metrics. Follow-up is everything \u2014 if they asked someone to try something, they need to ask how it went.

CONTEXT \u2014 THIS SPECIFIC PERSON:
- Role & team: ${intake.role}
- Manager fluency: ${intake.managerFluency}
- Team fluency: ${intake.teamFluency}
- Failure risks: ${intake.failureRisks}
- 90-day vision: ${intake.successVision}${starredBlock}

CURRENT RULE: Rule ${rule.number}: ${rule.name}
Principle: "${rule.principle}"

ACTIONS FOR THIS RULE:
${actBlock}

ALL ACTIONS:
${allBlock}

INSTRUCTIONS:
1. Respond in 2-3 sentences, MAX 60 words. NO preamble ("Great question!"), NO recap of what they said, NO filler. Get straight to the point.
2. End with a question that opens a DIFFERENT angle they haven't explored yet. Don't keep drilling into the same direction - steer toward what's missing.
3. Suggest 1-3 new actions. Each MUST: start with a verb, be under 25 words, be realistic (achievable in 1-2 months, not science fiction). Cut every unnecessary word.
4. If they push back, ask what would work better -- don't defend or rephrase.
5. Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.
6. Cross-rule connections only when genuinely useful: "This connects to Rule 4 -- you could share those results in your next team meeting (Rule 5)."

RESPONSE FORMAT:
First, write your conversational response as plain text. HARD LIMIT: 60 words max. End with a question.
Then write exactly this separator on its own line:
---IDEAS---
Then write a JSON array of suggested actions (no markdown fences):
[{"text": "Concise action under 25 words", "ruleId": "${rule.id}"}]

BREVITY IS MANDATORY. NEVER exceed 60 words before ---IDEAS---. Count them.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, intake, category, rule, currentItems, allPrimitives, allPlan, starredPrimitives, chatHistory, userMessage } = req.body;
  if (!intake || !userMessage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sys = mode === "primitives"
    ? buildPrimitivesSystem({ intake, category, currentItems, allPrimitives })
    : buildPlaybookSystem({ intake, rule, currentItems, allPlan, starredPrimitives });

  const messages = [
    ...(chatHistory || []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 250,
        system: sys,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", response.status, errText);
      return res.status(502).json({ error: `Claude API returned ${response.status}` });
    }

    const data = await response.json();
    const full = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const sep = full.indexOf("---IDEAS---");
    let content = full;
    let ideas = [];
    if (sep !== -1) {
      content = full.slice(0, sep).trim();
      try {
        ideas = JSON.parse(full.slice(sep + 11).replace(/```json|```/g, "").trim());
      } catch {}
    }

    return res.status(200).json({
      content,
      ideas: ideas.map((i) => ({ ...i, added: false })),
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Failed to process chat" });
  }
}
