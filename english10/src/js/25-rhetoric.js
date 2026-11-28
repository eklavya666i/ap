// ---------- Unit 4, Intro to Rhetoric: the class study sheet and notes, annotations for A Small Place pages 1-9, the
// paragraph plan with an estimated score, sentence building, analysis sentences, debate moves, practice passages,
// quizzes, a practice test and two sample tests, and scores. Content: content/rhetoric.js. Checks: lib/rhetcheck.js.
const SHEET = Object.values(RHET.order).flat().map(t => TERM[slug(t)]).filter(Boolean);
const RH_NOEX = ["Rhetoric", "Logical fallacy"];   // umbrella terms: never a wrong choice, never asked by example
const RH_ALT = {"Logical fallacy": ["Bias", "Rebuttal", "Counterargument"]};
// Terms that an example of this term also shows, so they can't be its wrong choices
const RH_CLASH = {"Anaphora": ["Repetition", "Parallel structure"], "Epistrophe": ["Repetition", "Parallel structure", "Asyndeton"], "Asyndeton": ["Anaphora", "Parallel structure", "Repetition"],
  "Polysyndeton": ["Repetition", "Parallel structure"], "Antithesis": ["Parallel structure", "Juxtaposition"], "Juxtaposition": ["Antithesis"], "Repetition": ["Anaphora", "Parallel structure"],
  "Parallel structure": ["Repetition", "Anaphora"], "Hypophora": ["Rhetorical question"], "Rhetorical question": ["Hypophora"], "Apostrophe": ["Rhetorical question", "Hypophora"],
  "Counterargument": ["Claim"], "Hasty generalization": ["Bias"]};
const shuffleR = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const seeded = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
const rhRoots = t => t.t.toLowerCase().split(/[\s/()-]+/).filter(w => w.length >= 4).map(w => w.slice(0, 4));
function sheetItem(t, mode, rnd = Math.random) {
  if (mode === "e" && (RH_NOEX.includes(t.t) || rhRoots(t).some(r => new RegExp(`\\b${r}`, "i").test(t.ex)))) mode = "d";   // the example gives the answer away
  const clash = mode === "d" ? [] : RH_CLASH[t.t] || [];
  const pool = RH_ALT[t.t] ? RH_ALT[t.t].map(x => TERM[slug(x)]) : SHEET.filter(o => o !== t && o.sheet === t.sheet && !RH_NOEX.includes(o.t) && !clash.includes(o.t));
  const same = shuffleR(pool, rnd).slice(0, 3), base = {id: `rh.t.${slug(t.t)}.${mode}`, set: "rhet", kind: "sheet"};
  if (mode === "t") return {...base, q: `What does "${t.t}" mean?`, c: [t.d, ...same.map(o => o.d)], why: `Example: ${t.ex}`};
  if (mode === "e") return {...base, q: `Which term does this example show? ${t.ex}`, c: [t.t, ...same.map(o => o.t)], why: `${t.t}: ${t.d}`};
  return {...base, q: `Which term matches this definition? ${t.d}`, c: [t.t, ...same.map(o => o.t)], why: `Example: ${t.ex}`};
}
const sheetMix = (terms, rnd = Math.random) => terms.map((t, i) => sheetItem(t, "dte"[i % 3], rnd));
// Question banks with ids like rh.dev.anaphora.2, rh.asp1.4
const RHB = {devices: [], appeals: [], evidence: [], faulty: [], claim: [], proc: [], asp1: []};
{
  const n = {}, nid = (p, s) => { const k = s ? `${p}.${slug(s)}` : p; n[k] = (n[k] || 0) + 1; return `${k}.${n[k]}`; };
  const AP = ["Ethos", "Pathos", "Logos"], EV = RHET.order.evidence, FA = ["Bias", "Either/or fallacy", "Bandwagon", "Ad hominem", "Slippery slope", "Hasty generalization"];
  for (const [t, ex, wrong, why] of RHET.devices) RHB.devices.push({id: nid("rh.dev", t), set: "rhet", kind: "device", q: `Which device is at work here? ${ex}`, c: [t, ...wrong], why});
  for (const [t, ex, why] of RHET.appeals) RHB.appeals.push({id: nid("rh.app", t), set: "rhet", kind: "rh-appeal", q: `Which appeal is strongest here? ${ex}`, c: [t, ...AP.filter(x => x !== t)], why});
  for (const [t, ex, why] of RHET.evidence) RHB.evidence.push({id: nid("rh.ev", t), set: "rhet", kind: "rh-evidence", q: `What type of evidence is this? ${ex}`, c: [t, ...EV.filter(x => x !== t)], why});
  for (const [t, ex, why] of RHET.faulty) RHB.faulty.push({id: nid("rh.fal", t), set: "rhet", kind: "rh-faulty", q: `Which kind of faulty reasoning is this? ${ex}`, c: [t, ...shuffle(FA.filter(x => x !== t && !(RH_CLASH[t] || []).includes(x))).slice(0, 3)], why});
  const KIND = {claim: "rh-claim", proc: "rh-process", asp1: "rh-asp"};
  for (const [b, q, c, why] of RHET.questions) RHB[b].push({id: nid("rh." + b), set: "rhet", kind: KIND[b], q, c, why});
}
const RHQ = {}; for (const list of Object.values(RHB)) for (const x of list) RHQ[x.id] = x;
Object.assign(KIND_NAMES, {sheet: "Study sheet", device: "Devices", "rh-appeal": "Appeals", "rh-evidence": "Evidence types", "rh-faulty": "Faulty reasoning", "rh-claim": "Claims and rebuttals", "rh-process": "Analysis process", "rh-asp": "A Small Place, opening pages"});
const RH_KIND_QUIZ = {sheet: "sheet", device: "devices", "rh-appeal": "appeals", "rh-evidence": "appeals", "rh-faulty": "reasoning", "rh-claim": "claims", "rh-process": "claims", "rh-asp": "asp1"};
for (const c of RHET.cards) if (!ARG.debate.motions.includes(c.motion)) ARG.debate.motions.push(c.motion);
const passageOf = id => {
  const P = RHET.passages.find(x => x.id === id); if (P) return P;
  const x = ARG.sources.find(y => y.id === id && y.year);
  return x ? {id: x.id, title: x.title, author: x.author, cite: x.author.split(" ").pop(), year: x.year, occasion: x.note, text: [x.text]} : null;
};

// ---------- Quizzes and tests (startQuiz("rhet", arg))
const RH_QUIZZES = [["sheet", "Study sheet quiz", "20 of the study-sheet terms, by definition and by example."], ["key", "Key terms", "Rhetoric, the appeals, claim, counterargument, rebuttal."], ["evidence", "Types of evidence", "Anecdote, data, facts, expert opinion."],
  ["style", "Language and style devices", "All 16 devices: parallelism to apostrophe."], ["faulty", "Faulty reasoning terms", "Bias and the fallacies on your sheet."], ["devices", "Device spotter", "15 sentences: name the device."],
  ["appeals", "Appeals and evidence", "Ethos, pathos or logos? Which type of evidence?"], ["reasoning", "Faulty reasoning finder", "12 arguments: name the flaw."], ["claims", "Claims, rebuttals and the process", "Claim or fact, counterarguments, SOAPSTone, the paragraph plan."],
  ["asp1", "A Small Place: the opening pages", "The moments in pages 1-9 and what Kincaid does with them."]];
