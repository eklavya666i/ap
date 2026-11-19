// Math generators: each template builds a fresh SAT-style item from a seed.
// Item: {type:'mc'|'spr', stem, eqs?, tb?, choices?, ans, no?, why, traps?}
const MATH = (() => {
const MI = "−";
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function shuffle(R, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function fa(v) { v = Math.abs(v); if (Number.isInteger(v)) return v >= 1000 ? v.toLocaleString("en-US") : String(v); return String(+v.toFixed(4)); }
const fn = v => (v < 0 ? MI : "") + fa(v);
const fp = v => (v < 0 ? "(" + fn(v) + ")" : fn(v));
const X = "<i>x</i>", Y = "<i>y</i>";
const sq = v => v + "<sup>2</sup>";
const money = v => "$" + fa(v);
const fr = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
function ex(terms) {
  let out = "";
  for (const [c, v] of terms) {
    if (!c) continue;
    const body = v ? (Math.abs(c) === 1 ? v : fa(c) + v) : fa(c);
    out += out === "" ? (c < 0 ? MI : "") + body : (c < 0 ? " " + MI + " " : " + ") + body;
  }
  return out || "0";
}
const kx = (k, inner) => (k === 1 ? inner : k === -1 ? MI + inner : fn(k) + inner);
const fx = (v, V = X) => (v < 0 ? `(${V} + ${-v})` : `(${V} ${MI} ${v})`);
function mc(R, opts, numeric) {
  const arr = numeric ? opts.slice().sort((a, b) => a.v - b.v) : shuffle(R, opts);
  return { choices: arr.map(o => o.t), ans: arr.findIndex(o => o.m === null), no: arr.map(o => o.m) };
}
const distinct = a => new Set(a.map(String)).size === a.length;
// Pick 3 distractors from a pool so the right answer lands in a random sorted position.
function pool3(R, c, cands) {
  const seen = new Set([c.v.toFixed(9)]), P = [];
  for (const o of cands) { const k = isFinite(o.v) ? o.v.toFixed(9) : null; if (k === null || seen.has(k)) continue; seen.add(k); P.push(o); }
  const lo = shuffle(R, P.filter(o => o.v < c.v)), hi = shuffle(R, P.filter(o => o.v > c.v));
  const ks = [0, 1, 2, 3].filter(k => lo.length >= k && hi.length >= 3 - k);
  if (!ks.length) return null;
  const k = pick(R, ks);
  return mc(R, [c, ...lo.slice(0, k), ...hi.slice(0, 3 - k)], true);
}

const G = {};

// ---------------- Algebra ----------------
G.lin1 = { d: "ALG", s: "Linear equations in one variable", f(R) {
  const C = pick(R, [
    { intro: (F, r) => `A bike rental shop charges a flat fee of ${money(F)} plus ${money(r)} per hour.`, who: T => `Jenna paid ${money(T)} in total for one rental.`, ask: "For how many hours did she rent the bike?", u: "hours", F: [5, 15], r: [4, 12], n: [2, 9] },
    { intro: (F, r) => `A gym charges a one-time sign-up fee of ${money(F)} plus ${money(r)} per month.`, who: T => `Marcus has paid ${money(T)} in total, including the sign-up fee.`, ask: "For how many months has he been a member?", u: "months", F: [25, 75], r: [20, 45], n: [3, 12] },
    { intro: (F, r) => `A plumber charges ${money(F)} for a house call plus ${money(r)} for each hour of work.`, who: T => `One repair cost ${money(T)} in total.`, ask: "How many hours did the plumber work on this repair?", u: "hours", F: [40, 90], r: [45, 95], n: [2, 6] }
  ]);
  const F = ri(R, C.F[0], C.F[1]), r = ri(R, C.r[0], C.r[1]), n = ri(R, C.n[0], C.n[1]), T = F + r * n;
  const traps = [
    { v: T / r, m: `It looks like you divided the total by ${money(r)} without first subtracting the ${money(F)} fee.` },
    { v: (T + F) / r, m: `The ${money(F)} fee should be subtracted from the total, not added to it.` },
    { v: T - F, m: `${money(T - F)} is the cost of the ${C.u} alone. Divide it by ${money(r)} to get the number of ${C.u}.` }
  ].filter(t => Math.abs(t.v - n) > 1e-9);
  return { type: "spr", stem: `${C.intro(F, r)} ${C.who(T)} ${C.ask}`, ans: n, traps,
    why: `Let <i>n</i> be the number of ${C.u}. Then ${fa(F)} + ${fa(r)}<i>n</i> = ${fa(T)}. Subtract ${fa(F)} from both sides: ${fa(r)}<i>n</i> = ${fa(T - F)}. Divide both sides by ${fa(r)}: <i>n</i> = ${n}.` };
} };

G.linfun = { d: "ALG", s: "Linear functions", f(R) {
  const m = pick(R, [-4, -3, -2, 2, 3, 4, 5]), b = ri(R, -9, 9), x1 = ri(R, 1, 3), d = ri(R, 2, 3), x2 = x1 + d;
  if (b === 0 || b === m) return null;
  const y1 = m * x1 + b, y2 = m * x2 + b, dy = y2 - y1;
  const eq = (a, c) => `<i>f</i>(<i>x</i>) = ${ex([[a, X], [c, ""]])}`;
  const opts = [
    { t: eq(m, b), m: null },
    { t: eq(m, y1), m: `This uses <i>f</i>(${x1}) = ${fn(y1)} as the <i>y</i>-intercept, but the <i>y</i>-intercept is the value of <i>f</i>(0).` },
    { t: eq(dy, y1 - dy * x1), m: `This uses the change in <i>f</i>(<i>x</i>), ${fn(dy)}, as the slope without dividing by the change in <i>x</i>, ${d}.` },
    { t: eq(b, m), m: "This swaps the slope and the <i>y</i>-intercept." }
  ];
  if (!distinct(opts.map(o => o.t))) return null;
  return { type: "mc", stem: "The table shows two values of <i>x</i> and the corresponding values of <i>f</i>(<i>x</i>) for a linear function <i>f</i>. Which equation defines <i>f</i>?",
    tb: { h: ["<i>x</i>", "<i>f</i>(<i>x</i>)"], r: [[fn(x1), fn(y1)], [fn(x2), fn(y2)]] }, ...mc(R, opts, false),
    why: `The slope is (${fn(y2)} ${MI} ${fp(y1)}) ÷ (${x2} ${MI} ${x1}) = ${fn(dy)} ÷ ${d} = ${fn(m)}. Use a point to find the <i>y</i>-intercept <i>b</i>: ${fn(y1)} = ${fn(m)}(${x1}) + <i>b</i>, so <i>b</i> = ${fn(b)}. That gives ${eq(m, b)}.` };
} };

G.sys = { d: "ALG", s: "Systems of linear equations", f(R) {
  const a = ri(R, 1, 7), b = ri(R, 1, 7); if (a === b) return null;
  const x = ri(R, -6, 9), y = ri(R, -6, 9); if (!x || !y || x === y) return null;
  const c = a * x + b * y, f = b * x + a * y, sum = R() < 0.6, ans = sum ? x + y : x - y;
  if (!ans) return null;
  const ask = sum ? `<i>x</i> + <i>y</i>` : `<i>x</i> ${MI} <i>y</i>`, k = a - b;
  const why = sum
    ? `Add the two equations: ${ex([[a + b, X], [a + b, Y]])} = ${fn(c + f)}, so ${a + b}(<i>x</i> + <i>y</i>) = ${fn(c + f)}. Divide by ${a + b}: <i>x</i> + <i>y</i> = ${fn(ans)}. (Solving fully gives <i>x</i> = ${fn(x)} and <i>y</i> = ${fn(y)}.)`
    : `Subtract the second equation from the first: ${ex([[k, X], [-k, Y]])} = ${fn(c - f)}, so ${kx(k, `(<i>x</i> ${MI} <i>y</i>)`)} = ${fn(c - f)}. Divide by ${fp(k)}: <i>x</i> ${MI} <i>y</i> = ${fn(ans)}. (Solving fully gives <i>x</i> = ${fn(x)} and <i>y</i> = ${fn(y)}.)`;
  const traps = [
    { v: x, m: `${fn(x)} is the value of <i>x</i> alone. The question asks for ${ask}.` },
    { v: y, m: `${fn(y)} is the value of <i>y</i> alone. The question asks for ${ask}.` },
    sum ? { v: c + f, m: `${fn(c + f)} is the sum of the right sides. Divide it by ${a + b}.` } : { v: x + y, m: `That’s <i>x</i> + <i>y</i>. The question asks for <i>x</i> ${MI} <i>y</i>.` }
  ].filter(t => t.v !== ans);
  return { type: "spr", stem: `If (<i>x</i>, <i>y</i>) is the solution to the system of equations below, what is the value of ${ask}?`,
    eqs: [`${ex([[a, X], [b, Y]])} = ${fn(c)}`, `${ex([[b, X], [a, Y]])} = ${fn(f)}`], ans, why, traps };
} };

G.ineq = { d: "ALG", s: "Linear inequalities", f(R) {
  const van = R() < 0.5;
  let W, D, B, stem;
  if (van) {
    W = pick(R, [1200, 1500, 1800, 2000, 2400]); D = ri(R, 140, 220); B = pick(R, [35, 40, 45, 50, 55, 60, 65, 70, 75]);
    stem = `A delivery van can safely carry at most ${fa(W)} pounds of passengers and cargo. The driver weighs ${D} pounds, and each box of supplies weighs ${B} pounds. What is the greatest number of boxes the van can carry on a trip with the driver?`;
  } else {
    W = ri(R, 30, 60); D = ri(R, 5, 15); B = pick(R, [3, 4, 6, 7, 8, 9]);
    stem = `Ana has $${W} to spend at a county fair. Admission costs $${D}, and each ride ticket costs $${B}. If she pays for admission, what is the greatest number of ride tickets she can buy?`;
  }
  if ((W - D) % B === 0 || D === B) return null;
  const n = Math.floor((W - D) / B), a = Math.floor(W / B), c = Math.floor((W + D) / B);
  const N = "<i>n</i>", Wt = fa(W), unit = van ? "boxes" : "ride tickets";
  if (R() < 0.45) {
    const ie = (x, y, op, z) => `${x} + ${y}${N} ${op} ${z}`;
    const opts = [
      { t: ie(D, B, "≤", Wt), m: null },
      { t: ie(D, B, "≥", Wt), m: `“At most” means the total can’t go over ${van ? Wt + " pounds" : "$" + W}, so the inequality needs ≤, not ≥.` },
      { t: ie(B, D, "≤", Wt), m: van ? `This multiplies the driver’s weight by the number of boxes. The driver counts once; each box adds ${B} pounds.` : `This multiplies the admission by the number of tickets. Admission is paid once; each ticket adds $${B}.` },
      { t: `${B}${N} ≤ ${Wt} + ${D}`, m: van ? "This adds the driver’s weight to the limit. The driver’s weight uses up part of the limit." : "This adds the admission to the budget. Admission uses up part of the budget." }
    ];
    return { type: "mc", stem: `${stem.replace(/ What is the greatest.*$/, "").replace(/ If she pays.*$/, "")} Which inequality represents the possible numbers of ${unit}, ${N}, ${van ? "the van can carry on a trip with the driver" : "Ana can buy if she pays for admission"}?`, ...mc(R, opts, false),
      why: `The total is the one-time amount plus ${B} for each of the ${N} ${unit}: ${D} + ${B}${N}. “At most” means the total must be less than or equal to the limit, so ${ie(D, B, "≤", Wt)}.` };
  }
  const q = ((W - D) / B).toFixed(2);
  const why = van
    ? `Let <i>n</i> be the number of boxes. The total weight must satisfy ${D} + ${B}<i>n</i> ≤ ${fa(W)}. Subtract ${D}: ${B}<i>n</i> ≤ ${fa(W - D)}. Divide by ${B}: <i>n</i> ≤ about ${q}. The number of boxes must be a whole number, so the greatest possible value is ${n}.`
    : `Let <i>n</i> be the number of tickets. The total cost must satisfy ${D} + ${B}<i>n</i> ≤ ${W}. Subtract ${D}: ${B}<i>n</i> ≤ ${W - D}. Divide by ${B}: <i>n</i> ≤ about ${q}. Tickets come in whole numbers, so the greatest possible value is ${n}.`;
  const traps = [
    { v: n + 1, m: van ? `That rounds up. The driver plus ${n + 1} boxes would weigh ${fa(D + B * (n + 1))} pounds, more than ${fa(W)}.` : `That rounds up. Admission plus ${n + 1} tickets would cost $${D + B * (n + 1)}, more than $${W}.` },
    { v: a, m: van ? `That ignores the driver’s ${D} pounds, which also count toward the limit.` : `That ignores the $${D} admission, which she also has to pay.` },
    { v: c, m: van ? "That adds the driver’s weight to the limit instead of subtracting it." : "That adds the admission to her budget instead of subtracting it." },
    { v: (W - D) / B, m: `${N} has to be a whole number, so round down to ${n}.` }
  ].filter(t => Math.abs(t.v - n) > 1e-9);
  return { type: "spr", stem, ans: n, why, traps };
} };

G.nosol = { d: "ALG", s: "Systems of linear equations", f(R) {
  const a = ri(R, 2, 7), b = ri(R, 2, 6), t = ri(R, 2, 4), c = ri(R, 2, 20), e = ri(R, 2, 40), sg = R() < 0.65 ? 1 : -1;
  const m = sg * t;
  if (a === b || e === m * c) return null;
  const k = m * a;
  const choice = pool3(R, { t: fn(k), v: k, m: null }, [
    { t: fn(a), v: a, m: `With <i>k</i> = ${a}, the <i>x</i>-coefficients match but the <i>y</i>-coefficients (${b} and ${fn(m * b)}) don’t, so the lines have different slopes and cross at one point.` },
    { t: fn(-k), v: -k, m: "This has the right size but the wrong sign. The lines would have different slopes and would intersect." },
    { t: fn(m * b), v: m * b, m: `This scales the wrong coefficient. Every coefficient in the second equation must be ${fn(m)} times the matching one in the first, so <i>k</i> = ${fn(m)} × ${a}.` },
    { t: fn(m * c), v: m * c, m: `This scales the constant, ${c}, instead of the <i>x</i>-coefficient, ${a}.` }
  ]);
  if (!choice) return null;
  return { type: "mc", stem: "In the system of equations below, <i>k</i> is a constant. For what value of <i>k</i> does the system have no solution?",
    eqs: [`${ex([[a, X], [b, Y]])} = ${c}`, `<i>kx</i> ${sg < 0 ? MI : "+"} ${t * b}<i>y</i> = ${e}`], ...choice,
    why: `Two linear equations have no solution when their lines are parallel: the <i>x</i>- and <i>y</i>-coefficients are in the same ratio, but the constants are not. The second <i>y</i>-coefficient, ${fn(m * b)}, is ${fn(m)} times ${b}, so <i>k</i> must be ${fn(m)} times ${a}: <i>k</i> = ${fn(k)}. Because ${e} ≠ ${fn(m)} × ${c} = ${fn(m * c)}, the lines are parallel and never meet.` };
} };

// ---------------- Advanced Math ----------------
G.quad = { d: "ADV", s: "Nonlinear equations and systems", f(R) {
  const r1 = ri(R, 2, 9), r2 = -ri(R, 1, 9);
  if (r1 + r2 === 0) return null;
  const B = -(r1 + r2), C = r1 * r2;
  return { type: "spr", stem: "What is the positive solution to the equation below?", eqs: [`${ex([[1, sq(X)], [B, X], [C, ""]])} = 0`], ans: r1,
    why: `Factor. Look for two numbers whose product is ${fn(C)} and whose sum is ${fn(B)}: ${fn(-r1)} and ${fn(-r2)}. The equation becomes ${fx(r1)}${fx(r2)} = 0, so <i>x</i> = ${r1} or <i>x</i> = ${fn(r2)}. The positive solution is ${r1}.`,
    traps: [
      { v: -r2, m: `Check the signs. Setting <i>x</i> + ${-r2} equal to 0 gives <i>x</i> = ${fn(r2)}, which isn’t positive.` },
      { v: -r1, m: `Check the signs. Setting <i>x</i> ${MI} ${r1} equal to 0 gives <i>x</i> = ${r1}.` }
    ] };
} };

G.expo = { d: "ADV", s: "Nonlinear functions", f(R) {
  const grow = R() < 0.55;
  const C = grow ? pick(R, [
    { thing: "the number of members of an online club", t: "months after the club was founded", unit: "month", noun: "number of members", lab: "members", P: [200, 500, 800, 1200] },
    { thing: "the population of a town", t: "years after 2020", unit: "year", noun: "population", lab: "people", P: [2500, 4000, 8000, 12000] },
    { thing: "the number of bacteria in a sample", t: "hours after an experiment began", unit: "hour", noun: "number of bacteria", lab: "bacteria", P: [500, 800, 1200, 3000] }
  ]) : pick(R, [
    { thing: "the value, in dollars, of a car", t: "years after it was purchased", unit: "year", noun: "car’s value", lab: "dollars", P: [18000, 24000, 30000, 36000] },
    { thing: "the amount, in milligrams, of a medication in a patient’s bloodstream", t: "hours after a dose", unit: "hour", noun: "amount of medication", lab: "milligrams", P: [200, 400, 500, 800] }
  ]);
  const r = grow ? pick(R, [2, 3, 4, 5, 6, 8, 12, 15]) : pick(R, [5, 8, 10, 12, 15, 20]);
  const P = pick(R, C.P), F = +(grow ? 1 + r / 100 : 1 - r / 100).toFixed(2);
  const Fs = fa(F), rd = fa(+(r / 100).toFixed(2)), dir = grow ? "increases" : "decreases";
  const opts = [
    { t: `Each ${C.unit}, the ${C.noun} ${dir} by ${r}%.`, m: null },
    { t: `Each ${C.unit}, the ${C.noun} ${dir} by ${grow ? 100 + r : 100 - r}%.`, m: grow ? `Multiplying by ${Fs} makes the new amount ${100 + r}% of the old amount. That’s an increase of ${r}%, not ${100 + r}%.` : `Multiplying by ${Fs} leaves ${100 - r}% of the amount each ${C.unit}, so the decrease is ${r}%, not ${100 - r}%.` },
    { t: `Each ${C.unit}, the ${C.noun} ${dir} by ${r} ${C.lab}.`, m: `Changing by the same number of ${C.lab} each ${C.unit} would be a linear model. Here the change is a percent of the current amount.` },
    { t: `When <i>t</i> = 0, the ${C.noun} is ${fa(+(P * F).toFixed(2))}.`, m: `When <i>t</i> = 0, (${Fs})<sup>0</sup> = 1, so <i>f</i>(0) = ${fa(P)}. The starting value is ${fa(P)}.` }
  ];
  return { type: "mc", stem: `The function <i>f</i>, defined by <i>f</i>(<i>t</i>) = ${fa(P)}(${Fs})<sup><i>t</i></sup>, models ${C.thing} <i>t</i> ${C.t}. Which statement is the best interpretation of ${Fs} in this context?`, ...mc(R, opts, false),
    why: grow
      ? `In a model of the form <i>a</i>(<i>b</i>)<sup><i>t</i></sup>, the amount is multiplied by <i>b</i> each time <i>t</i> increases by 1. Multiplying by ${Fs} = 1 + ${rd} keeps the whole amount and adds ${r}% of it, so the ${C.noun} increases by ${r}% each ${C.unit}.`
      : `In a model of the form <i>a</i>(<i>b</i>)<sup><i>t</i></sup>, the amount is multiplied by <i>b</i> each time <i>t</i> increases by 1. Multiplying by ${Fs} = 1 ${MI} ${rd} keeps ${100 - r}% of the amount, so the ${C.noun} decreases by ${r}% each ${C.unit}.` };
} };

G.expand = { d: "ADV", s: "Equivalent expressions", f(R) {
  const p = ri(R, 2, 5), r = ri(R, 1, 4), q = ri(R, -7, 7), s = ri(R, -7, 7);
  if (!q || !s) return null;
  const A = p * r, B = p * s + q * r, Cc = q * s, O = p * s;
  if (!B || !distinct([A, B, Cc, O])) return null;
  const rx = ex([[r, X]]);
  const opts = [
    { t: fn(B), v: B, m: null },
    { t: fn(Cc), v: Cc, m: `This is <i>c</i>, the constant term: (${fn(q)})(${fn(s)}) = ${fn(Cc)}.` },
    { t: fn(A), v: A, m: `This is <i>a</i>, the coefficient of <i>x</i><sup>2</sup>: (${p})(${r}) = ${A}.` },
    { t: fn(O), v: O, m: `This counts only one <i>x</i> term, (${p}<i>x</i>)(${fn(s)}). The other, (${fn(q)})(${rx}), must be added too.` }
  ];
  return { type: "mc", stem: `The expression (${ex([[p, X], [q, ""]])})(${ex([[r, X], [s, ""]])}) is equivalent to <i>ax</i><sup>2</sup> + <i>bx</i> + <i>c</i>, where <i>a</i>, <i>b</i>, and <i>c</i> are constants. What is the value of <i>b</i>?`, ...mc(R, opts, true),
    why: `Multiply each term of the first factor by each term of the second. The <i>x</i> terms come from (${p}<i>x</i>)(${fn(s)}) = ${ex([[p * s, X]])} and (${fn(q)})(${rx}) = ${ex([[q * r, X]])}. Combined: ${ex([[p * s, X], [q * r, X]])} = ${ex([[B, X]])}, so <i>b</i> = ${fn(B)}.` };
} };

G.vertex = { d: "ADV", s: "Nonlinear functions", f(R) {
  const m = ri(R, -7, 9), n = ri(R, -7, 9);
  if (!m || !n || m === n || (m + n) % 2 !== 0 || Math.abs(m - n) < 2) return null;
  const h = (m + n) / 2; if (!h) return null;
  const k = (h - m) * (h - n);
  const def = `<i>f</i>(<i>x</i>) = ${fx(m)}${fx(n)}`;
  if (R() < 0.55) {
    return { type: "spr", stem: `The function <i>f</i> is defined by ${def}. For what value of <i>x</i> does <i>f</i>(<i>x</i>) reach its minimum?`, ans: h,
      why: `The graph of <i>f</i> is a parabola that opens upward, with zeros at <i>x</i> = ${fn(m)} and <i>x</i> = ${fn(n)}. Its vertex, the minimum point, is halfway between the zeros: (${fn(m)} + ${fp(n)}) ÷ 2 = ${fn(h)}.`,
      traps: [
        { v: m, m: `${fn(m)} is a zero of <i>f</i>, where the graph crosses the <i>x</i>-axis. The minimum is halfway between the two zeros.` },
        { v: n, m: `${fn(n)} is a zero of <i>f</i>, where the graph crosses the <i>x</i>-axis. The minimum is halfway between the two zeros.` },
        { v: -h, m: `Check the signs. The zeros are where each factor equals 0: <i>x</i> = ${fn(m)} and <i>x</i> = ${fn(n)}.` }
      ].filter(t => t.v !== h) };
  }
  return { type: "spr", stem: `The function <i>f</i> is defined by ${def}. What is the minimum value of <i>f</i>(<i>x</i>)?`, ans: k,
    why: `The minimum occurs halfway between the zeros ${fn(m)} and ${fn(n)}, at <i>x</i> = ${fn(h)}. Then <i>f</i>(${fn(h)}) = (${fn(h)} ${MI} ${fp(m)})(${fn(h)} ${MI} ${fp(n)}) = (${fn(h - m)})(${fn(h - n)}) = ${fn(k)}.`,
    traps: [
      { v: h, m: `${fn(h)} is the <i>x</i>-value where the minimum occurs. Substitute it into <i>f</i> to get the minimum value.` },
      { v: -k, m: "The vertex lies between the zeros, below the <i>x</i>-axis, so the minimum value is negative." }
    ].filter(t => t.v !== k) };
} };

G.comp = { d: "ADV", s: "Nonlinear functions", f(R) {
  const a = ri(R, 1, 9), b = ri(R, 2, 4), c = ri(R, -5, 5), k = ri(R, -3, 3);
  if (!c || !k) return null;
  const g = b * k + c, fk = k * k - a, ans = g * g - a;
  const cands = [
    { t: fn(b * fk + c), v: b * fk + c, m: `This is <i>g</i>(<i>f</i>(${fn(k)})), which applies <i>f</i> first. In <i>f</i>(<i>g</i>(${fn(k)})), <i>g</i> is applied first.` },
    { t: fn(fk * g), v: fk * g, m: `This multiplies <i>f</i>(${fn(k)}) by <i>g</i>(${fn(k)}). Composition means using the output of <i>g</i> as the input of <i>f</i>.` },
    { t: fn(fk + g), v: fk + g, m: `This adds <i>f</i>(${fn(k)}) and <i>g</i>(${fn(k)}). Composition means using the output of <i>g</i> as the input of <i>f</i>.` },
    { t: fn(g * g + a), v: g * g + a, m: `This adds ${a} instead of subtracting it.` },
    { t: fn(g * g), v: g * g, m: `This forgets to subtract ${a} after squaring.` }
  ];
  if (g < 0) cands.push({ t: fn(-g * g - a), v: -g * g - a, m: `The square of a negative number is positive: (${fn(g)})<sup>2</sup> = ${g * g}.` });
  const choice = pool3(R, { t: fn(ans), v: ans, m: null }, cands);
  if (!choice) return null;
  return { type: "mc", stem: `The functions <i>f</i> and <i>g</i> are defined by <i>f</i>(<i>x</i>) = ${ex([[1, sq(X)], [-a, ""]])} and <i>g</i>(<i>x</i>) = ${ex([[b, X], [c, ""]])}. What is the value of <i>f</i>(<i>g</i>(${fn(k)}))?`, ...choice,
    why: `Work from the inside out. First, <i>g</i>(${fn(k)}) = ${b}(${fn(k)}) ${c < 0 ? MI : "+"} ${Math.abs(c)} = ${fn(g)}. Then <i>f</i>(${fn(g)}) = (${fn(g)})<sup>2</sup> ${MI} ${a} = ${g * g} ${MI} ${a} = ${fn(ans)}.` };
} };

// ---------------- Problem-Solving and Data Analysis ----------------
G.pct = { d: "PSD", s: "Percentages", f(R) {
  const p = pick(R, [10, 20, 25, 30, 40, 50]), q = pick(R, [10, 20, 25, 30, 40, 50]);
  const C = pick(R, [
    { a: "The price of a jacket was increased by", b: "Later, the new price was decreased by", c: "The final price is what percent of the original price?", thing: "price" },
    { a: "The number of members in a club increased by", b: "The next year, the number of members decreased by", c: "The final number of members is what percent of the original number?", thing: "number of members" }
  ]);
  const v = (100 + p) * (100 - q) / 100;
  const pc = x => fa(+x.toFixed(2)) + "%";
  const choice = pool3(R, { t: pc(v), v, m: null }, [
    { t: pc(100 + p - q), v: 100 + p - q, m: `Percent changes can’t simply be added and subtracted. The ${q}% decrease is taken from the new, larger amount.` },
    { t: pc((100 + p) * (100 + q) / 100), v: (100 + p) * (100 + q) / 100, m: `This treats the ${q}% decrease as an increase.` },
    { t: pc((100 - p) * (100 - q) / 100), v: (100 - p) * (100 - q) / 100, m: `This treats the ${p}% increase as a decrease.` },
    { t: pc(100 - q), v: 100 - q, m: `This applies only the ${q}% decrease and ignores the ${p}% increase.` },
    { t: pc(100 + p), v: 100 + p, m: `This applies only the ${p}% increase and ignores the ${q}% decrease.` },
    { t: pc(100 - p - q), v: 100 - p - q, m: `This subtracts both percents, but the first change was an increase, and percent changes multiply rather than add.` }
  ].filter(o => o.v > 0));
  if (!choice) return null;
  const m1 = fa(+(1 + p / 100).toFixed(2)), m2 = fa(+(1 - q / 100).toFixed(2));
  return { type: "mc", stem: `${C.a} ${p}%. ${C.b} ${q}%. ${C.c}`, ...choice,
    why: `An increase of ${p}% multiplies the ${C.thing} by ${m1}. A decrease of ${q}% multiplies it by ${m2}. Together, ${m1} × ${m2} = ${fa(+(v / 100).toFixed(4))}, so the final ${C.thing} is ${pc(v)} of the original.` };
} };

G.rate = { d: "PSD", s: "Ratios, rates, proportions, and units", f(R) {
  const C = pick(R, [{ who: "A machine fills", what: "bottles", verb: "fill" }, { who: "A printer prints", what: "pages", verb: "print" }, { who: "A bakery’s oven bakes", what: "loaves of bread", verb: "bake" }]);
  const B = ri(R, 6, 40), M = pick(R, [3, 4, 5, 6, 10, 12, 15, 20, 30]), H = pick(R, [2, 3, 4, 5, 8]);
  const per = B * 60 / M, ans = per * H;
  const traps = [
    { v: B * H / M, m: `It looks like the hours weren’t converted to minutes. ${H} hours is ${60 * H} minutes.` },
    { v: B * H, m: `That assumes ${B} ${C.what} per hour, but the rate is ${B} every ${M} minutes.` },
    { v: per, m: `That’s the amount for 1 hour. Multiply by ${H}.` }
  ].filter(t => Math.abs(t.v - ans) > 1e-9);
  return { type: "spr", stem: `${C.who} ${B} ${C.what} every ${M} minutes. At this rate, how many ${C.what} will it ${C.verb} in ${H} hours?`, ans, traps,
    why: `An hour is 60 minutes, which is 60 ÷ ${M} = ${60 / M} periods of ${M} minutes. So in 1 hour it makes ${B} × ${60 / M} = ${fa(per)} ${C.what}. In ${H} hours: ${fa(per)} × ${H} = ${fa(ans)}.` };
} };

G.mean = { d: "PSD", s: "One-variable data", f(R) {
  const golf = R() < 0.6, n = ri(R, 4, 9);
  const m = golf ? ri(R, 72, 86) : ri(R, 12, 24), dl = golf ? pick(R, [-1, 1, 2]) : pick(R, [-2, -1, 1, 2]);
  const m2 = m + dl, v = m2 * (n + 1) - m * n;
  if (golf ? v < 62 || v > 99 : v < 0 || v > 45) return null;
  const unit = golf ? "round" : "game";
  const stem = golf
    ? `Over her first ${n} rounds of the season, a golfer’s mean score was ${m} strokes. After her next round, her mean score for all ${n + 1} rounds was ${m2} strokes. What was her score in that round?`
    : `Over the first ${n} games of the season, a basketball player scored a mean of ${m} points per game. After the next game, her mean for all ${n + 1} games was ${m2} points per game. How many points did she score in that game?`;
  return { type: "spr", stem, ans: v,
    why: `Mean × number of ${unit}s = total. Total for the first ${n}: ${n} × ${m} = ${n * m}. Total for all ${n + 1}: ${n + 1} × ${m2} = ${(n + 1) * m2}. The new ${unit} accounts for the difference: ${(n + 1) * m2} ${MI} ${n * m} = ${v}.`,
    traps: [
      { v: m2, m: `${m2} is the new mean, not the score in the new ${unit}.` },
      { v: m, m: `${m} is the old mean. Work with totals: mean × number of ${unit}s.` }
    ].filter(t => t.v !== v) };
} };

G.prob = { d: "PSD", s: "Probability and conditional probability", f(R) {
  const a = ri(R, 12, 40), b = ri(R, 12, 40), c = ri(R, 12, 40), d = ri(R, 12, 40);
  const R1 = a + b, R2 = c + d, C1 = a + c, C2 = b + d, T = R1 + R2;
  let choice, ask, why;
  if (R() < 0.5) {
    choice = pool3(R, { t: fr(d, R2), v: d / R2, m: null }, [
      { t: fr(d, T), v: d / T, m: `This divides by all ${T} students, but the student is chosen only from the ${R2} 10th graders.` },
      { t: fr(d, C2), v: d / C2, m: `This divides by everyone who prefers night (${C2}). That’s the probability that a night-preferring student is a 10th grader, a different question.` },
      { t: fr(c, R2), v: c / R2, m: "This is the probability that a 10th grader prefers studying in the morning." },
      { t: fr(R2, T), v: R2 / T, m: "This is the probability of picking a 10th grader from everyone surveyed." },
      { t: fr(d, c), v: d / c, m: "This compares night to morning among 10th graders. A probability compares night to all 10th graders." }
    ]);
    ask = "If one of the 10th graders surveyed is selected at random, what is the probability that the student prefers studying at night?";
    why = `“One of the 10th graders” limits the group to the ${R2} 10th graders. Of them, ${d} prefer studying at night, so the probability is ${fr(d, R2)}.`;
  } else {
    choice = pool3(R, { t: fr(a, C1), v: a / C1, m: null }, [
      { t: fr(a, T), v: a / T, m: `This divides by all ${T} students, but the student is chosen only from the ${C1} who prefer the morning.` },
      { t: fr(a, R1), v: a / R1, m: `This divides by all ${R1} 9th graders. That’s the probability that a 9th grader prefers the morning, a different question.` },
      { t: fr(c, C1), v: c / C1, m: "This is the probability that a morning-preferring student is a 10th grader." },
      { t: fr(C1, T), v: C1 / T, m: "This is the probability of picking a morning-preferring student from everyone surveyed." },
      { t: fr(a, c), v: a / c, m: "This compares 9th graders to 10th graders among morning students. A probability compares 9th graders to all morning students." }
    ]);
    ask = "If a student who prefers studying in the morning is selected at random, what is the probability that the student is a 9th grader?";
    why = `“A student who prefers studying in the morning” limits the group to the ${C1} morning students. Of them, ${a} are 9th graders, so the probability is ${fr(a, C1)}.`;
  }
  if (!choice) return null;
  return { type: "mc", stem: `The table summarizes a survey in which 9th and 10th graders were asked whether they prefer studying in the morning or at night. ${ask}`,
    tb: { h: ["", "Morning", "Night", "Total"], r: [["9th grade", a, b, R1], ["10th grade", c, d, R2], ["Total", C1, C2, T]].map(r => r.map(String)) }, ...choice, why };
} };

// ---------------- Geometry and Trigonometry ----------------
G.tri = { d: "GEO", s: "Right triangles and trigonometry", f(R) {
  const base = pick(R, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
  const k = base[0] === 3 ? ri(R, 1, 6) : ri(R, 1, 2);
  let [a, b, c] = base.map(v => v * k); if (R() < 0.5) { const t = a; a = b; b = t; }
  if (R() < 0.55) {
    return { type: "spr", stem: `In right triangle <i>ABC</i>, angle <i>C</i> is a right angle, <i>AC</i> = ${a}, and <i>BC</i> = ${b}. What is the length of <i>AB</i>?`, ans: c,
      why: `<i>AB</i> is the hypotenuse, the side across from the right angle. By the Pythagorean theorem, <i>AB</i><sup>2</sup> = ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a} + ${b * b} = ${c * c}, so <i>AB</i> = ${c}.`,
      traps: [{ v: a + b, m: "Side lengths don’t simply add. Square the legs, add the squares, then take the square root." }, { v: c * c, m: `${c * c} is <i>AB</i><sup>2</sup>. Take the square root to get <i>AB</i>.` }] };
  }
  return { type: "spr", stem: `In right triangle <i>ABC</i>, angle <i>C</i> is a right angle, <i>AB</i> = ${c}, and <i>AC</i> = ${a}. What is the length of <i>BC</i>?`, ans: b,
    why: `<i>AB</i> is the hypotenuse. By the Pythagorean theorem, <i>AC</i><sup>2</sup> + <i>BC</i><sup>2</sup> = <i>AB</i><sup>2</sup>, so <i>BC</i><sup>2</sup> = ${c * c} ${MI} ${a * a} = ${b * b} and <i>BC</i> = ${b}.`,
    traps: [
      { v: c - a, m: "Subtract the squares, not the lengths: <i>BC</i><sup>2</sup> = <i>AB</i><sup>2</sup> − <i>AC</i><sup>2</sup>." },
      { v: b * b, m: `${b * b} is <i>BC</i><sup>2</sup>. Take the square root to get <i>BC</i>.` },
      { v: Math.sqrt(c * c + a * a), m: "<i>AB</i> is the hypotenuse, the longest side, so subtract the squares instead of adding them." }
    ].filter(t => Math.abs(t.v - b) > 1e-9) };
} };

G.trig = { d: "GEO", s: "Right triangles and trigonometry", f(R) {
  if (R() < 0.5) {
    const [a, b, c] = pick(R, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25]]);
    const opts = [
      { t: fr(a, c), v: a / c, m: null },
      { t: fr(b, c), v: b / c, m: "This is cos <i>P</i>, which also equals sin <i>Q</i>. It isn’t cos <i>Q</i>." },
      { t: fr(a, b), v: a / b, m: "This is tan <i>P</i>: the side opposite <i>P</i> over the side adjacent to <i>P</i>." },
      { t: fr(b, a), v: b / a, m: "This is tan <i>Q</i>, not cos <i>Q</i>." }
    ];
    return { type: "mc", stem: `In right triangle <i>PQR</i>, angle <i>R</i> is a right angle and sin <i>P</i> = ${fr(a, c)}. What is the value of cos <i>Q</i>?`, ...mc(R, opts, false),
      why: `Angles <i>P</i> and <i>Q</i> are complementary, and the sine of one acute angle equals the cosine of the other. The side opposite <i>P</i> is the side adjacent to <i>Q</i>, so cos <i>Q</i> = sin <i>P</i> = ${fr(a, c)}.` };
  }
  const x = ri(R, 12, 78); if (x === 45) return null;
  const opts = [
    { t: fn(90 - x), v: 90 - x, m: null },
    { t: fn(x), v: x, m: "sin(<i>x</i>°) equals cos(<i>x</i>°) only when <i>x</i> = 45." },
    { t: fn(180 - x), v: 180 - x, m: "This uses the supplementary angle (adding to 180°). Sine and cosine match for complementary angles, which add to 90°." },
    { t: fn(90 + x), v: 90 + x, m: `<i>k</i> must be between 0 and 90, and cos(${90 + x}°) is negative.` }
  ];
  return { type: "mc", stem: `In a right triangle, one acute angle measures ${x}°. If sin(${x}°) = cos(<i>k</i>°), where 0 < <i>k</i> < 90, what is the value of <i>k</i>?`, ...mc(R, opts, false),
    why: `The sine of an angle equals the cosine of its complement: sin(<i>x</i>°) = cos((90 ${MI} <i>x</i>)°). So <i>k</i> = 90 ${MI} ${x} = ${90 - x}.` };
} };

const QUADS = [];
for (let h = 1; h <= 6; h++) for (let k = 1; k <= 6; k++) for (let s = 1; s <= 12; s++) { const r2 = h * h + k * k + s * s, r = Math.round(Math.sqrt(r2)); if (r * r === r2 && r <= 15) QUADS.push([h, k, s, r]); }
G.circ = { d: "GEO", s: "Circles", f(R) {
  let [h, k, s, r] = pick(R, QUADS); if (R() < 0.5) h = -h; if (R() < 0.5) k = -k;
  const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
  const ctr = `The center is (${fn(h)}, ${fn(k)}). This value comes from the center, not the radius.`;
  const cands = [
    { t: fn(r * r), v: r * r, m: "This is <i>r</i><sup>2</sup>. Take the square root to get the radius." },
    { t: fn(2 * r), v: 2 * r, m: "This is the diameter, twice the radius." },
    { t: fn(s), v: s, m: `This leaves out the ${h * h} and ${k * k} added when completing the square. Whatever is added to one side must be added to the other.` },
    { t: fn(Math.abs(h)), v: Math.abs(h), m: ctr },
    { t: fn(Math.abs(k)), v: Math.abs(k), m: ctr }
  ];
  if (s > 1) cands.push({ t: fn(s * s), v: s * s, m: "This is the constant after moving it to the right side, before completing the square and taking a square root." });
  const choice = pool3(R, { t: fn(r), v: r, m: null }, cands);
  if (!choice) return null;
  return { type: "mc", stem: "The graph of the equation below in the <i>xy</i>-plane is a circle. What is the length of the circle’s radius?",
    eqs: [`${ex([[1, sq(X)], [1, sq(Y)], [D, X], [E, Y], [F, ""]])} = 0`], ...choice,
    why: `Move the constant to the right side and complete the square for <i>x</i> and <i>y</i>: (${ex([[1, sq(X)], [D, X]])} + ${h * h}) + (${ex([[1, sq(Y)], [E, Y]])} + ${k * k}) = ${s * s} + ${h * h} + ${k * k}. This gives ${fx(h)}<sup>2</sup> + ${fx(k, Y)}<sup>2</sup> = ${r * r}, so <i>r</i><sup>2</sup> = ${r * r} and <i>r</i> = ${r}.` };
} };

G.vol = { d: "GEO", s: "Area and volume", f(R) {
  const v = ri(R, 0, 2);
  if (v === 0) {
    const r = ri(R, 2, 6), h = ri(R, 3, 12); if (r === h) return null;
    const c = r * r * h, pi = n => `${fa(n)}π`;
    const cands = [
      { t: pi(2 * r * h), v: 2 * r * h, m: "2π<i>rh</i> is the area of the curved side, not the volume." },
      { t: pi(r * h * h), v: r * h * h, m: "This squares the height instead of the radius. The volume is π<i>r</i><sup>2</sup><i>h</i>." },
      { t: pi(4 * r * r * h), v: 4 * r * r * h, m: `This uses the diameter, ${2 * r}, in place of the radius.` },
      { t: pi(r * h), v: r * h, m: "This forgets to square the radius. The volume is π<i>r</i><sup>2</sup><i>h</i>." }
    ];
    if (c % 3 === 0) cands.push({ t: pi(c / 3), v: c / 3, m: "This is the volume of a cone with the same radius and height. A cylinder’s volume is three times that." });
    const choice = pool3(R, { t: pi(c), v: c, m: null }, cands);
    if (!choice) return null;
    return { type: "mc", stem: `A right circular cylinder has a radius of ${r} centimeters and a height of ${h} centimeters. What is the volume of the cylinder, in cubic centimeters?`, ...choice,
      why: `The volume of a cylinder is π<i>r</i><sup>2</sup><i>h</i> = π(${r})<sup>2</sup>(${h}) = π(${r * r})(${h}) = ${c}π.` };
  }
  if (v === 1) {
    const k = pick(R, [2, 3, 4]), grow = R() < 0.5, K = k ** 3;
    const opts = grow ? [
      { t: fn(K), v: K, m: null },
      { t: fn(k), v: k, m: `This scales only one dimension. All three dimensions are multiplied by ${k}.` },
      { t: fn(k * k), v: k * k, m: "This scales two dimensions, as for an area. Volume uses all three." },
      { t: fn(3 * k), v: 3 * k, m: `Scale factors multiply, not add: ${k} × ${k} × ${k}.` }
    ] : [
      { t: fr(1, K), v: 1 / K, m: null },
      { t: fr(1, k), v: 1 / k, m: `This scales only one dimension. All three dimensions are multiplied by ${fr(1, k)}.` },
      { t: fr(1, k * k), v: 1 / (k * k), m: "This scales two dimensions, as for an area. Volume uses all three." },
      { t: fr(1, 3 * k), v: 1 / (3 * k), m: `Scale factors multiply, not add: ${fr(1, k)} × ${fr(1, k)} × ${fr(1, k)}.` }
    ];
    if (!distinct(opts.map(o => o.v.toFixed(9)))) return null;
    return { type: "mc", stem: grow
        ? `A rectangular box has length ℓ, width <i>w</i>, and height <i>h</i>. A second box has a length, width, and height that are each ${k} times those of the first box. The volume of the second box is how many times the volume of the first box?`
        : `A rectangular box has length ℓ, width <i>w</i>, and height <i>h</i>. A second box has a length, width, and height that are each ${fr(1, k)} of those of the first box. The volume of the second box is what fraction of the volume of the first box?`,
      ...mc(R, opts, true),
      why: grow ? `Volume = ℓ<i>wh</i>. Multiplying each dimension by ${k} multiplies the volume by ${k} × ${k} × ${k} = ${K}.`
                : `Volume = ℓ<i>wh</i>. Multiplying each dimension by ${fr(1, k)} multiplies the volume by ${fr(1, k)} × ${fr(1, k)} × ${fr(1, k)} = ${fr(1, K)}.` };
  }
  const k = pick(R, [2, 3, 4]), j = pick(R, [2, 3]); if (k === j) return null;
  const choice = pool3(R, { t: fn(k * k * j), v: k * k * j, m: null }, [
    { t: fn(k * j), v: k * j, m: `The radius is squared in π<i>r</i><sup>2</sup><i>h</i>, so its factor of ${k} counts twice: ${k} × ${k} × ${j}.` },
    { t: fn(k * j * j), v: k * j * j, m: "This squares the height’s factor instead of the radius’s. Only the radius is squared in π<i>r</i><sup>2</sup><i>h</i>." },
    { t: fn(k * k * j * j), v: k * k * j * j, m: "This squares both factors, but the height isn’t squared in π<i>r</i><sup>2</sup><i>h</i>." },
    { t: fn(k * k), v: k * k, m: `This ignores the change in height, which multiplies the volume by ${j} too.` },
    { t: fn(2 * k * j), v: 2 * k * j, m: `Squaring ${k} means ${k} × ${k}, not 2 × ${k}.` }
  ]);
  if (!choice) return null;
  return { type: "mc", stem: `The radius of a right circular cylinder is multiplied by ${k}, and its height is multiplied by ${j}. The volume of the new cylinder is how many times the volume of the original cylinder?`, ...choice,
    why: `The volume is π<i>r</i><sup>2</sup><i>h</i>. The new volume is π(${k}<i>r</i>)<sup>2</sup>(${j}<i>h</i>) = ${k * k} × ${j} × π<i>r</i><sup>2</sup><i>h</i> = ${k * k * j}π<i>r</i><sup>2</sup><i>h</i>, so the volume is multiplied by ${k * k * j}.` };
} };

G.ang = { d: "GEO", s: "Lines, angles, and triangles", f(R) {
  const x = ri(R, 8, 30), p = ri(R, 1, 4), r = ri(R, 1, 4), t = ri(R, 1, 3), q = ri(R, -10, 40);
  const s = 180 - (p + r + t) * x - q, A = p * x + q, B = r * x + s, C = t * x;
  if (!q || !s || A < 10 || B < 10 || C < 10 || A > 150 || B > 150 || s < -40 || s > 60) return null;
  const ang = (c, k) => (k ? `(${ex([[c, X], [k, ""]])})°` : `${ex([[c, X]])}°`);
  const P = p + r + t, K = q + s;
  const base = `In triangle <i>ABC</i>, the measure of angle <i>A</i> is ${ang(p, q)}, the measure of angle <i>B</i> is ${ang(r, s)}, and the measure of angle <i>C</i> is ${ang(t, 0)}.`;
  const solve = `The angles of a triangle add to 180°: ${ex([[p, X], [q, ""]])} + ${ex([[r, X], [s, ""]])} + ${ex([[t, X]])} = 180. Combine like terms: ${ex([[P, X], [K, ""]])} = 180, so ${ex([[P, X]])} = ${180 - K} and <i>x</i> = ${x}.`;
  if (R() < 0.6) {
    return { type: "spr", stem: `${base} What is the value of <i>x</i>?`, ans: x, why: solve,
      traps: [{ v: A, m: "That’s the measure of angle <i>A</i>. The question asks for <i>x</i>." }, { v: B, m: "That’s the measure of angle <i>B</i>. The question asks for <i>x</i>." }, { v: C, m: "That’s the measure of angle <i>C</i>. The question asks for <i>x</i>." }].filter(t2 => t2.v !== x) };
  }
  return { type: "spr", stem: `${base} What is the measure, in degrees, of angle <i>A</i>?`, ans: A,
    why: `${solve} Then angle <i>A</i> = ${p}(${x}) ${q < 0 ? MI : "+"} ${Math.abs(q)} = ${A}°.`,
    traps: [{ v: x, m: `${x} is the value of <i>x</i>. Substitute it into the expression for angle <i>A</i>.` }, { v: B, m: "That’s the measure of angle <i>B</i>." }, { v: C, m: "That’s the measure of angle <i>C</i>." }].filter(t2 => t2.v !== A) };
} };

const DOM = { ALG: ["lin1", "linfun", "sys", "ineq", "nosol"], ADV: ["quad", "expo", "expand", "vertex", "comp"], PSD: ["pct", "rate", "mean", "prob"], GEO: ["tri", "trig", "circ", "vol", "ang"] };
function make(key, seed) {
  const g = G[key];
  for (let i = 0; i < 400; i++) {
    const it = g.f(rng((seed + i * 7919) >>> 0));
    if (it) { it.d = g.d; it.s = g.s; it.key = key; return it; }
  }
  throw new Error("generator failed: " + key);
}
return { G, DOM, make };
})();
if (typeof module !== "undefined") module.exports = MATH;
