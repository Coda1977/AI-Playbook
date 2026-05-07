# One-Page Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "synthesis" phase that generates a one-page narrative plan from the manager's intake, use cases, and change actions, accessed via a primary CTA on the Review page.

**Architecture:** A new React view (`SynthesisView`) renders structured JSON returned from a new Vercel serverless endpoint (`api/synthesis-generate.js`). State lives in `AppContext` like the other generated artifacts. One successful generation locks the synthesis. The synthesis page reuses the existing app's design language exactly (Montserrat, black hero, white cards, red CTAs, gold for star icons only).

**Tech Stack:** React 19, Vite 7, Tailwind 4, Vercel serverless functions, Claude Sonnet 4.6 API, `docx` for Word export, `file-saver` for download, `localStorage` for persistence.

**Project conventions to honor:**
- No automated tests exist in this codebase; verification is manual via build + smoke test
- `npm run build` and `npm run lint` must pass before each commit
- No em dashes in any prose or copy (project rule from CLAUDE.md)
- Feature branches and PRs only; never push to `master` directly
- Conventional commits with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` footer

**Reference:** Spec at `docs/superpowers/specs/2026-05-06-one-page-plan-design.md`.

---

## Task 1: State foundation and phase routing

**Files:**
- Modify: `src/context/AppContext.jsx`
- Modify: `src/components/shared/PhaseProgress.jsx`
- Modify: `src/components/shared/Header.jsx`

This task adds the `synthesis` field to state and wires the new phase values into the existing phase progression infrastructure. No UI changes yet.

- [ ] **Step 1.1: Add `synthesis` to INIT in AppContext**

In `src/context/AppContext.jsx`, modify the `INIT` constant:

```js
const INIT = {
  phase: "intake",
  intake: {
    role: "",
    helpWith: [],
    responsibilities: "",
    managerFluency: "",
    teamFluency: "",
    failureRisks: "",
    successVision: "",
  },
  primitives: { content: [], automation: [], research: [], data: [], coding: [], ideation: [] },
  primitivesChat: {},
  plan: { destination: [], safe: [], script: [], small: [], visible: [] },
  playbookChat: {},
  synthesis: null,
};
```

- [ ] **Step 1.2: Add `SET_SYNTHESIS` reducer case**

In `src/context/AppContext.jsx`, add a new case inside the `reducer` function, immediately after the `MARK_IDEA_ADDED` case (just before `RESET`):

```js
case "SET_SYNTHESIS":
  return { ...state, synthesis: action.synthesis, phase: "synthesis" };
```

- [ ] **Step 1.3: Add synthesis phases to PhaseProgress ORDER**

In `src/components/shared/PhaseProgress.jsx`, modify the `ORDER` constant:

```js
const ORDER = {
  intake: 0,
  "generating-primitives": 0,
  primitives: 1,
  "generating-playbook": 1,
  playbook: 2,
  commitment: 3,
  "generating-synthesis": 3,
  synthesis: 3,
};
```

The synthesis phases share the same ORDER value as `commitment` (3), which means all three pills show as done. No new pill is added; synthesis is a post-Review final state.

- [ ] **Step 1.4: Update Header isGenerating check**

In `src/components/shared/Header.jsx`, line 12, modify the `isGenerating` check:

```js
const isGenerating =
  phase === "generating-primitives" ||
  phase === "generating-playbook" ||
  phase === "generating-synthesis";
```

- [ ] **Step 1.5: Run build to verify no breakage**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 1.6: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 1.7: Commit**

```bash
git add src/context/AppContext.jsx src/components/shared/PhaseProgress.jsx src/components/shared/Header.jsx
git commit -m "$(cat <<'EOF'
feat(synthesis): add state and phase routing for one-page plan

Adds synthesis field to AppContext init, SET_SYNTHESIS reducer case,
and wires generating-synthesis and synthesis phases into PhaseProgress
ORDER and Header isGenerating check. No UI yet.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: GeneratingIndicator synthesis mode and steps

**Files:**
- Modify: `src/config/rules.js` (add `SYNTHESIS_GEN_STEPS`)
- Modify: `src/components/shared/GeneratingIndicator.jsx`

The existing GeneratingIndicator handles two modes via an `isPrimitives` boolean. We refactor to support three modes cleanly.

- [ ] **Step 2.1: Add SYNTHESIS_GEN_STEPS constant**

In `src/config/rules.js`, append after the existing `PLAYBOOK_GEN_STEPS` constant:

```js
export const SYNTHESIS_GEN_STEPS = [
  { step: 1, name: "Reading your intake", tip: "Understanding your role, team, and what success looks like." },
  { step: 2, name: "Mapping your use cases", tip: "Looking for themes across what you starred." },
  { step: 3, name: "Mapping your change actions", tip: "Identifying the moves that matter most." },
  { step: 4, name: "Finding the storylines", tip: "One or two narratives that hold your plan together." },
  { step: 5, name: "Writing your one-page plan", tip: "Turning fragments into a story." },
];
```

- [ ] **Step 2.2: Refactor GeneratingIndicator to support synthesis mode**

Replace the entire contents of `src/components/shared/GeneratingIndicator.jsx`:

