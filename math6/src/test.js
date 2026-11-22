// Math 6 checks: exact arithmetic, answer reading, math read aloud, the curriculum, and every unit file.
// Run: node test.js
const M6 = require("./lib.js"), CURRICULUM = require("./curriculum.js");
const vm = require("vm"), fs = require("fs"), path = require("path");
const {Q, parse, check, speak, UNSPOKEN} = M6;
let fails = 0, n = 0;
const ok = (label, got, want) => {
  n++; const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; if (fails <= 40) console.log("FAIL", label, "\n   got ", g, "\n   want", w); }
};

// ---------- Exact arithmetic (the spec's worked examples)
ok("2/3 ÷ 3/4", new Q(2, 3).div(new Q(3, 4)).frac(), "8/9");
ok("flip-first trap", new Q(3, 2).mul(new Q(3, 4)).frac(), "9/8");
ok("2 1/2 × 3 1/3", Q.of("2 1/2").mul("3 1/3").mixed(), "8 1/3");
ok("0.1 + 0.2", Q.of("0.1").add("0.2").dec(), "0.3");
ok("12.6 × 3.45", Q.of("12.6").mul("3.45").dec(), "43.47");
ok("45.6 ÷ 0.12", Q.of("45.6").div("0.12").frac(), "380");
ok("7,296 ÷ 12", Q.of(7296).div(12).frac(), "608");
ok("1/3 never ends", new Q(1, 3).dec(), null);
ok("negative decimal", Q.of("-2.5").dec(), "−2.5");
ok("−1/2 > −3/4", Q.of("−1/2").cmp("−3/4"), 1);
ok("gcd and lcm", [M6.gcd(36, 48), M6.lcm(6, 8)], [12, 24]);
ok("money format", [M6.money("42.75"), M6.money(12), M6.money("-30")], ["$42.75", "$12", "−$30"]);
ok("number format", [M6.fn(2500), M6.fn("-2.5"), M6.fn("1/3")], ["2,500", "−2.5", "1/3"]);

// ---------- Reading what the student typed
const P = s => { const p = parse(s); return p && [p.form, p.q.frac()]; };
ok("int", P("24"), ["int", "24"]);
ok("unicode minus", P("−8"), ["int", "−8"]);
ok("decimal", P("0.45"), ["dec", "9/20"]);
ok("leading point", P(".5"), ["dec", "1/2"]);
ok("fraction with spaces", P("3 / 4"), ["frac", "3/4"]);
ok("negative fraction", P("−3/4"), ["frac", "−3/4"]);
ok("mixed number", P("2 1/3"), ["mixed", "7/3"]);
ok("money", P("$4.25"), ["money", "17/4"]);
ok("negative money", P("−$30"), ["money", "−30"]);
ok("percent", P("75%"), ["pct", "75"]);
ok("thousands", P("2,500"), ["int", "2500"]);
ok("ratio", P("4:10"), ["ratio", "2/5"]);
ok("x = 24", P("x = 24"), ["int", "24"]);
ok("words", parse("three"), null);
ok("bad mixed number", parse("2 5/3"), null);
ok("zero denominator", parse("3/0"), null);

// ---------- Checking answers
const C = (spec, s) => { const r = check(spec, s); return [r.ok, !!r.close, r.mis || null]; };
ok("8/9 right", C({ans: "8/9"}, "8/9"), [true, false, null]);
ok("16/18 is the same value", C({ans: "8/9"}, "16/18"), [true, false, null]);
ok("16/18 when simplest is asked", C({ans: "8/9", form: "simplest"}, "16/18"), [false, true, null]);
ok("trap names the mistake", C({ans: "8/9", traps: [{v: "9/8", m: "You flipped the first fraction.", mis: "FLIP_FIRST"}]}, "9/8"), [false, false, "FLIP_FIRST"]);
ok("decimal asked, fraction typed", C({ans: "0.5", form: "decimal"}, "1/2"), [false, true, null]);
ok("0.5 equals 1/2", C({ans: "1/2"}, "0.5"), [true, false, null]);
ok("money answer", C({ans: "42.75"}, "$42.75"), [true, false, null]);
ok("percent answer", C({ans: 75, unit: "%"}, "75%"), [true, false, null]);
ok("percent typed bare", C({ans: 75, unit: "%"}, "75"), [true, false, null]);
ok("equivalent ratio", C({ans: [2, 5]}, "4:10"), [true, false, null]);
ok("ratio in simplest form", C({ans: [2, 5], simplest: true}, "4:10"), [false, true, null]);
ok("reversed ratio", C({ans: [2, 3], traps: [{v: "3/2", m: "Order matters.", mis: "RATIO_ORDER"}]}, "3:2"), [false, false, "RATIO_ORDER"]);
ok("mixed number asked", C({ans: "25/3", form: "mixed"}, "25/3"), [false, true, null]);
ok("mixed number given", C({ans: "25/3", form: "mixed"}, "8 1/3"), [true, false, null]);
ok("unreadable", check({ans: 3}, "three").unread, true);

