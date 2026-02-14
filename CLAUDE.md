# AI Playbook - Project Guidelines

## Overview

Workshop tool: managers answer 7 intake questions, AI discovers personalized use cases (Phase 2), then builds a change strategy grounded in behavioral science (Phase 3), then review & export (Phase 4).

## Tech Stack

React 19 + Vite 7 + Tailwind CSS 4 + Vercel Serverless Functions. Claude Sonnet 4.5 API for generation. `docx` + `file-saver` for Word export. localStorage for persistence.

## Design System

- **Aesthetic**: Bold modern -- black/white/red, magazine editorial
- **Typography**: Montserrat only (weights 400-700). No Roboto Condensed.
- **Palette**: `#000000` bg/text, `#e30613` accent/CTAs/stars, `#00a3e0` category badges, `#fff2f3` starred bg, `#f5f5f5` surface
- Paper grain disabled. Dark hero sections. Card-based layout.

## Critical Constraints

**Phase names**: "AI Use Cases" (not Discovery/Primitives) and "Change Strategy" (not Playbook/Change Management).

**Chat brevity** (`api/chat.js`): 60-word hard limit, no preamble/recap/filler, max_tokens 512. Verbosity creep is the #1 issue -- preserve constraints when modifying prompts.

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

## Design History

Current design is bold-modern (black/white/red editorial). The original design is preserved at tag `v1-original-design`.

---

**Maintainer**: Yonat | **AI**: Opus 4.6 (dev) / Sonnet 4.5 (API)
