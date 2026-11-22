// ---------- Speed tests: Speed Round (60 s, combos), Beat the Clock (20 questions), Lightning Ladder (shrinking timer, 3 lives).
// Speed never counts toward mastery or test scores; it has its own records, medals and XP.
for (const d of DRILLS) for (const [k, lvl] of [[0, "bronze"], [1, "silver"], [2, "gold"]])
  BADGES.push({id: `speed-${d.id}-${lvl}`, fam: "Speed medals", name: `${d.name}: ${lvl}`, rule: `${d.medals[k]} right in a 60-second Speed Round`, lvl});
BADGES.push({id: "combo10", fam: "Speed medals", name: "Combo 10", rule: "10 right in a row in a Speed Round"});
BADGES.push({id: "combo25", fam: "Speed medals", name: "Combo 25", rule: "25 right in a row in a Speed Round"});
const FORMATS = {round: "Speed Round", clock: "Beat the Clock", ladder: "Lightning Ladder"};
const drillOpen = d => !d.opens || ((S.L[d.opens] || {}).chip || "untouched") !== "untouched" || !!(S.L[d.opens] || {}).learned;
let SP = null, spTick = null;
function stopSpeed() { if (spTick) { clearInterval(spTick); spTick = null; } }
// The fluency question at the end of the daily 5-minute test
function drillItem() {
  const open = DRILLS.filter(d => drillOpen(d) && d.kind === "num"), d = open[Math.floor(Math.random() * open.length)] || DRILLS[0];
  const x = d.gen(M6.rng(rand32()));
  return normItem({type: "num", tag: "PROCEDURE", diff: 1, est: 10, tpl: "drill", stem: `<b>Fluency:</b> ${esc(x.q)}${x.unit ? "" : " = ?"}`, ans: x.a, unit: x.unit, keys: /\//.test(x.a) ? "frac" : /\./.test(x.a) ? "dec" : "int", sol: [{s: `${x.q} = ${x.a}${x.unit || ""}`, why: ""}], hints: []});
}
function speedStart(drillId, fmt) {
  stopSpeed(); Voice.stop();
  const d = DRILLS.find(x => x.id === drillId), pb = ((S.pbs[drillId] || {})[fmt]) || null;
  SP = {d, fmt, t0: Date.now(), right: 0, miss: 0, combo: 0, best: 0, score: 0, lives: 3, limit: 10, pen: 0, done: false, pb, dash: fmt === "round" && !(S.days[today()] || {}).dash};
  spNext();
  spTick = setInterval(spUpdate, 200);
}
function spNext() { SP.cur = SP.d.gen(M6.rng(rand32())); SP.qt = Date.now(); SP.input = ""; }
function spElapsed() { return (Date.now() - SP.t0) / 1000; }
function spAnswer(val) {
  if (!SP || SP.done) return;
  const c = SP.cur, ok = SP.d.kind === "num" ? M6.check({ans: c.a}, val).ok : val === c.a, ms = Date.now() - SP.qt;
  if (c.fact && SP.d.id === "times") { const f = S.facts[c.fact] || (S.facts[c.fact] = {n: 0, ok: 0, fast: 0, slow: 0}); f.n++; f.last = ok; if (ok) { f.ok++; if (ms < 3000) f.fast++; else f.slow = (f.slow || 0) + 1; } }
  if (ok) {
    SP.right++; SP.combo++; SP.best = Math.max(SP.best, SP.combo);
    SP.score += 10 * (SP.combo >= 11 ? 3 : SP.combo >= 6 ? 2 : 1);
    if (SP.fmt === "ladder" && SP.right % 3 === 0) SP.limit = Math.max(3, SP.limit - 0.5);
  } else {
    SP.miss++; SP.combo = 0;
    if (SP.fmt === "clock") SP.pen += 5;
    if (SP.fmt === "ladder") SP.lives--;
    SP.lastMiss = `${c.q} = ${c.a}`;
  }
  beep(ok);
  if (SP.fmt === "clock" && SP.right + SP.miss >= 20) return spEnd();
  if (SP.fmt === "ladder" && SP.lives <= 0) return spEnd();
  spNext(); spRender();
}
function spUpdate() {
  if (!SP || SP.done) return stopSpeed();
  const t = spElapsed();
  if (SP.fmt === "round" && t >= 60) return spEnd();
  if (SP.fmt === "ladder" && (Date.now() - SP.qt) / 1000 > SP.limit) { SP.lives--; SP.combo = 0; SP.lastMiss = `${SP.cur.q} = ${SP.cur.a}`; if (SP.lives <= 0) return spEnd(); spNext(); spRender(); return; }
  const el = $("#sptime"); if (el) el.textContent = SP.fmt === "round" ? mmss(60 - t) : SP.fmt === "clock" ? mmss(t + SP.pen) : `${Math.max(0, SP.limit - (Date.now() - SP.qt) / 1000).toFixed(1)} s`;
  const g = $("#ghost"); if (g && SP.pb && SP.fmt === "round") { const pace = SP.pb.right * Math.min(t, 60) / 60; g.style.width = Math.min(100, 100 * pace / Math.max(SP.pb.right, 1)) + "%"; const me = $("#me"); if (me) me.style.width = Math.min(100, 100 * SP.right / Math.max(SP.pb.right, 1)) + "%"; }
}
function spEnd() {
  stopSpeed(); SP.done = true;
  const d = SP.d, fmt = SP.fmt, rec = S.pbs[d.id] || (S.pbs[d.id] = {});
  const res = fmt === "round" ? {score: SP.score, right: SP.right, acc: SP.right / Math.max(1, SP.right + SP.miss), combo: SP.best, on: today()}
    : fmt === "clock" ? {secs: Math.round(spElapsed() + SP.pen), right: SP.right, on: today()} : {n: SP.right, on: today()};
  const old = rec[fmt], better = !old || (fmt === "round" ? res.score > old.score : fmt === "clock" ? res.secs < old.secs : res.n > old.n);
  SP.newPB = better && (fmt !== "clock" || SP.right >= 18);
  if (SP.newPB) rec[fmt] = res;
  let xp = SP.right + (SP.newPB && old ? 25 : 0);
  if (SP.dash) { xp *= 2; day().dash = 1; }
  if (fmt === "round") {
    d.medals.forEach((m, k) => { if (SP.right >= m) award(`speed-${d.id}-${["bronze", "silver", "gold"][k]}`); });
    if (SP.best >= 10) { award("combo10"); questTick("combo10"); }
    if (SP.best >= 25) award("combo25");
  }
  if (SP.newPB && old) questTick("pb");
  if (fmt === "clock") questTick("clock");
  active(); addXP(xp); save(); spRender();
}
function speedHTML() {
  if (!SP) return "";
  const d = SP.d;
  if (SP.done) {
    const r = SP.fmt === "round" ? `${SP.score} points · ${SP.right} right · best combo ${SP.best}` : SP.fmt === "clock" ? `${mmss(spElapsed() + SP.pen)} for 20 questions (${SP.miss} × 5 s added)` : `${SP.right} questions survived`;
    const medal = SP.fmt === "round" ? d.medals.reduce((m, t, k) => SP.right >= t ? ["Bronze", "Silver", "Gold"][k] : m, "") : "";
    return `<div class="card results"><h3>${esc(FORMATS[SP.fmt])}: ${esc(d.name)}</h3><p class="big">${r}</p>${SP.newPB ? "<p><b>New personal best!</b></p>" : ""}${medal ? `<p>${medal} medal level (${d.medals.join(" / ")} right for Bronze, Silver, Gold)</p>` : `<p class="meta">Medals at ${d.medals.join(" / ")} right in a Speed Round.</p>`}${SP.dash ? "<p>Daily Dash: double XP for today's first round.</p>" : ""}
<div class="row"><button type="button" class="btn" data-sp="${d.id}:${SP.fmt}">Go again</button><a class="btn ghost" href="#/tests/speed">Other drills</a></div></div>`;
  }
  const c = SP.cur, mult = SP.combo >= 11 ? 3 : SP.combo >= 6 ? 2 : 1;
  const stats = SP.fmt === "round" ? `<span>Score <b>${SP.score}</b></span><span class="combo${mult > 1 ? " hot" : ""}">Combo ${SP.combo}${mult > 1 ? ` · ×${mult}` : ""}</span>`
    : SP.fmt === "clock" ? `<span>${SP.right + SP.miss} of 20</span><span>+${SP.pen} s added</span>` : `<span class="hearts">${"♥".repeat(SP.lives)}${"♡".repeat(3 - SP.lives)}</span><span>Limit ${SP.limit.toFixed(1)} s</span>`;
  const ghost = SP.fmt === "round" && SP.pb ? `<div class="ghost" aria-hidden="true"><i id="ghost"></i><b id="me"></b><span>you vs. your best (${SP.pb.right})</span></div>` : "";
  const answer = d.kind === "num" ? `<div class="numrow">${inputHTML(0, SP.input, false, "Answer")}${c.unit ? `<span class="affix">${c.unit}</span>` : ""}<button type="button" class="btn" data-spk="enter">Enter</button></div>${keypadHTML(/\//.test(c.a) ? "frac" : /\./.test(c.a) ? "dec neg" : "int neg")}`
    : `<div class="row center">${(d.kind === "cmp" ? ["<", "=", ">"] : d.kind === "yn" ? ["Yes", "No"] : ["I", "II", "III", "IV"]).map(x => `<button type="button" class="btn big" data-spa="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  return `<div class="speed"><div class="tesbar"><b>${esc(FORMATS[SP.fmt])}</b><span>${esc(d.name)}</span><span class="sp"></span><span id="sptime" class="timer"></span></div>${ghost}
<div class="spq">${mathHTML(c.q)}</div>${answer}<div class="spstats">${stats}</div>${SP.lastMiss ? `<p class="meta">Last miss: ${mathHTML(SP.lastMiss)}</p>` : ""}</div>`;
}
function spRender() { const el = $("#mode"); if (el) el.innerHTML = speedHTML(); }
// typing into the speed answer box: move on as soon as the typed answer is right
function spType(key) {
  if (!SP || SP.done || SP.d.kind !== "num") return;
  if (key === "⌫") SP.input = SP.input.slice(0, -1);
  else if (key === "−") SP.input = SP.input.startsWith("−") ? SP.input.slice(1) : "−" + SP.input;
  else if (key === "␣") SP.input += " ";
  else SP.input += key;
  if (M6.check({ans: SP.cur.a}, SP.input).ok) return spAnswer(SP.input);
  const box = $(".speed .ans"); if (box) box.value = SP.input;
}
