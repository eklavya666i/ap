// ---------- Core: data, saved progress, math and formula renderer, days and streaks, XP, quests, badges, mastery and reviews
const KEY = 'chem.v1';
const ACT = {};   // tap actions by data-a name; each module adds its own
const SK = {}, BYSK = {}, BANK = {}, LES = {};
D.skills.forEach(s => { SK[s.k] = s; BYSK[s.k] = []; });
D.qs.forEach(q => { BYSK[q.s].push(q); BANK[q.id] = q; });
D.lessons.forEach(l => { LES[l.k] = l; });
const SKILLS = D.skills.map(s => s.k);
const UNIT = {}, UNITS = {}; D.units.forEach(u => { UNITS[u.n] = u; u.ks.forEach(k => { UNIT[k] = u.n; }); });
const SEMK = sem => SKILLS.filter(k => (UNIT[k] <= 5) === (sem === 'A'));
const TBYSK = {}; SKILLS.forEach(k => { TBYSK[k] = TPLS.filter(t => t.s === k); });

const fresh = () => ({v: 1, name: '', xp: 0, coins: 0, coinRem: 0, days: {}, L: {}, att: [], mist: {}, fixed: 0, badges: {}, pbs: {}, tests: [], sh: {}, ls: {},
  explore: {another: 0, listen: 0, typed: 0, workshop: 0, ladder: 0, ref: 0}, streak: {freezes: 0, used: [], lastRun: 0}, boss: 0, bk: null, seenB: {}, run: 0, best: 0,
  set: {style: 'type', voice: {uri: null, rate: 1}, autoRead: false, sound: true, calm: false, timer: 'always', speed: true, pin: null, rest: []}, upd: 0});