// ---------- Reading math aloud (the table in the spec, plus edge cases)
const SPEECH = [
  ["2:3", "2 to 3"], ["2/3", "2 thirds"], ["2 3/4", "2 and 3 fourths"], ["−8", "negative 8"], ["5 − 8", "5 minus 8"],
  ["3x", "3 x"], ["x/4", "x divided by 4"], ["2³", "2 to the third power"], ["(3, −4)", "the point 3, negative 4"],
  ["12.6", "12 point 6"], ["$4.25", "4 dollars and 25 cents"], ["30%", "30 percent"], ["|−5|", "the absolute value of negative 5"],
  ["x ≥ 3", "x is greater than or equal to 3"], ["30 ft³", "30 cubic feet"], ["2(3 + 4)", "2 times the quantity 3 plus 4"],
  ["2/3 ÷ 3/4 = 8/9", "2 thirds divided by 3 fourths equals 8 ninths"], ["1/2", "1 half"], ["3/2", "3 halves"],
  ["−3/4", "negative 3 fourths"], ["0.45", "0 point 4 5"], ["$0.45", "45 cents"], ["5²", "5 squared"],
  ["36 cm²", "36 square centimeters"], ["−8 < −3", "negative 8 is less than negative 3"],
  ["3 + 4 × 2²", "3 plus 4 times 2 squared"], ["4(2x + 5)", "4 times the quantity 2 x plus 5"],
  ["12 oz for $3.00", "12 oz for 3 dollars"], ["7/12", "7 twelfths"], ["5/24", "5 twenty-fourths"],
  ["−$30", "negative 30 dollars"], ["12.5%", "12 point 5 percent"], ["4x = 36", "4 x equals 36"],
  ["Not a whole one: 8/9 of one.", "Not a whole one: 8 ninths of one."], ["3(x + 2)", "3 times the quantity x plus 2"],
  ["the price (in cents) is 70", "the price in cents is 70"], ["(10, 15)", "the point 10, 15"]
];
for (const [shown, said] of SPEECH) {
  ok("speak " + shown, speak(shown), said);
  ok("nothing unspoken in " + shown, UNSPOKEN.test(speak(shown)), false);
}
ok("speak fraction markup", speak(M6.fr(2, 3) + " ÷ " + M6.fr(3, 4)), "2 thirds divided by 3 fourths");

// ---------- Curriculum
const lessons = CURRICULUM.flatMap(u => u.lessons);
ok("units", CURRICULUM.length, 10);
ok("lessons", lessons.length, 75);
ok("added lessons", lessons.filter(l => l[3]).length, 12);
ok("lesson ids unique", new Set(lessons.map(l => l[0])).size, 75);
ok("lessons per unit", CURRICULUM.map(u => u.lessons.length), [12, 7, 7, 7, 6, 7, 7, 6, 8, 8]);
ok("ids match their unit", CURRICULUM.every(u => u.lessons.every(l => Number(l[0].split(".")[0]) === u.u)), true);
ok("star weights", CURRICULUM.reduce((s, u) => s + u.stars, 0), 27);

// ---------- Unit files: each one registers itself, so parallel branches never touch the same file
const ctx = {M6, CURRICULUM, M6U: {}}; vm.createContext(ctx);
const dir = path.join(__dirname, "units");
const unitFiles = fs.readdirSync(dir).filter(f => /^u\d\d\.js$/.test(f)).sort();
for (const f of unitFiles) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx, {filename: f});
ok("every unit file registers once", Object.keys(ctx.M6U).map(Number).sort((a, b) => a - b), unitFiles.map(f => Number(f.slice(1, 3))));
for (const [u, content] of Object.entries(ctx.M6U)) {
  const ids = CURRICULUM[u - 1].lessons.map(l => l[0]);
  ok(`unit ${u} lessons are its own`, Object.keys(content.lessons || {}).every(id => ids.includes(id)), true);
}