const RH_SAMPLE = {s1: "ra-jfk", s2: "ra-henry"};
function rhTest(which) {
  // "test": a new mix every time. "s1" and "s2": fixed sample tests drawn from opposite halves of every bank.
  const fixed = which !== "test", rnd = fixed ? seeded(which === "s1" ? 101 : 202) : Math.random;
  const half = a => { if (!fixed) return a; const s = shuffleR(a, seeded(4242)), m = Math.ceil(s.length / 2); return which === "s1" ? s.slice(0, m) : s.slice(m); };
  const N = fixed ? {devices: 9, appeals: 2, evidence: 2, faulty: 4, claim: 1, proc: 1, asp1: 3} : {devices: 12, appeals: 3, evidence: 2, faulty: 6, claim: 2, proc: 2, asp1: 3};
  let items = sheetMix(shuffleR(half(SHEET), rnd).slice(0, fixed ? 8 : 10), rnd);
  for (const k of Object.keys(N)) items = items.concat(shuffleR(half(RHB[k]), rnd).slice(0, N[k]));
  return shuffleR(items, rnd);
}
function rhQuiz(arg) {
  if (RHET.order[arg]) return {items: sheetMix(shuffle(SHEET.filter(t => t.sheet === arg))), title: `Study sheet: ${RHET.groups[arg]}`};
  if (arg === "sheet") return {items: sheetMix(shuffle(SHEET).slice(0, 20)), title: "Study sheet quiz"};
  if (arg === "devices") return {items: shuffle(RHB.devices).slice(0, 15), title: "Device spotter"};
  if (arg === "appeals") return {items: shuffle(shuffle(RHB.appeals).slice(0, 8).concat(shuffle(RHB.evidence).slice(0, 7))), title: "Appeals and evidence"};
  if (arg === "reasoning") return {items: shuffle(RHB.faulty), title: "Faulty reasoning finder"};
  if (arg === "claims") return {items: shuffle(RHB.claim.concat(RHB.proc)).slice(0, 15), title: "Claims, rebuttals and the process"};
  if (arg === "asp1") return {items: shuffle(RHB.asp1), title: "A Small Place: the opening pages"};
  if (arg === "test") return {items: rhTest("test"), title: "Unit 4 practice test", mode: "test", minutes: 45};
  if (RH_SAMPLE[arg]) return {items: rhTest(arg), title: `Sample test ${arg === "s1" ? "A" : "B"}, part 1`, mode: "test", minutes: 35, next: {href: `#/tw/${RH_SAMPLE[arg]}`, label: "Part 2: the timed paragraph"}};
  return null;
}
function rhItemById(id) {
  if (RHQ[id]) return RHQ[id];
  const m = id.match(/^rh\.t\.(.+)\.([dte])$/);
  return m && TERM[m[1]] && TERM[m[1]].sheet ? sheetItem(TERM[m[1]], m[2]) : null;
}

// ---------- Progress
const bestRh = subs => { const q = S.quizzes.filter(x => x.kind === "rhet" && subs.includes(x.sub)); return q.length ? Math.max(...q.map(x => pct(x.right, x.n))) : null; };
const annDone = () => RHET.asp1.filter((a, i) => S.rh.ann[i]).length;
const syntaxDone = () => RHET.syntax.filter(t => (S.rh.sent[t] || {}).ok === true).length;
const bestRap = () => { const g = S.raps.filter(r => r.grade).map(r => r.grade.total); return g.length ? Math.max(...g) : null; };
const movesDone = () => S.rh.moves.filter(m => m.ok).length;
function rhReady() {
  const sh = bestRh(["sheet"]), te = bestRh(["test", "s1", "s2"]), rp = bestRap();
  return [
    {k: "sheet", label: "Know the study sheet", done: sh != null && sh >= 90, detail: sh == null ? "Not tried yet. Aim for 90%." : `Best ${sh}% (aim for 90%)`, arg: "rhet:sheet", go: "Quiz"},
    {k: "annotate", label: "Annotate pages 1-9", done: annDone() >= RHET.asp1.length, detail: `${annDone()} of ${RHET.asp1.length} moments marked in your copy`, href: "#/rhetoric/annotate", go: "Annotations"},
    {k: "build", label: "Build each syntax device", done: syntaxDone() >= RHET.syntax.length, detail: `${syntaxDone()} of ${RHET.syntax.length} built`, href: "#/rhetoric/build", go: "Build"},
    {k: "rap", label: "Plan and score a paragraph", done: rp != null && rp >= 20, detail: rp == null ? "No plan yet. Aim for 20 of 24." : `Best ${rp} of 24, estimated (aim for 20)`, href: "#/rap/new/asp", go: "Plan"},
    {k: "test", label: "Take a practice test", done: te != null && te >= 80, detail: te == null ? "Not taken yet. Aim for 80%." : `Best ${te}% (aim for 80%)`, arg: "rhet:test", go: "Test"},
    {k: "debate", label: "Practice debate moves", done: movesDone() >= 3, detail: `${movesDone()} of 3 counterargument-and-rebuttal moves pass`, href: "#/rhetoric/build/debate", go: "Practice"}];
}
const readyHTML = () => `<ul class="steps">${rhReady().map(r => `<li class="${r.done ? "done" : ""}"><span class="check${r.done ? " on" : ""}" aria-hidden="true">${r.done ? "✓" : ""}</span><span class="rs"><span class="t"><b>${esc(r.label)}</b></span><br><span class="meta">${esc(r.detail)}</span></span>${r.arg ? `<button class="btn sm ghost" data-act="quiz" data-arg="${r.arg}">${esc(r.go)}</button>` : `<a class="btn sm ghost" href="${r.href}">${esc(r.go)}</a>`}</li>`).join("")}</ul>`;
const rhCount = () => rhReady().filter(r => r.done).length;
// The Unit 4 card on the unit page and on Today
const rhUnitCard = () => `<a class="card hi" style="display:block;text-decoration:none;color:inherit" href="#/rhetoric"><span class="pill">Class toolkit</span><h3 style="margin-top:8px">Intro to Rhetoric</h3>
  <p class="meta">Your study sheet, annotations for pages 1-9, the paragraph plan with a score, sentence building, mini debates, quizzes and practice tests. ${rhCount()} of 6 ready steps done.</p></a>`;

// ---------- Views
const rhCrumb = `<p class="crumb"><a href="#/rhetoric">‹ Rhetoric</a></p>`;
const rhLink = (href, title, d, pill) => `<a class="card" style="display:block;text-decoration:none;color:inherit" href="${href}">${pill ? `<span class="pill">${esc(pill)}</span>` : ""}<h3 style="margin-top:${pill ? 8 : 0}px">${esc(title)}</h3><p class="meta">${d}</p></a>`;
const partsHTML = (parts, summary) => `<ul class="tcheck">${parts.map(p => `<li><span class="${p.pass ? "y" : "x"}">${p.pass ? "✓" : "•"}</span><span>${esc(p.label)}${p.pass || !p.tip ? "" : `<span class="h">${esc(p.tip)}</span>`}</span></li>`).join("")}</ul>${summary ? `<p class="meta">${esc(summary)}</p>` : ""}`;
const soapTable = x => `<table class="tbl">${SOAP_FIELDS.map(([k, t]) => `<tr><th>${t}</th><td>${esc(x[k] || "")}</td></tr>`).join("")}</table>`;
const passageHTML = (P, open) => `<details class="card"${open ? " open" : ""}><summary><b>${esc(P.title)}</b> · ${esc(P.author)}, ${P.year}</summary><p class="meta">${esc(P.occasion)}</p>
  <div class="prose">${P.text.map(t => `<p>${esc(t)}</p>`).join("")}</div>${P.note ? `<p class="meta">${esc(P.note)}</p>` : ""}</details>`;