```jsx
import { useState, useEffect, useRef } from "react";
import { BookOpen, Sparkles, CheckCircle2, Loader2, Circle, FileText } from "lucide-react";
import { C } from "../../config/constants";
import { CATEGORIES, PRIMITIVES_GEN_STEPS } from "../../config/categories";
import { RULES, PLAYBOOK_GEN_STEPS, SYNTHESIS_GEN_STEPS } from "../../config/rules";

const MODES = {
  primitives: {
    steps: PRIMITIVES_GEN_STEPS,
    items: CATEGORIES,
    title: "Discovering AI use cases",
    subtitle: "Brainstorming ideas for your role...",
    readyTitle: "Your AI use cases are ready",
    icon: Sparkles,
    nameFor: (i, items) => items[i].title,
    buildingLabel: "Building your AI use cases...",
  },
  playbook: {
    steps: PLAYBOOK_GEN_STEPS,
    items: RULES,
    title: "Writing your change strategy",
    subtitle: "Personalizing your actions...",
    readyTitle: "Your change strategy is ready",
    icon: BookOpen,
    nameFor: (i, items, s) => `Rule ${s.rule}: ${items[i].name}`,
    buildingLabel: "Building your personalized strategy...",
  },
  synthesis: {
    steps: SYNTHESIS_GEN_STEPS,
    items: SYNTHESIS_GEN_STEPS,
    title: "Synthesizing your one-page plan",
    subtitle: "Clustering your work into a story...",
    readyTitle: "Your one-page plan is ready",
    icon: FileText,
    nameFor: (i, items) => items[i].name,
    buildingLabel: "Writing your final plan...",
  },
};

export default function GeneratingIndicator({ mode, onReady }) {
  const config = MODES[mode] || MODES.primitives;
  const { steps, items, title, subtitle, readyTitle, icon: Icon, nameFor, buildingLabel } = config;

  const [step, setStep] = useState(0);
  const [stepsFinished, setStepsFinished] = useState(false);
  const [complete, setComplete] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length) { clearInterval(iv); return s; }
        return s + 1;
      });
    }, 2200);
    return () => clearInterval(iv);
  }, [steps.length]);

  useEffect(() => {
    if (step >= steps.length && !stepsFinished) {
      const t = setTimeout(() => setStepsFinished(true), 600);
      return () => clearTimeout(t);
    }
  }, [step, stepsFinished, steps.length]);

  useEffect(() => {
    if (stepsFinished && onReady && !complete) setComplete(true);
  }, [stepsFinished, onReady, complete]);

  useEffect(() => {
    if (complete && onReady && !calledRef.current) {
      calledRef.current = true;
      const t = setTimeout(onReady, 1200);
      return () => clearTimeout(t);
    }
  }, [complete, onReady]);

  return (
    <div className={`generating-container ${complete ? "generating-complete" : ""}`}>
      <div className="gen-card">
        {complete ? (
          <div className="ready-beat animate-fade-in">
            <div className="ready-check">
              <CheckCircle2 size={48} color={C.red} />
            </div>
            <h2 className="generating-title" style={{ marginTop: 20 }}>{readyTitle}</h2>
            <p className="generating-subtitle" style={{ opacity: 0.7 }}>Opening now...</p>
          </div>
        ) : (
          <>
            <div className="generating-icon">
              <Icon size={32} color={C.red} />
            </div>
            <h2 className="generating-title">{title}</h2>
            <p className="generating-subtitle">{subtitle}</p>
            <div className="generating-steps">
              {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className={`gen-step ${done ? "gen-done" : active ? "gen-active" : "gen-future"}`}>
                    <div className={`gen-step-icon ${active ? "gen-step-icon-active" : ""}`}>
                      {done ? (
                        <CheckCircle2 size={18} color={C.red} />
                      ) : active ? (
                        <Loader2 size={18} color={C.red} className="spinning" />
                      ) : (
                        <Circle size={18} color={C.border} />
                      )}
                    </div>
                    <div>
                      <div className="gen-step-name">{nameFor(i, items, s)}</div>
                      {(done || active) && <div className="gen-step-tip animate-fade-in">{s.tip}</div>}
                    </div>
                  </div>
                );
              })}
              <div className="gen-progress-bar">
                <div className="gen-progress-fill" style={{ width: `${Math.min(Math.round((step / steps.length) * 100), 100)}%` }} />
              </div>
              <div className="gen-progress-label">{Math.min(Math.round((step / steps.length) * 100), 100)}%</div>
            </div>
            {stepsFinished && (
              <div className="gen-building animate-fade-in">
                <Loader2 size={16} color={C.red} className="spinning" />
                <span>{buildingLabel}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2.3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds. The existing primitives and playbook indicators continue to work because the MODES map preserves their behavior.

- [ ] **Step 2.4: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 2.5: Commit**

```bash
git add src/config/rules.js src/components/shared/GeneratingIndicator.jsx
git commit -m "$(cat <<'EOF'
feat(synthesis): add synthesis mode to GeneratingIndicator

Refactors the indicator to use a config map indexed by mode, and adds
SYNTHESIS_GEN_STEPS constant. Existing primitives and playbook modes
preserved.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: API endpoint for synthesis generation

**Files:**
- Create: `api/synthesis-generate.js`

This is the new Vercel serverless endpoint that calls Claude Sonnet 4.6 with the full intake, primitives, and plan, and returns structured synthesis JSON.

- [ ] **Step 3.1: Create the endpoint file**

Create `api/synthesis-generate.js` with this complete contents:

```js
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
      return res.status(502).json({ error: `Claude API returned ${response.status}` });
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
```

- [ ] **Step 3.2: Smoke test the endpoint locally**

Start the local Vercel dev server: `npm run dev:vercel`

