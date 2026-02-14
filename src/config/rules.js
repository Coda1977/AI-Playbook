export const RULES = [
  {
    id: "destination",
    number: 1,
    name: "Start at the End",
    principle: "Show the destination and create emotional resonance. People can't move toward something they can't picture \u2014 and they won't move toward something they don't feel.",
    promptHint: "Generate actions to help this manager paint a vivid, concrete destination for their team's AI adoption \u2014 and connect it to something the team actually cares about. The destination must be specific ('by June, we generate first drafts in 10 minutes instead of 2 hours') not vague ('we're adopting AI'). Critically, the manager must try AI first themselves before asking anyone else to \u2014 if they haven't used it yet, that's action #1. Help them explain the 'why' in local terms (what this means for this specific team's daily work, not 'the CEO said so'), and find the emotional angle that resonates with their people: easier work, better customer outcomes, professional growth, not being left behind \u2014 whatever fits. Passion sustains change longer than fear.",
    emptyNudge: "What's the vivid destination for your team? Add an action that makes AI adoption concrete and connects to something they care about.",
    color: "#B45309",
  },
  {
    id: "safe",
    number: 2,
    name: "Make It Safe",
    principle: "People won't try what they can't afford to fail at. Protect the stumbling, respect the loss, and celebrate experiments.",
    promptHint: "Generate actions that address three dimensions of safety: (1) Go first and show mistakes \u2014 the manager shares their own fumbling attempts ('here's what I tried, here's where I got stuck, here's what finally worked') to give permission to struggle. A single leader demo can nearly double adoption. (2) Acknowledge what's being lost \u2014 the old way had real value (speed, familiarity, expertise, identity). Losses are psychologically weighted at roughly twice the value of gains, so naming them must come before selling AI's benefits. Include direct conversations (1:1s, not town halls) where people feel heard. (3) Don't punish early failure \u2014 when someone tries and it doesn't work, respond with 'what did you learn?' not 'why didn't that work?' Include actions for asking and actually listening, and celebrating both wins and losses from AI experiments publicly.",
    emptyNudge: "How will you make it safe to fail? Think about going first, naming what's being lost, and creating space where experiments are celebrated.",
    color: "#475569",
  },
  {
    id: "script",
    number: 3,
    name: "Script the Steps",
    principle: "Don't ask people to \"embrace change.\" Tell them what to do on Monday morning.",
    promptHint: "Generate actions that give people specific, concrete instructions rather than inspirational mandates. Not 'start using AI' but 'tomorrow, take one email thread and ask AI to summarize it \u2014 just one.' Help the manager: (1) Find the bright spots \u2014 someone on the team has probably figured something out already. Find that person, learn exactly what they do, and help them show others. (2) Remove friction \u2014 when someone says 'I would, but...' fix that specific blocker (access issue, time issue, skill issue). (3) Make the new way the easy way \u2014 embed AI into what people already do rather than adding it on top. Defaults beat willpower: look for where AI can become the path of least resistance in existing workflows, templates, tools, and standard operating procedures.",
    emptyNudge: "What's the one specific thing someone on your team could do Monday morning? Script it \u2014 don't inspire it.",
    color: "#1D4ED8",
  },
  {
    id: "small",
    number: 4,
    name: "Start Small, to go Big",
    principle: "Begin contained, expand with proof.",
    promptHint: "Generate actions to help this manager start with one focused experiment \u2014 not five things at once. Key principles: (1) Pick one use case, one team, one workflow and nail it before expanding. (2) Start with people who want to try it \u2014 don't waste energy converting skeptics first; let enthusiasts succeed, then use those successes to bring along the middle. (3) Set clear 'expand when' criteria upfront \u2014 specific markers of success, not vague feelings. (4) Protect the pilot from pressure to scale too fast \u2014 when leadership asks 'why aren't we doing this everywhere?' hold the line until the pilot actually works. Each small win should explicitly set up the next, slightly bigger experiment \u2014 help them see a 3-step sequence, not just an isolated first step.",
    emptyNudge: "What's one use case, one team, one workflow you could nail first? Start there \u2014 not everywhere.",
    color: "#5B21B6",
  },
  {
    id: "visible",
    number: 5,
    name: "Make Progress Visible",
    principle: "Communicate relentlessly. Show wins. Sustain the narrative.",
    promptHint: "Generate actions to make progress visible and sustain momentum through communication. Most change efforts under-communicate by 10x or more \u2014 progress that isn't visible doesn't build momentum, convert skeptics, or sustain energy. Help the manager: (1) Share what's working \u2014 when someone figures something out, don't let it stay private ('Sarah found a way to do X \u2014 I asked her to show the team Thursday'). (2) Talk about it regularly \u2014 not one announcement and done, but in team meetings, 1:1s, casual conversation. Keep the change visible by simply mentioning it. (3) Connect progress to outcomes people care about \u2014 not 'adoption is at 60%' but 'the team saved 12 hours last week' or 'we got the proposal out a day early.' (4) Follow up \u2014 if they said they'd find an answer, come back with it. If they asked someone to try something, ask how it went.",
    emptyNudge: "How will you make wins visible? Think about regular sharing, outcome-based metrics, and consistent follow-up.",
    color: "#2D6A4F",
  },
];

export const FLUENCY_OPTIONS = [
  { level: 1, label: "Not yet started", managerDesc: "I know I should be using AI but haven't found the right entry point yet", teamDesc: "Most of my team hasn't engaged with AI tools in any meaningful way" },
  { level: 2, label: "Capable", managerDesc: "I use AI tools purposefully for specific tasks and can explain how they help", teamDesc: "A few people use AI for specific tasks, but it's individual and inconsistent" },
  { level: 3, label: "Adoptive", managerDesc: "AI is a regular part of how I work, integrated across multiple tools and workflows", teamDesc: "Most of the team uses AI regularly \u2014 it's becoming part of how we work" },
  { level: 4, label: "Transformative", managerDesc: "I think AI-first when solving problems and have scaled AI usage across my team or function", teamDesc: "AI is embedded in our workflows and the team actively looks for new ways to apply it" },
];

export const PLAYBOOK_GEN_STEPS = [
  { rule: 1, tip: "People can't move toward what they can't picture, and won't move toward what they don't feel." },
  { rule: 2, tip: "A single leader demo can nearly double AI adoption on a team." },
  { rule: 3, tip: "Defaults beat willpower. Tell them what to do Monday morning." },
  { rule: 4, tip: "Small wins build patterns that attract allies and deter opponents." },
  { rule: 5, tip: "Most change efforts under-communicate by 10x or more." },
];
