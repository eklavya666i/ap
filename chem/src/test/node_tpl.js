// Generates items from every template and checks them for internal consistency.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..'), N = +(process.argv[2] || 300), ONLY = process.argv[3] || '';
const ctx = {console, Math, Number, String, Array, Set, Object, JSON, isFinite, parseFloat, Error};
vm.createContext(ctx);
ctx.D = {pt: JSON.parse(fs.readFileSync(path.join(ROOT, 'py', 'pt.json'), 'utf8'))};
const files = ['10-chem.js'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^2\d-.*\.js$/.test(f)).sort());
vm.runInContext(files.map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n') + '\n;globalThis.X_ = {TABLES: (() => { const t = {}; "MOLS IMF BONDS EQS ACIDS MOLEC POLY IONSV ISO IONQ ABUND MGQ TRENDEL CATF CATQ CATV ANM FAMEL METALLOIDS IONS_MG METALS PRED SCI GASES SOLS ACIDB BASES NUCS".split(" ").forEach(k => { try { t[k] = eval(k); } catch (e) {} }); return t; })(), TPLS, rng, finishItem, typedOf, gradeFields, ansTextF, fmtSF, niceN, chgTxt, typeof_DRILLS: typeof DRILLS, DRILLS: typeof DRILLS !== "undefined" ? DRILLS : [], drillQ: typeof drillQ !== "undefined" ? drillQ : null};', ctx);
const X = ctx.X_;
const canon = fd => fd.t === 'num' ? (fd.sf ? X.fmtSF(fd.ans, fd.sf, fd.fmt === 'sci' ? 'sci' : fd.fmt === 'fix' ? 'fix' : undefined) : X.niceN(fd.ans, 8)) : fd.t === 'chg' ? X.chgTxt(fd.ans) : fd.t === 'coef' ? fd.ans.map(String) : String(fd.ans);
const trapTyped = (fd, v, sh) => X.typedOf(fd, v, sh);
const bad = [], stats = {}, out = [];
const strs = it => [it.q].concat(it.h || [], (it.x || []).flat(), (it.mc || []).map(m => m.t + ' ' + (m.why || '')), (it.traps || []).map(t => t.why), (it.fs || []).map(f => f.lab || ''));
for (const T of X.TPLS) {
  if (ONLY && !T.id.startsWith(ONLY)) continue;
  stats[T.id] = {n: 0, bad: 0};
  for (let s = 1; s <= N; s++) {
    const seed = s * 7919 + 13; let it;
    try { it = X.finishItem(T.make(X.rng(seed))); } catch (e) { bad.push([T.id, seed, 'throws', String(e).slice(0, 160)]); stats[T.id].bad++; continue; }
    stats[T.id].n++;
    const fail = m => { bad.push([T.id, seed, m]); stats[T.id].bad++; };
    if (!it || !it.q) { fail('no prompt'); continue; }
    if (!it.h || it.h.length < 2 || !it.x || !it.x.length) fail('hints/steps missing');
    const joined = strs(it).join(' | ');
    if (/\bNaN\b|undefined|Infinity|\[object|\bnull\b/.test(joined)) fail("bad text: " + joined.match(/.{0,60}(\bNaN\b|undefined|Infinity|\[object|\bnull\b).{0,40}/)[0]);
    if ((joined.match(/\$/g) || []).length % 2 && !/\$\$/.test(joined)) { /* odd $ counts are checked per string below */ }
    strs(it).forEach(t => { if (((t || '').match(/\$/g) || []).length % 2) fail('odd $ in: ' + t.slice(0, 80)); });
    if (it.k === 'mc') {
      if (!it.mc || it.mc.length < 2) fail('mc too few');
      const ts = it.mc.map(m => m.t); if (new Set(ts).size !== ts.length) fail('mc duplicate: ' + ts.join(' / '));
      if (it.mc.slice(1).some(m => !m.why)) fail('mc missing why');
      out.push({id: T.id, seed, k: 'mc', q: it.q, mc: it.mc.map(m => m.t), chk: it.chk});
      continue;
    }
    if (!it.fs || !it.fs.length) { fail('no fields'); continue; }
    const typed = {}; it.fs.forEach(fd => { typed[fd.id] = canon(fd); });
    const g = X.gradeFields(it, typed); if (!g.ok) fail('canonical rejected: ' + JSON.stringify(typed) + ' -> ' + (g.msg || '').slice(0, 120));
    (it.traps || []).forEach((t, k) => {
      const fd = it.fs.find(f => f.id === t.f); if (!fd) { fail('trap for unknown field ' + t.f); return; }
      if (!t.why) fail('trap without why');
      const ty = Object.assign({}, typed); ty[fd.id] = trapTyped(fd, t.v, t.s);
      const gg = X.gradeFields(it, ty); if (gg.ok) fail('trap ' + k + ' accepted: ' + JSON.stringify(ty[fd.id]));
    });
    const choices = new Set([it.fs.map(fd => X.ansTextF(fd, fd.ans)).join('; ')]);
    (it.traps || []).forEach(t => { choices.add(it.fs.map(fd => X.ansTextF(fd, fd.id === t.f ? t.v : fd.ans, fd.id === t.f ? t.s : undefined)).join('; ')); });
    if (choices.size < 2) fail('fewer than 2 choices for the multiple-choice fallback');
    out.push({id: T.id, seed, q: it.q, fs: it.fs, traps: it.traps, chk: it.chk});
  }
}
fs.writeFileSync(path.join(__dirname, 'items.json'), JSON.stringify(out)); fs.writeFileSync(path.join(__dirname, 'tables.json'), JSON.stringify(X.TABLES));
const ids = Object.keys(stats);
console.log('templates:', ids.length, 'items:', out.length, 'problems:', bad.length);
const byT = {}; bad.forEach(b => { (byT[b[0]] = byT[b[0]] || []).push(b); });
Object.keys(byT).forEach(k => { console.log(' ', k, byT[k].length, 'e.g.', JSON.stringify(byT[k][0]).slice(0, 300)); });
const sk = {}; X.TPLS.forEach(t => { sk[t.s] = (sk[t.s] || []).concat(t.d); }); console.log('skills:', Object.keys(sk).length, JSON.stringify(sk));
if (X.DRILLS.length) { let db = 0; X.DRILLS.forEach(d => { for (let k = 0; k < 200; k++) { const g = X.drillQ(d); if (!g || g.c.length !== 4 || new Set(g.c).size !== 4 || /\bNaN\b|undefined/.test(JSON.stringify(g))) { db++; if (db < 6) console.log('drill problem', d.id, JSON.stringify(g)); break; } } }); console.log('drills:', X.DRILLS.length, 'drill problems:', db); }
