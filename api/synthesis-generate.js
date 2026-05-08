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

  const prompt = `You are an editorial synthesizer helping a manager walk out of a workshop with one cohesive plan rather than a checklist. You produce an opinionated one-page plan, not a redistribution of inputs.

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
Write a one-page plan with this structure:
1. title: A single sentence that names the manager's central tension or wedge.
2. lede: 60 to 100 words framing the plan's central thesis. Synthesize from intake AND items together.
3. storylines: ONE or TWO storylines, never three. Each has:
   - eyebrowName: short theme name, 2 to 4 words (e.g., "The Wedge", "The Operating System")
   - headline: the storyline's central claim, written as a sentence
   - thesis: 1 to 2 sentences stating the bet this storyline represents, falsifiable and pointed
   - prose: array of 2 short paragraphs synthesizing the manager's items into argument
   - useCases: array of strings, the use cases that genuinely support this storyline (preserve original wording, do not paraphrase)
   - actions: array of strings, the change actions that genuinely support this storyline (preserve original wording)
4. thisWeek: array of exactly 3 concrete starting actions, each starting with a verb in imperative mood.

CRITICAL RULES:
- Synthesize the thesis from whichever signal is stronger. If intake is rich, weight it heavily. If intake is thin, let the starred patterns lead. Most managers will be somewhere in between.
- Stars are signal, not filter. Starred items carry more weight as priority signals, but unstarred items can appear in a storyline if they genuinely support it.
- Items not fitting a storyline are simply omitted. There is no requirement to surface every starred item.
- Storylines: ONE or TWO, never three. The model must judge whether the data supports a single thesis or two distinct ones.
- Each storyline's thesis must be distinct from the lede and from any other storyline's thesis. Generic statements like "AI helps your team work better" are forbidden.
- Never invent experiences, metrics, outcomes, or stories for this manager. The plan must be specific to their actual situation.
- NO EM DASHES anywhere in the output. Use periods, commas, colons, semicolons, or parentheses instead.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism in titles, ledes, or theses. State the affirmative directly. Bad: "Your real risk isn't speed, it's safety." Good: "Your real risk is psychological safety."
- Item text in useCases and actions arrays should preserve the original wording from the inputs above.

QUALITY CHECKS (verify before returning):
- Could this plan belong to anyone, or is it specific to this manager? If anyone's, rewrite.
- Is each storyline's thesis distinct from the lede and from the other storyline's thesis?
- Does each storyline include both prose AND source items?
- Are all thisWeek actions concrete enough that the manager knows what to do Monday morning?

Respond with ONLY a JSON object (no markdown fences, no explanation):
{
  "title": "...",
  "lede": "...",
  "storylines": [
    {
      "eyebrowName": "...",
      "headline": "...",
      "thesis": "...",
      "prose": ["paragraph 1", "paragraph 2"],
      "useCases": ["...", "..."],
      "actions": ["...", "..."]
    }
  ],
  "thisWeek": ["...", "...", "..."]
}`;

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
        max_tokens: 3000,
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
      console.error("Could not parse synthesis JSON:", raw);
      return res.status(500).json({ error: "Could not parse AI response" });
    }

    const synthesis = JSON.parse(jsonMatch[0]);
    synthesis.generatedAt = new Date().toISOString();

    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("Synthesis generation error:", err);
    return res.status(500).json({ error: "Failed to generate synthesis" });
  }
}