In another terminal, post a minimal request to verify the endpoint responds:

```bash
curl -X POST http://localhost:3000/api/synthesis-generate \
  -H "Content-Type: application/json" \
  -d '{
    "intake": {
      "role": "Director of Marketing",
      "helpWith": ["time"],
      "responsibilities": "Editorial planning",
      "managerFluency": "Capable",
      "teamFluency": "Not yet started",
      "failureRisks": "Senior creatives skeptical",
      "successVision": "AI as first-draft partner"
    },
    "primitives": {
      "content": [{"text": "Auto-draft newsletters", "starred": true}],
      "automation": [], "research": [], "data": [], "coding": [], "ideation": []
    },
    "plan": {
      "destination": [{"text": "Frame in craft terms", "starred": true}],
      "safe": [], "script": [], "small": [], "visible": []
    }
  }' | jq .
```

Expected: A JSON response with `synthesis` containing `title`, `lede`, `storylines` array, and `thisWeek` array. If the response includes the expected shape, the endpoint works.

- [ ] **Step 3.3: Commit**

```bash
git add api/synthesis-generate.js
git commit -m "$(cat <<'EOF'
feat(synthesis): add synthesis-generate API endpoint

New Vercel serverless function that synthesizes intake, primitives, and
plan into a one-page narrative plan via Claude Sonnet 4.6. Returns
structured JSON: title, lede, 1-2 storylines (each with eyebrow, headline,
thesis, prose, useCases, actions), and thisWeek (3 actions).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: API client function

**Files:**
- Modify: `src/utils/api.js`

- [ ] **Step 4.1: Add generateSynthesis function**

In `src/utils/api.js`, append a new function after `sendChat`:

```js
export async function generateSynthesis(intake, primitives, plan) {
  const res = await fetch("/api/synthesis-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intake, primitives, plan }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  const data = await res.json();
  return data.synthesis;
}
```

- [ ] **Step 4.2: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4.3: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 4.4: Commit**

```bash
git add src/utils/api.js
git commit -m "$(cat <<'EOF'
feat(synthesis): add generateSynthesis API client

Wraps the new synthesis-generate endpoint with the same error pattern
used for primitives and playbook generation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: SynthesisView component and styles

**Files:**
- Create: `src/components/views/SynthesisView.jsx`
- Modify: `src/index.css`

The view renders `state.synthesis` using styles that match the existing CommitmentView aesthetic exactly: black hero, Montserrat throughout, white cards on light gray surface, red `.commitment-priorities` pattern for "This Week", `.commitment-reflection` pattern for the lede and thesis blocks, gold star icons in evidence lists.

- [ ] **Step 5.1: Create SynthesisView component**

Create `src/components/views/SynthesisView.jsx`:

```jsx
import { ArrowLeft, Download, Star } from "lucide-react";
import { C } from "../../config/constants";
import { exportSynthesisDocx } from "../../utils/export";

export default function SynthesisView({ state, dispatch }) {
  const { synthesis, intake } = state;

  if (!synthesis) {
    return (
      <div className="commitment-empty">
        <p>No plan yet. Go back to Review and generate one.</p>
        <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-ghost">
          <ArrowLeft size={14} /> Back to Review
        </button>
      </div>
    );
  }

  const date = new Date(synthesis.generatedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="synthesis-container">
      <div className="synthesis-hero animate-fade-in">
        <div className="synthesis-hero-eyebrow">
          My One-Page Plan
          <span className="synthesis-experimental">Experimental</span>
        </div>
        <h1 className="synthesis-title">{synthesis.title}</h1>
        <div className="synthesis-meta" title={intake.role}>
          {intake.role} &middot; {date}
        </div>
      </div>

      <div className="synthesis-lede animate-fade-in" style={{ animationDelay: "0.06s" }}>
        {synthesis.lede}
      </div>

      {synthesis.storylines.map((s, i) => (
        <div key={i} className="synthesis-story animate-fade-in" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
          <div className="synthesis-story-eyebrow">
            <span className="synthesis-story-num">{String(i + 1).padStart(2, "0")}</span>
            {s.eyebrowName}
          </div>
          <h2 className="synthesis-story-headline">{s.headline}</h2>
          <div className="synthesis-thesis">{s.thesis}</div>
          <div className="synthesis-prose">
            {(s.prose || []).map((p, pi) => <p key={pi}>{p}</p>)}
          </div>
          {((s.useCases && s.useCases.length > 0) || (s.actions && s.actions.length > 0)) && (
            <div className="synthesis-evidence">
              <div>
                <div className="synthesis-col-label">
                  AI Use Cases <span className="synthesis-col-count">&middot; {(s.useCases || []).length}</span>
                </div>
                <ul className="synthesis-col-list">
                  {(s.useCases || []).map((u, ui) => (
                    <li key={ui}>
                      <Star size={14} fill={C.accentGlow} color={C.accentGlow} className="synthesis-star-icon" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="synthesis-col-label">
                  Change Actions <span className="synthesis-col-count">&middot; {(s.actions || []).length}</span>
                </div>
                <ul className="synthesis-col-list">
                  {(s.actions || []).map((a, ai) => (
                    <li key={ai}>
                      <Star size={14} fill={C.accentGlow} color={C.accentGlow} className="synthesis-star-icon" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="synthesis-thisweek animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="synthesis-thisweek-label">This Week</div>
        <h3 className="synthesis-thisweek-title">Three concrete starts</h3>
        <ol className="synthesis-thisweek-list">
          {(synthesis.thisWeek || []).map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </div>

      <div className="synthesis-actions no-print animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-ghost btn-lg">
          <ArrowLeft size={15} /> Back to Review
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => exportSynthesisDocx(state)} className="btn-ghost btn-lg">
          <Download size={15} /> Export Word
        </button>
        <button onClick={() => window.print()} className="btn-primary btn-lg">
          <Download size={15} /> Download PDF
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Add SynthesisView styles to index.css**

Append the following to the end of `src/index.css` (before the existing `@media print` block, or anywhere outside the print block):

```css
/* ========================================
   SYNTHESIS VIEW
   ======================================== */
.synthesis-container {
  width: min(100% - 24px, 1100px);
  margin: 0 auto;
  padding: 48px 12px 96px;
}

.synthesis-hero {
  background: var(--color-black);
  color: var(--color-white);
  border: 1px solid var(--color-charcoal);
  border-radius: 8px;
  padding: 32px 32px 36px;
  margin-bottom: 28px;
}
.synthesis-hero-eyebrow {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.synthesis-experimental {
  color: var(--color-white);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 3px;
  letter-spacing: 0.1em;
  font-size: 11px;
}
.synthesis-title {
  font-family: var(--font-heading);
  font-size: 36px;
  line-height: 1.18;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--color-white);
  letter-spacing: -0.02em;
  max-width: 920px;
}
.synthesis-meta {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.synthesis-lede {
  background: var(--color-surface);
  border: 1px solid var(--color-light-gray);
  border-radius: 8px;
  padding: 28px 32px;
  margin-bottom: 36px;
  font-size: 18px;
  line-height: 1.65;
  color: var(--color-dark-gray);
  font-style: italic;
  font-weight: 400;
}

.synthesis-story {
  background: var(--color-white);
  border: 1px solid var(--color-light-gray);
  border-radius: 8px;
  padding: 36px 36px 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.synthesis-story-eyebrow {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-dark-gray);
  margin-bottom: 8px;
}
.synthesis-story-num {
  color: var(--color-gray-500);
  margin-right: 6px;
}
.synthesis-story-headline {
  font-family: var(--font-heading);
  font-size: 26px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--color-black);
  margin: 0 0 22px;
  letter-spacing: -0.015em;
  max-width: 820px;
}
.synthesis-thesis {
  background: var(--color-surface);
  border: 1px solid var(--color-light-gray);
  border-radius: 8px;
  padding: 18px 22px;
  margin: 0 0 26px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--color-black);
  font-style: italic;
  font-weight: 500;
}
.synthesis-prose {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-black);
}
.synthesis-prose p {
  margin: 0 0 14px;
}
.synthesis-prose p:last-child {
  margin-bottom: 0;
}

