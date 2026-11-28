// Checks every piece of content and the draft checker. Run: node test.js
const assert = require("assert");
const {COURSE} = require("./content/course.js"), {F451} = require("./content/f451.js");
const {TERMS, TERM_GROUPS} = require("./content/terms.js"), {ESSAYS, DRILLS, PROMPTS, TIMED_TIPS, LEVELS} = require("./content/writing.js");
const {ADVICE, CONTENT_NOTES, SEMINAR, EMAILS, INTEGRITY} = require("./content/coach.js"), {Checker} = require("./lib/checker.js");
const {ASP} = require("./content/asp.js"), {ARG} = require("./content/argument.js");
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const distinct = a => new Set(a.map(x => String(x).trim().toLowerCase())).size === a.length;

// ---- Course: Ira's 2026-27 syllabus, five units a semester
ok(COURSE.units.length === 10 && COURSE.units.every((u, i) => u.u === i + 1), "10 units in order");
ok(COURSE.units.filter(u => u.sem === 1).length === 5 && COURSE.units.filter(u => u.sem === 2).length === 5, "five units each semester");
ok(COURSE.units.every(u => !u.essay || ESSAYS.some(e => e.id === u.essay)), "every unit's essay points at a guide");
ok(COURSE.units.every(u => u.skills.length >= 4 && /^#[0-9a-f]{6}$/.test(u.color)) && distinct(COURSE.units.map(u => u.color)), "skills and distinct colors");
ok(COURSE.objectives.length === 11 && COURSE.seminars, "course goals from the syllabus");
const unitOf = b => COURSE.units.find(u => u.book === b);
ok(unitOf("f451").u === 3 && unitOf("asp").u === 4 && COURSE.units.find(u => u.workshop).u === 5, "F451 is unit 3, A Small Place 4, argument 5");
ok(COURSE.units.filter(u => u.ready).map(u => u.u).join() === "1,3,4,5", "units 1, 3, 4 and 5 are ready");
ok(!JSON.stringify(COURSE).includes("Lord of the Flies"), "no Lord of the Flies in the course");

// ---- Fahrenheit 451 (Unit 3)
ok(F451.chapters.length === 7 && F451.chapters_n === 7 && F451.cite === "Bradbury" && F451.unit === 3 && F451.parts.length === 3, "Fahrenheit 451: 7 sections in 3 parts");
ok(F451.chapters.map(c => c.part).join("") === "1112233", "sections 1-3 are Part One, 4-5 Part Two, 6-7 Part Three");
for (const c of F451.chapters) {
  ok(c.sum.length === 2 && c.sum.every(p => p.split(/\s+/).length >= 45), `f451 ${c.n}: two full summary paragraphs`);
  ok(c.events.length >= 5 && c.watch.length >= 3 && c.hunt.length === 3 && c.seminar.length === 3 && c.craft && c.craft.name && c.craft.text.length > 60, `f451 ${c.n}: parts`);
  // The novel is under copyright: no double-quoted text anywhere in the guide (single quotes mark titles and our own words).
  for (const t of [...c.sum, ...c.events, ...c.watch, ...c.hunt, ...c.seminar, c.craft.text]) ok(!/["“”]/.test(t), `f451 ${c.n}: no quotation marks in "${t.slice(0, 40)}"`);
}
const fBy = {}; for (const q of F451.questions) (fBy[q[0]] = fBy[q[0]] || []).push(q);
ok(F451.questions.length === 56 && Object.values(fBy).every(a => a.length === 8), "56 reading checks, 8 per section");
let longestRight = 0;
for (const [ch, kind, q, c, why] of F451.questions) {
  ok(ch >= 1 && ch <= 7 && ["plot", "character", "symbol", "theme", "inference", "craft"].includes(kind), `q kind: ${q}`);
  ok(c.length === 4 && distinct(c) && c.every(x => x.trim()), `4 distinct choices: ${q}`);
  ok(/\?$/.test(q.trim()), `question form: ${q}`);
  ok(why.length > 20 && !/\b(?:choice|option|answer) [A-D]\b/.test(why), `why: ${q}`);
  if (c[0].length > Math.max(...c.slice(1).map(x => x.length))) longestRight++;
  // No spoilers: a question never names someone who first appears in a later section, by full or short name
  for (const x of F451.characters.filter(x => x.from > ch)) for (const nm of [x.name, x.short].filter(Boolean)) ok(![q, ...c, why].some(t => t.includes(nm)), `section ${ch} names ${nm}, who appears in section ${x.from}: ${q}`);
}
console.log(`Fahrenheit 451: right answer longest in ${longestRight}/56`);
ok(longestRight / 56 >= 0.1 && longestRight / 56 <= 0.45, "answer length gives nothing away either way");
for (const c of F451.characters) ok(c.from >= 1 && c.from <= 7 && c.role && c.angle && c.arc.every(([k], i, a) => k >= c.from && k <= 7 && (!i || k >= a[i - 1][0])), `${c.id} arc in order`);
for (const x of F451.symbols) ok(x.track.every(([k], i, a) => k >= x.from && k <= 7 && (!i || k >= a[i - 1][0])), `${x.id} track in order`);
for (const t of F451.themes) ok(t.track.every(([k]) => k >= 1 && k <= 7), t.id);
ok(F451.qtags.every(([id, label, from]) => id && label && from >= 1 && from <= 7) && distinct(F451.qtags.map(t => t[0])), "f451 quote tags");
for (const x of F451.characters) for (const [, label, from] of F451.qtags) if (x.short && label.includes(x.short)) ok(from >= x.from, `tag ${label} unlocks no earlier than ${x.short}`);
ok(F451.context.length >= 3 && F451.slang.length >= 5 && F451.names.length >= 5, "f451 context, key words and names");
// Roles and symbol meanings show as soon as an entry unlocks, so they mustn't name anyone who arrives later
for (const x of [...F451.characters, ...F451.symbols]) for (const y of F451.characters.filter(y => y.from > x.from && y.short)) ok(!(x.role || x.means).includes(y.short), `${x.id} names ${y.short} too early`);

// ---- Terms
ok(TERMS.length >= 90 && distinct(TERMS.map(t => t.t)), "90+ unique terms");
ok(!JSON.stringify(TERMS).match(/Golding|Ralph|Piggy|conch/), "no Lord of the Flies examples left in the glossary");
for (const t of TERMS) ok(TERM_GROUPS[t.g] && t.d.length > 20 && t.ex.length > 5, `term ${t.t}`);
for (const g of Object.keys(TERM_GROUPS)) ok(TERMS.filter(t => t.g === g).length >= 4, `group ${g} has distractors`);

// ---- Essays: every model paragraph must pass the checker cleanly (the checker must not flag strong writing)
ok(ESSAYS.length === 5 && LEVELS.length === 4, "5 essay guides");
ok(ESSAYS.every(e => e.units.length && e.units.every(u => COURSE.units.some(U => U.u === u && (U.essay === e.id || (e.id === "lit" && U.u === 2))))), "essay guides point at their units");
for (const e of ESSAYS) {
  ok(e.rubric.length >= 4 && e.rubric.every(r => r.lv.length === 4 && r.k && r.row), `${e.id} rubric`);
  ok(e.frames.length >= 2 && e.checklist.length >= 5 && e.traps.length >= 3 && e.parts.length >= 3, `${e.id} guide parts`);
  const r = Checker.check(e.model.text, e.check, {type: e.id});
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
for (const p of PROMPTS) {
  const max = {f451: 7, asp: 4, "": 0}[p.book];
  ok(max !== undefined && (p.book ? (p.upto >= 1 || p.open) && p.upto <= max : p.upto === 0) && ESSAYS.some(e => e.id === p.type) && p.min >= (p.para ? 15 : 30), `prompt ${p.id}`);
}
ok(PROMPTS.filter(p => p.book === "f451").length >= 5, "five or more Fahrenheit 451 timed writes");
ok(!JSON.stringify([DRILLS, PROMPTS, ESSAYS]).match(/Golding|Ralph|Piggy|conch|Lord of the Flies|lens/i), "no Lord of the Flies or lens content in writing");
ok(new Set(PROMPTS.map(p => p.id)).size === PROMPTS.length, "prompt ids unique");
ok(TIMED_TIPS.length >= 4, "timed tips");
// ---- A Small Place (Unit 4)
ok(ASP.chapters.length === 4 && ASP.chapters_n === 4 && ASP.cite === "Kincaid" && ASP.unit === 4, "A Small Place: 4 sections, unit 4");
for (const c of ASP.chapters) {
  ok(c.sum.length === 2 && c.sum.every(p => p.split(/\s+/).length >= 45), `asp ${c.n}: two full summary paragraphs`);
  ok(c.events.length >= 5 && c.watch.length >= 3 && c.hunt.length === 3 && c.seminar.length === 3 && c.move && c.move.name && c.move.text.length > 60, `asp ${c.n}: parts`);
  for (const t of [...c.sum, ...c.events, ...c.watch, ...c.hunt, ...c.seminar, c.move.text]) ok(!/["“”]/.test(t), `asp ${c.n}: no quotation marks in "${t.slice(0, 40)}"`);
}
const aspBy = {}; for (const q of ASP.questions) (aspBy[q[0]] = aspBy[q[0]] || []).push(q);
ok(ASP.questions.length === 32 && Object.values(aspBy).every(a => a.length === 8), "32 A Small Place questions, 8 per section");
for (const [ch, kind, q, c, why] of ASP.questions) {
  ok(["plot", "character", "symbol", "theme", "inference", "rhetoric"].includes(kind) && c.length === 4 && distinct(c) && /\?$/.test(q) && why.length > 20, `asp q: ${q}`);
  for (const v of ASP.characters.filter(x => x.from > ch)) ok(![q, ...c].some(t => t.includes(v.name)), `asp section ${ch} names ${v.name}: ${q}`);
}
for (const x of [...ASP.characters, ...ASP.symbols]) ok(x.from >= 1 && x.from <= 4 && (x.arc || x.track).every(([k]) => k >= x.from && k <= 4), `asp ${x.id}`);
ok(ASP.themes.length >= 5 && ASP.context.length >= 3, "asp themes and context");
// ---- Argument workshop (Unit 5)
const lessonIds = ARG.lessons.map(l => l.id), srcIds = ARG.sources.map(x => x.id);
ok(ARG.lessons.length === 8 && distinct(lessonIds) && ARG.lessons.every(l => l.points.length >= 3 && l.example.length >= 1 && l.why.length > 40), "8 argument lessons");
ok(ARG.fallacies.length === 14 && distinct(ARG.fallacies.map(f => f.name)) && ARG.fallacies.every(f => f.d && f.ex && f.fix), "14 fallacies");
ok(ARG.sources.length === 5 && ARG.sources.filter(x => x.year).every(x => x.year < 1929), "public-domain sources are pre-1929");
ok(ARG.sources.filter(x => !x.year).every(x => /hypothetical/i.test(x.kind) && /made up/i.test(x.author)), "practice sources are labeled made up");
ok(ARG.debate.motions.length >= 5 && ARG.debate.format.length === 4, "debate motions and format");
for (const [src, kind, q, c, why] of ARG.questions) ok((lessonIds.includes(src) || srcIds.includes(src)) && ["claim", "evidence", "reasoning", "sources", "counter", "fallacy", "appeal", "debate", "rhetoric"].includes(kind) && c.length === 4 && distinct(c) && /\?$/.test(q.trim()) && why.length > 10, `arg q: ${q}`);
ok(ARG.questions.length >= 50, "50+ argument questions");
for (const l of ARG.lessons) ok(ARG.questions.some(q => q[0] === l.id), `lesson ${l.id} has questions`);
// The fallacy names in questions match the gallery, so generated and written items agree
for (const [src, kind, q, c] of ARG.questions.filter(x => x[1] === "fallacy")) ok(c.every(name => ARG.fallacies.some(f => f.name === name)), `fallacy names: ${q}`);
let lr2 = 0; const both = ASP.questions.concat(ARG.questions);
for (const q of both) if (q[3][0].length > Math.max(...q[3].slice(1).map(x => x.length))) lr2++;
console.log(`Units 4 and 5: right answer longest in ${lr2}/${both.length}`);
ok(lr2 / both.length >= 0.1 && lr2 / both.length <= 0.45, "units 4 and 5: answer length gives nothing away");

// ---- Intro to Rhetoric (Unit 4): Ira's class study sheet, the banks, the annotations, the passages and the rhetoric checks
const {RHET} = require("./content/rhetoric.js"), {RhetCheck: R} = require("./lib/rhetcheck.js");
const TT = Object.fromEntries(TERMS.map(t => [t.t, t])), sheetOrder = Object.values(RHET.order).flat();
ok(sheetOrder.length === 34 && distinct(sheetOrder) && sheetOrder.every(t => TT[t] && TT[t].sheet), "34 study-sheet terms, all in the glossary");
ok(Object.entries(RHET.order).every(([g, list]) => list.every(t => TT[t].sheet === g)) && TERMS.filter(t => t.sheet).length === 34, "each sheet term sits in its sheet group");
ok(RHET.order.key.length === 7 && RHET.order.evidence.length === 4 && RHET.order.style.length === 16 && RHET.order.faulty.length === 7, "sheet groups: 7 key, 4 evidence, 16 style, 7 faulty");
ok(RHET.syntax.length === 11 && RHET.syntax.every(t => RHET.order.style.includes(t)), "the 11 syntax-list devices are on the style list");
ok(TT.Juxtaposition.extra && TT.Apostrophe.extra && /Not the punctuation/.test(TT.Apostrophe.d), "the two syntax terms the sheet doesn't define are marked");
ok(RHET.build.length === 16 && new Set(RHET.build.map(b => b.t)).size === 16 && RHET.build.every(b => RHET.order.style.includes(b.t) && b.task && b.model && b.tip), "a sentence-building task for every style device");
const roots = t => t.toLowerCase().split(/[\s/()-]+/).filter(w => w.length >= 4).map(w => w.slice(0, 4)), gives = (t, ex) => roots(t).some(r => new RegExp(`\\b${r}`, "i").test(ex));
ok(RHET.devices.length >= 45, "45+ device items");
for (const [t, ex, wrong, why] of RHET.devices) {
  ok(RHET.order.style.includes(t) && wrong.length === 3 && distinct([t, ...wrong]) && wrong.every(w => RHET.order.style.includes(w)) && why.length > 20, `device item: ${ex}`);
  ok(!gives(t, ex), `the example doesn't name its device: ${ex}`);
  ok(R.device(t, ex).ok !== false, `the device check accepts the bank's ${t} example: ${ex}`);
}
for (const t of RHET.order.style) ok(RHET.devices.filter(d => d[0] === t).length >= 2, `two or more items for ${t}`);
for (const [t, ex, why] of RHET.appeals) ok(["Ethos", "Pathos", "Logos"].includes(t) && why, `appeal item: ${ex}`);
for (const [t, ex, why] of RHET.evidence) ok(RHET.order.evidence.includes(t) && !gives(t, ex) && why, `evidence item: ${ex}`);
for (const [t, ex, why] of RHET.faulty) ok(RHET.order.faulty.includes(t) && t !== "Logical fallacy" && !gives(t, ex) && why, `faulty reasoning item: ${ex}`);
for (const t of ["Ethos", "Pathos", "Logos"]) ok(RHET.appeals.filter(a => a[0] === t).length >= 3, `three or more ${t} items`);
for (const [b, q, c, why] of RHET.questions) ok(["claim", "proc", "asp1"].includes(b) && c.length === 4 && distinct(c) && c.every(x => x.trim()) && why.length > 15, `rhetoric question: ${q}`);
let lr3 = 0; for (const q of RHET.questions) if (q[2][0].length > Math.max(...q[2].slice(1).map(x => x.length))) lr3++;
console.log(`Rhetoric questions: right answer longest in ${lr3}/${RHET.questions.length}`);
ok(lr3 / RHET.questions.length >= 0.1 && lr3 / RHET.questions.length <= 0.45, "rhetoric questions: answer length gives nothing away");
// A Small Place is under copyright: the annotation cards and questions describe moments and quote none of the book
const asp1 = RHET.asp1, colors = RHET.organizer.colors.map(c => c[0]);
ok(asp1.length >= 12 && asp1.every(a => a.title && a.find && a.what && a.devices.length && a.terms.length && ["Ethos", "Pathos", "Logos"].includes(a.appeal) && colors.includes(a.c) && a.effect && a.purpose && a.starter.includes("___") && a.debate), "annotation cards are complete");
ok(asp1.every(a => a.terms.every(t => TT[t] && TT[t].sheet)), "annotation cards tag study-sheet terms");
for (const a of asp1) ok(![a.find, a.what, a.effect, a.purpose, a.starter, a.debate].some(x => /["“”]/.test(x)), `no quotation marks on the ${a.title} card`);
for (const [b, q, c, why] of RHET.questions.filter(x => x[0] === "asp1")) ok(![q, ...c, why].some(x => /["“”]/.test(x)), `no quotation marks: ${q}`);
ok(sheetOrder.every(t => asp1.some(a => a.terms.includes(t)) || RHET.aspGaps.some(g => g[0] === t)), "every sheet term is found in pages 1-9 or explained");
ok(Object.values(RHET.soapAsp).every(x => x.length > 5) && Object.keys(RHET.soapAsp).join() === "sp,oc,au,pu,su,to", "the class SOAPSTone");
// Passages: public domain (before 1929, or a U.S. president's official address), and the model quotes its passage exactly
for (const P of RHET.passages) ok(P.text.length && P.cite && P.occasion && (P.year < 1929 || ["jfk", "fdr"].includes(P.id)) && P.devices.every(d => TT[d]), `passage ${P.id}`);
const M = RHET.model, MP = RHET.passages.find(P => P.id === M.passage), mtext = MP.text.join(" ");
for (const q of [M.ev1, M.ev2].flatMap(e => [...e.matchAll(/"([^"]+)"/g)].map(m => m[1]))) ok(mtext.includes(q), `the model quotes the speech exactly: ${q}`);
for (const p of PROMPTS.filter(x => x.passage)) ok(RHET.passages.some(P => P.id === p.passage) || ARG.sources.some(x => x.id === p.passage), `prompt ${p.id} passage exists`);
ok(PROMPTS.filter(p => p.para).length >= 6 && PROMPTS.some(p => p.id === "ra-asp" && p.open), "one-paragraph timed writes, including the open-note one");
ok(RHET.cards.length >= 4 && RHET.cards.every(c => c.pro.length >= 3 && c.con.length >= 3 && c.avoid.length), "debate cards");
ok(RHET.organizer.steps.length === 5 && RHET.organizer.guiding.length === 5 && RHET.organizer.annotate.length === 7 && RHET.organizer.colors.length === 5, "the class paragraph plan and annotation steps");
// The checks
const negatives = [["Anaphora", "We went to the beach and then we ate lunch at the hotel."], ["Epistrophe", "The town changed, the people moved and the stores closed."], ["Asyndeton", "I bought apples, pears, and plums at the market."],
  ["Polysyndeton", "We swam and then we ate dinner at home."], ["Litotes", "The test was very hard for everyone in class."], ["Rhetorical question", "Why is the sky blue? Because of how light scatters."],
  ["Hypophora", "Why does the island have so few doctors?"], ["Repetition", "The island is beautiful and the water is clear."], ["Analogy", "The island looked beautiful from the plane today."], ["Antithesis", "The island looked beautiful from the plane today."]];
for (const [t, x] of negatives) ok(R.device(t, x).ok === false, `the ${t} check rejects: ${x}`);
for (const b of RHET.build) ok(R.device(b.t, b.model).ok !== false, `the ${b.t} model passes its check`);
const mpara = [M.claim, M.ev1, M.re1, M.ev2, M.re2, M.concl].join(" "), mg = R.grade(mpara, {author: "Kennedy"});
ok(mg.total >= 22 && mg.rows.length === 6, `the model paragraph scores high (${mg.total}/24)`);
ok(R.thesis(M.claim, {author: "Kennedy"}).ok && R.evidence(M.ev1).ok && R.evidence(M.ev2).ok && R.reasoning(M.re1).ok && R.reasoning(M.re2).ok, "every box of the model plan passes its own check");
ok(R.thesis(M.thesis, {author: "Kennedy"}).ok && !R.thesis("Kennedy gave a speech in 1961.", {author: "Kennedy"}).ok, "thesis check: purpose and method");
const weakRA = "Kennedy gave a speech. I think it was good. He used repetition. You can tell he wanted people to help. This quote shows he is serious. In conclusion the speech has a lot of things in it that are good and important for people.";
const wg = R.grade(weakRA, {author: "Kennedy"});
ok(wg.total <= 11, `a weak paragraph scores low (${wg.total}/24)`);
const midRA = `Kennedy uses antithesis to urge Americans to serve their country. He tells them to "ask not what your country can do for you" (Kennedy). This line makes the audience think about what they owe. It is very memorable and people still quote it.`;
const mg2 = R.grade(midRA, {author: "Kennedy"});
ok(mg2.total > wg.total && mg2.total < mg.total, `a middling paragraph lands between (${mg2.total}/24)`);
ok(R.grade("Too short to grade.", {}).short, "too short to grade");
ok(R.analysis("Kincaid's repeated rhetorical questions expose the government's neglect, making readers suspicious of the leaders to show how tourism hides corruption.").ok && !R.analysis("Kincaid uses words in her book a lot.").ok, "analysis sentence check");
const goodMove = R.debateMove("Some argue that tourism helps Antigua because it creates jobs for local people.", "However, many of those jobs pay little, and most of the profit leaves the island, so the benefits are smaller than they look.");
ok(goodMove.ok && !R.debateMove("Tourism is good.", "No.").ok, "debate move check");
ok(R.debateMove("Critics claim the book is unfair to tourists who mean well.", "You're just too young to understand the book, so your opinion doesn't count.").fallacies.some(f => f[0] === "Ad hominem"), "the debate check flags an ad hominem");
ok(R.fallacyScan("Either we build the resort or the island will collapse.").some(f => f[0] === "Either/or fallacy"), "the debate check flags an either/or");
ok(R.reasoning("The repetition builds suspense. It makes readers suspicious of the government, which supports her claim.").ok && !R.reasoning("This quote shows she is mad.").ok, "reasoning box check");
ok(R.evidence('He promises to "pay any price, bear any burden" (Kennedy).').ok && !R.evidence('"pay any price, bear any burden"').ok, "evidence box check");

// ---- Coach
ok(distinct(ADVICE.map(a => a.id)) && ADVICE.every(a => a.body.length >= 2), "advice");
ok(ADVICE.find(a => a.id === "heavy").body.join(" ").includes("988") && CONTENT_NOTES[2].includes("988") && CONTENT_NOTES[3].includes("988"), "crisis line in the content notes");
ok(Object.keys(CONTENT_NOTES).every(u => COURSE.units.some(U => U.u === Number(u))) && CONTENT_NOTES[6].includes("Night"), "content notes sit on the right units");
ok(!JSON.stringify(ADVICE).match(/2024|Ralph|Golding|Jack/), "advice has no old-syllabus specifics");
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
const th = s => C.thesisCheck(s, {type: "lit", title: "Fahrenheit 451", author: "Bradbury"});
ok(th("In Fahrenheit 451, Bradbury uses the parlor walls to show that constant entertainment can leave people unable to feel their own lives.").ok, "strong thesis passes");
ok(!th("In this essay I will talk about Fahrenheit 451.").ok, "announcement fails");
ok(!th("Fahrenheit 451 is a novel about a fireman who burns books.").parts.find(p => p.label.startsWith("Arguable")).pass, "plot fact fails arguable");
ok(!th("Why does Montag start to doubt his job?").parts.find(p => p.label.startsWith("Is a statement")).pass, "question fails");
// The weak essay below uses invented 'quotations' to exercise the checker; none of them comes from the novel.
const weak = `in this essay I will talk about fahrenheit 451. There are alot of things that happen in the book.

"Montag liked fire." This quote shows that Montag is a fireman. Then Clarisse left. Next he went home. After that Mildred was sick. I think Bradbury wrote this book to show that TV is bad.

Montag hid a book (pg. 64). You can tell he don't care. Bradbury describes the book as "a small dark thing" (Bradbury, 64). He also says it is "under the pillow".(65) and that is it.

In conclusion, the book is really good and there are lots of things to learn from it. It's a good book.`;
const W = C.check(weak, ESSAYS.find(e => e.id === "lit").check, {type: "lit", title: "Fahrenheit 451", author: "Bradbury", names: F451.names}), has = re => W.findings.some(f => re.test(f.msg));
for (const [re, what] of [[/No clear thesis|Thesis/, "thesis"], [/Dropped quotation/, "dropped quote"], [/without a citation/, "missing citation"], [/I think/, "I think"], [/Contractions/, "contractions"], [/just the page number/, "pg."], [/No comma/, "comma in citation"],
  [/Capitalize the title: Fahrenheit 451/, "title capitals"], [/lowercase/, "lowercase start"], [/plot summary/, "summary"], [/Weak commentary/, "weak commentary"], [/In conclusion/, "in conclusion"], [/alot/, "alot"], [/Past tense/, "past tense"], [/'You'/, "you"], [/Vague/, "vague"]])
  ok(has(re), `weak essay flags ${what}`);
ok(W.findings.filter(f => f.hint).every(f => !/Golding|Ralph|Piggy|conch/.test(f.hint)), "checker hints use the class's books, not Lord of the Flies");
ok(!C.check("Kincaid argues that in a small place, every event feels enormous. The phrase names a way of seeing that cuts people off from their history, and the rest of her argument depends on it. Readers who skim past it miss the reason the island's problems repeat themselves.", {}, {type: "rhetorical", title: "A Small Place"}).findings.some(f => /Capitalize the title/.test(f.msg)), "the phrase a small place is not flagged as a title");
ok(W.fixes >= 8, "weak essay has many fixes");
ok(C.check(`Poe's narrator insists that he is only "very, very dreadfully nervous" (Poe). The doubled word sounds less like calm reasoning than like a mind starting to spin, and that slip matters because it shows the reader the madness he is trying to deny.`, {quotes: true, cite: true, present: true}, {type: "lit"}).fixes === 0, "a clean paragraph has no fixes");
const per = C.check(`The narrator keeps arguing his case, and Poe asks us to see why. The narrator insists that he is "very, very dreadfully nervous." (Poe 3). Nobody asked. That defensiveness matters more than any confession, because it shows the reader a guilt he cannot hide.`, {quotes: true, cite: true}, {type: "lit"});
ok(per.findings.some(f => /Period before the citation/.test(f.msg)), "period before the citation is flagged");
const arg = C.check(`Schools should ban phones during class because they divide attention. A 2015 study found that test scores rose after phone bans (Beland and Murphy). Some parents argue that phones keep students reachable in an emergency. However, families can still reach students through the front office, so safety does not require a phone in every pocket.`, ESSAYS.find(e => e.id === "argument").check, {type: "argument"});
ok(!arg.findings.some(f => f.area === "counter"), "counterclaim and rebuttal are found");
ok(C.check(`Schools should ban phones during class because they divide attention, and students learn more without them. Teachers see it every day in every room of every school across the country now. A ban is simple to enforce, costs nothing, and gives every student the same chance to focus in class.`, ESSAYS.find(e => e.id === "argument").check, {type: "argument"}).findings.some(f => /No counterclaim/.test(f.msg)), "missing counterclaim is flagged");
const nar = C.check(`I walk into the gym and the lights were bright. Everyone is staring at me. I said nothing and went to my seat. My hands are shaking and the floor was cold under my shoes. I sat down. Now I know that fear passes.`, ESSAYS.find(e => e.id === "narrative").check, {type: "narrative"});
ok(nar.findings.some(f => /tense switches/.test(f.msg)), "narrative tense switching is flagged");
ok(C.check("Too short.", {}, {}).findings.length === 1, "short text gets one note, no crash");
console.log(`${n} checks passed.`);
