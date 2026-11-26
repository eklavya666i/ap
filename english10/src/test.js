// Checks every piece of content and the draft checker. Run: node test.js
const assert = require("assert");
const {COURSE} = require("./content/course.js"), {LOTF} = require("./content/lotf.js"), {LENSES, LENS_QS, BIG_IDEA} = require("./content/lenses.js");
const {TERMS, TERM_GROUPS} = require("./content/terms.js"), {ESSAYS, DRILLS, PROMPTS, TIMED_TIPS, LEVELS} = require("./content/writing.js");
const {ADVICE, CONTENT_NOTES, SEMINAR, EMAILS, INTEGRITY} = require("./content/coach.js"), {Checker} = require("./lib/checker.js");
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const distinct = a => new Set(a.map(x => String(x).trim().toLowerCase())).size === a.length;

// ---- Course
ok(COURSE.units.length === 7 && COURSE.units.every((u, i) => u.u === i + 1), "7 units in order");
ok(COURSE.units.every(u => ESSAYS.some(e => e.id === u.essay)), "every unit points at an essay guide");
ok(sum(COURSE.grading.map(g => g[1])) === 100, "grading weights add to 100");
function sum(a) { return a.reduce((x, y) => x + y, 0); }

// ---- Lord of the Flies
const lensIds = LENSES.map(l => l.id);
ok(LOTF.chapters.length === 12, "12 chapters");
for (const c of LOTF.chapters) {
  ok(c.sum.length === 2 && c.sum.every(p => p.split(/\s+/).length >= 45), `ch ${c.n}: two full summary paragraphs`);
  ok(c.events.length >= 5 && c.watch.length >= 3 && c.hunt.length === 3 && c.seminar.length === 3, `ch ${c.n}: events, watch, hunt, seminar`);
  ok(lensIds.includes(c.lens.id) && c.lens.text.length > 60, `ch ${c.n}: lens moment`);
  // The novel is under copyright: no double-quoted text anywhere in the guide (single quotes mark our own scare quotes).
  for (const t of [...c.sum, ...c.events, ...c.watch, ...c.hunt, ...c.seminar, c.lens.text]) ok(!/["“”]/.test(t), `ch ${c.n}: no quotation marks in "${t.slice(0, 40)}"`);
}
const byCh = {}; for (const q of LOTF.questions) (byCh[q[0]] = byCh[q[0]] || []).push(q);
ok(LOTF.questions.length === 96 && Object.values(byCh).every(a => a.length === 8), "96 reading checks, 8 per chapter");
let longestRight = 0;
for (const [ch, kind, q, c, why] of LOTF.questions) {
  ok(ch >= 1 && ch <= 12 && ["plot", "character", "symbol", "theme", "inference"].includes(kind), `q kind: ${q}`);
  ok(c.length === 4 && distinct(c) && c.every(x => x.trim()), `4 distinct choices: ${q}`);
  ok(/\?$|___/.test(q.trim()), `question form: ${q}`);
  ok(why.length > 20 && !/\b(?:choice|option|answer) [A-D]\b/.test(why), `why: ${q}`);
  if (c[0].length > Math.max(...c.slice(1).map(x => x.length))) longestRight++;
  for (const ch2 of LOTF.characters.filter(x => x.from > ch)) {
    const name = ch2.id === "parachutist" ? "parachutist" : ch2.id === "officer" ? "officer" : ch2.name;
    ok(![q, ...c].some(t => t.includes(name)), `ch ${ch} question names ${name}, who appears in ch ${ch2.from}: ${q}`);
  }
}
console.log(`reading checks where the right answer is the longest: ${longestRight}/96`);
ok(longestRight / 96 >= 0.1 && longestRight / 96 <= 0.45, "answer length gives nothing away either way");
for (const c of LOTF.characters) { ok(c.from >= 1 && c.from <= 12, c.id); ok(c.arc.every(([k], i, a) => k >= c.from - 0 && k <= 12 && (!i || k >= a[i - 1][0])), `${c.id} arc in order`); }
for (const s of LOTF.symbols) ok(s.track.every(([k], i, a) => k >= s.from && k <= 12 && (!i || k >= a[i - 1][0])), `${s.id} track in order`);
for (const t of LOTF.themes) ok(t.track.every(([k]) => k >= 1 && k <= 12), t.id);

// ---- Lenses
ok(LENSES.length === 9 && distinct(lensIds), "9 lenses");
for (const l of LENSES) ok(l.terms.length >= 6 && l.lotf.length === 3 && l.lotf.every(([k]) => k >= 1 && k <= 12) && l.frame.includes("[") && l.ideas.length >= 3, `lens ${l.id}`);
ok(LENS_QS.length === 27 && lensIds.every(id => LENS_QS.filter(q => q[0] === id).length === 3), "27 lens questions, 3 per lens");
for (const [lens, q, c, why] of LENS_QS) ok(lensIds.includes(lens) && c.length === 4 && distinct(c) && why.length > 15, `lens q: ${q}`);
ok(BIG_IDEA.p.length === 2, "big idea");

// ---- Terms
ok(TERMS.length >= 70 && distinct(TERMS.map(t => t.t)), "70+ unique terms");
for (const t of TERMS) ok(TERM_GROUPS[t.g] && t.d.length > 20 && t.ex.length > 5, `term ${t.t}`);
for (const g of Object.keys(TERM_GROUPS)) ok(TERMS.filter(t => t.g === g).length >= 4, `group ${g} has distractors`);

// ---- Essays: every model paragraph must pass the checker cleanly (the checker must not flag strong writing)
ok(ESSAYS.length === 6 && LEVELS.length === 4, "6 essay guides");
for (const e of ESSAYS) {
  ok(e.rubric.length >= 4 && e.rubric.every(r => r.lv.length === 4 && r.k && r.row), `${e.id} rubric`);
  ok(e.frames.length >= 2 && e.checklist.length >= 5 && e.traps.length >= 3 && e.parts.length >= 3, `${e.id} guide parts`);
  const r = Checker.check(e.model.text, e.check, {type: e.id, lenses: LENSES});
  ok(r.fixes === 0, `${e.id} model has no fixes: ${r.findings.map(f => f.msg).join("; ")}`);
  ok(r.tips <= 1, `${e.id} model has at most one tip: ${r.findings.map(f => f.msg).join("; ")}`);
  if (e.id !== "narrative") ok(r.thesis && r.thesis.score >= r.thesis.of - 1, `${e.id} model topic sentence passes the thesis checks`);
}
// ---- Drills and prompts
ok(distinct(DRILLS.map(d => d.id)), "drill ids unique");
for (const d of DRILLS) {
  if (d.kind === "mc") ok(d.c.length === 4 && distinct(d.c) && d.why, `drill ${d.id}`);
  else ok(d.model && d.check.length >= 2 && d.q, `drill ${d.id}`);
}
const wp = DRILLS.find(d => d.id === "w-present"); ok(wp.absent.every(w => !new RegExp(`\\b${w}\\b`).test(wp.model)), "present-tense model has none of the past verbs");
for (const p of PROMPTS) ok(p.upto >= 1 && p.upto <= 12 && ESSAYS.some(e => e.id === p.type) && p.min >= 30, `prompt ${p.id}`);
ok(TIMED_TIPS.length >= 4, "timed tips");
// ---- Coach
ok(distinct(ADVICE.map(a => a.id)) && ADVICE.every(a => a.body.length >= 2), "advice");
ok(ADVICE.find(a => a.id === "heavy").body.join(" ").includes("988") && CONTENT_NOTES[1].includes("988"), "crisis line in the content note");
ok(EMAILS.every(e => e.body.includes("[") && e.subject), "email templates");
ok(SEMINAR.levels.length === 3 && Object.keys(SEMINAR.starters).length >= 4 && INTEGRITY.length > 20, "seminar and integrity");

// ---- Checker
const C = Checker;
const sents = t => C.sentences(t, {s: 0, e: t.length}).map(s => s.text);
ok(sents("Mr. Smith arrives (Golding 42). Then he leaves.").length === 2, "abbreviation and citation stay in one sentence");
ok(sents("He cries, \"It was his eye! yes, it was this!\" (Poe). It ends.").length === 2, "! inside a quotation doesn't split");
ok(sents("The bell rang at 8:30 a.m. in the U.S. today. Next.").length === 2, "a.m. and U.S. don't split");
ok(sents("It was over. then they left.").length === 2, "a lowercase start after a period still splits");
ok(C.quotes("In \"Cinderella\" the girl says \"work hard\".").length === 1, "a title in quotation marks is not evidence");
const th = s => C.thesisCheck(s, {type: "lens", title: "Lord of the Flies", author: "Golding"});
ok(th("Read through a Marxist lens, Lord of the Flies reveals that power follows control of food and fire, not votes.").ok, "strong lens thesis passes");
ok(!th("In this essay I will talk about Lord of the Flies.").ok, "announcement fails");
ok(!th("Lord of the Flies is a novel about boys on an island.").parts.find(p => p.label.startsWith("Arguable")).pass, "plot fact fails arguable");
ok(!th("Why do the boys become savages?").parts.find(p => p.label.startsWith("Is a statement")).pass, "question fails");
const weak = `in this essay I will talk about lord of the flies. There are alot of things that happen in the book.

"Ralph blew the conch." This quote shows that Ralph is the leader. Then Jack got mad. Next they had a vote. After that Jack left. I think Golding wrote this book to show that people are bad.

Jack painted his face (pg. 64). You can tell he don't care. Golding describes the mask as "a thing on its own" (Golding, 64). He also says it is "behind which Jack hid".(65) and that is it.

In conclusion, the book is really good and there are lots of things to learn from it. It's a good book.`;
const W = C.check(weak, ESSAYS[0].check, {type: "lens", lenses: LENSES}), has = re => W.findings.some(f => re.test(f.msg));
for (const [re, what] of [[/No clear thesis/, "thesis"], [/Dropped quotation/, "dropped quote"], [/without a citation/, "missing citation"], [/I think/, "I think"], [/Contractions/, "contractions"], [/just the page number/, "pg."], [/No comma/, "comma in citation"],
  [/Capitalize the title/, "title capitals"], [/lowercase/, "lowercase start"], [/lens isn't named/, "lens"], [/plot summary/, "summary"], [/Weak commentary/, "weak commentary"], [/In conclusion/, "in conclusion"], [/alot/, "alot"], [/Past tense/, "past tense"], [/'You'/, "you"], [/Vague/, "vague"]])
  ok(has(re), `weak essay flags ${what}`);
ok(W.fixes >= 8, "weak essay has many fixes");
ok(C.check(`Golding shows the boys' fear growing as "the beast" becomes real to them (Golding 89). Their panic is not about an animal; it is the fear of what they are becoming, and naming it gives them something outside themselves to blame for what is inside. That move matters because it lets Jack turn fear into power.`, {quotes: true, cite: true, present: true}, {type: "lit"}).fixes === 0, "a clean paragraph has no fixes");
const per = C.check(`The boys turn against Piggy, and the novel asks us to see why. Golding writes that Piggy cries "I got the conch." (Golding 180). Nobody listens. That silence matters more than any speech in the book, because the conch only works when people agree to let it.`, {quotes: true, cite: true}, {type: "lit"});
ok(per.findings.some(f => /Period before the citation/.test(f.msg)), "period before the citation is flagged");
const arg = C.check(`Schools should ban phones during class because they divide attention. A 2015 study found that test scores rose after phone bans (Beland and Murphy). Some parents argue that phones keep students reachable in an emergency. However, families can still reach students through the front office, so safety does not require a phone in every pocket.`, ESSAYS.find(e => e.id === "argument").check, {type: "argument"});
ok(!arg.findings.some(f => f.area === "counter"), "counterclaim and rebuttal are found");
ok(C.check(`Schools should ban phones during class because they divide attention, and students learn more without them. Teachers see it every day in every room of every school across the country now. A ban is simple to enforce, costs nothing, and gives every student the same chance to focus in class.`, ESSAYS.find(e => e.id === "argument").check, {type: "argument"}).findings.some(f => /No counterclaim/.test(f.msg)), "missing counterclaim is flagged");
const nar = C.check(`I walk into the gym and the lights were bright. Everyone is staring at me. I said nothing and went to my seat. My hands are shaking and the floor was cold under my shoes. I sat down. Now I know that fear passes.`, ESSAYS.find(e => e.id === "narrative").check, {type: "narrative"});
ok(nar.findings.some(f => /tense switches/.test(f.msg)), "narrative tense switching is flagged");
ok(C.check("Too short.", {}, {}).findings.length === 1, "short text gets one note, no crash");
console.log(`${n} checks passed.`);