.synthesis-evidence {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--color-light-gray);
}
.synthesis-col-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-dark-gray);
  margin-bottom: 14px;
}
.synthesis-col-count {
  color: var(--color-gray-500);
  font-weight: 600;
  margin-left: 4px;
}
.synthesis-col-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.synthesis-col-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-black);
}
.synthesis-star-icon {
  flex-shrink: 0;
  margin-top: 3px;
}

.synthesis-thisweek {
  border: 2px solid var(--color-red);
  background: var(--color-red-light);
  border-radius: 8px;
  padding: 24px 28px;
  margin-top: 12px;
  margin-bottom: 28px;
}
.synthesis-thisweek-label {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-red);
  margin-bottom: 14px;
}
.synthesis-thisweek-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  color: var(--color-black);
  margin: 0 0 18px;
  letter-spacing: -0.015em;
}
.synthesis-thisweek-list {
  list-style: none;
  counter-reset: tw;
  margin: 0;
  padding: 0;
}
.synthesis-thisweek-list li {
  counter-increment: tw;
  padding: 12px 0 12px 44px;
  position: relative;
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-black);
  border-top: 1px solid rgba(227, 6, 19, 0.18);
}
.synthesis-thisweek-list li:first-child {
  border-top: none;
  padding-top: 6px;
}
.synthesis-thisweek-list li::before {
  content: counter(tw, decimal-leading-zero);
  position: absolute;
  left: 0;
  top: 12px;
  color: var(--color-red);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-heading);
  letter-spacing: 0.05em;
}
.synthesis-thisweek-list li:first-child::before {
  top: 6px;
}

