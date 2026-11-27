// ---------- Chemistry engine: element data, formulas, numbers with significant figures, and the graders.
// Every grader returns {ok, msg, id, cat, bad?, note?}. "bad" means the input couldn't be read: practice asks again, a test counts it wrong.

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// Seeded random numbers, so a question can be rebuilt from its seed
function rng(seed) {
  let a = (seed >>> 0) || 1;
  const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const i = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  return {f, i, nz: (lo, hi) => { let v = 0; while (!v) v = i(lo, hi); return v; }, pick: a => a[Math.floor(f() * a.length)],
    r: (lo, hi, dp) => { const p = Math.pow(10, dp); return Math.round((lo + f() * (hi - lo)) * p) / p; },   // decimal in [lo, hi] with dp places
    shuf: a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(f() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; },
    some: (a, n) => { a = a.slice(); const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(f() * a.length), 1)[0]); return out; }};
}
const gcdi = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rnz = (a, b) => { let v = 0; while (!v) v = rnd(a, b); return v; };
const rpk = a => a[Math.floor(Math.random() * a.length)];
const mk = (q, c, w, x) => { const all = [c].concat(w); return new Set(all).size < all.length || all.length < 4 ? null : {q, c: all, x}; };

// ---------- Elements (masses as printed on the in-app periodic table)
const PT = D.pt.map(r => ({z: r[0], s: r[1], n: r[2], m: r[3], g: r[4], p: r[5], c: r[6], en: r[7], cfg: r[8]}));
const EL = {}; PT.forEach(e => { EL[e.s] = e; });
const ELZ = z => PT[z - 1];
const m2 = v => (Math.round(v * 100) / 100).toFixed(2);

// ---------- Formulas: "Ca(NO3)2", "CuSO4·5H2O", "SO4^2-", "NH4^+"; typed subscripts/superscripts are accepted
const SUBS = '₀₁₂₃₄₅₆₇₈₉', SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function normF(s) {
  let t = '', sup = false;
  for (const ch of String(s === undefined || s === null ? '' : s)) {
    const a = SUBS.indexOf(ch), b = SUPS.indexOf(ch), sg = ch === '⁺' ? '+' : ch === '⁻' ? '-' : '';
    if (b >= 0 || sg) { t += (sup ? '' : '^') + (b >= 0 ? b : sg); sup = true; continue; }
    sup = false; t += a >= 0 ? a : ch;
  }
  return t.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[•*.]/g, '·');
}
function parseFormula(src) {   // -> {c: {El: n}, q: charge} or {err}
  const s = normF(src);
  if (!s) return {err: 'empty'};
  try {
    const all = {}; let q = 0;
    s.split('·').forEach((part, n) => {
      let pos = 0, coef = 1;
      const m = part.match(/^(\d+)(?=[A-Z(\[])/);
      if (m) { if (n === 0) throw 'coef'; coef = +m[1]; pos = m[1].length; }
      const r = parsePart(part, pos);
      for (const e in r.c) all[e] = (all[e] || 0) + r.c[e] * coef;
      q += r.q;
    });
    return {c: all, q};
  } catch (e) { return {err: String(e)}; }
}
function parsePart(str, start) {   // one piece of a formula: groups, counts, an optional charge
  let pos = start;
  const nm = () => { let e = pos; while (e < str.length && /[0-9]/.test(str[e])) e++; const v = e > pos ? +str.slice(pos, e) : 1; pos = e; return v; };
  function grp(close) {
    const cc = {};
    while (pos < str.length && str[pos] !== close && str[pos] !== '^' && !((str[pos] === '+' || str[pos] === '-') && !close)) {
      if (str[pos] === '(' || str[pos] === '[') {
        const cl = str[pos] === '(' ? ')' : ']'; pos++; const inner = grp(cl);
        if (str[pos] !== cl) throw 'paren';
        pos++; const k = nm(); for (const e in inner) cc[e] = (cc[e] || 0) + inner[e] * k;
      } else if (/[A-Z]/.test(str[pos])) {
        let sym = str[pos++]; if (pos < str.length && /[a-z]/.test(str[pos])) sym += str[pos++];
        if (!EL[sym]) throw 'sym:' + sym;
        const k = nm(); cc[sym] = (cc[sym] || 0) + k;
      } else if (/[a-z]/.test(str[pos])) throw 'lower:' + str[pos];
      else throw 'char:' + str[pos];
    }
    return cc;
  }
  const body = grp(null); let q = 0;
  if (!Object.keys(body).length) throw 'empty';
  if (pos < str.length) {
    const rest = str.slice(pos), m = rest.match(/^\^?(\d*)([+-])$/) || rest.match(/^\^([+-])(\d*)$/);
    if (!m) throw 'charge';
    const digits = (m[1] + m[2]).replace(/[^0-9]/g, ''), sg = (m[1] + m[2]).replace(/[^+-]/g, '');
    q = (sg === '-' ? -1 : 1) * (digits ? +digits : 1);
  }
  return {c: body, q};
}
const sameCounts = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => a[k] === b[k]); };
function multipleOf(a, b) {   // a = k * b for a whole k > 1?
  const ka = Object.keys(a); if (!sameKeys(a, b)) return 0;
  const k = a[ka[0]] / b[ka[0]]; return Number.isInteger(k) && k > 1 && ka.every(e => a[e] === k * b[e]) ? k : 0;
}
const sameKeys = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every((k, n) => k === kb[n]); };
function molarMass(f) { const p = parseFormula(f); let v = 0; for (const e in p.c) v += p.c[e] * EL[e].m; return Math.round(v * 100) / 100; }
const elemsOf = f => { const p = parseFormula(f), out = []; normF(f).replace(/[A-Z][a-z]?/g, s => { if (EL[s] && !out.includes(s) && p.c[s]) out.push(s); return s; }); return out; };
const massList = fs => { const els = []; [].concat(fs).forEach(f => elemsOf(f).forEach(e => { if (!els.includes(e)) els.push(e); })); return els.map(e => e + ' = ' + m2(EL[e].m)).join(', '); };
const countOf = (f, e) => parseFormula(f).c[e] || 0;

