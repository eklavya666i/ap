// Speed drills: quick questions (10 seconds or less) for Speed Round, Beat the Clock and Lightning Ladder.
// Each drill opens once its lesson has been started; times tables and division facts are open from the start.
// gen(R) returns {q, a, fact?}; kind: num (keypad), cmp (< = >), yn (Yes/No), quad (I to IV).
const DRILLS = (() => {
  const {ri, pick, Q, MI} = M6;
  const neg = n => (n < 0 ? MI + Math.abs(n) : String(n));
  const dec = q => q.dec() || q.frac();
  const FDP = [["1/2", "50%", "0.5"], ["1/4", "25%", "0.25"], ["3/4", "75%", "0.75"], ["1/5", "20%", "0.2"], ["2/5", "40%", "0.4"], ["3/5", "60%", "0.6"],
    ["4/5", "80%", "0.8"], ["1/10", "10%", "0.1"], ["3/10", "30%", "0.3"], ["7/10", "70%", "0.7"], ["9/10", "90%", "0.9"], ["1/20", "5%", "0.05"], ["1/25", "4%", "0.04"], ["1/100", "1%", "0.01"]];
  return [
    {id: "times", name: "Times tables to 12 × 12", opens: null, medals: [15, 25, 35], kind: "num",
      gen: R => { const a = ri(R, 2, 12), b = ri(R, 2, 12); return {q: `${a} × ${b}`, a: String(a * b), fact: `${Math.min(a, b)}x${Math.max(a, b)}`}; }},
    {id: "div", name: "Division facts", opens: null, medals: [12, 20, 30], kind: "num",
      gen: R => { const a = ri(R, 2, 12), b = ri(R, 2, 12); return {q: `${a * b} ÷ ${a}`, a: String(b), fact: `${Math.min(a, b)}x${Math.max(a, b)}`}; }},
    {id: "tens", name: "× and ÷ by 10, 100, 1,000", opens: "3.1", medals: [12, 20, 28], kind: "num",
      gen: R => { const p = pick(R, [10, 100, 1000]), x = new Q(ri(R, 1, 999), pick(R, [1, 10, 100])), up = R() < 0.5;
        const ans = up ? x.mul(p) : x.div(p); return {q: `${dec(x)} ${up ? "×" : "÷"} ${p.toLocaleString("en-US")}`, a: dec(ans)}; }},
    {id: "fdp", name: "Fraction, decimal, percent pairs", opens: "1.8", medals: [8, 14, 20], kind: "num",
      gen: R => { const [f, p, d] = pick(R, FDP), w = ri(R, 0, 2);
        return w === 0 ? {q: `${f} as a percent`, a: p.replace("%", ""), unit: "%"} : w === 1 ? {q: `${p} as a decimal`, a: d} : {q: `${d} as a percent`, a: p.replace("%", ""), unit: "%"}; }},
    {id: "rates", name: "Unit rates", opens: "1.5", medals: [6, 10, 15], kind: "num",
      gen: R => { const u = ri(R, 2, 12), n = ri(R, 2, 9), c = pick(R, [["miles in", "hours", "miles per hour"], ["pages in", "minutes", "pages per minute"], ["dollars for", "tickets", "dollars per ticket"]]);
        return {q: `${u * n} ${c[0]} ${n} ${c[1]}: ${c[2]}?`, a: String(u)}; }},
    {id: "pctof", name: "Percent of a number", opens: "1.9", medals: [6, 10, 14], kind: "num",
      gen: R => { const p = pick(R, [10, 20, 25, 50, 75]), base = p === 25 || p === 75 ? 4 * ri(R, 2, 25) : p === 50 ? 2 * ri(R, 3, 40) : 10 * ri(R, 2, 20);
        return {q: `${p}% of ${base}`, a: String(new Q(p * base, 100).frac())}; }},
    {id: "simp", name: "Simplify fractions", opens: "2.1", medals: [6, 10, 15], kind: "num",
      gen: R => { let a, b; do { a = ri(R, 1, 9); b = ri(R, 2, 12); } while (a >= b || M6.gcd(a, b) !== 1); const k = ri(R, 2, 6); return {q: `Simplify ${a * k}/${b * k}`, a: `${a}/${b}`}; }},
    {id: "cmp", name: "Compare integers", opens: "4.3", medals: [15, 25, 35], kind: "cmp",
      gen: R => { const a = ri(R, -20, 20); let b; do b = ri(R, -20, 20); while (b === a && R() < 0.8); return {q: `${neg(a)}  ?  ${neg(b)}`, a: a < b ? "<" : a > b ? ">" : "="}; }},
    {id: "abs", name: "Absolute value", opens: "4.5", medals: [15, 25, 35], kind: "num",
      gen: R => { let n; do n = ri(R, -30, 30); while (!n); return {q: `|${neg(n)}|`, a: String(Math.abs(n))}; }},
    {id: "divis", name: "Divisibility", opens: "5.1", medals: [12, 20, 28], kind: "yn",
      gen: R => { const d = pick(R, [2, 3, 4, 5, 6, 9, 10]); let n = ri(R, 100, 999); if (R() < 0.5) n -= n % d; return {q: `Is ${n} divisible by ${d}?`, a: n % d === 0 ? "Yes" : "No"}; }},
    {id: "gcf", name: "GCF and LCM", opens: "5.5", medals: [5, 9, 13], kind: "num",
      gen: R => { const a = ri(R, 2, 12), b = ri(R, 2, 12), g = R() < 0.5; return {q: `${g ? "GCF" : "LCM"} of ${a} and ${b}`, a: String(g ? M6.gcd(a, b) : M6.lcm(a, b))}; }},
    {id: "ops", name: "Order of operations", opens: "6.2", medals: [6, 10, 15], kind: "num",
      gen: R => { const a = ri(R, 1, 9), b = ri(R, 2, 9), c = ri(R, 2, 9), f = ri(R, 0, 3);
        return f === 0 ? {q: `${a} + ${b} × ${c}`, a: String(a + b * c)} : f === 1 ? {q: `(${a} + ${b}) × ${c}`, a: String((a + b) * c)}
          : f === 2 ? {q: `${b} × ${c} − ${a}`, a: String(b * c - a)} : {q: `${b}² + ${a}`, a: String(b * b + a)}; }},
    {id: "eval", name: "Evaluate expressions", opens: "6.5", medals: [6, 10, 14], kind: "num",
      gen: R => { const a = ri(R, 2, 9), b = ri(R, 1, 12), x = ri(R, 1, 10); return {q: `${a}x + ${b} when x = ${x}`, a: String(a * x + b)}; }},
    {id: "eq1", name: "One-step equations", opens: "7.4", medals: [8, 13, 18], kind: "num",
      gen: R => { const x = ri(R, 2, 20), a = ri(R, 2, 12), f = ri(R, 0, 3);
        return {q: f === 0 ? `x + ${a} = ${x + a}` : f === 1 ? `x − ${a} = ${x - a < 0 ? neg(x - a) : x - a}` : f === 2 ? `${a}x = ${a * x}` : `x/${a} = ${x}`, a: String(f === 3 ? x * a : x)}; }},
    {id: "quad", name: "Quadrant of a point", opens: "8.3", medals: [10, 16, 24], kind: "quad",
      gen: R => { let x, y; do { x = ri(R, -9, 9); y = ri(R, -9, 9); } while (!x || !y); return {q: `(${neg(x)}, ${neg(y)})`, a: x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III"}; }},
    {id: "area", name: "Area of rectangles and triangles", opens: "9.2", medals: [5, 9, 13], kind: "num",
      gen: R => { const b = ri(R, 2, 12), h = ri(R, 2, 12), tri = R() < 0.5 && (b * h) % 2 === 0;
        return {q: `${tri ? "Triangle" : "Rectangle"}: base ${b}, height ${h}. Area?`, a: String(tri ? b * h / 2 : b * h)}; }},
    {id: "mean", name: "Mean of 3 numbers", opens: "10.4", medals: [5, 9, 13], kind: "num",
      gen: R => { const m = ri(R, 3, 20), d1 = ri(R, 0, 5), d2 = ri(R, 0, 5); return {q: `Mean of ${m - d1}, ${m + d2}, ${m + d1 - d2}`, a: String(m)}; }}
  ];
})();
if (typeof module !== "undefined") module.exports = DRILLS;