V.rhetoric = (sub, a, b) => {
  const f = {sheet: rhSheet, intro: rhIntro, annotate: rhAnnotate, passages: rhPassages, passage: rhPassage, build: rhBuild, debate: rhDebate, tests: rhTests, scores: rhScores}[sub];
  return f ? f(a, b) : rhHub();
};
function rhHub() {
  const U = UNIT(ASP.unit);
  return `<p class="crumb"><a href="#/unit/${U.u}">‹ Unit ${U.u}</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px">Intro to Rhetoric</h2><p class="meta">Your teacher's study sheet, notes and paragraph plan, turned into practice for what's coming: the in-class rhetorical analysis write on <i>A Small Place</i> (open note, with your own annotated excerpt), sentence building, writing exams and mini debates.</p></div>
  <div class="card"><h3>Get ready</h3>${readyHTML()}</div>
  <h3>Learn</h3><div class="grid">${rhLink("#/rhetoric/sheet", "Study sheet", `All ${SHEET.length} terms from your class sheet and syntax list, with your teacher's definitions and examples.`, "Memorize")}
  ${rhLink("#/rhetoric/intro", "Unit notes", "Why rhetoric matters, how to analyze an argument, the appeals, evidence, bias, counterarguments and rebuttals.", "Read")}
  ${rhLink("#/rhetoric/annotate", "Annotations: pages 1-9", `${RHET.asp1.length} moments in <i>A Small Place</i>: the devices, the appeal, the effect, the purpose and a sentence starter for each. ${annDone()} marked in your copy.`, "Open note")}</div>
  <h3>Practice</h3><div class="grid">${rhLink("#/rap", "Paragraph plan", `The class graphic organizer, box by box, with live checks and an estimated score out of 24. ${S.raps.length} saved.`, "Write")}
  ${rhLink("#/rhetoric/build", "Sentence building", `Write a sentence with each device and the app checks it. ${syntaxDone()} of ${RHET.syntax.length} syntax devices built.`, "Build")}
  ${rhLink("#/rhetoric/build/analysis", "Analysis sentences", "Device, precise verb, effect on the reader, purpose: one sentence, checked.", "Build")}
  ${rhLink("#/rhetoric/debate", "Mini debates", `${RHET.cards.length} motions with points for both sides, and counterargument-and-rebuttal practice.`, "Debate")}
  ${rhLink("#/rhetoric/passages", "Practice passages", `${RHET.passages.length} famous speeches and essays to annotate and analyze, each with a timed paragraph.`, "Analyze")}</div>
  <h3>Test yourself</h3><div class="grid">${rhLink("#/rhetoric/tests", "Quizzes and tests", "Study-sheet quizzes, a device spotter, a 40-question practice test, and two sample tests with a timed paragraph.", "Test")}
  ${rhLink("#/rhetoric/scores", "Your scores", "Every rhetoric quiz, test, paragraph and sentence in one place.", "Track")}</div>`;
}
function rhSheet() {
  return `${rhCrumb}<h2>Study sheet</h2><p class="lead">Your class study sheet in its order, plus the two syntax terms from your list that the sheet doesn't define. Definitions and class examples are your teacher's; the second examples are extra practice.</p>
  ${Object.entries(RHET.order).map(([g, list]) => { const terms = list.map(t => TERM[slug(t)]).filter(Boolean); return `<div class="card"><div class="row" style="margin:0"><h3 style="margin:0">${esc(RHET.groups[g])}</h3><span class="sp"></span><button class="btn sm ghost" data-act="quiz" data-arg="rhet:${g}">Quiz these ${terms.length}</button></div>
    <ul class="list">${terms.map(t => `<li style="display:block"><b>${esc(t.t)}</b>${RHET.syntax.includes(t.t) ? ` <span class="chip ac">Syntax list</span>` : ""}${t.extra ? ` <span class="chip">Not on the sheet</span>` : ""}<br>${esc(t.d)}<br><span class="quiet">${t.extra ? "Example" : "Class example"}: ${esc(t.ex)}</span>${t.ex2 ? `<br><span class="quiet">Another: ${esc(t.ex2)}</span>` : ""}${g === "style" ? `<br><a href="#/rhetoric/build/devices/${slug(t.t)}">Build one</a>` : ""}</li>`).join("")}</ul></div>`; }).join("")}
  <div class="row"><button class="btn" data-act="quiz" data-arg="rhet:sheet">Study sheet quiz</button><a class="btn ghost" href="#/review">Review cards</a></div>`;
}
function rhIntro() {
  const I = RHET.intro, ul = a => `<ul class="tight">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`, ol = a => `<ol class="tight">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;
  return `${rhCrumb}<h2>Unit notes</h2><p class="lead">The ideas from your class slides and notes on rhetoric, in one place.</p>
  <div class="cols"><div class="card"><h3>Why rhetoric matters</h3>${ul(I.why)}</div><div class="card"><h3>How to analyze an argument</h3>${ol(I.analyze)}</div></div>
  <div class="card"><h3>The three appeals</h3><table class="tbl">${I.appeals.map(([a, d, q]) => `<tr><th>${esc(a)}</th><td>${esc(d)}</td><td><i>Ask: ${esc(q)}</i></td></tr>`).join("")}</table></div>
  <div class="card"><h3>Types of evidence</h3><table class="tbl">${I.evidence.map(([a, d]) => `<tr><th>${esc(a)}</th><td>${esc(d)}</td></tr>`).join("")}</table></div>
  <div class="cols"><div class="card"><h3>Good arguments include</h3>${ul(I.good)}</div><div class="card"><h3>Critical thinking</h3>${ol(I.critical)}</div></div>
  <div class="cols"><div class="card"><h3>Claim or fact?</h3><table class="tbl">${I.claimVsFact.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</table><p class="meta">A claim must be arguable. A counterargument is the other side's best point; a rebuttal is your answer to it.</p></div>
  <div class="card"><h3>Where bias comes from</h3><div class="tags">${I.bias.map(b => `<span class="chip">${esc(b)}</span>`).join("")}</div><p class="meta">Ask what the source gains and what it leaves out.</p></div></div>
  <div class="card"><h3>Questions to ask about any argument</h3>${ol(I.questions)}</div>
  <div class="card"><h3>Connections to other texts</h3><table class="tbl">${I.connections.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</table></div>
  <div class="row"><a class="btn" href="#/rhetoric/sheet">Study sheet</a><button class="btn ghost" data-act="quiz" data-arg="rhet:claims">Quiz: claims and the process</button></div>`;
}
const annColor = k => (RHET.organizer.colors.find(c => c[0] === k) || RHET.organizer.colors[0])[2];
const annCard = (a, i) => `<div class="card ann" id="ann-${i + 1}" style="--c:${annColor(a.c)}"><div class="row" style="margin:0"><span class="pill">${i + 1}</span><h3 style="margin:0">${esc(a.title)}</h3>${a.later ? `<span class="chip tip">May be just after page 9</span>` : ""}<span class="sp"></span>
  <label class="tog"><input type="checkbox" data-in="annmark" data-i="${i}"${S.rh.ann[i] ? " checked" : ""}> In my copy</label><label class="tog">Page <input type="number" min="1" max="999" inputmode="numeric" style="width:4.6em" data-in="annpg" data-i="${i}" value="${esc(S.rh.pg[i] || "")}"></label></div>
  <p><b>Find it:</b> ${esc(a.find)}</p><p>${esc(a.what)}</p>
  <div class="tags">${a.devices.map(d => `<span class="chip ac">${esc(d)}</span>`).join("")}<span class="chip"><span class="swatch" style="--c:${annColor(a.appeal.toLowerCase())}"></span>${esc(a.appeal)}</span></div>
  <p><b>Effect:</b> ${esc(a.effect)}</p><p><b>Purpose:</b> ${esc(a.purpose)}</p>
  <p class="model">${esc(a.starter)}</p><p class="meta"><b>In a debate:</b> ${esc(a.debate)}</p><p class="meta">Study-sheet terms: ${a.terms.map(esc).join(", ")}</p></div>`;
