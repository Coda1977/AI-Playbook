// Single source of truth for the workshop's rules and categories.
// Imported by BOTH the React app (src/config/*) and the Vercel serverless
// functions (api/*). Before this file existed, the rules lived in
// src/config/rules.js AND api/playbook-generate.js, and the categories in
// four places; the copies had already drifted. Edit here, nowhere else.

export const RULES = [
  {
    id: "destination",
    number: 1,
    name: "Start at the End",
    principle:
      "Show the destination and create emotional resonance. People can't move toward something they can't picture, and they won't move toward something they don't feel.",
    promptHint:
      "Generate actions to help this manager paint a vivid, concrete destination for their team's AI adoption, connecting it to something the team actually cares about. The destination must be specific ('by June, we generate first drafts in 10 minutes instead of 2 hours') not vague ('we're adopting AI'). Two key techniques: (1) The Magic Question. Ask the manager to imagine waking up after the change has happened overnight; what clues would they see and hear? This forces concrete specificity. (2) Definition of Done. Once the destination is clear, write it as a testable statement the whole team can point to. Critically, the manager must try AI first themselves before asking anyone else to. If they haven't used it yet, that's action #1. Help them explain the 'why' in local terms (what this means for this specific team's daily work, not 'the CEO said so'), and find the emotional angle that resonates with their people: easier work, better customer outcomes, professional growth, not being left behind, whatever fits. Passion sustains change longer than fear.",
    chatHint:
      "If the manager has not used AI themselves yet, that comes before everything: they cannot show a destination they have not visited, so their own first hands-on experience is action #1. Then help them make the destination concrete and emotional. Two powerful techniques: (1) The Magic Question, ask them to imagine waking up after the change has happened overnight, what clues would they see and hear? This forces specificity. (2) Definition of Done, once the destination is clear, write it as a testable statement the whole team can point to.",
    emptyNudge:
      "What's the vivid destination for your team? Add an action that makes AI adoption concrete and connects to something they care about.",
    color: "#B45309",
  },
  {
    id: "safe",
    number: 2,
    name: "Make It Safe",
    principle:
      "People won't try what they can't afford to fail at. Protect the stumbling, respect the loss, and celebrate experiments.",
    promptHint:
      "Generate actions that address three dimensions of safety: (1) Go first and show mistakes. The manager shares their own fumbling attempts ('here's what I tried, here's where I got stuck, here's what finally worked') to give permission to struggle. A single leader demo can nearly double adoption. (2) Acknowledge what's being lost. The old way had real value (speed, familiarity, expertise, identity). Two anxieties drive resistance (Schein): survival anxiety (if I don't change, bad things happen) and learning anxiety (fear of incompetence, identity loss, group exclusion, loss of power). Decrease learning anxiety rather than increasing fear. Naming specific fears must come before selling AI's benefits. The five learning fears to probe: temporary incompetence, punishment for incompetence, loss of personal identity, loss of group membership, loss of power/position. Include direct conversations (1:1s, not town halls) where people feel heard. (3) Don't punish early failure. When someone tries and it doesn't work, respond with 'what did you learn?' not 'why didn't that work?' (4) Train the group, not just the individual. Resistance embeds in group norms; training whole teams together supports new norms emerging. (5) Create practice fields. Dedicated time and space where people can experiment with AI without organizational consequences (sandbox projects, AI lab hours, hackathon time). Include actions for asking and actually listening, and celebrating both wins and losses from AI experiments publicly.",
    chatHint:
      'One leader demo nearly doubles adoption, push for that. Two anxieties drive resistance (Schein): survival anxiety (if I don\'t change, bad things happen) and learning anxiety (fear of incompetence, identity loss, group exclusion, loss of power). Help them decrease learning anxiety, name specific fears their team feels, not just practical workflow changes. Naming "you might feel like your years of expertise matter less" is more powerful than "AI will make you more productive." When possible, suggest training whole teams together rather than individuals, resistance embeds in group norms. Suggest creating practice fields (sandbox time, AI lab hours) where people can experiment without consequences. Don\'t forget: celebrating failed experiments is as important as celebrating wins.',
    emptyNudge:
      "How will you make it safe to fail? Think about going first, naming what's being lost, and creating space where experiments are celebrated.",
    color: "#475569",
  },
  {
    id: "script",
    number: 3,
    name: "Script the Steps",
    principle:
      'Don\'t ask people to "embrace change." Tell them what to do on Monday morning.',
    promptHint:
      "Generate actions that give people specific, concrete instructions rather than inspirational mandates. Not 'start using AI' but 'tomorrow, take one email thread and ask AI to summarize it; just one.' Help the manager: (1) Find the bright spots. Someone on the team has probably figured something out already. Find that person, learn exactly what they do, and help them show others. (2) Remove friction. When someone says 'I would, but...' fix that specific blocker (access issue, time issue, skill issue). (3) Make the new way the easy way. Embed AI into what people already do rather than adding it on top. Defaults beat willpower: look for where AI can become the path of least resistance in existing workflows, templates, tools, and standard operating procedures.",
    chatHint:
      "Help them find the bright spots (who's already doing it?) and remove friction. Defaults beat training, where can AI be embedded into existing tools rather than added as a new step?",
    emptyNudge:
      "What's the one specific thing someone on your team could do Monday morning? Script it; don't inspire it.",
    color: "#1D4ED8",
  },
  {
    id: "small",
    number: 4,
    name: "Start Small, to go Big",
    principle: "Begin contained, expand with proof.",
    promptHint:
      "Generate actions to help this manager start with one focused experiment, not five things at once. Key principles: (1) Pick one use case, one team, one workflow and nail it before expanding. (2) Start with people who want to try it. Don't waste energy converting skeptics first; let enthusiasts succeed, then use those successes to bring along the middle. (3) Set clear 'expand when' criteria upfront. Specific markers of success, not vague feelings. (4) Protect the pilot from pressure to scale too fast. When leadership asks 'why aren't we doing this everywhere?' hold the line until the pilot actually works. Help them build a small wins ladder: 3-6 sequential wins, each explicitly setting up the next. Not isolated experiments, but a visible staircase.",
    chatHint:
      "Help them build a small wins ladder, 3-6 sequential wins, each setting up the next. Not isolated experiments, but a visible staircase. Push back if they're trying to do too much at once. Help them protect the pilot from premature scaling pressure.",
    emptyNudge:
      "What's one use case, one team, one workflow you could nail first? Start there, not everywhere.",
    color: "#5B21B6",
  },
  {
    id: "visible",
    number: 5,
    name: "Make Progress Visible",
    principle: "Communicate relentlessly. Show wins. Sustain the narrative.",
    promptHint:
      "Generate actions to make progress visible and sustain momentum through communication. Most change efforts under-communicate by 10x or more. Progress that isn't visible doesn't build momentum, convert skeptics, or sustain energy. Help the manager: (1) Share what's working. When someone figures something out, don't let it stay private ('Sarah found a way to do X; I asked her to show the team Thursday'). (2) Talk about it regularly. Not one announcement and done, but in team meetings, 1:1s, casual conversation. Keep the change visible by simply mentioning it. (3) Connect progress to outcomes people care about. Not 'adoption is at 60%' but 'the team saved 12 hours last week' or 'we got the proposal out a day early.' (4) Follow up. If they said they'd find an answer, come back with it. If they asked someone to try something, ask how it went.",
    chatHint:
      "Push for regular rhythm, not one-off announcements. Help them connect progress to outcomes people care about, not adoption metrics. Follow-up is everything, if they asked someone to try something, they need to ask how it went.",
    emptyNudge:
      "How will you make wins visible? Think about regular sharing, outcome-based metrics, and consistent follow-up.",
    color: "#2D6A4F",
  },
];

