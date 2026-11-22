// Math 6 engine core: seeded numbers, exact fractions, answer checking, and math read aloud.
// build.js inlines this file into the app; test.js loads it as a module.
const M6 = (() => {
const MI = "−";

// ---------- Seeded random numbers (the generator SAT Daily's math_gen.js uses)
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function shuffle(R, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// ---------- Exact rationals: answers compare as fractions, so 0.1 + 0.2 is exactly 3/10
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
class Q {
  constructor(n, d = 1) {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error(`bad fraction ${n}/${d}`);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    this.n = n / g; this.d = d / g;
  }
  static of(v) {
    if (v instanceof Q) return v;
    if (typeof v === "number" && Number.isInteger(v)) return new Q(v);
    if (typeof v === "number") return fromDecimal(String(v));
    const p = parse(String(v));
    if (!p || p.form === "ratio") throw new Error("not a number: " + v);
    return p.q;
  }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); if (o.n === 0) throw new Error("divide by zero"); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  abs() { return new Q(Math.abs(this.n), this.d); }
  cmp(o) { o = Q.of(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  get int() { return this.d === 1; }
  get value() { return this.n / this.d; }
  // "3/4", "−3/4", "5"
  frac() { return (this.n < 0 ? MI : "") + Math.abs(this.n) + (this.d === 1 ? "" : "/" + this.d); }
  // "2 1/3" for improper fractions, otherwise the same as frac()
  mixed() {
    const a = Math.abs(this.n);
    if (this.d === 1 || a < this.d) return this.frac();
    return (this.n < 0 ? MI : "") + Math.floor(a / this.d) + " " + (a % this.d) + "/" + this.d;
  }
  // The exact decimal, or null when it never ends (1/3)
  dec() {
    let d = this.d, twos = 0, fives = 0;
    while (d % 2 === 0) { d /= 2; twos++; }
    while (d % 5 === 0) { d /= 5; fives++; }
    if (d !== 1) return null;
    const k = Math.max(twos, fives), p = 10 ** k, m = Math.abs(this.n) * (p / this.d);
    const whole = Math.floor(m / p), part = k ? String(m % p).padStart(k, "0").replace(/0+$/, "") : "";
    return (this.n < 0 ? MI : "") + whole + (part ? "." + part : "");
  }
  toString() { return this.frac(); }
}
function fromDecimal(s) {
  s = String(s).replace(/−/g, "-");
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === "" && !m[3])) throw new Error("not a plain decimal: " + s);
  const f = m[3] || "";
  const q = new Q(Number((m[2] || "0") + f), 10 ** f.length);
  return m[1] ? q.neg() : q;
}

// ---------- Reading what the student typed
// Accepts 24, −8, 0.45, .5, 3/4, −3/4, 2 1/3, $4.25, 75%, 2,500, 4:10 and "x = 24".
// Returns {q, form, raw} or null. form: int | dec | frac | mixed | money | pct | ratio.
function parse(input) {
  let s = String(input == null ? "" : input).trim()
    .replace(/[−–—]/g, "-").replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").replace(/\s*:\s*/g, ":");
  s = s.replace(/^[a-z]\s*=\s*/i, "");
  if (/^-?\$?\d{1,3}(,\d{3})+(\.\d+)?%?$/.test(s)) s = s.replace(/,/g, "");
  let m;
  if ((m = s.match(/^(-?)\$(\d+)(?:\.(\d{1,2}))?$/)) || (m = s.match(/^\$(-)(\d+)(?:\.(\d{1,2}))?$/))) {
    const q = fromDecimal((m[1] ? "-" : "") + m[2] + (m[3] ? "." + m[3] : ""));
    return {q, form: "money", raw: s};
  }
  if ((m = s.match(/^(-?\d*\.?\d+)%$/))) return {q: fromDecimal(m[1]), form: "pct", raw: s};
  if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) {
    const w = Number(m[2]), n = Number(m[3]), d = Number(m[4]);
    if (!d || n >= d) return null;
    const q = new Q(w * d + n, d);
    return {q: m[1] ? q.neg() : q, form: "mixed", raw: s, n, d};
  }
  if ((m = s.match(/^(-?)(\d+)\/(\d+)$/))) {
    const n = Number(m[2]), d = Number(m[3]);
    if (!d) return null;
    const q = new Q(n, d);
    return {q: m[1] ? q.neg() : q, form: "frac", raw: s, n, d};
  }
  if ((m = s.match(/^(\d*\.?\d+):(\d*\.?\d+)$/))) {
    const a = fromDecimal(m[1]), b = fromDecimal(m[2]);
    if (b.n === 0) return null;
    return {q: a.div(b), form: "ratio", raw: s, parts: [a, b]};
  }
  if ((m = s.match(/^-?\d*\.?\d+$/))) return {q: fromDecimal(s), form: s.includes(".") ? "dec" : "int", raw: s};
  return null;
}

// ---------- Checking an answer
// spec: {ans, form?: "simplest" | "decimal" | "fraction" | "mixed" | "ratio", unit?: "%" | "$",
//        traps?: [{v, m, mis}]}
// Returns {ok, close?, msg?, mis?}. "close" means the right value in the wrong form: no miss.
function check(spec, input) {
  const p = parse(input);
  if (!p) return {ok: false, unread: true, msg: "Type a number, like 3/4, 2 1/3, 0.45 or −8."};
  if (spec.form === "ratio" || Array.isArray(spec.ans)) {
    const [a, b] = (Array.isArray(spec.ans) ? spec.ans : spec.ans.parts).map(Q.of);
    if (p.form !== "ratio") return {ok: false, msg: `Write it as a ratio with a colon, like ${a.frac()}:${b.frac()}.`};
    if (!p.q.eq(a.div(b))) return trap(spec, p) || {ok: false};
    if (spec.simplest && (p.parts[0].d !== 1 || p.parts[1].d !== 1 || gcd(p.parts[0].n, p.parts[1].n) !== 1))
      return {ok: false, close: true, msg: "Equivalent ratio. Now write it in simplest form."};
    return {ok: true};
  }
  const want = Q.of(spec.ans);
  if (p.form === "ratio") return {ok: false, msg: "Write a single number, not a ratio."};
  if (!p.q.eq(want)) return trap(spec, p) || {ok: false};
  if (spec.form === "simplest" && (p.form === "frac" || p.form === "mixed") && gcd(p.n, p.d) !== 1)
    return {ok: false, close: true, msg: "Right value. Now write it in simplest form."};
  if (spec.form === "decimal" && (p.form === "frac" || p.form === "mixed"))
    return {ok: false, close: true, msg: "Right value. Now write it as a decimal."};
  if (spec.form === "fraction" && p.form === "dec")
    return {ok: false, close: true, msg: "Right value. Now write it as a fraction."};
  if (spec.form === "mixed" && p.form === "frac" && !want.int && Math.abs(want.n) > want.d)
    return {ok: false, close: true, msg: "Right value. Now write it as a mixed number."};
  return {ok: true};
}
function trap(spec, p) {
  for (const t of spec.traps || []) {
    let v; try { v = Q.of(t.v); } catch (e) { continue; }
    if (p.q.eq(v)) return {ok: false, msg: t.m, mis: t.mis || null};
  }
  return null;
}

// ---------- Display helpers (same conventions as SAT Daily)
const fn = v => { const q = Q.of(v); return q.int ? (q.n < 0 ? MI : "") + Math.abs(q.n).toLocaleString("en-US") : (q.dec() || q.frac()); };
const fr = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const money = v => { const q = Q.of(v), c = q.mul(100); if (!c.int) throw new Error("money must be whole cents: " + q); const n = Math.abs(c.n);
  return (q.n < 0 ? MI : "") + "$" + Math.floor(n / 100).toLocaleString("en-US") + (n % 100 ? "." + String(n % 100).padStart(2, "0") : ""); };

// ---------- Reading math aloud
// iPad voices can read "2/3" as a date and skip the "−" sign, so every spoken line goes through speak().
const ORD = {1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth",
  11: "eleventh", 12: "twelfth", 13: "thirteenth", 14: "fourteenth", 15: "fifteenth", 16: "sixteenth", 17: "seventeenth", 18: "eighteenth",
  19: "nineteenth", 20: "twentieth", 30: "thirtieth", 40: "fortieth", 50: "fiftieth", 60: "sixtieth", 70: "seventieth", 80: "eightieth",
  90: "ninetieth", 100: "hundredth"};
const TENS = {20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety"};
function ordinal(d) {
  if (ORD[d]) return ORD[d];
  if (d > 20 && d < 100) return TENS[d - (d % 10)] + "-" + ORD[d % 10];
  return null;
}
function fracWords(n, d) {
  n = Number(n); d = Number(d);
  if (d === 2) return `${n} ${n === 1 ? "half" : "halves"}`;
  const o = d === 4 ? "fourth" : ordinal(d);
  if (!o || d === 1) return `${n} over ${d}`;
  return `${n} ${o}${n === 1 ? "" : "s"}`;
}
const UNIT = {ft: "feet", in: "inches", cm: "centimeters", m: "meters", mm: "millimeters", yd: "yards", km: "kilometers", mi: "miles", units: "units", unit: "units"};
const dollars = (neg, d, c) => {
  const D = Number(d), C = Number(c || 0), parts = [];
  if (D || !C) parts.push(`${D} dollar${D === 1 ? "" : "s"}`);
  if (C) parts.push(`${C} cent${C === 1 ? "" : "s"}`);
  return (neg ? "negative " : "") + parts.join(" and ");
};
function speak(text) {
  let s = String(text)
    .replace(/<span class="fr"><span>([^<]+)<\/span><span>([^<]+)<\/span><\/span>/g, "$1/$2")
    .replace(/<sup>2<\/sup>/g, "²").replace(/<sup>3<\/sup>/g, "³").replace(/<sup>([^<]+)<\/sup>/g, "^$1")
    .replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, " and ").replace(/&nbsp;/g, " ")
    .replace(/\^2\b/g, "²").replace(/\^3\b/g, "³").replace(/-(?=\$?\d)/g, (m, i, str) => (i === 0 || /[\s(,|]/.test(str[i - 1])) ? MI : m);
  // units with powers: 30 ft³, 36 cm²
  s = s.replace(/(\d)\s*(ft|in|cm|mm|m|yd|km|mi|units?)([²³])/g, (m, d, u, p) => `${d} ${p === "²" ? "square" : "cubic"} ${UNIT[u]}`);
  // money
  s = s.replace(/(−?)\$(\d[\d,]*)(?:\.(\d{2}))?/g, (m, neg, d, c) => dollars(!!neg, d.replace(/,/g, ""), c));
  // absolute value and points
  s = s.replace(/\|([^|]+)\|/g, "the absolute value of $1");
  s = s.replace(/\((−?\d+(?:\.\d+)?), ?(−?\d+(?:\.\d+)?)\)/g, "the point $1, $2");
  // mixed numbers, fractions, variables over numbers, ratios, percents
  s = s.replace(/(−?)(\d+) (\d+)\/(\d+)/g, (m, neg, w, n, d) => `${neg ? "negative " : ""}${w} and ${fracWords(n, d)}`);
  s = s.replace(/(−?)(\d+)\/(\d+)/g, (m, neg, n, d) => `${neg ? "negative " : ""}${fracWords(n, d)}`);
  s = s.replace(/\b([a-z])\/(\d+)/g, "$1 divided by $2");
  s = s.replace(/(\d)(?: : |:)(\d)/g, "$1 to $2");      // "4:6" or "4 : 6", but not "by 2: 6"
  s = s.replace(/(\d)\s?%/g, "$1 percent");
  // powers
  s = s.replace(/([\da-z])²/g, "$1 squared").replace(/([\da-z])³/g, "$1 to the third power").replace(/([\da-z])\^(\d+)/g, (m, b, e) => `${b} to the ${ordinal(Number(e)) || e} power`);
  // comparisons and operations
  s = s.replace(/\s*≥\s*/g, " is greater than or equal to ").replace(/\s*≤\s*/g, " is less than or equal to ")
    .replace(/\s+>\s+/g, " is greater than ").replace(/\s+<\s+/g, " is less than ").replace(/\s*=\s*/g, " equals ")
    .replace(/\s*×\s*/g, " times ").replace(/\s*÷\s*/g, " divided by ").replace(/\s+\+\s+/g, " plus ").replace(/\s+[−-]\s+/g, " minus ");
  s = s.replace(/−(?=\d)/g, "negative ");
  // 2(3 + 4) → 2 times the quantity 3 plus 4; 3x → 3 x
  // only after a number or a one-letter variable, so "the cost (in cents)" is left alone
  s = s.replace(/(\d)\s?\(/g, "$1 times the quantity ").replace(/(^|[^A-Za-z])([a-z])\s?\(/g, "$1$2 times the quantity ").replace(/[()]/g, " ");
  s = s.replace(/(\d)([a-z])(?![a-z])/g, "$1 $2");
  // decimals: 12.6 → 12 point 6, 0.45 → 0 point 4 5
  s = s.replace(/(\d+)\.(\d+)/g, (m, w, f) => `${w} point ${f.split("").join(" ")}`);
  return s.replace(/\s+([,.?!])/g, "$1").replace(/\s{2,}/g, " ").trim();
}
// What must never reach the voice: raw math symbols, or a decimal point between digits
const UNSPOKEN = /[\/^\u2212<>\u2264\u2265\u00d7\u00f7=|\u00b2\u00b3$%]|\d ?:\d|\d\.\d/;     // "Step 2: 6 more" is prose; "2:6" is not

return {MI, rng, ri, pick, shuffle, gcd, lcm, Q, fromDecimal, parse, check, fn, fr, money, fracWords, ordinal, speak, UNSPOKEN};
})();
if (typeof module !== "undefined") module.exports = M6;
