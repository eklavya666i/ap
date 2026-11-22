// ---------- Teach player: the voice reads each step while the whiteboard shows it.
// A step: {part, say, board?, why?, check?: {item, miss}}. Steps without a board keep the last one.
const PARTS = {hook: "Hook", idea: "Big idea", see: "See it", ido: "I do", wedo: "We do", watch: "Watch out", recap: "Recap"};
let T = null;
function teachStart(lessonId, alt = false) {
  const c = LESSONS[lessonId].c;
  T = {lesson: lessonId, alt, steps: alt ? c.alt : c.script, i: 0, playing: false, checks: {}, finished: false, why: false};
  if (alt) { S.explore.another++; checkBadges(); save(); }
}
function boardAt(i) { for (let k = i; k >= 0; k--) if (T.steps[k].board) return T.steps[k].board; return null; }
function teachHTML() {
  if (T.finished) return teachEndHTML();
  const st = T.steps[T.i], n = T.steps.length, ck = st.check && T.checks[T.i] !== "done";
  const playLabel = T.playing ? "❚❚ Pause" : Voice.waiting || Voice.paused ? "▶ Resume" : T.i === 0 && !T.started ? "▶ Play lesson" : "▶ Play";
  return `<div class="teach">
<div class="tboard" id="tboard">${board(boardAt(T.i))}</div>
<div class="tside">
  <div class="tpart">${esc(PARTS[st.part] || "")}${T.alt ? " · another way" : ""}<span class="sp"></span>${T.i + 1} of ${n}</div>
  <div class="tcap${S.set.captions === false ? " off" : ""}" id="tcap">${mathHTML(st.say)}</div>
  ${T.why && st.why ? `<div class="twhy"><b>Why?</b> ${mathHTML(st.why)}</div>` : ""}
  <div id="tcheck">${ck && T.checks[T.i] ? qHTML({scratch: false}) + checkBarHTML() : ""}</div>
</div>
<div class="tbar">
  <button type="button" class="btn ghost sm" data-act="t-back" aria-label="Back one step"${T.i === 0 ? " disabled" : ""}>⏮ Back</button>
  <button type="button" class="btn sm" data-act="t-play">${playLabel}</button>
  <button type="button" class="btn ghost sm" data-act="t-replay" aria-label="Replay this step">↻ Replay</button>
  <button type="button" class="btn ghost sm" data-act="t-next" aria-label="Next step"${ck ? " disabled" : ""}>Next ⏭</button>
  <select id="t-rate" aria-label="Voice speed">${[0.8, 0.9, 1, 1.1].map(r => `<option value="${r}"${(S.set.voice.rate || 1) === r ? " selected" : ""}>${r}×</option>`).join("")}</select>
  <button type="button" class="btn ghost sm" data-act="t-cap" aria-pressed="${S.set.captions !== false}">Captions</button>
  ${st.why ? '<button type="button" class="btn ghost sm" data-act="t-why">Why?</button>' : ""}
  <button type="button" class="btn ghost sm" data-act="t-alt">${T.alt ? "Back to the lesson" : "Explain it another way"}</button>
</div>
<div class="tdots">${T.steps.map((s, k) => `<button type="button" class="tdot${k === T.i ? " on" : k < T.i ? " past" : ""}" data-tgo="${k}" aria-label="Step ${k + 1}: ${esc(PARTS[s.part] || "")}"></button>`).join("")}</div>
${Voice.ok ? "" : '<p class="meta">No speech voice on this device: read the captions and tap Next.</p>'}
</div>`;
}
function checkBarHTML() {
  return Q && Q.done ? `<div class="row"><button type="button" class="btn sm" data-act="t-cont">Continue the lesson</button>${!Q.g.ok ? '<button type="button" class="btn ghost sm" data-act="t-retry">Try again</button>' : ""}</div>` : `<div class="row"><button type="button" class="btn sm" data-act="t-check">Check</button></div>`;
}
function teachEndHTML() {
  const id = T.lesson, l = LESSONS[id];
  return `<div class="card done-card"><h3>Lesson done: ${esc(l.title)}</h3><p>Now practice with fresh numbers. Three right in a row, with no hints, masters the lesson.</p>
<div class="row"><a class="btn" href="#/lesson/${id}/practice">Start practice</a><a class="btn ghost" href="#/lesson/${id}/notes">Notes</a><button type="button" class="btn ghost" data-act="t-again">Play it again</button></div></div>`;
}
function teachRender() { const el = $("#teach"); if (el) el.innerHTML = teachHTML(); }
function teachGo(i, speak) {
  T.i = Math.max(0, Math.min(T.steps.length - 1, i)); T.why = false;
  const st = T.steps[T.i];
  if (st.check && T.checks[T.i] !== "done") { T.checks[T.i] = T.checks[T.i] || "open"; startQ(normItem(Object.assign({seed: 7 + T.i}, st.check.item))); }
  teachRender();
  if (speak) teachSpeak();
}
function teachSpeak() {
  const i = T.i, st = T.steps[i];
  T.playing = true; T.started = true; teachRender();
  const said = Voice.play([st.say], k => { if (k === -2) { T.playing = false; teachRender(); } }, () => teachStepDone(i));
  if (!said) { T.playing = false; teachRender(); }
}
function teachStepDone(i) {
  if (!T || T.i !== i || !T.playing) return;
  const st = T.steps[i];
  if (st.check && T.checks[i] !== "done") { T.playing = false; teachRender(); return; }   // wait for the student's answer
  if (i >= T.steps.length - 1) { teachFinish(); return; }
  setTimeout(() => { if (T && T.playing && T.i === i) teachGo(i + 1, true); }, 450);
}
function teachFinish() {
  T.playing = false; T.finished = true;
  const st = L(T.lesson);
  if (!st.learned) { st.learned = 1; addXP(20); questTick("learn"); checkBadges(); }
  if (st.chip === "untouched") st.chip = "practicing";
  save(); teachRender();
}
Object.assign(ACT, {
  "t-play": () => {
    if (T.playing) { Voice.pause(); T.playing = false; teachRender(); }
    else if (Voice.paused || Voice.waiting) { T.playing = true; Voice.resume(); teachRender(); }
    else teachSpeak();
  },
  "t-next": () => { Voice.stop(); if (T.i >= T.steps.length - 1) teachFinish(); else teachGo(T.i + 1, T.playing || T.started); },
  "t-back": () => { Voice.stop(); teachGo(T.i - 1, T.playing); },
  "t-replay": () => { Voice.stop(); teachSpeak(); },
  "t-cap": () => { S.set.captions = S.set.captions === false; save(); teachRender(); },
  "t-why": () => { T.why = true; Voice.stop(); T.playing = false; teachRender(); Voice.play([T.steps[T.i].why]); },
  "t-alt": () => { Voice.stop(); const id = T.lesson; teachStart(id, !T.alt); teachGo(0, false); },
  "t-again": () => { teachStart(T.lesson, false); teachGo(0, true); },
  "t-check": () => {
    const g = grade(Q.it, Q.r);
    if (g.empty) { toast("Answer first"); return; }
    if (g.close) { Q.g = g; teachRender(); return; }
    Q.done = true; Q.g = g; beep(g.ok); teachRender();
    const st = T.steps[T.i];
    Voice.play([g.ok ? "That's right." : (st.check.miss || "Not quite. Let's look at it again.")]);
  },
  "t-retry": () => { startQ(Q.it); teachRender(); },
  "t-cont": () => { T.checks[T.i] = "done"; Voice.stop(); if (T.i >= T.steps.length - 1) teachFinish(); else teachGo(T.i + 1, true); }
});
