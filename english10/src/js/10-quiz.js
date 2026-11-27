// ---------- Quizzes: reading checks, mixed review, lens, terms, who-and-what, the unit test and My misses
let SES = null, TICK = 0;
const mask = (text, name) => { let t = text; for (const w of name.replace(/'s\b/g, "").split(/\s+/).filter(w => !/^(?:the|of|a|and|at)$/i.test(w))) t = t.replace(new RegExp(`\\b${w.replace(/[^\w]/g, "")}\\w*`, "gi"), "___"); return t; };
function termItem(t, mode) {
  const same = shuffle(TERMS.filter(o => o.g === t.g && o !== t)).slice(0, 3);
  if (mode === "e" && new RegExp(`\\b${t.t.split(/[\s(]/)[0]}`, "i").test(t.ex)) mode = "d";
  if (mode === "t") return {id: `term.${slug(t.t)}.t`, set: "term", kind: "term", q: `What does "${t.t}" mean?`, c: [t.d, ...same.map(o => o.d)], why: `Example: ${t.ex}`};
  if (mode === "e") return {id: `term.${slug(t.t)}.e`, set: "term", kind: "term", q: `Which term does this example show? ${t.ex}`, c: [t.t, ...same.map(o => o.t)], why: `${t.t}: ${t.d}`};
  return {id: `term.${slug(t.t)}.d`, set: "term", kind: "term", q: `Which term matches this definition? ${t.d}`, c: [t.t, ...same.map(o => o.t)], why: `Example: ${t.ex}`};
}
function termItems(n) {
  const pool = shuffle(TERMS.filter(t => t.g !== "drama" || S.set.unit === 7)).slice(0, n);
  return pool.map((t, i) => termItem(t, "dte"[i % 3]));
}
function whoItem(kind, id, b = "lotf") {
  const B = BOOKS[b], pre = b === "lotf" ? "" : b + ".";
  if (kind === "c") {
    const all = B.characters.filter(c => canSee(c.from, b)), c = all.find(x => x.id === id), others = shuffle(all.filter(o => o !== c)).slice(0, 3);
    if (!c || others.length < 3) return null;
    return {id: `who.${pre}c.${id}`, set: "who", kind: "who", q: `${b === "lotf" ? "Who is this?" : "Which voice is this?"} ${mask(c.role, c.name)}`, c: [c.name, ...others.map(o => o.name)], why: c.role};
  }
  const all = B.symbols.filter(s => canSee(s.from, b)), s = all.find(x => x.id === id), others = shuffle(all.filter(o => o !== s)).slice(0, 3);
  if (!s || others.length < 3) return null;
  return {id: `who.${pre}s.${id}`, set: "who", kind: "who", q: `${b === "lotf" ? "Which symbol is this?" : "Which motif is this?"} ${mask(s.means, s.name)}`, c: [s.name, ...others.map(o => o.name)], why: s.means};
}
function whoItems(n, b = "lotf") {
  const B = BOOKS[b], ids = B.characters.filter(c => canSee(c.from, b)).map(c => ["c", c.id]).concat(B.symbols.filter(s => canSee(s.from, b)).map(s => ["s", s.id]));
  return shuffle(ids).map(([k, id]) => whoItem(k, id, b)).filter(Boolean).slice(0, n);
}
function fallacyItem(f) {
  const others = shuffle(ARG.fallacies.filter(o => o !== f)).slice(0, 3);
  return {id: "fal." + slug(f.name), set: "arg", kind: "fallacy", q: `Which fallacy is this? "${f.ex}"`, c: [f.name, ...others.map(o => o.name)], why: `${f.name}: ${f.d} Fix it: ${f.fix}`};
}
function itemById(id) {
  if (ALLQ[id]) return ALLQ[id];
  const m = id.match(/^term\.(.+)\.([dte])$/); if (m && TERM[m[1]]) return termItem(TERM[m[1]], m[2]);
  const w = id.match(/^who\.(?:(asp)\.)?([cs])\.(.+)$/); if (w) return whoItem(w[2], w[3], w[1] || "lotf");
  const f = id.match(/^fal\.(.+)$/); if (f) { const x = ARG.fallacies.find(y => slug(y.name) === f[1]); return x ? fallacyItem(x) : null; }
  return null;
}
const mkItem = x => ({id: x.id, q: x.q, why: x.why, kind: x.kind, ch: x.ch || 0, set: x.set, choices: shuffle(x.c.map((t, i) => ({t, ok: i === 0})))});

function startQuiz(kind, arg, arg2) {
  let items = [], title = "", mode = "practice", minutes = 0, book = "lotf", ch = 0;
  if (kind === "ch") { if (arg2) { book = arg; ch = Number(arg2); } else ch = Number(arg); items = RQ.filter(q => q.book === book && q.ch === ch); title = `Reading check · ${W(book).ch} ${ch}${book !== "lotf" ? " · " + BOOKS[book].title : ""}`; }
  else if (kind === "mix") { book = BOOKS[arg] ? arg : "lotf"; items = shuffle(RQ.filter(q => q.book === book && canSee(q.ch, book))).slice(0, 15); title = `Mixed review · ${BOOKS[book].title}`; }
  else if (kind === "lens") { items = shuffle(LQ).slice(0, 15); title = "Lens quiz"; }
  else if (kind === "terms") { items = termItems(15); title = "Terms quiz"; }
  else if (kind === "who") { book = BOOKS[arg] ? arg : "lotf"; items = whoItems(12, book); title = `Who and what · ${BOOKS[book].title}`; }
  else if (kind === "arg") { items = shuffle(AQ.filter(q => !arg || q.src === arg)).slice(0, 15); const src = ARG.sources.find(x => x.id === arg), L = ARG.lessons.find(x => x.id === arg); title = src ? `Source practice · ${src.author}` : L ? `Lesson quiz · ${L.title}` : "Argument quiz"; }
  else if (kind === "fallacies") { items = shuffle(ARG.fallacies.map(fallacyItem).concat(AQ.filter(q => q.kind === "fallacy"))).slice(0, 15); title = "Fallacy finder"; }
  else if (kind === "unit") {
    const u = Number(arg) || 4; mode = "test"; minutes = 40; title = `Unit ${u} test`;
    if (u === 3) items = shuffle(AQ).slice(0, 24).concat(shuffle(ARG.fallacies).slice(0, 6).map(fallacyItem));
    else {
      const b = u === 2 ? "asp" : "lotf", r = shuffle(RQ.filter(q => q.book === b && canSee(q.ch, b))).slice(0, u === 2 ? 20 : 18), rest = 30 - r.length;
      const extra = u === 2 ? termItems(40).filter(t => TERM[t.id.split(".")[1]] && TERM[t.id.split(".")[1]].g === "arg").slice(0, rest) : shuffle(LQ).slice(0, Math.ceil(rest / 2)).concat(termItems(Math.floor(rest / 2)));
      items = r.concat(extra);
    }
    items = shuffle(items);
  }
  else if (kind === "miss") { items = Object.keys(S.miss).map(itemById).filter(Boolean).slice(0, 15); title = "My misses"; }
  else if (kind === "retry" && SES) { items = SES.items.filter((it, i) => !(it.choices[SES.picks[i]] || {}).ok).map(it => itemById(it.id)).filter(Boolean); title = "Retry missed"; }
  if (!items.length) { toast(kind === "miss" ? "No misses to fix. Nice." : "Nothing to quiz yet: read a chapter first."); return false; }
  SES = {kind, arg, title, mode, items: items.map(mkItem), i: 0, picks: [], t0: Date.now(), end: minutes ? Date.now() + minutes * 60000 : 0, done: false, ch, book};
  if (location.hash === "#/run") render(); else location.hash = "#/run";
  return true;
}
function recordQ(it, ok) {
  const q = S.qs[it.id] || (S.qs[it.id] = {n: 0, ok: 0});
  q.n++; if (ok) q.ok++; q.last = today(); q.k = it.kind; if (it.ch) q.ch = it.ch;
  if (!ok) { const m = S.miss[it.id] || (S.miss[it.id] = {n: 0}); m.n++; m.last = today(); }
  else if (S.miss[it.id] && (SES.kind === "miss" || SES.kind === "retry" || q.n > 1)) { delete S.miss[it.id]; S.fixed++; }
  active();
}
ACT.quiz = a => { const [k, arg, arg2] = String(a).split(":"); startQuiz(k, arg, arg2); };
ACT.pick = a => {
  if (!SES || SES.done) return;
  const i = Number(a);
  if (SES.mode === "practice") {
    if (SES.picks[SES.i] != null) return;
    SES.picks[SES.i] = i;
    const it = SES.items[SES.i], ok = it.choices[i].ok;
    recordQ(it, ok); beep(ok); if (ok) addXP(4); save();
  } else SES.picks[SES.i] = i;
  render();
};
ACT.qnext = () => { if (!SES) return; if (SES.i < SES.items.length - 1) { SES.i++; render(); window.scrollTo(0, 0); } else finishQuiz(); };
ACT.qprev = () => { if (SES && SES.i > 0) { SES.i--; render(); } };
ACT.qgo = a => { if (SES) { SES.i = Number(a); render(); } };
ACT.qsubmit = () => {
  const blank = SES.items.length - SES.picks.filter(p => p != null).length;
  if (blank && !confirm(`${blank} question${blank === 1 ? " is" : "s are"} unanswered. Submit anyway?`)) return;
  finishQuiz();
};
ACT.qretry = () => startQuiz("retry");
ACT.qquit = () => { if (confirm("Leave this quiz? Answers so far are saved.")) { SES = null; location.hash = "#/test"; } };
function finishQuiz() {
  if (!SES || SES.done) return;
  if (SES.mode === "test") SES.items.forEach((it, i) => recordQ(it, !!(it.choices[SES.picks[i]] || {}).ok));
  SES.done = true; clearInterval(TICK);
  const n = SES.items.length, right = SES.items.filter((it, i) => (it.choices[SES.picks[i]] || {}).ok).length;
  SES.right = right; SES.ms = Date.now() - SES.t0;
  S.quizzes.push({d: today(), kind: SES.kind, ch: SES.ch, book: SES.book, unit: SES.kind === "unit" ? Number(SES.arg) || 4 : undefined, title: SES.title, n, right, ms: SES.ms});
  if (S.quizzes.length > 400) S.quizzes.splice(0, S.quizzes.length - 400);
  addXP((SES.kind === "unit" ? 50 : 20) + (right === n ? 20 : 0));
  if (["ch", "mix", "unit", "miss", "retry"].includes(SES.kind)) goalTick("rcheck");
  if (["lens", "terms", "who", "unit", "arg", "fallacies"].includes(SES.kind)) goalTick("quiz");
  if (right === n) celebrate("perfect");
  checkBadges(); save(); render(); window.scrollTo(0, 0);
}
function quizTimer() {
  clearInterval(TICK);
  if (!SES || !SES.end || SES.done) return;
  const upd = () => {
    const left = (SES.end - Date.now()) / 1000, el = $("#timer");
    if (left <= 0) { clearInterval(TICK); toast("Time's up. Your test is submitted."); finishQuiz(); return; }
    if (el) { el.textContent = mmss(left); el.classList.toggle("low", left < 300); }
  };
  upd(); TICK = setInterval(upd, 1000);
}
const kindChip = it => { const b = it.id.startsWith("asp.") ? "asp" : "lotf"; return `<span class="pill">${esc(KIND_NAMES[it.kind] || it.kind)}</span>${it.ch ? `<span class="chip">${W(b).ch} ${it.ch}</span>` : ""}`; };
V.run = () => {
  if (!SES) { location.replace("#/test"); return ""; }
  if (SES.done) return quizResults();
  const it = SES.items[SES.i], p = SES.picks[SES.i], shown = SES.mode === "practice" && p != null;
  AFTER = quizTimer;
  const choices = it.choices.map((c, i) => {
    let cls = "choice";
    if (shown) { if (c.ok) cls += " right"; else if (i === p) cls += " wrong"; }
    else if (i === p) cls += " sel";
    return `<button type="button" class="${cls}" data-act="pick" data-arg="${i}"${shown ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${esc(c.t)}</span></button>`;
  }).join("");
  const fb = shown ? `<div class="fb${it.choices[p].ok ? "" : " bad"}"><b>${it.choices[p].ok ? "Right." : "Not quite."}</b> ${esc(it.why)}</div>` : "";
  const last = SES.i === SES.items.length - 1;
  const nav = SES.mode === "practice"
    ? `<button class="btn" data-act="qnext"${shown ? "" : " disabled"}>${last ? "See results" : "Next"}</button>`
    : `<button class="btn ghost" data-act="qprev"${SES.i ? "" : " disabled"}>Back</button><button class="btn" data-act="${last ? "qsubmit" : "qnext"}">${last ? "Submit test" : "Next"}</button>`;
  const sheet = SES.mode === "test" ? `<div class="sheet" aria-label="Questions">${SES.items.map((x, i) => `<button type="button" data-act="qgo" data-arg="${i}" class="${SES.picks[i] != null ? "ans" : ""}${i === SES.i ? " cur" : ""}">${i + 1}</button>`).join("")}</div><div class="row"><button class="btn ghost sm" data-act="qsubmit">Submit test</button></div>` : "";
  return `<p class="crumb"><a href="#/test">‹ Test</a></p>
  <div class="tesbar"><b>${esc(SES.title)}</b><span>Question ${SES.i + 1} of ${SES.items.length}</span><span class="sp"></span>${SES.end ? `<span class="timer" id="timer"></span>` : ""}<button class="btn ghost sm" data-act="qquit">Leave</button></div>
  <div class="q"><div class="qhead">${kindChip(it)}</div><p class="stem">${esc(it.q)}</p><div class="choices">${choices}</div>${fb}</div>
  <div class="row">${nav}</div>${sheet}`;
};
function quizResults() {
  const n = SES.items.length, right = SES.right, byKind = {};
  SES.items.forEach((it, i) => { const k = it.kind, b = byKind[k] || (byKind[k] = [0, 0]); b[1]++; if ((it.choices[SES.picks[i]] || {}).ok) b[0]++; });
  const rows = SES.items.map((it, i) => {
    const p = it.choices[SES.picks[i]], ok = p && p.ok, r = it.choices.find(c => c.ok);
    return `<li class="${ok ? "ok" : "no"}"><details${ok ? "" : " open"}><summary><span class="mark">${ok ? "✓" : "✗"}</span><span>${esc(it.q)}</span></summary>
      <p>${p ? `Your answer: ${esc(p.t)}<br>` : "Not answered<br>"}${ok ? "" : `Answer: <b>${esc(r.t)}</b><br>`}<span class="quiet">${esc(it.why)}</span></p></details></li>`;
  }).join("");
  const B = BOOKS[SES.book] || LOTF, missed = n - right, chNext = SES.kind === "ch" && SES.ch < B.chapters_n ? `<a class="btn ghost" href="#/ch/${B.id}/${SES.ch + 1}">${W(B.id).ch} ${SES.ch + 1} guide</a>` : "";
  return `<p class="crumb"><a href="#/test">‹ Test</a></p>
  <div class="card ${right === n ? "okc" : ""}"><h2>${esc(SES.title)}</h2><p class="big">${right} of ${n} · ${pct(right, n)}%</p>
  <p class="meta">${mmss(SES.ms / 1000)} · ${right === n ? "Perfect. Every answer right." : missed === 1 ? "One to review below." : `${missed} to review below; they're saved in My misses.`}</p>
  <div class="bars">${Object.entries(byKind).map(([k, [a, b]]) => `<span>${esc(KIND_NAMES[k] || k)}</span><span class="bar"><i style="width:${pct(a, b)}%"></i></span><span>${a}/${b}</span>`).join("")}</div>
  <div class="row">${missed ? `<button class="btn" data-act="qretry">Retry the ${missed} missed</button>` : ""}<a class="btn ghost" href="#/test">Back to Test</a>${chNext}</div></div>
  <ul class="rlist">${rows}</ul>`;
}
