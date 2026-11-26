// ---------- Check: the offline draft checker with highlights, rubric self-scoring, and the Claude feedback hand-off
// A draft comes from an assignment (#/check/a/ID), a timed write (#/check/tw/N) or the free box for a type (#/check/t/TYPE).
function draftSrc(mode, id) {
  if (mode === "a") { const a = getA(id); if (a) return {key: "a:" + a.id, type: ESSAY_TYPES.includes(a.type) ? a.type : "lit", a, title: a.title, get: () => a.draft || "", set: v => { a.draft = v; }}; }
  if (mode === "tw") { const w = S.writes[Number(id)]; if (w) return {key: "tw:" + id, type: w.type, w, title: "Timed write · " + nice(w.d), get: () => w.text || "", set: v => { w.text = v; }}; }
  const type = ESSAY(id) ? id : (S.drafts.lastType || "lens");
  return {key: "t:" + type, type, title: ESSAY(type).name, get: () => S.drafts["check:" + type] || "", set: v => { S.drafts["check:" + type] = v; }};
}
let CK = null;   // the last check: {key, res, text}
IN.cktext = el => { const src = draftSrc(el.dataset.mode, el.dataset.id); src.set(el.value); saveSoon(); const w = $("#ckwc"); if (w) w.textContent = `${wcount(el.value)} words`; };
IN.cktype = el => { S.drafts.lastType = el.value; save(); location.hash = `#/check/t/${el.value}`; };
ACT.runcheck = arg => {
  const [mode, id] = arg.split("|"), src = draftSrc(mode, id), text = src.get(), E = ESSAY(src.type);
  const ctx = src.a ? ctxFor(src.a) : {type: src.type, lenses: LENSES, title: "", author: "", names: LOTF.characters.map(c => c.name.split(" ")[0])};
  CK = {key: src.key, text, res: Checker.check(text, E.check, {...ctx, type: src.type})};
  if (CK.res.stats.words >= 40) {
    const first = !S.checks.some(c => c.key === src.key && c.d === today());
    S.checks.push({d: today(), key: src.key, type: src.type, words: CK.res.stats.words, fixes: CK.res.fixes, tips: CK.res.tips, areas: CK.res.areas});
    if (S.checks.length > 200) S.checks.splice(0, S.checks.length - 200);
    if (first) addXP(10);
    goalTick("draft"); checkBadges(); save();
  }
  render(); setTimeout(() => { const r = $("#ckres"); if (r) r.scrollIntoView({behavior: REDUCED ? "auto" : "smooth", block: "start"}); }, 30);
};
ACT.showf = a => { $$("mark.on").forEach(m => m.classList.remove("on")); const ms = $$(`mark[data-f="${a}"]`); ms.forEach(m => m.classList.add("on")); if (ms[0]) ms[0].scrollIntoView({block: "center", behavior: REDUCED ? "auto" : "smooth"}); else toast("This one is about the whole draft or a whole paragraph"); };
const AREA_NAMES = {thesis: "Thesis", evidence: "Evidence", commentary: "Commentary", organization: "Organization", style: "Style", conventions: "Conventions and MLA", counter: "Counterclaim", lens: "Lens", sources: "Sources", story: "Storytelling"};
function areasFor(type) {
  const a = type === "narrative" ? ["story", "organization", "style", "conventions"] : ["thesis", "evidence", "commentary", "organization", "style", "conventions"];
  if (type === "argument") a.splice(3, 0, "counter"); if (type === "lens") a.splice(1, 0, "lens"); if (type === "synthesis") a.splice(2, 0, "sources");
  return a;
}
function markedHTML(text, findings) {
  const spans = [];
  findings.forEach((f, i) => f.spans.forEach(([s, e]) => { if (e - s <= 240) spans.push({s, e, sev: f.sev, i}); }));   // whole-paragraph findings stay in the list only
  const pick = [];   // fixes first, then shorter spans, never overlapping
  for (const m of spans.slice().sort((a, b) => (a.sev === "fix" ? 0 : 1) - (b.sev === "fix" ? 0 : 1) || (a.e - a.s) - (b.e - b.s))) if (!pick.some(x => m.s < x.e && x.s < m.e)) pick.push(m);
  pick.sort((a, b) => a.s - b.s);
  let out = "", at = 0;
  for (const m of pick) {
    out += esc(text.slice(at, m.s)) + `<mark class="${m.sev === "fix" ? "f" : "t"}" data-f="${m.i}">${esc(text.slice(m.s, m.e))}</mark>`; at = m.e;
  }
  return out + esc(text.slice(at));
}
function checkResults(src) {
  if (!CK || CK.key !== src.key) return "";
  const r = CK.res, E = ESSAY(src.type);
  if (r.stats.words < 40) return `<div class="card note" id="ckres">${esc(r.findings[0].msg)}</div>`;
  const chips = areasFor(src.type).map(a => `<span class="chip ${r.areas[a]}">${r.areas[a] === "ok" ? "✓" : r.areas[a] === "fix" ? "✗" : "•"} ${AREA_NAMES[a]}</span>`).join("");
  const order = r.findings.map((f, i) => ({f, i})).sort((x, y) => (x.f.sev === "fix" ? 0 : 1) - (y.f.sev === "fix" ? 0 : 1));
  const route = src.a ? `a/${src.a.id}` : src.w ? `tw/${S.writes.indexOf(src.w)}` : `t/${src.type}`;
  return `<div id="ckres"><div class="card"><h3>What the checker found</h3>
  <p class="meta">${r.stats.words} words · ${r.stats.paras} paragraph${r.stats.paras === 1 ? "" : "s"} · ${r.stats.sents} sentences (about ${r.stats.avg} words each)${src.type !== "narrative" ? ` · ${r.stats.quotes} quotation${r.stats.quotes === 1 ? "" : "s"} · ${r.stats.cites} citation${r.stats.cites === 1 ? "" : "s"}` : ""}</p>
  <div class="areas">${chips}</div>
  ${r.goods.length ? `<ul class="tight goods">${r.goods.map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
  ${order.length ? `<h4>${r.fixes} to fix · ${r.tips} to consider</h4><div>${order.map(({f, i}) => `<div class="finding" data-act="showf" data-arg="${i}" role="button" tabindex="0"><span class="sev chip ${f.sev}">${f.sev === "fix" ? "Fix" : "Consider"}</span><span><b>${esc(f.msg)}</b><span class="h">${esc(f.hint)}</span></span></div>`).join("")}</div>` : `<p>No problems found by the automatic checks.</p>`}
  <p class="meta">These are automatic checks. They can't judge your ideas. Tap a finding to see where it is in your draft, then use the rubric to score the thinking.</p></div>
  <div class="card"><h3>Your draft, marked</h3><p class="meta"><mark class="f">red</mark> to fix, <mark class="t">amber</mark> to consider.</p><div class="marked">${markedHTML(CK.text, r.findings)}</div></div>
  <div class="row"><a class="btn" href="#/rubric/${route}">Score it with the ${esc(E.name.toLowerCase())} rubric</a><a class="btn ghost" href="#/claude/${route}">Get Claude feedback</a></div></div>`;
}
V.check = (mode, id) => {
  const src = draftSrc(mode, id), E = ESSAY(src.type), text = src.get(), modeArg = src.a ? "a" : src.w ? "tw" : "t", idArg = src.a ? src.a.id : src.w ? S.writes.indexOf(src.w) : src.type;
  const head = src.a ? `<p class="crumb"><a href="#/asg/${src.a.id}/draft">‹ ${esc(src.a.title)}</a></p>` : src.w ? `<p class="crumb"><a href="#/test">‹ Test</a></p>` : "";
  const picker = !src.a && !src.w ? `<label class="tog">Essay type <select data-in="cktype">${ESSAYS.map(e => `<option value="${e.id}"${e.id === src.type ? " selected" : ""}>${esc(e.name)}</option>`).join("")}</select></label>` : `<span class="pill">${esc(E.name)}</span>`;
  return `${head}<h2>Check</h2><p class="lead">Paste a paragraph or a whole essay. The checker marks the things teachers mark (thesis, evidence, commentary, MLA, voice) and shows exactly where. It never rewrites your words.</p>
  <div class="card"><div class="row" style="margin:0">${picker}<span class="sp"></span>${src.a || src.w ? `<b>${esc(src.title)}</b>` : ""}</div>
  <textarea class="draft" data-in="cktext" data-mode="${modeArg}" data-id="${esc(idArg)}" placeholder="Paste or type your draft">${esc(text)}</textarea><div class="wc" id="ckwc">${wcount(text)} words</div>
  <div class="row"><button class="btn" data-act="runcheck" data-arg="${modeArg}|${esc(idArg)}">Check my draft</button><a class="btn ghost" href="#/rubric/${modeArg}/${esc(idArg)}">Rubric</a><a class="btn ghost" href="#/claude/${modeArg}/${esc(idArg)}">Claude feedback</a></div></div>
  ${checkResults(src)}`;
};

// ---------- Rubric self-score
let RB = null;
ACT.rbpick = arg => { const [k, lv] = arg.split(":"); RB.rows[k] = Number(lv); render(); };
ACT.rbsave = () => {
  const src = draftSrc(RB.mode, RB.id), E = ESSAY(src.type);
  if (Object.keys(RB.rows).length < E.rubric.length) { toast("Score every row first"); return; }
  S.rub.push({d: today(), key: src.key, type: src.type, asg: src.a ? src.a.id : null, rows: {...RB.rows}});
  addXP(10); goalTick("draft"); checkBadges(); save(); toast("Rubric score saved"); RB.saved = true; render();
};
V.rubric = (mode, id) => {
  const src = draftSrc(mode, id), E = ESSAY(src.type);
  if (!RB || RB.key !== src.key) { const last = S.rub.filter(r => r.key === src.key).pop(); RB = {key: src.key, mode, id, rows: last ? {...last.rows} : {}, saved: false}; }
  const total = sum(Object.values(RB.rows)), max = 4 * E.rubric.length, hist = S.rub.filter(r => r.key === src.key);
  const back = src.a ? `#/asg/${src.a.id}/draft` : `#/check/${mode}/${id}`;
  return `<p class="crumb"><a href="${back}">‹ Back</a></p><h2>Rubric: ${esc(E.name)}</h2><p class="lead">Read your draft, then tap the description that honestly fits each row. Scoring yourself before the teacher does is how the gap closes.</p>
  <div class="card rubwrap"><table class="rub">${E.rubric.map(r => `<tr><th>${esc(r.row)}</th>${r.lv.map((x, i) => `<td><button class="${RB.rows[r.k] === i + 1 ? "on" : ""}" data-act="rbpick" data-arg="${r.k}:${i + 1}"><b>${i + 1} · ${LEVELS[i]}</b>${esc(x)}</button></td>`).join("")}</tr>`).join("")}</table>
  <p class="big">${total} / ${max}</p><div class="row"><button class="btn" data-act="rbsave">${RB.saved ? "Saved ✓" : "Save score"}</button><a class="btn ghost" href="#/claude/${mode}/${id}">Compare with Claude feedback</a></div></div>
  ${hist.length ? `<div class="card"><h3>Your scores for this draft</h3><table class="tbl"><tr><th>Date</th>${E.rubric.map(r => `<th>${esc(r.row)}</th>`).join("")}<th>Total</th></tr>${hist.map(h => `<tr><td>${nice(h.d)}</td>${E.rubric.map(r => `<td>${h.rows[r.k] || ""}</td>`).join("")}<td>${sum(Object.values(h.rows))}</td></tr>`).join("")}</table></div>` : ""}`;
};

// ---------- Claude feedback hand-off (needs a connection; the app itself stays offline)
function claudePrompt(src) {
  const E = ESSAY(src.type), a = src.a;
  return `I'm a 10th-grade student in Honors English (Honors Literary Analysis & Composition 2). Please give me feedback on my draft.

How to give feedback:
- Score each rubric row from 1 to 4 and explain the score in one or two sentences.
- For each row, point to one phrase that works and name one specific thing to improve.
- Do not rewrite my sentences or write any part of the essay for me. My school requires my writing to be my own, so ask me questions instead of giving me wording.
- End with the two changes that would raise my score the most.

Assignment: ${a ? a.title + " (" + E.name + ")" : E.name}
Prompt: ${a && a.prompt ? a.prompt : src.w ? src.w.prompt : "(not given)"}${a && a.book ? "\nText: Lord of the Flies by William Golding" : ""}

Rubric (1 = Beginning, 4 = Exceeds):
${E.rubric.map((r, i) => `${i + 1}. ${r.row}: 4 = ${r.lv[3]}; 3 = ${r.lv[2]}; 2 = ${r.lv[1]}; 1 = ${r.lv[0]}`).join("\n")}

My draft:
"""
${src.get().trim()}
"""`;
}
function logAI(src, how) { S.ai.push({d: today(), title: src.a ? src.a.title : src.title, type: src.type, words: wcount(src.get()), how}); save(); }
ACT.cshare = async arg => {
  const [mode, id] = arg.split("|"), src = draftSrc(mode, id), text = claudePrompt(src);
  if (wcount(src.get()) < 40) { toast("Write at least a paragraph first"); return; }
  if (navigator.share) { try { await navigator.share({text}); logAI(src, "shared"); toast("Logged in your AI-use log"); render(); } catch (e) {} }
  else { copyText(text, "Copied. Paste it into Claude."); logAI(src, "copied"); render(); }
};
ACT.ccopy = arg => { const [mode, id] = arg.split("|"), src = draftSrc(mode, id); if (wcount(src.get()) < 40) { toast("Write at least a paragraph first"); return; } copyText(claudePrompt(src), "Copied. Paste it into Claude."); logAI(src, "copied"); render(); };
V.claude = (mode, id) => {
  const src = draftSrc(mode, id), n = wcount(src.get()), used = S.ai.filter(x => x.title === (src.a ? src.a.title : src.title)).length;
  const back = src.a ? `#/asg/${src.a.id}/draft` : `#/check/${mode}/${id}`;
  return `<p class="crumb"><a href="${back}">‹ Back</a></p><h2>Get Claude feedback</h2>
  <div class="card note"><b>Feedback only.</b> The message below asks Claude to score your draft against the rubric and ask you questions. It tells Claude not to write or rewrite anything for you. Your teacher's AI rules come first: if AI help must be disclosed, your log below has the dates.</div>
  <div class="card"><p class="meta">${n} words of draft · needs an internet connection · ${used ? `used ${used} time${used === 1 ? "" : "s"} for this draft` : "not used yet for this draft"}</p>
  <div class="row"><button class="btn" data-act="cshare" data-arg="${mode}|${esc(id)}"${n < 40 ? " disabled" : ""}>Share to Claude</button><button class="btn ghost" data-act="ccopy" data-arg="${mode}|${esc(id)}"${n < 40 ? " disabled" : ""}>Copy message</button><a class="btn ghost" href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude</a></div>
  <details><summary>See the message</summary><pre class="email">${esc(claudePrompt(src))}</pre></details></div>
  <p class="meta">On the iPad, Share opens the share sheet: pick the Claude app. Or copy the message, open Claude and paste it.</p>`;
};
