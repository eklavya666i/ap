// ---------- Expressions: parse what the student types, draw it as math, check it, and name the mistake
const EX = (() => {
  function tokenize(s) {
    s = String(s).replace(/\*\*/g, '^').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '');
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const v = Number(s.slice(i, j)); if (!isFinite(v)) throw Error('number'); t.push({k: 'n', v}); i = j; continue; }
      if (s.startsWith('sqrt', i)) { t.push({k: 'f'}); i += 4; continue; }
      if (c === '√') { t.push({k: 'f'}); i++; continue; }
      if (/[a-zA-Z]/.test(c)) { t.push({k: 'v', v: c}); i++; continue; }
      if ('+-*/^()'.includes(c)) { t.push({k: c}); i++; continue; }
      throw Error('char ' + c);
    }
    return t;
  }
  function parse(s) {
    const t = tokenize(s); let p = 0;
    const eat = k => { if (t[p] && t[p].k === k) { p++; return true; } return false; };
    const starts = x => x && (x.k === 'n' || x.k === 'v' || x.k === '(' || x.k === 'f');
    function expr() { let a = term(); for (;;) { if (eat('+')) a = {t: '+', a, b: term()}; else if (eat('-')) a = {t: '-', a, b: term()}; else return a; } }
    function term() { let a = unary(); for (;;) { if (eat('*')) a = {t: '*', a, b: unary()}; else if (eat('/')) a = {t: '/', a, b: unary()}; else if (starts(t[p])) a = {t: '*', a, b: power()}; else return a; } }
    function unary() { if (eat('-')) return {t: 'neg', a: unary()}; if (eat('+')) return unary(); return power(); }
    function power() { const b = primary(); if (eat('^')) return {t: '^', a: b, b: unary()}; return b; }
    function primary() {
      const x = t[p]; if (!x) throw Error('end');
      if (x.k === 'n') { p++; return {t: 'n', v: x.v}; }
      if (x.k === 'v') { p++; return {t: 'v', n: x.v}; }
      if (x.k === 'f') { p++; return {t: 'sqrt', a: primary()}; }
      if (eat('(')) { const e = expr(); if (!eat(')')) throw Error('close'); return {t: '()', a: e}; }
      throw Error('token');
    }
    const e = expr(); if (p !== t.length) throw Error('extra'); return e;
  }
  const strip = n => n.t === '()' ? strip(n.a) : n;
  function ev(n, env) {
    switch (n.t) {
      case 'n': return n.v;
      case 'v': return env[n.n] === undefined ? NaN : env[n.n];
      case '()': return ev(n.a, env);
      case 'neg': return -ev(n.a, env);
      case 'sqrt': return Math.sqrt(ev(n.a, env));
      case '+': return ev(n.a, env) + ev(n.b, env);
      case '-': return ev(n.a, env) - ev(n.b, env);
      case '*': return ev(n.a, env) * ev(n.b, env);
      case '/': return ev(n.a, env) / ev(n.b, env);
      case '^': return Math.pow(ev(n.a, env), ev(n.b, env));
    }
    return NaN;
  }
  function varsOf(n, out = new Set()) { if (n.t === 'v') out.add(n.n); ['a', 'b'].forEach(k => n[k] && typeof n[k] === 'object' && varsOf(n[k], out)); return out; }
  const has = (n, t) => n.t === t || ['a', 'b'].some(k => n[k] && typeof n[k] === 'object' && has(n[k], t));
  // ----- draw as math (the app's TeX-like markup)
  const num = v => Number.isInteger(v) ? String(v) : String(+v.toFixed(6));
  function tx(n) {
    switch (n.t) {
      case 'n': return num(n.v);
      case 'v': return n.n;
      case '()': return '(' + tx(n.a) + ')';
      case 'neg': { const a = strip(n.a); return '-' + (a.t === '+' || a.t === '-' ? '(' + tx(a) + ')' : tx(n.a)); }
      case 'sqrt': return '\\sqrt{' + tx(strip(n.a)) + '}';
      case '+': return tx(n.a) + '+' + tx(n.b);
      case '-': { const b = strip(n.b); return tx(n.a) + '-' + (b.t === '+' || b.t === '-' ? '(' + tx(b) + ')' : tx(n.b)); }
      case '*': { const f = x => { x = x.t === '*' ? f(x.a) : x.t === '^' ? f(x.a) : x; return x; }, A = mulOp(n.a), B = mulOp(n.b), fb = f(n.b); const dot = fb.t === 'n' || fb.t === 'neg' || fb.t === '/' || (fb.t === '()' && false); return A + (dot ? '\\cdot ' : '') + B; }
      case '/': return '\\f{' + tx(strip(n.a)) + '}{' + tx(strip(n.b)) + '}';
      case '^': { const base = n.a.t === 'n' || n.a.t === 'v' || n.a.t === '()' ? tx(n.a) : '(' + tx(n.a) + ')'; return base + '^{' + tx(strip(n.b)) + '}'; }
    }
    return '';
  }
  const mulOp = n => (n.t === '+' || n.t === '-' || n.t === 'neg') ? '(' + tx(n) + ')' : tx(n);
  const toTeX = s => { try { return tx(parse(s)); } catch (e) { return String(s); } };
  // ----- numbers and comparisons
  const PTS = [-3.71, -1.29, 0.53, 1.87, 2.61, 4.39, 6.17, -5.43, 7.77, -0.37, 3.13, -2.47];
  function envAt(k, vars) { const e = {}; vars.forEach((v, j) => { e[v] = PTS[(k + 5 * j) % PTS.length] + 0.13 * j; }); return e; }
  function same(A, B) {
    const vars = [...new Set([...varsOf(A), ...varsOf(B)])]; let n = 0;
    for (let k = 0; k < PTS.length; k++) {
      const e = envAt(k, vars), a = ev(A, e), b = ev(B, e);
      if (!isFinite(a) || !isFinite(b)) continue;
      if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))) return false;
      n++;
    }
    return n >= 4;
  }
  const val = s => { const v = ev(parse(s), {}); if (!isFinite(v)) throw Error('value'); return v; };
  function splitTop(s) { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if ((ch === ',' || ch === ';') && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(x => x.trim()).filter(Boolean); }
  function vals(s) {
    s = String(s).trim(); if (!s) return null;
    if (s === '∅' || /^(none|no ?solution|all real numbers?)$/i.test(s)) return [];
    const out = [];
    for (let p of splitTop(s.replace(/\bor\b|\band\b/gi, ','))) {
      p = p.replace(/^[a-z]\s*(=|≠|!=)\s*/i, '');
      if (p.includes('±')) { const i = p.indexOf('±'), A = p.slice(0, i).trim() ? val(p.slice(0, i)) : 0, B = val(p.slice(i + 1)); out.push(A + B, A - B); }
      else out.push(val(p));
    }
    return out;
  }
  function uniq(a, tol = 1e-6) { const o = []; a.forEach(v => { if (!o.some(w => Math.abs(w - v) <= tol)) o.push(v); }); return o; }
  const inSet = (v, S, tol = 1e-6) => S.some(w => Math.abs(w - v) <= tol * Math.max(1, Math.abs(w)));
  function sameSet(A, B, tol = 1e-6) { A = uniq(A, tol); B = uniq(B, tol); return A.length === B.length && A.every(v => inSet(v, B, tol)); }
  function pairs(s) {
    s = String(s).trim(); if (!s) return null;
    if (s === '∅' || /no ?solution/i.test(s)) return [];
    const out = []; let d = 0, st = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') { if (d === 0) st = i; d++; }
      else if (s[i] === ')') { d--; if (d === 0 && st >= 0) { const inner = splitTop(s.slice(st + 1, i)); if (inner.length !== 2) throw Error('pair'); out.push([val(inner[0]), val(inner[1])]); st = -1; } }
    }
    if (!out.length) throw Error('pair');
    return out;
  }
  function samePairs(A, B) { const eq = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6; const ua = A.filter((p, i) => A.findIndex(q => eq(p, q)) === i); return ua.length === B.length && ua.every(p => B.some(q => eq(p, q))); }
  // ----- structure: one fraction, smallest denominator, factored completely
  const padd = (A, B) => { const o = []; for (let i = 0; i < Math.max(A.length, B.length); i++) o.push((A[i] || 0) + (B[i] || 0)); return o; };
  const pmul = (A, B) => { const o = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { o[i + j] += a * b; })); return o; };
  const deg = P => { for (let k = P.length - 1; k >= 0; k--) if (Math.abs(P[k]) > 1e-9) return k; return -1; };
  function rat(n, x = 'x') {
    switch (n.t) {
      case 'n': return {N: [n.v], D: [1]};
      case 'v': return n.n === x ? {N: [0, 1], D: [1]} : null;
      case '()': return rat(n.a, x);
      case 'neg': { const a = rat(n.a, x); return a && {N: a.N.map(c => -c), D: a.D}; }
      case '+': case '-': { const a = rat(n.a, x), b = rat(n.b, x); if (!a || !b) return null; const s = n.t === '+' ? 1 : -1; return {N: padd(pmul(a.N, b.D), pmul(b.N, a.D).map(c => s * c)), D: pmul(a.D, b.D)}; }
      case '*': { const a = rat(n.a, x), b = rat(n.b, x); return a && b && {N: pmul(a.N, b.N), D: pmul(a.D, b.D)}; }
      case '/': { const a = rat(n.a, x), b = rat(n.b, x); return a && b && {N: pmul(a.N, b.D), D: pmul(a.D, b.N)}; }
      case '^': { const e = strip(n.b); if (e.t !== 'n' || !Number.isInteger(e.v) || e.v < 0 || e.v > 8) return null; const a = rat(n.a, x); if (!a) return null; let N = [1], D = [1]; for (let k = 0; k < e.v; k++) { N = pmul(N, a.N); D = pmul(D, a.D); } return {N, D}; }
    }
    return null;
  }
  function oneFraction(n) { n = strip(n); while (n.t === 'neg') n = strip(n.a); if (n.t === '/') return !has(n.a, '/') && !has(n.b, '/'); return !has(n, '/'); }
  const denDeg = n => { const r = rat(n); return r ? deg(r.D) : 99; };
  function factorsOf(n) {
    const out = [];
    (function walk(x, mult) {
      x = strip(x);
      if (x.t === '*') { walk(x.a, mult); walk(x.b, mult); return; }
      if (x.t === 'neg') { walk(x.a, mult); return; }
      if (x.t === '^') { const e = strip(x.b); if (e.t === 'n' && Number.isInteger(e.v) && e.v > 0) { walk(x.a, mult * e.v); return; } }
      if (varsOf(x).size) for (let k = 0; k < mult; k++) out.push(x);
    })(n, 1);
    return out;
  }
  const gcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };
  function content(f) { const r = rat(f); if (!r || deg(r.D) > 0) return 1; const c = r.N.map(v => v / r.D[0]); if (c.some(v => Math.abs(v - Math.round(v)) > 1e-9)) return 1; return c.filter(v => Math.round(v)).reduce((g, v) => gcd(g, v), 0) || 1; }
  return {parse, ev, strip, toTeX, same, val, vals, pairs, sameSet, samePairs, inSet, uniq, oneFraction, denDeg, factorsOf, content, varsOf, has};
})();
const TEXL = s => EX.toTeX(s);              // linear expression -> math markup
const ML = s => '$' + EX.toTeX(s) + '$';      // linear expression -> inline math

