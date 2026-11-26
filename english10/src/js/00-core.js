// ---------- Core: helpers, saved progress, days and streak, XP and levels, daily goals, badges, review cards
const OFFLINE = /*__OFFLINE__*/false, PWA = /*__PWA__*/false;
const ON_WEB = /^https?:$/.test(location.protocol);
const STANDALONE = !!((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true);
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const LS = "eng10h.v1";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]));
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const sum = a => a.reduce((x, y) => x + y, 0);
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const wcount = s => (String(s || "").match(/[A-Za-z0-9’']+/g) || []).length;
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const V = {}, ACT = {}, IN = {};   // views by route name, tap actions (data-act) and typing handlers (data-in); each module adds its own
let AFTER = null;          // a view can set this to run after it is drawn

// ---------- Dates are local calendar days (from SAT Daily)
const pad = n => String(n).padStart(2, "0");
const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dn = k => { const [y, m, d] = k.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const fromN = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const addD = (k, n) => fromN(dn(k) + n);
const nice = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", {weekday: "short", month: "short", day: "numeric"}); };
const today = () => dk();
const daysTo = k => dn(k) - dn(today());
const dueWords = k => { const n = daysTo(k); return n < 0 ? `${-n} day${n === -1 ? "" : "s"} late` : n === 0 ? "due today" : n === 1 ? "due tomorrow" : `due in ${n} days`; };

// ---------- Content lookups
const BOOK = LOTF, UNIT = n => COURSE.units.find(u => u.u === n);
const ESSAY = id => ESSAYS.find(e => e.id === id);
const LENS = id => LENSES.find(l => l.id === id);
const RQ = [];   // reading checks
{ const k = {}; for (const [ch, kind, q, c, why] of LOTF.questions) { k[ch] = (k[ch] || 0) + 1; RQ.push({id: `lotf.${ch}.${k[ch]}`, set: "read", ch, kind, q, c, why}); } }
const LQ = [];   // lens questions
{ const k = {}; for (const [lens, q, c, why] of LENS_QS) { k[lens] = (k[lens] || 0) + 1; LQ.push({id: `lens.${lens}.${k[lens]}`, set: "lens", lens, kind: "lens", q, c, why}); } }
const TERM = {}; for (const t of TERMS) TERM[slug(t.t)] = t;
const DRILL = {}; for (const d of DRILLS) DRILL[d.id] = d;
const ALLQ = {}; for (const x of RQ.concat(LQ)) ALLQ[x.id] = x;
const CH = n => LOTF.chapters[n - 1];
const KIND_NAMES = {plot: "Plot", character: "Character", symbol: "Symbol", theme: "Theme", inference: "Inference", lens: "Lenses", term: "Terms", who: "Who and what"};

// ---------- Saved progress (key eng10h.v1)
const fresh = () => ({
  v: 1, upd: 0, name: "", days: {}, xp: 0,
  read: {lotf: 0}, peek: {}, readLog: [],
  qs: {}, miss: {}, fixed: 0, quizzes: [],
  cards: {}, newDay: null, newCount: 0,
  drills: {}, asg: [], quotes: [], sem: [], rub: [], checks: [], writes: [], tw: null, ai: [], drafts: {}, seen: {},
  badges: {}, goals: null, streak: {freezes: 0, used: [], lastRun: 0},
  set: {unit: 4, sound: true, calm: false, big: false, pin: null}, bk: null
});
let S = fresh();
function loadState(j) {
  S = Object.assign(fresh(), j);
  for (const k of ["set", "streak", "read", "seen", "peek", "drafts", "qs", "miss", "cards", "drills", "badges"]) S[k] = Object.assign(fresh()[k], j[k] || {});
}
try { const j = JSON.parse(localStorage.getItem(LS) || "null"); if (j && j.v === 1) loadState(j); } catch (e) {}
function save() { S.upd = Date.now(); try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
let saveT = 0; function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
const readTo = () => S.read.lotf || 0;
const canSee = ch => ch <= readTo() || !!S.peek[ch];

// ---------- Days, active minutes and streak (from Math 6)
function day(k = today()) { return S.days[k] || (S.days[k] = {min: 0, done: 0, xp: 0}); }
let lastActive = 0;
function active() {
  const now = Date.now(), gap = lastActive ? Math.min(now - lastActive, 120000) : 20000;
  lastActive = now; day().min = Math.round((day().min + gap / 60000) * 100) / 100;
}
const counted = k => { const d = S.days[k]; return !!(d && (d.done || d.min >= 10 || d.frozen)); };
function streak() {
  let k = today(), n = 0;
  if (!counted(k)) k = addD(k, -1);
  while (counted(k)) { if (S.days[k] && (S.days[k].done || S.days[k].min >= 10)) n++; k = addD(k, -1); }
  return n;
}
function settleStreak() {
  const y = addD(today(), -1);
  if (!counted(y) && counted(addD(y, -1)) && S.streak.freezes > 0) { day(y).frozen = 1; S.streak.freezes--; S.streak.used.push(y); toast("A streak freeze saved your streak"); }
  const n = streak();
  if (n >= 7 && Math.floor(n / 7) > Math.floor((S.streak.lastRun || 0) / 7) && S.streak.freezes < 2) { S.streak.freezes++; toast("7 more days: you earned a streak freeze"); }
  S.streak.lastRun = n; save();
}

// ---------- XP and levels: level L needs 50 x L x (L - 1) XP
const levelOf = xp => { let L = 1; while (50 * (L + 1) * L <= xp) L++; return L; };
const TITLES = [[30, "Laureate"], [25, "Scholar"], [20, "Critic"], [15, "Essayist"], [10, "Analyst"], [5, "Annotator"], [1, "Reader"]];
const titleOf = L => TITLES.find(t => L >= t[0])[1];
function addXP(n) {
  n = Math.round(n); if (n <= 0) return 0;
  const L0 = levelOf(S.xp);
  S.xp += n; day().xp += n; active();
  popXP(n);
  if (levelOf(S.xp) > L0) celebrate("level", levelOf(S.xp));
  save(); if (typeof renderStats === "function") renderStats(); return n;
}

// ---------- Daily goals: three a day, one from each group
const GOALS = {
  cards: ["Review 10 cards", 10], rcheck: ["Finish a reading check", 1], quiz: ["Finish a lens or terms quiz", 1],
  drill: ["Do 2 writing drills", 2], quote: ["Log 2 quotations", 2], draft: ["Check a draft or score a rubric", 1],
  step: ["Move an assignment forward", 1], guide: ["Read a chapter guide", 1], seminar: ["Prep for a seminar", 1]
};
const GPOOL = [["cards", "rcheck", "quiz"], ["drill", "quote", "draft"], ["step", "guide", "seminar"]];
function goals() {
  const k = today();
  if (!S.goals || S.goals.day !== k) {
    const n = dn(k), open = S.asg.some(a => !a.done);
    const list = GPOOL.map((g, i) => g[(n + i) % g.length]).map(id => id === "step" && !open ? "guide" : id);
    S.goals = {day: k, list, got: {}, paid: []}; save();
  }
  return S.goals;
}
function goalTick(id, by = 1) {
  const g = goals();
  if (!g.list.includes(id) || g.paid.includes(id)) return;
  g.got[id] = (g.got[id] || 0) + by;
  if (g.got[id] >= GOALS[id][1]) {
    g.paid.push(id); addXP(25); toast(`Goal done: ${GOALS[id][0]} · +25 XP`);
    if (g.paid.length === 3) { day().done = 1; addXP(40); celebrate("goals"); }
  }
  save();
}

// ---------- Badges
const BADGES = [];
for (const n of [3, 7, 14, 30, 60, 100]) BADGES.push({id: `streak-${n}`, fam: "Streaks", name: `${n}-day streak`, rule: `A ${n}-day streak`, test: () => streak() >= n});
BADGES.push({id: "read-1", fam: "Reading", name: "Washed ashore", rule: "Finish chapter 1", test: () => readTo() >= 1});
BADGES.push({id: "read-6", fam: "Reading", name: "Halfway across", rule: "Read through chapter 6", test: () => readTo() >= 6});
BADGES.push({id: "read-12", fam: "Reading", name: "Rescued", rule: "Finish Lord of the Flies", test: () => readTo() >= 12});
BADGES.push({id: "perfect", fam: "Quizzes", name: "Perfect check", rule: "100% on a reading check", test: () => S.quizzes.some(q => q.kind === "ch" && q.right === q.n)});
BADGES.push({id: "perfect5", fam: "Quizzes", name: "Five perfect checks", rule: "100% on five reading checks", test: () => new Set(S.quizzes.filter(q => q.kind === "ch" && q.right === q.n).map(q => q.ch)).size >= 5});
BADGES.push({id: "allch", fam: "Quizzes", name: "Every chapter checked", rule: "Pass all 12 reading checks (6 of 8 or better)", test: () => LOTF.chapters.every(c => S.quizzes.some(q => q.kind === "ch" && q.ch === c.n && q.right >= 6))});
BADGES.push({id: "lens90", fam: "Quizzes", name: "Lens spotter", rule: "90% or better on a lens quiz", test: () => S.quizzes.some(q => q.kind === "lens" && q.right >= 0.9 * q.n)});
BADGES.push({id: "term90", fam: "Quizzes", name: "Word smith", rule: "90% or better on a terms quiz", test: () => S.quizzes.some(q => q.kind === "terms" && q.right >= 0.9 * q.n)});
BADGES.push({id: "unit90", fam: "Quizzes", name: "Unit champion", rule: "90% or better on a unit test", test: () => S.quizzes.some(q => q.kind === "unit" && q.right >= 0.9 * q.n)});
BADGES.push({id: "fix10", fam: "Quizzes", name: "Comeback", rule: "Fix 10 missed questions", test: () => S.fixed >= 10});
BADGES.push({id: "lenses", fam: "Learning", name: "Nine lenses", rule: "Open all nine lens pages", test: () => LENSES.every(l => S.seen["lens:" + l.id])});
BADGES.push({id: "cards100", fam: "Learning", name: "Card shark", rule: "Review 100 cards", test: () => sum(Object.values(S.cards).map(c => c.n || 0)) >= 100});
BADGES.push({id: "cards-master", fam: "Learning", name: "Long memory", rule: "Move 25 cards to the 21-day box", test: () => Object.values(S.cards).filter(c => c.box >= 4).length >= 25});
for (const n of [1, 10, 25]) BADGES.push({id: `drill-${n}`, fam: "Writing", name: n === 1 ? "First drill" : `${n} drills`, rule: `Finish ${n} writing drill${n > 1 ? "s" : ""}`, test: () => sum(Object.values(S.drills).map(d => d.n || 0)) >= n});
for (const n of [10, 25, 50]) BADGES.push({id: `quotes-${n}`, fam: "Writing", name: `Collector ${n}`, rule: `Log ${n} quotations`, test: () => S.quotes.length >= n});
BADGES.push({id: "rubric5", fam: "Writing", name: "Self-critic", rule: "Score yourself with a rubric 5 times", test: () => S.rub.length >= 5});
BADGES.push({id: "checks5", fam: "Writing", name: "Draft doctor", rule: "Check 5 drafts", test: () => S.checks.length >= 5});
BADGES.push({id: "thesis", fam: "Writing", name: "Thesis smith", rule: "A thesis that passes every check", test: () => S.asg.some(a => a.thesisOk)});
BADGES.push({id: "timed1", fam: "Writing", name: "Under the clock", rule: "Finish a timed write", test: () => S.writes.length >= 1});
BADGES.push({id: "timed5", fam: "Writing", name: "Clock master", rule: "Finish 5 timed writes", test: () => S.writes.length >= 5});
BADGES.push({id: "planner", fam: "Habits", name: "Planner", rule: "Add an assignment 4 or more days before it's due", test: () => S.asg.some(a => a.created && a.due && dn(a.due) - dn(a.created) >= 4)});
BADGES.push({id: "ontime5", fam: "Habits", name: "On time", rule: "Finish 5 assignments on or before the due date", test: () => S.asg.filter(a => a.done && a.due && a.done <= a.due).length >= 5});
BADGES.push({id: "seminar3", fam: "Habits", name: "Seminar ready", rule: "Prepare for 3 seminars", test: () => S.sem.length >= 3});
const badge = id => BADGES.find(b => b.id === id);
function checkBadges() {
  for (const b of BADGES) if (!S.badges[b.id] && b.test && b.test()) { S.badges[b.id] = today(); save(); celebrate("badge", b); }
}

// ---------- Review cards (Leitner boxes: 1, 3, 7, 21, 60 days). New cards come in at 8 a day.
const BOX_DAYS = [0, 1, 3, 7, 21, 60];
function allCards() {
  const out = [];
  for (const l of LENSES) out.push({id: "l:" + l.id, kind: "Lens", front: l.name + " lens", back: l.q, extra: "Key terms: " + l.terms.slice(0, 5).join(", ")});
  for (const c of LOTF.characters) if (canSee(c.from)) out.push({id: "c:" + c.id, kind: "Character", front: c.name, back: c.role});
  for (const s of LOTF.symbols) if (canSee(s.from)) out.push({id: "s:" + s.id, kind: "Symbol", front: s.name, back: s.means});
  const order = {write: 0, lit: 1, narr: 2, arg: 3, drama: 4};
  for (const t of TERMS.slice().sort((a, b) => order[a.g] - order[b.g])) out.push({id: "t:" + slug(t.t), kind: TERM_GROUPS[t.g], front: t.t, back: t.d, extra: t.ex});
  return out;
}
function dueCards() {
  const k = today(), all = allCards(), due = all.filter(c => S.cards[c.id] && S.cards[c.id].due <= k);
  if (S.newDay !== k) { S.newDay = k; S.newCount = 0; }
  const fresh = all.filter(c => !S.cards[c.id]).slice(0, Math.max(0, 8 - S.newCount));
  return {due, fresh, all: due.concat(fresh)};
}
function gradeCard(id, knew) {
  const c = S.cards[id] || (S.newCount++, S.cards[id] = {box: 0, due: today(), n: 0});
  c.n = (c.n || 0) + 1;
  c.box = knew ? Math.min(5, c.box + 1) : 1;
  c.due = addD(today(), BOX_DAYS[c.box]);
  active(); addXP(knew ? 3 : 1); goalTick("cards"); checkBadges(); save();
}

// ---------- Feedback that shows: toast, XP pop, sounds, celebrations
function toast(msg) {
  let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), 3000);
}
function popXP(n) {
  if (S.set.calm) return;
  const p = document.createElement("div"); p.className = "xppop"; p.textContent = `+${n} XP`;
  document.body.appendChild(p); setTimeout(() => p.remove(), 1200);
}
let audio = null;
function beep(good) {
  if (!S.set.sound || S.set.calm) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = good ? 880 : 220; o.type = "sine";
    g.gain.setValueAtTime(0.08, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (good ? 0.18 : 0.3));
    o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.32);
  } catch (e) {}
}
const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function confetti() {
  if (S.set.calm || REDUCED) return;
  const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
  const colors = COURSE.units.map(u => u.color);
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%"; c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.4 + "s"; c.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2200);
}
function celebrate(kind, x) {
  if (kind === "level") { const t = titleOf(x); confetti(); toast(`Level ${x}!${t !== titleOf(x - 1) ? ` You're ${/^[AEIOU]/.test(t) ? "an" : "a"} ${t} now.` : ""}`); }
  else if (kind === "badge") { confetti(); toast(`New badge: ${x.name}`); }
  else if (kind === "goals") { confetti(); toast("All 3 goals done · +40 XP bonus"); }
  else if (kind === "perfect") { confetti(); }
}
