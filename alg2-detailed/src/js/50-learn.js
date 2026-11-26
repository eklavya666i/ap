// ---------- Learn: lessons with a narrated, highlighted walkthrough, "another way", two We-do checks; and the review sheet
let LV = null;   // lesson view state {k, items, i (current say index), we: {n, items}}
function lessonSayItems(l) {
  const items = []; const add = (say, label) => { items.push({say, i: items.length, label}); return items.length - 1; };
  add(l.t + '. ' + l.hook, 'Hook'); add(l.big, 'Big idea');
  l.how.forEach((h, k) => add('Step ' + (k + 1) + '. ' + h, 'Method, step ' + (k + 1)));
  l.ex.forEach((e, n) => { add('Example ' + (n + 1) + '. ' + e.q, 'Example ' + (n + 1)); e.s.forEach((s, k) => add((s[0] ? '$' + s[0] + '$. ' : '') + (s[1] || ''), 'Example ' + (n + 1) + ', step ' + (k + 1))); add('Answer: ' + e.a, 'Example ' + (n + 1) + ', answer'); });
  add('Watch out. ' + l.traps.join(' '), 'Traps');
  return items;
}
function vLearn() {
  top('Learn'); setTab('learn');
  main.innerHTML = '<div class="wrap"><p class="lede">Eight lessons in review-sheet order. Press Play and the voice walks you through each step while it lights up. Every lesson ends with two quick checks.</p>'
    + '<button class="pcard hot" data-a="nav" data-to="sheet">' + ic('sheet') + '<div><b>Review sheet</b><span>Your 12 problems from 4.3–4.5, solved step by step · ' + Object.keys(S.sh).length + ' / 12 confident</span></div>' + ic('chev') + '</button><div style="height:12px"></div>'
    + '<section class="card list">' + D.lessons.map(l => { const st = L(l.k); return '<button class="row" data-a="nav" data-to="lesson-' + l.k + '"><span class="rt"><b>' + l.t + chipHTML(l.k) + '</b><span>' + l.sh + (S.ls[l.k] ? ' · read' : '') + '</span></span><span class="rm">' + bar(st.chip === 'mastered' ? 100 : 100 * Math.min(st.run.length, 3) / 3, st.chip === 'mastered' ? 'g' : '') + '</span>' + ic('chev') + '</button>'; }).join('') + '</section></div>';
}
function exCard(e, sayBase) {
  let n = sayBase;
  const h = '<section class="card ex"><div class="exh"><span class="tag">' + esc(e.t) + '</span></div><div class="mb prob say" data-say="' + (n++) + '">' + disp(e.q) + '</div><div class="steps">' + e.s.map(s => '<div class="st say" data-say="' + (n++) + '" hidden>' + stepHTML(s) + '</div>').join('') + '</div><div class="ans say" data-say="' + (n++) + '" hidden><b>Answer</b>' + R(e.a) + '</div><div class="exbtn"><button class="btn pri" data-a="step">Show step 1 of ' + e.s.length + '</button><button class="btn" data-a="allsteps">Show all</button></div></section>';
  return [h, n];
}
function vLesson(k) {
  const l = LES[k]; if (!l) return vLearn();
  if (!S.ls[k]) { S.ls[k] = 1; save(); bumpQuest('lesson'); checkBadges(); } else bumpQuest('lesson');
  top(l.t, '', ['learn', 'Learn']); setTab('learn');
  LV = {k, items: lessonSayItems(l), i: -1, we: null};
  let n = 0;
  let h = '<div class="wrap"><div class="lhead"><div><h1 class="h1">' + l.t + '</h1><p class="meta">' + l.sh + ' ' + chipHTML(k) + '</p></div></div>'
    + '<div class="player" id="player">' + playerHTML() + '</div>'
    + '<div class="hook say" data-say="' + (n++) + '">' + ic('flag') + '<p>' + R(l.hook) + '</p></div><p class="big say" data-say="' + (n++) + '">' + R(l.big) + '</p>'
    + (l.keys && l.keys.length ? '<section class="card keys">' + l.keys.map(x => '<div class="kl">' + x[0] + '</div><div class="mb"><span class="m">' + tex(x[1]) + '</span></div>').join('') + '</section>' : '')
    + '<h2 class="h2">Method</h2><ol class="how">' + l.how.map(x => '<li class="say" data-say="' + (n++) + '">' + R(x) + '</li>').join('') + '</ol>'
    + '<div class="row2"><button class="btn" data-a="another">' + ic('bulb') + 'Explain it another way</button></div><div class="alt" id="alt" hidden>' + R(l.alt || '') + '<div class="row2" style="margin-top:10px"><button class="btn sm" data-a="sayalt">' + ic('sound') + 'Read it to me</button></div></div>'
    + '<h2 class="h2">Worked example' + (l.ex.length > 1 ? 's' : '') + '</h2>';
  l.ex.forEach(e => { const [eh, nn] = exCard(e, n); h += eh; n = nn; });
  h += '<h2 class="h2">Traps</h2><ul class="traps say" data-say="' + (n++) + '">' + l.traps.map(t => '<li>' + R(t) + '</li>').join('') + '</ul>'
    + '<h2 class="h2">We do: two quick checks</h2><div id="wedo"></div>'
    + '<div class="cta"><button class="btn pri big" data-a="pskill" data-k="' + k + '">Practice to mastery</button><button class="btn big" data-a="quiz" data-k="' + k + '">Lesson quiz</button>' + (D.lessons[D.lessons.indexOf(l) + 1] ? '<button class="btn big" data-a="nav" data-to="lesson-' + D.lessons[D.lessons.indexOf(l) + 1].k + '">Next lesson' + ic('chev') + '</button>' : '') + '</div></div>';
  main.innerHTML = h;
  wedoStart();
}
function playerHTML() {
  const playing = Voice.isPlaying(), cur = LV && LV.i >= 0 ? LV.items[LV.i].label : 'Lesson walkthrough';
  return '<button class="btn sm pri" data-a="lplay">' + ic(playing ? 'pause' : 'play') + (playing ? 'Pause' : Voice.hasQueue() ? 'Resume' : 'Play lesson') + '</button><button class="btn sm" data-a="lprev" aria-label="Previous part">' + ic('prev') + '</button><button class="btn sm" data-a="lnext" aria-label="Next part">' + ic('next') + '</button><span class="lbl">' + esc(cur) + '</span><button class="btn sm" data-a="lrate">' + (S.set.voice.rate || 1) + '×</button>';
}
function lessonStep(i) {
  if (!LV) return;
  LV.i = i;
  $$('.say').forEach(el => el.classList.toggle('on', Number(el.dataset.say) === i));
  const el = $('.say[data-say="' + i + '"]');
  if (el) {
    if (el.hidden) { el.hidden = false; const c = el.closest('.ex'); if (c) { const left = c.querySelectorAll('.st[hidden]').length; const b = c.querySelector('[data-a=step]'); if (b) b.textContent = left ? 'Show next step' : 'All steps shown'; } }
    const r = el.getBoundingClientRect(); if (r.top < 120 || r.bottom > innerHeight - 90) el.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'});
  }
  const p = $('#player'); if (p) p.innerHTML = playerHTML();
}
function lessonPlay(from = 0) {
  if (!Voice.play(LV.items.slice(from), i => lessonStep(i), () => { lessonStep(-1); toast('Lesson done — try the two checks below.'); })) { toast('This device has no speech voice.'); return; }
  if (from === 0) { S.explore.listen++; save(); checkBadges(); }
}
// We do: two fresh questions inside the lesson, one at a time, with instant feedback
function wedoStart() {
  const k = LV.k, ts = TBYSK[k], easy = ts.filter(t => t.d === 1), mid = ts.filter(t => t.d === 2);
  const a = (easy.length ? rpk(easy) : rpk(ts)).id, b = (mid.length ? rpk(mid) : rpk(ts)).id;
  LV.we = {n: 0, items: [itemFromTpl(a), itemFromTpl(b)], done: 0};
  wedoShow();
}
function wedoShow() {
  const W = LV.we, box = $('#wedo'); if (!box) return;
  if (W.n >= 2) { box.innerHTML = '<section class="card"><p><b>' + W.done + ' of 2 right.</b> ' + (W.done === 2 ? 'Nice — now practice to mastery.' : 'Read the solution, then practice to mastery.') + '</p><button class="btn sm" data-a="wedoagain">Two more checks</button></section>'; RUN = null; return; }
  startQ(W.items[W.n]); RUN = WEDO;
  box.innerHTML = '<p class="meta">Check ' + (W.n + 1) + ' of 2</p>' + qBlock();
}
const WEDO = {answer(q) {
  const xp = recordAnswer({it: q.it, ok: q.g.ok, hints: q.hints, mode: 'wedo', ms: Date.now() - q.t0, g: q.g, typed: q.mode === 'type'});
  if (q.g.ok) LV.we.done++;
  const box = $('#wedo'); if (box) box.innerHTML = '<p class="meta">Check ' + (LV.we.n + 1) + ' of 2</p>' + qBlock() + fbHTML(q, xp) + '<div class="cta"><button class="btn pri" data-a="wedonext">' + (LV.we.n === 0 ? 'Next check' : 'Finish') + '</button></div>';
  if (S.set.autoRead && !q.g.ok) Voice.say([q.g.msg || '']);
}};
// Review sheet
function vSheet() {
  top('Review sheet', '', ['learn', 'Learn']); setTab('learn'); const got = Object.keys(S.sh).length;
  main.innerHTML = '<div class="wrap"><p class="lede">The 12 problems from your 4.3–4.5 review, worked step by step. Do each on paper first, then reveal a step at a time to check.</p><div class="row2" style="margin-bottom:14px">' + bar(100 * got / 12, 'g').replace('class="bar', 'style="flex:1" class="bar') + '<span class="num" id="gotn">' + got + ' / 12 confident</span></div>'
    + D.sheet.map(s => '<section class="card ex sh"><div class="exh"><span class="tag">#' + s.n + '</span><span class="meta" style="flex:1">' + R(s.dir) + '</span></div><div class="mb prob">' + disp(s.q) + '</div><div class="steps">' + s.s.map(x => '<div class="st" hidden>' + stepHTML(x) + '</div>').join('') + '</div><div class="ans" hidden><b>Answer</b>' + R(s.a) + '<p class="trap">' + ic('x') + '<span>' + R(s.trap) + '</span></p></div><div class="exbtn"><button class="btn pri" data-a="step">Show step 1 of ' + s.s.length + '</button><button class="btn" data-a="allsteps">Show all</button><button class="btn' + (S.sh[s.n] ? ' on' : '') + '" data-a="got" data-n="' + s.n + '">' + ic('check') + (S.sh[s.n] ? 'Got it' : 'I can do this') + '</button><button class="btn" data-a="sayex" data-n="' + s.n + '">' + ic('sound') + 'Read</button><button class="btn" data-a="nav" data-to="lesson-' + s.sk + '">Lesson</button></div></section>').join('') + '</div>';
}
Object.assign(ACT, {
  step: t => { const c = t.closest('.ex'), h = c.querySelector('.st[hidden]'); if (h) h.hidden = false; const all = c.querySelectorAll('.st').length, lf = c.querySelectorAll('.st[hidden]').length; if (!lf) { const a = c.querySelector('.ans'); if (a) a.hidden = false; c.querySelectorAll('[data-a=step],[data-a=allsteps]').forEach(b => { b.hidden = true; }); } else t.textContent = 'Show step ' + (all - lf + 1) + ' of ' + all; },
  allsteps: t => { const c = t.closest('.ex'); c.querySelectorAll('.st').forEach(s => { s.hidden = false; }); const a = c.querySelector('.ans'); if (a) a.hidden = false; c.querySelectorAll('[data-a=step],[data-a=allsteps]').forEach(b => { b.hidden = true; }); },
  got: t => { const n = t.dataset.n; if (S.sh[n]) delete S.sh[n]; else S.sh[n] = 1; save(); checkBadges(); const on = !!S.sh[n]; t.classList.toggle('on', on); t.innerHTML = ic('check') + (on ? 'Got it' : 'I can do this'); const g = $('#gotn'); if (g) g.textContent = Object.keys(S.sh).length + ' / 12 confident'; },
  sayex: t => { const s = D.sheet.find(x => x.n === Number(t.dataset.n)); if (!s) return; const parts = [s.dir, s.q]; s.s.forEach(x => { parts.push('$' + x[0] + '$'); if (x[1]) parts.push(x[1]); }); parts.push('Answer: ' + s.a); Voice.say(parts); },
  lplay: () => { if (Voice.isPlaying()) { Voice.pause(); } else if (Voice.hasQueue()) { Voice.resume(); } else lessonPlay(0); const p = $('#player'); if (p) p.innerHTML = playerHTML(); },
  lnext: () => { const i = Math.min(LV.items.length - 1, LV.i + 1); if (Voice.isPlaying()) { if (!Voice.jump(i)) lessonPlay(i); } else lessonStep(i); },
  lprev: () => { const i = Math.max(0, LV.i - 1); if (Voice.isPlaying()) { if (!Voice.jump(i)) lessonPlay(i); } else lessonStep(i); },
  lrate: () => { const r = [0.85, 1, 1.15], c = S.set.voice.rate || 1; S.set.voice.rate = r[(r.indexOf(c) + 1) % r.length] || 1; save(); const p = $('#player'); if (p) p.innerHTML = playerHTML(); },
  another: () => { const a = $('#alt'); if (a) { a.hidden = !a.hidden; if (!a.hidden) { S.explore.another++; save(); checkBadges(); } } },
  sayalt: () => Voice.say([LES[LV.k].alt || '']),
  wedonext: () => { LV.we.n++; wedoShow(); },
  wedoagain: () => wedoStart()
});
