import { RULES, CATEGORIES } from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";

// "Go bigger" is a spoken move in the workshop room: any request containing
// big/bold flips this turn's suggestions to transformative reshapes. Detected
// server-side because asking the model to notice is unreliable.
const BIG_ASK = /\b(big|bigger|biggest|bold|bolder|boldest|huge)\b/i;

function buildPrimitivesSystem({
  intake,
  category,
  currentItems,
  allPrimitives,
  wantsBig,
}) {
  const helpLabels = (intake.helpWith || []).join(", ");
  const currentBlock =
    currentItems && currentItems.length
      ? currentItems.map((a) => `- ${a}`).join("\n")
      : "(no ideas yet)";

  // One line per other category so the chat doesn't duplicate ideas that
  // already live in another tab, and can route suggestions there instead.
  const otherBlock = CATEGORIES.filter((c) => c.id !== category.id)
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
- Pasting prompts into a chatbot is only ONE way to use AI. Where their fluency allows, also reach for: persistent assistants preloaded with their frameworks, AI critiquing or red-teaming a design, role-play practice for hard conversations, meeting transcription plus synthesis, AI inside tools they already use, and (for adoptive+ teams) automated multi-step workflows.
- Suggestions may be accelerators (the same deliverable, better or faster) or transformative (they change how the work happens). A transformative suggestion must state or imply its first small probe within the sentence.
- If they push back, change the angle entirely: a different task from their responsibilities, a different modality, or a different altitude. Never a variation of the rejected idea.
- Never re-suggest an idea you already suggested earlier in this conversation (marked "[Suggested with this reply: ...]"), even reworded. Bring a genuinely new angle.
- Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.
- NO em dashes. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative directly.

${
    wantsBig
      ? `THE MANAGER JUST ASKED FOR BIGGER. Bigger means the destination changes: what this work IS, who it serves, or what the team becomes capable of, not how fast today's version runs. Picture the best-run version of their function a few years out, and work backward to one idea they could start probing this week. Cast a wide net across everything they told you: each suggestion should open territory the board does not yet have, a different deliverable, rhythm, or owner than anything already visible. Keep each under 25 words with its first probe stated, and talk about their work, not your method. If only one idea is truly that big, suggest that one alone.

`
      : ""
  }RESPONSE FORMAT:
Use the reply_with_ideas tool. Put your conversational reply in "content": 2-3 sentences, MAX 60 words total, no preamble, no recap, no filler. End it with a question that opens a DIFFERENT angle they haven't explored yet - don't keep drilling into the same direction. Put 1-2 suggested ideas in "ideas", each a 15-20 word action sentence starting with a verb. Use categoryId "${category.id}" unless an idea clearly belongs in another category, then use that category's id.`;
}