.synthesis-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .synthesis-evidence {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .synthesis-story {
    padding: 24px 20px;
  }
  .synthesis-hero {
    padding: 24px 20px 28px;
  }
  .synthesis-title {
    font-size: 28px;
  }
  .synthesis-story-headline {
    font-size: 22px;
  }
}
```

- [ ] **Step 5.3: Add print styles for synthesis**

Inside the existing `@media print { ... }` block in `src/index.css` (around line 1149), add these rules at the end of the block, just before the closing `}`:

```css
  .synthesis-actions { display: none !important; }
  .synthesis-container { padding: 24px 20px; }
  .synthesis-hero { background: white !important; border-color: var(--color-light-gray) !important; }
  .synthesis-hero * { color: black !important; }
  .synthesis-experimental { border-color: black !important; }
  .synthesis-lede,
  .synthesis-story,
  .synthesis-thesis { page-break-inside: avoid; }
  .synthesis-thisweek { page-break-inside: avoid; background: white !important; }
  .synthesis-thisweek-label { color: var(--color-red) !important; }
  .synthesis-thisweek-list li::before { color: var(--color-red) !important; }
  .synthesis-star-icon { color: #A77A00 !important; fill: #A77A00 !important; }
```

- [ ] **Step 5.4: Run build and check bundle size**

Run: `npm run build`
Expected: Build succeeds. CSS bundle size goes up modestly (less than 5 kB).

- [ ] **Step 5.5: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 5.6: Commit**

```bash
git add src/components/views/SynthesisView.jsx src/index.css
git commit -m "$(cat <<'EOF'
feat(synthesis): add SynthesisView component and styles

Renders the synthesis JSON as a one-page plan: black hero, lede pull
quote, 1-2 storylines (eyebrow, headline, thesis, prose, evidence
lists), red-bordered "This Week" box, action row. Reuses existing
design tokens. Print rules included.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: App.jsx orchestration

**Files:**
- Modify: `src/App.jsx`

Wires up the synthesis generation flow: handler that calls the API, generating-indicator routing, error handling that returns the user to Review page on failure, and routing of the new `synthesis` phase to `SynthesisView`.

- [ ] **Step 6.1: Import SynthesisView and generateSynthesis**

In `src/App.jsx`, modify the imports at the top:

```jsx
import { useState, useCallback } from "react";
import { useApp } from "./context/AppContext";
import { generatePrimitives, generatePlaybook, generateSynthesis } from "./utils/api";
import { clearState } from "./utils/storage";
import { CATEGORIES } from "./config/categories";
import { RULES } from "./config/rules";
import PaperGrain from "./components/shared/PaperGrain";
import ErrorBanner from "./components/shared/ErrorBanner";
import Header from "./components/shared/Header";
import GeneratingIndicator from "./components/shared/GeneratingIndicator";
import ConfirmModal from "./components/shared/ConfirmModal";
import IntakeView from "./components/views/IntakeView";
import PrimitivesView from "./components/views/PrimitivesView";
import PlaybookView from "./components/views/PlaybookView";
import CommitmentView from "./components/views/CommitmentView";
import SynthesisView from "./components/views/SynthesisView";
```

- [ ] **Step 6.2: Add synthesis generation state**

In the `App()` function body, after the existing `// Playbook generation` block (around line 27), add:

```jsx
  // Synthesis generation
  const [synthesisReady, setSynthesisReady] = useState(false);
  const [pendingSynthesis, setPendingSynthesis] = useState(null);
```

- [ ] **Step 6.3: Add handleGenerateSynthesis and handleSynthesisReady**

After the existing `handlePlaybookReady` callback (around line 115), add the new handlers:

```jsx
  const handleGenerateSynthesis = async () => {
    setGenErr(null);
    setSynthesisReady(false);
    setPendingSynthesis(null);
    dispatch({ type: "SET_PHASE", phase: "generating-synthesis" });
    try {
      const synthesis = await generateSynthesis(state.intake, state.primitives, state.plan);
      setPendingSynthesis(synthesis);
      setSynthesisReady(true);
    } catch (err) {
      console.error("Synthesis generation failed:", err);
      setGenErr("Something went wrong while writing your plan. This usually means a connection issue.");
      dispatch({ type: "SET_PHASE", phase: "commitment" });
    }
  };

  const handleSynthesisReady = useCallback(() => {
    if (pendingSynthesis) {
      dispatch({ type: "SET_SYNTHESIS", synthesis: pendingSynthesis });
      setPendingSynthesis(null);
    }
  }, [pendingSynthesis, dispatch]);
```

- [ ] **Step 6.4: Add error banner condition for synthesis phase**

In `App.jsx` JSX, find the existing line:

```jsx
      {genErr && (phase === "intake" || phase === "primitives") && (
        <ErrorBanner message={genErr} onDismiss={() => setGenErr(null)} />
      )}
```

Change it to include `commitment`:

```jsx
      {genErr && (phase === "intake" || phase === "primitives" || phase === "commitment") && (
        <ErrorBanner message={genErr} onDismiss={() => setGenErr(null)} />
      )}
```

- [ ] **Step 6.5: Add phase routes for synthesis**

In `App.jsx` JSX, find the existing `commitment` phase route block:

```jsx
        {phase === "commitment" && (
          <CommitmentView state={state} dispatch={dispatch} onStartOver={() => setShowStartOver(true)} />
        )}
```

After it, add the two new phase routes:

```jsx
        {phase === "commitment" && (
          <CommitmentView
            state={state}
            dispatch={dispatch}
            onStartOver={() => setShowStartOver(true)}
            onGenerateSynthesis={handleGenerateSynthesis}
          />
        )}
        {phase === "generating-synthesis" && (
          <GeneratingIndicator mode="synthesis" onReady={synthesisReady ? handleSynthesisReady : null} />
        )}
        {phase === "synthesis" && (
          <SynthesisView state={state} dispatch={dispatch} />
        )}
```

Note that the `commitment` block changes too: it now passes the `onGenerateSynthesis` prop. Make sure to remove the old `commitment` block when adding the new version.

- [ ] **Step 6.6: Run build to verify**

Run: `npm run build`
Expected: Build succeeds. The `onGenerateSynthesis` prop is unused by `CommitmentView` until Task 7, which causes no runtime error (extra props are ignored).

- [ ] **Step 6.7: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 6.8: Commit**

```bash
git add src/App.jsx
git commit -m "$(cat <<'EOF'
feat(synthesis): wire synthesis generation orchestration in App

Adds handleGenerateSynthesis and handleSynthesisReady callbacks, routes
generating-synthesis and synthesis phases to GeneratingIndicator and
SynthesisView respectively, extends error banner visibility to the
commitment phase so synthesis failures appear inline on the Review page.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: CommitmentView CTA integration

**Files:**
- Modify: `src/components/views/CommitmentView.jsx`

Adds the primary "Generate My Plan (Experimental)" CTA card at the top of the Review page (before the stats grid) and a secondary echo button in the existing action row at the bottom. Both buttons read "View My Plan" once a synthesis exists.

- [ ] **Step 7.1: Add Sparkles icon to imports**

In `src/components/views/CommitmentView.jsx`, modify the imports:

```jsx
import { Star, ArrowLeft, Download, Check, RotateCcw, Sparkles, FileText } from "lucide-react";
```

- [ ] **Step 7.2: Accept onGenerateSynthesis prop**

Change the function signature:

```jsx
export default function CommitmentView({ state, dispatch, onStartOver, onGenerateSynthesis }) {
```

- [ ] **Step 7.3: Compute synthesis-related state**

Inside the function body, after the existing `const allActions = ...` and `const starredActions = ...` lines, add:

```jsx
  const hasSynthesis = !!state.synthesis;
  const handleSynthesisClick = () => {
    if (hasSynthesis) {
      dispatch({ type: "SET_PHASE", phase: "synthesis" });
    } else if (onGenerateSynthesis) {
      onGenerateSynthesis();
    }
  };
```

- [ ] **Step 7.4: Add the top CTA card**

After the existing `commitment-hero` block (just before the `!hasAnything` ternary), insert the CTA card. Find this block:

```jsx
      <div className="commitment-hero animate-fade-in">
        <div className="commitment-header-print">
          <div className="intake-label">AI Playbook</div>
        </div>
        <h1 className="commitment-title" style={{ color: C.white }}>My AI Journey</h1>
        <p className="commitment-role" style={{ color: "rgba(255,255,255,0.55)" }} title={intake.role}>{intake.role} &middot; {date}</p>
      </div>
```

Immediately after the closing `</div>` of `commitment-hero`, add:

```jsx
      {hasAnything && (
        <div className="synthesis-cta no-print animate-fade-in" style={{ animationDelay: "0.04s" }}>
          <div className="synthesis-cta-text">
            <div className="synthesis-cta-eyebrow">{hasSynthesis ? "Your One-Page Plan" : "New"}</div>
            <h2 className="synthesis-cta-title">
              {hasSynthesis ? "View your one-page plan" : "Synthesize this into one plan"}
            </h2>
            <p className="synthesis-cta-desc">
              {hasSynthesis
                ? "Open the narrative the AI synthesized from your starred priorities."
                : "Get a one-page narrative that clusters your starred priorities into one or two storylines you can read in two minutes."}
            </p>
          </div>
          <button onClick={handleSynthesisClick} className="btn-primary btn-lg synthesis-cta-btn">
            {hasSynthesis ? (
              <>
                <FileText size={16} /> View My Plan
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate My Plan <span className="synthesis-cta-experimental">(Experimental)</span>
              </>
            )}
          </button>
        </div>
      )}
```

- [ ] **Step 7.5: Add the bottom secondary button**

Find the existing `commitment-buttons` block:

```jsx
          <div className="commitment-buttons no-print animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <button onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })} className="btn-ghost btn-lg">
              <ArrowLeft size={15} /> Back to Edit
            </button>
            <button onClick={() => exportPrimitivesDocx(state)} className="btn-ghost btn-lg">
              <Download size={15} /> Use Cases (.docx)
            </button>
            <button onClick={() => exportPlaybookDocx(state)} className="btn-ghost btn-lg">
              <Download size={15} /> Strategy (.docx)
            </button>
            <button onClick={() => window.print()} className="btn-primary btn-lg">
              <Download size={15} /> Download as PDF
            </button>
          </div>
```

Replace it with this version that adds the secondary synthesis button before "Download as PDF":

```jsx
          <div className="commitment-buttons no-print animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <button onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })} className="btn-ghost btn-lg">
              <ArrowLeft size={15} /> Back to Edit
            </button>
            <button onClick={() => exportPrimitivesDocx(state)} className="btn-ghost btn-lg">
              <Download size={15} /> Use Cases (.docx)
            </button>
            <button onClick={() => exportPlaybookDocx(state)} className="btn-ghost btn-lg">
              <Download size={15} /> Strategy (.docx)
            </button>
            <button onClick={handleSynthesisClick} className="btn-ghost btn-lg">
              {hasSynthesis ? <FileText size={15} /> : <Sparkles size={15} />}
              {hasSynthesis ? " View Plan" : " Generate Plan"}
            </button>
            <button onClick={() => window.print()} className="btn-primary btn-lg">
              <Download size={15} /> Download as PDF
            </button>
          </div>
```

- [ ] **Step 7.6: Add CTA card styles to index.css**

Append to `src/index.css`, in the SYNTHESIS VIEW block created in Task 5 (before the responsive media query):

```css
.synthesis-cta {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--color-black);
  color: var(--color-white);
  border: 1px solid var(--color-charcoal);
  border-radius: 8px;
  padding: 22px 28px;
  margin-bottom: 28px;
}
.synthesis-cta-text { flex: 1; min-width: 0; }
.synthesis-cta-eyebrow {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-red);
  margin-bottom: 6px;
}
.synthesis-cta-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--color-white);
  letter-spacing: -0.015em;
}
.synthesis-cta-desc {
  font-size: 14px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  max-width: 640px;
}
.synthesis-cta-btn { flex-shrink: 0; }
.synthesis-cta-experimental {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  font-style: italic;
  opacity: 0.7;
}
@media (max-width: 768px) {
  .synthesis-cta {
    flex-direction: column;
    align-items: flex-start;
  }
  .synthesis-cta-btn {
    width: 100%;
    justify-content: center;
  }
}
```

- [ ] **Step 7.7: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7.8: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 7.9: Commit**

```bash
git add src/components/views/CommitmentView.jsx src/index.css
git commit -m "$(cat <<'EOF'
feat(synthesis): add Generate My Plan CTA to Review page

