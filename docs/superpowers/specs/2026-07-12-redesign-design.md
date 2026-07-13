# AI Playbook Redesign: Design Spec

**Date:** 2026-07-12
**Status:** BUILT (see section 14 for post-build amendments; branch status in `docs/sessions/2026-07-13-redesign-branch-status.md`)
**Reference mockup:** `Mock Ups/ai-playbook-miro-restructured-mockup.html` (the single source of visual truth; open it in a browser next to this doc)
**Supersedes:** the bold-modern black/white/red design system described in CLAUDE.md (CLAUDE.md gets updated in the final phase; see "CLAUDE.md amendments")

## 1. Summary

Reskin plus restructure of all four phases. The skin: white canvas, ink, salmon accent, blue stars, Hanken Grotesk, black pill CTAs (Miro-derived DNA, reduced palette). The bones: the idea/action boards become a rail-focus-tray layout with one category or rule in focus at a time, starred items accumulate in an always-visible tray, every screen has exactly one primary action living in the gate bar, and the Big Move becomes a full-page poster. Phase flow, state model, APIs, and all copy are unchanged.

## 2. Scope and non-goals

**In scope:** all visual styling; layout of the five views; chat placement; generating screens; Word/PDF export styling; mobile layout (currently broken in production, treated as first-class).

**Not in scope (explicitly unchanged):** the 4-phase linear flow; phase names ("AI Use Cases", "Change Strategy"); all microcopy, labels, hints, and questions (word-for-word as today); the intake's 7 fields and validation bands; star gates (3 starred ideas unlock strategy, MIN_STARS_FOR_REVIEW=3 for review); Context + localStorage state model; the four API endpoints and their prompts; chat transcript logic; contentVersion staleness behavior; ConfirmModal-before-regenerate behavior.

## 3. Design tokens

Single source: a tokens block (CSS custom properties) in the global stylesheet. No component may hardcode a hex.

### Color

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#FFFFFF` | page background |
| `--surface` | `#F7F8FA` | quiet panels (rule-science inset, rail hover, rail note) |
| `--surface-soft` | `#FAFBFC` | gate bar background |
| `--hairline` | `#E0E2E8` | default borders |
| `--hairline-soft` | `#EEF0F3` | quiet dividers, card borders |
| `--hairline-strong` | `#C7CAD5` | input borders, ghost button borders |
| `--ink` | `#1C1C1E` | text, primary buttons, dark surfaces |
| `--slate` | `#555A6A` | secondary text |
| `--steel` | `#6B6F7E` | tertiary text |
| `--stone` | `#8E91A0` | muted labels, placeholders |
| `--accent` | `#FFB5AB` | salmon: brand mark, kickers/eyebrows, generating progress, Big Move numerals, done-step checks |
| `--accent-light` | `#FFDEDA` | accent tint (spinner track) |
| `--accent-surface` | `#FFF0EE` | eyebrow badge bg, Input Guidance bg |
| `--accent-dark` | `#A8513F` | accent-colored TEXT on light surfaces (kickers) |
| `--star` | `#ACD8FF` | blue: star button fills, starred card borders, tray star chip |
| `--star-light` | `#DDEEFF` | starred card background |
| `--star-surface` | `#EFF7FF` | tray header background |
| `--star-dark` | `#2F669D` | star GLYPHS and text on light surfaces (tray stars, rail counts, priority stars) |
| `--danger` | `#C6453C` | destructive actions and error states ONLY (delete confirm, ErrorBanner). Never decorative. |

Rules: accent means "the product speaking" (brand, guidance, progress, celebration). Star means "the user's commitments" and appears nowhere else. Red exists only as `--danger`. No green anywhere, including toasts (success toast = ink surface, white text). No other hues.

### Typography

