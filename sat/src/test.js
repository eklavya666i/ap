// Independent checks: math answer keys re-derived from the rendered text; RW bank structure.
const MATH = require("./math_gen.js");
const RW = require("./rw_bank.js").concat(require("./rw_bank2.js"), require("./load_gen.js")());
let fails = 0;
const bad = (msg, it) => { fails++; if (fails < 40) console.log("FAIL", msg, it ? JSON.stringify(it).slice(0, 400) : ""); };

const plain = h => String(h)
  .replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2")
  .replace(/<sup>(.*?)<\/sup>/g, (m, a) => "^" + a.replace(/<[^>]+>/g, ""))
  .replace(/<[^>]+>/g, "").replace(/−/g, "-").replace(/(\d),(?=\d{3})/g, "$1");
function terms(s) {
  s = s.replace(/\s+/g, ""); const out = {}; const re = /([+-]?)(\d*\.?\d*)([a-z](?:\^2)?)?/g; let m;
  while ((m = re.exec(s))) { if (m[0] === "") { re.lastIndex++; continue; } if (m[2] === "" && !m[3]) continue;
    const sg = m[1] === "-" ? -1 : 1, v = m[3] || "1", c = m[2] === "" ? 1 : Number(m[2]); out[v] = (out[v] || 0) + sg * c; }
  return out;
}
const nums = s => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const val = s => { const p = plain(s).replace(/π/g, "").replace(/%/g, ""); const f = p.match(/^(-?\d+)\/(\d+)$/); return f ? f[1] / f[2] : Number(p); };
const close = (a, b) => Math.abs(a - b) < 1e-9;

const V = {
  lin1(it) { const [F, r, T] = (plain(it.stem).match(/\$(\d+)/g) || []).map(x => +x.slice(1)); return close((T - F) / r, it.ans); },
  linfun(it) { const [[x1, y1], [x2, y2]] = it.tb.r.map(r => r.map(v => +plain(v))); const m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
    const t = terms(plain(it.choices[it.ans]).split("=")[1]); return close(t.x || 0, m) && close(t["1"] || 0, b); },
  sys(it) { const e = it.eqs.map(q => { const [l, r] = plain(q).split("="); const t = terms(l); return [t.x || 0, t.y || 0, +r]; });
    const [a1, b1, c1] = e[0], [a2, b2, c2] = e[1], det = a1 * b2 - a2 * b1, x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det;
    return close(/x \+ y\?/.test(plain(it.stem)) ? x + y : x - y, it.ans); },
  ineq(it) { const n = nums(plain(it.stem)).filter(v => v > 0); const [W, D, B] = n;
    if (it.type === "mc") return plain(it.choices[it.ans]) === `${D} + ${B}n ≤ ${W}`;
    return close(Math.floor((W - D) / B), it.ans); },
  nosol(it) { const [l1, r1] = plain(it.eqs[0]).split("="), t1 = terms(l1); const p2 = plain(it.eqs[1]); const mm = p2.match(/([+-]) (\d+)y/); const d = (mm[1] === "-" ? -1 : 1) * +mm[2], e = +p2.split("=")[1];
    const k = t1.x * d / t1.y; return close(k, val(it.choices[it.ans])) && !close(e, +r1 * d / t1.y); },
  quad(it) { const t = terms(plain(it.eqs[0]).split("=")[0]); const B = t.x || 0, C = t["1"] || 0, D = Math.sqrt(B * B - 4 * C);
    const roots = [(-B + D) / 2, (-B - D) / 2].filter(r => r > 0); return roots.length === 1 && close(roots[0], it.ans); },
  expo(it) { const m = plain(it.stem).match(/= (\d+)\((\d*\.?\d+)\)\^t/); const F = +m[2], r = Math.round(Math.abs(F - 1) * 100);
    const c = plain(it.choices[it.ans]); return c.includes(`by ${r}%.`) && c.includes(F > 1 ? "increases" : "decreases"); },
  expand(it) { const m = plain(it.stem).match(/\(([^)]+)\)\(([^)]+)\)/); const a = terms(m[1]), b = terms(m[2]);
    return close(a.x * (b["1"] || 0) + (a["1"] || 0) * b.x, val(it.choices[it.ans])); },
  vertex(it) { const p = plain(it.stem); const z = [...p.matchAll(/\(x ([+-]) (\d+)\)/g)].map(m => (m[1] === "-" ? 1 : -1) * +m[2]);
    const h = (z[0] + z[1]) / 2, k = (h - z[0]) * (h - z[1]); return close(p.includes("minimum value") ? k : h, it.ans); },
  comp(it) { const p = plain(it.stem); const a = +p.match(/f\(x\) = x\^2 - (\d+)/)[1]; const g = terms(p.match(/g\(x\) = (.+?)\. What/)[1]);
    const k = +p.match(/f\(g\((-?\d+)\)\)/)[1]; const gk = g.x * k + (g["1"] || 0); return close(gk * gk - a, val(it.choices[it.ans])); },
  pct(it) { const p = plain(it.stem); const inc = +p.match(/increased by (\d+)%/)[1], dec = +p.match(/decreased by (\d+)%/)[1];
    return close((100 + inc) * (100 - dec) / 100, val(it.choices[it.ans])); },
  rate(it) { const [B, M, H] = nums(plain(it.stem)); return close(B * 60 / M * H, it.ans); },
  mean(it) { const [n, m, n1, m2] = nums(plain(it.stem)); return n1 === n + 1 && close(n1 * m2 - n * m, it.ans); },
  prob(it) { const t = it.tb.r.map(r => r.slice(1).map(Number)); const [a, b] = t[0], [c, d] = t[1];
    const want = /10th graders surveyed/.test(it.stem) ? d / (c + d) : a / (a + c); return close(want, val(it.choices[it.ans])); },
  tri(it) { const p = plain(it.stem), n = nums(p).filter(v => v > 0); return p.includes("length of AB") ? close(Math.hypot(n[0], n[1]), it.ans) : close(Math.sqrt(n[0] ** 2 - n[1] ** 2), it.ans); },
  trig(it) { const p = plain(it.stem); const m = p.match(/sin P = (\d+)\/(\d+)/); if (m) return close(m[1] / m[2], val(it.choices[it.ans]));
    const x = +p.match(/measures (\d+)°/)[1]; return close(90 - x, val(it.choices[it.ans])); },
  circ(it) { const t = terms(plain(it.eqs[0]).split("=")[0]); const r = Math.sqrt((t.x / 2) ** 2 + (t.y / 2) ** 2 - (t["1"] || 0)); return close(r, val(it.choices[it.ans])); },
  vol(it) { const p = plain(it.stem); let m;
    if ((m = p.match(/radius of (\d+) centimeters and a height of (\d+)/))) return close(m[1] * m[1] * m[2], val(it.choices[it.ans]));
    if ((m = p.match(/each (\d+) times/))) return close(m[1] ** 3, val(it.choices[it.ans]));
    if ((m = p.match(/each 1\/(\d+) of/))) return close(1 / m[1] ** 3, val(it.choices[it.ans]));
    m = p.match(/radius .* multiplied by (\d+), and its height is multiplied by (\d+)/); return close(m[1] ** 2 * m[2], val(it.choices[it.ans])); },
  ang(it) { const p = plain(it.stem); const ex = L => { const m = p.match(new RegExp(`angle ${L} is \\(?([^)°]+)\\)?°`)); return terms(m[1]); };
    const A = ex("A"), B = ex("B"), C = ex("C"); const P = (A.x || 0) + (B.x || 0) + (C.x || 0), K = (A["1"] || 0) + (B["1"] || 0) + (C["1"] || 0);
    const x = (180 - K) / P; return close(p.includes("value of x") ? x : A.x * x + (A["1"] || 0), it.ans); }
};