IN.annmark = el => { const i = el.dataset.i; if (el.checked) S.rh.ann[i] = today(); else delete S.rh.ann[i]; active(); checkBadges(); save(); };
IN.annpg = el => { S.rh.pg[el.dataset.i] = String(el.value).replace(/\D/g, "").slice(0, 3); saveSoon(); };
function rhAnnotate(n) {
  if (n) AFTER = () => { const el = $("#ann-" + n); if (el) el.scrollIntoView({block: "start"}); };
  const idx = {}; RHET.asp1.forEach((a, i) => a.terms.forEach(t => (idx[t] = idx[t] || []).push(i)));
  const K = RHET.organizer.colors;
  return `${rhCrumb}<h2>Annotations: <i>A Small Place</i>, pages 1-9</h2>
  <p class="lead">For the open-note write and the debates. Each card says where to look in your copy, what Kincaid does, the devices and appeal, the effect, the purpose and a sentence starter. The book isn't quoted here: underline the words in your own copy, then tick the card and add the page.</p>
  <div class="cols"><div class="card"><h3>Class SOAPSTone</h3>${soapTable(RHET.soapAsp)}</div>
  <div class="card"><h3>Color key</h3><div class="tags">${K.map(([k, nm, c]) => `<span class="chip"><span class="swatch" style="--c:${c}"></span>${esc(nm)}</span>`).join("")}</div><p class="meta">Use the same colors in your copy so every mark says what it's for, and write a short comment next to each one.</p>
  <h4>Annotation steps</h4><ol class="tight">${RHET.organizer.annotate.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div></div>
  ${RHET.asp1.map(annCard).join("")}
  <div class="card"><h3>Find a term fast</h3><p class="meta">Where each study-sheet term shows up in these pages.</p><table class="tbl">${Object.values(RHET.order).flat().filter(t => idx[t]).map(t => `<tr><th>${esc(t)}</th><td>${idx[t].map(i => `<a href="#/rhetoric/annotate/${i + 1}">${esc(RHET.asp1[i].title)}</a>`).join(", ")}</td></tr>`).join("")}
  ${RHET.aspGaps.map(([t, x]) => `<tr><th>${esc(t)}</th><td class="quiet">${esc(x)}</td></tr>`).join("")}</table></div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="rhet:asp1">Quiz: the opening pages</button><a class="btn ghost" href="#/rap/new/asp">Plan a paragraph</a><a class="btn ghost" href="#/tw/ra-asp">Timed paragraph</a></div>`;
}
function rhPassages() {
  const list = RHET.passages.concat(["douglass"].map(passageOf).filter(Boolean));
  return `${rhCrumb}<h2>Practice passages</h2><p class="lead">Public-domain speeches and essays for practicing the same analysis you'll do on <i>A Small Place</i>: SOAPS, devices, a paragraph plan and a timed paragraph.</p>
  <div class="grid">${list.map(P => `<div class="card"><span class="pill">${P.year}</span><h3 style="margin-top:8px">${esc(P.title)}</h3><p class="meta">${esc(P.author)} · ${esc(P.occasion)}</p>
  <div class="row"><a class="btn sm" href="#/rhetoric/passage/${P.id}">Read and analyze</a><a class="btn sm ghost" href="#/rap/new/${P.id}">Plan</a></div></div>`).join("")}</div>`;
}
function rhPassage(id) {
  const P = passageOf(id); if (!P) return rhPassages();
  const tw = PROMPTS.find(p => p.passage === id);
  return `<p class="crumb"><a href="#/rhetoric/passages">‹ Passages</a></p><h2>${esc(P.title)}</h2><p class="meta">${esc(P.author)}, ${P.year} · ${esc(P.occasion)}</p>
  <div class="card"><div class="prose">${P.text.map(t => `<p>${esc(t)}</p>`).join("")}</div>${P.note ? `<p class="meta">${esc(P.note)}</p>` : ""}</div>
  <div class="card"><h3>Annotate it</h3><ol class="tight"><li>Mark the speaker, occasion, audience, purpose, subject and tone.</li><li>Find two or three devices and write each one's effect in the margin.</li><li>Decide which appeal is strongest, and why.</li></ol>
  ${P.devices ? `<details><summary>Devices to look for</summary><div class="tags">${P.devices.map(d => `<span class="chip ac">${esc(d)}</span>`).join("")}</div></details>` : ""}
  <div class="row"><a class="btn" href="#/rap/new/${P.id}">Paragraph plan</a>${tw ? `<a class="btn ghost" href="#/tw/${tw.id}">Timed paragraph</a>` : ""}<a class="btn ghost" href="#/soap/new/${P.id}">SOAPSTone it</a></div></div>
  ${id === RHET.model.passage ? `<div class="row"><a class="btn ghost" href="#/rap/model">See the model plan for this speech</a></div>` : ""}`;
}

