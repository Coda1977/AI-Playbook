# Session Log: 2026-11-09/10, past the obvious (PRs #11 to #14)

Full record of the November session: pre-workshop fixes, the "past the obvious" work for an experienced audience, a review of Yonatan's own change-management material, and a run of small tested changes. Everything listed under "Shipped" is merged to `master` and live. The detailed numbers also sit in `CLAUDE.md` (November section and Key learnings).

## Shipped

| PR | What | Checked how |
|---|---|---|
| #11 | Pre-workshop fixes: full help-with labels reach the prompts, the strategy prompts know today's date, the invented "15 years" example is gone | Live walkthrough |
| #12 | Opus 5.5 at low effort on all four endpoints with automatic fallback to Sonnet 4.6; "past the obvious" bar in the use-case prompt and "past the standard playbook" bar in the strategy prompt; chat answers the question asked and leaves ground the manager already covered; the Big Move on Opus 5.5 | A/B on 6 personas x 2 runs: fresh ideas 4% to 25%, sharp actions 6% to 30%, pairwise 48-0. 60/60 at 20 concurrent, four simulated failure modes recovered. Two full live journeys, 12/12 steps 200 |
| #13 | One cue in the chat: "more creative", "fresh", "wider", "surprise" now do what "bigger" does. In the strategy chat the one-turn block keeps the bold-move definition and may leave the rule's usual techniques. Strategy-chat suggestions are written as one ordinary spoken sentence | 27 blind pairs x 2 runs against the old chat: 44 of 54 won; clear on first read 74-76% (old chat 69-72%). Live check: four messages, all 200 in 8-12s |
| #14 | The plan gets a rough finish date ("early February 2027") instead of the exact day 90 days out | Exact-day dates in 9 of 18 saved plans before, 0 of 12 after. Live check: four plans, none |

Cost, measured on token counts from the API: about $0.29 per participant for use cases + change plan + Big Move + six chat messages (about $0.14 on the Sonnet 4.6 fallback path).

## Tested and not shipped

- **Plain-language requirement in the strategy plan.** Clarity 54% to 63%, but sharp actions 37% to 24% and it lost 9 of 12 pairwise. Asked for plain words, the model returned plain ideas. It works in the chat because the chat has room (one or two suggestions plus the coach's sentences).
- **Looser strategy prompt, two versions.** Permission only: no change (pairwise 12-12). Technique lists removed, each rule given only its principle and its question: no change in freshness (32% vs 31%, pairwise 14-10 with half the pairs flipping on order swap), but Definition of Done, the Magic Question and the expand-when rule disappear from the plans. Not a lever, and it cuts the link to what was just taught.
- **"What have you already tried, and where is it stuck?"** One run, two personas, the sentence added to an existing intake answer: about 3 of 12 actions became pointed at the real blockage, the other 9 unchanged. Intake changes are parked by Yonatan.
- **An action object with a `classic` field** (from the #12 work): noise-level, dropped.

## What the material review found

Read in full: the five-rules article, the August workshop deck (v2), the agenda, the "day after adoption" rules, the eight-rule booklet, the coaching skill, the app's original blueprint, the planning decks and question banks; through two background readers, the 30 notes in the vault's Change folder and the AI change notes and knowledge wiki. Not read: the 6 November deck (v3, file locked) and the full books.

- The app's rule descriptions match the July article; the deck now teaches more per rule (guardrails, co-creation, work intensity, the 80% wall, the new bar, skill/will, outcome-based small wins, when to scale).
- Yonatan's decision: do not add these. Some are not fully baked, and adding knowledge was measured as not the lever in July.
- Confirmed by him: all participants are SaaS; "hours saved" is acceptable as one metric among others; the two numbers with no source found stay for now.

## What was learned

1. **Freshness and clarity are different things.** The judges rewarded specific mechanisms and never asked whether a manager could follow the line on first read. About four in ten plan actions need a second read, before and after November. Yonatan noticed it from the examples; the tests had been blind to it.
2. **In the plan, freshness and clarity compete for the same 25 words.** The open design question is room per idea: twelve longer actions, a short line with one plain sentence under it, or fewer actions. Untested.
3. **Wording, extra knowledge and loosening all left quality flat.** What moved it: the model (November), the bold-move definition (July), the bold switch in the chat (this session), and to a small degree knowing what the manager already tried.
4. **Measure before claiming.** Two predictions made in this session were wrong once run, and one arm went from 8-1 to 4-5 between runs.

## Open, all Yonatan's call

- Room per idea in the plan (see 2 above). Suggested first test: a short headline with one plain sentence under it.
- The "what have you already tried" question.
- Strategy-chat suggestions sometimes run to 26-29 words since the plain-sentence wording (2-4 of 54 in tests, 3 of 6 in the live check).
- The promptfoo snapshots in `evals/prompts/` and their configs still mirror the July prompts and the forced-tool Sonnet setup. Resync before relying on that suite.

## Where the measuring scripts are

They were written in the session scratchpad, which is temporary, and are not in `evals/`:

- `evalpersonas.mjs`: six personas (four for tuning, two held out).
- `ab.mjs`, `ab3.mjs`: plan and use-case A/B. An Opus 5.5 judge labels every action STOCK / SHARP / WEAK and gives order-swapped pairwise verdicts.
- `clarity.mjs`: first-read clarity. The reader is the manager themself, one read on a shared screen: CLEAR / REREAD / UNCLEAR, with a cause.
- `cue-ab.mjs` and variants: strategy-chat before/after on 3 personas x 3 rules x 3 messages.
- `date-check2.mjs`, `cost.mjs`, `tryq.mjs`: exact-date count, cost per participant, the intake-question run.

One trap worth knowing: a shell heredoc silently collapsed the backslashes in a regular expression, and the first date count reported zero for both before and after. Patterns belong in a file written directly, checked against a phrase known to match.