- Family: **Hanken Grotesk** (Google Fonts, OFL license), weights 400/500/600/700. Fallback: `"Noto Sans", -apple-system, sans-serif`. This replaces Montserrat (CLAUDE.md amendment required).
- Scale (desktop): page h1 `clamp(34px, 4vw, 48px)/500/-1px`; board title 26/600; focus heading 30/600; card/action text 15 to 16.5/500 (starred: 600); body 15 to 16/400; micro-labels 11/600/uppercase/+0.5px tracking; buttons 14/600.
- Big Move poster title: `clamp(44px, 6.2vw, 84px)/600/-2.2px`, line-height 1.02, max-width 15ch.
- Primary CTAs are never smaller than 14px (fixes the old 13px CTAs).

### Shape, spacing, elevation

- Radius: 999px all buttons and chips (pill); 8px inputs; 12px small options; 16px cards and field cards; 20px tray; 24px+ dark hero surfaces (28px Big Move callout).
- Spacing on an 8px-based scale (4/8/12/16/24/32/40/56). Related items tight (8 to 12px), sections generous (32 to 56px). No arbitrary values.
- Elevation: hairline borders, not shadows. Shadows only on overlays (modal, tray bottom-sheet on mobile).
- Motion: 0.3 to 0.5s max, transform/opacity only (existing pitfall rules stand, including no `transition: all`).

## 4. Global chrome

### Header (`Header.jsx` + `PhaseProgress`)

White bar, hairline-soft bottom border. Left: salmon rounded square (16px) + "AI Playbook" 700. After intake: role snippet, truncated, behind a hairline separator. Right: the four steps as pills: upcoming = outline pill with numbered circle; active = ink pill, white text; done = outline pill, ink text, ink circle with accent check. Phase names exact.

### Gate bar (new shared component, replaces per-view footers)

Sticky bottom bar, `--surface-soft`, hairline-soft top border. Three zones: **left** status ("★ 3 of 12 starred · strategy unlocked" / "7 of 7 fields"), **center** reassurance line (existing copy: "Ready when you are", "Ready to discover your use cases"), **right** the actions: ghost pills for secondary (Export, Start over) and exactly ONE ink pill primary per screen (Discover use cases / Continue to strategy / Continue to review). This is the only place primary actions live on working screens.

### Generating screens (restyle of `GeneratingIndicator`)

Light, centered, working-screen quiet. Eyebrow badge (accent-surface) naming the destination step; heading ("Discovering your use cases"); subline; then the checklist: each category (or rule, for phase 3) as a row with a 22px circle: done = ink circle with accent check; current = accent spinner (accent-light track, accent top, 0.9s); pending = hairline circle, stone text. No dark interstitials anywhere mid-flow.

## 5. Views

### 5.1 IntakeView

Structure unchanged, restyled. Eyebrow badge + h1 + lede. Two-column grid: fields left (max-width column), **Input Guidance** right as a sticky accent-surface card (20px radius) with the four existing tips. Field cards: white, 16px radius, hairline-soft border, 24px padding; label 600 + question line in steel + input. Hints: neutral steel for "Good start - keep going for best results."; ink 600 with a star-dark ★ prefix for "Great detail - this will help create a strong plan.". Never red. helpWith chips: outline pills, selected = ink pill with ✓. Fluency options: bordered 12px rows; selected = 2px ink border + `--surface` background + filled radio. The old floating left progress rail is dropped; the gate bar's "N of 7 fields" carries progress. Gate: primary "Discover use cases".

### 5.2 PrimitivesView: the board (rail-focus-tray)

Replaces the six-section tower. Grid `240px / 1fr / 308px`, 32px gaps. Page header: h2 "AI Use Cases" + the existing coach line.

