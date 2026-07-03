import {
  CATEGORIES,
  teamFluencyFloor,
  flagsDownscope,
} from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";

// Phase 2 generation is a two-call diverge/converge pipeline (July 2026).
// Diverge produces a 25-30 candidate longlist with no feasibility or size
// filtering, so the selection pass sees the full space (the old single-pass
// prompt instructed smallness four ways and never licensed transformation).
// Converge applies floors, ranks by expected value for THIS manager, applies
// portfolio constraints, and rewrites into the existing submit_use_cases
// shape. Response shape is unchanged; the UI is untouched.

const MODEL = "claude-sonnet-4-6";

function buildDivergePrompt(intake, categoriesBlock) {
  const helpLabels = (intake.helpWith || []).join(", ");

  return `You are building a longlist of candidate AI use cases for one manager. A later selection pass will filter and rank them; your job is RANGE, not polish.

<manager_profile>
- Role and team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
- 90-day success vision: ${intake.successVision || "Not specified"}
</manager_profile>

Generate 25 to 30 candidate ideas for how AI could serve this team's actual work, spread across these 6 categories:
${categoriesBlock}

WHAT TO GENERATE:
- Every candidate applies AI to work this team already owns: their deliverables, analyses, decisions, communications, and the people they serve.
- Never propose the AI adoption effort itself (no AI training sessions, rollout plans, prompt libraries); driving adoption is a later phase of this workshop.
- Cover the manager's whole workload, including corners they might overlook, and make sure several candidates serve the work the 90-day vision names.

GENERATE AT TWO ALTITUDES (both welcome, no quota either way):
- ACCELERATORS: the same deliverable, produced better or faster.
- TRANSFORMATIVE: change how the work itself happens. Replace a deliverable with something better, turn a periodic event into a continuous practice, invert who does the work, or make something possible the team never had capacity for.

SPAN THE MODALITIES (pasting a prompt into a chatbot is only ONE way to use AI):
(a) one-shot transformation of an existing artifact, (b) a persistent assistant or project preloaded with the team's frameworks and past work, (c) AI as thinking partner that critiques, red-teams, or pressure-tests a draft or design, (d) role-play and simulation for practicing conversations or facilitation, (e) transcription plus synthesis of live meetings or interviews, (f) AI features inside tools the team already uses, (g) automated multi-step workflows that act, not just draft.

RULES FOR THIS PASS:
- Do NOT filter for feasibility, team fluency, or size. The selection pass applies those constraints; your job is to make sure it sees the full space.
- Quantity and range beat polish. A rough candidate that opens new territory is worth more than a third variation on a safe one.
- One sentence per candidate, starting with a verb, naming the work it touches. 10 to 20 words is plenty.
- No two candidates may be near-duplicates.

Use the propose_candidates tool.`;
}