// Display: \ce{...} (formulas and equations), \cfg{...} (electron configurations)
function ceHTML(x) {
  const s = String(x); let h = '', i = 0, start = true;
  const sup = t => '<sup>' + t.replace(/-/g, '−') + '</sup>';
  while (i < s.length) {
    const c = s[i];
    if (s.startsWith('<=>', i)) { h += '<span class="ar">⇌</span>'; i += 3; start = true; continue; }
    if (s.startsWith('->', i)) { h += '<span class="ar">→</span>'; i += 2; start = true; continue; }
    if (c === ' ') { h += ' '; i++; start = true; continue; }
    if (c === '+' && s[i + 1] === ' ' && (i === 0 || s[i - 1] === ' ')) { h += '<span class="op">+</span>'; i++; start = true; continue; }
    if (c === '^' && s[i + 1] === '{') {   // nuclide ^{A}_{Z}X
      const a = s.indexOf('}', i), A = s.slice(i + 2, a); i = a + 1; let Z = '';
      if (s[i] === '_' && s[i + 1] === '{') { const b = s.indexOf('}', i); Z = s.slice(i + 2, b); i = b + 1; }
      let j = i; if (j < s.length && /[A-Za-zαβγ]/.test(s[j])) { j++; while (j < s.length && /[a-z]/.test(s[j])) j++; }
      h += '<span class="nuc"><span class="nz"><sup>' + A + '</sup><sub>' + Z.replace(/-/g, '−') + '</sub></span>' + esc(s.slice(i, j)) + '</span>'; i = j; start = false; continue;
    }
    if (c === '^') { let j = i + 1; while (j < s.length && /[0-9+\-]/.test(s[j])) j++; h += sup(s.slice(i + 1, j)); i = j; start = false; continue; }
    const ph = s.slice(i).match(/^\((s|l|g|aq)\)/); if (ph) { h += '<span class="ph">' + ph[0] + '</span>'; i += ph[0].length; start = false; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < s.length && /[0-9./]/.test(s[j])) j++; const t = s.slice(i, j); h += start ? t : '<sub>' + t + '</sub>'; i = j; start = false; continue; }
    if (c === '·' || c === '*' || c === '.') { h += '·'; i++; start = true; continue; }
    h += esc(c); i++; start = false;
  }
  return '<span class="ce">' + h + '</span>';
}
function cfgHTML(x) { return '<span class="cfg">' + String(x).trim().split(/\s+/).map(t => t.replace(/^(\d[spdf])(\d+)$/, '$1<sup>$2</sup>')).join(' ') + '</span>'; }
const chemText = p => p.replace(/\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, x) => ceHTML(x)).replace(/\\cfg\{([^{}]*)\}/g, (m, x) => cfgHTML(x));
// Speech for the same markup
function ceSay(x) {
  return String(x).replace(/<=>/g, ' is in equilibrium with ').replace(/->/g, ' yields ')
    .replace(/\^\{(\d+)\}_\{(-?\d+)\}([A-Za-zαβγ][a-z]*)/g, (m, A, Z, S) => ' ' + (S === 'e' ? 'electron' : S === 'n' ? 'neutron' : S.split('').join(' ')) + ' ' + A + ', atomic number ' + Z + ' ')
    .replace(/\((aq)\)/g, ' aqueous ').replace(/\(s\)/g, ' solid ').replace(/\(l\)/g, ' liquid ').replace(/\(g\)/g, ' gas ')
    .replace(/\^(\d*)([+-])/g, (m, d, sg) => ' ' + (d || '') + (sg === '+' ? ' plus ' : ' minus '))
    .replace(/([A-Z][a-z]?)(\d*)/g, (m, e, d) => ' ' + e.split('').join(' ') + (d ? ' ' + d : '') + ' ')
    .replace(/[()·]/g, ' ').replace(/\s+/g, ' ').trim();
}
const cfgSay = x => String(x).trim().split(/\s+/).map(t => t.replace(/^\[(\w+)\]$/, '$1 core').replace(/^(\d)([spdf])(\d+)$/, '$1 $2 $3')).join(', ');