- **Rail** (new `BoardRail`): micro-label "Six categories"; one row per category: index (01 to 06), name, and either idea count (stone) or `★n` starred count (star-dark). Active row = ink pill, white text, star count in `--star`. Below, a `--surface` note: "12 ideas total. Visit every category; star freely." Rail is sticky.
- **Focus** (refactor of `CategorySection` + `IdeaCard`): kicker "Category 01 of 06" (accent-dark), category h2, subtitle, description. Ideas as cards: 16px radius, hairline border, 20px padding, text 16.5/500; star button = 42px circle, outline at rest, filled `--star` with ink glyph when starred; starred card = `--star-light` background + `--star` border + text 600. Edit/delete icons appear on hover only (and on focus-visible for keyboard). Add row (`AddIdeaInput`): dashed 16px card with inline input + ghost pill "Brainstorm with AI". Bottom right: one ghost pill "Next category: {name} →" cycling through categories. No other footer content.
- **Tray** (new `CommitmentTray`): sticky card, 20px radius, hairline border. Header on `--star-surface`: 26px `--star` circle with ink star, "Your starred ideas" 600, right-aligned "n of 12" (star-dark). Body: one row per starred item (13.5/500, dashed dividers): star-dark ★, text, source category in stone small. Body scrolls internally past 44vh. Footer: hairline-soft top border, one status line ("3 starred · every star enriches the plan."). No buttons, no links: the tray displays, the gate bar acts.
- Starring an idea animates it into the tray (single 0.3s transform/opacity; respect reduced-motion by skipping).
- Gate: "★ n of 12 starred · strategy unlocked" | "Ready when you are" | Export ghost, Start over ghost, "Continue to strategy" primary. Start-over keeps ConfirmModal.

### 5.3 Chat (refactor of `ChatDrawer` into an inline panel)

Trigger: the "Brainstorm with AI" ghost pill (or "Go deeper with AI" in phase 3). The panel opens **inside the focus column**, below the add row: 16px radius, 1.5px ink border. Header: "Brainstorm with AI · {category}" + "⤢ Expand" + "✕ Close". Body: min height ~40vh, max 60vh, internal scroll, newest visible; user messages = ink bubbles right (16/16/4/16 radius); assistant messages = plain ink text left; suggested ideas = dashed 12px cards with the idea text + ghost "+ Add idea" button (adds to the focused category, star-able immediately). Input row: pill input + ink pill Send. Expand = panel grows to the full focus-column height (rail and tray untouched). The tray must never be covered, at any width. Static opener message behavior unchanged.

### 5.4 PlaybookView

Identical bones to 5.2 with rules instead of categories. Rail lists the five rules with starred counts. Focus: kicker "Rule 01 of 05", rule h2, the rule description in a `--surface` inset panel (14.5, slate), then action cards identical to idea cards. Tray header becomes "Your priorities" with total count; body groups: "Strategy actions · n" first, then "From your use cases · n" (titles in stone micro-caps). Gate: "10 actions · 5 rules · ★ n starred" | Start over ghost | "Continue to review" primary.

### 5.5 CommitmentView (Review)

Top: h1 "My AI Journey" + byline (role snippet + date). No metric tiles, no summary sentence. Then two `prior-card` columns (20px radius): **"AI Use Cases"** (starred ideas, each row: star-dark ★, text, source category in stone micro-caps right) and **"Change Strategy"** (starred actions with "Rule n" tags). Past 5 rows a column collapses behind "Show all n ▾". Then the actions row: "← Back to edit" left; right: ghost "More exports ▾" (menu: Use Cases .docx, Strategy .docx) + primary ink pill "Download as PDF". Centered quiet "↺ Start over with new intake". **Last element on the page:** the Big Move card: ink, 28px radius, 34px padding: h3 "Your big move" + "Open the narrative the AI synthesized from your starred priorities." + white pill button right. Button label is "Open →", or "Regenerate →" when contentVersion is newer than synthesisVersion (existing staleness logic; the view-previous link keeps its current behavior inside the opened view).

### 5.6 SynthesisView (Big Move)

The one celebration screen. Full-page ink surface under the header (no page padding, no card frame). Accent-filled eyebrow badge "Your Big Move"; poster-scale title; the 4 to 6 actions as a numbered list: accent numerals (01 to 05), white 17.5/500 text, rgba-white hairlines, max-width 760px. Footer row: byline + "← Back to review" muted left; "Export Word" quiet text + white pill "Download PDF" right.