function buildConvergePrompt(intake, candidatesBlock, categoriesBlock) {
  const helpLabels = (intake.helpWith || []).join(", ");

  return `You are selecting the 12 highest-value AI use cases for one manager from a longlist of candidates.

<manager_profile>
- Role and team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
- 90-day success vision: ${intake.successVision || "Not specified"}
- Failure risks and known resistance: ${intake.failureRisks || "Not specified"}
</manager_profile>

<candidates>
${candidatesBlock}
</candidates>

The 6 categories:
${categoriesBlock}

STEP 1, FLOORS. Drop any candidate that fails one:
- It serves an outcome this manager owns and can act on within their own authority.
- Hard constraints in the failure risks are generation constraints. If veterans reject AI-written customer emails, nothing sends AI-written customer emails (drafting that a human rewrites is fine, and say so). If employee data must stay in approved tools, nothing feeds individual employee data to AI. An idea that brushes a named failure risk has near-zero adoption probability: its sentence must name the safe input form (anonymized, aggregated, no individual records), or drop it. When the named risk is about perception ("anything that smells like AI reading employee data"), mitigation is not enough; keep AI away from that data entirely.
- Ideas the TEAM runs must be feasible for THIS team: ${teamFluencyFloor(intake.teamFluency)} An idea only the manager runs personally may use the manager's fluency instead, and a tool the manager sets up once that the team then uses by simple chat counts as team-feasible.
- Downscope, don't discard: when a candidate's value is real but its form exceeds the team's fluency, keep it and rewrite it as the version this team could run today. An automated tracker digest becomes a weekly habit (paste the board into chat, get the digest); a trigger-based alert becomes a standing question the owner asks a preloaded assistant each morning. The feasible version is the idea's first probe; the automated form can come later. Downscope into varied forms, never everything into pasting.
- It applies AI to the work itself, never to the AI adoption effort (no AI training, rollout plans, prompt libraries).
- This team could absorb it within a quarter.

STEP 2, RANK the survivors by expected value for THIS manager:
- Recurrence and reach of the pain it relieves: how often the work happens and how many people it touches.
- Pain intensity: how much the manager or team suffers doing it today.
- Proximity to the 90-day vision: work the vision names outranks work it does not.
- Adoption probability: given the team's fluency, the failure risks, and the named resistance, how likely this is to actually get used.
- Size is NOT a criterion in either direction. A small idea hitting a daily pain can outrank a grand one; a transformative idea that clears the floors can outrank ten accelerators. Let value decide.
- When two candidates are equal on value, keep the more surprising one.

STEP 3, PORTFOLIO. Structural constraints on the final 12:
- 12 ideas total, every category gets at least 1. The one or two categories that best fit the role, responsibilities, help-with, and vision get 3 each; the category that is the biggest stretch for this role gets 1; the rest get 2. Commit your choices in the focusCategories and stretchCategory fields; the counts are enforced from that commitment.
- At least one idea directly serves the work the 90-day vision names.
- Anti-monoculture minimums for the final 12, all of which run in plain chat when the floor requires it: at least one preloaded-assistant idea (skip this family if neither the manager nor the team could set one up yet), one critique or red-team idea, one role-play or rehearsal idea, and one transcription-or-meeting-synthesis idea. Prove it in the modalityCoverage fields: each names the final idea that covers that family. At most six of the 12 may be paste-an-artifact, get-an-output transformations.
- No near-duplicates. If no surviving candidate fits a category, write one yourself that clears the floors.

STEP 4, REWRITE each selected idea as a single action sentence, 15 to 20 words:
- Start with a verb. Name the input and the output, so the manager knows exactly what goes in and what comes back. "Turn last week's support tickets into a themed risk brief per account" is excellent; "use AI to analyze customer data" is filler.
- If the idea is transformative (it changes how the work happens), the sentence must state or imply its first probe, the small experiment that tests it.
- No explanation of benefits, no "reducing X" or "saving Y." The action speaks for itself.
- For teams below Adoptive fluency, every team-run sentence describes a person doing something in chat (paste, ask, rehearse, query, review); never "auto-generate", "trigger", "sync", "route", or any verb where the system acts on its own.
- Do not template the phrasing: no more than two ideas may start with the same verb, and "paste" may appear in at most two ideas total.

STYLE RULES (strict):
- NO em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative thesis directly.
- No filler ("It's worth noting", "Importantly").

Use the submit_use_cases tool to return the final 12 in their categories.`;
}

