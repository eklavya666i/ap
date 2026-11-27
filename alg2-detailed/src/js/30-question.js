// ---------- Questions: one shape for fresh-number items and the 131 classic ones; typed answers with a keypad, or choices
const CATN = {concept: 'Concept', procedure: 'Procedure', slip: 'Slip'};
const catOf = w => { w = String(w || ''); return /sign|opposite/i.test(w) ? 'slip' : /restrict|exclud|extraneous|cancel|only factors|denominator|divisor|never add|flip|series/i.test(w) ? 'concept' : 'procedure'; };
function ansText(it, a) {
  switch (it.k) {
    case 'er': return ML(a.e) + ', ' + (a.v && a.v.length ? '$' + NE(a.v) + '$' : 'no excluded values');
    case 'e': case 'f': return ML(a.e);
    case 'v': return a.v && a.v.length ? '$' + NE(a.v) + '$' : 'None';
    case 's': return a.v && a.v.length ? a.v.map(v => '$x=' + VT(v) + '$').join(' or ') : 'No solution';
    case 'p': return a.p && a.p.length ? a.p.map(p => '$(' + VT(p[0]) + ',\\ ' + VT(p[1]) + ')$').join(' and ') : 'No solution';
    case 'n': return '$' + a.n + '$' + (it.ans.unit ? ' ' + it.ans.unit : '');
  }
  return '';
}
function mcOf(it) {
  const out = [{t: ansText(it, {e: it.ans.e, v: it.k === 'er' ? it.rz : it.ans.v, p: it.ans.p, n: it.ans.n}), why: ''}];
  (it.traps || []).forEach(t => { const tt = ansText(it, {e: t.e, v: it.k === 'er' ? (t.v || it.rz) : t.v, p: t.p, n: t.n !== undefined ? nice(Number(t.n)) : undefined}); if (!out.some(o => o.t === tt)) out.push({t: tt, why: t.why, id: t.id, cat: t.cat}); });
  return out.slice(0, 4);
}
function itemFromTpl(id, seed = rand32()) {
  const T = TPL[id], it = T.make(rng(seed));
  Object.assign(it, {src: 't', key: id, seed, s: T.s, d: T.d, word: !!T.word, name: T.name});
  it.mc = mcOf(it);
  return it;
}
function itemFromBank(q) {
  const f = q.x[0] || ['', ''];
  const it = {src: 'b', key: q.id, s: q.s, d: q.d, q: q.q, tw: q.tw, x: q.x, k: 'mc',
    h: [q.h, f[0] ? 'First step: $' + f[0] + '$' + (f[1] ? ' — ' + f[1] : '') : f[1]],
    mc: q.c.map((c, i) => ({t: c, why: i ? q.w[i - 1] : '', id: 'bank', cat: i ? catOf(q.w[i - 1]) : null}))};
  if (q.ta) Object.assign(it, q.ta);
  return it;
}
const canType = it => !!it.k && it.k !== 'mc' && (!it.ans || !it.ans.e || !/[a-wyz]/i.test(String(it.ans.e).replace(/sqrt/g, '')));
const FIELDS = {er: [['e', 'Simplified form'], ['v', 'Excluded values: x ≠', 'None']], e: [['e', 'Answer']], f: [['e', 'Factored form']], v: [['v', 'Excluded values: x ≠', 'None']],
  s: [['v', 'Solutions: x =', 'No solution']], p: [['v', 'Points (x, y)', 'No solution']], n: [['v', 'Answer']]};

