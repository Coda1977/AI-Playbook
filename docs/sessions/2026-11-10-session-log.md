# Session Log: 2026-11-09/10, past the obvious (PRs #11 to #16)

Full record of the November session: pre-workshop fixes, the "past the obvious" work for an experienced audience, a review of Yonatan's own change-management material, and a run of small tested changes. Everything listed under "Shipped" is merged to `master` and live. The detailed numbers also sit in `CLAUDE.md` (November section and Key learnings).

## Shipped

| PR | What | Checked how |
|---|---|---|
| #11 | Pre-workshop fixes: full help-with labels reach the prompts, the strategy prompts know today's date, the invented "15 years" example is gone | Live walkthrough |
| #12 | Opus 5.5 at low effort on all four endpoints with automatic fallback to Sonnet 4.6; "past the obvious" bar in the use-case prompt and "past the standard playbook" bar in the strategy prompt; chat answers the question asked and leaves ground the manager already covered; the Big Move on Opus 5.5 | A/B on 6 personas x 2 runs: fresh ideas 4% to 25%, sharp actions 6% to 30%, pairwise 48-0. 60/60 at 20 concurrent, four simulated failure modes recovered. Two full live journeys, 12/12 steps 200 |
| #13 | One cue in the chat: "more creative", "fresh", "wider", "surprise" now do what "bigger" does. In the strategy chat the one-turn block keeps the bold-move definition and may leave the rule's usual techniques. Strategy-chat suggestions are written as one ordinary spoken sentence | 27 blind pairs x 2 runs against the old chat: 44 of 54 won; clear on first read 74-76% (old chat 69-72%). Live check: four messages, all 200 in 8-12s |
| #14 | The plan gets a rough finish date ("early February 2027") instead of the exact day 90 days out | Exact-day dates in 9 of 18 saved plans before, 0 of 12 after. Live check: four plans, none |

Cost, measured on token counts from the API: about $0.29 per participant for use cases + change plan + Big Move + six chat messages (about $0.14 on the Sonnet 4.6 fallback path).

After the table above was written, one more change shipped the same day:

| PR | What | Checked how |
|---|---|---|
| #16 | The use-case prompt no longer tells the model to "name the safe input form (anonymized, aggregated, no individual records)". That sentence stamped "anonymized" on ideas whenever an intake mentioned sensitive data | Yonatan's own intake, 5 runs per version: the word in 18 of 65 ideas before, 2 of 61 after. Removing only the bracketed words did nothing (14 of 52). HR persona, 4 runs: ideas still used aggregated or name-stripped inputs |

## Yonatan's manual journey (account managers)

He ran a full journey by hand in his own browser: 14 use cases (5 starred), 16 plan actions, 14 chat suggestions in the strategy chat (5 taken), the Big Move. What it showed:

- The plan hangs together: the living account plan he starred returns as a plan step, as the dashboard measure and as the Big Move.
- "Go bigger" in the strategy chat became "riskier". He took 0 of 6 suggestions in Script the Steps and wrote "those are just wierd ideas, i want you to be creative but realistic". Contained moves were taken, all-or-nothing moves were not. Open, his call.
- Four of five bigger replies repeated nearly the same sentence about risk.
- "Anonymized" on 5 of 14 use cases: traced to one prompt sentence and removed (PR #16).
- About 6 of 16 plan actions were about call prep, and he had to tell the chat "you are focusing on calls". Traced to the intake, not the prompt (below).
- The plan mentions "the two pilot AMs" but no action chooses them; one action says "never blame" and another shows results "by name".

## Why the plan fixated on call prep

His hypothesis: the plan follows the first clause of the success vision, and the prompt has too many lines pointing it there. Tested on his exact intake by removal only, 5 runs of 12 actions per version. Actions about prep, calls or QBRs:

| Version | Count |
|---|---|
| Live | 30 of 60 |
| Vision written in reverse order (prep last) | 26 of 60 |
| The three vision-pull phrases removed from the prompt | 27 of 60 |
| The "QBR-prep experiment" example removed | 31 of 60 |
| No starred use cases | 30 of 60 |
| Vision without "Prep time is cut by about half" | 17 of 60 |
| The number moved to churn ("flagged a month earlier") | 20 of 60 |

The first five rows are within run-to-run variation. The rules each want a yardstick (Definition of Done, expand-when, hours saved), and the only number in the vision becomes it. With the number on churn, the plan reorganised around "flagged a month earlier". Nothing was changed: the plan is doing what the vision asked. The use cases showed no such concentration, and the chat was not tested separately.

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
- `mkablate.cjs`, `ablate.mjs`, `ablcount.cjs`: trial copies of the prompts with one piece removed each, the runs on Yonatan's account-manager intake (plus two vision probes and the HR check), and the topic and word counts.

One trap worth knowing: a shell heredoc silently collapsed the backslashes in a regular expression, and the first date count reported zero for both before and after. Patterns belong in a file written directly, checked against a phrase known to match.
