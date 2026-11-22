// ---------- Router, events, install note, backup and restore, offline copy
function route() {
  const parts = (location.hash.replace(/^#\/?/, "") || "today").split("/");
  return V[parts[0]] ? parts : ["today"];
}
function renderStats() {   // the band at the top; also refreshed the moment XP or coins change
  const el = $("#stats"); if (!el) return;
  const Lv = levelOf(S.xp), lo = 50 * Lv * (Lv - 1), hi = 50 * (Lv + 1) * Lv;
  el.innerHTML = `<div class="stat"><b>${streak()}</b><span>day streak</span></div><div class="stat"><b>${S.coins}</b><span>coins</span></div><div class="stat"><b>Lv ${Lv}</b><span>${titleOf(Lv)} · ${S.xp} XP</span><span class="xpbar" aria-hidden="true"><i style="width:${Math.round(100 * (S.xp - lo) / (hi - lo))}%"></i></span></div>`;
}
function render() {
  const [name, a, b] = route();
  if (!["run", "lesson"].includes(name) || (name === "lesson" && !["quiz", "test5"].includes(b))) stopTimers();
  if (name !== "speed") stopSpeed();
  if (!(name === "lesson" && (b || "learn") === "learn") && name !== "voice") { if (T && T.playing) { T.playing = false; } Voice.stop(); }
  CUR = null;
  renderStats();
  const tab = {unit: "units", lesson: "units", run: "tests", speed: "tests", voice: "settings", parent: "settings"}[name] || name;
  $("#tabs").innerHTML = TABS.map(([k, t]) => `<a href="#/${k}"${k === tab ? ' aria-current="page"' : ""}${k === "settings" ? ' class="gear"' : ""}>${t}</a>`).join("");
  $("#view").innerHTML = V[name](a, b);
  renderInst();
}
function qRefresh() { if (CUR === "teach") teachRender(); else if (CUR === "practice") practiceRender(); else if (CUR === "ses") sesRender(); }

// ---------- Install note for Safari on iPad (from SAT Daily)
function renderInst() {
  const el = $("#inst");
  if (!PWA || !ON_WEB || STANDALONE || !IOS || localStorage.getItem(LS + ".inst")) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="inst"><div><b>Put Math 6 on your Home Screen</b><span>Tap Share, then Add to Home Screen. Open it once while online; after that it works offline.</span></div><button type="button" class="btn ghost sm" data-act="hideinst">Got it</button></div>`;
}

// ---------- Backup and restore through the share sheet (from SAT Daily)
async function backup() {
  const k = today(), name = `math6-backup-${k}.json`, data = JSON.stringify(S);
  if (IOS && navigator.share && navigator.canShare) {
    for (const type of ["application/json", "text/plain"]) {
      const f = new File([data], name, {type});
      if (!navigator.canShare({files: [f]})) continue;
      try { await navigator.share({files: [f]}); S.bk = k; save(); render(); toast("Backed up"); } catch (e) {}
      return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], {type: "application/json"})); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  S.bk = k; save(); render(); toast("Backup saved");
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => {
    try { const j = JSON.parse(r.result); if (!j || j.v !== 1) throw 0; S = Object.assign(fresh(), j); S.set = Object.assign(fresh().set, j.set || {}); save(); render(); toast("Progress restored"); }
    catch (e) { toast("That file isn't a Math 6 backup"); }
  };
  r.readAsText(file);
}

// ---------- Events
ACT.hideinst = () => { localStorage.setItem(LS + ".inst", "1"); renderInst(); };
ACT.say = () => { if (Q) sayQuestion(Q.it); };
ACT.saysol = () => { if (Q) Voice.play(Q.it.sol.map(x => plain(x.s) + ". " + plain(x.why))); };
ACT.scratch = () => scratchOpen();
ACT.padclear = () => { const c = $("#pad"); if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height); };
ACT.clear = () => { if (Q && !Q.done) { Q.r = 0; qRefresh(); } };
ACT["row+"] = () => { if (Q && !Q.done) { Q.r = Math.min(100, Q.r + 10); qRefresh(); } };
ACT["row-"] = () => { if (Q && !Q.done) { Q.r = Math.max(0, Q.r - 10); qRefresh(); } };
function markSay(line) { $$(".say").forEach(el => el.classList.toggle("on", Number(el.dataset.i) === line)); }
document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-cell], a[data-say]");
  if (!t) return;
  const d = t.dataset;
  if (d.act && ACT[d.act]) return ACT[d.act](t);
  if (t.id === "bkup") return backup();
  if (t.id === "vall") return Voice.play(SPEECH_TEST, markSay);
  if (t.id === "vstop") { Voice.stop(); return markSay(-1); }
  if (d.play != null) { const i = Number(d.play); return Voice.play([SPEECH_TEST[i]], k => markSay(k < 0 ? -1 : i)); }
  if (d.say != null) return Voice.play([d.say]);
  if (d.sp) { const [dr, f] = d.sp.split(":"); if (location.hash === `#/speed/${dr}/${f}`) { speedStart(dr, f); return spRender(); } location.hash = `#/speed/${dr}/${f}`; return; }
  if (d.spa != null) return spAnswer(d.spa);
  if (d.spk === "enter") return SP && spAnswer(SP.input);
  if (d.key != null) { if (CUR === "speed") return spType(d.key); return typeKey(d.key); }
  if (d.tgo != null) { Voice.stop(); return teachGo(Number(d.tgo), false); }
  if (d.sgo != null) { SES.sheet = false; sesShow(Number(d.sgo)); return sesRender(); }
  if (d.rsay != null) { const it = sesItem(Number(d.rsay)); return Voice.play(it.sol.map(x => plain(x.s) + ". " + plain(x.why))); }
  if (d.frame != null) {
    const it = Q.it, f = it.frame, right = SES.frameStep === 0 ? f.fr : f.tr, opts = SES.frameStep === 0 ? f.find : f.tool;
    if (opts[Number(d.frame)] !== right) { toast(SES.frameStep === 0 ? "Not quite. Read the last sentence again: what does it ask for?" : "Another tool fits better. Think about what you know and what you need."); return; }
    SES.frameStep = (S.wslevel || 0) >= 1 ? 9 : SES.frameStep + 1; if (SES.frameStep >= 2) SES.frameStep = 9;
    return sesRender();
  }
  if (!Q || Q.done) return;
  const it = Q.it, r = Q.r;
  if (d.pick != null) { const i = Number(d.pick); if (it.type === "mc") Q.r = i; else Q.r = r.includes(i) ? r.filter(x => x !== i) : r.concat(i); return qRefresh(); }
  if (d.cell != null) { const i = Number(d.cell); Q.r = Q.r === i + 1 ? i : i + 1; return qRefresh(); }
  if (d.opick != null) { r.push(Number(d.opick)); return qRefresh(); }
  if (d.unpick != null) { r.splice(Number(d.unpick), 1); return qRefresh(); }
  if (d.left != null) { Q.leftSel = Number(d.left); return qRefresh(); }
  if (d.right != null && Q.leftSel != null) { for (const k of Object.keys(r)) if (r[k] === Number(d.right)) delete r[k]; r[Q.leftSel] = Number(d.right); Q.leftSel = null; return qRefresh(); }
  if (d.yn != null) { const [i, v] = d.yn.split(":").map(Number); r[i] = v === 1; return qRefresh(); }
  if (d.step != null) { r.step = Number(d.step); r.fix = null; return qRefresh(); }
  if (d.fix != null) { r.fix = Number(d.fix); return qRefresh(); }
});
// Scores on a written explanation are given after the answer is shown, so they work on a finished question too
document.addEventListener("click", e => {
  const t = e.target.closest("[data-score]"); if (!t || !Q) return;
  Q.r.score = Number(t.dataset.score); Q.g = grade(Q.it, Q.r); qRefresh();
}, true);
document.addEventListener("focusin", e => {
  const box = e.target.closest(".ans"); if (!box || !Q) return;
  Q.focus = Number(box.dataset.i); $$(".ans").forEach(x => x.classList.toggle("focus", x === box));
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.classList.contains("ans")) {
    if (CUR === "speed" && SP) { SP.input = el.value; if (M6.check({ans: SP.cur.a}, SP.input).ok) spAnswer(SP.input); return; }
    if (!Q || Q.done) return;
    if (Q.it.type === "table") Q.r[Number(el.dataset.i)] = el.value; else Q.r[0] = el.value;
  }
  if (el.id === "explain" && Q) Q.r.text = el.value;
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.classList || !e.target.classList.contains("ans")) return;
  e.preventDefault();
  if (CUR === "speed") return SP && spAnswer(SP.input);
  const b = $('[data-act="p-check"], [data-act="s-check"], [data-act="t-check"], [data-act="s-next"]'); if (b) b.click();
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "rst" && el.files[0]) return restore(el.files[0]);
  if (el.id === "vsel") { S.set.voice.uri = el.value; return save(); }
  if (el.id === "vrate" || el.id === "t-rate") { S.set.voice.rate = Number(el.value); return save(); }
  if (el.id === "name") { S.name = el.value.trim().slice(0, 30); save(); return render(); }
  if (el.id === "p-cur") { S.set.current = Number(el.value); return save(); }
  if (el.id === "p-timer") { S.set.timer = el.value; return save(); }
  if (el.dataset.set) { S.set[el.dataset.set] = el.checked; save(); return render(); }
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
quests(); settleStreak(); checkBadges();
render();
window.M6APP = {get Q() { return Q; }, get SES() { return SES; }, get SP() { return SP; }, get T() { return T; }, get S() { return S; }, answerText, grade};

// ---------- Offline copy. A new version takes over between screens, never mid-question (from SAT Daily).
const canReload = () => !Voice.playing && !Voice.paused && !(SES && !SES.done) && !(SP && !SP.done) && !(Q && !Q.done && CUR === "practice");
if (PWA && ON_WEB && "serviceWorker" in navigator) {
  const had = !!navigator.serviceWorker.controller;
  let pending = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!had) { toast("Saved for offline use"); return; }
    if (canReload()) location.reload(); else pending = true;
  });
  window.addEventListener("hashchange", () => { if (pending && canReload()) location.reload(); });
  navigator.serviceWorker.register("sw.js").then(reg => {
    let checked = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - checked > 36e5) { checked = Date.now(); reg.update().catch(() => {}); }
    });
  }).catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
}