## 6. Mobile (below ~1000px; must work at 390px)

- Header: role snippet hidden; steps collapse to numbered circles only (labels hidden); no overlaps at 390px (this is the P0 production bug: verify explicitly).
- Board: single column. Rail becomes a horizontally scrollable chip row under the page title (active chip = ink pill, chips show ★n). Focus takes full width. **Tray collapses to a floating pill** (bottom right, above the gate bar: `--star` circle + "n" count); tapping opens the tray as a bottom sheet (scrim + shadow allowed here) with the same content. The gate bar stays fixed at the bottom, actions wrap to two rows if needed, primary always visible without scrolling.
- Chat: panel takes the full focus column width; Expand makes it full-screen minus header; tray pill stays visible above it.
- Intake: guidance card moves above the fields (static, not sticky). Review columns stack. Big Move poster: title scales to clamp floor, actions single column.
- Touch targets 44px minimum (star buttons already 42px: bump to 44px).

## 7. Exports

- **PDF** (print path): print stylesheet renders the Big Move as the poster in a **light print variant** (decided): white paper, ink text, accent numerals, poster layout and typography preserved. One page. The on-screen dark poster is screen-only.
- **Word** (`utils/export.js`, docx lib): restyle to the new system within docx limits: Hanken Grotesk named (falls back if not installed), ink headings, accent-dark kickers, star-dark ★ glyphs for starred items, no red, no Montserrat. Structure of the documents unchanged.

## 8. States and edge cases

- **Empty tray** (nothing starred yet): body shows one italic stone line: "Star ideas and they collect here." Gate status shows "0 starred · star at least 3 to unlock strategy" with primary disabled.
- **Many stars (20+)**: tray body scrolls internally; Review columns collapse past 5 with "Show all n ▾"; exports always include everything.
- **Delete idea/action (with undo, decided in scope)**: icons hover-revealed, `--danger` on hover. Deleting removes the item immediately (no confirm modal) and raises a toast: "Idea deleted" / "Action deleted" with an **Undo** button, visible ~6s. Undo restores the item at its original position with its starred state intact. Mechanics: the delete handler stashes `{item, categoryOrRuleId, index}`; Undo dispatches a new `RESTORE_ITEM` reducer action that splices it back. contentVersion bumps on both delete and restore (existing staleness logic just works). One undo depth is enough; a second delete replaces the pending one.
- **Errors**: ErrorBanner restyled: `--danger` left icon, ink text on white, hairline border, retry ghost pill. Toasts: ink surface, white text; error toast adds a `--danger` icon. No green success states.
- **Regeneration warning** (ConfirmModal): white card, 16px radius; confirm button is `--danger` filled only when the action destroys content, otherwise ink.
- **Chat length**: server cap (40) and thread trim (30) unchanged; the panel scrolls.

## 9. Accessibility

WCAG AA minimum, 7:1 aimed for body text (projector rooms). Star state never encoded by color alone: filled vs outline glyph + starred-card border + text weight. Focus-visible rings (2px ink offset) on all interactive elements including star buttons and rail items. Keyboard: rail items and star buttons tabbable; chat Expand/Close reachable. `prefers-reduced-motion` disables the star-to-tray animation and the spinner rotation (static dot instead).

## 10. Component work map

| Component | Work |
|---|---|
| `Header.jsx`, `PhaseProgress` | restyle (pills, salmon mark, done-checks) |
| NEW `GateBar` | shared; replaces per-view footer bars |
| `GeneratingIndicator` | restyle to checklist progress (categories/rules) |
| `IntakeView` | restyle; drop floating progress rail |
| `PrimitivesView` | restructure to board; NEW `BoardRail`, NEW `CommitmentTray`; `CategorySection` becomes the focus panel; `IdeaCard`, `AddIdeaInput` restyled |
| `PlaybookView` | same board bones; `RuleSection` becomes focus panel; `ActionCard` restyled |
| `ChatDrawer` | becomes `InlineChat` in the focus column (Expand/Close); drawer chrome deleted |
| `CommitmentView` | restyle; column collapse; Big Move card to bottom |
| `SynthesisView` | poster layout |
| `Toast`, `ConfirmModal`, `ErrorBanner` | restyle per section 8; Toast gains an action-button variant (Undo) |
| `AppContext` reducer | new `RESTORE_ITEM` action for delete-undo (ideas and actions) |
| `utils/export.js` + print CSS | section 7 |
| `index.css` / tokens | new token block; Google Fonts swap; delete Montserrat + old palette |
| UI state | add `focusedCategoryId` / `focusedRuleId` as plain view-local `useState` (not persisted; a reload focuses the first category, which is fine for a single-session workshop tool) |