let S = fresh();
function loadState(j) { const f = fresh(); return Object.assign(f, j, {set: Object.assign(f.set, j.set || {}), explore: Object.assign(f.explore, j.explore || {}), streak: Object.assign(f.streak, j.streak || {})}); }
try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.v === 1) S = loadState(j); } catch (e) {}
function save() { S.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rand32 = () => (Math.random() * 4294967296) >>> 0;
const sum = a => a.reduce((x, y) => x + y, 0);
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* ---------- math renderer: \f{a}{b}, ^, _, \ne, \pm, \sqrt, \text, \left( \right), Greek letters, \ce{formula}, \cfg{configuration} ---------- */
const SYMS = {ne: '≠', pm: '±', mp: '∓', cdot: '·', div: '÷', times: '×', le: '≤', ge: '≥', approx: '≈', Rightarrow: '⇒', to: '→', rightleftharpoons: '⇌', ldots: '…', cdots: '⋯', infty: '∞'};
const GREEK = {lambda: 'λ', nu: 'ν', mu: 'μ', alpha: 'α', beta: 'β', gamma: 'γ', pi: 'π', theta: 'θ', chi: 'χ', Delta: 'Δ', Sigma: 'Σ'};
const txSub = s => s.replace(/_\{([^}]*)\}|_(\d+)/g, (m, a, b) => '<sub>' + (a || b) + '</sub>').replace(/\^\{([^}]*)\}|\^(\d*[+\-−])/g, (m, a, b) => '<sup>' + (a || b).replace(/-/g, '−') + '</sup>');
const RELS = '=≠≤≥≈⇒→<>', BINS = '+−±∓·÷×';
function tex(src) {
  let i = 0, prev = false; const n = src.length;
  const atEnd = e => e === '}' ? src[i] === '}' : e === 'R' ? src.startsWith('\\right', i) : false;
  function seq(e) { let h = ''; const s = prev; prev = false; while (i < n && !atEnd(e)) h += atom(); prev = s; return h; }
  function grp() { while (src[i] === ' ') i++; if (src[i] === '{') { i++; const h = seq('}'); i++; return h; } if (src[i] === '\\') { const s = prev; const h = atom(); prev = s; return h; } const c = src[i++] || ''; return /[A-Za-z]/.test(c) ? '<i>' + c + '</i>' : c === '-' ? '−' : esc(c); }
  function op(s) { const cls = RELS.includes(s) ? 'rel' : BINS.includes(s) ? (prev ? 'bin' : 'un') : 'un'; prev = false; return '<span class="' + cls + '">' + s + '</span>'; }
  function atom() {
    const c = src[i];
    if (c === ' ') { i++; return ''; }
    if (c === '\\') {
      i++; const d = src[i];
      if (d === ',' || d === ';' || d === ' ' || d === '!') { i++; return d === '!' ? '' : '<span class="s' + (d === ',' ? 1 : 2) + '"></span>'; }
      if (d === '%') { i++; return '%'; }
      let j = i; while (j < n && /[A-Za-z]/.test(src[j])) j++;
      const cmd = src.slice(i, j); i = j;
      if (cmd === 'f' || cmd === 'frac') { const a = grp(), b = grp(); prev = true; return '<span class="fr"><span class="nu">' + a + '</span><span class="de">' + b + '</span></span>'; }
      if (cmd === 'sqrt') { const a = grp(); prev = true; return '<span class="sq">√<span class="sqa">' + a + '</span></span>'; }
      if (cmd === 'text' || cmd === 'ce' || cmd === 'cfg') { while (src[i] === ' ') i++; const s0 = i + 1; let dep = 1; i++; while (i < n && dep) { if (src[i] === '{') dep++; else if (src[i] === '}') dep--; i++; } prev = true; const inner = src.slice(s0, i - 1); return cmd === 'ce' ? ceHTML(inner) : cmd === 'cfg' ? cfgHTML(inner) : '<span class="tx">' + txSub(esc(inner)) + '</span>'; }
      if (GREEK[cmd]) { prev = true; return /^[A-Z]/.test(cmd) ? '<span class="tx">' + GREEK[cmd] + '</span>' : '<i>' + GREEK[cmd] + '</i>'; }
      if (cmd === 'log' || cmd === 'ln') { prev = false; return '<span class="tx">' + cmd + '</span><span class="s1"></span>'; }
      if (cmd === 'circ') { prev = true; return '°'; }
      if (cmd === 'left') { const o = src[i++]; const inner = seq('R'); i += 6; const cl = src[i++] || ''; prev = true; return inner.includes('class="fr"') ? '<span class="lr"><span class="dl">' + o + '</span>' + inner + '<span class="dl">' + cl + '</span></span>' : o + inner + cl; }
      if (cmd === 'quad') return '<span class="s3"></span>';
      if (SYMS[cmd]) return op(SYMS[cmd]);
      prev = true; return '<span class="tx">' + esc(cmd) + '</span>';
    }
    if (c === '^' || c === '_') { i++; const a = grp(); prev = true; return c === '^' ? '<sup>' + a + '</sup>' : '<sub>' + a + '</sub>'; }
    if (c === '{') { i++; const h = seq('}'); i++; prev = true; return h; }
    i++;
    if (c === '-') return op('−');
    if ('+=<>'.includes(c)) return op(c);
    if (c === ',' || c === ';') { prev = false; return c + '<span class="s2"></span>'; }
    if (c === '(' || c === '[') { prev = false; return c; }
    if (c === ')' || c === ']') { prev = true; return c; }
    if (/[A-Za-z]/.test(c)) { prev = true; return '<i>' + c + '</i>'; }
    prev = true; return esc(c);
  }
  let h = '<span class="nb">'; prev = false;
  while (i < n) { const a = atom(); h += a; if (a.indexOf('<span class="rel">') === 0 || a.charAt(0) === ',') h += '</span><wbr><span class="nb">'; }
  return h + '</span>';
}
const R = s => s ? String(s).split('$').map((p, k) => k % 2 ? '<span class="m">' + tex(p) + '</span>' : chemText(p)).join('') : '';
const disp = s => String(s).includes('$') ? R(s) : '<span class="m">' + tex(s) + '</span>';
const stepHTML = s => (s[0] ? '<div class="mb"><span class="m">' + tex(s[0]) + '</span></div>' : '') + (s[1] ? '<p class="stx">' + R(s[1]) + '</p>' : '');