export const CATEGORIES = [
  {
    id: "content",
    number: 1,
    title: "Content Creation",
    description: "Text, presentations, reports, communications",
    principle:
      "AI can draft, edit, and personalize content at scale - freeing you to focus on strategy and voice.",
    emptyNudge:
      "What content takes too long to produce? Add an idea for how AI could help.",
    color: "#2D6A4F",
  },
  {
    id: "automation",
    number: 2,
    title: "Task Automation",
    description: "Repetitive processes, workflows, scheduling",
    principle:
      "The best automation targets are tasks you do often, follow a pattern, and wish you could delegate.",
    emptyNudge: "What repetitive task would you love to hand off? Add an idea.",
    color: "#5B21B6",
  },
  {
    id: "research",
    number: 3,
    title: "Research & Synthesis",
    description: "Information retrieval, document analysis",
    principle:
      "AI excels at reading, summarizing, and connecting information across large volumes of text.",
    emptyNudge:
      "Where do you spend time gathering and synthesizing information? Add an idea.",
    color: "#1D4ED8",
  },
  {
    id: "data",
    number: 4,
    title: "Data & Insights",
    description: "Analysis, visualization, pattern recognition",
    principle:
      "AI can spot patterns, generate dashboards, and turn raw data into decisions faster than manual analysis.",
    emptyNudge: "What data do you wish you could analyze faster? Add an idea.",
    color: "#B45309",
  },
  {
    id: "coding",
    number: 5,
    title: "Technical Work",
    description: "Spreadsheets, scripts, tools, systems",
    principle:
      "AI can write formulas, scripts, and small tools - even for non-technical people.",
    emptyNudge: "What technical task slows you down? Add an idea.",
    color: "#475569",
  },
  {
    id: "ideation",
    number: 6,
    title: "Strategy & Ideation",
    description: "Planning, brainstorming, problem-solving",
    principle:
      "AI is a tireless brainstorming partner - it won't judge, won't get tired, and will challenge your assumptions.",
    emptyNudge: "Where could a brainstorming partner help? Add an idea.",
    color: "#BE185D",
  },
];

