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
  ["Not a whole one: 8/9 of one.", "Not a whole one: 8 ninths of one."]
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

console.log(`${n} checks, ${unitFiles.length} unit files`);
console.log(fails ? `${fails} FAILURES` : "ALL CHECKS PASSED");
process.exitCode = fails ? 1 : 0;
