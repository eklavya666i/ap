// ---------- Coach: what to do next (ranked, with the reason), insights, advice, teacher emails and the AI-use log
const ROW_DRILL = {thesis: "w-theme", evidence: "w-embed", commentary: "w-comm", counter: "w-counter", organization: "trans1", style: "voice1", conventions: "mla2", lens: "w-lens", synthesis: "synth1", context: "verbs1", focus: "w-theme", craft: "w-comm", sources: "synth1", story: "w-comm"};
function kindAccuracy() {
  const by = {};
  for (const [id, q] of Object.entries(S.qs)) { const k = q.k || (id.startsWith("lens.") ? "lens" : id.startsWith("term.") ? "term" : id.startsWith("who.") ? "who" : (ALLQ[id] || {}).kind); if (!k) continue; const b = by[k] || (by[k] = [0, 0]); b[0] += q.ok; b[1] += q.n; }
  return by;
}
function rowAverages() {
  const by = {};
  for (const r of S.rub) { const E = ESSAY(r.type); if (!E) continue; for (const row of E.rubric) if (r.rows[row.k]) { const b = by[row.k] || (by[row.k] = {name: row.row, sum: 0, n: 0}); b.sum += r.rows[row.k]; b.n++; } }
  return by;
}
function recs() {
  const out = [], k = today(), add = (pri, title, why, href, label, arg) => out.push({pri, title, why, href, label, arg});
  for (const a of S.asg.filter(x => !x.done)) {
    const ns = nextStep(a); if (!ns) continue;
    const d = (a.plan || {})[ns[0]], left = daysTo(a.due);
    if (left <= 2 && ESSAY_TYPES.includes(a.type) && !(a.steps || {}).draft) add(95 - left, `Draft "${a.title}" now`, `It's ${dueWords(a.due)} and the draft isn't done.`, `#/asg/${a.id}/draft`, "Open draft");
    else if (d && d < k) add(90, `Catch up: ${ns[1].toLowerCase()} for "${a.title}"`, `Planned for ${nice(d)}; the assignment is ${dueWords(a.due)}.`, `#/asg/${a.id}`, "Open");
    else if (d === k) add(85, `Today: ${ns[1].toLowerCase()} for "${a.title}"`, `It's on today's plan; the assignment is ${dueWords(a.due)}.`, `#/asg/${a.id}`, "Open");
  }
  const r = readTo();
  if (S.set.unit === 4 && r > 0) {
    const unchecked = LOTF.chapters.filter(c => c.n <= r && bestCheck(c.n) == null).pop();
    if (unchecked) add(70, `Take the chapter ${unchecked.n} reading check`, "You've read it but haven't checked it. Reading checks are Prep points.", null, "Start", `ch:${unchecked.n}`);
    const weak = LOTF.chapters.filter(c => c.n <= r && bestCheck(c.n) != null && bestCheck(c.n) < 6).sort((a, b) => bestCheck(a.n) - bestCheck(b.n))[0];
    if (weak) add(60, `Retake the chapter ${weak.n} check`, `Your best is ${bestCheck(weak.n)} of 8. Reread the guide's key events first.`, `#/ch/${weak.n}`, "Open guide");
  }
  if (S.set.unit === 4 && r < 12) add(50, `Read chapter ${r + 1}`, r ? `You've read through chapter ${r}.` : "Start the novel; set your progress in Learn as you go.", `#/ch/${r + 1}`, "Watch-for list");
  const misses = Object.keys(S.miss).length; if (misses >= 5) add(55, `Clear My misses (${misses})`, "Questions you missed come back until you get them right.", null, "Start", "miss");
  const cards = dueCards().due.length; if (cards >= 10) add(52, `Review ${cards} cards`, "They're due today; about one minute per ten cards.", "#/review", "Review");
  const rows = Object.entries(rowAverages()).filter(([, b]) => b.n >= 2).map(([kk, b]) => [kk, b.sum / b.n, b.name]).sort((a, b) => a[1] - b[1]);
  if (rows.length && rows[0][1] <= 2.5) { const d = DRILL[ROW_DRILL[rows[0][0]]]; add(58, `Work on ${rows[0][2].toLowerCase()}`, `Your rubric average there is ${rows[0][1].toFixed(1)} of 4, your lowest row.`, d ? `#/drill/${d.id}` : "#/drills", "Drill"); }
  const recentChecks = S.checks.slice(-5), areaCount = {};
  for (const c of recentChecks) for (const [a, v] of Object.entries(c.areas || {})) if (v === "fix") areaCount[a] = (areaCount[a] || 0) + 1;
  const topArea = Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0];
  if (topArea && topArea[1] >= 2) { const d = DRILL[ROW_DRILL[topArea[0]]]; add(57, `Fix ${AREA_NAMES[topArea[0]].toLowerCase()} in your drafts`, `The checker flagged it in ${topArea[1]} of your last ${recentChecks.length} checks.`, d ? `#/drill/${d.id}` : "#/drills", "Drill"); }
  for (const [kk, [ok, n]] of Object.entries(kindAccuracy())) if (n >= 6 && ok / n < 0.7) add(56, `Practice ${(KIND_NAMES[kk] || kk).toLowerCase()} questions`, `You're at ${pct(ok, n)}% on them.`, null, "Mixed review", kk === "lens" ? "lens" : kk === "term" ? "terms" : "mix");
  if (r >= 4 && !S.quizzes.some(q => q.kind === "lens")) add(45, "Take the lens quiz", "Lenses are the core of this unit's essay.", null, "Start", "lens");
  if (!S.writes.length && ["lens", "lit", "argument"].includes((UNIT(S.set.unit) || {}).essay)) add(40, "Try a timed write", "Practice under the clock before the in-class one.", "#/test", "Test");
  if (!out.length) add(10, "Log a quotation from your last chapter", "Evidence collected now saves time on every essay.", "#/quotes", "Quote Log");
  return out.sort((a, b) => b.pri - a.pri).slice(0, 5);
}
const recHTML = (x, i) => `<li><span class="n">${i + 1}</span><span class="t"><b>${esc(x.title)}</b><br><span class="s">${esc(x.why)}</span></span>${x.arg ? `<button class="btn sm" data-act="quiz" data-arg="${x.arg}">${esc(x.label)}</button>` : x.href ? `<a class="btn sm ghost" href="${x.href}">${esc(x.label)}</a>` : ""}</li>`;
V.coach = () => {
  const R = recs(), acc = kindAccuracy(), rows = rowAverages();
  return `<h2>Coach</h2><p class="lead">What to do next and why, based on your plan, quizzes, rubric scores and draft checks.</p>
  <div class="card hi"><h3>Do these next</h3><ul class="list">${R.map(recHTML).join("")}</ul></div>
  <div class="cols"><div class="card"><h3>Quiz accuracy</h3>${Object.keys(acc).length ? `<div class="bars">${Object.entries(acc).map(([k, [a, b]]) => `<span>${esc(KIND_NAMES[k] || k)}</span><span class="bar"><i style="width:${pct(a, b)}%"></i></span><span>${pct(a, b)}%</span>`).join("")}</div>` : `<p class="meta">Take a reading check to see this.</p>`}
  <h4>Reading checks</h4><div class="heat">${LOTF.chapters.map(c => `<a class="${heatClass(c.n)}" href="#/ch/${c.n}">${c.n}</a>`).join("")}</div></div>
  <div class="card"><h3>Rubric rows</h3>${Object.keys(rows).length ? `<div class="bars">${Object.values(rows).map(b => `<span>${esc(b.name)}</span><span class="bar"><i style="width:${pct(b.sum / b.n, 4)}%"></i></span><span>${(b.sum / b.n).toFixed(1)}</span>`).join("")}</div>` : `<p class="meta">Score a draft with the rubric in Check to see your strongest and weakest rows.</p>`}
  <h4>Draft checks</h4><p class="meta">${S.checks.length ? `${S.checks.length} checks · last: ${S.checks[S.checks.length - 1].fixes} to fix, ${S.checks[S.checks.length - 1].tips} to consider` : "None yet."}</p></div></div>
  <h3>Advice</h3><div class="grid">${ADVICE.map(a => `<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/advice/${a.id}"><span class="pill">${esc(a.tag)}</span><h3 style="margin-top:8px">${esc(a.title)}</h3></a>`).join("")}</div>
  <div class="row"><a class="btn ghost" href="#/advice/teacher">Email templates</a><a class="btn ghost" href="#/ailog">AI-use log (${S.ai.length})</a></div>`;
};
V.advice = id => {
  const a = ADVICE.find(x => x.id === id); if (!a) return V.coach();
  if (!S.seen["adv:" + id]) { S.seen["adv:" + id] = today(); addXP(3); }
  const extra = id === "teacher" ? EMAILS.map(e => `<div class="card"><h3>${esc(e.title)}</h3><p class="meta">Subject: ${esc(e.subject)}</p><pre class="email">${esc(e.body)}</pre><div class="row"><button class="btn ghost sm" data-act="copyemail" data-arg="${e.id}">Copy</button></div></div>`).join("")
    : id === "ai" ? `<div class="row"><a class="btn ghost" href="#/ailog">Open the AI-use log</a></div>` : id === "seminar" ? `<div class="row"><a class="btn ghost" href="#/seminar">Seminar prep</a></div>` : id === "timed" ? `<div class="row"><a class="btn ghost" href="#/test">Timed writes</a></div>` : "";
  return `<p class="crumb"><a href="#/coach">‹ Coach</a></p><div class="card${id === "heavy" ? " note" : ""}"><span class="pill">${esc(a.tag)}</span><h2 style="margin-top:8px">${esc(a.title)}</h2><div class="prose">${a.body.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>${extra}`;
};
ACT.copyemail = id => { const e = EMAILS.find(x => x.id === id); copyText(`Subject: ${e.subject}\n\n${e.body}`, "Copied. Fill in the brackets."); };
const aiLogText = () => S.ai.map(x => `${x.d}: Claude feedback on "${x.title}" (${ESSAY(x.type) ? ESSAY(x.type).name : x.type}), ${x.words} words of my draft ${x.how}. No AI-written text was used.`).join("\n");
ACT.copyai = () => copyText(aiLogText(), "Log copied");
V.ailog = () => `<p class="crumb"><a href="#/coach">‹ Coach</a></p><h2>AI-use log</h2><p class="lead">Every time you sent a draft to Claude for feedback. If your teacher asks you to disclose AI help, this is your record.</p>
  <div class="card">${S.ai.length ? `<table class="tbl"><tr><th>Date</th><th>Draft</th><th>Words</th></tr>${S.ai.slice().reverse().map(x => `<tr><td>${nice(x.d)}</td><td>${esc(x.title)}</td><td>${x.words}</td></tr>`).join("")}</table><div class="row"><button class="btn ghost sm" data-act="copyai">Copy the log</button></div>` : `<p class="meta">Nothing yet.</p>`}</div>`;
