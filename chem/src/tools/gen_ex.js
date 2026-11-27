// Worked examples for the lessons, generated from the verified templates with fixed seeds (so every build gives the same examples).
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ctx = {console, Math, Number, String, Array, Set, Object, JSON, isFinite, parseFloat, Error};
vm.createContext(ctx);
ctx.D = {pt: JSON.parse(fs.readFileSync(path.join(ROOT, 'py', 'pt.json'), 'utf8'))};
const files = ['10-chem.js'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^2\d-.*\.js$/.test(f)).sort());
vm.runInContext(files.map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n') + '\n;globalThis.X_ = {TPLS, rng, finishItem, ansTextF};', ctx);
const X = ctx.X_, out = {};
const skills = [...new Set(X.TPLS.map(t => t.s))];
const answer = it => it.k === 'mc' ? it.mc[0].t : it.fs.map(fd => (it.fs.length > 1 ? fd.lab + ': ' : '') + X.ansTextF(fd, fd.ans)).join(' · ');
for (const k of skills) {
  const ts = X.TPLS.filter(t => t.s === k).map((t, n) => ({t, n})).sort((a, b) => ((a.t.make(X.rng(7)).k === 'mc') - (b.t.make(X.rng(7)).k === 'mc')) || a.t.d - b.t.d || a.n - b.n).map(o => o.t);
  const first = ts[0], second = ts.find(t => t !== first && t.d > first.d) || ts.find(t => t !== first);
  out[k] = [first, second].filter(Boolean).map((T, n) => { const it = X.finishItem(T.make(X.rng(20261 + 97 * n + T.id.length))); const e = {t: T.name, q: it.q, s: it.x, a: answer(it)}; if (it.k === 'mc') e.c = X.rng(5 + n).shuf(it.mc.map(m => m.t)); return e; });
}
process.stdout.write(JSON.stringify(out));
