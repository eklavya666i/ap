// ---------- Router, events, install note, backup and restore, offline copy
const TABS = [["today", "Today"], ["learn", "Learn"], ["write", "Write"], ["check", "Check"], ["test", "Test"], ["coach", "Coach"], ["me", "Me"]];
const TAB_OF = {rhetoric: "learn", rap: "write", unit: "learn", ch: "learn", terms: "learn", lesson: "learn", soap: "write", debate: "write", asg: "write", guide: "write", quotes: "write", seminar: "write", drills: "write", drill: "write", rubric: "check", claude: "check", run: "test", tw: "test", advice: "coach", ailog: "coach", review: "today", settings: "me", parent: "me"};
function route() {
  const parts = (location.hash.replace(/^#\/?/, "") || "today").split("/").map(decodeURIComponent);
  return V[parts[0]] ? parts : ["today"];
}
function renderStats() {
  const el = $("#stats"); if (!el) return;
  const Lv = levelOf(S.xp), lo = 50 * Lv * (Lv - 1), hi = 50 * (Lv + 1) * Lv;
  const U = UNIT(S.set.unit) || UNIT(3), B = bookOfUnit(U.u);
  const prog = B ? `<div class="stat"><b>${readTo(B.id)}/${B.chapters_n}</b><span>${W(B.id).chs.toLowerCase()}</span></div>`
    : U.workshop ? `<div class="stat"><b>${ARG.lessons.filter(l => S.seen["lesson:" + l.id]).length}/${ARG.lessons.length}</b><span>lessons</span></div>`
    : `<div class="stat"><b>${U.u}</b><span>unit</span></div>`;
  el.innerHTML = `<div class="stat"><b>${streak()}</b><span>day streak</span></div>${prog}<div class="stat"><b>Lv ${Lv}</b><span>${titleOf(Lv)} · ${S.xp} XP</span><span class="xpbar" aria-hidden="true"><i style="width:${Math.round(100 * (S.xp - lo) / (hi - lo))}%"></i></span></div>`;
}
let CURNAME = "";
function render() {
  const parts = route(), name = parts[0];
  if (name !== "run") clearInterval(TICK);
  if (name !== "tw") clearInterval(TWT);
  if (name !== "review") REV = null;
  if (name !== "drill") DR = null;
  if (name !== "parent") PARENT_OK = false;
  CURNAME = name; AFTER = null;
  document.body.classList.toggle("big", !!S.set.big);
  renderStats();
  const tab = TAB_OF[name] || name;
  $("#tabs").innerHTML = TABS.map(([k, t]) => `<a href="#/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("");
  $("#view").innerHTML = V[name](...parts.slice(1));
  if (AFTER) AFTER();
  renderInst();
}

// ---------- Install note for Safari on iPad (from SAT Daily)
function renderInst() {
  const el = $("#inst");
  if (!PWA || !ON_WEB || STANDALONE || !IOS || localStorage.getItem(LS + ".inst")) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="inst"><div><b>Put English 10H on your Home Screen</b><span>Tap Share, then Add to Home Screen. Open it once while online; after that it works offline.</span></div><button type="button" class="btn ghost sm" data-act="hideinst">Got it</button></div>`;
}
ACT.hideinst = () => { localStorage.setItem(LS + ".inst", "1"); renderInst(); };

// ---------- Backup and restore through the share sheet (from SAT Daily)
async function backup() {
  const k = today(), name = `english10h-backup-${k}.json`, data = JSON.stringify(S);
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
    try { const j = JSON.parse(r.result); if (!j || j.v !== 1 || !j.set || !("read" in j)) throw 0; loadState(j); save(); render(); toast("Progress restored"); }
    catch (e) { toast("That file isn't an English 10H backup"); }
  };
  r.readAsText(file);
}

// ---------- Events
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]");
  if (t) { if (t.tagName === "A") e.preventDefault(); const f = ACT[t.dataset.act]; if (f) f(t.dataset.arg, t, e); return; }
  const b = e.target.closest("button"); if (b && b.id === "bkup") backup();
});
document.addEventListener("keydown", e => {
  const el = e.target;
  if (e.key === "Enter" && el.classList && el.classList.contains("finding")) { el.click(); return; }
  if (CURNAME !== "run" || !SES || SES.done || /INPUT|TEXTAREA|SELECT/.test(el.tagName)) return;
  const i = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
  if (i >= 0 && e.key.length === 1 && i < SES.items[SES.i].choices.length) { e.preventDefault(); ACT.pick(String(i)); }
  else if (e.key === "Enter") { const b = $('[data-act="qnext"]:not([disabled]), [data-act="qsubmit"]'); if (b) { e.preventDefault(); b.click(); } }
});
const TEXTY = el => el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|number|password|email|tel|url)$/.test(el.type));
document.addEventListener("input", e => { const el = e.target; if (el.dataset && el.dataset.in && TEXTY(el) && IN[el.dataset.in]) IN[el.dataset.in](el); });
document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "rst" && el.files && el.files[0]) return restore(el.files[0]);
  if (el.dataset && el.dataset.in && !TEXTY(el) && IN[el.dataset.in]) IN[el.dataset.in](el);
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
goals(); settleStreak(); checkBadges();
render();
window.E10 = {get S() { return S; }, get SES() { return SES; }, get CK() { return CK; }, Checker, RhetCheck, RHET, render, startQuiz, recs, rhQuiz, RHB, SHEET};

// ---------- Offline copy. A new version takes over between screens, never mid-quiz or mid-write (from SAT Daily).
const canReload = () => !(SES && !SES.done) && !S.tw && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "");
if (PWA && ON_WEB && "serviceWorker" in navigator) {
  const had = !!navigator.serviceWorker.controller;
  let pending = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!had) { toast("Saved for offline use"); return; }
    save(); if (canReload()) location.reload(); else pending = true;
  });
  window.addEventListener("hashchange", () => { if (pending && canReload()) { save(); location.reload(); } });
  navigator.serviceWorker.register("sw.js").then(reg => {
    let checked = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - checked > 36e5) { checked = Date.now(); reg.update().catch(() => {}); }
    });
  }).catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
}
