# AI Playbook - Project Guidelines

## Overview

Workshop tool: managers answer 7 intake questions, AI discovers personalized use cases (Phase 2), then builds a change strategy grounded in behavioral science (Phase 3), then review & export (Phase 4).

## Tech Stack

React 19 + Vite 7 + Tailwind CSS 4 + Vercel Serverless Functions. Claude Sonnet 4.6 API for generation. `docx` + `file-saver` for Word export. localStorage for persistence.

## Design System

- **Aesthetic**: Bold modern -- black/white/red, magazine editorial
- **Typography**: Montserrat only (weights 400-700). No Roboto Condensed.
- **Palette**: `#000000` bg/text, `#e30613` accent/CTAs/stars, `#00a3e0` category badges, `#fff2f3` starred bg, `#f5f5f5` surface
- Paper grain disabled. Dark hero sections. Card-based layout.

## Critical Constraints

**Phase names**: "AI Use Cases" (not Discovery/Primitives) and "Change Strategy" (not Playbook/Change Management).

**Chat brevity** (`api/chat.js`): 60-word target stated once per system prompt; max_tokens 500 is the hard ceiling. (Chat returns structured `tool_use` output since June 2026, so the old dual-format token tuning -- 250/400 -- no longer applies.) Verbosity creep is the #1 issue -- preserve constraints when modifying prompts. Adding more prompt text makes verbosity WORSE (model mirrors input energy). Use max_tokens as the hard ceiling, not prompt instructions.

**Behavioral science**: The 5 rules (Start at End, Make It Safe, Script Steps, Start Small, Make Progress Visible) are research-grounded. Don't dilute the prompts in `playbook-generate.js`.

**Validation**: Word-count thresholds (0/5/15/16+), not character count.

**Regeneration**: ConfirmModal in App.jsx warns before replacing existing primitives.

## Pitfalls

- Never use `transition: all` on `.canvas-rules` (breaks layout on chat panel close)
- Never use Roboto Condensed or any font besides Montserrat
- Never change phase names back to "Discovery" or "Playbook"
- Never break the 4-phase linear flow: Intake -> Use Cases -> Strategy -> Review
- Keep state simple: Context + localStorage, no Redux
- Keep animations subtle (0.3-0.5s, transform/opacity only)

## Component Layout

```
src/components/views/       # IntakeView, PrimitivesView, PlaybookView, CommitmentView
src/components/shared/      # Header, Toast, ConfirmModal, GeneratingIndicator, ChatDrawer, PhaseProgress
src/components/primitives/  # IdeaCard, CategorySection, AddIdeaInput
src/components/playbook/    # ActionCard, RuleSection
src/config/                 # categories.js, rules.js, constants.js
src/context/                # AppContext, ToastContext
src/utils/                  # export.js (Word export), storage.js
api/                        # primitives-generate.js, playbook-generate.js, chat.js
lib/                        # workshop.js (canonical RULES + CATEGORIES shared by src AND api), apiGuard.js
evals/                      # promptfoo configs + prompt snapshots for all 4 endpoints (keep snapshots in sync with api/ prompts)
```

**Single source of truth**: the five rules (with promptHints and chatHints) and six categories live ONLY in `lib/workshop.js`. `src/config/{rules,categories}.js` re-export them; all four api handlers import them. Never redefine them inline; the pre-lib copies had drifted.

## Git Workflow

