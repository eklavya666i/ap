// ---------- Test: reading checks by chapter, quick quizzes, the unit test, My misses and timed writes
let TWT = 0;
function heatClass(ch, bk = "lotf") { const b = bestCheck(ch, bk); return b == null ? "" : b >= 7 ? "g" : b >= 6 ? "m" : b >= 4 ? "w" : "r"; }
const heatRow = b => BOOKS[b].chapters.map(c => canSee(c.n, b) ? `<a class="${heatClass(c.n, b)}" href="#" data-act="quiz" data-arg="ch:${b}:${c.n}" title="${W(b).ch} ${c.n}${bestCheck(c.n, b) != null ? `: best ${bestCheck(c.n, b)}/8` : ""}">${c.n}</a>` : `<a href="${chHref(b, c.n)}" class="locked" title="Not read yet">${c.n}</a>`).join("");
const promptOpen = p => { const b = p.book === undefined ? "lotf" : p.book; return !b || p.upto <= readTo(b) || readTo(b) >= BOOKS[b].chapters_n; };
V.test = () => {
  const r = readTo(), ra = readTo("asp"), misses = Object.keys(S.miss).length;
  const quick = [
    ["mix:lotf", "Mixed review: Lord of the Flies", "15 questions from every chapter you've read.", r >= 1],
    ["mix:asp", "Mixed review: A Small Place", "15 questions from every section you've read.", ra >= 1],
    ["lens", "Lens quiz", "15 questions: name the lens, pick the evidence, spot the thesis.", true],
    ["arg", "Argument quiz", "15 questions on claims, evidence, reasoning, sources and debate.", true],
    ["fallacies", "Fallacy finder", "15 arguments: name the fallacy.", true],
    ["terms", "Terms quiz", "15 terms: definitions and examples.", true],
    ["who:lotf", "Who and what", "Characters and symbols from their descriptions.", r >= 1],
    ["unit:2", "Unit 2 test", "A Small Place and rhetoric: 40 minutes, scored at the end.", true],
    ["unit:3", "Unit 3 test", "Argument: 30 questions in 40 minutes.", true],
    ["unit:4", "Unit 4 test", "Lord of the Flies and lenses: 30 questions in 40 minutes.", true],
    ["miss", `My misses (${misses})`, "Every question you've missed. Get it right to clear it.", misses > 0]];
  const prompts = PROMPTS.map(p => { const ok = promptOpen(p), b = p.book === undefined ? "lotf" : p.book; return `<li class="${ok ? "" : "locked"}"><a class="go" href="${ok ? `#/tw/${p.id}` : chHref(b, Math.min(BOOKS[b].chapters_n, readTo(b) + 1))}"><span class="t">${esc(p.text)}<br><span class="s">${esc(ESSAY(p.type).name)} · ${p.min} minutes${ok ? "" : ` · after ${W(b).ch.toLowerCase()} ${p.upto} of ${esc(BOOKS[b].title)}`}</span></span></a></li>`; }).join("");
  const recent = S.quizzes.slice(-8).reverse();
  return `<h2>Test</h2><p class="lead">Reading checks for every chapter, quizzes on lenses and terms, a timed unit test, and timed writes under real conditions.</p>
  <div class="card"><h3>Reading checks</h3><p class="meta">Tap a chapter or section. Colors show your best score: green 7 or 8, light green 6, amber 4 or 5, red below 4. Grey ones stay locked until you mark them read.</p>
  <h4><i>Lord of the Flies</i></h4><div class="heat">${heatRow("lotf")}</div><h4><i>A Small Place</i></h4><div class="heat">${heatRow("asp")}</div></div>
  <div class="grid">${quick.map(([k, t, d, ok]) => `<div class="card"><h3>${esc(t)}</h3><p class="meta">${esc(d)}</p><div class="row"><button class="btn sm${ok ? "" : " ghost"}" data-act="quiz" data-arg="${k}"${ok ? "" : " disabled"}>Start</button></div></div>`).join("")}</div>
  <div class="card"><h3>Timed writes</h3><p class="meta">Plan for five minutes, write, then check it and score it with the rubric.</p><ul class="list">${prompts}</ul>
  ${S.tw ? `<div class="row"><a class="btn" href="#/tw/${S.tw.id}">Resume your timed write</a></div>` : ""}</div>
  ${S.writes.length ? `<div class="card"><h3>Past timed writes</h3><ul class="list">${S.writes.map((w, i) => ({w, i})).reverse().slice(0, 8).map(({w, i}) => `<li><a class="go" href="#/check/tw/${i}"><span class="t">${esc(w.prompt.slice(0, 90))}${w.prompt.length > 90 ? "…" : ""}<br><span class="s">${nice(w.d)} · ${w.words} words in ${w.min} minutes${w.over ? " (overtime)" : ""}</span></span></a></li>`).join("")}</ul></div>` : ""}
  ${recent.length ? `<div class="card"><h3>Recent quizzes</h3><table class="tbl">${recent.map(q => `<tr><td>${nice(q.d)}</td><td>${esc(q.title)}</td><td>${q.right}/${q.n}</td></tr>`).join("")}</table></div>` : ""}`;
};

// ---------- Timed write
ACT.twstart = id => {
  const p = PROMPTS.find(x => x.id === id), min = Number(($("#twmin") || {}).value) || p.min;
  S.tw = {id, prompt: p.text, type: p.type, min, start: Date.now(), end: Date.now() + min * 60000, text: "", plan: {t: "", c1: "", c2: ""}};
  save(); render();
};
ACT.twfinish = () => {
  const t = S.tw; if (!t) return;
  if (wcount(t.text) < 30 && !confirm("You've written less than 30 words. Finish anyway?")) return;
  S.writes.push({d: today(), pid: t.id, prompt: t.prompt, type: t.type, min: t.min, words: wcount(t.text), text: t.text, over: Date.now() > t.end + 30000 ? 1 : 0});
  S.tw = null; clearInterval(TWT); addXP(40); checkBadges(); save();
  location.hash = `#/check/tw/${S.writes.length - 1}`;
};
ACT.twquit = () => { if (confirm("Stop this timed write? What you wrote is deleted.")) { S.tw = null; clearInterval(TWT); save(); location.hash = "#/test"; } };
IN.twtext = el => { if (!S.tw) return; S.tw.text = el.value; saveSoon(); const w = $("#twwc"); if (w) w.textContent = `${wcount(el.value)} words`; };
IN.twplan = el => { if (!S.tw) return; S.tw.plan[el.dataset.k] = el.value; saveSoon(); };
function twTimer() {
  clearInterval(TWT);
  const upd = () => {
    if (!S.tw) return clearInterval(TWT);
    const left = (S.tw.end - Date.now()) / 1000, el = $("#twtimer"), ban = $("#twover");
    if (el) { el.textContent = left > 0 ? mmss(left) : "0:00"; el.classList.toggle("low", left < 300); }
    if (ban) ban.hidden = left > 0;
  };
  upd(); TWT = setInterval(upd, 1000);
}
V.tw = id => {
  const p = PROMPTS.find(x => x.id === id); if (!p) return V.test();
  if (!S.tw || S.tw.id !== id) {
    return `<p class="crumb"><a href="#/test">‹ Test</a></p><div class="card"><span class="pill">${esc(ESSAY(p.type).name)}</span><h2 style="margin-top:8px">Timed write</h2><p class="prose">${esc(p.text)}</p>
    <label class="tog">Minutes <select id="twmin">${[30, 40, 45, 50, 60].map(m => `<option${m === p.min ? " selected" : ""}>${m}</option>`).join("")}</select></label>
    <h4>How to use the time</h4><ul class="tight">${TIMED_TIPS.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    ${S.tw ? `<p class="meta">You have another timed write in progress; starting this one replaces it.</p>` : ""}
    <div class="row"><button class="btn" data-act="twstart" data-arg="${p.id}">Start the clock</button><a class="btn ghost" href="#/guide/${p.type}">Review the guide first</a></div></div>`;
  }
  AFTER = twTimer;
  const t = S.tw;
  return `<div class="tesbar"><b>Timed write</b><span class="sp"></span><span class="timer" id="twtimer"></span><button class="btn sm" data-act="twfinish">Finish</button><button class="btn ghost sm" data-act="twquit">Stop</button></div>
  <div class="card note" id="twover" hidden><b>Time's up.</b> Finish your sentence, then tap Finish. Overtime is noted, not penalized.</div>
  <div class="card"><p class="prose" style="margin:0">${esc(t.prompt)}</p></div>
  <details class="card"${t.text ? "" : " open"}><summary>Five-minute plan</summary>
  <label class="f">Thesis<input type="text" data-in="twplan" data-k="t" value="${esc(t.plan.t)}"></label>
  <label class="f">Body claim 1 and its evidence<input type="text" data-in="twplan" data-k="c1" value="${esc(t.plan.c1)}"></label>
  <label class="f">Body claim 2 and its evidence<input type="text" data-in="twplan" data-k="c2" value="${esc(t.plan.c2)}"></label></details>
  <div class="card"><textarea class="draft" data-in="twtext" placeholder="Write here">${esc(t.text)}</textarea><div class="wc" id="twwc">${wcount(t.text)} words</div></div>`;
};