/* ---------- small UI helpers ---------- */
const ICON = {chev: '<path d="M9 6l6 6-6 6"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  flag: '<path d="M6 21V3.5"/><path d="M6 4l11 3.8L6 11.6"/>', flag2: '<path d="M6 21V4h11l-2.5 4L17 12H6"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  book: '<path d="M3 5.5c3-1.3 6-1.1 9 .8 3-1.9 6-2.1 9-.8v13c-3-1.3-6-1.1-9 .8-3-1.9-6-2.1-9-.8z"/><path d="M12 6.3v13"/>',
  pencil: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5z"/><path d="M13.5 7l3.5 3.5"/>', bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  clock: '<circle cx="12" cy="12.5" r="8"/><path d="M12 8v4.5l3 2"/>', sheet: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.5 2.6-5.6 3.7-8.8.9 1.6 1.4 2.9 1.4 4.3 1.2-.6 2.4-2.6 2.6-5.3 3 2.4 5.3 5.8 5.3 9.8 0 3.6-2.5 6.2-6.5 6.2z"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.8c.4-1 1.4-1.6 2.5-1.6 1.5 0 2.6.8 2.6 2s-1 1.6-2.6 1.9c-1.6.3-2.6.8-2.6 2s1.1 2 2.6 2c1.1 0 2.1-.6 2.5-1.6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.5 19.7l1.2-6.1L3.2 9.4l6.1-.8z"/>', heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', pause: '<path d="M7 4.5v15M17 4.5v15"/>', prev: '<path d="M18 5l-9 7 9 7zM6 5v14"/>', next: '<path d="M6 5l9 7-9 7zM18 5v14"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  wrench: '<path d="M14.5 5.5a4.5 4.5 0 0 0 5.6 5.6L12 19.2a2 2 0 0 1-2.8-2.8l8.1-8.1"/><path d="M14.5 5.5l3 3"/>', save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  grid: '<rect x="3" y="4" width="4" height="4" rx=".6"/><rect x="17" y="4" width="4" height="4" rx=".6"/><rect x="3" y="10" width="4" height="4" rx=".6"/><rect x="10" y="10" width="4" height="4" rx=".6"/><rect x="17" y="10" width="4" height="4" rx=".6"/><rect x="3" y="16" width="4" height="4" rx=".6"/><rect x="10" y="16" width="4" height="4" rx=".6"/><rect x="17" y="16" width="4" height="4" rx=".6"/>',
  flask: '<path d="M9.5 3h5M10.5 3v6L5 19a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 19l-5.5-10V3"/><path d="M7.5 15h9"/>'};
const ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || '') + '</svg>';
const bar = (p, c) => '<span class="bar ' + (c || '') + '"><i style="width:' + Math.max(0, Math.min(100, p || 0)).toFixed(1) + '%"></i></span>';
const dots = d => '<span class="dots" aria-label="' + ['Warm-up', 'Standard', 'Stretch'][d - 1] + '">' + [1, 2, 3].map(k => '<i class="' + (k <= d ? 'on' : '') + '"></i>').join('') + '</span>';
function toast(m) {   // toasts stack instead of covering each other
  let box = document.getElementById('toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = R(m); box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), 2600 + 500 * (box.children.length - 1));
}
function confetti() {
  if (S.set.calm || reduced()) return;
  const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#1f3fbf', '#c9352a', '#0d7f52', '#d4a017', '#8ea6ff'];
  c.innerHTML = Array.from({length: 40}, (_, k) => '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[k % 5] + ';--dx:' + ((Math.random() - .5) * 220).toFixed(0) + 'px;animation-delay:' + (Math.random() * .4).toFixed(2) + 's"></i>').join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 2300);
}
let AC = null;
function beep(ok) {
  if (!S.set.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = ok ? 880 : 220; g.gain.value = 0.05; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (ok ? 0.18 : 0.3)); o.stop(AC.currentTime + 0.32); } catch (e) {}
}
const modal = document.getElementById('modal'); let MFN = null;
function confirmBox(msg, ok, fn) { modal.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div class="card"><p>' + msg + '</p><div class="cta"><button class="btn pri" data-a="mok">' + ok + '</button><button class="btn" data-a="mcancel">Cancel</button></div></div></div>'; MFN = fn; const b = modal.querySelector('[data-a=mok]'); b && b.focus(); }

/* ---------- days, active minutes, streak ---------- */
const pad = n => String(n).padStart(2, '0');
const dk = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dn = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const fromN = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
const addD = (k, n) => fromN(dn(k) + n);
const today = () => dk();
const niceDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}); };
function day(k = today()) { return S.days[k] || (S.days[k] = {min: 0, done: 0, xp: 0, q: {}, qp: []}); }
let lastActive = 0;
function active() { const now = Date.now(), gap = lastActive ? Math.min(now - lastActive, 120000) : 20000; lastActive = now; day().min += gap / 60000; }
const counted = k => { const d = S.days[k]; return !!(d && (d.done || d.min >= 10 || d.frozen)) || (S.set.rest || []).includes(k); };
function streak() { let k = counted(today()) ? today() : addD(today(), -1), n = 0; while (counted(k) && n < 3650) { n++; k = addD(k, -1); } return n; }
function streakCare() {   // a freeze covers one missed day; one is earned for every 7-day run (hold up to 2)
  const y = addD(today(), -1);
  if (!counted(y) && counted(addD(y, -1)) && S.streak.freezes > 0 && !S.streak.used.includes(y)) { day(y).frozen = 1; S.streak.freezes--; S.streak.used.push(y); toast('A streak freeze saved your streak'); }
  const n = streak();
  if (n >= 7 && Math.floor(n / 7) > Math.floor((S.streak.lastRun || 0) / 7) && S.streak.freezes < 2) { S.streak.freezes++; toast('7 more days: you earned a streak freeze'); }
  S.streak.lastRun = n; save();
}