Top primary CTA card (black background, red eyebrow, red button) shows
above the existing stats grid. Secondary echo button added to the bottom
action row. Both buttons swap label from "Generate My Plan
(Experimental)" to "View My Plan" once a synthesis exists in state.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Word export

**Files:**
- Modify: `src/utils/export.js`

The synthesis view's "Export Word" button is already wired in Task 5 to call `exportSynthesisDocx`. This task implements that function.

- [ ] **Step 8.1: Add exportSynthesisDocx**

In `src/utils/export.js`, append the new function after `exportPlaybookDocx`:

```js
export async function exportSynthesisDocx(state) {
  const { synthesis, intake } = state;
  if (!synthesis) return;

  const date = new Date(synthesis.generatedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = [
    new Paragraph({ text: synthesis.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `${intake.role} · ${date}`, italics: true, size: 22 })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: synthesis.lede, italics: true, size: 24 })],
      spacing: { after: 400 },
    }),
  ];

  (synthesis.storylines || []).forEach((s, i) => {
    const num = String(i + 1).padStart(2, "0");
    children.push(new Paragraph({
      children: [new TextRun({ text: `Storyline ${num}: ${s.eyebrowName}`, bold: true, size: 20, color: "666666" })],
      spacing: { before: 400, after: 100 },
    }));
    children.push(new Paragraph({
      text: s.headline,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: s.thesis, italics: true, size: 24 })],
      spacing: { after: 300 },
    }));
    (s.prose || []).forEach((p) => {
      children.push(new Paragraph({ text: p, spacing: { after: 200 } }));
    });
    if ((s.useCases || []).length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "AI Use Cases", bold: true, size: 22 })],
        spacing: { before: 200, after: 100 },
      }));
      s.useCases.forEach((u) => {
        children.push(new Paragraph({ text: u, bullet: { level: 0 } }));
      });
    }
    if ((s.actions || []).length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Change Actions", bold: true, size: 22 })],
        spacing: { before: 200, after: 100 },
      }));
      s.actions.forEach((a) => {
        children.push(new Paragraph({ text: a, bullet: { level: 0 } }));
      });
    }
  });

  if ((synthesis.thisWeek || []).length > 0) {
    children.push(new Paragraph({
      text: "This Week",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }));
    synthesis.thisWeek.forEach((item, i) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${String(i + 1).padStart(2, "0")}. `, bold: true }),
          new TextRun({ text: item }),
        ],
        spacing: { after: 120 },
      }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-one-page-plan.docx");
}
```

- [ ] **Step 8.2: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8.3: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 8.4: Commit**

```bash
git add src/utils/export.js
git commit -m "$(cat <<'EOF'
feat(synthesis): add Word export for one-page plan