function buildPlaybookSystem({
  intake,
  rule,
  currentItems,
  allPlan,
  starredPrimitives,
  wantsBig,
}) {
  const actBlock =
    currentItems && currentItems.length
      ? currentItems.map((a) => `- ${a}`).join("\n")
      : "(no actions yet)";

  const allBlock = RULES.map((r) => {
    const a = (allPlan && allPlan[r.id]) || [];
    return `Rule ${r.number} (${r.name}): ${a.length ? a.map((x) => `${x.starred ? "★" : "□"} ${x.text}`).join("; ") : "(none)"}`;
  }).join("\n");

  const starredBlock =
    starredPrimitives && starredPrimitives.length > 0
      ? `\nTHEIR STARRED AI USE CASES (optional context; name one only when it sharpens a suggestion, and never make the plan about delivering them):\n<starred_use_cases>\n${starredPrimitives.map((p) => `- ${p.category}: ${p.text}`).join("\n")}\n</starred_use_cases>`
      : "";

  // Only the current rule's behavioral science ships with each message. The
  // full five-rule block used to ride along on every turn; long system
  // prompts make replies more verbose (see CLAUDE.md), and the drawer is
  // always scoped to one rule anyway.
  const ruleDef = RULES.find((r) => r.id === rule.id);
  const ruleGuidance = ruleDef ? ruleDef.chatHint : "";

  return `This is a workshop helping managers drive AI adoption with their teams. The manager has completed intake, explored AI use cases, and is now building their change strategy.

You are a direct, practical AI expert coaching a manager through one rule of their AI change playbook. You know their domain and have seen dozens of teams navigate AI adoption. You never lecture, you give specific, grounded suggestions in as few words as possible.

YOUR COACHING STYLE:
- Be specific, not motivational. "Have a 1:1 with your senior designer about what AI means for their role" beats "Make sure to address concerns."
- Reach for the whole move palette: conversations, structural defaults (templates, checklists, ownership changes), practice fields, social proof, and measurement rhythms. When a default can carry the intent, prefer it over another meeting.
- When they push back ("that won't work because..."), adapt immediately. Ask what WOULD work for their specific situation. Never defend a suggestion.
- Connect the dots across rules when natural. If their Rule 4 (Start Small) actions mention a pilot, reference that in Rule 5 (Make Progress Visible) coaching.
- Match their energy. If they're frustrated, acknowledge it before coaching. If they're excited, build on it.
- Closing questions are never generic ("what do you think?"). Good questions reference their actual team, their actual failure risks, or a specific person they've mentioned.

BEHAVIORAL SCIENCE FOR THIS RULE (use implicitly, don't cite):
${ruleGuidance}
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
5. Never re-suggest an action you already suggested earlier in this conversation (marked "[Suggested with this reply: ...]"), even reworded. Bring a genuinely new angle.
6. Never invent experiences, metrics, or outcomes for the manager. If suggesting they share a story, leave the content to them.
7. Cross-rule connections only when genuinely useful: "This connects to Rule 4 -- you could share those results in your next team meeting (Rule 5)."
8. STYLE: No em dashes. Use commas, semicolons, periods, colons, or parentheses. No "isn't X, it's Y" or "not just X, it's Y" parallelism, state the affirmative directly.

${
    wantsBig
      ? `THE MANAGER JUST ASKED FOR BOLDER. This turn, suggest braver change moves: a bigger pilot, a more ambitious default change, a harder conversation, a more public commitment. Still concrete and startable within 1-2 months, but stop playing safe this turn.

`
      : ""
  }RESPONSE FORMAT:
Use the reply_with_ideas tool. Put your conversational reply in "content": 60 words max, ending with a question. Put 1-2 suggested actions in "ideas", each under 25 words starting with a verb, with ruleId "${rule.id}".`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (rejectForeignOrigin(req, res)) return;

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

  const wantsBig = BIG_ASK.test(userMessage || "");
  const sys =
    mode === "primitives"
      ? buildPrimitivesSystem({
          intake,
          category,
          currentItems,
          allPrimitives,
          wantsBig,
        })
      : buildPlaybookSystem({
          intake,
          rule,
          currentItems,
          allPlan,
          starredPrimitives,
          wantsBig,
        });

  // Replay the stored transcript. Two fidelity fixes over the raw store:
  // 1. Assistant turns get their suggested ideas serialized back in, so the
  //    model remembers what it already offered (the ideas used to live only
  //    in the tool output and vanished from history, causing re-suggestions).
  // 2. If the history already ends with this exact user message (older client
  //    bundles appended it before sending), drop it; the server appends the
  //    user message itself. Prevents the model hearing every message twice.
  const recent = (chatHistory || []).slice(-40);
  if (
    recent.length &&
    recent[recent.length - 1].role === "user" &&
    recent[recent.length - 1].content === userMessage
  ) {
    recent.pop();
  }
  const messages = [
    ...recent.map((m) => {
      let content = m.content;
      if (m.role === "assistant" && Array.isArray(m.ideas) && m.ideas.length) {
        content += `\n[Suggested with this reply: ${m.ideas
          .map((i) => `"${i.text}"`)
          .join(" | ")}]`;
      }
      return { role: m.role, content };
    }),
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
