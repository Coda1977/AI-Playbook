// Journey review: plays full workshop journeys for several personas against
// the REAL API endpoints (local vercel dev by default), simulates human
// behavior (starring, chat pushback), and judges every stage with an LLM +
// mechanical checks. Output: evals/output/journey-review.md (readable) and
// journey-review.json (raw).
//
// Run:  node evals/journey-review.mjs            (needs `npm run dev:vercel` running)
//       BASE_URL=https://<preview>.vercel.app node evals/journey-review.mjs
//
// The judge needs ANTHROPIC_API_KEY (read from ../.env like the sibling scripts).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const OUT_DIR = join(__dirname, "output");

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(APP_ROOT, ".env"))) {
  const env = readFileSync(join(APP_ROOT, ".env"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const JUDGE_MODEL = "claude-sonnet-4-6";

const CATEGORY_TITLES = {
  content: "Content Creation", automation: "Task Automation",
  research: "Research & Synthesis", data: "Data & Insights",
  coding: "Technical Work", ideation: "Strategy & Ideation",
};
const RULE_DEFS = {
  destination: { number: 1, name: "Start at the End", principle: "Show the destination and create emotional resonance. People can't move toward something they can't picture, and they won't move toward something they don't feel." },
  safe: { number: 2, name: "Make It Safe", principle: "People won't try what they can't afford to fail at. Protect the stumbling, respect the loss, and celebrate experiments." },
  script: { number: 3, name: "Script the Steps", principle: 'Don\'t ask people to "embrace change." Tell them what to do on Monday morning.' },
  small: { number: 4, name: "Start Small, to go Big", principle: "Begin contained, expand with proof." },
  visible: { number: 5, name: "Make Progress Visible", principle: "Communicate relentlessly. Show wins. Sustain the narrative." },
};

// ---------------------------------------------------------------- personas
const PERSONAS = [
  {
    key: "cs-head",
    label: "Head of Customer Success (QBR-heavy vision, veteran skeptics)",
    intake: {
      role: "Head of Customer Success at a 200-person SaaS company, leading a team of 12 CSMs",
      responsibilities: "Customer health monitoring, escalations, QBR preparation, renewals forecasting, onboarding playbooks, and CS team training",
      helpWith: ["Save time on repetitive work", "Scale my impact beyond my capacity"],
      managerFluency: "Capable -- I use AI tools purposefully for specific tasks and can explain how they help",
      teamFluency: "Not yet started -- Most of my team hasn't engaged with AI tools in any meaningful way",
      failureRisks: "Two veteran CSMs see AI-written customer emails as impersonal and beneath their craft, and the rest of the team follows their lead",
      successVision: "Every CSM uses AI to prep QBRs and client calls, and we cut QBR prep time in half",
    },
    p2ChatOpen: "What else could AI take off my plate that isn't already in this list?",
    p2ChatPushback: "These feel too obvious, my team already talks about this stuff. Give me something I haven't thought of.",
    p3ChatOpen: "How do I get my two veterans on board without it turning into a confrontation?",
  },
  {
    key: "eng-manager",
    label: "Engineering Manager (low-fluency manager, ambitious vision)",
    intake: {
      role: "Engineering Manager at a 60-person fintech SaaS, leads 8 backend and platform engineers",
      responsibilities: "Sprint planning, incident reviews, architecture decisions, code review standards, on-call rotations, hiring and onboarding engineers",
      helpWith: ["Make better decisions with data", "Keep up with information overload"],
      managerFluency: "Not yet started -- I know I should be using AI but haven't found the right entry point yet",
      teamFluency: "Capable -- A few people use AI for specific tasks, but it's individual and inconsistent",
      failureRisks: "The team already thinks I'm behind on AI; if my first push is clumsy they'll quietly ignore it and keep doing their own thing",
      successVision: "Incident postmortems, sprint summaries, and architecture docs get first-drafted by AI, and I stop being the bottleneck",
    },
    p2ChatOpen: "I'm drowning in incident reports and design docs. Where does AI actually help me first?",
    p2ChatPushback: "You're repeating what's on my list. I need an angle my engineers would actually be impressed by.",
    p3ChatOpen: "My team is ahead of me on AI. How do I lead this without pretending to be the expert?",
  },
  {
    key: "hr-partner",
    label: "HR Business Partner (sensitive data, cautious org)",
    intake: {
      role: "HR Business Partner supporting a 300-person engineering org at a public SaaS company",
      responsibilities: "Performance review cycles, compensation planning, employee relations cases, manager coaching, headcount planning and org design",
      helpWith: ["Improve the quality of what I produce", "Make better decisions with data"],
      managerFluency: "Capable -- I use AI tools purposefully for specific tasks and can explain how they help",
      teamFluency: "Not yet started -- Most of my team hasn't engaged with AI tools in any meaningful way",
      failureRisks: "Anything that smells like AI reading employee data will trigger legal and works-council pushback, and one bad privacy moment kills the whole effort",
      successVision: "Manager coaching prep and review-cycle calibration docs take half the time, without any employee data ever leaving approved tools",
    },
    p2ChatOpen: "Most AI ideas I hear assume I can paste employee data into a chatbot. What can I do that legal would actually approve?",
    p2ChatPushback: "Half of these still touch sensitive data. Push further, what's genuinely safe AND useful?",
    p3ChatOpen: "How do I make progress visible when most of my wins are confidential by nature?",
  },
];

// ---------------------------------------------------------------- helpers
async function api(path, body) {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function judge(prompt, tool) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: JUDGE_MODEL, max_tokens: 2000, tools: [tool], tool_choice: { type: "tool", name: tool.name }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Judge ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.content.find((b) => b.type === "tool_use").input;
}

const SCORE_TOOL = {
  name: "submit_review",
  description: "Submit a quality review of one stage.",
  input_schema: {
    type: "object",
    required: ["score", "strengths", "issues"],
    properties: {
      score: { type: "integer", minimum: 1, maximum: 5, description: "1 = unusable, 3 = acceptable, 5 = excellent" },
      strengths: { type: "array", items: { type: "string" }, description: "What genuinely works (max 3)" },
      issues: { type: "array", items: { type: "string" }, description: "Concrete problems, quoting the offending text (max 4, empty if none)" },
    },
  },
};

const PICK_TOOL = {
  name: "pick_items",
  description: "Pick the item numbers this manager would star.",
  input_schema: {
    type: "object", required: ["picks", "why"],
    properties: {
      picks: { type: "array", items: { type: "integer" }, description: "Item numbers" },
      why: { type: "string", description: "One sentence on the selection logic" },
    },
  },
};

const DOMINANCE_TOOL = {
  name: "report_dominance",
  description: "Report the single most-repeated deliverable/workflow across the actions.",
  input_schema: {
    type: "object", required: ["theme", "count", "total"],
    properties: {
      theme: { type: "string", description: "The dominant deliverable, e.g. 'QBR prep'" },
      count: { type: "integer", description: "How many actions center on it" },
      total: { type: "integer", description: "Total number of actions" },
    },
  },
};

function profileBlock(intake) {
  return `Role: ${intake.role}\nResponsibilities: ${intake.responsibilities}\nWants help with: ${intake.helpWith.join(", ")}\nManager fluency: ${intake.managerFluency}\nTeam fluency: ${intake.teamFluency}\nFailure risks: ${intake.failureRisks}\n90-day vision: ${intake.successVision}`;
}

function flatIdeas(primitives) {
  const flat = [];
  for (const [cat, arr] of Object.entries(primitives)) for (const text of arr) flat.push({ cat, text });
  return flat;
}

const wordSet = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3));
function overlap(a, b) {
  const A = wordSet(a), B = wordSet(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}
// Highest word overlap between any new idea and any prior text; > 0.6 smells like a re-suggestion.
function maxOverlap(newIdeas, priorTexts) {
  let worst = { score: 0, pair: null };
  for (const n of newIdeas) for (const p of priorTexts) {
    const s = overlap(n, p);
    if (s > worst.score) worst = { score: s, pair: [n, p] };
  }
  return worst;
}

// ---------------------------------------------------------------- journey
async function runPersona(p) {
  const R = { key: p.key, label: p.label, stages: {}, scores: {}, issues: [] };
  const t0 = Date.now();
  console.log(`\n=== ${p.label}`);

  // -- Phase 2: generate use cases
  const { primitives } = await api("/api/primitives-generate", { intake: p.intake });
  R.stages.primitives = primitives;
  const counts = Object.entries(primitives).map(([k, v]) => `${k}:${v.length}`).join(" ");
  console.log(`  ideas: ${flatIdeas(primitives).length} (${counts})`);

  // -- simulate starring 4 ideas
  const ideas = flatIdeas(primitives);
  const ideaList = ideas.map((x, i) => `${i + 1}. [${CATEGORY_TITLES[x.cat]}] ${x.text}`).join("\n");
  const starPick = await judge(
    `You are simulating this manager in a workshop:\n${profileBlock(p.intake)}\n\nThese AI use case ideas were generated for them:\n${ideaList}\n\nPick the 4 ideas this specific manager would realistically star (most valuable, most aligned with what they want help with and their vision).`,
    PICK_TOOL,
  );
  const starredIdx = new Set(starPick.picks.map((n) => n - 1));
  const starredPrimObjs = ideas.filter((_, i) => starredIdx.has(i));
  const starredPrimitives = starredPrimObjs.map((x) => ({ category: CATEGORY_TITLES[x.cat], text: x.text }));
  R.stages.starredIdeas = starredPrimObjs.map((x) => `[${CATEGORY_TITLES[x.cat]}] ${x.text}`);
  console.log(`  starred: ${starPick.picks.join(",")} (${starPick.why})`);

  // -- Phase 2 chat: open + pushback (2 turns, real history contract)
  const chatCat = Object.entries(primitives).sort((a, b) => b[1].length - a[1].length)[0][0];
  const catObj = { id: chatCat, number: 1, title: CATEGORY_TITLES[chatCat], description: "" };
  const allPrimitives = Object.fromEntries(Object.entries(primitives).map(([k, v]) => [k, v.map((text, i) => ({ text, starred: starredIdx.has(ideas.findIndex((x) => x.cat === k && x.text === text)) }))]));
  const currentItems = primitives[chatCat];
  const opener = { role: "assistant", content: `Let's explore ${CATEGORY_TITLES[chatCat].toLowerCase()} for your role. What would be most useful to dig into?` };

  const chatBody = (chatHistory, userMessage) => ({
    mode: "primitives", intake: p.intake, category: catObj,
    currentItems, allPrimitives, allPlan: {}, starredPrimitives,
    chatHistory, userMessage,
  });
  const turn1 = await api("/api/chat", chatBody([opener], p.p2ChatOpen));
  const hist2 = [opener, { role: "user", content: p.p2ChatOpen }, { role: "assistant", content: turn1.content, ideas: turn1.ideas }];
  const turn2 = await api("/api/chat", chatBody(hist2, p.p2ChatPushback));
  R.stages.p2chat = { category: CATEGORY_TITLES[chatCat], open: p.p2ChatOpen, turn1, pushback: p.p2ChatPushback, turn2 };
  const p2rep = maxOverlap(turn2.ideas.map((i) => i.text), [...turn1.ideas.map((i) => i.text), ...currentItems]);
  R.stages.p2chatRepetition = p2rep;
  console.log(`  p2 chat: turn1 ${turn1.ideas.length} ideas, turn2 ${turn2.ideas.length} ideas, max overlap ${(p2rep.score * 100).toFixed(0)}%`);

  // -- Phase 3: generate plan
  const { plan } = await api("/api/playbook-generate", { intake: p.intake, starredPrimitives });
  R.stages.plan = plan;
  const planCounts = Object.entries(plan).map(([k, v]) => `${k}:${v.length}`).join(" ");
  const totalActions = Object.values(plan).flat().length;
  console.log(`  plan: ${totalActions} actions (${planCounts})`);

  // -- dominance check
  const actionsList = Object.entries(plan).flatMap(([rule, arr]) => arr.map((a) => `[${RULE_DEFS[rule].name}] ${a}`)).join("\n");
  const dom = await judge(`Across these change-management actions, identify the single most-repeated deliverable or workflow (e.g. "QBR prep", "incident postmortems"). Count how many actions center on it.\n\n${actionsList}`, DOMINANCE_TOOL);
  R.stages.dominance = dom;
  console.log(`  dominance: ${dom.theme} in ${dom.count}/${dom.total}`);

  // -- simulate starring 3 actions
  const flatActions = Object.entries(plan).flatMap(([rule, arr]) => arr.map((text) => ({ rule, text })));
  const actPickList = flatActions.map((a, i) => `${i + 1}. [${RULE_DEFS[a.rule].name}] ${a.text}`).join("\n");
  const actPick = await judge(
    `You are simulating this manager:\n${profileBlock(p.intake)}\n\nPick the 3 change actions they would star as top priorities:\n${actPickList}`,
    PICK_TOOL,
  );
  const actStarIdx = new Set(actPick.picks.map((n) => n - 1));
  R.stages.starredActions = flatActions.filter((_, i) => actStarIdx.has(i)).map((a) => `[${RULE_DEFS[a.rule].name}] ${a.text}`);

  // -- Phase 3 chat: open + hard pushback on the dominant theme
  const chatRule = Object.entries(plan).sort((a, b) => b[1].length - a[1].length)[0][0];
  const rd = RULE_DEFS[chatRule];
  const allPlan = Object.fromEntries(Object.entries(plan).map(([k, v], ) => [k, v.map((text, i) => ({ text, starred: actStarIdx.has(flatActions.findIndex((x) => x.rule === k && x.text === text)) }))]));
  const p3pushback = `Stop giving me ${dom.theme} ideas. All of this is about ${dom.theme}. Give me something new.`;
  const p3opener = { role: "assistant", content: `Let's explore ${rd.name}. What would be most useful to dig into?` };
  const p3Body = (chatHistory, userMessage) => ({
    mode: "playbook", intake: p.intake,
    rule: { id: chatRule, number: rd.number, name: rd.name, principle: rd.principle },
    currentItems: plan[chatRule], allPrimitives: allPrimitives, allPlan, starredPrimitives,
    chatHistory, userMessage,
  });
  const p3turn1 = await api("/api/chat", p3Body([p3opener], p.p3ChatOpen));
  const p3hist2 = [p3opener, { role: "user", content: p.p3ChatOpen }, { role: "assistant", content: p3turn1.content, ideas: p3turn1.ideas }];
  const p3turn2 = await api("/api/chat", p3Body(p3hist2, p3pushback));
  R.stages.p3chat = { rule: rd.name, open: p.p3ChatOpen, turn1: p3turn1, pushback: p3pushback, turn2: p3turn2 };
  const p3rep = maxOverlap(p3turn2.ideas.map((i) => i.text), [...p3turn1.ideas.map((i) => i.text), ...plan[chatRule]]);
  R.stages.p3chatRepetition = p3rep;
  console.log(`  p3 chat: pushback on "${dom.theme}", turn2 ${p3turn2.ideas.length} ideas, max overlap ${(p3rep.score * 100).toFixed(0)}%`);

  // -- Phase 4: synthesis (starred flags included)
  const synthPrimitives = allPrimitives;
  const synthPlan = allPlan;
  const { synthesis } = await api("/api/synthesis-generate", { intake: p.intake, primitives: synthPrimitives, plan: synthPlan });
  R.stages.synthesis = synthesis;
  console.log(`  big move: "${synthesis.bigMoveTitle}" (${(synthesis.actions || []).length} actions)`);

  // ---------------------------------------------------------- judging
  const J = {};
  J.ideas = await judge(
    `Review these AI use case ideas generated for a manager.\n\nMANAGER:\n${profileBlock(p.intake)}\n\nIDEAS:\n${ideaList}\n\nCriteria (judge by expected VALUE for this manager):\n1. Specific to this person's actual work, not a generic template for the role title.\n2. Value: ideas hit recurring, painful work; at least one directly serves the work the 90-day vision names. Altitude mix: roughly four ideas should be genuine BIG SWINGS, transformative reshapes of realms the manager named, each with a first probe that fits the fluency floor; a list of nothing but incremental accelerations is a defect.\n3. Floors: team-run ideas fit the TEAM's fluency (a not-yet-started team only pastes into chat or chats with an assistant someone set up for them; ideas the manager runs personally may use the manager's fluency; a tool the manager configures once that the team then uses by simple chat IS team-feasible). Hard constraints in the failure risks are respected.\n4. ZERO ideas about the AI adoption effort itself (adoption plans, AI training, prompt libraries); use cases must apply AI to the work.\n5. Modality spread: at least four distinct families across the list (one-shot transformation, preloaded assistant, critique/red-team, role-play, transcription plus synthesis, in-tool AI, automated workflows); a paste-only monoculture is a defect.`,
    SCORE_TOOL,
  );
  J.p2chat = await judge(
    `Review a 2-turn coaching chat about ${CATEGORY_TITLES[chatCat]} use cases.\n\nMANAGER:\n${profileBlock(p.intake)}\n\nEXISTING IDEAS IN THIS CATEGORY:\n${currentItems.join("\n")}\n\nTURN 1 user: ${p.p2ChatOpen}\nTURN 1 assistant: ${turn1.content}\nTURN 1 suggested: ${turn1.ideas.map((i) => i.text).join(" | ")}\n\nTURN 2 user (pushback): ${p.p2ChatPushback}\nTURN 2 assistant: ${turn2.content}\nTURN 2 suggested: ${turn2.ideas.map((i) => i.text).join(" | ")}\n\nCriteria:\n1. Replies are tight (about 60 words), no preamble, end with a question that opens a NEW angle.\n2. Turn 2 respects the pushback: no rephrasing of turn-1 suggestions or existing list items, no defending, a genuinely different angle.\n3. Suggestions are concrete and grounded in this manager's actual work.\n4. For this persona, respects their constraints (e.g. data sensitivity for HR).`,
    SCORE_TOOL,
  );
  J.plan = await judge(
    `Review this AI change strategy (2 actions per rule, 3 on prioritized rules, server-enforced).\n\nMANAGER:\n${profileBlock(p.intake)}\n\nSTARRED USE CASES:\n${starredPrimitives.map((s) => `- ${s.category}: ${s.text}`).join("\n")}\n\nPLAN:\n${actionsList}\n\nCriteria (judge the leverage of each move, never the mix of move types):\n1. Actions are specific to this person, concrete enough for Monday morning, under ~25 words.\n2. Failure risks are addressed head-on: the intake's actual named loss, not the stock fear-of-failure set.\n3. Starred use cases appear as anchors where natural; placement is clean (Rule 2 stays about people and fears, never workflow mechanics; Rule 1 names the pilot workflow at most once).\n4. Each action operationalizes its rule's lever (destination vivid, losses named, steps scripted or defaults changed, pilot contained and sequenced, progress rhythmic); generic management hygiene with no operational content is a defect. Do NOT penalize how many Rule 3-5 actions center on the pilot workflow; the one-pilot chain is the methodology working.\n5. Stock moves are fit-checked: nothing assumes an experimenting peer, a willing volunteer, or a venue the profile does not support.\n6. Change moves, not workflow implementation: flag any action whose real content is building, configuring, or operating the AI workflow itself (prompt templates, tool setup, running the use case as a task); the plan's actions are the human moves around the workflow.`,
    SCORE_TOOL,
  );
  J.p3chat = await judge(
    `Review a 2-turn coaching chat on the change rule "${rd.name}". The manager pushed back hard in turn 2.\n\nMANAGER:\n${profileBlock(p.intake)}\n\nTURN 1 user: ${p.p3ChatOpen}\nTURN 1 assistant: ${p3turn1.content}\nTURN 1 suggested: ${p3turn1.ideas.map((i) => i.text).join(" | ")}\n\nTURN 2 user (pushback): ${p3pushback}\nTURN 2 assistant: ${p3turn2.content}\nTURN 2 suggested: ${p3turn2.ideas.map((i) => i.text).join(" | ")}\n\nCriteria:\n1. Turn 2 pivots completely off the theme the manager rejected; zero suggestions still centered on it.\n2. No defensiveness, no apology spiral; adapts immediately.\n3. Suggestions stay realistic and specific to this manager.\n4. Replies stay ~60 words and end with a question opening a new angle.`,
    SCORE_TOOL,
  );
  J.synthesis = await judge(
    `Review this "Big Move" synthesis of the manager's starred items.\n\nMANAGER:\n${profileBlock(p.intake)}\n\nSTARRED USE CASES:\n${starredPrimitives.map((s) => `- ${s.category}: ${s.text}`).join("\n")}\n\nSTARRED ACTIONS:\n${R.stages.starredActions.join("\n")}\n\nBIG MOVE TITLE: ${synthesis.bigMoveTitle}\nACTIONS:\n${(synthesis.actions || []).map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nCriteria:\n1. Title is ONE concrete move, 8-12 words, verb-first, no role mention, no invented deadline.\n2. Actions draw primarily from starred items, original wording recognizable.\n3. Action #1 is doable tomorrow.\n4. It's a focus, not a summary: coherent single thread.`,
    SCORE_TOOL,
  );
  R.scores = J;

  // mechanical flags
  if (p2rep.score > 0.6) R.issues.push(`P2 chat turn-2 idea overlaps ${(p2rep.score * 100).toFixed(0)}% with earlier content: "${p2rep.pair[0]}"`);
  if (p3rep.score > 0.6) R.issues.push(`P3 chat turn-2 idea overlaps ${(p3rep.score * 100).toFixed(0)}% with earlier content: "${p3rep.pair[0]}"`);
  if (dom.count / Math.max(1, dom.total) > 0.4) R.issues.push(`Workflow dominance: ${dom.theme} in ${dom.count}/${dom.total} actions`);
  for (const [stage, j] of Object.entries(J)) for (const iss of j.issues || []) R.issues.push(`[${stage}] ${iss}`);

  R.seconds = Math.round((Date.now() - t0) / 1000);
  console.log(`  scores: ideas ${J.ideas.score} | p2chat ${J.p2chat.score} | plan ${J.plan.score} | p3chat ${J.p3chat.score} | synthesis ${J.synthesis.score}  (${R.seconds}s)`);
  return R;
}

// ---------------------------------------------------------------- report
function md(results) {
  const lines = [`# Journey Review — ${new Date().toISOString().slice(0, 16)}`, "", `Target: ${BASE_URL}`, ""];
  lines.push("| Persona | Ideas | P2 Chat | Plan | P3 Chat | Big Move | Flags |", "|---|---|---|---|---|---|---|");
  for (const r of results) {
    const s = r.scores;
    lines.push(`| ${r.label} | ${s.ideas.score}/5 | ${s.p2chat.score}/5 | ${s.plan.score}/5 | ${s.p3chat.score}/5 | ${s.synthesis.score}/5 | ${r.issues.length} |`);
  }
  for (const r of results) {
    lines.push("", `---`, "", `## ${r.label}`, "");
    if (r.issues.length) { lines.push("**Flags:**"); for (const i of r.issues) lines.push(`- ${i}`); lines.push(""); }
    lines.push("### Use cases");
    for (const [cat, arr] of Object.entries(r.stages.primitives)) {
      lines.push(`**${CATEGORY_TITLES[cat]}** (${arr.length})`);
      for (const t of arr) lines.push(`- ${r.stages.starredIdeas.includes(`[${CATEGORY_TITLES[cat]}] ${t}`) ? "★ " : ""}${t}`);
    }
    lines.push("", `*Judge (${r.scores.ideas.score}/5):* ${[...(r.scores.ideas.strengths || []), ...(r.scores.ideas.issues || []).map((i) => `⚠ ${i}`)].join(" · ")}`);
    const c2 = r.stages.p2chat;
    lines.push("", `### Phase 2 chat (${c2.category})`);
    lines.push(`> **You:** ${c2.open}`, `> **AI:** ${c2.turn1.content}`, `> suggested: ${c2.turn1.ideas.map((i) => i.text).join(" | ") || "(none)"}`, `>`, `> **You (pushback):** ${c2.pushback}`, `> **AI:** ${c2.turn2.content}`, `> suggested: ${c2.turn2.ideas.map((i) => i.text).join(" | ") || "(none)"}`);
    lines.push("", `*Judge (${r.scores.p2chat.score}/5):* ${[...(r.scores.p2chat.strengths || []), ...(r.scores.p2chat.issues || []).map((i) => `⚠ ${i}`)].join(" · ")}`);
    lines.push("", "### Change strategy");
    for (const [rule, arr] of Object.entries(r.stages.plan)) {
      lines.push(`**${RULE_DEFS[rule].name}** (${arr.length})`);
      for (const t of arr) lines.push(`- ${r.stages.starredActions.includes(`[${RULE_DEFS[rule].name}] ${t}`) ? "★ " : ""}${t}`);
    }
    lines.push("", `Dominant workflow: **${r.stages.dominance.theme}** in ${r.stages.dominance.count}/${r.stages.dominance.total} actions`);
    lines.push("", `*Judge (${r.scores.plan.score}/5):* ${[...(r.scores.plan.strengths || []), ...(r.scores.plan.issues || []).map((i) => `⚠ ${i}`)].join(" · ")}`);
    const c3 = r.stages.p3chat;
    lines.push("", `### Phase 3 chat (${c3.rule})`);
    lines.push(`> **You:** ${c3.open}`, `> **AI:** ${c3.turn1.content}`, `> suggested: ${c3.turn1.ideas.map((i) => i.text).join(" | ") || "(none)"}`, `>`, `> **You (pushback):** ${c3.pushback}`, `> **AI:** ${c3.turn2.content}`, `> suggested: ${c3.turn2.ideas.map((i) => i.text).join(" | ") || "(none)"}`);
    lines.push("", `*Judge (${r.scores.p3chat.score}/5):* ${[...(r.scores.p3chat.strengths || []), ...(r.scores.p3chat.issues || []).map((i) => `⚠ ${i}`)].join(" · ")}`);
    lines.push("", "### Big Move");
    lines.push(`**${r.stages.synthesis.bigMoveTitle}**`);
    for (const [i, a] of (r.stages.synthesis.actions || []).entries()) lines.push(`${i + 1}. ${a}`);
    lines.push("", `*Judge (${r.scores.synthesis.score}/5):* ${[...(r.scores.synthesis.strengths || []), ...(r.scores.synthesis.issues || []).map((i) => `⚠ ${i}`)].join(" · ")}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- main
mkdirSync(OUT_DIR, { recursive: true });
const results = [];
for (const p of PERSONAS) {
  try { results.push(await runPersona(p)); }
  catch (e) { console.error(`FAILED ${p.key}: ${e.message}`); results.push({ key: p.key, label: p.label, error: e.message, stages: {}, scores: {}, issues: [`journey aborted: ${e.message}`] }); }
}
const ok = results.filter((r) => !r.error);
writeFileSync(join(OUT_DIR, "journey-review.json"), JSON.stringify(results, null, 2));
writeFileSync(join(OUT_DIR, "journey-review.md"), md(ok));
console.log(`\nWrote evals/output/journey-review.md and .json`);
const flagged = ok.flatMap((r) => r.issues);
console.log(`Personas: ${ok.length}/${PERSONAS.length} completed, total flags: ${flagged.length}`);
