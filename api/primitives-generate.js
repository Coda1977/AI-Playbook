import {
  CATEGORIES,
  teamFluencyFloor,
  useCaseBaseline,
} from "../lib/workshop.js";
import { rejectForeignOrigin } from "../lib/apiGuard.js";
import { callTool } from "../lib/claude.js";

// Phase 2 generation is a single call. A two-call diverge/converge pipeline
// was built and A/B-tested on 2026-07-03 (Opus judge, order-swapped pairwise,
// 4 runs): parity on absolute scores, slight pairwise losses, and no
// transformative ideas actually surfacing, so it was dropped for its latency
// and complexity. The structural machinery it produced was kept and folded
// in here: the transformative license (the old prompt instructed smallness
// four ways), the per-team injected fluency floor, expected-value selection,
// commitment fields with a deterministic server trim, and forced modality
// coverage.

function buildPrompt(intake, categoriesBlock) {
  const helpLabels = (intake.helpWith || []).join(", ");
  // A preloaded assistant needs someone able to set it up. When both manager
  // and team have not started, say so instead of leaving the model to infer it.
  const nobodyCanPreload =
    /^not yet/i.test(intake.managerFluency || "") &&
    /^not yet/i.test(intake.teamFluency || "");

  return `You are helping a manager brainstorm how to use AI. Generate the 12 highest-value AI use cases for this specific person.

<manager_profile>
- Role and team: ${intake.role}
- Key responsibilities: ${intake.responsibilities}
- What they want help with: ${helpLabels}
- Manager's AI fluency: ${intake.managerFluency || "Not specified"}
- Team's AI fluency: ${intake.teamFluency || "Not specified"}
- 90-day success vision: ${intake.successVision || "Not specified"}
- Failure risks and known resistance: ${intake.failureRisks || "Not specified"}
</manager_profile>

The 6 categories:
${categoriesBlock}

WHAT COUNTS AS A USE CASE (strict):
- Every idea serves outcomes this team already owns: their deliverables, analyses, decisions, and communications.
- NEVER suggest ideas about the AI adoption effort itself: no AI adoption plans, no AI training sessions or exercises, no rollout strategies, no prompt libraries, no "teach the team to use AI" ideas. Driving adoption is a later phase of this workshop.
- The 90-day vision tells you WHICH work matters most, not what to plan. If the vision says "every CSM uses AI to prep QBRs," the use case is AI-assisted QBR prep, never a plan for getting CSMs to use AI.

PAST THE OBVIOUS (the bar every idea must clear):
- ${useCaseBaseline(intake.managerFluency, intake.teamFluency)}
- Before writing any idea, commit in the alreadyObvious field to the eight AI uses a manager in this exact role has certainly already tried, seen demoed, or thought of. That list is the floor of this workshop, never its content: no final idea may be one of them, a narrower version of one, or one of them dressed in this team's vocabulary.
- The test for every final idea: the manager reads it and thinks "I had not thought of using it that way," then sees at once how they would run it. An idea they could have written themselves before the workshop is worth nothing here.
- Freshness comes from the angle, never from tooling. Look in three places: what AI is asked to DO (judge against a standard, find what is missing, challenge, compare two things nobody lays side by side, simulate one specific person, interview someone to pull out what only they know, teach), what it is FED (the team's own accumulated material that nobody has time to read end to end), and WHERE it enters the work (before the decision, as the last check before something ships, as the keeper of a standard). Producing a first draft and summarizing a pile are where everyone starts; go where they have not been.
- Fresh never means exotic or vague. Every idea still clears every floor below, runs with what this team has today, and names its input and its output.

THINK AT TWO ALTITUDES:
- SHARPENERS: eight of the 12 ideas make work this team already does better in a way plain drafting and summarizing cannot: a mistake caught, a decision made on evidence, a standard held, a skill built, a blind spot exposed. Getting the same deliverable out faster does not qualify on its own.
- BIG SWINGS: FOUR of the 12 ideas must transform how the work itself happens, INSIDE realms the manager already named: replace a deliverable with something better, turn a periodic event into a continuous practice, invert who does the work, or make something possible the team never had capacity for. A big swing is not a new realm of work; it is a bigger destination for work the manager already wrote about. Each fits one 15-20 word sentence that states or implies its first probe, and each clears the floors. Commit all four in the bigSwings field.

FLOORS (every idea must clear all of them):
- It serves an outcome this manager owns and can act on within their own authority.
- Hard constraints in the failure risks are generation constraints. If veterans reject AI-written customer emails, nothing sends AI-written customer emails (drafting that a human rewrites is fine, and say so). If employee data must stay in approved tools, nothing feeds individual employee data to AI. When the named risk is about perception ("anything that smells like AI reading employee data"), mitigation is not enough; keep AI away from that data entirely.
- Ideas the TEAM runs must be feasible for THIS team: ${teamFluencyFloor(intake.teamFluency)} An idea only the manager runs personally may use the manager's fluency instead, and a tool the manager sets up once that the team then uses by simple chat counts as team-feasible.
- When the valuable version of an idea exceeds the team's fluency, offer the version this team could run today (an automated digest becomes a weekly paste-into-chat habit); the feasible version is the idea's first probe.
- The floor constrains an idea's FIRST PROBE, never its destination's size. A Capable team can adopt a transformative reshape whose probe is one preloaded assistant or one paste-into-chat habit. Fluency limits how an idea starts, not how big it is allowed to be.
- This team could absorb it within a quarter.
- Nothing scores, monitors, or impersonates the manager's own people; that reads as surveillance and feeds the resistance. AI may check a piece of work against a standard the team owns, and may simulate outsiders (a customer, an executive, a regulator, a competitor).

CHOOSE BY EXPECTED VALUE for this manager:
- Recurrence and reach of the pain it relieves; pain intensity; proximity to the 90-day vision; adoption probability given fluency and the named resistance.
- Within each altitude, let value decide; when two ideas are equal on value, keep the more surprising one. Never fill a big-swing slot with a dressed-up sharpener, and never pad a sharpener slot with a vague ambition or a faster first draft.

PORTFOLIO (structural constraints on the 12):
- 12 ideas total, every category gets at least 1. The stretch category is where stock filler creeps in (a formula, a template, a dashboard): give it the least obvious honest idea, never the most typical one. The one or two categories that best fit the role, responsibilities, help-with, and vision get 3 each; the category that is the biggest stretch for this role gets 1; the rest get 2. Commit your choices in the focusCategories and stretchCategory fields; the counts are enforced from that commitment.
- At least one idea directly serves the work the 90-day vision names.
- Spread the AI's job across the list: no more than three of the 12 may give AI the same job (drafting, summarizing, critiquing, simulating a person, interviewing, comparing, monitoring, teaching).${nobodyCanPreload ? " Nobody here can set up a preloaded assistant yet, so no idea may depend on one." : ""} Name each idea's job in the jobSpread field.
- No near-duplicates.

IDEA FORMAT (strict):
- A single action sentence, 15 to 20 words, starting with a verb. Name the input and the output, so the manager knows exactly what goes in and what comes back. "Turn last week's support tickets into a themed risk brief per account" is excellent; "use AI to analyze customer data" is filler.
- No explanation of benefits, no "reducing X" or "saving Y." The action speaks for itself.
- For teams below Adoptive fluency, every team-run sentence describes a person doing something in chat (paste, ask, rehearse, query, review); never "auto-generate", "trigger", "sync", "route", or any verb where the system acts on its own.
- Do not template the phrasing: no more than two ideas may start with the same verb, and "paste" may appear in at most two ideas total.

STYLE RULES (strict):
- NO em dashes anywhere. Use commas, semicolons, periods, colons, or parentheses.
- NO "isn't X, it's Y" or "not just X, it's Y" parallelism. State the affirmative thesis directly.
- No filler ("It's worth noting", "Importantly").

Use the submit_use_cases tool to return the final 12 in their categories.`;
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
        "alreadyObvious",
        ...CATEGORIES.map((c) => c.id),
        "focusCategories",
        "stretchCategory",
        "bigSwings",
        "jobSpread",
      ],
      properties: {
        // Declared first so the model writes out the obvious list before any
        // idea; the ideas are then generated against it. Logged, never sent
        // to the client.
        alreadyObvious: {
          type: "array",
          minItems: 8,
          maxItems: 8,
          items: { type: "string" },
          description:
            "Write this FIRST. The eight AI uses a manager in this exact role has certainly already tried, seen demoed, or thought of (a few words each). No final idea may be one of these, a narrower version of one, or one of these in this team's vocabulary.",
        },
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
        bigSwings: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: { type: "string" },
          description:
            "The four final ideas (quoted verbatim) that transform how the work happens inside realms the manager named, each with its first probe stated or implied",
        },
        jobSpread: {
          type: "array",
          minItems: 12,
          maxItems: 13,
          items: { type: "string" },
          description:
            "One word per final idea, in order: the job AI does in it (draft, summarize, critique, simulate, interview, compare, monitor, teach, or another single verb). No job may appear more than three times.",
        },
      },
    },
  };

  try {
    const result = await callTool({
      label: "primitives",
      tool: useCasesTool,
      fallbackMaxTokens: 2048,
      messages: [
        { role: "user", content: buildPrompt(intake, categoriesBlock) },
      ],
    });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    // Enforce the committed distribution by trimming, the same contract as
    // the playbook's prioritizedRules trim: prose count instructions don't
    // hold, the commitment fields + deterministic trim do. Also strips the
    // commitment fields so the response shape stays exactly what the client
    // has always consumed.
    const raw = result.input;
    // Observability: which four ideas the model committed as big swings
    // (verifiable in Vercel logs; the field never reaches the client).
    if (Array.isArray(raw.bigSwings) && raw.bigSwings.length) {
      console.log("bigSwings:", raw.bigSwings.join(" | "));
    }
    if (Array.isArray(raw.alreadyObvious) && raw.alreadyObvious.length) {
      console.log("alreadyObvious:", raw.alreadyObvious.join(" | "));
    }
    const focus = Array.isArray(raw.focusCategories)
      ? raw.focusCategories.slice(0, 2)
      : [];
    const stretch =
      typeof raw.stretchCategory === "string" ? raw.stretchCategory : null;
    const primitives = {};
    for (const c of CATEGORIES) {
      const arr = Array.isArray(raw[c.id])
        ? raw[c.id].filter((t) => typeof t === "string" && t.trim())
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
