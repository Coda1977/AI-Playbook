// Renders evals/output/journey-review.json into a self-contained HTML review
// page (evals/output/journey-review.html) in the AI Playbook design language.
// Run after journey-review.mjs:  node evals/journey-report-html.mjs

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");
const results = JSON.parse(readFileSync(join(OUT, "journey-review.json"), "utf8")).filter((r) => !r.error);

// Inline Montserrat (variable) from the built assets so the page is self-contained.
let fontCss = "";
const distAssets = join(__dirname, "..", "dist", "assets");
if (existsSync(distAssets)) {
  const woff2 = readdirSync(distAssets).find((f) => /^montserrat-latin-(?!ext)/.test(f));
  if (woff2) {
    const b64 = readFileSync(join(distAssets, woff2)).toString("base64");
    fontCss = `@font-face{font-family:'Montserrat';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:100 900;font-style:normal;font-display:swap;}`;
  }
}

const CATEGORY_TITLES = { content: "Content Creation", automation: "Task Automation", research: "Research & Synthesis", data: "Data & Insights", coding: "Technical Work", ideation: "Strategy & Ideation" };
const RULE_NAMES = { destination: "Start at the End", safe: "Make It Safe", script: "Script the Steps", small: "Start Small, to go Big", visible: "Make Progress Visible" };
const STAGES = [["ideas", "Use cases"], ["p2chat", "Chat: use cases"], ["plan", "Change strategy"], ["p3chat", "Chat: strategy"], ["synthesis", "Big Move"]];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const scoreColor = (n) => (n >= 5 ? "#2D6A4F" : n === 4 ? "#00a3e0" : n === 3 ? "#B45309" : "#e30613");
const chip = (n) => `<span class="score" style="--sc:${scoreColor(n)}">${n}<span class="of">/5</span></span>`;

function judgeBlock(j) {
  if (!j) return "";
  const s = (j.strengths || []).map((x) => `<li class="good">${esc(x)}</li>`).join("");
  const i = (j.issues || []).map((x) => `<li class="bad">${esc(x)}</li>`).join("");
  return `<div class="judge"><div class="judge-head">Judge ${chip(j.score)}</div><ul>${s}${i}</ul></div>`;
}

function chatBlock(c, rep) {
  const ideas = (arr) => (arr && arr.length ? `<div class="sugg">${arr.map((i) => `<span>${esc(i.text)}</span>`).join("")}</div>` : "");
  return `
  <div class="chat">
    <div class="msg you"><div class="who">Manager</div>${esc(c.open)}</div>
    <div class="msg ai"><div class="who">AI</div>${esc(c.turn1.content)}${ideas(c.turn1.ideas)}</div>
    <div class="msg you push"><div class="who">Manager · pushback</div>${esc(c.pushback)}</div>
    <div class="msg ai"><div class="who">AI</div>${esc(c.turn2.content)}${ideas(c.turn2.ideas)}</div>
  </div>
  <p class="meta">Repetition check: turn-2 ideas overlap ${(rep.score * 100).toFixed(0)}% with earlier content (flag line: 60%).</p>`;
}