// ---------- Numbers: significant figures and scientific notation
function sfOf(mant) {
  const t = String(mant).replace(/^[+-]/, ''), dot = t.includes('.');
  let d = t.replace('.', '').replace(/^0+/, '');
  if (!d) return 1;
  if (!dot) d = d.replace(/0+$/, '');
  return Math.max(1, d.length);
}
function parseNum(str) {
  let s = String(str === undefined || str === null ? '' : str).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/^\+/, '');
  if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) s = s.replace(/,/g, '');
  let m = s.match(/^(-?(?:\d+\.?\d*|\.\d+))(?:(?:[x×X*·]10\^?\(?([+-]?\d+)\)?)|(?:[eE]([+-]?\d+)))?$/);
  if (!m) { const k = s.match(/^(-?)10\^\(?([+-]?\d+)\)?$/); if (k) m = [s, k[1] + '1', k[2]]; }
  if (!m) return null;
  const ex = m[2] !== undefined ? +m[2] : m[3] !== undefined ? +m[3] : 0, v = parseFloat(m[1]) * Math.pow(10, ex);
  return isFinite(v) ? {v, sf: sfOf(m[1]), sci: m[2] !== undefined || m[3] !== undefined, mant: m[1], ex} : null;
}
function fmtSF(v, sf, mode) {   // -> "6.02×10^23" or "0.00456"; mode 'sci' forces scientific notation, 'fix' forbids it
  if (!isFinite(v)) return String(v);
  if (v === 0) return sf > 1 ? '0.' + '0'.repeat(sf - 1) : '0';
  const sign = v < 0 ? '-' : '', a = Math.abs(v);
  let [mant, ex] = a.toExponential(sf - 1).split('e'); ex = +ex;
  const rv = +mant * Math.pow(10, ex), fixed = rv.toFixed(Math.max(0, sf - 1 - ex));
  const fixedOk = sfOf(fixed) === sf && Math.abs(+fixed - rv) <= rv * 1e-9;
  if (mode === 'sci' || (mode !== 'fix' && (ex >= 6 || ex <= -4 || !fixedOk))) return sign + mant + '×10^' + ex;
  return sign + fixed;
}
const niceN = (v, sf) => { if (Number.isInteger(v) && Math.abs(v) < 1e6) return String(v); const s = fmtSF(v, sf || 4); return s.includes('×') ? s.replace(/\.?0+×/, '×') : s.includes('.') ? s.replace(/\.?0+$/, '') : s; };
const texN = s => String(s).replace(/-/g, '-').replace(/×10\^(-?\d+)/, '\\times10^{$1}').replace(/e([+-]?\d+)$/, (m, e) => '\\times10^{' + (+e) + '}');
const sayN = s => String(s).replace(/×10\^(-?\d+)/, (m, e) => ' times 10 to the ' + (e < 0 ? 'negative ' + (-e) : e)).replace(/^-/, 'negative ');
const chgTxt = q => q === 0 ? '0' : Math.abs(q) + (q > 0 ? '+' : '−');
const chgCe = q => q === 0 ? '' : '^' + (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-');

// ---------- Electron configurations
const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP = {s: 2, p: 6, d: 10, f: 14};
const CORES = {He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86};
function cfgMap(n) { const m = {}; for (const o of ORDER) { if (n <= 0) break; const k = Math.min(CAP[o[1]], n); m[o] = k; n -= k; } return m; }
function cfgStr(n, core) {   // Aufbau order, optional noble-gas core
  let pre = '', start = 0;
  if (core) { const c = Object.keys(CORES).filter(k => CORES[k] < n).pop(); if (c) { pre = '[' + c + ']'; start = CORES[c]; } }
  const full = cfgMap(n), done = cfgMap(start);
  return [pre].concat(ORDER.filter(o => full[o] && full[o] !== done[o]).map(o => o + (full[o] - (done[o] || 0)))).filter(Boolean).join(' ');
}
function parseCfg(src) {   // -> {m: {"3d": 6}, tot} or {err}
  let s = normF(src).replace(/\^/g, ''); const m = {}; let i = 0, tot = 0;
  while (i < s.length) {
    if (s[i] === '[') { const j = s.indexOf(']', i); if (j < 0) return {err: 'core'}; const c = s.slice(i + 1, j); if (!CORES[c]) return {err: 'core'}; const cm = cfgMap(CORES[c]); for (const o in cm) m[o] = (m[o] || 0) + cm[o]; i = j + 1; continue; }
    const t = s.slice(i).match(/^(\d)([spdf])/); if (!t) return {err: 'token'};
    i += 2; const l = t[2]; let d = '';
    if (l === 's' || l === 'p') d = s[i] && /\d/.test(s[i]) ? s[i] : '';
    else if (l === 'd') d = s.startsWith('10', i) ? '10' : (s[i] && /\d/.test(s[i]) ? s[i] : '');
    else { const two = s.slice(i, i + 2); d = /^1[0-4]$/.test(two) ? two : (s[i] && /\d/.test(s[i]) ? s[i] : ''); }
    if (!d) return {err: 'count'}; i += d.length;
    const key = t[1] + l; m[key] = (m[key] || 0) + +d;
  }
  for (const o in m) tot += m[o];
  return {m, tot};
}

// ---------- Names
function normN(s) {
  return String(s || '').toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim()
    .replace(/\s*\(\s*([ivx]+)\s*\)\s*/g, '($1) ').replace(/\b([a-z]+) (i{1,3}|iv|vi{0,2}|v)(?= |$)/g, '$1($2)')
    .replace(/\s+/g, ' ').trim();
}
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// ---------- Field graders
const near = (a, b, fd) => fd.abs !== undefined ? Math.abs(a - b) <= fd.abs + 1e-12 : b === 0 ? Math.abs(a) < 1e-12 : Math.abs(a - b) <= (fd.tol === undefined ? 0.01 : fd.tol) * Math.abs(b) + 1e-15;
const ansNum = fd => fd.sf ? fmtSF(fd.ans, fd.sf, fd.fmt === 'sci' ? 'sci' : undefined) : niceN(fd.ans);
const trapFor = (traps, fd, test) => (traps || []).find(t => t.f === fd.id && test(t.v));
function gradeNumF(txt, fd, traps) {
  const p = parseNum(txt);
  if (!p) return {ok: false, bad: 1, msg: 'Type a number, like 4.52 or 6.02×10^23.'};
  const T = fd.ans, show = ansNum(fd);
  const roundOK = () => { if (fd.abs !== undefined || fd.sfs || !T) return false; const k = Math.max(p.sf, fd.sf || 3), e = Math.floor(Math.log10(Math.abs(T))); return Math.abs(p.v - T) <= 0.5 * Math.pow(10, e - k + 1) * 1.001; };
  if (near(p.v, T, fd) || roundOK()) {
    if (fd.fmt === 'sci' && (!p.sci || Math.abs(+p.mant) < 1 || Math.abs(+p.mant) >= 10)) return {ok: false, msg: (p.sci ? 'In scientific notation the first number is at least 1 and less than 10: ' : 'Right value. Now write it in scientific notation: ') + '$' + texN(show) + '$.', id: 'sci_format', cat: 'procedure'};
    if (fd.fmt === 'fix' && p.sci) return {ok: false, msg: 'Right value. Now write it out in standard form, without a power of ten: $' + texN(show) + '$.', id: 'std_format', cat: 'procedure'};
    if (fd.sfs && p.sf !== fd.sf) return {ok: false, msg: 'Right value, but it needs ' + fd.sf + ' significant figure' + (fd.sf > 1 ? 's' : '') + ': $' + texN(show) + '$.', id: 'sigfigs', cat: 'procedure'};
    return {ok: true, note: fd.sf && !fd.sfs && p.sf !== fd.sf ? 'With ' + fd.sf + ' significant figures, report $' + texN(show) + '$' + (fd.unit ? ' ' + fd.unit : '') + '.' : ''};
  }
  const t = trapFor(traps, fd, v => typeof v === 'number' && near(p.v, v, fd.abs !== undefined ? fd : {tol: Math.max(fd.tol || 0.01, 0.004)}));
  if (t) return {ok: false, msg: t.why, id: t.id, cat: t.cat};
  if (T && p.v && fd.abs === undefined) { const r = p.v / T; if (r > 0) { const k = Math.round(Math.log10(r)); if (k && Math.abs(r / Math.pow(10, k) - 1) <= 0.02) return {ok: false, msg: 'Off by a factor of $10^{' + k + '}$. Check a unit conversion or a power of ten.', id: 'power10', cat: 'procedure'}; } }
  if (T && near(-p.v, T, fd)) return {ok: false, msg: 'Check the sign.', id: 'sign', cat: 'slip'};
  if (T && Math.abs(p.v - T) <= 0.05 * Math.abs(T) && fd.abs === undefined && !fd.sfs) return {ok: false, msg: 'Close, but not quite. Keep extra digits until the last step, then round.', id: 'rounding', cat: 'slip'};
  return {ok: false, msg: 'That doesn\'t match. Try a hint, or check the solution.', id: 'not_equal', cat: 'procedure'};
}
function gradeIntF(txt, fd, traps) {
  const s = String(txt || '').trim().replace(/[−–]/g, '-');
  if (!/^[+-]?\d+$/.test(s)) return {ok: false, bad: 1, msg: 'Type a whole number.'};
  const v = +s; if (v === fd.ans) return {ok: true};
  const t = trapFor(traps, fd, x => x === v); if (t) return {ok: false, msg: t.why, id: t.id, cat: t.cat};
  return {ok: false, msg: fd.miss || 'Not quite. Count again, or use a hint.', id: 'not_equal', cat: 'procedure'};
}
function parseChg(txt) {
  const s = String(txt || '').trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
  if (s === '0') return 0;
  const m = s.match(/^([+-])(\d*)$/) || s.match(/^(\d*)([+-])$/); if (!m) return null;
  const d = /\d/.test(m[1]) ? m[1] : m[2], sg = /[+-]/.test(m[1]) ? m[1] : m[2];
  return (sg === '-' ? -1 : 1) * (d ? +d : 1);
}
function gradeChgF(txt, fd, traps) {
  const v = parseChg(txt); if (v === null) return {ok: false, bad: 1, msg: 'Type a charge with its sign, like 2+ or 3−.'};
  if (v === fd.ans) return {ok: true};
  const t = trapFor(traps, fd, x => x === v); if (t) return {ok: false, msg: t.why, id: t.id, cat: t.cat};
  if (v === -fd.ans) return {ok: false, msg: 'Right size, wrong sign: metals lose electrons (positive), nonmetals gain them (negative).', id: 'charge_sign', cat: 'concept'};
  return {ok: false, msg: 'Not that charge. Count how many electrons it takes to reach a noble-gas configuration.', id: 'not_equal', cat: 'procedure'};
}
function gradeFrmF(txt, fd, traps) {
  const t = normF(txt); if (!t) return {ok: false, bad: 1, msg: 'Type a formula, like CaCl2.'};
  const P = parseFormula(t);
  if (P.err) {
    if (/^lower|^sym/.test(P.err) && String(txt).toLowerCase() !== String(txt)) return {ok: false, bad: 1, msg: 'Check the element symbols: one capital letter, then lowercase (Ca, Cl, O).'};
    if (P.err === 'coef') return {ok: false, bad: 1, msg: 'Leave out the coefficient: just the formula, like ' + fd.ans + '.'};
    return {ok: false, bad: 1, msg: /^lower/.test(P.err) ? 'Element symbols start with a capital letter: Ca, Cl, O.' : /^sym/.test(P.err) ? '"' + P.err.slice(4) + '" isn\'t an element symbol.' : 'That formula can\'t be read. Check the parentheses.'};
  }
  const A = parseFormula(fd.ans), ok = [fd.ans].concat(fd.alt || []).some(a => normF(a) === t);
  if (ok) return {ok: true};
  const tr = trapFor(traps, fd, v => typeof v === 'string' && normF(v) === t); if (tr) return {ok: false, msg: tr.why, id: tr.id, cat: tr.cat};
  if (sameCounts(P.c, A.c) && P.q === A.q) return fd.order === 'any' ? {ok: true} : {ok: false, msg: 'Right atoms, but write it the standard way, positive part first: \\ce{' + fd.ans + '}.', id: 'formula_order', cat: 'procedure'};
  const k = multipleOf(P.c, A.c); if (k) return {ok: false, msg: 'Right ratio, but reduce it to the lowest whole numbers: \\ce{' + fd.ans + '}.', id: 'not_reduced', cat: 'procedure'};
  if (t.replace(/[()]/g, '') === normF(fd.ans).replace(/[()]/g, '') && t !== normF(fd.ans)) return {ok: false, msg: 'Use parentheses around a polyatomic ion when there\'s more than one of it: \\ce{' + fd.ans + '}.', id: 'parentheses', cat: 'procedure'};
  return {ok: false, msg: fd.miss || 'Not quite. Check the charges and the ratio.', id: 'not_equal', cat: 'procedure'};
}
function gradeNameF(txt, fd, traps) {
  const t = normN(txt); if (!t) return {ok: false, bad: 1, msg: 'Type the name.'};
  if ([fd.ans].concat(fd.alt || []).some(a => normN(a) === t)) return {ok: true};
  const tr = trapFor(traps, fd, v => typeof v === 'string' && normN(v) === t); if (tr) return {ok: false, msg: tr.why, id: tr.id, cat: tr.cat};
  const A = normN(fd.ans), hasR = /\([ivx]+\)/.test(A), tR = /\([ivx]+\)/.test(t);
  if (hasR && !tR && t === A.replace(/\([ivx]+\)/, '')) return {ok: false, msg: 'This metal can form more than one ion, so the name needs a Roman numeral for its charge: ' + fd.ans + '.', id: 'missing_roman', cat: 'concept'};
  if (hasR && tR && t.replace(/\([ivx]+\)/, '') === A.replace(/\([ivx]+\)/, '')) return {ok: false, msg: 'Check the Roman numeral: it is the metal ion\'s charge (work it out from the anion), not its subscript.', id: 'wrong_roman', cat: 'procedure'};
  if (!hasR && tR && t.replace(/\([ivx]+\)/, '') === A) return {ok: false, msg: 'This metal forms only one ion, so no Roman numeral: ' + fd.ans + '.', id: 'extra_roman', cat: 'concept'};
  return {ok: false, msg: fd.miss || 'Not quite. Compare your name with the solution.', id: 'not_equal', cat: 'procedure'};
}
function gradeCfgF(txt, fd, traps) {
  const P = parseCfg(txt); if (!String(txt || '').trim()) return {ok: false, bad: 1, msg: 'Type the configuration, like 1s2 2s2 2p6.'};
  if (P.err) return {ok: false, bad: 1, msg: 'Write each sublevel as number, letter, electrons: 1s2 2s2 2p6 (or start with a core like [Ne]).'};
  for (const o in P.m) if (P.m[o] > CAP[o[1]]) return {ok: false, msg: 'A ' + o[1] + ' sublevel holds at most ' + CAP[o[1]] + ' electrons, but you put ' + P.m[o] + ' in ' + o + '.', id: 'sublevel_capacity', cat: 'concept'};
  const A = parseCfg(fd.ans);
  if (sameCounts(P.m, A.m)) return {ok: true};
  const tr = trapFor(traps, fd, v => { if (typeof v !== 'string') return false; const T = parseCfg(v); return !T.err && sameCounts(P.m, T.m); }); if (tr) return {ok: false, msg: tr.why, id: tr.id, cat: tr.cat};
  if (P.tot !== A.tot) return {ok: false, msg: 'Your configuration holds ' + P.tot + ' electrons; it needs ' + A.tot + '.' + (fd.ion ? ' For an ion, add electrons for a negative charge and remove them for a positive one.' : ' The electron count equals the atomic number.'), id: 'electron_count', cat: 'procedure'};
  if (Object.keys(P.m).some(o => o[1] === 'd' && !A.m[o] && A.m[(+o[0] - 1) + 'd'])) return {ok: false, msg: 'After 4s comes 3d: a d sublevel sits one shell below the s that fills before it.', id: 'd_level', cat: 'concept'};
  return {ok: false, msg: 'Right number of electrons, but they aren\'t in the right sublevels. Fill in order: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p.', id: 'fill_order', cat: 'procedure'};
}
function gradeSymF(txt, fd, traps) {
  const t = String(txt || '').trim(); if (!t) return {ok: false, bad: 1, msg: 'Type the element symbol.'};
  if (t === fd.ans) return {ok: true};
  if (t.toLowerCase() === fd.ans.toLowerCase()) return {ok: false, msg: 'Right element, but symbols are case-sensitive: write ' + fd.ans + '.', id: 'symbol_case', cat: 'slip'};
  const tr = trapFor(traps, fd, v => v === t); if (tr) return {ok: false, msg: tr.why, id: tr.id, cat: tr.cat};
  return {ok: false, msg: EL[t] ? t + ' is ' + EL[t].n.toLowerCase() + ', atomic number ' + EL[t].z + '.' : '"' + t + '" isn\'t an element symbol.', id: 'not_equal', cat: 'procedure'};
}
function balanceInfo(fd, co) {   // first element out of balance, or null
  const tally = {};
  fd.sp.forEach((f, k) => { const c = parseFormula(f).c; for (const e in c) tally[e] = (tally[e] || 0) + (k < fd.nr ? 1 : -1) * co[k] * c[e]; });
  for (const e of Object.keys(tally)) if (tally[e]) {
    let L = 0, Rr = 0; fd.sp.forEach((f, k) => { const n = (parseFormula(f).c[e] || 0) * co[k]; if (k < fd.nr) L += n; else Rr += n; });
    return {e, L, R: Rr};
  }
  return null;
}
function gradeCoefF(vals, fd, traps) {
  const raw = fd.sp.map((_, k) => String(vals[k] === undefined ? '' : vals[k]).trim());
  if (raw.every(v => !v)) return {ok: false, bad: 1, msg: 'Type a coefficient in each box (a blank box counts as 1).'};
  if (raw.some(v => v && !/^\d+$/.test(v))) return {ok: false, bad: 1, msg: 'Coefficients are whole numbers.'};
  const co = raw.map(v => v ? +v : 1);
  if (co.some(v => v < 1)) return {ok: false, bad: 1, msg: 'Coefficients are whole numbers of at least 1.'};
  const b = balanceInfo(fd, co);
  if (!b) { const g = co.reduce(gcdi); return g > 1 ? {ok: false, msg: 'Balanced, but not in lowest terms: divide every coefficient by ' + g + '.', id: 'not_lowest', cat: 'procedure'} : {ok: true}; }
  const tr = trapFor(traps, fd, v => Array.isArray(v) && v.every((x, k) => x === co[k])); if (tr) return {ok: false, msg: tr.why, id: tr.id, cat: tr.cat};
  return {ok: false, msg: 'Not balanced yet: ' + EL[b.e].n.toLowerCase() + ' (' + b.e + ') has ' + b.L + ' atom' + (b.L === 1 ? '' : 's') + ' on the left and ' + b.R + ' on the right.', id: 'unbalanced', cat: 'procedure'};
}
const GRADERS = {num: gradeNumF, int: gradeIntF, chg: gradeChgF, frm: gradeFrmF, name: gradeNameF, cfg: gradeCfgF, sym: gradeSymF, coef: gradeCoefF};
function gradeFields(it, f) {   // f: {fieldId: text} (coefficients: fieldId -> array)
  const parts = {}; let first = null, note = '';
  for (const fd of it.fs) {
    const g = GRADERS[fd.t](f[fd.id], fd, it.traps);
    if (g.bad) return Object.assign({}, g, {part: fd.id});
    parts[fd.id] = g.ok; if (!g.ok && !first) first = g; if (g.ok && g.note) note = g.note;
  }
  return first ? Object.assign({}, first, {parts}) : {ok: true, parts, note};
}
// Answer text for a field (choices, feedback, review)
function ansTextF(fd, v, shown) {
  switch (fd.t) {
    case 'num': return '$' + texN(shown || (fd.sf ? fmtSF(v, fd.sf, fd.fmt === 'sci' ? 'sci' : fd.fmt === 'fix' ? 'fix' : undefined) : niceN(v))) + '$' + (fd.unit ? ' ' + fd.unit : '');
    case 'int': return String(v);
    case 'chg': return chgTxt(v);
    case 'frm': case 'sym': return '\\ce{' + v + '}';
    case 'name': return v;
    case 'cfg': return '\\cfg{' + v + '}';
    case 'coef': return eqText(fd, v);
  }
  return String(v);
}
const eqText = (fd, co) => '\\ce{' + fd.sp.map((f, k) => (co[k] > 1 ? co[k] : '') + f).reduce((s, f, k) => s + (k === 0 ? '' : k === fd.nr ? ' -> ' : ' + ') + f, '') + '}';

// ---------- Template kit
const TPLS = [], TPL = {};
function tpl(o) { TPLS.push(o); TPL[o.id] = o; }
const NUM = (id, lab, ans, o) => Object.assign({id, lab, t: 'num', ans}, o || {});
const INT = (id, lab, ans, o) => Object.assign({id, lab, t: 'int', ans}, o || {});
const CHG = (id, lab, ans) => ({id, lab, t: 'chg', ans});
const FRM = (id, lab, ans, o) => Object.assign({id, lab, t: 'frm', ans}, o || {});
const NAM = (id, lab, ans, o) => Object.assign({id, lab, t: 'name', ans}, o || {});
const CFG = (id, lab, ans, o) => Object.assign({id, lab, t: 'cfg', ans}, o || {});
const SYM = (id, lab, ans) => ({id, lab, t: 'sym', ans});
const COEF = (sp, nr, ans) => ({id: 'c', lab: 'Coefficients', t: 'coef', sp, nr, ans});
const TR = (f, v, why, id, cat, s) => ({f, v, why, id, cat: cat || 'procedure', s});
const typedOf = (fd, v, s) => fd.t === 'num' ? (s || niceN(v, 8)) : fd.t === 'chg' ? chgTxt(v) : fd.t === 'coef' ? v.map(String) : String(v);
function finishItem(it) {   // drop traps that coincide with the answer (or with each other)
  if (it.k === 'mc' || !it.fs) return it;
  const seen = new Set();
  it.traps = (it.traps || []).filter(t => {
    const fd = it.fs.find(f => f.id === t.f); if (!fd || t.v === undefined || t.v === null || (typeof t.v === 'number' && !isFinite(t.v))) return false;
    const key = t.f + '|' + (Array.isArray(t.v) ? t.v.join(',') : typeof t.v === 'number' ? +t.v.toPrecision(6) : normN(t.v));
    if (seen.has(key)) return false; seen.add(key);
    return !GRADERS[fd.t](typedOf(fd, t.v, t.s), fd, []).ok;
  });
  return it;
}
// Multiple-choice item: the right answer first, then [text, why, id, cat] for each wrong one
const MCI = (q, right, wrongs, h, x) => ({k: 'mc', q, mc: [{t: right, why: ''}].concat(wrongs.map(w => ({t: w[0], why: w[1], id: w[2] || 'trap', cat: w[3] || 'concept'}))), h, x});
const ce = f => '\\ce{' + f + '}', cfgT = c => '\\cfg{' + c + '}';
const F = (a, b) => '\\f{' + a + '}{' + b + '}', TX = s => '\\text{' + s + '}';
const nT = (v, sf, mode) => texN(sf ? fmtSF(v, sf, mode) : niceN(v));   // a number for math markup
const $n = (v, sf, mode) => '$' + nT(v, sf, mode) + '$';                  // a number inside prose
const fx = (v, dp) => v.toFixed(dp);
const one = (q, fd, traps, h, x, more) => Object.assign({q, fs: [fd], traps: traps || [], h, x}, more || {});