Generates a .docx with title, italic lede, each storyline (eyebrow,
headline, italic thesis, prose, use cases list, actions list), and a
"This Week" numbered section. Mirrors the existing exportPrimitivesDocx
and exportPlaybookDocx patterns.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: End-to-end verification

**Files:** None (manual verification only)

This task confirms the entire feature works under the conditions a real user would hit. Run all of these checks before opening a PR.

- [ ] **Step 9.1: Start the local Vercel dev server**

Run: `npm run dev:vercel`
Expected: Server starts on http://localhost:3000.

- [ ] **Step 9.2: Run the happy-path flow end to end**

In the browser at http://localhost:3000:

1. Fill out all 7 intake fields. Use a realistic persona; the more detail in `failureRisks` and `successVision`, the better the synthesis quality test.
2. Click "Discover Use Cases". Wait for primitives generation.
3. Star at least 5 use cases across multiple categories.
4. Click "Continue to Strategy". Wait for playbook generation.
5. Star at least 3 change actions across multiple rules.
6. Click "Continue to Review".

Expected: You arrive at the Commitment/Review page. The new black "Synthesize this into one plan" CTA card appears between the hero and the stats grid. The button reads "Generate My Plan (Experimental)".

- [ ] **Step 9.3: Generate the synthesis**

Click "Generate My Plan (Experimental)".

Expected:
- The `GeneratingIndicator` displays in synthesis mode with the 5 steps from `SYNTHESIS_GEN_STEPS` cycling at ~2.2s each.
- The header role label hides during generation (because `isGenerating` includes `generating-synthesis`).
- After roughly 8 to 15 seconds (API latency dependent), the indicator transitions to "Your one-page plan is ready" then routes to the synthesis view.

- [ ] **Step 9.4: Verify the rendered synthesis**