// ---------- Lesson content: every lesson, every template, many seeds
// The question engine (20-board.js, 30-question.js) runs here exactly as it does on the iPad.
const kinds = {};       // failures grouped by what failed, with the seed numbers taken out, so one bad template prints once
const must = (label, cond, detail) => {
  n++; if (cond) return;
  fails++; const k = label.replace(/seed \d+ /, "").replace(/\d+ different/, "N different");
  if ((kinds[k] = (kinds[k] || 0) + 1) === 1 && Object.keys(kinds).length <= 50) console.log("FAIL", label, detail === undefined ? "" : "\n   " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 600));
};
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]));
const app = {M6, esc, S: {explore: {types: {}}}, TPL: {}};
vm.createContext(app);
for (const f of ["js/20-board.js", "js/30-question.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), app, {filename: f});
const E = vm.runInContext("({normItem, makeItem, grade, answerText, keysFor, board, MODELS})", app);
const PARTS = ["hook", "idea", "see", "ido", "wedo", "watch", "recap"], TAGS = ["CONCEPT", "PROCEDURE", "APPLICATION"];
const TYPES = ["mc", "multi", "num", "table", "grid", "order", "match", "yn", "mistake", "explain"];
const BAD = /undefined|NaN|Infinity|\[object|null/;
// Every string the voice may read must come out as words: no symbols, no "3:5", no "2.5"
const spoken = (label, text) => { const s = speak(text); must("speech " + label, !UNSPOKEN.test(s) && !/\b[a-z]:\d|\d:[a-z]\b/.test(s) && !BAD.test(s), `${JSON.stringify(text)} → ${JSON.stringify(s)}`); };
const strings = (x, out = []) => { if (typeof x === "string") out.push(x); else if (Array.isArray(x)) x.forEach(y => strings(y, out)); else if (x && typeof x === "object") Object.entries(x).forEach(([k, v]) => k !== "p" && strings(v, out)); return out; };
// What a student who knows the answer would enter, for each question type
function rightResponse(it) {
  switch (it.type) {
    case "mc": return it.choices.findIndex(c => c.ok);
    case "multi": return it.opts.map((o, i) => o.ok ? i : -1).filter(i => i >= 0);
    case "num": return [Array.isArray(it.ans) ? it.ans.join(":") : String(it.ans)];
    case "table": return it.blanks.map(([r, c]) => String(it.rows[r][c]));
    case "grid": return it.n;
    case "order": return it.items.map(t => it.shown.indexOf(t));
    case "match": { const r = {}; it.pairs.forEach((p, i) => { r[i] = it.rights.indexOf(p[1]); }); return r; }
    case "yn": return it.rows.map(r => r.ok);
    case "mistake": return {step: it.wrong, fix: it.fixes.findIndex(f => f.ok)};
    default: return null;
  }
}
const misUsed = new Set(), misKnown = {}, rightPos = [0, 0, 0, 0, 0];
function checkItem(label, it, tpl) {
  must(label + " type", TYPES.includes(it.type), it.type);
  must(label + " stem", typeof it.stem === "string" && it.stem.length > 8, it.stem);
  strings(it).forEach(t => must(label + " no broken text", !BAD.test(t), t));
  spoken(label + " stem", it.stem);
  (it.hints || []).forEach((h, i) => spoken(`${label} hint ${i + 1}`, h));
  it.sol.forEach((x, i) => { spoken(`${label} solution ${i + 1}`, x.s); if (x.why) spoken(`${label} solution why ${i + 1}`, x.why); });
  if (it.board) must(label + " board draws", E.board(it.board).length > 40 && !BAD.test(E.board(it.board)), it.board);
  const r = rightResponse(it), g = E.grade(it, r);
  must(label + " the right answer grades right", g && g.ok === true, {g, r, ans: it.ans});
  must(label + " answer text", E.answerText(it).length > 0 && !BAD.test(E.answerText(it)), E.answerText(it));
  if (it.type === "mc") {
    const texts = it.choices.map(c => c.t);
    must(label + " 3 or 4 choices", texts.length >= 3 && texts.length <= 5, texts);
    must(label + " choices differ", new Set(texts).size === texts.length, texts);
    must(label + " exactly one right choice", it.choices.filter(c => c.ok).length === 1);
    it.choices.forEach((c, i) => { spoken(`${label} choice ${i}`, c.t); if (c.why) spoken(`${label} choice why ${i}`, c.why); if (!c.ok) { must(label + " wrong choice explains itself", c.why.length > 5, c); if (c.mis) misUsed.add(c.mis); } });
    if (it.whyRight) spoken(label + " why right", it.whyRight);
    it.choices.forEach((c, i) => { if (!c.ok) must(label + " a wrong choice grades wrong", !E.grade(it, i).ok); });
    if (tpl) rightPos[it.choices.findIndex(c => c.ok)]++;
  }
  if (it.type === "multi") {
    must(label + " multi has right and wrong options", it.opts.some(o => o.ok) && it.opts.some(o => !o.ok));
    must(label + " options differ", new Set(it.opts.map(o => o.t)).size === it.opts.length, it.opts.map(o => o.t));
    it.opts.forEach((o, i) => spoken(`${label} option ${i}`, o.t));
  }
  if (it.type === "num") {
    must(label + " keypad", /int|dec|frac|ratio|neg|money|pct/.test(E.keysFor(it)), E.keysFor(it));
    (it.traps || []).forEach(t => {
      const v = Array.isArray(t) ? t : [t.v, t.m, t.mis];
      must(label + " trap is a number", (() => { try { Q.of(v[0]); return true; } catch (e) { return false; } })(), v);
      const tg = E.grade(it, [Array.isArray(it.ans) ? String(v[0]).replace("/", ":") : String(v[0])]);   // a ratio trap is typed with a colon
      must(label + " trap grades wrong with its message", !tg.ok && tg.msg === v[1], {trap: v, ans: it.ans, tg});
      spoken(label + " trap message", v[1]);
      if (v[2]) misUsed.add(v[2]);
    });
  }
  if (it.type === "table") must(label + " table blanks are cells", it.blanks.length && it.blanks.every(([r, c]) => it.rows[r] && it.rows[r][c] !== undefined && c > 0));
  if (it.type === "grid") must(label + " grid count", Number.isInteger(it.n) && it.n > 0 && it.n < 100);
  if (it.type === "order") must(label + " order items differ", new Set(it.items).size === it.items.length && it.items.length >= 3 && it.shown.join("|") !== it.items.join("|"));
  if (it.type === "match") must(label + " match pairs differ", new Set(it.pairs.map(p => p[0])).size === it.pairs.length && new Set(it.pairs.map(p => p[1])).size === it.pairs.length);
  if (it.type === "yn") {
    must(label + " yes and no rows", it.rows.length >= 3 && it.rows.some(r => r.ok) && it.rows.some(r => !r.ok), it.rows);
    must(label + " rows differ", new Set(it.rows.map(r => r.t)).size === it.rows.length);
    it.rows.forEach((row, i) => { spoken(`${label} row ${i}`, row.t); if (row.why) spoken(`${label} row why ${i}`, row.why); });
  }
  if (it.type === "mistake") must(label + " one mistake, one right fix", it.steps[it.wrong] !== undefined && it.fixes.filter(f => f.ok).length === 1 && new Set(it.fixes.map(f => f.t)).size === it.fixes.length);
}

for (const [u, content] of Object.entries(ctx.M6U)) for (const c of Object.values(content.lessons || {})) Object.assign(misKnown, c.misconceptions || {});
let built = 0, tplCount = 0;
for (const [u, content] of Object.entries(ctx.M6U)) {
  for (const [id, c] of Object.entries(content.lessons || {})) {
    built++;
    const L = `lesson ${id}`;
    // the lesson gate from the spec: seven parts, 550-950 spoken words, two checks, another way, notes
    const parts = new Set(c.script.map(st => st.part));
    must(L + " has all seven parts", PARTS.every(p => parts.has(p)), [...parts]);
    must(L + " parts are known", c.script.concat(c.alt).every(st => PARTS.includes(st.part)));
    const words = c.script.map(st => speak(st.say)).join(" ").split(/\s+/).length;
    must(L + ` spoken words 550-950 (has ${words})`, words >= 550 && words <= 950);
    must(L + " two We do checks", c.script.filter(st => st.part === "wedo" && st.check).length >= 2);
    must(L + " starts with a board", !!c.script[0].board);
    must(L + " another way", c.alt.length >= 2 && !!c.alt[0].board);
    must(L + " three misconceptions", Object.keys(c.misconceptions).length >= 3);
    must(L + " vocabulary", c.vocab.length >= 2 && c.vocab.every(v => v.length === 2));
    must(L + " notes", c.notes.idea && c.notes.examples.length >= 2 && c.notes.watch);
    c.script.concat(c.alt).forEach((st, i) => {
      spoken(`${L} step ${i} (${st.part})`, st.say);
      if (st.why) spoken(`${L} step ${i} why`, st.why);
      if (st.board) must(`${L} step ${i} board draws`, E.board(st.board).length > 40 && !BAD.test(E.board(st.board)), st.board);
      if (st.check) {
        const it = E.normItem(Object.assign({seed: 7 + i}, JSON.parse(JSON.stringify(st.check.item))));
        checkItem(`${L} check ${i}`, it, null);
        spoken(`${L} check ${i} miss`, st.check.miss);
      }
    });
    spoken(L + " notes", c.notes.idea);
    c.vocab.forEach(([w, d]) => spoken(`${L} vocab ${w}`, w + ". " + d));
    Object.values(c.misconceptions).forEach(m => spoken(L + " misconception", m));
    // templates
    const ts = c.templates;
    must(L + " four templates", ts.length >= 4);
    must(L + " a word problem", ts.some(t => t.word));
    must(L + " Warm-up, Standard and Stretch", [1, 2, 3].every(d => ts.some(t => t.diff === d)), ts.map(t => t.diff));
    must(L + " concept, procedure and application", TAGS.every(g => ts.some(t => t.tag === g)), ts.map(t => t.tag));
    for (const t of ts) {
      tplCount++;
      app.TPL[t.id] = Object.assign(t, {lesson: id});
      must(`${t.id} id`, t.id.startsWith(id + "-"));
      must(`${t.id} fields`, TYPES.includes(t.type) && TAGS.includes(t.tag) && [1, 2, 3].includes(t.diff) && t.est >= 15 && t.est <= 90 && typeof t.make === "function" && typeof t.verify === "function", t);
      const stems = new Set();
      for (let seed = 1; seed <= 120; seed++) {
        let it;
        try { it = E.makeItem(t.id, seed); } catch (e) { must(`${t.id} seed ${seed} makes`, false, e.stack.split("\n").slice(0, 3).join(" ")); continue; }
        stems.add(JSON.stringify([it.stem, it.rows, it.ans, it.n, it.items, it.pairs, it.choices && it.choices.map(c => c.t)]));
        checkItem(`${t.id} seed ${seed}`, it, t);
        let v = false; try { v = t.verify(it) === true; } catch (e) { v = false; }
        must(`${t.id} seed ${seed} answer checks out`, v, {stem: it.stem, ans: it.ans, right: it.right});
        if (t.word) must(`${t.id} seed ${seed} word frame`, it.frame && it.frame.find.length === 3 && it.frame.tool.length === 3 && new Set(it.frame.find).size === 3 && new Set(it.frame.tool).size === 3 && it.frame.fr && it.frame.tr && it.frame.check, it.frame);
        const again = E.makeItem(t.id, seed);
        must(`${t.id} seed ${seed} same seed, same question`, again.stem === it.stem && JSON.stringify(again.choices || again.ans) === JSON.stringify(it.choices || it.ans));
      }
      must(`${t.id} varies (${stems.size} different questions in 120)`, stems.size >= Math.min(12, 120));
    }
  }
  const t5 = content.t5 || [];
  must(`unit ${u} 5-minute test blueprint`, built === 0 || t5.every(sl => sl === "W" || [].concat(sl).every(id => content.lessons[id])), t5);
}
misUsed.forEach(m => must(`named mistake ${m} is described in a lesson`, !!misKnown[m]));
const posTotal = rightPos.slice(0, 4).reduce((a, b) => a + b, 0);
if (posTotal) must("right answers spread over A to D", rightPos.slice(0, 4).every(k => k / posTotal > 0.15 && k / posTotal < 0.35), rightPos);

// ---------- Speed drills: every question has an answer the checker can read
global.M6 = M6; const DRILLS = require("./drills.js");
for (const d of DRILLS) for (let seed = 1; seed <= 200; seed++) {
  const g = d.gen(M6.rng(seed));
  if (d.kind === "num") must(`drill ${d.id} answer`, !!parse(g.a) && check({ans: g.a}, g.a).ok, g);
  else must(`drill ${d.id} answer`, (d.kind === "cmp" ? ["<", "=", ">"] : d.kind === "yn" ? ["Yes", "No"] : ["I", "II", "III", "IV"]).includes(g.a), g);
  must(`drill ${d.id} question`, typeof g.q === "string" && g.q.length > 0 && !BAD.test(g.q), g);
}

console.log(`${n} checks, ${unitFiles.length} unit files, ${built} lessons built, ${tplCount} templates`);
console.log(fails ? `${fails} FAILURES` : "ALL CHECKS PASSED");
process.exitCode = fails ? 1 : 0;