const seen = {};
for (const [dom, keys] of Object.entries(MATH.DOM)) for (const key of keys) {
  let n = 0, pos = [0, 0, 0, 0]; const stems = new Set();
  for (let seed = 1; seed <= 3000; seed++) {
    let it; try { it = MATH.make(key, seed * 104729); } catch (e) { bad(key + " threw " + e.message); continue; }
    n++; stems.add(it.stem + (it.eqs || []).join());
    const all = JSON.stringify(it);
    if (/NaN|undefined|Infinity|null%|\[object/.test(all.replace(/"m":null|"no":\[[^\]]*null[^\]]*\]/g, ""))) bad(key + " bad token", it);
    if (it.d !== dom) bad(key + " domain");
    if (!it.why || !it.stem) bad(key + " empty text", it);
    if (it.type === "mc") {
      if (it.choices.length !== 4 || new Set(it.choices).size !== 4) bad(key + " choices not 4 distinct", it);
      if (!(it.ans >= 0 && it.ans < 4) || it.no[it.ans] !== null || it.no.filter(x => x).length !== 3) bad(key + " key/rationale", it);
      pos[it.ans]++;
    } else {
      if (!Number.isInteger(it.ans)) bad(key + " spr non-integer", it);
      (it.traps || []).forEach(t => { if (!isFinite(t.v) || close(t.v, it.ans)) bad(key + " trap", it); });
    }
    let ok; try { ok = V[key](it); } catch (e) { ok = false; bad(key + " verifier threw " + e.message, it); }
    if (!ok) bad(key + " WRONG KEY", it);
  }
  seen[key] = { n, variety: stems.size, pos: pos.join("/") };
}
console.table(seen);

// ---- RW bank
const SK = { CS: ["WIC", "TSP", "CTC"], II: ["CID", "CET", "CEQ", "INF"], SEC: ["BOU", "FSS"], EOI: ["TRA", "RS"] };
const ids = new Set(); const longest = { tot: 0, c: 0 }; const byD = {};
for (const it of RW) {
  if (ids.has(it.id)) bad("dup id " + it.id); ids.add(it.id);
  if (!SK[it.d] || !SK[it.d].includes(it.s)) bad("bad d/s " + it.id);
  if (!it.a || !Array.isArray(it.w) || it.w.length !== 3 || !Array.isArray(it.no) || it.no.length !== 3 || !it.why) bad("shape " + it.id);
  if (new Set([it.a, ...it.w]).size !== 4) bad("dup choices " + it.id);
  if (it.s === "RS" ? !(it.notes && it.goal) : !it.p) bad("missing passage/notes " + it.id);
  if (it.s === "CTC" && !it.t2) bad("CTC needs t2 " + it.id);
  if (it.s === "CEQ" && !it.tb) bad("CEQ needs table " + it.id);
  if (/underlined/.test(it.q) && !/\[\[.+\]\]/.test(it.p)) bad("underline missing " + it.id);
  if (["wic", "conv", "tra", "inf"].includes(it.q) && !/_{6}/.test(it.p)) bad("blank missing " + it.id);
  if (JSON.stringify(it).includes('\\"')) bad("straight quote " + it.id);
  const L = [it.a, ...it.w].map(s => s.length); longest.tot++; if (L[0] === Math.max(...L)) longest.c++;
  byD[it.d] = (byD[it.d] || 0) + 1;
}
console.log("RW items:", RW.length, byD, "correct is longest:", longest.c + "/" + longest.tot);
console.log(fails ? `${fails} FAILURES` : "ALL CHECKS PASSED");