const personaSections = results.map((r, idx) => {
  const st = r.stages, sc = r.scores;
  const ideasHtml = Object.entries(st.primitives).map(([cat, arr]) => `
    <div class="cat"><div class="cat-name" style="--cc:${{ content: "#2D6A4F", automation: "#5B21B6", research: "#1D4ED8", data: "#B45309", coding: "#475569", ideation: "#BE185D" }[cat]}">${CATEGORY_TITLES[cat]} <em>${arr.length}</em></div>
    <ul>${arr.map((t) => `<li>${st.starredIdeas.includes(`[${CATEGORY_TITLES[cat]}] ${t}`) ? "<b class='star'>★</b> " : ""}${esc(t)}</li>`).join("")}</ul></div>`).join("");
  const planHtml = Object.entries(st.plan).map(([rule, arr]) => `
    <div class="cat"><div class="cat-name" style="--cc:#e30613">${RULE_NAMES[rule]} <em>${arr.length}</em></div>
    <ul>${arr.map((t) => `<li>${st.starredActions.includes(`[${RULE_NAMES[rule]}] ${t}`) ? "<b class='star'>★</b> " : ""}${esc(t)}</li>`).join("")}</ul></div>`).join("");
  const domPct = Math.round((st.dominance.count / Math.max(1, st.dominance.total)) * 100);
  return `
  <section id="p${idx}">
    <div class="kicker">Persona ${idx + 1}</div>
    <h2>${esc(r.label)}</h2>
    <div class="scorebar">${STAGES.map(([k, l]) => `<div><span class="sb-label">${l}</span>${chip(sc[k].score)}</div>`).join("")}</div>

    <h3>Use cases <span class="count">(${Object.values(st.primitives).flat().length}, ★ = simulated star)</span></h3>
    <div class="cats">${ideasHtml}</div>
    ${judgeBlock(sc.ideas)}

    <h3>Chat pushback · ${esc(st.p2chat.category)}</h3>
    ${chatBlock(st.p2chat, st.p2chatRepetition)}
    ${judgeBlock(sc.p2chat)}

    <h3>Change strategy <span class="count">(${Object.values(st.plan).flat().length} actions)</span></h3>
    <div class="cats">${planHtml}</div>
    <p class="dominance ${domPct > 40 ? "hot" : ""}">Dominant workflow: <b>${esc(st.dominance.theme)}</b> anchors ${st.dominance.count}/${st.dominance.total} actions (${domPct}%) · target ≤ ~33%</p>
    ${judgeBlock(sc.plan)}

    <h3>Chat pushback · ${esc(st.p3chat.rule)}</h3>
    ${chatBlock(st.p3chat, st.p3chatRepetition)}
    ${judgeBlock(sc.p3chat)}

    <h3>Big Move</h3>
    <div class="bigmove"><div class="bm-title">${esc(st.synthesis.bigMoveTitle)}</div>
    <ol>${(st.synthesis.actions || []).map((a) => `<li>${esc(a)}</li>`).join("")}</ol></div>
    ${judgeBlock(sc.synthesis)}
  </section>`;
}).join("");

const summaryRows = results.map((r, idx) => `
  <tr><td><a href="#p${idx}">${esc(r.label)}</a></td>${STAGES.map(([k]) => `<td>${chip(r.scores[k].score)}</td>`).join("")}<td class="num">${r.issues.length}</td></tr>`).join("");