/* ---------- XP, coins, levels ---------- */
const levelOf = xp => Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2);
const lvlFloor = L => 50 * L * (L - 1);
const TITLES = ['Rookie', 'Walk-on', 'Range regular', 'Club player', 'Single digit', 'Scratch', 'Tour pro', 'Major winner', 'Hall of Famer'];
const titleOf = L => TITLES[Math.min(L - 1, TITLES.length - 1)];
let xpPausedUntil = 0, fastMiss = 0;
function addXP(n) {
  if (n <= 0) return 0;
  if (Date.now() < xpPausedUntil) return 0;
  const before = levelOf(S.xp);
  S.xp += n; day().xp += n; S.coinRem = (S.coinRem || 0) + n; S.coins += Math.floor(S.coinRem / 10); S.coinRem %= 10;
  const after = levelOf(S.xp);
  if (after > before) { confetti(); toast('Level ' + after + ': ' + titleOf(after)); }
  renderStats();
  return n;
}

/* ---------- daily quests ---------- */
const QUESTS = {answer15: ['Answer 15 questions', 15], run5: ['Get 5 right in a row', 5], test5: ['Finish a 5-minute test', 1], fix3: ['Fix 3 mistakes', 3], speed: ['Play a speed round', 1],
  nohint5: ['Get 5 right with no hints', 5], lesson: ['Open a lesson', 1], typed10: ['Type 10 answers', 10], workshop: ['Finish a workshop problem', 1]};
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function quests() {
  const ids = Object.keys(QUESTS).filter(id => S.set.speed !== false || id !== 'speed').sort((a, b) => hashStr(today() + a) - hashStr(today() + b)).slice(0, 3);
  const d = day(); return {list: ids, got: d.q, paid: d.qp || (d.qp = [])};
}
function bumpQuest(id, n = 1, set) {
  const d = day(); d.q[id] = set ? Math.max(d.q[id] || 0, n) : (d.q[id] || 0) + n;
  const q = quests();
  if (q.list.includes(id) && !q.paid.includes(id) && d.q[id] >= QUESTS[id][1]) {
    q.paid.push(id); addXP(30); toast('Quest done: ' + QUESTS[id][0] + ' · +30 XP');
    if (q.list.every(x => q.paid.includes(x))) { addXP(50); confetti(); toast('All three quests done · +50 XP'); }
  }
}

