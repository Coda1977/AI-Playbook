# Redesign branch status (handoff, 2026-07-13)

**Branch:** `feat/redesign-2026-07` · **PR:** https://github.com/Coda1977/AI-Playbook/pull/9 (open, awaiting Yonatan's merge call)
**Commit range:** `46fed03..f2b314b` (26 commits) · master tagged `pre-redesign` before branching; original design also preserved at `v1-original-design`.

## What this branch is

The complete visual + structural redesign per `docs/superpowers/specs/2026-07-12-redesign-design.md` (read section 14: post-build amendments) and `docs/superpowers/plans/2026-07-12-redesign.md`. Canonical visual reference: `Mock Ups/ai-playbook-miro-restructured-mockup.html`.

Summary: white/ink/salmon(#FFB5AB)/star-blue(#ACD8FF) tokens + self-hosted Hanken Grotesk; rail-focus-tray app-shell boards (>=1180px fixed frame, panes own their scroll; <=1179px document scroll with chip rail + tray fab/bottom-sheet); shared GateBar (single primary action per screen); inline chat in the focus column; light checklist generating screens; editorial Review (all starred items always visible, Big Move card last); dark Big Move poster with light print variant; docx exports in the new palette; delete with 6s Undo; projection type scale (16px base / 1.2 ratio / 12.5px floor); accessibility hardening (dialog semantics, live regions, label wiring, focus rings incl. white-on-ink).

## How it was built and verified

Subagent-driven execution of the 14-task plan (fresh implementer + independent reviewer per task, fix loops), a final whole-branch review (its fix sweep closed a green-icon palette leak, low-contrast gray text, CTA casing, danger-red generating pill, gold print stars), then three owner-feedback rounds (rounds 2-3 in the last four commits). Per-task commits and carried notes: `.superpowers/sdd/progress.md` (gitignored, in the branch working tree). `npm run build` + `npm run lint` green on every commit; live browser verification per task plus controller passes at 1440/1200/390 widths.

## Before merging (checklist)

1. Yonatan reviews the Vercel preview from PR #9 (full flow works there; local `npm run dev` has no /api functions).
2. For sharing the preview with a group: check Vercel Project → Settings → Deployment Protection (if Standard Protection is on, outside viewers hit a Vercel login; disable for previews or use a shareable link).
3. Merge PR #9 → master auto-deploys to production.

## Post-merge backlog (owner-approved deferrals)

- "Jump to your Big Move ↓" anchor near the Review heading (peak-end reachability with long lists).
- Cancel/escape action during generation (45-105s wait currently has no exit; wire to the existing error-revert path + AbortController).
- URL history / deep links per phase (fold into the three-modes plan: `MERGE-THREE-MODES.md`).
- Chat draft persistence; intake debounce flush on unload; focused-category persistence across refresh (currently by-design view-local).
- Dead-code sweep: unreachable ChatDrawer overlay branch, unused `.btn-primary`/`.btn-secondary`/`.btn-generate`/`.kicker`/`.action-removing` CSS; legacy `.btn-ghost` empty states; pre-existing "Back to Discovery" copy in CommitmentView's empty state (violates phase-name rule, predates redesign); `showToast("")` empty-bubble guard.

## Load-bearing implementation facts (also in CLAUDE.md Pitfalls)

- Colors live in BOTH `src/index.css` `@theme` AND the `C` object in `src/config/constants.js`: change together.
- GateBar must stay a direct child of `.canvas-rules`; the app-shell flex chain needs `min-height: 0` at `.canvas-inner-board`/`.board3`/`.tray-body`.
- `AddIdeaInput`/`AddActionInput` stay keyed by container id.
- Board three-column breakpoint is 1180px; header is 57px + 1px border (layout calcs subtract 58).
- `synthesis.generatedAt` is stamped at SET_SYNTHESIS; poster and docx read it.