On the synthesis view:
- Black hero card with the eyebrow "My One-Page Plan · Experimental", the AI-generated title, and the meta line `{role} · {date}`.
- A surface-colored italic lede paragraph below the hero.
- One or two storyline cards. Each has: numbered eyebrow ("01" or "02"), short theme name, big headline, italic thesis pull-quote, two paragraphs of prose, and a two-column evidence grid with "AI Use Cases" and "Change Actions" lists. Each list item has a gold star icon.
- A red-bordered "This Week" box with the label, "Three concrete starts" subhead, and 3 numbered items.
- An action row at the bottom: "Back to Review" (ghost), "Export Word" (ghost), "Download PDF" (red primary).

Verify there are NO em dashes anywhere in the rendered text. If you spot one, the prompt may need tightening (or an em dash slipped through; report it).

- [ ] **Step 9.5: Verify the locked/persisted behavior**

Click "Back to Review".

Expected: You return to the Commitment view. The CTA card now reads "View your one-page plan" with a "View My Plan" button (no Experimental tag). The bottom secondary button reads "View Plan".

Click "View My Plan". Expected: You return to the synthesis view with no API call. The same content appears.

- [ ] **Step 9.6: Verify the Word export**

On the synthesis view, click "Export Word".

Expected: A file `ai-one-page-plan.docx` downloads. Open it in Word or Google Docs. The document should contain: title heading, role and date in italic, the lede in italic, each storyline (storyline number/name, big headline, italic thesis, prose paragraphs, "AI Use Cases" bulleted list, "Change Actions" bulleted list), and a "This Week" heading with 3 numbered items.

- [ ] **Step 9.7: Verify the PDF export**

On the synthesis view, click "Download PDF".

Expected: The browser print dialog opens. The preview shows: black hero rendered as white with black text (per print styles), the lede, storylines (page-break-inside avoided), red-accented "This Week" box, and gold star icons rendered in dark gold (#A77A00) for paper visibility. The action row is hidden. Nav and header are hidden. Save as PDF and confirm the output is readable.

- [ ] **Step 9.8: Verify the failure case**

Open the browser devtools, go to the Network tab, and enable "Offline" mode (or block requests to `/api/synthesis-generate`). Click "Start Over" in the synthesis view (or refresh and run through the flow again until you hit the Review page). Click "Generate My Plan (Experimental)".

Expected:
- After the request fails, the user is returned to the Commitment/Review phase (not stuck in `generating-synthesis`).
- The `ErrorBanner` appears at the top of the page with the message "Something went wrong while writing your plan. This usually means a connection issue."
- The CTA button still reads "Generate My Plan (Experimental)" (failure does not lock state).
- Re-enable network and click again; the generation succeeds and the synthesis appears.

- [ ] **Step 9.9: Verify Start Over clears synthesis**

With a successful synthesis in place, click "Start Over" (from the synthesis view's action row, the synthesis CTA card on Review, or anywhere "Start Over" exists). Confirm the modal.

Expected: All state clears, including `state.synthesis`. The user returns to the intake page. After re-running the flow, the synthesis CTA again reads "Generate My Plan (Experimental)".

- [ ] **Step 9.10: Verify mobile responsive behavior**

In the browser devtools, switch to a 375px-wide mobile viewport. Navigate to the synthesis view (regenerate if needed).

Expected: 
- Hero padding tightens; title font reduces to 28px.
- Storyline padding tightens.
- Storyline headline reduces to 22px.
- Evidence grid collapses to a single column.
- CTA card on Review page stacks vertically with full-width button.
- Action row at the bottom of the synthesis view wraps cleanly.

- [ ] **Step 9.11: Run final build and lint**

Run: `npm run build && npm run lint`
Expected: Both pass with no errors.

- [ ] **Step 9.12: Open a pull request**

```bash
git push -u origin <feature-branch>
gh pr create --title "feat(synthesis): add One-Page Plan synthesis feature" --body "$(cat <<'EOF'
## Summary
- New post-Review phase: AI synthesizes intake + use cases + change actions into a one-page narrative plan with 1 to 2 storylines
- Triggered via primary CTA on the Review page; one successful generation locks the artifact (no in-app regeneration)
- New API endpoint, new view, Word and PDF export, all em-dash-free per project rules

## Test plan
- [x] Happy-path flow generates and displays a synthesis
- [x] Locked state: button changes to "View My Plan" after first success
- [x] Word export downloads and opens correctly
- [x] PDF export prints cleanly with print styles
- [x] Failure case shows ErrorBanner and stays on Review page
- [x] Start Over clears synthesis
- [x] Mobile responsive at 375px

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

This plan was written and self-reviewed against the spec at `docs/superpowers/specs/2026-05-06-one-page-plan-design.md`. The following spec sections map to tasks:

- **State shape** → Task 1
- **Phase routing infrastructure** → Task 1
- **GeneratingIndicator synthesis mode** → Task 2
- **API endpoint design + prompt structure** → Task 3
- **API client function** → Task 4
- **SynthesisView component + visual design tokens** → Task 5
- **Print styles** → Task 5 (Step 5.3)
- **App.jsx orchestration + failure handling** → Task 6
- **Review page CTA (top + bottom echo) + label switching** → Task 7
- **Word export** → Task 8
- **End-to-end verification (happy path, locked state, exports, failure, mobile)** → Task 9

No automated test framework exists in the codebase, so verification is manual via build + smoke tests. This is consistent with the existing app's quality bar.

Out-of-scope items (per spec) are deliberately not addressed: in-place editing, in-app regeneration, multiple synthesis variants, sharing, A/B testing of prompt structures, per-section regeneration, manual storyline editing.