/* ---------- mastery and spaced reviews ---------- */
const REVIEWS = [1, 3, 7, 21];
function L(k) { return S.L[k] || (S.L[k] = {chip: 'untouched', run: [], mAt: null, rev: {}, n: 0, c: 0}); }
function nextReview(k) { const st = L(k); if (st.chip !== 'mastered') return null; for (const g of REVIEWS) if (!st.rev[g]) return {stage: g, due: addD(st.mAt, g)}; return null; }
const reviewsDue = () => SKILLS.filter(k => { const r = nextReview(k); return r && dn(r.due) <= dn(today()); });
const chipOf = k => { const st = L(k); return st.chip === 'mastered' && reviewsDue().includes(k) ? 'due' : st.chip; };
const CHIPNAME = {untouched: 'Not started', practicing: 'Practicing', mastered: 'Mastered', due: 'Review due'};
const chipHTML = k => '<span class="chp ' + chipOf(k) + '">' + CHIPNAME[chipOf(k)] + '</span>';
const masteredCount = () => SKILLS.filter(k => L(k).chip === 'mastered').length;
function skillAcc(k) { const a = S.att.filter(x => x.s === k).slice(-40); return a.length ? Math.round(100 * sum(a.map(x => x.ok)) / a.length) : null; }

// Mastery: 3 right in a row with no hints, including a Standard or Stretch question when the skill has one
const needStd = k => TBYSK[k].some(t => t.d >= 2);   // bank questions come up too rarely to require one
// Every answer goes through here. Returns the XP earned.
function recordAnswer({it, ok, hints = 0, mode = 'practice', ms = 0, g = null, typed = false}) {
  active();
  const k = it.s, st = L(k);
  if (st.chip === 'untouched') st.chip = 'practicing';
  st.n++; if (ok) st.c++;
  S.att.push({t: Date.now(), s: k, key: it.key, ok: ok ? 1 : 0, h: hints, mode, mis: ok ? null : (g && g.id) || null}); if (S.att.length > 800) S.att = S.att.slice(-800);
  if (it.src === 'b') S.seenB[it.key] = ok ? 1 : 0;
  if (typed) { S.explore.typed++; bumpQuest('typed10'); }
  bumpQuest('answer15');
  let xp = 0;
  const learning = mode === 'practice' || mode === 'mistakes' || mode === 'workshop';
  if (ok && !hints) { S.run++; S.best = Math.max(S.best, S.run); bumpQuest('run5', S.run, true); bumpQuest('nohint5'); } else S.run = 0;
  if (learning) {
    if (ok && !hints) st.run.push(it.d || 1); else st.run = [];
    if (st.chip !== 'mastered' && st.run.length >= 3 && (!needStd(k) || st.run.slice(-3).some(d => d >= 2))) { st.chip = 'mastered'; st.mAt = today(); st.rev = {}; xp += addXP(40); confetti(); toast('Mastered: ' + SK[k].n + ' · reviews start tomorrow'); }
  }
  // mistakes: every miss lands in My Mistakes; one right answer clears it
  if (!ok) S.mist[it.key] = {key: it.key, src: it.src, s: k, id: (g && g.id) || 'miss', cat: (g && g.cat) || 'procedure', why: (g && g.msg) || '', t: Date.now(), n: ((S.mist[it.key] || {}).n || 0) + 1};
  else if (S.mist[it.key]) { delete S.mist[it.key]; S.fixed++; bumpQuest('fix3'); if (mode === 'mistakes') xp += addXP(3); }
  // no reward for guessing: a wrong answer in under 2 seconds earns nothing; three in a row pause XP for 2 minutes
  if (!ok && ms < 2000) { if (++fastMiss >= 3) { xpPausedUntil = Date.now() + 120000; fastMiss = 0; toast('Slow down — XP is paused for 2 minutes.'); } } else fastMiss = 0;
  if (ok) xp += addXP(mode === 'test' ? 3 : st.chip === 'mastered' && learning ? 1 : hints ? 2 : mode === 'workshop' ? 6 : 5);
  save(); checkBadges(); renderStats();
  return xp;
}