- Feature branches + PRs. Never push directly to `master`.
- `npm run build` must pass before committing.
- `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- `master` auto-deploys to Vercel.

## AI Behavior (merged from `improving-ai` branch)

### How the AI works

Four API endpoints in `api/`:
- **`primitives-generate.js`** -- Initial use case generation (Phase 2). One-shot, no chat. Generates 12 ideas total, redistributed 1-3 per category by fit to role/helpWith/vision (every category gets at least 1; July 2026, was exactly 2 everywhere). Returns structured output via forced `tool_use` (`submit_use_cases`), migrated June 2026. max_tokens 2048.
- **`playbook-generate.js`** -- Initial strategy generation (Phase 3). One-shot, no chat. 2 actions per rule, 3 on the 1-2 rules the intake signals prioritize; the model commits via a `prioritizedRules` schema field and the server ENFORCES the counts by trimming (the model overshoots prose count limits, so the trim is the contract; July 2026). max_tokens 4096. Returns structured output via Anthropic `tool_use` (forced `tool_choice`). Has quality check #5 (anti-hallucination).
- **`synthesis-generate.js`** -- One-page plan synthesis (Phase 4). One-shot, no chat. Returns structured output via Anthropic `tool_use` (forced `tool_choice` on `submit_one_page_plan`). max_tokens 4096.
- **`chat.js`** -- Ongoing chat for both phases. Two system prompt builders: `buildPrimitivesSystem()` for use cases, `buildPlaybookSystem()` for strategy. max_tokens 500. Returns structured output via forced `tool_use` (`reply_with_ideas` tool with `content` + `ideas` fields), migrated June 2026 from the dual prose + `---IDEAS---` format whose parsing could silently drop the idea cards.

All four endpoints now use forced `tool_use` for structured output. User-provided text (intake fields, idea/action lists) is wrapped in XML-style tags (`<manager_profile>`, `<current_ideas>`, etc.) in every prompt to keep data distinct from instructions. All four reject cross-origin POSTs via `lib/apiGuard.js` (ops scripts must send an `Origin` header matching the deployment host).

### Changes made (July 2026, feat/quality-pass)

- **Quotas redistributed within the lighter-output budget** -- primitives: 12 ideas total, 1-3 per category weighted by fit (the exactly-2 quota forced filler in stretch categories); playbook: 2 per rule + 3 on the 1-2 prioritized rules, server-enforced via trim. The prompt's prioritization instructions were previously unexpressible under the fixed schema.
- **Chat transcript fidelity** -- the model heard every user message twice (client appended it to history AND the server appended `userMessage`; server now dedupes a trailing duplicate for old clients and the client stopped appending). Previously suggested ideas are serialized back into replayed assistant turns as `[Suggested with this reply: ...]` so the model stops re-suggesting them; both prompts instruct against re-suggesting. Starred use cases reach playbook chat as category titles, not raw ids.
- **Playbook chat prompt ships only the current rule's behavioral science** (`chatHint` in lib/workshop.js) instead of all five rules; per the verbosity learnings, shorter prompt, tighter replies.
- **Missing intake fields wired in** -- playbook prompt gets responsibilities + helpWith; primitives prompt gets successVision (it usually names the exact use case the manager cares about).
- **Big Move staleness** -- `contentVersion` bumps on every idea/action/star mutation; `SET_SYNTHESIS` records `synthesisVersion`. A mismatch flips the Review CTA to "Regenerate My Big Move" (with a view-previous link). Was: view-only forever, silently stale after edits.
- **Phase 3 star gate** -- Review requires 3 starred actions (MIN_STARS_FOR_REVIEW), mirroring Phase 2; synthesis prompt explicitly builds the move around starred items.
- **Intake gates on substance** -- role needs 4+ words, the three long fields 6+ (matching the existing 0/5/15 hint bands); truthiness-only gating let "x" through to generation.
- **API origin guard** -- `rejectForeignOrigin` on all four handlers; the deployed endpoints no longer spend the Anthropic key for anyone with the URL. Chat history is also capped server-side (last 40).
- **Idea-quality bar in primitives prompt** -- ideas must name input and output artifacts ("paste X, get Y"), be copy-paste tryable at the TEAM's fluency (no integrations for not-yet-started teams), include a couple of non-obvious ones, and treat hard constraints in failureRisks as generation constraints. A/B (evals/quality-ab-model.mjs, Opus judge, order-swapped pairwise): the upgraded prompt beat the old one 4/5 with 0 losses; Sonnet 5 vs 4.6 on the same prompt was 3 wins / 1 loss / 1 tie for Sonnet 5, absolute scores flat, so the model swap is NOT the quality lever; prompt and grounding are. Next quality lever if needed: a curated per-function library of gold use cases injected as background knowledge.
- **Playbook anchor roles** -- the pilot workflow belongs in Rules 3-5 plus at most one Rule 1 action; Rule 2 stays people-only. Prompt-level dominance caps measurably do NOT hold (three attempts, counts unchanged at 5-7/12); what improved is placement (safe/people actions are clean). Remaining concentration is mostly the methodology's own one-pilot chain. If further reduction is ever needed, it must be structural (second-pass rewrite), not prompt text.
- **Journey review harness** -- `node evals/journey-review.mjs` plays 3 personas through the FULL workshop against the live API (local `npm run dev:vercel` by default, `BASE_URL=` for previews): generate ideas, simulated starring, 2-turn chat with hard pushback, strategy, pushback on the dominant workflow, Big Move. LLM judge scores every stage; mechanical checks catch repetition and workflow dominance. `node evals/journey-report-html.mjs` renders the run into a self-contained HTML review page. This is the tool for reviewing output quality across personas; don't click through the app manually.
- **Eval suite resynced** -- all configs/snapshots in `evals/` were 1-3 schema generations stale (text-JSON primitives, `---IDEAS---` chat, lede/storylines synthesis). Now mirror the live prompts and tool_use formats. Word-cap assertions carry ~10-20% tolerance because the model estimates rather than counts. Run with `npx promptfoo eval -c <cfg> --grader anthropic:messages:claude-sonnet-4-6 --no-write` (the `--no-write` avoids a promptfoo sqlite serialization crash).
- **Key learning: schema maxItems + prose count instructions do NOT control counts.** Even with a committed `prioritizedRules` field and an explicit count checklist, the model hands 3 actions to extra rules and writes 26-31 word actions. Deterministic server-side trimming is the only reliable count control (the structured-output sibling of "max_tokens is the only hard brevity control").

### Changes made (June 2026)

- **`chat.js` migrated to `tool_use`** -- The last text-mode parser. Forced `reply_with_ideas` tool returns `{content, ideas}` as a guaranteed structure; the `---IDEAS---` separator parsing and all three fallback paths were deleted. Parse failures used to silently drop idea cards (coaching text arrived, addable suggestions didn't). max_tokens 400 -> 500 for tool-call overhead. Verified live in both modes.
- **Contradictory closing-question instruction removed** -- `buildPlaybookSystem` said both "push them deeper" (old) and "open a DIFFERENT angle" (the Feb 2025 fix for repetitive chats). The old line was never deleted, so the model resolved the conflict unpredictably per turn. Kept "different angle."
- **Synthesis examples no longer teach invented deadlines** -- Both good `bigMoveTitle` examples contained timeframes ("within six weeks," "by July") the manager never stated, training the model to fabricate deadlines on the most visible line of the plan. Timeframes removed, explicit no-invented-deadlines rule added, one example swapped to an engineering function to reduce customer-success vocabulary bias.
- **User text wrapped in XML-style tags in all four prompts** -- Intake fields and idea/action lists now sit inside `<manager_profile>`, `<current_ideas>`, `<current_actions>`, `<all_actions>`, `<starred_use_cases>`, `<ai_use_cases>`, `<change_actions>` so free-text answers can't bleed into instructions; mild prompt-injection resistance for free.

### Changes made (May 2026)

- **`playbook-generate.js` migrated to `tool_use`** -- Previously asked the model for a JSON object in free text and ran `JSON.parse` on a regex-extracted substring. Failed intermittently under concurrent load (workshop scenarios: ~3/10 users bounced from Phase 3 back to Phase 2 with "connection issue" toast). Root cause was the contract, not the parser: any preamble, trailing prose, or stray brace from the model broke parsing. Replaced with a forced `tool_use` call against a JSON Schema for the plan shape. The API guarantees a structured `input` object on the `tool_use` content block, so the entire parsing layer (regex + `JSON.parse` + brace handling) was deleted. Same prompt, same model, same idea quality; reliable transport. Verified 10/10 concurrent API calls and 5/5 real-browser end-to-end runs after deploy.
- **`playbook-generate.js` max_tokens 2048 -> 4096** -- Headroom for any preamble Claude generates alongside the tool call. You only pay for tokens generated, not the ceiling.
- **`playbook-generate.js` error logging** -- On the rare path where `tool_use` is missing from the response, log `stop_reason`, the list of returned content block types, and the first 1000 chars of the raw response. Future failures surface ground truth in Vercel logs instead of forcing another investigation cycle.
- **`synthesis-generate.js` migrated to `tool_use`** -- Mirror of the `playbook-generate.js` migration. The synthesis endpoint was the only remaining HARD ERROR path (free-text `JSON.parse` with no fallback → HTTP 500 → user bounced back to Review with a generic toast). Now uses a `submit_one_page_plan` tool with a JSON Schema covering title/lede/storylines (1-2)/thisWeek (exactly 3). Same prompt, same model. max_tokens bumped 3000 -> 4096 for tool-call preamble headroom. (Schema since replaced by `bigMoveTitle` + `actions` (4-6) in the June 2026 lighter-output release.)
- **localStorage quota handling** -- `saveState()` in `src/utils/storage.js` previously silently swallowed `QuotaExceededError`, so users with long chats could lose work on refresh without any signal. Now detects quota errors (cross-browser: `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, code 22/1014) and dispatches a `STORAGE_QUOTA_EVENT` window event. `App.jsx` listens for it and surfaces a toast pointing the user at the Word export. Reducer also caps each chat thread at 30 messages, preserving the opener (index 0) and trimming the tail. This is the only behavior change visible to long-running power users.
- **Retry UX on generation failures** -- `ErrorBanner` always had an `onRetry` prop but it was never wired. `App.jsx` now keeps a `lastFailureRef` of the last failed generation (kind + args) and exposes a `handleRetry`. Banner shows on Phase 3 as well (was previously skipped). Error copy distinguishes timeout / network / 5xx server / 4xx client via the new `describeApiError` helper in `src/utils/api.js`.