// ---------- Sentence building: devices, analysis sentences, debate moves
function rhBuild(tab, focus) {
  tab = ["devices", "analysis", "debate"].includes(tab) ? tab : "devices";
  const TABS = [["devices", "Devices"], ["analysis", "Analysis sentences"], ["debate", "Debate moves"]];
  return `${rhCrumb}<h2>Sentence building</h2><p class="lead">The in-class practice: build sentences with each device, write analysis sentences, and practice counterargument and rebuttal. Write in your own words; the app checks the pattern, not your ideas.</p>
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/rhetoric/build/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${{devices: buildDevices, analysis: buildAnalysis, debate: buildDebate}[tab](focus)}`;
}
const bstatus = r => !r || !r.n ? "" : r.ok === true ? `<span class="chip ok">✓ Built</span>` : r.ok === false ? `<span class="chip fix">Not yet</span>` : `<span class="chip tip">Check it yourself</span>`;
function bresHTML(k) {
  const r = S.rh.sent[k] || {}, b = RHET.build.find(x => x.t === k);
  if (!r.n || !b) return "";
  const head = r.ok === true ? `<div class="fb"><b>Yes.</b> ${esc(r.msg)}</div>` : r.ok === false ? `<div class="fb bad"><b>Not yet.</b> ${esc(r.msg)}</div>`
    : `<div class="fb"><b>Check it yourself.</b> ${esc(r.msg)}<div class="row"><button class="btn sm" data-act="bself" data-arg="${esc(k)}|1">Yes, it does</button><button class="btn sm ghost" data-act="bself" data-arg="${esc(k)}|0">Not yet</button></div></div>`;
  return `${head}<details><summary>Model and tip</summary><p class="model">${esc(b.model)}</p><p class="meta">${esc(b.tip)}</p></details>`;
}
function bupdate(k) { const a = $("#bres-" + slug(k)), b = $("#bst-" + slug(k)); if (a) a.innerHTML = bresHTML(k); if (b) b.innerHTML = bstatus(S.rh.sent[k]); }
IN.bsent = el => { const r = S.rh.sent[el.dataset.k] || (S.rh.sent[el.dataset.k] = {}); r.t = el.value; saveSoon(); };
ACT.bcheck = k => {
  const r = S.rh.sent[k] || (S.rh.sent[k] = {});
  if (wcount(r.t) < 4) { toast("Write your sentence first"); return; }
  const res = RhetCheck.device(k, r.t), was = r.ok === true;
  Object.assign(r, {ok: res.ok, msg: res.msg, n: (r.n || 0) + 1, d: today()}); delete r.self;
  if (res.ok && !was) addXP(5);
  goalTick("drill"); active(); checkBadges(); save(); bupdate(k);
};
ACT.bself = arg => { const [k, v] = arg.split("|"), r = S.rh.sent[k]; if (!r) return; r.ok = v === "1"; r.self = 1; if (r.ok) addXP(5); checkBadges(); save(); bupdate(k); };
function buildDevices(focus) {
  if (focus) AFTER = () => { const el = $("#b-" + focus); if (el) el.scrollIntoView({block: "start"}); };
  const list = RHET.build.slice().sort((a, b) => (RHET.syntax.includes(b.t) ? 1 : 0) - (RHET.syntax.includes(a.t) ? 1 : 0));
  return `<p class="meta">${syntaxDone()} of ${RHET.syntax.length} devices on your syntax list built. When the app can't tell from the pattern, it asks you to check against the definition.</p>
  ${list.map(b => { const T = TERM[slug(b.t)], r = S.rh.sent[b.t] || {}, s = slug(b.t); return `<div class="card" id="b-${s}"><div class="row" style="margin:0"><h3 style="margin:0">${esc(b.t)}</h3>${RHET.syntax.includes(b.t) ? `<span class="chip ac">Syntax list</span>` : ""}<span class="sp"></span><span id="bst-${s}">${bstatus(r)}</span></div>
  <p class="meta">${esc(T ? T.d : "")}</p><p><b>${esc(b.task)}</b></p>
  <textarea rows="2" data-in="bsent" data-k="${esc(b.t)}" placeholder="Your sentence">${esc(r.t || "")}</textarea>
  <div class="row"><button class="btn sm" data-act="bcheck" data-arg="${esc(b.t)}">Check it</button></div><div id="bres-${s}">${bresHTML(b.t)}</div></div>`; }).join("")}`;
}
IN.anaf = el => { const d = S.drafts.ana || (S.drafts.ana = {m: 0, t: ""}); d[el.dataset.k] = el.value; if (el.dataset.k === "m") { save(); render(); } else saveSoon(); };
ACT.anacheck = () => {
  const d = S.drafts.ana || {};
  if (wcount(d.t) < 8) { toast("Write a full sentence first"); return; }
  const r = RhetCheck.analysis(d.t);
  S.rh.ana.push({d: today(), m: Number(d.m) || 0, t: d.t, ok: r.ok}); if (S.rh.ana.length > 60) S.rh.ana.splice(0, S.rh.ana.length - 60);
  if (r.ok) addXP(5);
  goalTick("drill"); active(); save();
  const el = $("#anares"); if (el) el.innerHTML = partsHTML(r.parts, r.ok ? "All four pieces are there. Now check it's true to the text." : `${r.parts.filter(p => p.pass).length} of ${r.parts.length} pieces are there.`);
};
function buildAnalysis() {
  const d = S.drafts.ana || (S.drafts.ana = {m: 0, t: ""}), a = RHET.asp1[Number(d.m)] || RHET.asp1[0], last = S.rh.ana.slice(-5).reverse();
  return `<div class="card"><h3>Write an analysis sentence</h3><p class="meta">Pick a moment, then write one sentence that names the device, uses a precise verb, says what it does to the reader and links to Kincaid's purpose.</p>
  <label class="f">Moment<select data-in="anaf" data-k="m">${RHET.asp1.map((x, i) => `<option value="${i}"${i === Number(d.m) ? " selected" : ""}>${i + 1}. ${esc(x.title)}</option>`).join("")}</select></label>
  <p class="meta"><b>Find it:</b> ${esc(a.find)}</p><div class="tags">${a.devices.map(x => `<span class="chip ac">${esc(x)}</span>`).join("")}</div>
  <h4>Frames</h4>${RHET.frames.map(f => `<p class="model">${esc(f)}</p>`).join("")}
  <textarea rows="3" data-in="anaf" data-k="t" placeholder="Your analysis sentence">${esc(d.t)}</textarea>
  <div class="row"><button class="btn" data-act="anacheck">Check it</button></div><div id="anares"></div></div>
  <div class="card"><h3>Precise verbs</h3><div class="tags">${RHET.verbs.map(v => `<span class="chip">${esc(v)}</span>`).join("")}</div><h4>Tone words</h4><div class="tags">${RHET.tones.map(v => `<span class="chip">${esc(v)}</span>`).join("")}</div></div>
  ${last.length ? `<div class="card"><h3>Your recent sentences</h3><ul class="list">${last.map(x => `<li style="display:block">${x.ok ? "✓" : "•"} ${esc(x.t)}<br><span class="meta">${nice(x.d)} · ${esc((RHET.asp1[x.m] || {}).title || "")}</span></li>`).join("")}</ul></div>` : ""}`;
}
IN.movef = el => { const d = S.drafts.move || (S.drafts.move = {c: 0, counter: "", reb: ""}); d[el.dataset.k] = el.value; if (el.dataset.k === "c") { save(); render(); } else saveSoon(); };
ACT.movecheck = () => {
  const d = S.drafts.move || {};
  if (wcount(d.counter) < 5 || wcount(d.reb) < 5) { toast("Write both the counterargument and your rebuttal"); return; }
  const r = RhetCheck.debateMove(d.counter, d.reb), claims = RHET.debateClaims;
  S.rh.moves.push({d: today(), claim: claims[Number(d.c)] || claims[0], counter: d.counter, reb: d.reb, ok: r.ok}); if (S.rh.moves.length > 60) S.rh.moves.splice(0, S.rh.moves.length - 60);
  if (r.ok) addXP(5);
  goalTick("seminar"); active(); checkBadges(); save();
  const el = $("#moveres"); if (el) el.innerHTML = partsHTML(r.parts, r.ok ? "A complete move: fair to the other side, then answered with a reason." : "Fix the missing pieces, then check again.");
};
function buildDebate() {
  const claims = RHET.debateClaims, d = S.drafts.move || (S.drafts.move = {c: 0, counter: "", reb: ""}), last = S.rh.moves.slice(-4).reverse();
  return `<div class="card"><h3>Counterargument and rebuttal</h3><p class="meta">The move that wins mini debates: state the other side's best point fairly, then answer it with a reason or evidence. No faulty reasoning.</p>
  <label class="f">Your claim<select data-in="movef" data-k="c">${claims.map((x, i) => `<option value="${i}"${i === Number(d.c) ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
  <label class="f">Counterargument <span class="h">The other side's best point. Start: Some argue that... / Critics claim that...</span><textarea rows="2" data-in="movef" data-k="counter">${esc(d.counter)}</textarea></label>
  <label class="f">Rebuttal <span class="h">Turn and answer. Start: However... because... / While that is true...</span><textarea rows="3" data-in="movef" data-k="reb">${esc(d.reb)}</textarea></label>
  <div class="row"><button class="btn" data-act="movecheck">Check my move</button><a class="btn ghost" href="#/rhetoric/debate">Debate cards</a></div><div id="moveres"></div></div>
  ${last.length ? `<div class="card"><h3>Your recent moves</h3><ul class="list">${last.map(x => `<li style="display:block">${x.ok ? "✓" : "•"} <b>${esc(x.claim)}</b><br><span class="quiet">${esc(x.counter)}</span><br>${esc(x.reb)}</li>`).join("")}</ul></div>` : ""}`;
}
function rhDebate() {
  return `${rhCrumb}<h2>Mini debates</h2><p class="lead">Motions on <i>A Small Place</i> with points for each side and where to find the evidence. Prepare both sides: you may not get to choose.</p>
  ${RHET.cards.map(c => `<div class="card"><h3>${esc(c.motion)}</h3><div class="cols"><div><h4>For</h4><ul class="tight">${c.pro.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h4>Against</h4><ul class="tight">${c.con.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
  <p class="meta"><b>Avoid:</b> ${c.avoid.map(esc).join("; ")}</p><div class="row"><a class="btn sm" href="#/debate/new/${ARG.debate.motions.indexOf(c.motion)}">Prep this debate</a></div></div>`).join("")}
  <div class="row"><a class="btn" href="#/rhetoric/build/debate">Practice counterargument and rebuttal</a><button class="btn ghost" data-act="quiz" data-arg="rhet:reasoning">Faulty reasoning finder</button></div>`;
}

// ---------- Tests and scores
function rhTests() {
  const best = subs => { const b = bestRh(subs); return b == null ? "" : ` · Best ${b}%`; };
  const q = ([arg, t, d]) => `<div class="card"><h3>${esc(t)}</h3><p class="meta">${esc(d)}${best([arg])}</p><div class="row"><button class="btn sm" data-act="quiz" data-arg="rhet:${arg}">Start</button></div></div>`;
  const paras = PROMPTS.filter(p => p.para);
  return `${rhCrumb}<h2>Quizzes and tests</h2><p class="lead">Practice quizzes give feedback after every answer. Tests are timed and scored at the end, like the real thing. Every miss goes to My misses until you get it right.</p>
  <h3>Tests</h3><div class="grid">
  <div class="card hi"><h3>Unit 4 practice test</h3><p class="meta">40 questions in 45 minutes: study-sheet terms, devices, appeals and evidence, faulty reasoning, claims and the process, and <i>A Small Place</i>. A new mix every time.${best(["test"])}</p><div class="row"><button class="btn sm" data-act="quiz" data-arg="rhet:test">Start</button></div></div>
  ${["s1", "s2"].map(s => `<div class="card"><h3>Sample test ${s === "s1" ? "A" : "B"}</h3><p class="meta">Part 1: 30 questions in 35 minutes. Part 2: one timed rhetorical analysis paragraph on ${(P => `${esc(P.author)}'s ${esc(P.title)}`)(passageOf(PROMPTS.find(p => p.id === RH_SAMPLE[s]).passage))}, scored on the paragraph plan. The same questions every time, so you can measure progress.${best([s])}</p>
  <div class="row"><button class="btn sm" data-act="quiz" data-arg="rhet:${s}">Start part 1</button><a class="btn sm ghost" href="#/tw/${RH_SAMPLE[s]}">Part 2</a></div></div>`).join("")}</div>
  <h3>Quizzes</h3><div class="grid">${RH_QUIZZES.map(q).join("")}</div>
  <div class="card"><h3>Timed paragraphs</h3><p class="meta">Like the in-class write: one well-developed paragraph, then an estimated score out of 24 on the paragraph plan.</p><ul class="list">${paras.map(p => `<li><a class="go" href="#/tw/${p.id}"><span class="t">${esc(p.text)}<br><span class="s">${p.min} minutes${p.passage ? " · " + esc(passageOf(p.passage).author) : " · open note"}</span></span></a></li>`).join("")}</ul></div>
  <div class="card"><h3>How the grading works</h3><ul class="tight"><li>Multiple choice is scored exactly.</li><li>Paragraphs get an estimated score on six rows of the paragraph plan, 4 points each: claim, evidence, reasoning and elaboration, rhetorical vocabulary, organization, conventions. It looks for what the plan asks for; it can't judge how insightful your ideas are.</li><li>For a second opinion, send the paragraph to Claude from Check: it scores it against the rubric without rewriting it.</li></ul></div>`;
}
const twCtx = w => { const p = PROMPTS.find(x => x.id === w.pid), P = p && p.passage ? passageOf(p.passage) : null; return P ? {author: P.cite} : p && BOOKS[p.book] ? {author: BOOKS[p.book].cite, title: BOOKS[p.book].title, names: BOOKS[p.book].names} : {}; };
function bestParaGrade(text, ctx) {
  const P = Checker.paragraphs(text).filter(p => wcount(p.text) >= 40);
  const g = P.map(p => RhetCheck.grade(p.text, ctx));
  return g.length ? g.sort((a, b) => b.total - a.total)[0] : null;
}
function rhScores() {
  const qs = S.quizzes.filter(q => q.kind === "rhet").slice().reverse(), tws = S.writes.map((w, i) => ({w, i})).filter(({w}) => w.type === "rhetorical").reverse();
  return `${rhCrumb}<h2>Your scores</h2><p class="lead">Every rhetoric quiz, test, paragraph and sentence. Paragraph scores are estimates on the paragraph plan.</p>
  <div class="card"><h3>Get ready</h3>${readyHTML()}</div>
  <div class="card"><h3>Quizzes and tests</h3>${qs.length ? `<table class="tbl"><tr><th>Date</th><th>Quiz</th><th>Score</th></tr>${qs.slice(0, 30).map(q => `<tr><td>${nice(q.d)}</td><td>${esc(q.title)}</td><td>${q.right}/${q.n} · ${pct(q.right, q.n)}%</td></tr>`).join("")}</table>` : `<p class="meta">None yet. Start with the <a href="#/rhetoric/tests">study sheet quiz</a>.</p>`}</div>
  <div class="card"><h3>Paragraph plans</h3>${S.raps.length ? `<table class="tbl"><tr><th>Date</th><th>Text</th><th>Estimate</th></tr>${S.raps.map((r, i) => ({r, i})).reverse().map(({r, i}) => `<tr><td>${nice(r.d)}</td><td><a href="#/rap/${i}">${esc(r.title || "Untitled")}</a></td><td>${r.grade ? `${r.grade.total}/24 · ${esc(r.grade.band)}` : "not scored"}</td></tr>`).join("")}</table>` : `<p class="meta">None yet. <a href="#/rap/new/asp">Plan one</a>.</p>`}</div>
  <div class="card"><h3>Timed rhetorical analysis writes</h3>${tws.length ? `<table class="tbl"><tr><th>Date</th><th>Prompt</th><th>Estimate</th></tr>${tws.map(({w, i}) => { const g = bestParaGrade(w.text || "", twCtx(w)); return `<tr><td>${nice(w.d)}</td><td><a href="#/check/tw/${i}">${esc(w.prompt.slice(0, 70))}${w.prompt.length > 70 ? "…" : ""}</a><br><span class="meta">${w.words} words in ${w.min} minutes</span></td><td>${g ? `${g.total}/24` : "too short"}</td></tr>`; }).join("")}</table>` : `<p class="meta">None yet. Try a <a href="#/rhetoric/tests">timed paragraph</a>.</p>`}</div>
  <div class="card"><h3>Sentence building</h3><div class="tags">${RHET.build.map(b => { const r = S.rh.sent[b.t] || {}; return `<a class="chip${r.ok === true ? " ok" : r.n ? " tip" : ""}" style="text-decoration:none" href="#/rhetoric/build/devices/${slug(b.t)}">${r.ok === true ? "✓ " : ""}${esc(b.t)}</a>`; }).join("")}</div>
  <p class="meta">${S.rh.ana.filter(x => x.ok).length} analysis sentences and ${movesDone()} debate moves pass.</p></div>`;
}

// ---------- The paragraph plan (the class graphic organizer), saved plans and the model
const RAP_DEV = ["Ethos", "Pathos", "Logos", ...RHET.order.style, "Second-person address", "Sarcasm", "Irony", "Imagery", "Tone"];
const RAP_SOURCES = () => [["asp", "A Small Place, pages 1-9"], ...RHET.passages.map(P => [P.id, `${P.author}: ${P.title}`]), ["douglass", "Frederick Douglass: Fourth of July speech"], ["other", "Another text"]];
const rapCtx = src => src === "asp" ? {author: ASP.cite, title: ASP.title, names: ASP.names} : passageOf(src) ? {author: passageOf(src).cite} : {};
const rapBlank = src => ({src, title: src === "other" ? "" : (RAP_SOURCES().find(x => x[0] === src) || ["", ""])[1], soap: {}, dev: [], thesis: "", claim: "", ev1: "", re1: "", ev2: "", re2: "", concl: "", para: ""});
let RAPSRC = "asp";
const rapDraft = () => S.drafts["rap:" + RAPSRC] || (S.drafts["rap:" + RAPSRC] = rapBlank(RAPSRC));
function rapCheck(k, d) {
  const t = (d[k] || "").trim(), ctx = rapCtx(d.src); if (!t) return "";
  if (k === "thesis" || k === "claim") { const r = RhetCheck.thesis(t, ctx); return partsHTML(r.parts, r.ok ? "Purpose and method are both there." : ""); }
  if (k === "ev1" || k === "ev2") return partsHTML(RhetCheck.evidence(t).parts);
  if (k === "re1" || k === "re2") return partsHTML(RhetCheck.reasoning(t).parts);
  return "";
}
function gradeHTML(g, title = "Estimated score: paragraph plan") {
  if (!g || g.short) return `<div class="card note">Write at least 40 words to get a score.</div>`;
  return `<div class="card${g.pct >= 90 ? " okc" : ""}"><h3>${esc(title)}</h3><p class="big">${g.total} / 24 · ${g.pct}% · ${esc(g.band)}</p>
  <table class="tbl">${g.rows.map(r => `<tr><th>${esc(r.name)}</th><td class="score">${"●".repeat(r.score)}${"○".repeat(4 - r.score)}</td><td>${esc(r.notes.join(" "))}</td></tr>`).join("")}</table>
  <p class="meta">An estimate from automatic checks of what the paragraph plan asks for. It can't judge how insightful your ideas are: use it to find what's missing. Your teacher's rubric decides the grade.</p></div>`;
}
// The paragraph-plan score on Check for rhetorical analysis drafts, timed writes and assignments
function raGradeCard(src) {
  if (src.type !== "rhetorical") return "";
  const text = src.get(), ctx = src.a ? ctxFor(src.a) : src.w ? twCtx(src.w) : {};
  const P = Checker.paragraphs(text).filter(p => wcount(p.text) >= 40);
  if (!P.length) return "";
  if (P.length === 1) return gradeHTML(RhetCheck.grade(P[0].text, ctx));
  const body = P.length >= 3 ? P.slice(1, -1) : P;
  return `<div class="card"><h3>Body paragraphs on the paragraph plan</h3><table class="tbl">${body.map(p => { const g = RhetCheck.grade(p.text, ctx), low = g.rows.slice().sort((a, b) => a.score - b.score)[0]; return `<tr><th>Paragraph ${P.indexOf(p) + 1}</th><td>${g.total}/24 · ${esc(g.band)}</td><td>${low.score < 4 ? `Weakest: ${esc(low.name.toLowerCase())}. ${esc(low.notes[0] || "")}` : "Every row at 4."}</td></tr>`; }).join("")}</table>
  <p class="meta">Estimated scores (each out of 24) for your body paragraphs. Paste one paragraph on its own for row-by-row notes.</p></div>`;
}
V.rap = (a, b) => {
  if (a === "new") return rapForm(b || "asp");
  if (a === "model") return rapModel();
  if (a != null && S.raps[Number(a)]) return rapView(Number(a));
  return `<p class="crumb"><a href="#/rhetoric">‹ Rhetoric</a></p><h2>Paragraph plans</h2><p class="lead">${esc(RHET.organizer.task)}</p>
  <div class="row"><a class="btn" href="#/rap/new/asp">+ New plan: A Small Place</a><a class="btn ghost" href="#/rap/new/jfk">+ On a practice speech</a><a class="btn ghost" href="#/rap/new/other">+ On another text</a><a class="btn ghost" href="#/rap/model">See the model</a></div>
  ${S.raps.length ? `<div class="card"><ul class="list">${S.raps.map((r, i) => ({r, i})).reverse().map(({r, i}) => `<li><a class="go" href="#/rap/${i}"><span class="t"><b>${esc(r.title || "Untitled")}</b><br><span class="s">${nice(r.d)}${r.grade ? ` · ${r.grade.total}/24 estimated · ${esc(r.grade.band)}` : ""}</span></span></a></li>`).join("")}</ul></div>` : `<p class="meta">No saved plans yet.</p>`}`;
};
function rapForm(src) {
  if (!RAP_SOURCES().some(x => x[0] === src)) src = "asp";
  RAPSRC = src;
  const d = rapDraft(), O = RHET.organizer, P = passageOf(src);
  const box = (k, label, hint, rows, check) => `<label class="f">${esc(label)}${hint ? ` <span class="h">${esc(hint)}</span>` : ""}<textarea rows="${rows}" data-in="rapf" data-k="${k}">${esc(d[k] || "")}</textarea></label>${check ? `<div id="rapck-${k}">${rapCheck(k, d)}</div>` : ""}`;
  return `<p class="crumb"><a href="#/rap">‹ Paragraph plans</a></p><h2>Rhetorical analysis paragraph plan</h2><p class="lead">${esc(O.task)}</p>
  <div class="card"><label class="f">Text<select data-in="rapsrc">${RAP_SOURCES().map(([k, nm]) => `<option value="${k}"${k === src ? " selected" : ""}>${esc(nm)}</option>`).join("")}</select></label>
  ${src === "other" ? `<label class="f">Title and author <input type="text" data-in="rapf" data-k="title" value="${esc(d.title)}" placeholder="Author, title"></label>` : ""}
  <p class="meta"><b>Topic:</b> ${esc(O.topic)}</p><details><summary>Guiding questions</summary><ul class="tight">${O.guiding.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details></div>
  ${P ? passageHTML(P, false) : src === "asp" ? `<div class="card note">Use your own annotated excerpt of pages 1-9. The <a href="#/rhetoric/annotate">annotation cards</a> say where each moment is and give a sentence starter for each.</div>` : ""}
  <div class="card outline"><fieldset><legend>Steps 1 and 2 · Read and annotate, then SOAPS and tone</legend>
  ${SOAP_FIELDS.map(([k, t, h]) => `<label class="f">${t} <span class="h">${esc(h)}</span><textarea rows="1" data-in="rapf" data-k="soap.${k}">${esc(d.soap[k] || "")}</textarea></label>`).join("")}
  ${src === "asp" ? `<details><summary>Compare with the class SOAPSTone</summary>${soapTable(RHET.soapAsp)}</details>` : src === RHET.model.passage ? `<details><summary>Compare with the model</summary>${soapTable(RHET.model.soap)}</details>` : ""}</fieldset></div>
  <div class="card outline"><fieldset><legend>Step 3 · Rhetorical elements and figurative language</legend><p class="meta">Tap the ones you found.</p><div class="tags">${RAP_DEV.map(t => `<button type="button" class="tagb${d.dev.includes(t) ? " on" : ""}" data-act="rapdev" data-arg="${esc(t)}">${esc(t)}</button>`).join("")}</div></fieldset></div>
  <div class="card outline"><fieldset><legend>Step 4 · Thesis / claim statement</legend><p class="meta">${esc(O.thesisHint)}</p>${box("thesis", "Thesis", "", 2, true)}</fieldset></div>
  <div class="card outline"><fieldset><legend>Step 5 · Outline the body paragraph</legend>
  ${box("claim", "Claim (topic sentence)", O.claimHint, 2, true)}
  ${box("ev1", "Evidence 1", "A short quotation with its page, or the exact moment", 2, true)}
  ${box("re1", "Reasoning and elaboration", O.reasoningHint, 3, true)}
  ${box("ev2", "Evidence 2", "Introduce it with a transition", 2, true)}
  ${box("re2", "Reasoning and elaboration", O.reasoningHint, 3, true)}
  ${box("concl", "Concluding sentence", "Return to the purpose: how the choices work together", 2, false)}</fieldset></div>
  <div class="card"><h3>Write the paragraph</h3><p class="meta">${esc(O.write)}</p>
  <div class="row"><button class="btn ghost sm" data-act="rapjoin">Put my outline together</button></div>
  <textarea class="draft" data-in="rapf" data-k="para" placeholder="Your paragraph">${esc(d.para)}</textarea><div class="wc" id="rapwc">${wcount(d.para)} words</div>
  <p class="meta">${esc(O.proTip)}</p>
  <div class="row"><button class="btn" data-act="rapgrade">Score my paragraph</button><button class="btn ghost" data-act="rapsave">Save plan</button><a class="btn ghost" href="#/rap/model">See the model</a></div></div>
  <div id="rapgrade">${d.grade ? gradeHTML(RhetCheck.grade(d.para, rapCtx(src))) : ""}</div>`;
}
IN.rapsrc = el => { location.hash = `#/rap/new/${el.value}`; };
IN.rapf = el => {
  const d = rapDraft(), k = el.dataset.k; setPath(d, k, el.value); saveSoon();
  const c = $("#rapck-" + k); if (c) c.innerHTML = rapCheck(k, d);
  if (k === "para") { const w = $("#rapwc"); if (w) w.textContent = `${wcount(el.value)} words`; }
};
ACT.rapdev = (t, el) => { const d = rapDraft(); d.dev = d.dev.includes(t) ? d.dev.filter(x => x !== t) : d.dev.concat(t); el.classList.toggle("on", d.dev.includes(t)); save(); };
ACT.rapjoin = () => {
  const d = rapDraft(), joined = ["claim", "ev1", "re1", "ev2", "re2", "concl"].map(k => (d[k] || "").trim()).filter(Boolean).join(" ");
  if (!joined) { toast("Fill in the outline first"); return; }
  if (d.para.trim() && d.para.trim() !== joined && !confirm("Replace the paragraph box with your outline?")) return;
  d.para = joined; save(); render();
};
ACT.rapgrade = () => {
  const d = rapDraft();
  if (wcount(d.para) < 40) { toast("Write the paragraph first (at least 40 words)"); return; }
  const g = RhetCheck.grade(d.para, rapCtx(d.src)); d.grade = {total: g.total, pct: g.pct, band: g.band};
  goalTick("draft"); active(); save();
  const el = $("#rapgrade"); if (el) { el.innerHTML = gradeHTML(g); el.scrollIntoView({block: "start", behavior: REDUCED ? "auto" : "smooth"}); }
};
ACT.rapsave = () => {
  const d = rapDraft();
  if (wcount(d.para) < 40 && !(d.claim.trim() && d.ev1.trim() && d.re1.trim())) { toast("Fill in at least the claim, one piece of evidence and its reasoning"); return; }
  const g = wcount(d.para) >= 40 ? RhetCheck.grade(d.para, rapCtx(d.src)) : null;
  S.raps.push({...JSON.parse(JSON.stringify(d)), d: today(), grade: g ? {total: g.total, pct: g.pct, band: g.band} : null});
  delete S.drafts["rap:" + d.src]; addXP(20); goalTick("draft"); checkBadges(); save(); toast("Paragraph plan saved");
  location.hash = `#/rap/${S.raps.length - 1}`;
};
ACT.rapcopy = i => { const r = S.raps[Number(i)]; if (!r) return; const c = JSON.parse(JSON.stringify(r)); delete c.d; delete c.grade; S.drafts["rap:" + r.src] = c; save(); location.hash = `#/rap/new/${r.src}`; };
ACT.rapdel = i => { if (!confirm("Delete this paragraph plan?")) return; S.raps.splice(Number(i), 1); save(); location.hash = "#/rap"; };
ACT.rapcheck = i => { const r = S.raps[Number(i)]; if (!r || wcount(r.para) < 40) { toast("Write the paragraph first"); return; } S.drafts["check:rhetorical"] = r.para; S.drafts.lastType = "rhetorical"; save(); location.hash = "#/check/t/rhetorical"; };
const planRows = r => `<table class="tbl">${[["Thesis", r.thesis], ["Claim", r.claim], ["Evidence 1", r.ev1], ["Reasoning", r.re1], ["Evidence 2", r.ev2], ["Reasoning", r.re2], ["Concluding sentence", r.concl]].filter(x => (x[1] || "").trim()).map(([t, v]) => `<tr><th>${t}</th><td>${esc(v)}</td></tr>`).join("")}</table>`;
function rapView(i) {
  const r = S.raps[i];
  return `<p class="crumb"><a href="#/rap">‹ Paragraph plans</a></p><h2>${esc(r.title || "Untitled")}</h2><p class="meta">${nice(r.d)}</p>
  ${Object.values(r.soap || {}).some(v => (v || "").trim()) || (r.dev || []).length ? `<div class="card"><h3>SOAPS and tone</h3>${Object.values(r.soap || {}).some(v => (v || "").trim()) ? soapTable(r.soap) : `<p class="meta">Not filled in.</p>`}${(r.dev || []).length ? `<h4>Elements found</h4><div class="tags">${r.dev.map(t => `<span class="chip ac">${esc(t)}</span>`).join("")}</div>` : ""}</div>` : ""}
  <div class="card"><h3>Outline</h3>${planRows(r)}</div>
  ${wcount(r.para) ? `<div class="card"><h3>Paragraph</h3><p class="prose">${esc(r.para)}</p></div>` : ""}
  ${wcount(r.para) >= 40 ? gradeHTML(RhetCheck.grade(r.para, rapCtx(r.src))) : ""}
  <div class="row"><button class="btn" data-act="rapcheck" data-arg="${i}">Open in Check</button><button class="btn ghost" data-act="rapcopy" data-arg="${i}">Revise a copy</button><button class="btn warn" data-act="rapdel" data-arg="${i}">Delete</button></div>`;
}
function rapModel() {
  const M = RHET.model, P = passageOf(M.passage), para = [M.claim, M.ev1, M.re1, M.ev2, M.re2, M.concl].join(" ");
  return `<p class="crumb"><a href="#/rap">‹ Paragraph plans</a></p><h2>Model paragraph plan</h2><p class="lead">A filled-in plan on a public-domain speech, so you can see what each box should hold. Do yours on <i>A Small Place</i> in your own words.</p>
  ${passageHTML(P, false)}
  <div class="card"><h3>Steps 1 to 3 · SOAPS, tone and elements</h3>${soapTable(M.soap)}<div class="tags" style="margin-top:8px">${M.devices.map(t => `<span class="chip ac">${esc(t)}</span>`).join("")}</div></div>
  <div class="card"><h3>Steps 4 and 5 · Thesis and outline</h3>${planRows({thesis: M.thesis, claim: M.claim, ev1: M.ev1, re1: M.re1, ev2: M.ev2, re2: M.re2, concl: M.concl})}
  <ul class="tight"><li><b>Claim:</b> the author, two devices, a precise verb and the purpose.</li><li><b>Evidence:</b> short quotations, introduced and cited.</li><li><b>Reasoning:</b> three sentences each: what the device does, how it affects the audience, how it serves the purpose.</li><li><b>Concluding sentence:</b> returns to the purpose and the tone.</li></ul></div>
  <div class="card"><h3>The paragraph</h3><p class="prose">${esc(para)}</p></div>
  ${gradeHTML(RhetCheck.grade(para, {author: P.cite}), "How it scores")}
  <div class="row"><a class="btn" href="#/rap/new/asp">Plan yours on A Small Place</a><a class="btn ghost" href="#/rap/new/${M.passage}">Try this speech yourself</a></div>`;
}
