# Session Log: 2026-07-02/03 — quality pass (feat/quality-pass)

Full record: deep app review → verification pass → implementation → eval resync → journey harness → idea-quality A/B. Everything on branch `feat/quality-pass` (9 commits), NOT pushed, master untouched.

## Shipped on the branch

### Structure
- **lib/workshop.js**: single source of truth for the 5 rules (promptHints + new chatHints) and 6 categories; src/config re-exports, all 4 api handlers import. Ends the drift between duplicated copies.
- **lib/apiGuard.js**: same-origin check on all 4 endpoints (the June log's "biggest remaining risk"); ops scripts send an Origin header now.

### Generation quality (the main track)
- **Quotas redistributed within the lighter-output budget**: primitives 12 ideas at 1-3 per category weighted by fit; playbook 2 per rule + 3 on the 1-2 prioritized rules. The model commits via a `prioritizedRules` schema field and the server ENFORCES counts by trimming (prompt count-caps demonstrably don't hold; same lesson as max_tokens).
- **Use cases must serve the work, not plan the adoption** (Yonatan caught adoption-plan ideas leaking into Phase 2 after successVision was wired in; fixed with a hard boundary + eval assertion).
- **Idea-quality excellence bar**: input→output artifacts ("paste X, get Y"), copy-paste tryable at the TEAM's fluency, 2+ non-obvious ideas, failure-risk constraints are generation constraints. A/B-validated: new prompt beat old 4/5 pairwise (0 losses, Opus judge, order-swapped).
- **Sonnet 5 tested and rejected as the quality lever**: 3-1-1 pairwise vs 4.6 on the same prompt, absolute scores flat. Stay on 4.6.
- **Playbook anchor roles**: pilot workflow lives in Rules 3-5 (+ max one Rule 1 action); Rule 2 people-only. Dominance COUNT resistant to prompts (5-7/12 across three attempts) but placement is now clean; remaining concentration is mostly the methodology's own one-pilot chain. Further reduction = structural second pass (parked).
- **Missing intake fields wired in**: responsibilities+helpWith → playbook; successVision → primitives.

### Chat
- Fixed: model heard every user message twice (client+server both appended); previously suggested ideas now serialized back into replayed history (stops re-suggesting); starred context sent as titles not raw ids; playbook chat ships only the current rule's behavioral science.

### Flow/UX
- Big Move staleness: contentVersion/synthesisVersion; Review CTA flips to "Regenerate My Big Move" when the plan changed.
- Phase 3 star gate (3 starred actions, MIN_STARS_FOR_REVIEW), mirroring Phase 2; synthesis prompt builds around starred items.
- Intake gates on substance (role 4+ words, long fields 6+), not presence.
- Generation screen fast-forward tightened.

### Eval infrastructure (now the QA workflow)
- Whole suite resynced from 1-3 stale schema generations to live prompts/tool_use. **14/14 passing at session end.**
- `evals/journey-review.mjs`: 3 personas play the FULL workshop against live endpoints (simulated starring, 2-turn chat pushback, dominance measurement, LLM judge per stage). `evals/journey-report-html.mjs` renders a readable review page. Replaces manual persona click-throughs.
- `evals/quality-ab-model.mjs`: prompt/model A/B harness (Opus judge, order-swapped pairwise).
- Run configs with `--no-write` (promptfoo sqlite crash otherwise) and `--grader anthropic:messages:claude-sonnet-4-6`.

## Verified
- npm run build + lint green (one pre-existing ChatDrawer warning).
- Full browser walkthrough on vercel dev: substance gate, weighted ideas, prioritized plan, chat + add-idea, star gates, Big Move, staleness→regenerate.
- Journey review artifact: https://claude.ai/code/artifact/18a2f221-5200-4377-a110-a49be60e4399

## Session 2 (2026-07-03, afternoon): idea-quality pipeline experiment

Executed docs/superpowers/plans/2026-07-03-idea-quality-pipeline.md. Four more commits on the branch (`3cf49ad`, `e5dd859`, `650e60a`, `ea06076`); still not pushed.

### The experiment and its verdict
- Built the full Phase 2 diverge/converge pipeline (25-30 unconstrained candidates, then value-based selection into the existing response shape) and A/B-tested it against the single-pass prompt: Opus judge, order-swapped pairwise, 4 runs, 4 personas (incl. a new OD-director persona, Capable/Capable, Yonatan's domain). Result: absolute scores tied (4 vs 4), pairwise 1 win / 9 losses / 3 ties for the pipeline, every margin slight. The transformative upside never materialized (converge selected accelerator-shaped lists even where floors allowed bolder ones) and the unconstrained pool occasionally leaked a floor-brushing idea. **Yonatan reviewed the evidence and dropped the second pass.**
- Everything structural the pipeline iteration produced was folded back into the single-pass prompt and re-verified: parity with the frozen excellence-bar baseline (3 ties, 1 loss on vision-coverage variance), promptfoo suite green.

### What Phase 2 generation now has (all kept)
- Transformative license with first-probe requirement (root cause of small ideas was the prompt instructing smallness four ways); expected-value selection; size never a criterion, surprise breaks ties.
- `teamFluencyFloor()` in lib/workshop.js injects only THIS team's fluency tier; manager-personal exemption; downscope-to-first-probe; failure-risk floor with safe-input naming and the perception rule; `focusCategories`/`stretchCategory` commitment + server trim; forced `modalityCoverage` (assistant family conditional); below-Adoptive verb floor; failureRisks finally wired into the prompt.

### Playbook (Task 2, kept as shipped)
- Move palette as value preference (five move types, highest behavior-change probability per unit of manager effort, defaults over broadcasts for Rules 3-5, meetings reserved for fear-naming), operationalized levers, fit-checked stock moves, Rule 2 protects the intake's actual named loss, transformative star routing (Rule 1 after-state + Rule 4 pilot, outranks accelerator stars).

### Eval infra
- Rubrics recalibrated to judge value, never shapes; dominance counting removed from rubrics (measured in quality-ab instead; still 5-9/12, the methodology's one-pilot chain); methodology moves are never flaggable as hygiene. Transform mirrors the server trim. Word-cap flake guard (2+ offenders or 35+). Known promptfoo grader JSON-extraction flake. Playbook suite ~3-4/4 per run with rotating generation variance; the value rubric is an instrument, not a hard gate.
- quality-ab-model.mjs now permanently A/Bs the live prompt against `prompts/primitives-singlepass-frozen-2026-07-03.txt` with value-based judge criteria and the OD-director persona.

### Still open after this session
- Journey review against the merged prompt (needs `npm run dev:vercel` in Yonatan's terminal; agent-started servers get reaped).
- Yonatan's review of the branch result, then the ship path (push -> preview -> journey with BASE_URL -> real-workshop A/B -> PR).
- Gold use-case library stays the strongest untried quality lever.

## Open / parked (deliberate)
- **Push branch → Vercel preview → A/B in a real workshop → PR** (Yonatan's call; nothing pushed yet).
- **Curated per-function gold use-case library** injected as background knowledge: the strongest remaining idea-quality lever (model swap isn't). Yonatan's expertise → content.
- Structural dominance second-pass (only if real workshops still feel monotone).
- Chat pushback "adjacent theme" tightening; failure-risk constraint line for chat prompts (added to primitives only).
- Sonnet 5 migration: revisit later as its own branch with the harness as gate; intro pricing makes it cheaper through Aug 2026.
- June leftovers: Anthropic console spend limit (2-min task, still unset); per-IP rate limiting (origin guard shipped, throttling not); design-review implementation track.
- vercel dev background processes get reaped in agent sessions; run `npm run dev:vercel` in a user terminal for local testing.