### Changes made (Feb 2025)

- **max_tokens tuned to 250** -- Dropped from 512. Tested at 200 (too tight, cuts off JSON ideas), 250 is the sweet spot. This is the only reliable brevity control -- prompt instructions alone don't work.
- **Static chat openers** -- `ChatDrawer.jsx` no longer fires an API call on open. Shows instant static greeting ("Let's explore [topic]. What would be most useful to dig into?"). User speaks first, zero latency.
- **Chat angle diversity** -- Closing questions in both `buildPrimitivesSystem` and `buildPlaybookSystem` instruct the AI to pivot to a different angle, not drill deeper into the same direction.
- **Anti-hallucination constraint** -- Added to `chat.js` (both prompt builders, instruction #5) and `playbook-generate.js` (quality check #5). AI must never fabricate experiences, metrics, or outcomes. If suggesting they share a story, script the format ("share your experience"), not the content ("explain how automating X saved Y hours").
- **Mission context** -- Both chat system prompts open with a one-line workshop context so the AI understands the bigger journey (intake -> use cases -> strategy).

### Key learnings for future AI work

- **max_tokens is the only hard brevity control.** Prompt instructions ("60 words max! Count them!") are unreliable. The model estimates, doesn't count.
- **Long system prompts cause verbose responses.** The model mirrors input energy. To get shorter answers, trim the prompt rather than adding "be brief" instructions on top.
- **The AI fabricates personal anecdotes** when the prompt asks for specificity but the intake data doesn't include actual experiences. Fix by constraining output ("never invent"), not by adding more intake fields.
- **200 max_tokens is too tight** for the dual-format response (prose + JSON). The model writes good 60-word prose but runs out of tokens before the ideas JSON. 250 works. 512 gives too much runway.
- **Static openers > auto-generated first messages.** Removing the initial API call on chat open eliminates 4-6 seconds of latency and lets the user drive the conversation direction.
- **Use `tool_use` for structured output, not free-text JSON.** Free-text JSON is a fragile contract: any model preamble, trailing prose, or stray brace breaks `JSON.parse`. No regex or "robust parser" fully defends that boundary. When the response must be a structured object, define a JSON Schema and force it via `tool_choice: { type: "tool", name: ... }`. Deletes the entire parsing layer and removes a whole class of intermittent failures. Workshop-load testing went from ~7/10 to 10/10 after migrating `playbook-generate.js` this way. Applies equally to `primitives-generate.js` and `synthesis-generate.js` if their text-mode parsers ever start failing.

## Design History

Current design is bold-modern (black/white/red editorial). The original design is preserved at tag `v1-original-design`.

---

**Maintainer**: Yonat | **AI**: Opus 4.6 (dev) / Sonnet 4.5 (API)
