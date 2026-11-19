// Expands the banks in gen_a/gen_b/gen_c into questions, and generates data-table questions.
// Output: RW_GEN, an array of items in the same shape as rw_bank.js, interleaved by source within each area.
const RW_GEN = (() => {
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function shuffle(R, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const pick = (R, a) => a[Math.floor(R() * a.length)];
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const cap = s => s.replace(/[A-Za-z]/, c => c.toUpperCase());
const bare = w => w.replace(/,$/, "");
const pos = n => (/s$/.test(n) ? n + "’" : n + "’s");
const num = x => (x === "s" ? "singular" : "plural");
const other = x => (x === "s" ? "plural" : "singular");
const pad2 = n => String(n).padStart(2, "0");
const dot = t => (/\.$/.test(t) ? t : t + ".");
function interleave(lists) { const out = [], L = lists.map(l => l.slice()); while (L.some(l => l.length)) for (const l of L) if (l.length) out.push(l.shift()); return out; }
function spread(base, extra) { const out = base.slice(), step = Math.floor(base.length / (extra.length + 1)); extra.forEach((it, i) => out.splice((i + 1) * step + i, 0, it)); return out; }
function splitLast(clause) { const w = clause.split(" "); const last = w.pop(); return [w.join(" "), last]; }

// ---------- Transitions and sentence function (from PAIRS) ----------
const CAT = {
  contrast: { words: ["However,"], sig: "signals a contrast", tsp: "It presents information that contrasts with the first sentence.", neg: "contrast with the first sentence" },
  addition: { words: ["Additionally,", "Moreover,", "Furthermore,", "In addition,"], sig: "adds another, related point", tsp: "It adds a second point that builds on the first sentence.", neg: "add a separate point" },
  result: { words: ["As a result,", "Therefore,", "Consequently,"], sig: "signals a result", tsp: "It describes a consequence of what the first sentence describes.", neg: "describe a consequence" },
  example: { words: ["For example,", "For instance,"], sig: "introduces an example", tsp: "It gives a specific example of the general claim in the first sentence.", neg: "give an example of the first sentence’s claim" },
  sequence: { words: ["Later,", "Eventually,"], sig: "signals a later development", tsp: "It describes a later development that followed the first sentence’s situation.", neg: "describe a later development" },
  restate: { words: ["In other words,"], sig: "introduces a restatement", tsp: "It restates the first sentence’s point in plainer terms.", neg: "restate the first sentence" },
  similar: { words: ["Similarly,"], sig: "signals a similarity", tsp: "It describes a case that closely resembles the one in the first sentence.", neg: "describe a similar case" }
};
const DISTRACT_WORD = { contrast: "However,", addition: "Additionally,", result: "As a result,", example: "For example,", sequence: "Later,", restate: "In other words,", similar: "Similarly," };
const CONFLICT = { contrast: ["sequence"], addition: ["example", "similar"], result: ["sequence"], example: ["addition", "similar"], sequence: ["result", "contrast"], restate: [] };
const TRA = [], TSP = [], seenRel = {};
PAIRS.forEach(([rel, s1, s2, does], i) => {
  const R = rng(hash("pair" + i)), allowed = Object.keys(CAT).filter(c => c !== rel && !CONFLICT[rel].includes(c));
  const wrongCats = shuffle(R, allowed).slice(0, 3);
  const k = (seenRel[rel] = (seenRel[rel] || 0) + 1);
  if (k % 2 === 1) {
    const a = pick(R, CAT[rel].words);
    TRA.push({ id: "tra" + pad2(i), d: "EOI", s: "TRA", q: "tra", p: `${s1} ______ ${s2}`,
      a, w: wrongCats.map(c => DISTRACT_WORD[c]),
      why: `The second sentence ${does}. “${bare(a)}” ${CAT[rel].sig}, which fits that relationship.`,
      no: wrongCats.map(c => `“${bare(DISTRACT_WORD[c])}” ${CAT[c].sig}, but the second sentence ${does}.`) });
  } else {
    TSP.push({ id: "tsp" + pad2(i), d: "CS", s: "TSP", q: "Which choice best describes the function of the second sentence in the text as a whole?", p: `${s1} ${cap(s2)}`,
      a: CAT[rel].tsp, w: wrongCats.map(c => CAT[c].tsp),
      why: `The second sentence ${does}. That is exactly what this choice describes.`,
      no: wrongCats.map(c => `The second sentence doesn’t ${CAT[c].neg}. It ${does}.`) });
  }
});

// ---------- Words in Context ----------
const WICI = WIC.map(([p, a, w, clue], i) => {
  for (const x of [a, ...w]) if (!GLOSS[x]) throw new Error("No definition for " + x);
  return { id: "wic" + pad2(i), d: "CS", s: "WIC", q: "wic", p, a, w,
    why: `${clue} “${cap(a)},” meaning ${GLOSS[a]}, fits that context.`,
    no: w.map(x => `“${cap(x)}” means ${GLOSS[x]}, which doesn’t match what the text describes.`) };
});

// ---------- Rhetorical Synthesis ----------
const RSI = [];
for (let g = 0; g < 4; g++) RS_SETS.forEach((set, i) => {
  const [goal, sent, does] = set.g[g], others = set.g.filter((_, j) => j !== g);
  RSI.push({ id: `rs${pad2(i)}g${g}`, d: "EOI", s: "RS", q: "rs", goal: `The student wants to ${goal}.`, notes: set.n,
    a: sent, w: others.map(o => o[1]),
    why: `The goal is to ${goal}. This sentence ${does}, which does exactly that.`,
    no: others.map(o => `This sentence ${o[2]}, but it doesn’t ${goal}.`) });
});

// ---------- Command of Evidence: Textual ----------
const CETS = [], CETW = [];
CET.forEach((x, i) => {
  const whose = `the ${pos(x.who)} ${x.k}`;
  CETS.push({ id: `cet${pad2(i)}s`, d: "II", s: "CET", q: `Which finding, if true, would most directly support ${whose}?`, p: x.c,
    a: x.s, w: [x.w, x.d[0][0], x.d[1][0]],
    why: `If this finding were true, it would be exactly what the ${x.k} predicts.`,
    no: [`This finding would weaken the ${x.k}, not support it.`, x.d[0][1], x.d[1][1]] });
  CETW.push({ id: `cet${pad2(i)}w`, d: "II", s: "CET", q: `Which finding, if true, would most directly weaken ${whose}?`, p: x.c,
    a: x.w, w: [x.s, x.d[1][0], x.d[2][0]],
    why: `If this finding were true, it would contradict what the ${x.k} predicts.`,
    no: [`This finding would support the ${x.k}, not weaken it.`, x.d[1][1], x.d[2][1]] });
});

// ---------- Command of Evidence: Quantitative (generated tables) ----------
const FR = [
  { who: "researcher", intro: "A researcher surveyed households in four towns about whether they compost food waste.", pl: "towns", label: "town", names: ["Ashford", "Brookline", "Carver", "Dalton", "Easton", "Fairview", "Glenwood", "Harlow"], noun: "composting rate", at: "in", cap: "Households that compost (percent)", col: "Town", u: " percent", lo: 6, hi: 62 },
  { who: "student", intro: "A student surveyed four schools about how many of their students walk or bike to school.", pl: "schools", label: "school", names: ["Oak Ridge", "Maple Grove", "Cedar Park", "Pine Hill", "Elm Street", "Birch Lane", "Willow Creek", "Aspen Valley"], noun: "share of students who walk or bike", at: "at", cap: "Students who walk or bike to school (percent)", col: "School", u: " percent", lo: 8, hi: 58 },
  { who: "biologist", intro: "A biologist recorded the number of bird species seen in four city parks.", pl: "parks", label: "park", names: ["Riverside Park", "Hilltop Park", "Lakeview Park", "Meadow Park", "Harbor Park", "Forest Park"], noun: "number of bird species recorded", at: "at", cap: "Bird species recorded", col: "Park", u: " species", lo: 12, hi: 64 },
  { who: "analyst", intro: "A city analyst compared annual visits at four branches of the public library.", pl: "branches", label: "branch", names: ["Central branch", "North branch", "East branch", "West branch", "South branch", "Harbor branch"], noun: "number of annual visits", at: "at the", cap: "Annual library visits (thousands)", col: "Branch", u: " thousand", lo: 40, hi: 190 },
  { who: "agronomist", intro: "An agronomist measured wheat yields on four farms.", pl: "farms", label: "farm", names: ["Miller Farm", "Owens Farm", "Patel Farm", "Reyes Farm", "Silva Farm", "Turner Farm"], noun: "wheat yield", at: "on", cap: "Wheat yield (bushels per acre)", col: "Farm", u: " bushels per acre", lo: 32, hi: 78 },
  { who: "energy researcher", intro: "An energy researcher tracked how much of the electricity in four cities came from solar power.", pl: "cities", label: "city", names: ["Alton", "Bayside", "Carlow", "Dunmore", "Elgin", "Fulton"], noun: "share of electricity from solar power", at: "in", cap: "Electricity from solar power (percent)", col: "City", u: " percent", lo: 2, hi: 44 }
];
const CEQ = [];
function ceqA(F, id) {
  for (let t = 0; t < 500; t++) {
    const R = rng(hash(id + ":" + t)), names = shuffle(R, F.names).slice(0, 4), y1 = pick(R, [2016, 2017, 2018, 2019, 2020]), y2 = y1 + pick(R, [4, 5, 6]);
    const span = F.hi - F.lo, s = [], inc = [];
    for (let k = 0; k < 4; k++) { s.push(ri(R, F.lo, F.lo + Math.floor(span * 0.6))); inc.push(ri(R, 1, Math.floor(span * 0.3))); }
    const e = s.map((v, k) => v + inc[k]);
    if (Math.min(...s.slice(1)) - s[0] < 2) continue;
    if (inc[0] - Math.max(...inc.slice(1)) < 3) continue;
    if (e.some(v => v < F.lo || v > F.hi) || new Set(e).size < 4 || new Set(s).size < 4) continue;
    const T = names[0], rows = shuffle(R, [0, 1, 2, 3]);
    return { id, d: "II", s: "CEQ", q: "Which choice most effectively uses data from the table to complete the statement?",
      p: `${F.intro} The ${F.who} noted that ${T} had the lowest ${F.noun} of the four ${F.pl} in ${y1} but showed the greatest increase by ${y2}, ______`,
      tb: { cap: F.cap, h: [F.col, String(y1), String(y2)], r: rows.map(k => [names[k], String(s[k]), String(e[k])]) },
      a: `rising from ${s[0]}${F.u} to ${e[0]}${F.u}.`, w: [1, 2, 3].map(k => `rising from ${s[k]}${F.u} to ${e[k]}${F.u}.`),
      why: `The statement is about ${T}. The table shows ${T} rising from ${s[0]}${F.u} in ${y1} to ${e[0]}${F.u} in ${y2}, an increase of ${inc[0]}, the greatest of any ${F.label}.`,
      no: [1, 2, 3].map(k => `These are ${pos(names[k])} figures, not ${pos(T)}.`) };
  }
  throw new Error("ceqA failed " + id);
}
function ceqB(F, id) {
  for (let t = 0; t < 500; t++) {
    const R = rng(hash(id + ":" + t)), names = shuffle(R, F.names).slice(0, 4), y0 = pick(R, [2019, 2020, 2021]), Y = [y0, y0 + 1, y0 + 2, y0 + 3];
    const span = F.hi - F.lo, rowsV = [];
    for (let k = 0; k < 4; k++) { let v = ri(R, F.lo, F.lo + Math.floor(span * 0.55)); const row = [v]; for (let j = 1; j < 4; j++) { v += ri(R, -Math.floor(span * 0.08), Math.floor(span * 0.12)); row.push(v); } rowsV.push(row); }
    const T = rowsV[0], O1 = rowsV[1], O2 = rowsV[2];
    if (!(T[0] < T[1] && T[1] < T[2] && T[2] < T[3])) continue;
    if (!(O1[3] > O1[0]) || (O1[0] < O1[1] && O1[1] < O1[2] && O1[2] < O1[3])) continue;
    if (!(T[1] > O2[1])) continue;
    if (rowsV.flat().some(v => v < F.lo || v > F.hi)) continue;
    if (rowsV.slice(1).some(r => r[0] < r[1] && r[1] < r[2] && r[2] < r[3])) continue;
    const at = F.at, n = F.noun, rows = shuffle(R, [0, 1, 2, 3]);
    return { id, d: "II", s: "CEQ", q: `Which choice most effectively uses data from the table to support the ${pos(F.who)} claim?`,
      p: `${F.intro} The ${F.who} claims that the ${n} ${at} ${names[0]} increased every year from ${Y[0]} to ${Y[3]}.`,
      tb: { cap: F.cap, h: [F.col, ...Y.map(String)], r: rows.map(k => [names[k], ...rowsV[k].map(String)]) },
      a: `The ${n} ${at} ${names[0]} rose every year: ${T[0]}, ${T[1]}, ${T[2]}, and then ${T[3]}${F.u}.`,
      w: [`The ${n} ${at} ${names[0]} reached ${T[3]}${F.u} in ${Y[3]}, its highest level in the table.`,
          `The ${n} ${at} ${names[1]} rose from ${O1[0]}${F.u} in ${Y[0]} to ${O1[3]}${F.u} in ${Y[3]}.`,
          `In ${Y[1]}, the ${n} ${at} ${names[0]} was higher than the ${n} ${at} ${names[2]}.`],
      why: `The claim is that the ${n} ${at} ${names[0]} increased every year. Only this choice shows the figure rising at every step from ${Y[0]} to ${Y[3]}.`,
      no: ["A single year’s figure can’t show an increase every year.", `This describes ${names[1]}, not ${names[0]}.`, `Comparing two ${F.pl} in one year says nothing about whether the figure ${at} ${names[0]} rose every year.`] };
  }
  throw new Error("ceqB failed " + id);
}
const FC = [
  { who: "museum manager", intro: "A museum manager counted the visitors who entered during each hour of a busy Saturday.", times: ["10 a.m.", "11 a.m.", "12 p.m.", "1 p.m.", "2 p.m."], col: "Hour starting", meas: "Visitors entering", conc: "visits peaked", lo: 20, hi: 140 },
  { who: "ecologist", intro: "An ecologist counted the bees visiting a patch of wildflowers at different times of day.", times: ["7 a.m.", "9 a.m.", "11 a.m.", "1 p.m.", "3 p.m."], col: "Time", meas: "Bees counted", conc: "bee activity peaked", lo: 4, hi: 60 },
  { who: "student", intro: "A student counted the cars passing a school crosswalk in each 15-minute period before classes began.", times: ["7:00 a.m.", "7:15 a.m.", "7:30 a.m.", "7:45 a.m.", "8:00 a.m."], col: "Period starting", meas: "Cars counted", conc: "traffic peaked", lo: 10, hi: 90 },
  { who: "park ranger", intro: "A park ranger counted the hikers who started up a popular trail during each hour of the morning.", times: ["6 a.m.", "7 a.m.", "8 a.m.", "9 a.m.", "10 a.m."], col: "Hour starting", meas: "Hikers starting", conc: "the number of hikers starting out peaked", lo: 5, hi: 70 },
  { who: "astronomy club", intro: "Members of an astronomy club counted the meteors they saw during each hour of a meteor shower.", times: ["10 p.m.", "11 p.m.", "12 a.m.", "1 a.m.", "2 a.m."], col: "Hour starting", meas: "Meteors seen", conc: "meteor activity peaked", lo: 6, hi: 80 }
];
function ceqC(F, id) {
  for (let t = 0; t < 500; t++) {
    const R = rng(hash(id + ":" + t)), pk = ri(R, 1, 3), v = new Array(5);
    v[pk] = ri(R, Math.floor(F.lo + (F.hi - F.lo) * 0.6), F.hi);
    for (let k = pk - 1; k >= 0; k--) v[k] = v[k + 1] - ri(R, 2, Math.max(3, Math.floor((F.hi - F.lo) * 0.3)));
    for (let k = pk + 1; k < 5; k++) v[k] = v[k - 1] - ri(R, 2, Math.max(3, Math.floor((F.hi - F.lo) * 0.3)));
    if (v.some(x => x < F.lo) || new Set(v).size < 5) continue;
    if (!(v[4] < v[0]) && pk !== 3) continue;
    const imin = v.indexOf(Math.min(...v)); if (imin === 0) continue;
    const nonPeak = [0, 1, 2, 3, 4].filter(k => k !== pk && k !== imin);
    let A = -1, B = -1;
    for (const x of shuffle(R, nonPeak)) for (const y of shuffle(R, nonPeak)) if (x !== y && v[x] > v[y] && A < 0) { A = x; B = y; }
    if (A < 0) continue;
    const T = F.times, nx = pk + 1;
    return { id, d: "II", s: "CEQ", q: `Which choice most effectively uses data from the table to support the ${pos(F.who)} conclusion?`,
      p: `${F.intro} The ${F.who} concluded that ${F.conc} at ${dot(T[pk])}`,
      tb: { cap: F.meas, h: [F.col, F.meas], r: T.map((x, k) => [x, String(v[k])]) },
      a: `The count rose to a high of ${v[pk]} at ${T[pk]}, then fell to ${v[nx]} at ${dot(T[nx])}`,
      w: [`The count was ${v[0]} at ${T[0]}, the first time shown in the table.`, `The count was higher at ${T[A]} than at ${dot(T[B])}`, `The lowest count in the table, ${v[imin]}, was recorded at ${dot(T[imin])}`],
      why: `A peak is the highest point, after which the count falls. Only this choice shows the count reaching its high of ${v[pk]} at ${T[pk]} and then dropping.`,
      no: ["A single early count can’t show when activity peaked.", `This compares two times, but neither is the high point, so it can’t show a peak at ${dot(T[pk])}`, "This shows when the count was lowest, not when it peaked."] };
  }
  throw new Error("ceqC failed " + id);
}
for (let k = 0; k < 6; k++) for (let f = 0; f < FR.length; f++) { CEQ.push(ceqA(FR[f], `ceqA${f}${k}`)); CEQ.push(ceqB(FR[f], `ceqB${f}${k}`)); }
for (let k = 0; k < 7; k++) for (let f = 0; f < FC.length; f++) CEQ.push(ceqC(FC[f], `ceqC${f}${k}`));

// ---------- Standard English Conventions ----------
const S1 = SEC_JOIN.map(([ic1, ic2, conj], i) => {
  const [before, last] = splitLast(ic1), base = { id: "sj" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${before} ______ ${ic2}.` };
  if (i % 2 === 0) return Object.assign(base, { a: `${last};`, w: [`${last},`, last, `${last} ${conj}`],
    why: `Both parts are independent clauses: “${ic1}” and “${ic2}.” A semicolon can join two independent clauses on its own.`,
    no: ["A comma alone can’t join two independent clauses. This creates a comma splice.", "With no punctuation, the two independent clauses run together.", `When “${conj}” joins two independent clauses, it needs a comma before it.`] });
  return Object.assign(base, { a: `${last}, ${conj}`, w: [`${last} ${conj}`, `${last},`, `${last} ${conj},`],
    why: `Two independent clauses are joined by “${conj},” so a comma goes before the conjunction: “${last}, ${conj}.”`,
    no: [`Joining two independent clauses with “${conj}” requires a comma before it.`, "A comma alone can’t join two independent clauses. This creates a comma splice.", `The comma belongs before “${conj},” not after it.`] });
});
const S2 = SEC_HOWEVER.map(([ic1, ic2], i) => {
  const [before, last] = splitLast(ic1);
  return { id: "sh" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${before} ______ ${ic2}.`,
    a: `${last}; however,`, w: [`${last}, however,`, `${last}, however;`, `${last} however,`],
    why: "Two independent clauses are joined here, and “however” belongs to the second one, which contrasts with the first. A semicolon before “however” and a comma after it is correct.",
    no: ["A comma before “however” creates a comma splice between two independent clauses.", "This puts the semicolon after “however,” attaching the contrast word to the wrong clause.", "With no punctuation before “however,” the two independent clauses run together."] };
});
const S3 = SEC_COLON.map(([ic, list], i) => {
  const [before, last] = splitLast(ic);
  return { id: "sc" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${before} ______ ${list}.`,
    a: `${last}:`, w: [`${last};`, last, `${last} that`],
    why: `“${ic}” is a complete independent clause, and what follows names exactly what it refers to. A colon introduces a list or explanation after an independent clause.`,
    no: ["A semicolon must be followed by an independent clause, but what follows here isn’t one.", "Without punctuation, the list runs into the clause before it.", "“That” starts a clause that never gets its own verb, so the sentence becomes ungrammatical."] };
});
const S4 = SEC_NONESS.map(([subj, inner, last, verb, rest], i) => {
  if (i % 2 === 0) return { id: "sn" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${subj}, ${inner} ______ ${rest}`,
    a: `${last}, ${verb}`, w: [`${last} ${verb}`, `${last}; ${verb}`, `${last}: ${verb}`],
    why: `The phrase “${inner} ${last}” is extra information set off from the main sentence. It opens with a comma, so a matching comma must close it before the verb “${verb}.”`,
    no: ["Without a closing comma, the extra information isn’t properly set off.", `A semicolon would separate the subject, “${subj},” from its verb, “${verb}.”`, "A colon can’t separate a subject from its verb."] };
  return { id: "sn" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${subj}—${inner} ______ ${rest}`,
    a: `${last}—${verb}`, w: [`${last}, ${verb}`, `${last} ${verb}`, `${last}; ${verb}`],
    why: `The phrase “${inner} ${last}” interrupts the sentence and opens with a dash, so a matching dash must close it before the verb “${verb}.”`,
    no: ["An interruption that opens with a dash must close with a dash, not a comma.", "Without closing punctuation, the interruption runs into the main sentence.", `A semicolon would separate the subject, “${subj},” from its verb, “${verb}.”`] };
});
const S5 = SEC_NOPUNCT.map(([before, word, rest, kind], i) => ({ id: "sp" + pad2(i), d: "SEC", s: "BOU", q: "conv", p: `${before} ______ ${rest}`,
  a: word, w: [`${word},`, `${word};`, `${word}:`],
  why: kind === "sv" ? `“${before} ${word}” is the subject of the sentence. No punctuation belongs between a subject and its verb.` : `The clause beginning with “that” is the object of the verb “${word}.” No punctuation belongs between a verb and its object.`,
  no: kind === "sv" ? ["A comma would separate the subject from its verb.", "A semicolon needs an independent clause on each side, and the subject alone isn’t one.", "A colon can’t separate a subject from its verb."]
                    : ["A comma shouldn’t separate a verb from the “that” clause it introduces.", "A semicolon needs an independent clause on each side, and the “that” clause isn’t one.", "A colon shouldn’t separate a verb from its object."] }));
const F1 = SEC_SVA.map(([p, a, w, head, n], i) => ({ id: "fa" + pad2(i), d: "SEC", s: "FSS", q: "conv", p, a, w,
  why: head === "each" ? `The subject is “each,” which is singular, so it takes the singular verb “${a}.”` : `The subject is “${head},” which is ${num(n)}. The words between the subject and the blank only describe it, so the verb must agree with “${head}”: “${a}.”`,
  no: w.map(x => `“${cap(x)}” is ${other(n)}, so it doesn’t agree with the ${num(n)} subject, “${head}.”`) }));
const F2 = SEC_PRON.map(([p, ante, n], i) => {
  const a = n === "s" ? "its" : "their", alt = n === "s" ? "their" : "its";
  return { id: "fp" + pad2(i), d: "SEC", s: "FSS", q: "conv", p, a, w: [alt, "it’s", "they’re"],
    why: `The pronoun refers to “${ante},” which is ${num(n)}, so the ${num(n)} possessive “${a}” is correct.`,
    no: [`“${cap(alt)}” is ${other(n)}, but it refers to the ${num(n)} “${ante}.”`, "“It’s” means “it is,” which doesn’t make sense here.", "“They’re” means “they are.” It isn’t possessive."] };
});
const F3 = SEC_POSS.map(([p, sg, pl], i) => ({ id: "fs" + pad2(i), d: "SEC", s: "FSS", q: "conv", p,
  a: `${pl}’`, w: [`${sg}’s`, pl, `${pl}’s`],
  why: `The sentence refers to more than one ${sg}, so a plural possessive is needed. For a plural noun ending in s, add only an apostrophe: “${pl}’.”`,
  no: [`“${cap(sg)}’s” is singular possessive, but the sentence refers to more than one ${sg}.`, `“${cap(pl)}” is plural but not possessive.`, `“${cap(pl)}’s” isn’t standard. A plural noun ending in s takes only an apostrophe.`] }));
const F4 = SEC_TENSE.map(([p, forms, why], i) => ({ id: "ft" + pad2(i), d: "SEC", s: "FSS", q: "conv", p, a: forms[0], w: forms.slice(1), why,
  no: forms.slice(1).map(x => `“${cap(x)}” doesn’t fit the time the sentence describes.`) }));
const F5 = SEC_FINITE.map(([before, after, fin, ing, inf, hav], i) => ({ id: "ff" + pad2(i), d: "SEC", s: "FSS", q: "conv", p: `${before} ______ ${after}`,
  a: fin, w: [ing, inf, hav],
  why: `The sentence needs a main verb for its subject. “${cap(fin)}” is a complete verb that finishes the sentence.`,
  no: [`“${cap(ing)}” can’t act as the main verb on its own, so the sentence would be incomplete.`, `“${cap(inf)}” can’t act as the main verb, so the sentence would be incomplete.`, `“${cap(hav)}” can’t act as the main verb, so the sentence would be incomplete.`] }));
const F6 = SEC_DANGLE.map(([mod, right, wrong, does, subj, wsub], i) => ({ id: "fd" + pad2(i), d: "SEC", s: "FSS", q: "conv", p: `${mod} ______`,
  a: right, w: wrong,
  why: `The opening phrase describes something that ${does}, so the words right after the comma must name it: ${subj}.`,
  no: wsub.map(x => `This makes ${x} the one that ${does}.`) }));

return [
  ...interleave([WICI, TSP]),
  ...spread(interleave([CEQ, CETS.concat(CETW)]), II_EXTRA),
  ...interleave([S1, F1, S3, F2, S4, F4, S2, F3, S5, F5, F6]),
  ...interleave([TRA, RSI])
];
})();
if (typeof module !== "undefined") module.exports = RW_GEN;