/* ---------- badges ---------- */
const BADGES = [];
const bdg = (id, fam, name, rule, test) => BADGES.push({id, fam, name, rule, test});
bdg('first', 'Getting started', 'First swing', 'Answer a question', () => S.att.length >= 1);
bdg('lesson1', 'Getting started', 'Read the yardage book', 'Open a lesson', () => Object.keys(S.ls).length >= 1);
bdg('ref', 'Getting started', 'Course map', 'Open the periodic table', () => S.explore.ref >= 1);
bdg('test1', 'Getting started', 'First round', 'Finish any test', () => S.tests.length >= 1);
bdg('backup', 'Getting started', 'Safe in the bag', 'Back up your progress', () => !!S.bk);
D.units.forEach(u => bdg('u' + u.n, 'Mastery', 'Unit ' + u.n, 'Master every skill in Unit ' + u.n + ', ' + u.t, () => u.ks.every(k => L(k).chip === 'mastered')));
bdg('semA', 'Mastery', 'SC300A complete', 'Master all of Units 1–5', () => SEMK('A').every(k => L(k).chip === 'mastered'));
bdg('semB', 'Mastery', 'SC300B complete', 'Master all of Units 6–10', () => SEMK('B').every(k => L(k).chip === 'mastered'));
bdg('grand', 'Mastery', 'Grand slam', 'Master all ' + SKILLS.length + ' skills', () => masteredCount() === SKILLS.length);
bdg('rev21', 'Mastery', 'It stuck', 'Pass a 21-day review', () => SKILLS.some(k => L(k).rev[21] === 'ok'));
[3, 7, 14, 30].forEach(n => bdg('s' + n, 'Streaks', n + '-day streak', 'Practice ' + n + ' days in a row', () => streak() >= n));
[50, 150, 400].forEach(n => bdg('v' + n, 'Volume', n + ' answers', 'Answer ' + n + ' questions', () => S.att.length >= n));
bdg('run10', 'Volume', 'Ten straight', '10 right in a row, no hints', () => S.best >= 10);
bdg('run25', 'Volume', 'Twenty-five straight', '25 right in a row, no hints', () => S.best >= 25);
bdg('fix5', 'Fixer', 'Fixer', 'Fix 5 mistakes', () => S.fixed >= 5);
bdg('fix20', 'Fixer', 'Repair shop', 'Fix 20 mistakes', () => S.fixed >= 20);
bdg('clean', 'Tests', 'Clean card', 'Perfect 5-minute test', () => S.tests.some(t => (t.kind === 'five' || t.kind === 'daily') && t.s === t.n));
bdg('under', 'Tests', 'Under par', '90% or better on a unit test', () => S.tests.some(t => t.kind === 'unit' && t.s / t.n >= 0.9));
bdg('cut', 'Tests', 'Made the cut', '80% or better on a semester or course final', () => S.tests.some(t => (t.kind === 'final' || t.kind === 'course') && t.s / t.n >= 0.8));
bdg('boss', 'Tests', 'Boss beaten', 'Beat the boss challenge', () => S.boss > 0);
bdg('bronze', 'Speed', 'Bronze', 'Earn a bronze medal', () => Object.values(S.pbs).some(p => p.medal >= 1));
bdg('silver', 'Speed', 'Silver', 'Earn a silver medal', () => Object.values(S.pbs).some(p => p.medal >= 2));
bdg('gold', 'Speed', 'Gold', 'Earn a gold medal', () => Object.values(S.pbs).some(p => p.medal >= 3));
bdg('gold5', 'Speed', 'Medal case', 'Gold on 5 drills', () => Object.values(S.pbs).filter(p => p.medal >= 3).length >= 5);
bdg('ladder', 'Speed', 'Lightning', 'Climb 15 rungs on the ladder', () => S.explore.ladder >= 15);
bdg('another', 'Explorer', 'Another way', 'Use "Explain it another way" 5 times', () => S.explore.another >= 5);
bdg('listen', 'Explorer', 'Good listener', 'Listen to 3 lessons', () => S.explore.listen >= 3);
bdg('shop', 'Explorer', 'Workshop', 'Finish 3 workshop problems', () => S.explore.workshop >= 3);
bdg('typed', 'Explorer', 'Keypad pro', 'Type 50 answers', () => S.explore.typed >= 50);
function checkBadges() {
  for (const b of BADGES) if (!S.badges[b.id]) { let got = false; try { got = b.test(); } catch (e) {} if (got) { S.badges[b.id] = today(); S.coins += 25; toast('New badge: ' + b.name + ' · +25 coins'); confetti(); } }
  save();
}