// ---------- Grading typed answers. Returns {ok, msg, id, cat}
function gradeExpr(typed, ans, traps, opts = {}) {
  let A; try { A = EX.parse(typed); } catch (e) { return {ok: false, msg: "That expression isn't complete — check the brackets.", id: 'unreadable', cat: 'slip', bad: 1}; }
  const E = EX.parse(ans);
  if (EX.same(A, E)) {
    if (opts.factor) {
      const want = EX.factorsOf(E).length, got = EX.factorsOf(A), top = EX.strip(A);
      if (top.t === '+' || top.t === '-' || !got.length) return {ok: false, msg: "That's equal, but it isn't factored — write it as a product.", id: 'not_factored', cat: 'procedure'};
      if (got.length < want) return {ok: false, msg: 'Not completely factored — one of your factors still breaks down.', id: 'not_complete', cat: 'procedure'};
      if (got.some(f => EX.content(f) > 1)) return {ok: false, msg: 'Pull the common factor out of each bracket — a GCF is still inside.', id: 'gcf_inside', cat: 'procedure'};
      return {ok: true};
    }
    if (!EX.oneFraction(A)) return {ok: false, msg: 'Equal, but write it as one fraction.', id: 'not_combined', cat: 'procedure'};
    if (EX.denDeg(A) > EX.denDeg(E)) return {ok: false, msg: 'Equal, but not fully simplified — factor, then cancel the common factor.', id: 'not_simplified', cat: 'procedure'};
    return {ok: true};
  }
  for (const t of traps || []) {
    if (!t.e || t.eqv) continue;
    try { if (EX.same(A, EX.parse(t.e))) return {ok: false, msg: t.why, id: t.id || 'trap', cat: t.cat || 'procedure'}; } catch (e) {}
  }
  try { if (EX.same(A, {t: 'neg', a: E})) return {ok: false, msg: 'Sign slip — you have the opposite. Check opposites like $(a-x)=-(x-a)$ and distribute every minus.', id: 'sign', cat: 'slip'}; } catch (e) {}
  return {ok: false, msg: "That isn't equal to the answer. Use a hint or check the solution.", id: 'not_equal', cat: 'procedure'};
}
function gradeRestr(typed, it) {
  let V; try { V = EX.vals(typed); } catch (e) { return {ok: false, msg: 'List the values with commas, like $-3, 3$. Use None if nothing is excluded.', id: 'unreadable', cat: 'slip', bad: 1}; }
  if (V === null) return {ok: false, msg: 'List the excluded values (or tap None).', id: 'blank', cat: 'slip', bad: 1};
  const R = it.rz.map(EX.val);
  if (EX.sameSet(V, R)) return {ok: true};
  const miss = R.filter(v => !EX.inSet(v, V)), extra = V.filter(v => !EX.inSet(v, R));
  const show = a => a.map(v => '$' + fmtV(v) + '$').join(', ');
  const Z = k => (it[k] || []).map(EX.val);
  if (miss.some(v => EX.inSet(v, Z('dz')))) return {ok: false, msg: `When you divide, the divisor's numerator can't be 0 either: also exclude ${show(miss.filter(v => EX.inSet(v, Z('dz'))))}.`, id: 'divisor_numerator', cat: 'concept'};
  if (miss.some(v => EX.inSet(v, Z('bz')))) return {ok: false, msg: `The big denominator is 0 at ${show(miss.filter(v => EX.inSet(v, Z('bz'))))} — exclude it.`, id: 'big_denominator', cat: 'concept'};
  if (miss.some(v => EX.inSet(v, Z('cz')))) return {ok: false, msg: `A canceled factor still counts: ${show(miss.filter(v => EX.inSet(v, Z('cz'))))} makes the original denominator 0.`, id: 'lost_restriction', cat: 'concept'};
  if (extra.some(v => EX.inSet(v, Z('nz')))) return {ok: false, msg: `${show(extra.filter(v => EX.inSet(v, Z('nz'))))} only makes the numerator 0 — that's allowed.`, id: 'numerator_zero', cat: 'concept'};
  if (EX.sameSet(V.map(v => -v), R)) return {ok: false, msg: 'Sign slip: $x+a=0$ means $x=-a$.', id: 'sign', cat: 'slip'};
  if (miss.length) return {ok: false, msg: `Missing ${show(miss)} — set every factor of every original denominator equal to 0.`, id: 'missing_value', cat: 'procedure'};
  return {ok: false, msg: `${show(extra)} doesn't make any denominator 0.`, id: 'extra_value', cat: 'procedure'};
}
function gradeSol(typed, it) {
  let V; try { V = EX.vals(typed); } catch (e) { return {ok: false, msg: 'Type the solutions with commas, like $1, 2$ — or tap No solution.', id: 'unreadable', cat: 'slip', bad: 1}; }
  if (V === null) return {ok: false, msg: 'Type a solution or tap No solution.', id: 'blank', cat: 'slip', bad: 1};
  const S = it.ans.v.map(EX.val), X = (it.ex || []).map(EX.val);
  if (EX.sameSet(V, S)) return {ok: true};
  if (V.some(v => EX.inSet(v, X))) return {ok: false, msg: `${V.filter(v => EX.inSet(v, X)).map(v => '$x=' + fmtV(v) + '$').join(', ')} makes an original denominator 0 — it's extraneous. Throw it out.`, id: 'kept_extraneous', cat: 'concept'};
  if (!V.length && S.length) return {ok: false, msg: 'There is a solution that checks — solve the cleared equation again.', id: 'threw_out_valid', cat: 'concept'};
  if (V.length && !S.length) return {ok: false, msg: "Plug it in: it doesn't make both sides equal. Check for extraneous answers.", id: 'no_check', cat: 'concept'};
  if (V.every(v => EX.inSet(v, S)) && V.length < EX.uniq(S).length) return {ok: false, msg: "You have one — there's another solution. Did you solve the whole quadratic?", id: 'missed_root', cat: 'procedure'};
  if (EX.sameSet(V.map(v => -v), S)) return {ok: false, msg: 'Sign slip: $(x-a)=0$ gives $x=a$.', id: 'sign', cat: 'slip'};
  for (const t of it.traps || []) if (t.v) { try { if (EX.sameSet(V, t.v.map(EX.val))) return {ok: false, msg: t.why, id: t.id || 'trap', cat: t.cat || 'procedure'}; } catch (e) {} }
  return {ok: false, msg: "That doesn't check. Plug your answer into the original equation.", id: 'not_equal', cat: 'procedure'};
}
function gradeVals(typed, it) {   // domain-only questions
  return gradeRestr(typed, Object.assign({}, it, {rz: it.ans.v}));
}
function gradePairs(typed, it) {
  let P; try { P = EX.pairs(typed); } catch (e) { return {ok: false, msg: 'Type points like $(3, 1.5)$, or tap No solution.', id: 'unreadable', cat: 'slip', bad: 1}; }
  if (P === null) return {ok: false, msg: 'Type the points or tap No solution.', id: 'blank', cat: 'slip', bad: 1};
  const S = it.ans.p.map(q => [EX.val(q[0]), EX.val(q[1])]);
  if (EX.samePairs(P, S)) return {ok: true};
  for (const t of it.traps || []) if (t.p) { try { if (EX.samePairs(P, t.p.map(q => [EX.val(q[0]), EX.val(q[1])]))) return {ok: false, msg: t.why, id: t.id || 'trap', cat: t.cat || 'procedure'}; } catch (e) {} }
  if (P.length && S.length && P.every(p => S.some(q => Math.abs(p[0] - q[0]) < 1e-6))) return {ok: false, msg: 'Right $x$-values — recheck each $y$ by plugging $x$ into an equation.', id: 'wrong_y', cat: 'procedure'};
  return {ok: false, msg: "Those points don't satisfy both equations. Set them equal and solve.", id: 'not_equal', cat: 'procedure'};
}
function gradeNum(typed, it) {
  let v; try { v = EX.val(typed); } catch (e) { return {ok: false, msg: 'Type a number (decimals are fine).', id: 'unreadable', cat: 'slip', bad: 1}; }
  const want = EX.val(it.ans.n), tol = it.ans.tol || 1e-6;
  if (Math.abs(v - want) <= Math.max(tol, 1e-6 * Math.abs(want))) return {ok: true};
  for (const t of it.traps || []) if (t.n !== undefined && Math.abs(v - EX.val(String(t.n))) <= Math.max(tol, 1e-6)) return {ok: false, msg: t.why, id: t.id || 'trap', cat: t.cat || 'procedure'};
  return {ok: false, msg: 'Not quite. Write the rate equation, then solve.', id: 'not_equal', cat: 'procedure'};
}
function fmtV(v) {   // a number as math markup: fractions with small denominators, square roots, decimals
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  for (let d = 2; d <= 12; d++) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9) return (n < 0 ? '-' : '') + '\\f{' + Math.abs(Math.round(n)) + '}{' + d + '}'; }
  const s = v * v; if (Math.abs(s - Math.round(s)) < 1e-9) return (v < 0 ? '-' : '') + '\\sqrt{' + Math.round(s) + '}';
  return String(+v.toFixed(3));
}
