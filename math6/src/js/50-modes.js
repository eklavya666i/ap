// ---------- Practice, My Mistakes, quizzes, 5-minute tests, unit tests, boss challenges and the word problem workshop
let P = null;      // practice state: {lesson, mode, tpl, retried, tried}
let SES = null;    // test-like session: {kind, title, items, i, resp, ms, feedback, limit, t0, hearts, flags, back}
let tick = null;
function stopTimers() { if (tick) { clearInterval(tick); tick = null; } }
const tplsOf = id => (LESSONS[id].c ? LESSONS[id].c.templates : []);
const timedOf = id => tplsOf(id).filter(t => t.type !== "explain");      // written explanations are never scored in timed tests
function pickTpl(ts, lvl, avoid) {
  const near = d => ts.filter(t => t.diff === d && t.id !== avoid);
  let pool = near(lvl);
  for (let k = 1; !pool.length && k < 3; k++) pool = near(lvl - k).concat(near(lvl + k));
  if (!pool.length) pool = ts.filter(t => t.id !== avoid);
  if (!pool.length) pool = ts;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- Practice: unlimited, adaptive, with the hint ladder
function practiceStart(lesson, mode = "practice") {
  P = {lesson, mode, tpl: null, retried: false, misses: 0};
  practiceNext();
}
function practiceNext() {
  if (P.mode === "mistakes") {
    const list = Object.keys(S.mist).filter(t => TPL[t]);
    if (!list.length) { P.empty = true; Q = null; return; }
    const t = list.filter(x => x !== P.tpl)[0] || list[0];
    P.tpl = t; P.lesson = TPL[t].lesson;
  } else {
    const st = L(P.lesson);
    P.tpl = pickTpl(tplsOf(P.lesson), st.lvl || 1, P.tpl).id;
  }
  P.retried = false;
  startQ(makeItem(P.tpl, freshSeed(P.lesson, P.tpl)));
}
function masteryLine(id) {
  const st = L(id);
  if (st.chip === "mastered") return `<span class="chip m">Mastered</span> Reviews keep it fresh: ${REVIEWS.map(r => st.rev && st.rev[r] === "ok" ? "✓" : "○").join(" ")}`;
  return `Mastery: ${st.run.length} of 3 in a row ${[0, 1, 2].map(k => k < st.run.length ? "●" : "○").join("")}${st.run.length && !st.run.some(d => d >= 2) ? " · one must be Standard or harder" : ""}`;
}
function practiceHTML() {
  if (P.empty) return `<div class="card"><p><b>No mistakes to fix right now.</b> Every miss lands here and comes back with new numbers.</p></div>`;
  const it = Q.it, done = Q.done;
  const bar = done
    ? `<div class="row"><button type="button" class="btn" data-act="p-next">Next question</button>${!Q.g.ok && !P.retried && P.mode === "practice" ? '<button type="button" class="btn ghost" data-act="p-retry">Try again</button>' : ""}</div>`
    : `<div class="row"><button type="button" class="btn" data-act="p-check">Check</button>${Q.hints < 3 ? `<button type="button" class="btn ghost" data-act="p-hint">Hint ${Q.hints + 1} of 3</button>` : ""}</div>`;
  return `<div class="pmeta">${P.mode === "mistakes" ? `Fixing: ${esc(LESSONS[P.lesson].id)} ${esc(LESSONS[P.lesson].title)}` : masteryLine(P.lesson)}</div>
${qHTML({slip: true})}${Q.hints && !done ? `<div class="hints">${hintsHTML(it, Q.hints)}</div>` : ""}${bar}`;
}
function practiceRender() { const el = $("#mode"); if (el) el.innerHTML = practiceHTML(); }
let fastMisses = 0;
Object.assign(ACT, {
  "p-check": () => {
    const g = grade(Q.it, Q.r);
    if (g.empty) { toast("Answer first"); return; }
    if (g.close) { Q.g = g; practiceRender(); return; }
    Q.done = true; Q.g = g;
    const ms = Date.now() - Q.t0;
    beep(g.ok);
    if (P.retried) { practiceRender(); return; }          // a retry on the same numbers doesn't count
    // No reward for guessing: a wrong answer in under 2 seconds earns nothing; three in a row pause XP for 2 minutes.
    if (!g.ok && ms < 2000) { if (++fastMisses >= 3) { xpPausedUntil = Date.now() + 120000; fastMisses = 0; toast("Slow down. Read each question first. XP is paused for 2 minutes."); } }
    else if (g.ok) fastMisses = 0;
    const xp = recordAnswer({lesson: P.lesson, tpl: Q.it.tpl, seed: Q.it.seed, ok: g.ok, hints: Q.hints, ms, mis: g.mis, mode: P.mode, diff: Q.it.diff});
    if (g.ok && P.mode === "mistakes") fixMistake(Q.it.tpl);
    if (xp) addXP(xp);
    checkBadges(); practiceRender();
    if (!g.ok && S.set.autoRead) readAloud(g.msg || "");
  },
  "p-hint": () => { Q.hints = Math.min(3, Q.hints + 1); practiceRender(); if (S.set.autoRead) Voice.play([plain(Q.hints === 3 ? Q.it.sol.map(x => x.s + ". " + x.why).join(" ") : Q.it.hints[Q.hints - 1] || "")]); },
  "p-next": () => { Voice.stop(); practiceNext(); practiceRender(); },
  "p-retry": () => { P.retried = true; const it = Q.it; startQ(it); practiceRender(); },
  "slip": () => { const m = S.mist[Q.it.tpl]; if (m) { m.err = "careless"; save(); } toast("Noted as a slip"); }
});

// ---------- Building tests
function itemsFromTpls(list) { return list.map(t => ({tpl: t.id, seed: freshSeed(t.lesson, t.id), lesson: t.lesson})); }
function quizItems(lesson) {
  const ts = timedOf(lesson), out = [];
  for (const [d, n] of [[1, 2], [2, 4], [3, 2]]) for (let k = 0; k < n; k++) out.push(pickTpl(ts, d, out.length ? out[out.length - 1].id : null));
  return itemsFromTpls(out);
}
// 5-minute test: add questions until their expected times reach about 270 seconds (90% of the clock).
function fiveItems(pools, rules = {}) {
  const out = [], used = {};
  let t = 0;
  const take = tp => { out.push(tp); used[tp.id] = (used[tp.id] || 0) + 1; t += tp.est; };
  for (const need of rules.need || []) {
    const c = pools.filter(tp => tp.tag === need[0]);
    for (let k = 0; k < need[1] && c.length; k++) take(c[Math.floor(Math.random() * c.length)]);
  }
  let guard = 0;
  while (t < 250 && guard++ < 200) {
    const lvl = Math.random() < 0.3 ? 1 : Math.random() < 0.72 ? 2 : 3;
    const c = pools.filter(tp => tp.diff === lvl && (used[tp.id] || 0) < 2 && t + tp.est <= 290);
    if (!c.length) { const any = pools.filter(tp => (used[tp.id] || 0) < 2 && t + tp.est <= 290); if (!any.length) break; take(any[Math.floor(Math.random() * any.length)]); }
    else take(c[Math.floor(Math.random() * c.length)]);
  }
  return itemsFromTpls(out.slice(0, 10));
}
function lessonFive(lesson) { return fiveItems(timedOf(lesson), {need: [["CONCEPT", 1], ["PROCEDURE", 3], ["APPLICATION", 1]]}); }
function unitFive(u) {
  const bp = unitContent(u).t5 || [], out = [];
  for (const slot of bp) {
    const ts = slot === "W" ? builtLessons(u).flatMap(timedOf).filter(t => t.word) : [].concat(slot).flatMap(timedOf);
    if (ts.length) out.push(ts[Math.floor(Math.random() * ts.length)]);
  }
  return itemsFromTpls(out);
}
function dailyItems() {
  const due = reviewsDue(), out = [];
  let t = 0;
  for (const d of due) {
    const ts = timedOf(d.lesson).filter(x => x.diff >= 2), tp = (ts.length ? ts : timedOf(d.lesson))[Math.floor(Math.random() * Math.max(1, ts.length))];
    if (!tp || t + tp.est > 240) break;
    out.push(Object.assign(itemsFromTpls([tp])[0], {review: d.r})); t += tp.est;
  }
  // then recent lessons, so the daily test is never empty once practice has started
  const recent = [...new Set(S.att.slice(-60).map(a => TPL[a.tpl] && TPL[a.tpl].lesson).filter(Boolean))].reverse();
  const pool = (recent.length ? recent : builtLessons(S.set.current || 1).slice(0, 2)).flatMap(timedOf);
  let guard = 0;
  while (t < 210 && pool.length && guard++ < 50) { const tp = pool[Math.floor(Math.random() * pool.length)]; if (t + tp.est > 240) continue; out.push(itemsFromTpls([tp])[0]); t += tp.est; }
  out.push({drill: true});
  return out;
}
function unitTestItems(u) {
  const ids = builtLessons(u), ts = ids.flatMap(timedOf), out = [];
  for (const id of ids) out.push(pickTpl(timedOf(id), 2, null));
  const want = {1: 6, 2: 13, 3: 6};
  for (const t of out) want[t.diff] = Math.max(0, want[t.diff] - 1);
  for (const d of [1, 2, 3]) for (let k = 0; k < want[d] && out.length < 25; k++) out.push(pickTpl(ts, d, out[out.length - 1].id));
  while (out.length < 25 && ts.length) out.push(ts[Math.floor(Math.random() * ts.length)]);
  return itemsFromTpls(out.slice(0, 25));
}
function bossItems(u) {
  const ts = builtLessons(u).flatMap(timedOf), hard = ts.filter(t => t.diff >= 2), out = [];
  for (let k = 0; k < 12; k++) out.push((k % 3 === 2 ? ts.filter(t => t.diff === 3) : hard)[Math.floor(Math.random() * (k % 3 === 2 ? ts.filter(t => t.diff === 3).length : hard.length))] || ts[0]);
  return itemsFromTpls(out);
}
function workshopItems(scope) {
  const ts = (scope === "all" ? ORDER.filter(id => LESSONS[id].c) : builtLessons(Number(scope))).flatMap(timedOf).filter(t => t.word);
  return itemsFromTpls(M6.shuffle(M6.rng(rand32()), ts).slice(0, 5));
}

// ---------- Running a test-like session
const KINDS = {
  quiz: {title: "Lesson quiz", feedback: "each", limit: 0},
  t5: {title: "5-minute test", feedback: "end", limit: 300},
  t5u: {title: "Unit 5-minute test", feedback: "end", limit: 300},
  daily: {title: "Daily 5-minute test", feedback: "end", limit: 300},
  unit: {title: "Unit test", feedback: "end", limit: 2100, flags: true},
  boss: {title: "Boss challenge", feedback: "each", limit: 0, hearts: 3},
  shop: {title: "Word problem workshop", feedback: "each", limit: 0, frame: true},
  uclock: {title: "Unit speed test", feedback: "end", limit: 0, clock: true}
};
function sesStart(kind, scope, items, back) {
  stopTimers(); Voice.stop();
  const K = KINDS[kind];
  SES = {kind, scope, items, i: 0, resp: [], g: [], ms: items.map(() => 0), seen: [], flags: {}, feedback: K.feedback, limit: K.limit, t0: Date.now(), hearts: K.hearts || 0, back, title: K.title, frameStep: 0};
  sesShow(0);
  if (SES.limit || K.clock) tick = setInterval(sesTick, 1000);
}
function sesItem(k) {
  const x = SES.items[k];
  if (!x.it) x.it = x.drill ? drillItem() : makeItem(x.tpl, x.seed);
  return x.it;
}
function sesShow(k) {
  // save the open answer only if it belongs to this test (a question left open in another test must not carry over)
  if (Q && SES.items[SES.i] && Q.it === SES.items[SES.i].it && !Q.done) { SES.resp[SES.i] = Q.r; SES.ms[SES.i] += Date.now() - Q.t0; }
  SES.i = k;
  const it = sesItem(k);
  startQ(it);
  if (SES.resp[k] != null) Q.r = SES.resp[k];
  if (SES.g[k]) { Q.done = true; Q.g = SES.g[k]; }
  SES.seen[k] = 1;
  SES.frameStep = SES.kind === "shop" && it.frame && (S.wslevel || 0) < 2 ? 0 : 9;
}
function sesLeft() { return SES.limit - (Date.now() - SES.t0) / 1000; }
function sesTick() {
  if (!SES || SES.done) return stopTimers();
  if (!SES.limit) { const el = $("#timer"); if (el) el.textContent = mmss((Date.now() - SES.t0) / 1000); return; }
  const left = sesLeft(), el = $("#timer");
  if (el) {
    const show = S.set.timer === "always" || (S.set.timer === "last" && left <= 60);
    el.textContent = show ? mmss(left) : "";
    el.classList.toggle("low", left <= 30);
  }
  if (left <= 0) sesSubmit(true);
}
function sesHTML() {
  if (SES.done) return resultsHTML();
  const n = SES.items.length, it = Q.it, K = KINDS[SES.kind];
  const top = `<div class="tesbar"><b>${esc(SES.title)}</b><span>Question ${SES.i + 1} of ${n}</span>${SES.hearts ? `<span class="hearts" aria-label="${SES.hearts} hearts left">${"♥".repeat(SES.hearts)}${"♡".repeat(3 - SES.hearts)}</span>` : ""}<span class="sp"></span>${SES.limit ? `<span id="timer" class="timer">${S.set.timer === "always" ? mmss(sesLeft()) : ""}</span>` : K.clock ? `<span id="timer" class="timer">${mmss((Date.now() - SES.t0) / 1000)}</span>` : ""}${K.flags ? `<button type="button" class="btn ghost sm" data-act="s-flag" aria-pressed="${!!SES.flags[SES.i]}">${SES.flags[SES.i] ? "⚑ Flagged" : "⚐ Flag"}</button>` : ""}</div>`;
  if (SES.sheet) return top + sheetHTML();
  let frame = "";
  if (SES.kind === "shop" && it.frame && SES.frameStep < 2) {
    const f = it.frame, step = SES.frameStep, opts = step === 0 ? f.find : f.tool;
    frame = `<div class="frame"><div class="fsteps">${["Understand", "Plan", "Solve", "Check"].map((s, k) => `<span class="${k === step ? "on" : k < step ? "past" : ""}">${k + 1}. ${s}</span>`).join("")}</div>
<div class="stem">${it.stem}</div><p><b>${step === 0 ? "What is the question asking you to find?" : "Which tool fits best?"}</b></p>
<div class="choices">${opts.map((o, k) => `<button type="button" class="choice" data-frame="${k}"><span class="key">${LETTERS[k]}</span><span>${mathHTML(o)}</span></button>`).join("")}</div></div>`;
    return top + frame;
  }
  const each = SES.feedback === "each", done = Q.done;
  const nav = each
    ? (done ? `<button type="button" class="btn" data-act="s-next">${SES.i === n - 1 || (SES.hearts === 0 && SES.kind === "boss") ? "See results" : "Next"}</button>` : `<button type="button" class="btn" data-act="s-check">Check</button>`)
    : `<button type="button" class="btn ghost" data-act="s-prev"${SES.i === 0 ? " disabled" : ""}>Back</button><button type="button" class="btn" data-act="s-next">${SES.i === n - 1 ? "Review and submit" : "Next"}</button>`;
  const check = SES.kind === "shop" && done && it.frame ? `<p class="meta"><b>4. Check:</b> ${mathHTML(it.frame.check)}</p>` : "";
  return `${top}${qHTML({scratch: true})}${check}<div class="row">${nav}${!each ? '<button type="button" class="btn ghost" data-act="s-sheet">All questions</button>' : ""}</div>`;
}
function sheetHTML() {
  const n = SES.items.length, answered = k => SES.resp[k] != null && !gradeEmpty(k);
  return `<div class="card"><p><b>Review your answers.</b> Tap a number to go back to it.</p><div class="sheet">${SES.items.map((x, k) => `<button type="button" class="sq${answered(k) ? " ans" : ""}${SES.flags[k] ? " flag" : ""}" data-sgo="${k}">${k + 1}${SES.flags[k] ? "⚑" : ""}</button>`).join("")}</div>
<p class="meta">${SES.items.filter((x, k) => answered(k)).length} of ${n} answered.</p><div class="row"><button type="button" class="btn" data-act="s-submit">Submit</button><button type="button" class="btn ghost" data-act="s-unsheet">Keep working</button></div></div>`;
}
function gradeEmpty(k) { const it = sesItem(k); return grade(it, SES.resp[k]).empty; }
function sesRender() { const el = $("#mode"); if (el) el.innerHTML = sesHTML(); }
function sesGradeAll() {
  SES.items.forEach((x, k) => {
    const it = sesItem(k), r = SES.resp[k];
    const g = r == null ? {ok: false, empty: true} : grade(it, r);
    SES.g[k] = Object.assign(g, {reached: !!SES.seen[k] && r != null && !g.empty});
  });
}
function sesSubmit(auto) {
  if (!SES || SES.done) return;
  if (Q && !Q.done) { SES.resp[SES.i] = Q.r; SES.ms[SES.i] += Date.now() - Q.t0; }
  stopTimers();
  if (SES.feedback === "end") sesGradeAll();
  SES.done = true; SES.secs = Math.round((Date.now() - SES.t0) / 1000); SES.auto = auto;
  sesRecord(); sesRender();
  window.scrollTo(0, 0);
}
function sesRecord() {
  const n = SES.items.length, right = SES.g.filter(g => g && g.ok).length, kind = SES.kind;
  let xp = 0;
  SES.items.forEach((x, k) => {
    const g = SES.g[k] || {ok: false}, it = sesItem(k);
    if (x.drill) return;
    if (kind !== "quiz" && kind !== "boss" && kind !== "shop") recordAnswer({lesson: it.lesson, tpl: it.tpl, seed: it.seed, ok: g.ok, ms: SES.ms[k], mis: g.mis, mode: kind, diff: it.diff});
    if (x.review) recordReview(it.lesson, x.review, g.ok);
  });
  if (kind === "quiz" || kind === "t5" || kind === "t5u" || kind === "daily") xp += 10 * right + (right === n ? 20 : 0);
  if (kind === "unit") xp += 10 * right + (right / n >= 0.9 ? 50 : 0);
  if (kind === "uclock") xp += right;
  if (kind === "boss" && SES.won) { xp += 200; S.coins += 50; S.boss = S.boss || {}; S.boss[SES.scope] = today(); celebrate("boss"); unitTrophies(Number(SES.scope)); }
  addXP(xp);
  const rec = {t: Date.now(), kind, scope: SES.scope, n, right, secs: SES.secs, items: SES.items.map((x, k) => ({tpl: x.tpl || "drill", seed: x.seed || 0, ok: SES.g[k] && SES.g[k].ok ? 1 : 0, ms: Math.round(SES.ms[k])}))};
  const before = S.tests.filter(t => t.kind === kind && t.scope === SES.scope);
  S.tests.push(rec); if (S.tests.length > 120) S.tests.shift();
  if ((kind === "t5" || kind === "t5u" || kind === "daily") && right === n) award("perfect5");
  if (kind === "unit" && right / n >= 0.9) award("champ");
  if (right / n >= 0.7 && before.some(t => t.right / t.n < 0.7)) award("bounce");
  if (kind === "daily") { day().done = 1; questTick("test5"); }
  if (kind === "quiz") questTick("quiz");
  if (kind !== "quiz" && kind !== "shop") day().done = 1;
  checkBadges(); save();
}
function resultsHTML() {
  const n = SES.items.length, right = SES.g.filter(g => g && g.ok).length, notReached = SES.g.filter(g => g && !g.reached && !g.ok).length;
  const mis = {};
  SES.g.forEach(g => { if (g && g.mis && g.msg) mis[g.msg] = (mis[g.msg] || 0) + 1; });
  const pen = SES.kind === "uclock" ? 5 * (n - right) : 0;
  const head = SES.kind === "uclock" ? `<h3>${mmss(SES.secs + pen)} for ${n} questions</h3><p>${right} right; ${n - right} × 5 seconds added.</p>` : SES.kind === "boss" ? (SES.won ? `<h3>Boss beaten!</h3>` : `<h3>The boss won this time.</h3><p>Out of hearts. Practice the skills below, then try again with new numbers.</p>`) : `<h3>${right} of ${n} right</h3>`;
  return `<div class="card results">${head}<p class="meta">${SES.secs ? `Time used: ${mmss(SES.secs)}` : ""}${notReached && SES.feedback === "end" ? ` · ${notReached} not reached` : ""}${SES.auto ? " · time ran out" : ""}</p>
${Object.keys(mis).length ? `<div class="mislist"><b>Mistakes to watch</b><ul>${Object.entries(mis).map(([m, c]) => `<li>${mathHTML(m)}${c > 1 ? ` (×${c})` : ""}</li>`).join("")}</ul></div>` : ""}
<ol class="rlist">${SES.items.map((x, k) => {
    const it = sesItem(k), g = SES.g[k] || {}, ms = SES.ms[k], est = it.est || 20;
    const pace = SES.limit && g.reached ? `<span class="pace${ms / 1000 > est * 1.5 ? " slow" : ""}">${Math.round(ms / 1000)} s of ${est} s</span>` : "";
    return `<li class="${g.ok ? "ok" : "no"}"><details><summary><span class="mark">${g.ok ? "✓" : g.reached === false && SES.feedback === "end" ? "—" : "✗"}</span><span class="rq">${esc(plain(it.stem)).slice(0, 110)}${plain(it.stem).length > 110 ? "…" : ""}</span>${pace}</summary>
<p><b>Answer:</b> ${mathHTML(answerText(it))}</p>${g.msg && !g.ok ? `<p class="fbmsg">${mathHTML(g.msg)}</p>` : ""}${solutionHTML(it)}<button type="button" class="btn ghost sm" data-rsay="${k}">🔊 Read the solution</button></details></li>`;
  }).join("")}</ol>
<div class="row"><button type="button" class="btn" data-act="s-retake">Retake with new numbers</button>${SES.g.some(g => g && !g.ok) ? '<a class="btn ghost" href="#/mistakes">Practice the missed skills</a>' : ""}<a class="btn ghost" href="${esc(SES.back)}">Done</a></div></div>`;
}
Object.assign(ACT, {
  "s-check": () => {
    const g = grade(Q.it, Q.r);
    if (g.empty) { toast("Answer first"); return; }
    if (g.close) { Q.g = g; sesRender(); return; }
    Q.done = true; Q.g = g; SES.g[SES.i] = Object.assign(g, {reached: true}); SES.resp[SES.i] = Q.r; SES.ms[SES.i] += Date.now() - Q.t0;
    beep(g.ok);
    if (SES.kind === "boss" && !g.ok) SES.hearts--;
    if (SES.kind === "shop") { S.wsrun = g.ok ? (S.wsrun || 0) + 1 : 0; if (S.wsrun >= 3) { S.wslevel = Math.min(2, (S.wslevel || 0) + 1); S.wsrun = 0; } if (!g.ok) S.wslevel = Math.max(0, (S.wslevel || 0) - 1); }
    const it = Q.it;
    if (SES.kind === "boss" || SES.kind === "shop") { recordAnswer({lesson: it.lesson, tpl: it.tpl, seed: it.seed, ok: g.ok, ms: SES.ms[SES.i], mis: g.mis, mode: SES.kind === "shop" ? "workshop" : "boss", diff: it.diff}); if (g.ok) addXP(5); }
    sesRender();
  },
  "s-next": () => {
    if (SES.feedback === "each" && Q.done) {
      if (SES.kind === "boss" && SES.hearts === 0) { SES.won = false; return sesSubmit(false); }
      if (SES.i === SES.items.length - 1) { if (SES.kind === "boss") SES.won = SES.hearts > 0; return sesSubmit(false); }
      sesShow(SES.i + 1); return sesRender();
    }
    if (SES.i === SES.items.length - 1) { SES.resp[SES.i] = Q.r; SES.sheet = true; return sesRender(); }
    sesShow(SES.i + 1); sesRender(); window.scrollTo(0, 0);
  },
  "s-prev": () => { sesShow(Math.max(0, SES.i - 1)); sesRender(); },
  "s-sheet": () => { SES.resp[SES.i] = Q.r; SES.sheet = true; sesRender(); },
  "s-unsheet": () => { SES.sheet = false; sesRender(); },
  "s-submit": () => sesSubmit(false),
  "s-flag": () => { SES.flags[SES.i] = !SES.flags[SES.i]; sesRender(); },
  "s-retake": () => { const k = SES.kind, sc = SES.scope, back = SES.back; startKind(k, sc, back); render(); }
});
function clockItems(u) {
  const ts = builtLessons(u).flatMap(timedOf).filter(t => t.diff === 1 && t.est <= 30 && ["num", "mc"].includes(t.type)), out = [];
  for (let k = 0; k < 20 && ts.length; k++) out.push(ts[Math.floor(Math.random() * ts.length)]);
  return itemsFromTpls(out);
}
function startKind(kind, scope, back) {
  const items = kind === "uclock" ? clockItems(Number(scope)) : kind === "quiz" ? quizItems(scope) : kind === "t5" ? lessonFive(scope) : kind === "t5u" ? unitFive(Number(scope)) : kind === "daily" ? dailyItems()
    : kind === "unit" ? unitTestItems(Number(scope)) : kind === "boss" ? bossItems(Number(scope)) : workshopItems(scope);
  sesStart(kind, scope, items, back);
}