let Q = null;
function startQ(it, o = {}) {
  const mode = o.mc || S.set.style === 'mc' || !canType(it) ? 'mc' : 'type';
  Q = {it, mode, f: {e: '', v: ''}, focus: FIELDS[it.k] ? FIELDS[it.k][0][0] : 'e', done: false, g: null, hints: 0, t0: Date.now(), pick: null,
    perm: shuf(it.mc.map((_, i) => i)), test: !!o.test, fstep: o.frame && it.frame ? 0 : 9, fpick: null};
  return Q;
}
function previewOf(it, f, txt) {
  if (!txt) return '';
  if (txt === '∅') return '<b>' + (it.k === 'er' || it.k === 'v' ? 'None' : 'No solution') + '</b>';
  try {
    if (f === 'e') return '<span class="m">' + tex(EX.toTeX(txt)) + '</span>';
    if (it.k === 'p') return '<span class="m">' + tex(EX.pairs(txt).map(p => '(' + fmtV(p[0]) + ',\\ ' + fmtV(p[1]) + ')').join(',\\ ')) + '</span>';
    if (it.k === 'n') return '<span class="m">' + tex(fmtV(EX.val(txt))) + '</span>' + (it.ans.unit ? ' ' + it.ans.unit : '');
    const v = EX.vals(txt); return '<span class="m">' + tex((it.k === 's' ? 'x=' : 'x\\ne ') + v.map(fmtV).join(',\\ ')) + '</span>';
  } catch (e) { return ''; }
}
function fieldHTML(it, [f, label, quick]) {
  const txt = Q.f[f], g = Q.g, lock = Q.done && !Q.test;
  const cls = 'fld' + (Q.focus === f && !Q.done ? ' focus' : '') + (lock && g ? (g.ok || (g.part && g.part !== 'both' && g.part !== f) ? ' ok' : ' no') : '');
  return '<div class="' + cls + '" data-a="fld" data-f="' + f + '" role="textbox" aria-label="' + esc(label) + '"><div class="fl"><span>' + esc(label) + (it.k === 'n' && it.ans.unit ? ' (' + esc(it.ans.unit) + ')' : '') + '</span>' + (quick && !Q.done ? '<button type="button" class="quick" data-a="quick" data-f="' + f + '">' + quick + '</button>' : '') + '</div><div class="box"><span class="txt">' + esc(txt === '∅' ? '' : txt) + '</span><i class="caret"></i></div><div class="pv">' + previewOf(it, f, txt) + '</div></div>';
}
const KEYS = ['7', '8', '9', '(', ')', '4', '5', '6', 'x', '^', '1', '2', '3', '+', '−', '0', '.', ',', '×', '÷', '±', '√', 'x²', '⌫', 'C'];
const KEYNAME = {'⌫': 'Delete', C: 'Clear', '^': 'Power', '√': 'Square root', '±': 'Plus or minus', '×': 'Times', '÷': 'Divide', '−': 'Minus', 'x²': 'Squared'};
const KEYMAP = {'−': '-', '×': '*', '÷': '/', 'x²': '^2'};
const kpHTML = () => '<div class="kp" role="group" aria-label="Keypad">' + KEYS.map(k => '<button type="button" data-a="key" data-k="' + k + '" class="' + (/[0-9.]/.test(k) ? '' : k === '⌫' || k === 'C' ? 'fn' : 'op') + '" aria-label="' + (KEYNAME[k] || k) + '">' + (k === 'C' ? 'Clear' : k === 'x²' ? '<i>x</i><sup>2</sup>' : k === 'x' ? '<i>x</i>' : k) + '</button>').join('') + '<button type="button" class="ck" data-a="qcheck">' + (Q.test ? 'Save answer' : 'Check') + '</button></div>';
function keyIn(k) {
  if (!Q || Q.done || Q.mode !== 'type') return;
  const f = Q.focus; let v = Q.f[f] === '∅' ? '' : Q.f[f];
  if (k === '⌫') v = v.slice(0, -1); else if (k === 'C') v = ''; else v += KEYMAP[k] || k;
  Q.f[f] = v; refreshFields();
}
function refreshFields() {
  if (!Q) return;
  $$('.fld').forEach(el => { const f = el.dataset.f, t = el.querySelector('.txt'), pv = el.querySelector('.pv'); if (t) t.textContent = Q.f[f] === '∅' ? '' : Q.f[f]; if (pv) pv.innerHTML = previewOf(Q.it, f, Q.f[f]); el.classList.toggle('focus', Q.focus === f && !Q.done); });
}
function hintsHTML(it, n) {
  if (!n) return '';
  let h = '<div class="hints">';
  if (n >= 1) h += '<div class="hint"><b>Hint 1.</b> ' + R(it.h[0]) + '</div>';
  if (n >= 2 && it.h[1]) h += '<div class="hint"><b>Hint 2 — first step.</b> ' + R(it.h[1]) + '</div>';
  if (n >= 3) h += '<div class="hint"><b>Full solution.</b><div class="steps">' + it.x.map(s => '<div class="st">' + stepHTML(s) + '</div>').join('') + '</div></div>';
  return h + '</div>';
}
function qHTML(o = {}) {
  const it = Q.it, lock = Q.done && !Q.test;
  let h = '<div class="qmeta"><span class="tag">' + SK[it.s].n + '</span>' + dots(it.d || 1) + (it.src === 't' ? '<span class="tag fresh">Fresh numbers</span>' : '') + (it.word ? '<span class="tag word">Word problem</span>' : '') + (it.tw ? '<span class="tag tw">Twin of Sheet #' + it.tw + '</span>' : '') + '<button class="spk" data-a="sayq" aria-label="Read the question aloud">' + ic('sound') + '</button></div><div class="prompt">' + R(it.q) + '</div>';
  if (Q.fstep === 0) {   // workshop frame: choose the model first
    const opts = it.frame.opts.map((t, i) => ({t, i})), order = Q.fperm || (Q.fperm = shuf(opts.map(o => o.i)));
    h += '<p><b>Step 1.</b> ' + R(it.frame.q) + '</p><div class="choices">' + order.map((i, k) => '<button class="ch' + (Q.fpick === i ? (i === 0 ? ' ok' : ' no') : '') + '" data-a="fpick" data-i="' + i + '"><span class="lt">' + 'ABC'[k] + '</span><span class="ct"><span class="m">' + tex(it.frame.opts[i]) + '</span></span></button>').join('') + '</div>' + (Q.fpick !== null && Q.fpick !== 0 ? '<p class="trap">' + ic('x') + '<span>Not that one — think about what adds. Try again.</span></p>' : '');
    return h;
  }
  if (Q.mode === 'type') {
    h += (it.frame && Q.fpick === 0 ? '<p class="meta">Model: <span class="m">' + tex(it.frame.opts[0]) + '</span></p>' : '') + (FIELDS[it.k] || []).map(fd => fieldHTML(it, fd)).join('');
    if (lock) { const shown = Object.values(Q.f).filter(Boolean).length; if (shown && !Q.g.ok) h += ''; }
  } else {
    h += '<div class="choices">' + Q.perm.map((ci, k) => { let cls = ''; if (lock) cls = ci === 0 ? 'ok' : ci === Q.pick ? 'no' : 'dim'; else if (Q.pick === ci) cls = 'sel'; return '<button class="ch ' + cls + '" data-a="' + (lock ? '' : 'pick') + '" data-ci="' + ci + '"' + (lock ? ' disabled' : '') + '><span class="lt">' + 'ABCD'[k] + '</span><span class="ct">' + R(it.mc[ci].t) + '</span></button>'; }).join('') + '</div>';
  }
  if (!Q.done && !Q.test) h += '<div class="qtools">' + (Q.hints < 3 ? '<button class="btn sm" data-a="hint">' + ic('bulb') + (Q.hints === 0 ? 'Hint' : Q.hints === 1 ? 'Hint 2: first step' : 'Show full solution') + '</button>' : '') + (Q.mode === 'type' ? '<button class="btn sm" data-a="tomc">Show choices instead</button>' : canType(it) ? '<button class="btn sm" data-a="totype">Type it instead</button>' : '') + '</div>' + hintsHTML(it, Q.hints);
  return h;
}
function qBlock(o = {}) {   // the card plus the keypad column
  const typ = Q.mode === 'type' && !Q.done && Q.fstep !== 0;
  return '<div class="qwrap' + (typ ? ' typ' : '') + '"><section class="card qcard">' + qHTML(o) + '</section>' + (typ ? '<div class="kpcol">' + kpHTML() + '</div>' : '') + '</div>';
}
function whyHTML(it, picked, typed) {
  const others = it.mc.map((m, i) => i).filter(i => i && i !== picked && it.mc[i].why);
  return others.length ? '<details class="why"><summary>' + (typed ? 'Common wrong answers, and why' : 'Why the other choices are wrong') + '</summary><ul>' + others.map(i => '<li><span class="wc">' + R(it.mc[i].t) + '</span><span>' + R(it.mc[i].why) + '</span></li>').join('') + '</ul></details>' : '';
}
function yourAns(Q) {
  const it = Q.it;
  if (Q.mode === 'mc') return Q.pick === null || Q.pick === undefined ? 'Not answered' : R(it.mc[Q.pick].t);
  const parts = (FIELDS[it.k] || []).map(([f]) => Q.f[f] ? previewOf(it, f, Q.f[f]) || esc(Q.f[f]) : '').filter(Boolean);
  return parts.length ? parts.join(', ') : 'Not answered';
}
function solHTML(it) { return '<h3>Solution</h3><div class="steps">' + it.x.map(s => '<div class="st">' + stepHTML(s) + '</div>').join('') + '</div><div class="ans"><b>Answer</b>' + R(it.mc[0].t) + '</div>'; }
function fbHTML(Q, xp) {
  const it = Q.it, g = Q.g;
  return '<section class="fb ' + (g.ok ? 'ok' : 'no') + '" id="fb"><div class="fbh">' + ic(g.ok ? 'check' : 'x') + '<b>' + (g.ok ? (Q.hints ? 'Correct, with hints' : 'Correct') : 'Not quite') + '</b>' + (!g.ok && g.cat ? '<span class="cat">' + CATN[g.cat] + '</span>' : '') + (xp ? '<span class="xp">+' + xp + ' XP</span>' : '') + '<button class="spk" data-a="sayfb" aria-label="Read the feedback aloud">' + ic('sound') + '</button></div>' + (g.ok ? '' : '<p>' + R(g.msg || '') + '</p><p class="meta">Your answer: ' + yourAns(Q) + '</p>') + '</section>'
    + '<section class="card">' + solHTML(it) + whyHTML(it, Q.mode === 'mc' ? Q.pick : -1, Q.mode !== 'mc') + '</section>';
}
function gradeTyped(it, f) {
  switch (it.k) {
    case 'er': { const a = gradeExpr(f.e, it.ans.e, it.traps); if (a.bad) return a; const b = gradeRestr(f.v, it); if (b.bad) return b; if (!a.ok && !b.ok) return Object.assign({}, a, {msg: a.msg + ' Also, check the excluded values.', part: 'both'}); if (!a.ok) return Object.assign(a, {part: 'e'}); if (!b.ok) return Object.assign(b, {part: 'v'}); return {ok: true}; }
    case 'e': return gradeExpr(f.e, it.ans.e, it.traps);
    case 'f': return gradeExpr(f.e, it.ans.e, it.traps, {factor: 1});
    case 'v': return gradeVals(f.v, it);
    case 's': return gradeSol(f.v, it);
    case 'p': return gradePairs(f.v, it);
    case 'n': return gradeNum(f.v, it);
  }
  return {ok: false, msg: '', bad: 1};
}
function gradeMC(it, i) { return i === 0 ? {ok: true} : {ok: false, msg: it.mc[i].why, id: it.mc[i].id || 'trap', cat: it.mc[i].cat || catOf(it.mc[i].why)}; }
// Answer actions call the active runner's answer(Q) once the question is graded
let RUN = null;
function qCheck() {
  if (!Q || Q.done) return;
  if (Q.mode === 'type') {
    const g = gradeTyped(Q.it, Q.f);
    if (g.bad && !Q.test) { toast(g.msg); return; }
    if (Q.test) { const blank = (FIELDS[Q.it.k] || []).every(([f]) => !Q.f[f]); if (blank) { toast('Type an answer first (or skip with Next).'); return; } }
    Q.g = g.bad ? {ok: false, msg: g.msg, id: g.id, cat: g.cat} : g;
  } else {
    if (Q.pick === null) { toast('Choose an answer.'); return; }
    Q.g = gradeMC(Q.it, Q.pick);
  }
  Q.done = true; if (!Q.test) beep(Q.g.ok);
  RUN && RUN.answer(Q);
}
function readQ() { const it = Q.it; let t = it.q; if (Q.mode === 'mc') t += ' Choices: ' + Q.perm.map((ci, k) => 'ABCD'[k] + '. ' + it.mc[ci].t).join('. '); Voice.say([t]); }