const html = `<title>AI Playbook — Journey Review</title>
<style>
${fontCss}
:root{--ink:#000;--paper:#fff;--red:#e30613;--blue:#00a3e0;--surface:#f5f5f5;--gray:#666;--line:#e2e2e2;--star:#F5B700;}
body{font-family:'Montserrat',system-ui,sans-serif;color:var(--ink);background:var(--paper);margin:0;line-height:1.55;}
.wrap{max-width:900px;margin:0 auto;padding:0 24px 80px;}
header{background:var(--ink);color:#fff;padding:44px 0 36px;}
header .wrap{padding-bottom:0;}
.eyebrow{color:var(--red);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;}
h1{font-size:clamp(26px,4vw,38px);font-weight:700;margin:.35em 0 .2em;text-wrap:balance;}
.sub{color:rgba(255,255,255,.65);font-size:14px;}
h2{font-size:24px;font-weight:700;margin:0 0 14px;text-wrap:balance;}
h3{font-size:15px;font-weight:700;margin:34px 0 10px;letter-spacing:.02em;}
h3 .count{color:var(--gray);font-weight:400;font-size:13px;}
.kicker{color:var(--red);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px;}
section{border-top:2px solid var(--ink);margin-top:56px;padding-top:28px;}
table{border-collapse:collapse;width:100%;font-size:14px;}
.tablebox{overflow-x:auto;margin:22px 0 8px;}
th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:8px 10px;border-bottom:2px solid var(--ink);white-space:nowrap;}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:middle;}
td a{color:var(--ink);font-weight:600;text-decoration:none;border-bottom:2px solid var(--red);}
.num{font-variant-numeric:tabular-nums;}
.score{display:inline-flex;align-items:baseline;gap:1px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--sc);}
.score .of{font-size:11px;color:var(--gray);font-weight:400;}
.scorebar{display:flex;flex-wrap:wrap;gap:10px 26px;background:var(--surface);padding:12px 16px;margin:4px 0 8px;}
.scorebar>div{display:flex;align-items:baseline;gap:8px;}
.sb-label{font-size:12px;color:var(--gray);}
.cats{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px 28px;}
.cat-name{font-weight:700;font-size:13px;color:var(--cc);text-transform:uppercase;letter-spacing:.05em;}
.cat-name em{font-style:normal;color:var(--gray);font-weight:400;}
.cat ul{margin:6px 0 0;padding-left:18px;font-size:14px;}
.cat li{margin:3px 0;}
.star{color:var(--star);}
.judge{border-left:3px solid var(--ink);background:var(--surface);padding:10px 16px;margin:14px 0;font-size:13.5px;}
.judge-head{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;display:flex;gap:8px;align-items:baseline;}
.judge ul{margin:4px 0 2px;padding-left:16px;}
.judge li{margin:5px 0;}
.judge li.good::marker{content:'+  ';color:#2D6A4F;font-weight:700;}
.judge li.bad::marker{content:'!  ';color:var(--red);font-weight:700;}
.chat{display:flex;flex-direction:column;gap:10px;margin:12px 0 4px;}
.msg{max-width:78%;padding:10px 14px;font-size:14px;border-radius:2px;}
.msg .who{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.55;margin-bottom:3px;}
.you{background:var(--ink);color:#fff;align-self:flex-end;}
.you.push{outline:2px solid var(--red);outline-offset:2px;}
.ai{background:var(--surface);align-self:flex-start;}
.sugg{display:flex;flex-direction:column;gap:6px;margin-top:9px;}
.sugg span{border:1px solid var(--blue);color:#04516e;background:#fff;font-size:12.5px;padding:6px 9px;}
.meta{font-size:12px;color:var(--gray);margin:6px 0 0;}
.dominance{font-size:13.5px;background:var(--surface);padding:9px 14px;margin:12px 0;}
.dominance.hot{border-left:3px solid var(--red);}
.bigmove{border:2px solid var(--ink);padding:18px 22px;margin:10px 0;}
.bm-title{font-size:19px;font-weight:700;text-wrap:balance;}
.bigmove ol{margin:12px 0 2px;padding-left:20px;font-size:14px;}
.bigmove li{margin:6px 0;}
.findings{background:var(--surface);border-left:3px solid var(--red);padding:16px 20px;margin:24px 0;}
.findings h3{margin:0 0 8px;}
.findings ul{margin:0;padding-left:18px;font-size:14px;}
.findings li{margin:7px 0;}
@media (prefers-reduced-motion: no-preference){ a{transition:opacity .15s;} a:hover{opacity:.7;} }
</style>
<header><div class="wrap">
  <div class="eyebrow">AI Playbook · Quality Harness</div>
  <h1>Journey Review</h1>
  <div class="sub">${results.length} simulated personas · full workshop flow against the live API · generated ${new Date().toISOString().slice(0, 10)} · scores by LLM judge (Sonnet 4.6) + mechanical checks</div>
</div></header>
<div class="wrap">
  <div class="tablebox"><table>
    <thead><tr><th>Persona</th>${STAGES.map(([, l]) => `<th>${l}</th>`).join("")}<th>Flags</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table></div>
  <p class="meta">Every persona: generate use cases → simulate starring → chat + hard pushback → generate strategy → chat + pushback on the dominant theme → Big Move. Flags aggregate every judge issue and mechanical trip; most are minor. Read the judge boxes for the substance.</p>
  ${personaSections}
</div>`;

writeFileSync(join(OUT, "journey-review.html"), html);
console.log("Wrote evals/output/journey-review.html");
