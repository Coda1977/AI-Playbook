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

**Chat brevity** (`api/chat.js`): 60-word hard limit, no preamble/recap/filler, max_tokens 250 (tested: 200 cuts off ideas JSON, 512 allows verbose prose). Verbosity creep is the #1 issue -- preserve constraints when modifying prompts. Adding more prompt text makes verbosity WORSE (model mirrors input energy). Use max_tokens as the hard ceiling, not prompt instructions.

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
```

## Git Workflow

- Feature branches + PRs. Never push directly to `master`.
- `npm run build` must pass before committing.
- `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- `master` auto-deploys to Vercel.

## AI Behavior (merged from `improving-ai` branch)

### How the AI works

Four API endpoints in `api/`:
- **`primitives-generate.js`** -- Initial use case generation (Phase 2). One-shot, no chat. Generates 2-3 ideas per 6 categories. max_tokens 2048.
- **`playbook-generate.js`** -- Initial strategy generation (Phase 3). One-shot, no chat. Generates 2-3 actions per 5 rules. max_tokens 4096. Returns structured output via Anthropic `tool_use` (forced `tool_choice`), so the response is a guaranteed-shape JSON object rather than parsed free text. Has quality check #5 (anti-hallucination).
- **`synthesis-generate.js`** -- One-page plan synthesis (Phase 4). One-shot, no chat. Returns structured output via Anthropic `tool_use` (forced `tool_choice` on `submit_one_page_plan`). max_tokens 4096.
- **`chat.js`** -- Ongoing chat for both phases. Two system prompt builders: `buildPrimitivesSystem()` for use cases, `buildPlaybookSystem()` for strategy. max_tokens 400. Still uses dual prose + `---IDEAS---` + JSON format (graceful fallback to empty ideas if parse fails).

Chat responses use a dual format: prose text + `---IDEAS---` separator + JSON array of ideas/actions. The separator is parsed server-side to split conversational text from addable suggestions.

### Changes made (May 2026)

- **`playbook-generate.js` migrated to `tool_use`** -- Previously asked the model for a JSON object in free text and ran `JSON.parse` on a regex-extracted substring. Failed intermittently under concurrent load (workshop scenarios: ~3/10 users bounced from Phase 3 back to Phase 2 with "connection issue" toast). Root cause was the contract, not the parser: any preamble, trailing prose, or stray brace from the model broke parsing. Replaced with a forced `tool_use` call against a JSON Schema for the plan shape. The API guarantees a structured `input` object on the `tool_use` content block, so the entire parsing layer (regex + `JSON.parse` + brace handling) was deleted. Same prompt, same model, same idea quality; reliable transport. Verified 10/10 concurrent API calls and 5/5 real-browser end-to-end runs after deploy.
- **`playbook-generate.js` max_tokens 2048 -> 4096** -- Headroom for any preamble Claude generates alongside the tool call. You only pay for tokens generated, not the ceiling.
- **`playbook-generate.js` error logging** -- On the rare path where `tool_use` is missing from the response, log `stop_reason`, the list of returned content block types, and the first 1000 chars of the raw response. Future failures surface ground truth in Vercel logs instead of forcing another investigation cycle.
- **`synthesis-generate.js` migrated to `tool_use`** -- Mirror of the `playbook-generate.js` migration. The synthesis endpoint was the only remaining HARD ERROR path (free-text `JSON.parse` with no fallback → HTTP 500 → user bounced back to Review with a generic toast). Now uses a `submit_one_page_plan` tool with a JSON Schema covering title/lede/storylines (1-2)/thisWeek (exactly 3). Same prompt, same model. max_tokens bumped 3000 -> 4096 for tool-call preamble headroom.
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
