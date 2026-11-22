// ---------- Core: helpers, lookups, saved progress, days and streak, XP and levels, quests, badges, mastery
const OFFLINE = /*__OFFLINE__*/false, PWA = /*__PWA__*/false;
const ON_WEB = /^https?:$/.test(location.protocol);
const STANDALONE = !!((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true);
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const LS = "math6.v1", MI = M6.MI;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]));
const plain = html => String(html).replace(/<span class="fr"><span>([^<]+)<\/span><span>([^<]+)<\/span><\/span>/g, "$1/$2").replace(/<sup>2<\/sup>/g, "²").replace(/<sup>3<\/sup>/g, "³").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const rand32 = () => (Math.random() * 4294967296) >>> 0;
const sum = a => a.reduce((x, y) => x + y, 0);
const ACT = {};          // button actions, by data-act name; each module adds its own

// ---------- Dates are local calendar days (from SAT Daily)
const pad = n => String(n).padStart(2, "0");
const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dn = k => { const [y, m, d] = k.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const fromN = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const addD = (k, n) => fromN(dn(k) + n);
const nice = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", {weekday: "short", month: "short", day: "numeric"}); };
const today = () => dk();

// ---------- Lessons and templates
const LESSONS = {}, ORDER = [];
for (const U of CURRICULUM) for (const l of U.lessons) {
  const c = (M6U[U.u] && M6U[U.u].lessons && M6U[U.u].lessons[l[0]]) || null;
  LESSONS[l[0]] = {id: l[0], u: U.u, title: l[1], ccss: l[2], added: !!l[3], U, c};
  ORDER.push(l[0]);
}
const TPL = {};
for (const id of ORDER) { const c = LESSONS[id].c; if (c) for (const t of c.templates) { t.lesson = id; TPL[t.id] = t; } }
const unitContent = u => M6U[u] || {lessons: {}};
const builtLessons = u => CURRICULUM[u - 1].lessons.map(l => l[0]).filter(id => LESSONS[id].c);
const LANE = u => u === 1 ? "Phase 1" : u <= 4 ? "Lane A" : u <= 7 ? "Lane B" : "Lane C";

// ---------- Saved progress (key math6.v1)
const fresh = () => ({
  v: 1, upd: 0, name: "", days: {}, xp: 0, coins: 0, coinRem: 0,
  L: {}, att: [], mist: {}, fixed: 0, tests: [], badges: {}, quests: null, pbs: {}, facts: {}, explore: {types: {}, another: 0},
  streak: {freezes: 0, used: [], lastRun: 0}, last: null, boss: {}, wslevel: 0, wsrun: 0,
  set: {voice: {uri: null, rate: 1}, autoRead: false, sound: true, calm: false, timer: "always", speed: true, added: true, current: 1, pin: null, rest: []},
  bk: null
});
let S = fresh();
try {
  const j = JSON.parse(localStorage.getItem(LS) || "null");
  if (j && j.v === 1) { S = Object.assign(fresh(), j); S.set = Object.assign(fresh().set, j.set || {}); S.streak = Object.assign(fresh().streak, j.streak || {}); S.explore = Object.assign(fresh().explore, j.explore || {}); }
} catch (e) {}
function save() { S.upd = Date.now(); try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }

// ---------- Days, active minutes and streak
function day(k = today()) { return S.days[k] || (S.days[k] = {min: 0, done: 0, xp: 0}); }
let lastActive = 0;
function active() {           // called on every answer: adds the time since the last one, capped at 2 minutes
  const now = Date.now(), gap = lastActive ? Math.min(now - lastActive, 120000) : 20000;
  lastActive = now; day().min = Math.round((day().min + gap / 60000) * 100) / 100;
}
const counted = k => { const d = S.days[k]; return !!(d && (d.done || d.min >= 10 || d.frozen)) || (S.set.rest || []).includes(k); };
function streak() {
  let k = today(), n = 0;
  if (!counted(k)) k = addD(k, -1);
  while (counted(k)) { if (S.days[k] && (S.days[k].done || S.days[k].min >= 10)) n++; k = addD(k, -1); }
  return n;
}
// A streak freeze covers one missed day automatically; one is earned for every 7-day run (holding up to 2).
function settleStreak() {
  const y = addD(today(), -1);
  if (!counted(y) && counted(addD(y, -1)) && S.streak.freezes > 0) { day(y).frozen = 1; S.streak.freezes--; S.streak.used.push(y); toast("A streak freeze saved your streak"); }
  const n = streak();
  if (n >= 7 && Math.floor(n / 7) > Math.floor((S.streak.lastRun || 0) / 7) && S.streak.freezes < 2) { S.streak.freezes++; toast("7 more days: you earned a streak freeze"); }
  S.streak.lastRun = n; save();
}

// ---------- XP, coins and levels: level L needs 50 x L x (L - 1) XP
const levelOf = xp => { let L = 1; while (50 * (L + 1) * L <= xp) L++; return L; };
const TITLES = [[30, "Legend"], [25, "Master"], [20, "Expert"], [15, "Pro"], [10, "Ranger"], [5, "Scout"], [1, "Rookie"]];
const titleOf = L => TITLES.find(t => L >= t[0])[1];
let xpPausedUntil = 0;
function addXP(n) {
  n = Math.round(n);
  if (n <= 0 || Date.now() < xpPausedUntil) return 0;
  const L0 = levelOf(S.xp);
  S.xp += n; day().xp += n;
  S.coinRem = (S.coinRem || 0) + n; S.coins += Math.floor(S.coinRem / 10); S.coinRem %= 10;
  const L1 = levelOf(S.xp);
  popXP(n);
  if (L1 > L0) celebrate("level", L1);
  save(); if (typeof renderStats === "function") renderStats(); return n;
}

// ---------- Daily quests: three a day, one from each group, about 10 minutes in total
const QUESTS = {
  test5: ["Finish today's 5-minute test", 1], learn: ["Finish a lesson's Learn", 1], quiz: ["Finish a lesson quiz", 1],
  practice10: ["Get 10 right in Practice", 10], fix3: ["Fix 3 mistakes", 3],
  pb: ["Beat a personal best in a speed test", 1], combo10: ["Reach a 10 combo in a Speed Round", 1], clock: ["Finish a Beat the Clock", 1]
};
const QPOOL = [["test5", "learn", "quiz"], ["practice10", "fix3"], ["pb", "combo10", "clock"]];
function quests() {
  const k = today();
  if (!S.quests || S.quests.day !== k) { const n = dn(k); S.quests = {day: k, list: QPOOL.map((g, i) => g[(n + i) % g.length]), got: {}, paid: []}; save(); }
  return S.quests;
}
function questTick(id, by = 1) {
  const q = quests();
  if (!q.list.includes(id) || q.paid.includes(id)) return;
  q.got[id] = (q.got[id] || 0) + by;
  if (q.got[id] >= QUESTS[id][1]) {
    q.paid.push(id); addXP(30); toast(`Quest done: ${QUESTS[id][0]} · +30 XP`);
    if (q.paid.length === 3) { addXP(50); celebrate("quests"); }
  }
  save();
}

// ---------- Badges: 100 in all; most unlock as their units are built
const BADGES = [];
for (const U of CURRICULUM) for (const [lvl, rule] of [["bronze", "every lesson started"], ["silver", "every lesson Mastered and the boss beaten"], ["gold", "every D+21 review passed"]])
  BADGES.push({id: `u${U.u}-${lvl}`, fam: "Unit trophies", name: `Unit ${U.u} ${lvl}`, rule: `${U.title}: ${rule}`, lvl});
// speed medals are added by 60-speed.js once DRILLS is known
for (const [n, label] of [[3, "3 days"], [7, "7 days"], [14, "14 days"], [30, "30 days"], [60, "60 days"], [100, "100 days"]])
  BADGES.push({id: `streak-${n}`, fam: "Streaks", name: `${label} streak`, rule: `A ${n}-day streak`, test: () => streak() >= n});
for (const n of [10, 50, 100]) BADGES.push({id: `fix-${n}`, fam: "Comebacks", name: `Fixed ${n}`, rule: `Fix ${n} mistakes`, test: () => S.fixed >= n});
BADGES.push({id: "bounce", fam: "Comebacks", name: "Bounce back", rule: "Pass a test you failed before"});
BADGES.push({id: "perfect5", fam: "Tests", name: "Perfect 5", rule: "First perfect 5-minute test"});
BADGES.push({id: "perfect5x10", fam: "Tests", name: "Perfect 5 × 10", rule: "10 perfect 5-minute tests", test: () => S.tests.filter(t => t.kind.startsWith("t5") && t.right === t.n).length >= 10});
BADGES.push({id: "champ", fam: "Tests", name: "Unit champion", rule: "90% or better on a unit test"});
BADGES.push({id: "climber", fam: "Tests", name: "Benchmark climber", rule: "Benchmark up 10 points"});
BADGES.push({id: "types", fam: "Explorer", name: "Every question type", rule: "Answer all 16 question types", test: () => Object.keys(S.explore.types).length >= 16});
BADGES.push({id: "another", fam: "Explorer", name: "Another way", rule: "Use Explain it another way 10 times", test: () => S.explore.another >= 10});
BADGES.push({id: "everyunit", fam: "Explorer", name: "World tour", rule: "Finish a lesson in every unit", test: () => CURRICULUM.every(U => U.lessons.some(l => (S.L[l[0]] || {}).learned))});
const badge = id => BADGES.find(b => b.id === id);
function award(id) {
  if (S.badges[id] || !badge(id)) return;
  S.badges[id] = today(); S.coins += 25; save();
  if (typeof renderStats === "function") renderStats();
  celebrate("badge", badge(id));
}
function unitTrophies(u) {
  const ids = CURRICULUM[u - 1].lessons.map(l => l[0]);
  if (ids.every(id => (S.L[id] || {}).chip && S.L[id].chip !== "untouched")) award(`u${u}-bronze`);
  if (ids.every(id => (S.L[id] || {}).chip === "mastered") && (S.boss || {})[u]) award(`u${u}-silver`);
  if (ids.every(id => ((S.L[id] || {}).rev || {})[21] === "ok")) award(`u${u}-gold`);
}
function checkBadges() { for (const b of BADGES) if (b.test && !S.badges[b.id] && b.test()) award(b.id); }

// ---------- Mastery: 3 right in a row on fresh variants with no hints, at least one Standard or Stretch
const REVIEWS = [1, 3, 7, 21];
function L(id) { return S.L[id] || (S.L[id] = {chip: "untouched", run: [], att: 0, ok: 0, seen: {}, mastered: null, rev: null, learned: 0, lvl: 1}); }
function freshSeed(id, tpl) {
  const st = L(id), seen = st.seen[tpl] || (st.seen[tpl] = []);
  let s; do s = rand32(); while (seen.includes(s));
  seen.push(s); if (seen.length > 40) seen.shift();
  return s;
}
// Called for every graded practice-style answer. Returns the XP earned.
function recordAnswer({lesson, tpl, seed, ok, hints = 0, ms = 0, mis = null, mode = "practice", diff = 1}) {
  const st = L(lesson);
  if (st.chip === "untouched") st.chip = "practicing";
  st.att++; if (ok) st.ok++;
  S.att.push({t: Date.now(), tpl, seed, mode, ok: ok ? 1 : 0, ms: Math.round(ms), hints, mis});
  if (S.att.length > 1500) S.att.splice(0, S.att.length - 1500);
  active();
  if (!ok) addMistake(tpl, lesson, mis);
  let xp = 0;
  if (mode === "practice" || mode === "mistakes" || mode === "workshop") {
    if (ok && !hints) st.run.push(diff); else st.run = [];
    if (st.run.length > 3) st.run.shift();
    if (ok) xp += st.chip === "mastered" ? 1 : hints ? 2 : 5;
    if (st.chip !== "mastered" && st.run.length >= 3 && st.run.some(d => d >= 2)) {
      st.chip = "mastered"; st.mastered = today(); st.rev = {};
      for (const r of REVIEWS) st.rev[r] = addD(today(), r);
      xp += 100; celebrate("mastered", LESSONS[lesson]);
      unitTrophies(LESSONS[lesson].u);
    }
    // practice adapts: up a level after 2 right in a row, down after 2 misses
    const recent = S.att.filter(a => TPL[a.tpl] && TPL[a.tpl].lesson === lesson && a.mode === mode).slice(-2);
    if (recent.length === 2 && recent.every(a => a.ok)) st.lvl = Math.min(3, (st.lvl || 1) + 1);
    if (recent.length === 2 && recent.every(a => !a.ok)) st.lvl = Math.max(1, (st.lvl || 1) - 1);
  }
  if (ok && mode === "practice") questTick("practice10");
  save();
  return xp;
}
function reviewsDue() {
  const k = today(), due = [];
  for (const id of ORDER) {
    const st = S.L[id];
    if (!st || st.chip !== "mastered" || !st.rev) continue;
    for (const r of REVIEWS) if (st.rev[r] && st.rev[r] !== "ok" && st.rev[r] <= k) { due.push({lesson: id, r}); break; }
  }
  return due;
}
function recordReview(lesson, r, ok) {
  const st = L(lesson);
  if (ok) { st.rev[r] = "ok"; addXP(25); if (r === 21) unitTrophies(LESSONS[lesson].u); }
  else { st.chip = "practicing"; st.run = []; st.rev = null; st.mastered = null; }
  save();
}

// ---------- My Mistakes
function addMistake(tpl, lesson, mis) {
  const m = S.mist[tpl] || (S.mist[tpl] = {lesson, n: 0, last: null, err: "procedure", mis: null});
  m.n++; m.last = today(); if (mis) { m.mis = mis; m.err = "concept"; }
}
function fixMistake(tpl) {
  if (!S.mist[tpl]) return;
  delete S.mist[tpl]; S.fixed = (S.fixed || 0) + 1;
  addXP(10); questTick("fix3"); checkBadges(); save();
}

// ---------- Feedback that shows: toast, XP pop, sounds, celebrations
function toast(msg) {     // stacked, newest at the bottom, at most three at once
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
  const colors = CURRICULUM.map(u => u.color);
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%"; c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.4 + "s"; c.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2200);
}
function celebrate(kind, x) {
  if (kind === "level") { confetti(); toast(`Level ${x}!${titleOf(x) !== titleOf(x - 1) ? ` You're a ${titleOf(x)} now.` : ""}`); }
  else if (kind === "mastered") { confetti(); toast(`Lesson mastered: ${x.id} ${x.title} · +100 XP`); if (S.set.sound && !S.set.calm && typeof Voice !== "undefined" && !Voice.playing) Voice.play(["Lesson mastered!"]); }
  else if (kind === "badge") { confetti(); toast(`New badge: ${x.name} · +25 coins`); }
  else if (kind === "quests") { confetti(); toast("All 3 quests done · +50 XP bonus"); }
  else if (kind === "boss") { confetti(); toast("Boss beaten! +200 XP and 50 coins"); }
}