async function callClaudeTool(body, stage, res) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Claude API error (${stage}):`, response.status, errText);
    res.status(502).json({ error: `Claude API returned ${response.status}` });
    return null;
  }

  const data = await response.json();
  const toolBlock = data.content?.find((b) => b.type === "tool_use");
  if (!toolBlock?.input) {
    console.error(
      `Expected tool_use block missing (${stage}). stop_reason:`,
      data.stop_reason,
      "| content types:",
      data.content?.map((b) => b.type).join(",") || "none",
      "| raw response:",
      JSON.stringify(data).slice(0, 1000),
    );
    res.status(500).json({ error: "Model did not return structured ideas" });
    return null;
  }
  return toolBlock.input;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (rejectForeignOrigin(req, res)) return;

  const { intake } = req.body;
  if (!intake) {
    return res.status(400).json({ error: "Missing intake data" });
  }

  const categoriesBlock = CATEGORIES.map(
    (c) => `${c.number}. ${c.title} (${c.description})`,
  ).join("\n");
  const categoryTitles = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, c.title]),
  );
  const canPreloadAssistant =
    !/^not yet/i.test(intake.managerFluency || "") ||
    !/^not yet/i.test(intake.teamFluency || "");

  const candidatesTool = {
    name: "propose_candidates",
    description:
      "Propose the longlist of candidate AI use cases: 25 to 30 candidates spanning all six categories, both altitudes, and all modalities.",
    input_schema: {
      type: "object",
      required: ["candidates"],
      properties: {
        candidates: {
          type: "array",
          minItems: 20,
          maxItems: 35,
          items: {
            type: "object",
            required: ["text", "categoryId"],
            properties: {
              text: {
                type: "string",
                description:
                  "One sentence starting with a verb, naming the work it touches, 10 to 20 words",
              },
              categoryId: {
                type: "string",
                enum: CATEGORIES.map((c) => c.id),
              },
            },
          },
        },
      },
    },
  };

  const properties = {};
  for (const c of CATEGORIES) {
    properties[c.id] = {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
      description: `${c.title} (${c.description})`,
    };
  }

  const useCasesTool = {
    name: "submit_use_cases",
    description:
      "Submit the personalized AI use cases. focusCategories names the 1-2 best-fit categories (3 ideas each) and stretchCategory the biggest stretch (1 idea); every other category gets 2. Each idea is a 15 to 20 word sentence starting with a verb.",
    input_schema: {
      type: "object",
      required: [
        ...CATEGORIES.map((c) => c.id),
        "focusCategories",
        "stretchCategory",
      ],
      properties: {
        ...properties,
        focusCategories: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: { type: "string", enum: CATEGORIES.map((c) => c.id) },
          description:
            "The 1-2 categories that best fit this manager; each gets 3 ideas",
        },
        stretchCategory: {
          type: "string",
          enum: CATEGORIES.map((c) => c.id),
          description:
            "The category that is the biggest stretch for this role; it gets exactly 1 idea",
        },
        modalityCoverage: {
          type: "object",
          // A preloaded assistant needs someone able to set it up; when both
          // manager and team are not yet started, forcing that family
          // produces exactly the floor-violating ideas the floor bans.
          required: [
            ...(canPreloadAssistant ? ["preloadedAssistant"] : []),
            "critique",
            "rolePlay",
            "transcription",
          ],
          properties: {
            preloadedAssistant: {
              type: "string",
              description:
                "The final idea (quoted verbatim) where someone chats with an assistant preloaded with the team's context",
            },
            critique: {
              type: "string",
              description:
                "The final idea (quoted verbatim) where AI critiques, red-teams, or pressure-tests something",
            },
            rolePlay: {
              type: "string",
              description:
                "The final idea (quoted verbatim) where someone rehearses or role-plays with AI",
            },
            transcription: {
              type: "string",
              description:
                "The final idea (quoted verbatim) where a meeting or conversation is transcribed and synthesized",
            },
          },
          description:
            "Proof of modality spread: name the final idea covering each family",
        },
      },
    },
  };

  try {
    // Call 1: diverge into a wide candidate longlist.
    const divergeInput = await callClaudeTool(
      {
        model: MODEL,
        max_tokens: 2048,
        tools: [candidatesTool],
        tool_choice: { type: "tool", name: candidatesTool.name },
        messages: [
          {
            role: "user",
            content: buildDivergePrompt(intake, categoriesBlock),
          },
        ],
      },
      "diverge",
      res,
    );
    if (!divergeInput) return;

    const candidates = (
      Array.isArray(divergeInput.candidates) ? divergeInput.candidates : []
    ).filter((c) => c && typeof c.text === "string" && c.text.trim());
    if (candidates.length === 0) {
      console.error("Diverge returned no usable candidates");
      return res
        .status(500)
        .json({ error: "Model did not return structured ideas" });
    }
    if (candidates.length < 15) {
      console.warn(`Diverge returned only ${candidates.length} candidates`);
    }

    const candidatesBlock = candidates
      .map((c, i) => {
        const flag = flagsDownscope(c.text, intake.teamFluency)
          ? " (downscope: exceeds team fluency as written)"
          : "";
        return `${i + 1}. [${categoryTitles[c.categoryId] || "Uncategorized"}] ${c.text.trim()}${flag}`;
      })
      .join("\n");

    // Call 2: converge onto the 12 highest-value ideas, same output shape
    // the client has always consumed.
    const convergeInput = await callClaudeTool(
      {
        model: MODEL,
        max_tokens: 2048,
        tools: [useCasesTool],
        tool_choice: { type: "tool", name: useCasesTool.name },
        messages: [
          {
            role: "user",
            content: buildConvergePrompt(
              intake,
              candidatesBlock,
              categoriesBlock,
            ),
          },
        ],
      },
      "converge",
      res,
    );
    if (!convergeInput) return;

    // Enforce the committed distribution by trimming, the same contract as
    // the playbook's prioritizedRules trim: prose count instructions don't
    // hold, the commitment fields + deterministic trim do. Also strips the
    // commitment fields so the response shape stays exactly what the client
    // has always consumed.
    const focus = Array.isArray(convergeInput.focusCategories)
      ? convergeInput.focusCategories.slice(0, 2)
      : [];
    const stretch =
      typeof convergeInput.stretchCategory === "string"
        ? convergeInput.stretchCategory
        : null;
    const primitives = {};
    for (const c of CATEGORIES) {
      const arr = Array.isArray(convergeInput[c.id])
        ? convergeInput[c.id].filter(
            (t) => typeof t === "string" && t.trim(),
          )
        : [];
      const limit = focus.includes(c.id) ? 3 : c.id === stretch ? 1 : 2;
      primitives[c.id] = arr.slice(0, limit);
    }

    return res.status(200).json({ primitives });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Failed to generate ideas" });
  }
}