## 11. CLAUDE.md amendments (final phase, same PR)

- Design System section: replace with the new tokens/DNA summary (white/ink/salmon/star-blue, Hanken Grotesk, pill CTAs, rail-focus-tray).
- Remove/replace "Montserrat only" and "black/white/red" rules; keep phase-name locks, animation rules, `transition: all` pitfall.
- Note that `v1-original-design` tag plus a new pre-redesign tag preserve history.

## 12. Implementation phases (detail in the plan doc)

1. Tokens + fonts + Header/GateBar/GeneratingIndicator (app-wide skin, small diff)
2. IntakeView
3. PrimitivesView board + InlineChat (the big one)
4. PlaybookView board
5. CommitmentView + SynthesisView + exports
6. Mobile + accessibility + polish; CLAUDE.md amendment; PR

Each phase: `npm run build` green, visual check against the mockup section, full 4-phase manual walkthrough before PR. Branch: `feat/redesign-2026-07`; tag `pre-redesign` on master first.

## 13. Resolved decisions (2026-07-12)

1. PDF poster defaults to the light print variant (section 7).
2. Delete-undo toast is in scope, built with the Primitives board phase and reused for actions (section 8).

## 14. Post-build amendments (2026-07-13, from Yonatan's preview feedback; these supersede the sections above where they conflict)

1. **Scroll model (supersedes parts of 5.2/5.4):** boards at >=1180px are app-shells: the page does not scroll; rail/focus/tray each fill the viewport height and scroll internally only on overflow; the tray's 44vh cap is desktop-obsolete (tray-body is flex:1); GateBar is the fixed bottom row. <=1179px keeps document scroll with the mobile pattern. Category/rule switches reset the focus pane scroll and focus the new heading. Rationale: the earlier hybrid (scrolling page + sticky scrolling islands) reshaped constantly and half-filled the screen.
2. **Breakpoint:** the three-column board engages at 1180px (not 1000px) so the focus column never drops below ~500px.
3. **Type scale:** 16px base, 1.2 ratio, 12.5px floor, one notch above product norms for projection. Secondary text gray-500 minimum; gray-400 decoration-only.
4. **Review overflow (supersedes section 8's collapse rule):** both columns always show every starred item; no "Show all" expanders.
5. **Gate-left text:** a single non-wrapping "★ {n} starred" on both boards (counts live in the rail/tray).
6. **PDF button label:** "Print / Save as PDF" everywhere (the button opens the print dialog; user commit 79a8915 governs, superseding this spec's/plan's "Download" labels).
7. **Big Move date:** synthesis is stamped with generatedAt at SET_SYNTHESIS; the poster and exports display that date, never "today".
8. **Intake error navigation:** failed submit focuses and scrolls to the first invalid field after render (reduced-motion aware) with a role="alert" summary.
9. **Accessibility hardening:** ConfirmModal has full dialog semantics; intake labels/radiogroup/aria-pressed wired; toasts in a polite live region; ErrorBanner role="alert"; chat messages aria-live; white focus ring on ink surfaces.
10. **Deferred backlog (owner-approved deferrals):** "Jump to your Big Move" anchor on Review; cancel/escape during generation; URL history/deep links (ties into the three-modes plan); chat draft persistence; intake debounce flush on unload.
