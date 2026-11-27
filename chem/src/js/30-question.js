// ---------- Questions: fresh items from the templates and the concept bank; typed answers (keypad or keyboard) or choices
const CATN = {concept: 'Concept', procedure: 'Procedure', slip: 'Slip'};
const KPT = {num: 1, int: 1, chg: 1, coef: 1};   // typed on the keypad; formulas, names, configurations and symbols use the keyboard
const PH = {frm: 'Capitals start symbols; digits are subscripts', name: 'Type the name', cfg: 'Sublevels with spaces: 1s2 2s2 …', sym: 'One capital, then lowercase'};
const labHTML = s => esc(s).replace(/\b(?:[A-Z][a-z]?\d*){2,}\b|\b[A-Z][a-z]?\d+\b/g, m => ceHTML(m));
const hasKP = it => !!(it.fs && it.fs.some(fd => KPT[fd.t]));
const canType = it => it.k !== 'mc' && !!(it.fs && it.fs.length);

// The answer to every field as one line ("Protons: 26 · Neutrons: 30"), for choices, solutions and review
function fieldsText(it, pick) { return it.fs.map(fd => { const [v, sh] = pick(fd); return (it.fs.length > 1 ? fd.lab + ': ' : '') + ansTextF(fd, v, sh); }).join(' · '); }
function mcOf(it) {
  const out = [{t: fieldsText(it, fd => [fd.ans]), why: ''}];
  const add = (t, why, id, cat) => { if (t && !out.some(o => o.t === t)) out.push({t, why, id, cat}); };
  (it.traps || []).forEach(t => add(fieldsText(it, fd => fd.id === t.f ? [t.v, t.s] : [fd.ans]), t.why, t.id, t.cat));
  if (out.length < 4) {   // pad with honest, generic distractors when a template has few named traps
    const fd = it.fs.find(f => f.t === 'num' && f.ans) || it.fs.find(f => f.t === 'int');
    if (fd) {
      const alts = fd.t === 'num' ? [[fd.ans * 10, 'Off by a factor of 10: check a unit conversion or a power of ten.', 'power10'], [fd.ans / 10, 'Off by a factor of 10: check a unit conversion or a power of ten.', 'power10']]
        : [[fd.ans - 1, 'Off by one. Count again.', 'not_equal'], [fd.ans + 1, 'Off by one. Count again.', 'not_equal'], [fd.ans + 2, 'Not quite. Count again.', 'not_equal']];
      const cap = /^Group/.test(fd.lab) ? 18 : /^Period/.test(fd.lab) ? 7 : 1e9;
      for (const [v, why, id] of alts) { if (out.length >= 4) break; if (fd.t === 'int' && ((fd.ans >= 0 && v < 0) || (fd.ans >= 1 && v < 1) || v > cap)) continue; add(fieldsText(it, f => f === fd ? [v] : [f.ans]), why, id, 'procedure'); }
    }
  }
  return out.slice(0, 4);
}
function itemFromTpl(id, seed = rand32()) {
  const T = TPL[id], it = finishItem(T.make(rng(seed)));
  Object.assign(it, {src: 't', key: id, seed, s: T.s, d: T.d, word: !!T.wk, name: T.name});
  if (it.k !== 'mc') it.mc = mcOf(it);
  return it;
}
function itemFromBank(q) {
  const k = 1 + hashStr(q.id) % (q.c.length - 1);
  return {src: 'b', key: q.id, s: q.s, d: q.d, q: q.q, x: q.x, k: 'mc',
    h: [q.h, 'You can rule out “' + q.c[k] + '”: ' + q.w[k - 1]],
    mc: q.c.map((c, i) => ({t: c, why: i ? q.w[i - 1] : '', id: 'bank', cat: i ? 'concept' : null}))};
}