// Per-tier feasibility floor for team-run use case ideas. The primitives
// prompt injects ONLY the tier that matches this team's fluency (asking the
// model to map a four-tier catalog to the profile is where the floor kept
// leaking; deterministic selection is the structural fix, same lesson as
// chat.js shipping only the current rule's science).
const TEAM_FLUENCY_FLOORS = {
  notyet:
    'This team has NOT YET STARTED with AI. Every team-run idea must work by pasting text into a chat tool or chatting with an assistant the manager preloads for them. Anything that integrates with, pulls from, posts to, triggers on, or runs on a schedule inside another system is infeasible for this team, as is anything embedded in an IDE, tracker, or pipeline. "Task Automation" ideas for this team are repeated chores moved into a chat routine (same prompt, same input, on a weekly or daily rhythm), described as the person acting, never as a system trigger.',
  capable:
    'This team is CAPABLE: anything a person can set up themselves is feasible (reusable prompt templates, an assistant preloaded with reference documents, meeting transcription, AI features already inside their existing tools), but no custom engineering and no new integrations or pipelines. "Task Automation" ideas for this team are repeated chores moved into a reusable chat routine or template, described as the person acting, never as a system trigger.',
  adoptive:
    "This team is ADOPTIVE or TRANSFORMATIVE: multi-step and automated workflows are fair game.",
};

export function teamFluencyFloor(teamFluency) {
  const f = (teamFluency || "").toLowerCase();
  if (f.startsWith("not yet")) return TEAM_FLUENCY_FLOORS.notyet;
  if (f.startsWith("adoptive") || f.startsWith("transformative"))
    return TEAM_FLUENCY_FLOORS.adoptive;
  return TEAM_FLUENCY_FLOORS.capable;
}

function fluencyTier(fluency) {
  const f = (fluency || "").toLowerCase();
  if (f.startsWith("not yet")) return "notyet";
  if (f.startsWith("adoptive") || f.startsWith("transformative"))
    return "adoptive";
  return "capable";
}

// What this manager and team have ALREADY done with AI, by fluency. By late
// 2026 the standard uses (draft, summarize, rewrite, brainstorm) are what a
// workshop room expects to hear; an idea they could have written themselves
// is worth nothing to them. Same deterministic single-tier injection as the
// fluency floor: the floor says what is feasible, this says what is old news.
const USE_CASE_BASELINES = {
  bothNotyet:
    'Neither this manager nor the team has built AI habits yet, but they have seen the demos: "draft an email", "summarize a document", "brainstorm a list" are what they expect to hear and will not move them. Ideas must be simple to run and still be ones they have not heard.',
  teamNotyet:
    "The manager already uses AI for drafting, summarizing, and rewriting, and the team has seen those demos even if they never picked them up. One more drafting or summarizing idea tells this manager nothing. Ideas must be simple enough for the team to run and still be ones the manager has not thought of.",
  capable:
    "People on this team already use AI on their own for first drafts, summaries, rewrites, brainstorming, and formula help. An idea whose core is one of those is already happening here. Value now comes from uses no individual stumbles into alone.",
  adoptive:
    "AI is routine on this team: drafting, summarizing, meeting notes, research, and assistants loaded with their documents are in daily use. Anything a motivated person can do alone in a chat window is already happening. Value now comes from what the team does together, from changing how a piece of work gets done, and from work that was never possible.",
};

export function useCaseBaseline(managerFluency, teamFluency) {
  const team = fluencyTier(teamFluency);
  if (team === "adoptive") return USE_CASE_BASELINES.adoptive;
  if (team === "capable") return USE_CASE_BASELINES.capable;
  return fluencyTier(managerFluency) === "notyet"
    ? USE_CASE_BASELINES.bothNotyet
    : USE_CASE_BASELINES.teamNotyet;
}

// The change-leadership twin of the baseline above: which adoption moves are
// already behind this team, and what the change problem therefore IS now.
const CHANGE_BASELINES = {
  notyet:
    "This team has not started, but the manager has read the standard advice: run a demo, find a champion, start a small pilot, celebrate wins. Restating it adds nothing. Each action must be the designed version of its lever: exactly which ritual, which artifact, whose words.",
  capable:
    'Some people here already use AI on their own. The kickoff moves (a demo, a lunch-and-learn, a shared prompt list, "try it this week") have happened or would land as old news. The change problem now is turning scattered private use into a shared way of working: what becomes the standard, what gets retired, who owns the quality bar, how one person\'s trick becomes team practice.',
  adoptive:
    "AI is already routine on this team, and adoption talk bores them. Kickoff moves (demos, pilots of basic use, tip share-outs) are behind them. The change problem now is the next level: one piece of work redesigned end to end, a higher bar for judgment and review, uneven quality between people closed, saved time visibly reinvested, the remaining skeptic given a real role.",
};

export function changeBaseline(teamFluency) {
  return CHANGE_BASELINES[fluencyTier(teamFluency)];
}

export const RULE_NAMES = Object.fromEntries(RULES.map((r) => [r.id, r.name]));

export const CATEGORY_NAMES = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.title]),
);
