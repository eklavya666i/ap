// ---------- Sessions: practice to mastery, My Mistakes, quizzes, 5-minute tests (skill and daily), unit test,
// classic test sim, word-problem workshop and the boss. "each" = feedback after every answer; "end" = test conditions.
let SES = null, tick = null;
const stopTick = () => { if (tick) { clearInterval(tick); tick = null; } };
const KINDS = {
  practice: {title: 'Practice', fb: 'each'}, mistakes: {title: 'My Mistakes', fb: 'each'}, workshop: {title: 'Word-problem workshop', fb: 'each'},
  boss: {title: 'Boss challenge', fb: 'each', hearts: 3},
  quiz: {title: 'Lesson quiz', fb: 'end'}, five: {title: '5-minute test', fb: 'end', limit: 300}, daily: {title: 'Daily 5-minute test', fb: 'end', limit: 300},
  unit: {title: 'Unit test', fb: 'end', limit: 2400}, sim: {title: 'Test sim', fb: 'end', limit: 1500}
};
const UNITMIX = {fac: 2, simp: 4, md: 3, as: 4, cf: 3, solve: 5, sys: 2, word: 2};
const SIMMIX = {fac: 1, simp: 2, md: 2, as: 2, cf: 2, solve: 3, sys: 1, word: 2};
function tplItem(k, o = {}) {
  let ts = TBYSK[k];
  if (o.word) ts = ts.filter(t => t.word);
  if (o.dmin) { const f = ts.filter(t => t.d >= o.dmin); if (f.length) ts = f; }
  if (o.avoid && o.avoid.length) { const f = ts.filter(t => !o.avoid.includes(t.id)); if (f.length) ts = f; }
  return itemFromTpl(rpk(ts).id);
}
function bankPick(k, o = {}) {
  let qs = BYSK[k];
  if (o.typed) { const f = qs.filter(q => q.ta); if (f.length) qs = f; }
  if (o.avoid && o.avoid.length) { const f = qs.filter(q => !o.avoid.includes(q.id)); if (f.length) qs = f; }
  const un = qs.filter(q => S.seenB[q.id] === undefined), miss = qs.filter(q => S.seenB[q.id] === 0);
  return itemFromBank(rpk(un.length ? un : miss.length ? miss : qs));
}
function practiceItem(k) {
  const st = L(k), avoid = SES.recent || [];
  if (Math.random() < 0.35) return bankPick(k, {avoid});
  let ts = TBYSK[k].filter(t => !avoid.includes(t.id)); if (!ts.length) ts = TBYSK[k];
  const want = st.run.length >= 2 ? [2, 3] : st.run.length === 1 ? [1, 2, 3] : [1, 2];
  const pool = ts.filter(t => want.includes(t.d));
  return itemFromTpl(rpk(pool.length ? pool : ts).id);
}
function mixedSkill() { const open = SKILLS.filter(k => chipOf(k) !== 'mastered'); return rpk(open.length ? open : SKILLS); }
function mistakeItem(m) { return m.src === 't' && TPL[m.key] ? itemFromTpl(m.key) : BANK[m.key] ? itemFromBank(BANK[m.key]) : null; }
function sesItems(kind, o) {
  const out = [];
  if (kind === 'quiz') { for (let n = 0; n < 5; n++) out.push(n % 2 ? bankPick(o.k, {avoid: out.map(i => i.key)}) : tplItem(o.k, {avoid: out.map(i => i.key)})); }
  if (kind === 'five') { for (let n = 0; n < 6; n++) out.push(n % 3 === 2 ? bankPick(o.k, {typed: 1, avoid: out.map(i => i.key)}) : tplItem(o.k, {avoid: out.map(i => i.key), dmin: n > 2 ? 2 : 0})); }
  if (kind === 'daily') {
    (o.due || []).slice(0, 3).forEach(k => { out.push(tplItem(k)); out.push(tplItem(k, {dmin: 2})); });
    const pool = SKILLS.filter(k => L(k).chip !== 'untouched'); const src = pool.length ? pool : SKILLS;
    while (out.length < 6) out.push(tplItem(rpk(src), {dmin: Math.random() < .5 ? 2 : 0}));
  }
  if (kind === 'unit') { for (const k in UNITMIX) for (let n = 0; n < UNITMIX[k]; n++) out.push(n % 2 ? bankPick(k, {typed: 1, avoid: out.map(i => i.key)}) : tplItem(k, {dmin: n > 1 ? 2 : 0, avoid: out.map(i => i.key)})); }
  if (kind === 'sim') { for (const k in SIMMIX) shuf(BYSK[k]).slice(0, SIMMIX[k]).forEach(q => out.push(itemFromBank(q))); }
  if (kind === 'workshop') { const ws = shuf(TBYSK.word.filter(t => t.word)); for (let n = 0; n < 4; n++) out.push(itemFromTpl(ws[n % ws.length].id)); }
  if (kind === 'boss') { const ks = shuf(SKILLS.concat(SKILLS)).slice(0, 9); ks.forEach(k => out.push(tplItem(k, {dmin: 2, avoid: out.map(i => i.key)}))); shuf(D.qs.filter(q => q.d === 3)).slice(0, 3).forEach(q => out.push(itemFromBank(q))); return shuf(out); }
  return out;
}
function sesStart(kind, o = {}) {
  const K = KINDS[kind];
  SES = {kind, k: o.k || null, title: o.title || K.title + (o.k ? ': ' + SK[o.k].n : ''), fb: K.fb, limit: K.limit || 0, hearts: K.hearts || 0, t0: Date.now(), i: 0, items: [], qs: [], recent: [], done: false, due: o.due || [], flags: {}, results: null, xp: 0, right: 0, n: 0};
  if (kind === 'practice') { SES.items.push(practiceItem(SES.k || mixedSkill())); }
  else if (kind === 'mistakes') { SES.queue = shuf(Object.values(S.mist)); SES.fixedAt = S.fixed; const m = SES.queue.shift(); const it = m && mistakeItem(m); if (!it) { SES = null; toast('No mistakes to fix.'); return; } SES.items.push(it); }
  else SES.items = sesItems(kind, o);
  if (!SES.items.length) { SES = null; return; }
  sesShowQ(); window.scrollTo(0, 0);
}
function sesQ(i) { if (!SES.qs[i]) { startQ(SES.items[i], {test: SES.fb === 'end', frame: SES.kind === 'workshop'}); SES.qs[i] = Q; } else Q = SES.qs[i]; return Q; }
function timerText() { if (!SES.limit) return ''; const l = Math.max(0, SES.limit - (Date.now() - SES.t0) / 1000); const show = S.set.timer === 'always' || (S.set.timer === 'last' && l <= 60); return show ? '<span class="timer' + (l < 60 ? ' low' : '') + '" id="tmr">' + mmss(l) + '</span>' : '<span id="tmr"></span>'; }
function heartsHTML() { return '<span class="hearts" aria-label="' + SES.hearts + ' lives">' + [0, 1, 2].map(k => ic('heart', k < SES.hearts ? '' : 'gone')).join('') + '</span>'; }
function sesTop() {
  const right = SES.kind === 'boss' ? heartsHTML() : SES.fb === 'end' ? timerText() : '<button class="btn sm" data-a="send">End</button>';
  top(SES.title, right);
  setTab(['quiz', 'five', 'daily', 'unit', 'sim', 'boss', 'workshop'].includes(SES.kind) ? 'tests' : 'practice');
}
function masteryRun() {
  if (SES.kind !== 'practice' || !SES.k) return '';
  const st = L(SES.k), n = Math.min(st.run.length, 3);
  return st.chip === 'mastered' ? '<div class="mrun">' + chipHTML(SES.k) + '<span class="meta">Keep it sharp — reviews come back on days 1, 3, 7 and 21.</span></div>'
    : '<div class="mrun"><span class="pips">' + [0, 1, 2].map(k => '<i class="' + (k < n ? 'on' : '') + '"></i>') .join('') + '</span><span class="meta">Mastery: 3 right in a row with no hints, including a Standard or Stretch question.</span></div>';
}
function sesShowQ() {
  RUN = SESRUN; sesQ(SES.i); sesTop();
  const N = SES.fb === 'end' || SES.kind === 'workshop' || SES.kind === 'boss' ? SES.items.length : 0;
  let h = '<div class="wrap">' + (N ? '<div class="qprog"><span>Question ' + (SES.i + 1) + ' of ' + N + '</span>' + bar(100 * (SES.fb === 'end' ? SES.qs.filter(q => q && q.done).length : SES.i) / N) + '<span class="num">' + (SES.fb === 'end' ? SES.qs.filter(q => q && q.done).length + ' saved' : SES.right + ' right') + '</span></div>' : '<div class="qprog"><span>' + (SES.kind === 'mistakes' ? (SES.queue.length + 1) + ' to fix' : SES.n + ' answered · ' + SES.right + ' right') + '</span></div>') + masteryRun() + qBlock();
  if (Q.done && SES.fb === 'each') h += fbHTML(Q, Q.xp || 0) + '<div class="cta"><button class="btn pri big" data-a="snext" id="nextb">' + nextLabel() + '</button>' + (SES.kind === 'practice' ? '<button class="btn big" data-a="nav" data-to="lesson-' + Q.it.s + '">Open the lesson</button>' : '') + '</div>';
  if (SES.fb === 'end') h += '<div class="tnav"><button class="btn" data-a="tprev"' + (SES.i ? '' : ' disabled') + '>‹ Back</button><button class="btn' + (SES.flags[SES.i] ? ' on' : '') + '" data-a="tflag">' + ic('flag2') + (SES.flags[SES.i] ? 'Flagged' : 'Flag') + '</button><button class="btn" data-a="tnext">' + (SES.i + 1 < SES.items.length ? 'Next ›' : 'Finish') + '</button></div><section class="card"><div class="pal">' + SES.items.map((_, k) => '<button data-a="tgo" data-i="' + k + '" class="' + (SES.qs[k] && SES.qs[k].done ? 'ans ' : '') + (SES.flags[k] ? 'flag ' : '') + (k === SES.i ? 'cur' : '') + '" aria-label="Question ' + (k + 1) + '">' + (k + 1) + '</button>').join('') + '</div><div class="cta"><button class="btn big" data-a="tsubmit">Submit</button></div></section>';
  main.innerHTML = h + '</div>';
  if (Q.done && SES.fb === 'each') { const f = $('#fb'); if (f && f.getBoundingClientRect().top > innerHeight * .6) f.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'}); }
  if (SES.limit && !tick) tick = setInterval(() => { if (!SES || SES.done) { stopTick(); return; } const l = SES.limit - (Date.now() - SES.t0) / 1000, el = $('#tmr'); if (el && (S.set.timer === 'always' || (S.set.timer === 'last' && l <= 60))) { el.textContent = mmss(l); el.className = 'timer' + (l < 60 ? ' low' : ''); } if (l <= 0) { stopTick(); sesFinish(); } }, 1000);
}
function nextLabel() {
  if (SES.kind === 'boss' && SES.hearts <= 0) return 'See how it went';
  if (['workshop', 'boss'].includes(SES.kind)) return SES.i + 1 < SES.items.length ? 'Next question' : 'Finish';
  if (SES.kind === 'mistakes') return SES.queue.length ? 'Next mistake' : 'Finish';
  return 'Next question';
}
const SESRUN = {answer(q) {
  if (SES.fb === 'end') {   // save quietly and move on
    const nxt = SES.qs.findIndex((x, k) => k > SES.i && (!x || !x.done));
    if (nxt >= 0) SES.i = nxt; else if (SES.i + 1 < SES.items.length) SES.i++;
    sesShowQ(); window.scrollTo(0, 0); return;
  }
  SES.n++; if (q.g.ok) SES.right++;
  q.xp = recordAnswer({it: q.it, ok: q.g.ok, hints: q.hints, mode: SES.kind === 'boss' ? 'test' : SES.kind, ms: Date.now() - q.t0, g: q.g, typed: q.mode === 'type'});
  SES.xp += q.xp || 0;
  SES.recent.push(q.it.key); SES.recent = SES.recent.slice(-4);
  if (SES.kind === 'workshop') { S.explore.workshop++; bumpQuest('workshop'); save(); checkBadges(); }
  if (SES.kind === 'boss' && !q.g.ok) SES.hearts--;
  sesShowQ();
  if (S.set.autoRead) Voice.say([q.g.ok ? 'Correct.' : 'Not quite. ' + (q.g.msg || '')]);
}};
function sesNext() {
  if (SES.kind === 'practice') { SES.items.push(practiceItem(SES.k || mixedSkill())); SES.i++; }
  else if (SES.kind === 'mistakes') { let it = null; while (!it && SES.queue.length) it = mistakeItem(SES.queue.shift()); if (!it) return sesFinish(); SES.items.push(it); SES.i++; }
  else if (SES.kind === 'boss' && SES.hearts <= 0) return sesFinish();
  else { if (SES.i + 1 >= SES.items.length) return sesFinish(); SES.i++; }
  sesShowQ(); window.scrollTo(0, 0);
}
function sesFinish() {
  if (!SES || SES.done) return; stopTick(); SES.done = true; RUN = null; Voice.stop();
  const used = Math.min(SES.limit || 1e9, (Date.now() - SES.t0) / 1000);
  if (SES.fb === 'end') {
    SES.qs = SES.items.map((_, i) => SES.qs[i] || null);
    let s = 0;
    SES.qs.forEach((q, i) => { if (q && q.done && q.g) { recordAnswer({it: q.it, ok: q.g.ok, hints: 0, mode: 'test', ms: 9999, g: q.g, typed: q.mode === 'type'}); if (q.g.ok) s++; } });
    SES.score = s;
    S.tests.push({kind: SES.kind, title: SES.title, s, n: SES.items.length, t: Math.round(used), d: Date.now()}); S.tests = S.tests.slice(-40);
    if (SES.kind === 'daily' || SES.kind === 'five') { bumpQuest('test5'); }
    if (SES.kind === 'daily') {
      day().done = 1;
      SES.revOut = (SES.due || []).map(k => { const its = SES.qs.filter(q => q && q.it.s === k); const ok = its.length && its.every(q => q.done && q.g && q.g.ok); const r = nextReview(k); if (r) { if (ok) L(k).rev[r.stage] = 'ok'; else { const st = L(k); st.chip = 'practicing'; st.run = []; } } return {k, ok, stage: r ? r.stage : 0}; });
      streakCare();
    }
    save(); checkBadges();
  } else if (SES.kind === 'boss') {
    SES.win = SES.hearts > 0 && SES.i + 1 >= SES.items.length && SES.qs[SES.items.length - 1] && SES.qs[SES.items.length - 1].done;
    if (SES.win) { S.boss++; addXP(200); S.coins += 50; confetti(); toast('Boss beaten! +200 XP and 50 coins'); }
    S.tests.push({kind: 'boss', title: 'Boss challenge', s: SES.right, n: SES.n, t: Math.round(used), d: Date.now()}); save(); checkBadges();
  } else { save(); }
  vSesEnd();
}
function msgFor(r, n) { const p = n ? r / n : 0; return p >= .9 ? 'Tournament ready.' : p >= .7 ? 'Solid round. Clean up the misses below.' : p >= .5 ? 'You made the cut. Review the traps, then fix the misses.' : 'Range session first: reread the lessons, then practice to mastery.'; }
function reviewItem(q, i) {
  const it = q.it, ans = q && q.done && q.g, ok = ans && q.g.ok;
  return '<details class="card rv ' + (!ans ? 'skip' : ok ? 'ok' : 'no') + '"' + (ok ? '' : ' open') + '><summary><span class="rvs">' + (!ans ? '–' : ic(ok ? 'check' : 'x')) + '</span><span class="rvq"><span class="rvn">Question ' + (i + 1) + ' · ' + SK[it.s].n + (!ans ? ' · not answered' : '') + '</span>' + R(it.q) + '</span><span class="rvc">' + ic('chev') + '</span></summary><div class="rvb"><p class="yours' + (ok ? ' ok' : '') + '">' + (!ans ? 'Not answered.' : ok ? 'Right: ' + yourAns(q) : 'Your answer: ' + yourAns(q) + (q.g.msg ? ' — ' + R(q.g.msg) : '')) + '</p>' + solHTML(it) + '</div></details>';
}
function vSesEnd() {
  const X = SES; setTab(['quiz', 'five', 'daily', 'unit', 'sim', 'boss', 'workshop'].includes(X.kind) ? 'tests' : 'practice');
  if (X.fb === 'end') {
    top(X.title + ': results'); const by = {};
    X.items.forEach((it, i) => { const q = X.qs[i], b = by[it.s] || (by[it.s] = {n: 0, c: 0}); b.n++; if (q && q.done && q.g && q.g.ok) b.c++; });
    main.innerHTML = '<div class="wrap"><section class="card score"><div class="big-n">' + X.score + '<span> / ' + X.items.length + '</span></div><p>' + msgFor(X.score, X.items.length) + ' Time: ' + mmss((Date.now() - X.t0) / 1000 > X.limit && X.limit ? X.limit : (Date.now() - X.t0) / 1000) + '.</p>'
      + (X.revOut && X.revOut.length ? '<div class="list">' + X.revOut.map(r => '<div class="row static"><span class="rt"><b>' + SK[r.k].n + ' · day-' + r.stage + ' review</b><span>' + (r.ok ? 'Passed — it stuck.' : 'Slipped — back to practicing.') + '</span></span>' + ic(r.ok ? 'check' : 'x') + '</div>').join('') + '</div>' : '')
      + '<div class="list">' + D.skills.filter(s => by[s.k]).map(s => '<div class="row static"><span class="rt"><b>' + s.n + '</b></span><span class="rm">' + bar(100 * by[s.k].c / by[s.k].n, by[s.k].c === by[s.k].n ? 'g' : '') + '<span class="num">' + by[s.k].c + '/' + by[s.k].n + '</span></span></div>').join('') + '</div></section>'
      + '<h2 class="h2">Every question, worked out</h2>' + X.items.map((it, i) => reviewItem(X.qs[i] || {it, done: false}, i)).join('')
      + '<div class="cta">' + (Object.keys(S.mist).length ? '<button class="btn pri big" data-a="mistakes">Fix my mistakes (' + Object.keys(S.mist).length + ')</button>' : '') + '<button class="btn big" data-a="nav" data-to="tests">Tests</button></div></div>';
  } else {
    top(X.title + ': done');
    const fixed = X.kind === 'mistakes' ? S.fixed - X.fixedAt : 0;
    main.innerHTML = '<div class="wrap"><section class="card score"><div class="big-n">' + X.right + '<span> / ' + X.n + '</span></div><p>' + (X.kind === 'boss' ? (X.win ? 'Boss beaten. That was a hard round.' : 'Out of lives. Practice the misses and come back.') : X.kind === 'mistakes' ? 'Fixed ' + fixed + ' mistake' + (fixed === 1 ? '' : 's') + '. ' + Object.keys(S.mist).length + ' left.' : msgFor(X.right, X.n)) + (X.xp ? ' +' + X.xp + ' XP.' : '') + '</p>' + (X.k ? '<p>' + chipHTML(X.k) + '</p>' : '') + '</section>'
      + '<div class="cta">' + (X.k ? '<button class="btn pri big" data-a="pskill" data-k="' + X.k + '">Keep practicing</button>' : '') + (Object.keys(S.mist).length ? '<button class="btn big" data-a="mistakes">Fix my mistakes (' + Object.keys(S.mist).length + ')</button>' : '') + '<button class="btn big" data-a="nav" data-to="today">Today</button></div></div>';
  }
  window.scrollTo(0, 0); renderStats();
}
Object.assign(ACT, {
  pick: t => { if (!Q || (Q.done && !Q.test)) return; Q.pick = +t.dataset.ci; if (Q.test) { Q.g = gradeMC(Q.it, Q.pick); Q.done = true; RUN && RUN.answer(Q); } else qCheck(); },
  qcheck: () => { if (Q && Q.test) Q.done = false; qCheck(); },
  key: t => keyIn(t.dataset.k),
  fld: t => { if (!Q || (Q.done && !Q.test)) return; Q.focus = t.dataset.f; refreshFields(); },
  quick: t => { if (!Q) return; Q.f[t.dataset.f] = '∅'; Q.focus = t.dataset.f; refreshFields(); },
  hint: () => { if (!Q || Q.done) return; Q.hints = Math.min(3, Q.hints + 1); rerenderQ(); if (S.set.autoRead) Voice.say([Q.hints === 3 ? Q.it.x.map(s => '$' + s[0] + '$. ' + s[1]).join(' ') : Q.it.h[Q.hints - 1]]); },
  tomc: () => { if (!Q || Q.done) return; Q.mode = 'mc'; Q.hints = Math.max(Q.hints, 1); rerenderQ(); },
  totype: () => { if (!Q || Q.done) return; Q.mode = 'type'; rerenderQ(); },
  fpick: t => { const i = +t.dataset.i; Q.fpick = i; if (i === 0) { Q.fstep = 9; toast('Right model. Now solve it.'); } rerenderQ(); },
  sayq: () => { if (Q) readQ(); },
  sayfb: () => { if (Q && Q.g) Voice.say([(Q.g.ok ? 'Correct. ' : 'Not quite. ' + (Q.g.msg || '') + ' ') + 'Solution: ' + Q.it.x.map(s => '$' + s[0] + '$. ' + s[1]).join(' ')]); },
  snext: () => sesNext(),
  send: () => { if (SES && SES.n) sesFinish(); else { SES = null; go('practice'); } },
  tprev: () => { if (SES.i > 0) { SES.i--; sesShowQ(); } },
  tnext: () => { if (SES.i + 1 < SES.items.length) { SES.i++; sesShowQ(); } else askSubmit(); },
  tgo: t => { SES.i = +t.dataset.i; sesShowQ(); },
  tflag: () => { SES.flags[SES.i] = !SES.flags[SES.i]; sesShowQ(); },
  tsubmit: () => askSubmit(),
  pskill: t => { quietHash('practice'); sesStart('practice', {k: t.dataset.k}); },
  pmix: () => { quietHash('practice'); sesStart('practice', {title: 'Mixed practice'}); },
  mistakes: () => { quietHash('practice'); sesStart('mistakes'); },
  quiz: t => { quietHash('tests'); sesStart('quiz', {k: t.dataset.k}); },
  five: t => { quietHash('tests'); sesStart('five', {k: t.dataset.k}); },
  daily: () => { quietHash('tests'); sesStart('daily', {due: reviewsDue()}); },
  unit: () => { quietHash('tests'); sesStart('unit'); },
  sim: () => { quietHash('tests'); sesStart('sim'); },
  workshop: () => { quietHash('tests'); sesStart('workshop'); },
  boss: () => { if (masteredCount() < 6) { toast('The boss unlocks when 6 of 8 skills are mastered.'); return; } quietHash('tests'); sesStart('boss'); }
});
function askSubmit() { const un = SES.items.length - SES.qs.filter(q => q && q.done).length; confirmBox(un ? 'Submit with ' + un + ' unanswered question' + (un > 1 ? 's' : '') + '?' : 'Submit your answers?', 'Submit', sesFinish); }
function rerenderQ() { if (SES && !SES.done && RUN === SESRUN) sesShowQ(); else if (RUN === WEDO) { const box = $('#wedo'); if (box) box.innerHTML = '<p class="meta">Check ' + (LV.we.n + 1) + ' of 2</p>' + qBlock(); } }