let Q = null;
function startQ(it, o = {}) {
  const mode = o.mc || S.set.style === 'mc' || !canType(it) ? 'mc' : 'type', f = {};
  (it.fs || []).forEach(fd => { f[fd.id] = fd.t === 'coef' ? fd.sp.map(() => '') : ''; });
  const first = (it.fs || []).find(fd => KPT[fd.t]) || (it.fs || [])[0];
  Q = {it, mode, f, focus: first ? first.id : null, cf: 0, done: false, g: null, hints: 0, t0: Date.now(), pick: null,
    perm: shuf(it.mc.map((_, i) => i)), test: !!o.test, fstep: o.frame && it.frame ? 0 : 9, fpick: null};
  return Q;
}
const curField = () => Q && Q.it.fs ? Q.it.fs.find(fd => fd.id === Q.focus) : null;
const hasText = q => (q.it.fs || []).some(fd => fd.t === 'coef' ? q.f[fd.id].some(x => x) : String(q.f[fd.id] || '').trim());
function pvOf(fd, v) {   // a live preview under a typed field, only when it shows something the raw text doesn't
  const t = String(v || '').trim(); if (!t || fd.t === 'coef' || fd.t === 'name' || fd.t === 'sym') return '';
  if (fd.t === 'num') { if (!parseNum(t)) return /\d/.test(t) && !/[×^]$/.test(t) ? '<span class="meta">Not a number yet</span>' : ''; return /[×eE^]/.test(t) ? '<span class="m">' + tex(texN(t.replace(/[xX*]/g, '×'))) + '</span>' : ''; }
  if (fd.t === 'int') return '';
  if (fd.t === 'chg') { const q = parseChg(t); return q === null ? '<span class="meta">Type a number and a sign, like 2+</span>' : q === 0 ? '<span class="meta">neutral</span>' : chgTxt(q) === t.replace(/-/g, '−') ? '' : '<span class="m">' + chgTxt(q) + '</span>'; }
  if (fd.t === 'cfg') return cfgHTML(t.replace(/\^/g, ''));
  return /[\d+\-^·.*()₀-₉⁰-⁹]/.test(t) ? ceHTML(normF(t)) : '';
}
function fieldHTML(fd) {
  const g = Q.g, lock = Q.done && !Q.test, st = lock && g ? (g.ok || (g.parts && g.parts[fd.id]) ? ' ok' : ' no') : '';
  const lab = '<div class="fl"><span>' + labHTML(fd.lab) + (fd.unit ? ' (' + esc(fd.unit) + ')' : '') + '</span></div>';
  if (fd.t === 'coef') return '<div class="fld coef' + st + '">' + lab + '<div class="eqn">' + fd.sp.map((sp, k) => (k ? '<span class="eqop">' + (k === fd.nr ? '→' : '+') + '</span>' : '') + '<span class="term"><button type="button" class="cbox' + (Q.focus === fd.id && Q.cf === k && !lock ? ' focus' : '') + '" data-a="cbox" data-f="' + fd.id + '" data-k="' + k + '" aria-label="Coefficient for ' + esc(sp) + '"' + (lock ? ' disabled' : '') + '>' + esc(Q.f[fd.id][k] || '') + '</button>' + ceHTML(sp) + '</span>').join('') + '</div>' + (lock ? '' : '<p class="meta">Tap a box and type its coefficient. An empty box counts as 1.</p>') + '</div>';
  if (KPT[fd.t]) return '<div class="fld' + (Q.focus === fd.id && !lock ? ' focus' : '') + st + '" data-a="fld" data-f="' + fd.id + '" role="textbox" aria-label="' + esc(fd.lab) + '">' + lab + '<div class="box"><span class="txt">' + esc(Q.f[fd.id]) + '</span><i class="caret"></i></div><div class="pv">' + pvOf(fd, Q.f[fd.id]) + '</div></div>';
  return '<label class="fld' + st + '">' + lab + '<input class="fin" data-f="' + fd.id + '" type="text" value="' + esc(Q.f[fd.id]) + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="' + esc(PH[fd.t] || '') + '"' + (lock ? ' disabled' : '') + '><div class="pv">' + pvOf(fd, Q.f[fd.id]) + '</div></label>';
}
const KEYS = ['7', '8', '9', '⌫', '4', '5', '6', 'C', '1', '2', '3', '−', '0', '.', 'E', '+'];
const KEYNAME = {'⌫': 'Delete', C: 'Clear', '−': 'Minus', '+': 'Plus', E: 'Times ten to the power', '.': 'Decimal point'};
function kpOK(k, fd) {   // keys that make sense for the focused field
  const t = fd ? fd.t : 'num';
  if (/^[0-9⌫C]$/.test(k)) return true;
  if (t === 'num') return k !== '+';
  if (t === 'int') return k === '−';
  if (t === 'chg') return k === '+' || k === '−';
  if (t === 'coef') return k === 'E';
  return k !== 'E';
}
function kpHTML() {
  const fd = curField(), coef = fd && fd.t === 'coef';
  return '<div class="kp" role="group" aria-label="Keypad">' + KEYS.map(k => '<button type="button" data-a="key" data-k="' + k + '" class="' + (/[0-9.]/.test(k) ? '' : k === '⌫' || k === 'C' ? 'fn' : 'op') + '"' + (kpOK(k, fd) ? '' : ' disabled') + ' aria-label="' + (k === 'E' && coef ? 'Next box' : KEYNAME[k] || k) + '">' + (k === 'E' ? (coef ? 'Next ›' : '×10<sup>n</sup>') : k === 'C' ? 'Clear' : k) + '</button>').join('') + '<button type="button" class="ck" data-a="qcheck">' + (Q.test ? 'Save answer' : 'Check') + '</button></div>';
}
function keyIn(k) {
  if (!Q || (Q.done && !Q.test) || Q.mode !== 'type') return;
  const fd = curField(); if (!fd) return;
  if (Q.test) Q.done = false;   // an edited test answer is saved again with Save answer (or graded at submit)
  if (fd.t === 'coef') {
    const a = Q.f[fd.id];
    if (k === 'E') Q.cf = (Q.cf + 1) % a.length;
    else if (k === '⌫') a[Q.cf] = a[Q.cf].slice(0, -1);
    else if (k === 'C') a[Q.cf] = '';
    else if (/^[0-9]$/.test(k) && a[Q.cf].length < 2) a[Q.cf] = (a[Q.cf] === '0' ? '' : a[Q.cf]) + k;
    refreshFields(); return;
  }
  let v = Q.f[fd.id] || '';
  if (k === '⌫') v = v.slice(0, -1);
  else if (k === 'C') v = '';
  else if (fd.t === 'num' && k === 'E') { if (!v.includes('×10^')) v = (v === '' || v === '-' ? v + '1' : v) + '×10^'; }
  else if ((fd.t === 'num' || fd.t === 'int') && k === '−') { const i = v.indexOf('×10^'); if (i >= 0) { const e = v.slice(i + 4); v = v.slice(0, i + 4) + (e[0] === '-' ? e.slice(1) : '-' + e); } else v = v[0] === '-' ? v.slice(1) : '-' + v; }
  else if (fd.t === 'chg' && (k === '+' || k === '−')) v = v.replace(/[+−-]/g, '') + (k === '+' ? '+' : '−');
  else if (k === '.' && fd.t === 'num' && /[.×]/.test(v)) return;
  else if (k === '+' && (fd.t === 'num' || fd.t === 'int')) return;
  else if (!/^[0-9.+−]$/.test(k)) return;
  else v += k === '−' ? '-' : k;
  if (v.length > 28) return;
  Q.f[fd.id] = v;
  if (!KPT[fd.t]) { const inp = $('.fin[data-f="' + fd.id + '"]'); if (inp) inp.value = v; }
  refreshFields();
}
function refreshFields() {
  if (!Q || !Q.it.fs) return;
  const lock = Q.done && !Q.test;
  Q.it.fs.forEach(fd => {
    if (fd.t === 'coef') { $$('.cbox[data-f="' + fd.id + '"]').forEach(b => { const k = +b.dataset.k; b.textContent = Q.f[fd.id][k] || ''; b.classList.toggle('focus', Q.focus === fd.id && Q.cf === k && !lock); }); return; }
    if (KPT[fd.t]) { const el = $('.fld[data-f="' + fd.id + '"]'); if (!el) return; el.querySelector('.txt').textContent = Q.f[fd.id]; el.querySelector('.pv').innerHTML = pvOf(fd, Q.f[fd.id]); el.classList.toggle('focus', Q.focus === fd.id && !lock); return; }
    const inp = $('.fin[data-f="' + fd.id + '"]'); if (inp) { const pv = inp.parentNode.querySelector('.pv'); if (pv) pv.innerHTML = pvOf(fd, Q.f[fd.id]); }
  });
  const kp = $('.kp'); if (kp) kp.outerHTML = kpHTML();
}
function hintsHTML(it, n) {
  if (!n) return '';
  let h = '<div class="hints">';
  if (n >= 1) h += '<div class="hint"><b>Hint 1.</b> ' + R(it.h[0]) + '</div>';
  if (n >= 2 && it.h[1]) h += '<div class="hint"><b>Hint 2' + (it.src === 'b' ? '' : ' — first step') + '.</b> ' + R(it.h[1]) + '</div>';
  if (n >= 3) h += '<div class="hint"><b>Full solution.</b><div class="steps">' + it.x.map(s => '<div class="st">' + stepHTML(s) + '</div>').join('') + '</div></div>';
  return h + '</div>';
}
function qHTML() {
  const it = Q.it, lock = Q.done && !Q.test;
  let h = '<div class="qmeta"><span class="tag">' + esc(SK[it.s].n) + '</span>' + dots(it.d || 1) + (it.src === 'b' ? '<span class="tag tw">Concept</span>' : it.fs && it.fs.some(f => f.t === 'num') ? '<span class="tag fresh">Fresh numbers</span>' : '') + (it.word && SES && SES.kind === 'workshop' ? '<span class="tag word">Workshop</span>' : '') + '<span class="qbtns"><button class="spk" data-a="ptable" aria-label="Open the periodic table">' + ic('grid') + '</button><button class="spk" data-a="sayq" aria-label="Read the question aloud">' + ic('sound') + '</button></span></div><div class="prompt">' + R(it.q) + '</div>';
  if (Q.fstep === 0) {   // workshop: choose the right relationship first
    const order = Q.fperm || (Q.fperm = shuf(it.frame.opts.map((_, i) => i)));
    h += '<p><b>Step 1.</b> ' + R(it.frame.q) + '</p><div class="choices">' + order.map((i, k) => '<button class="ch' + (Q.fpick === i ? (i === 0 ? ' ok' : ' no') : '') + '" data-a="fpick" data-i="' + i + '"><span class="lt">' + 'ABCD'[k] + '</span><span class="ct"><span class="m">' + tex(it.frame.opts[i]) + '</span></span></button>').join('') + '</div>' + (Q.fpick !== null && Q.fpick !== 0 ? '<p class="trap">' + ic('x') + '<span>Not that one. Look at what the question gives you, what stays the same, and what it asks for. Try again.</span></p>' : '');
    return h;
  }
  if (Q.mode === 'type') {
    h += (it.frame && Q.fpick === 0 ? '<p class="meta">Model: <span class="m">' + tex(it.frame.opts[0]) + '</span></p>' : '') + it.fs.map(fieldHTML).join('');
    if (!hasKP(it) && !lock) h += '<div class="cta"><button class="btn pri big" data-a="qcheck">' + (Q.test ? 'Save answer' : 'Check') + '</button></div>';
  } else {
    h += '<div class="choices">' + Q.perm.map((ci, k) => { let cls = ''; if (lock) cls = ci === 0 ? 'ok' : ci === Q.pick ? 'no' : 'dim'; else if (Q.pick === ci) cls = 'sel'; return '<button class="ch ' + cls + '" data-a="' + (lock ? '' : 'pick') + '" data-ci="' + ci + '"' + (lock ? ' disabled' : '') + '><span class="lt">' + 'ABCD'[k] + '</span><span class="ct">' + R(it.mc[ci].t) + '</span></button>'; }).join('') + '</div>';
  }
  if (!Q.done && !Q.test) h += '<div class="qtools">' + (Q.hints < 3 ? '<button class="btn sm" data-a="hint">' + ic('bulb') + (Q.hints === 0 ? 'Hint' : Q.hints === 1 ? (it.src === 'b' ? 'Hint 2' : 'Hint 2: first step') : 'Show full solution') + '</button>' : '') + (Q.mode === 'type' ? '<button class="btn sm" data-a="tomc">Show choices instead</button>' : canType(it) ? '<button class="btn sm" data-a="totype">Type it instead</button>' : '') + '</div>' + hintsHTML(it, Q.hints);
  return h;
}
function qBlock() {   // the card plus the keypad column
  const typ = Q.mode === 'type' && (!Q.done || Q.test) && Q.fstep !== 0 && hasKP(Q.it);
  return '<div class="qwrap' + (typ ? ' typ' : '') + '"><section class="card qcard">' + qHTML() + '</section>' + (typ ? '<div class="kpcol">' + kpHTML() + '</div>' : '') + '</div>';
}
function whyHTML(it, picked, typed) {
  const others = it.mc.map((m, i) => i).filter(i => i && i !== picked && it.mc[i].why);
  return others.length ? '<details class="why"><summary>' + (typed ? 'Common wrong answers, and why' : 'Why the other choices are wrong') + '</summary><ul>' + others.map(i => '<li><span class="wc">' + R(it.mc[i].t) + '</span><span>' + R(it.mc[i].why) + '</span></li>').join('') + '</ul></details>' : '';
}
function yourAns(q) {
  const it = q.it;
  if (q.mode === 'mc') return q.pick === null || q.pick === undefined ? 'Not answered' : R(it.mc[q.pick].t);
  const parts = it.fs.map(fd => {
    const v = q.f[fd.id];
    if (fd.t === 'coef') return v.some(x => x) ? R(eqText(fd, v.map(x => +x || 1))) : '';
    const t = String(v || '').trim(); if (!t) return '';
    return (it.fs.length > 1 ? esc(fd.lab) + ': ' : '') + (fd.t === 'name' || fd.t === 'int' ? esc(t.replace(/-/g, '−')) : fd.t === 'chg' ? (parseChg(t) === null ? esc(t) : chgTxt(parseChg(t))) : fd.t === 'num' ? (parseNum(t) ? '<span class="m">' + tex(texN(t.replace(/[xX*]/g, '×'))) + '</span>' : esc(t)) + (fd.unit ? ' ' + esc(fd.unit) : '') : fd.t === 'sym' ? esc(t) : pvOf(fd, t) || esc(t));
  }).filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Not answered';
}
function solHTML(it) { return '<h3>Solution</h3><div class="steps">' + it.x.map(s => '<div class="st">' + stepHTML(s) + '</div>').join('') + '</div><div class="ans"><b>Answer</b>' + R(it.mc[0].t) + '</div>'; }
function fbHTML(q, xp) {
  const it = q.it, g = q.g;
  return '<section class="fb ' + (g.ok ? 'ok' : 'no') + '" id="fb"><div class="fbh">' + ic(g.ok ? 'check' : 'x') + '<b>' + (g.ok ? (q.hints ? 'Correct, with hints' : 'Correct') : 'Not quite') + '</b>' + (!g.ok && g.cat ? '<span class="cat">' + CATN[g.cat] + '</span>' : '') + (xp ? '<span class="xp">+' + xp + ' XP</span>' : '') + '<button class="spk" data-a="sayfb" aria-label="Read the feedback aloud">' + ic('sound') + '</button></div>' + (g.ok ? (g.note ? '<p>' + R(g.note) + '</p>' : '') : '<p>' + R(g.msg || '') + '</p><p class="meta">Your answer: ' + yourAns(q) + '</p>') + '</section>'
    + '<section class="card">' + solHTML(it) + whyHTML(it, q.mode === 'mc' ? q.pick : -1, q.mode !== 'mc') + '</section>';
}
function gradeTyped(q) { const g = gradeFields(q.it, q.f); return g.bad ? {ok: false, msg: g.msg, id: 'unreadable', cat: 'slip', parts: {}} : g; }
function gradeMC(it, i) { return i === 0 ? {ok: true} : {ok: false, msg: it.mc[i].why, id: it.mc[i].id || 'trap', cat: it.mc[i].cat || 'procedure'}; }
// Answer actions call the active runner's answer(Q) once the question is graded
let RUN = null;
function qCheck() {
  if (!Q || Q.done) return;
  if (Q.mode === 'type') {
    const g = gradeFields(Q.it, Q.f);
    if (g.bad && !Q.test) { toast(g.msg); if (g.part && g.part !== Q.focus) { Q.focus = g.part; refreshFields(); } return; }
    if (Q.test && !hasText(Q)) { toast('Type an answer first (or skip with Next).'); return; }
    Q.g = g.bad ? {ok: false, msg: g.msg, id: 'unreadable', cat: 'slip', parts: {}} : g;
  } else {
    if (Q.pick === null) { toast('Choose an answer.'); return; }
    Q.g = gradeMC(Q.it, Q.pick);
  }
  Q.done = true; if (!Q.test) beep(Q.g.ok);
  RUN && RUN.answer(Q);
}
function readQ() { const it = Q.it; let t = it.q; if (Q.mode === 'mc') t += ' Choices: ' + Q.perm.map((ci, k) => 'ABCD'[k] + '. ' + it.mc[ci].t).join('. '); Voice.say([t]); }
