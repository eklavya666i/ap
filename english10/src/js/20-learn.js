// ---------- Learn: units, the Lord of the Flies guide (chapters, characters, symbols, themes, lenses, context), glossary
const unitColor = n => (UNIT(n) || {}).color || "var(--accent)";
const readSelect = () => `<label class="tog"><span>I've read through</span><select data-in="readto" aria-label="Chapters read">${Array.from({length: 13}, (_, i) => `<option value="${i}"${i === readTo() ? " selected" : ""}>${i === 0 ? "not started" : i === 12 ? "chapter 12 (finished)" : "chapter " + i}</option>`).join("")}</select></label>`;
function setRead(n) {
  const old = readTo(); S.read.lotf = n;
  if (n > old) { for (let c = old + 1; c <= n; c++) S.readLog.push({ch: c, d: today()}); addXP(15 * (n - old)); toast(n === 12 ? "You finished Lord of the Flies!" : `Read through chapter ${n}`); }
  checkBadges(); save(); render();
}
IN.readto = el => setRead(Number(el.value));
ACT.readch = a => setRead(Math.max(readTo(), Number(a)));
ACT.peek = a => { S.peek[Number(a)] = 1; save(); render(); };

V.learn = () => {
  const cards = COURSE.units.map(U => {
    const ready = U.u === 4, cur = S.set.unit === U.u;
    return `<a class="card unit${cur ? " hi" : ""}" style="--u:${U.color};display:block;text-decoration:none;color:inherit" href="#/unit/${U.u}">
      <div class="row" style="margin:0"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u}</span>${ready ? `<span class="chip ok">Ready</span>` : `<span class="chip">Coming in phase ${U.phase}</span>`}${cur ? `<span class="chip ac">Current unit</span>` : ""}</div>
      <h3 style="margin-top:8px">${esc(U.title)}</h3><p class="meta"><i>${esc(U.text)}</i>${U.author ? " · " + esc(U.author) : ""}</p><p class="meta">Product: ${esc(U.product)}</p></a>`;
  }).join("");
  return `<h2>Learn</h2><p class="lead">The seven units of ${esc(COURSE.name)}, in the order of the IHS syllabus. Unit 4 is fully built; the writing guides for every unit are ready in Write.</p>
  <div class="grid">${cards}<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/terms"><span class="pill">Glossary</span><h3 style="margin-top:8px">Terms</h3><p class="meta">${TERMS.length} literary, rhetorical and essay terms with examples.</p></a></div>`;
};

V.unit = (n, tab) => {
  n = Number(n) || 4; const U = UNIT(n); if (!U) return V.learn();
  if (n !== 4) return unitSoon(U);
  tab = tab || "chapters";
  const TABS = [["chapters", "Chapters"], ["characters", "Characters"], ["symbols", "Symbols"], ["themes", "Themes"], ["lenses", "Lenses"], ["context", "Context"]];
  const body = {chapters: unitChapters, characters: unitCharacters, symbols: unitSymbols, themes: unitThemes, lenses: unitLenses, context: unitContext}[tab] || unitChapters;
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit 4 · ${esc(U.title)}</span>
  <h2 style="margin-top:8px"><i>${esc(LOTF.title)}</i></h2><p class="meta">${esc(LOTF.author)} · ${LOTF.year} · Product: ${esc(U.product)}</p>
  <div class="row">${readSelect()}</div></div>
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/unit/4/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${body()}`;
};
function bestCheck(ch) { const q = S.quizzes.filter(x => x.kind === "ch" && x.ch === ch); return q.length ? Math.max(...q.map(x => x.right)) : null; }
function unitChapters() {
  return `<ul class="list card">${LOTF.chapters.map(c => {
    const ok = canSee(c.n), b = bestCheck(c.n);
    return `<li class="${ok ? "" : "locked"}"><a class="go" href="#/ch/${c.n}"><span class="n">${c.n}</span><span class="t">${esc(c.title)}<br><span class="s">${c.n <= readTo() ? "Read" : ok ? "Opened early" : "Not read yet: spoilers hidden"}${b != null ? ` · best check ${b}/8` : ""}</span></span></a>${c.n <= readTo() ? `<button class="btn ghost sm" data-act="quiz" data-arg="ch:${c.n}">Check</button>` : ""}</li>`;
  }).join("")}</ul>`;
}
const gate = ch => `<span class="spoiler">Unlocks after chapter ${ch}.</span>`;
function trackList(track) {
  const seen = track.filter(([c]) => canSee(c)), hid = track.length - seen.length;
  return `<ul class="track">${seen.map(([c, t]) => `<li><b>Ch. ${c}</b><span>${esc(t)}</span></li>`).join("")}${hid ? `<li><b></b>${gate(track[seen.length][0])}</li>` : ""}</ul>`;
}
function unitCharacters() {
  return `<div class="grid">${LOTF.characters.map(c => canSee(c.from) ? `<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p>${c.traits.length ? `<div class="tags">${c.traits.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}${c.arc.length ? `<h4>Arc so far</h4>${trackList(c.arc)}` : ""}<h4>Through a lens</h4><p class="meta">${esc(c.lens)}</p></div>`
    : `<div class="card locked"><h3>Another character</h3>${gate(c.from)}</div>`).join("")}</div>`;
}
function unitSymbols() {
  return `<div class="grid">${LOTF.symbols.map(s => canSee(s.from) ? `<div class="card"><h3>${esc(s.name)}</h3><p>${esc(s.means)}</p><h4>Tracker</h4>${trackList(s.track)}</div>`
    : `<div class="card locked"><h3>Another symbol</h3>${gate(s.from)}</div>`).join("")}</div>`;
}
function unitThemes() {
  return `<div class="grid">${LOTF.themes.map(t => `<div class="card"><h3>${esc(t.name)}</h3><p>${esc(t.what)}</p><h4>Where it shows</h4>${trackList(t.track)}</div>`).join("")}</div>`;
}
function unitLenses() {
  return `<p class="lead">A critical lens is a set of questions you bring to a text. Each lens notices different things. Open one to see it applied to <i>Lord of the Flies</i>, then try the lens quiz in Test.</p>
  <div class="grid">${LENSES.map(l => `<a class="card" style="display:block;text-decoration:none;color:inherit;border-left:6px solid ${l.color}" href="#/lens/${l.id}"><h3>${esc(l.name)}${S.seen["lens:" + l.id] ? ` <span class="chip ok">opened</span>` : ""}</h3><p class="meta">${esc(l.q)}</p></a>`).join("")}</div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="lens">Lens quiz</button><a class="btn ghost" href="#/guide/lens">Critical lens essay guide</a></div>`;
}
function unitContext() {
  return `${LOTF.context.map(c => `<div class="card"><h3>${esc(c.h)}</h3><div class="prose">${c.p.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>`).join("")}
  <div class="card"><h3>${esc(BIG_IDEA.h)}</h3><div class="prose">${BIG_IDEA.p.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>
  <div class="card"><h3>Island words</h3><table class="tbl">${LOTF.slang.map(([w, m]) => `<tr><th>${esc(w)}</th><td>${esc(m)}</td></tr>`).join("")}</table></div>`;
}
function unitSoon(U) {
  const E = ESSAY(U.essay), note = CONTENT_NOTES[U.u];
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px"><i>${esc(U.text)}</i></h2><p class="meta">${U.author ? esc(U.author) + " · " : ""}Product: ${esc(U.product)}</p>
  <p class="meta">The full reading guide and reading checks for this unit come in phase ${U.phase}.</p>
  ${S.set.unit === U.u ? `<span class="chip ac">Current unit</span>` : `<div class="row"><button class="btn ghost sm" data-act="setunit" data-arg="${U.u}">Make this my current unit</button></div>`}</div>
  ${note ? `<div class="card note"><b>Content note.</b> ${esc(note)}</div>` : ""}
  <div class="card"><h3>Skills in this unit</h3><ul class="tight">${U.skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Ready now</h3><ul class="tight">${E ? `<li><a href="#/guide/${E.id}">${esc(E.name)} guide</a>: structure, frames, a model, the rubric</li>` : ""}<li><a href="#/drills">Writing drills</a> for this unit's skills</li><li><a href="#/terms">Glossary</a> terms for the unit</li><li><a href="#/asg/new">Add your assignment</a> and plan it day by day</li></ul></div>`;
}
ACT.setunit = a => { S.set.unit = Number(a); save(); toast(`Unit ${a} is now your current unit`); render(); };

V.ch = n => {
  n = Math.max(1, Math.min(12, Number(n) || 1)); const c = CH(n);
  const nav = `<div class="row">${n > 1 ? `<a class="btn ghost sm" href="#/ch/${n - 1}">‹ Chapter ${n - 1}</a>` : ""}<span class="sp"></span>${n < 12 ? `<a class="btn ghost sm" href="#/ch/${n + 1}">Chapter ${n + 1} ›</a>` : ""}</div>`;
  if (!canSee(n)) return `<p class="crumb"><a href="#/unit/4">‹ Lord of the Flies</a></p><div class="card"><h2>Chapter ${n}: ${esc(c.title)}</h2>
    <p>You've marked ${readTo() ? `chapter ${readTo()}` : "no chapters"} as read, so this guide is hidden to keep the story unspoiled.</p>
    <p class="meta">Read with page flags in three colors: character moments, symbols, and questions. Then come back for the guide and the reading check.</p>
    <div class="row"><button class="btn" data-act="readch" data-arg="${n}">I've read chapter ${n}</button><button class="btn ghost" data-act="peek" data-arg="${n}">Show it anyway</button></div></div>${nav}`;
  if (!S.seen["ch:" + n]) { S.seen["ch:" + n] = today(); addXP(5); }
  goalTick("guide");
  const L = LENS(c.lens.id);
  return `<p class="crumb"><a href="#/unit/4">‹ Lord of the Flies</a></p>
  <div class="card"><span class="pill">Chapter ${n}</span><h2 style="margin-top:8px">${esc(c.title)}</h2>${n > readTo() ? `<div class="row"><button class="btn sm" data-act="readch" data-arg="${n}">Mark chapter ${n} read</button></div>` : ""}
  <h4>Summary</h4><div class="prose">${c.sum.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>
  <div class="cols"><div class="card"><h3>Key events</h3><ul class="tight">${c.events.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Watch for</h3><ul class="tight">${c.watch.map(e => `<li>${esc(e)}</li>`).join("")}</ul>
  <div class="lensm" style="--l:${L.color}"><b><a href="#/lens/${L.id}">${esc(L.name)} lens</a>.</b> ${esc(c.lens.text)}</div></div></div>
  <div class="card"><h3>Quote hunt</h3><p class="meta">Find these in your copy, then log the quotation with its page number.</p>
  <ul class="list">${c.hunt.map((h, i) => `<li><span class="t">${esc(h)}</span><button class="btn ghost sm" data-act="huntq" data-arg="${n}:${i}">Log it</button></li>`).join("")}</ul></div>
  <div class="card"><h3>Seminar questions</h3><ul class="list">${c.seminar.map((q, i) => `<li><span class="n">L${i + 1}</span><span class="t">${esc(q)}</span></li>`).join("")}</ul></div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="ch:${n}">Reading check (8 questions)</button><a class="btn ghost" href="#/seminar">Seminar prep</a></div>${nav}`;
};

V.lens = id => {
  const l = LENS(id); if (!l) return V.unit(4, "lenses");
  if (!S.seen["lens:" + id]) { S.seen["lens:" + id] = today(); addXP(5); checkBadges(); }
  const rd = l.lotf.map(([ch, t], i) => canSee(ch) ? `<li>${esc(t)}</li>` : `<li>${gate(ch)} <button class="btn ghost sm" data-act="peek" data-arg="${ch}">Show</button></li>`).join("");
  return `<p class="crumb"><a href="#/unit/4/lenses">‹ Lenses</a></p>
  <div class="card" style="border-left:6px solid ${l.color}"><span class="pill">Critical lens</span><h2 style="margin-top:8px">${esc(l.name)}${l.alt ? ` <span class="quiet" style="font-weight:600;font-size:18px">(${esc(l.alt)})</span>` : ""}</h2>
  <p class="prose"><b>The core question:</b> ${esc(l.q)}</p></div>
  <div class="cols"><div class="card"><h3>Big ideas</h3><ul class="tight">${l.ideas.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Vocabulary</h3><div class="tags">${l.terms.map(t => `<span class="chip ac">${esc(t)}</span>`).join("")}</div><h4>Look for</h4><ul class="tight">${l.look.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
  <div class="card"><h3>Applied to <i>Lord of the Flies</i></h3><ul class="tight">${rd}</ul></div>
  <div class="cols"><div class="card"><h3>Thesis frame</h3><p class="model">${esc(l.frame)}</p></div><div class="card note"><h3>Trap to avoid</h3><p>${esc(l.trap)}</p></div></div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="lens">Lens quiz</button><a class="btn ghost" href="#/guide/lens">Critical lens essay guide</a></div>`;
};

let TGROUP = "";
ACT.tgroup = a => { TGROUP = TGROUP === a ? "" : a; render(); };
IN.tsearch = el => { const q = el.value.trim().toLowerCase(); $$("li.term").forEach(li => { li.hidden = !!q && !li.dataset.k.includes(q); }); };
V.terms = () => {
  const list = TERMS.filter(t => !TGROUP || t.g === TGROUP);
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p><h2>Glossary</h2>
  <div class="row"><input type="search" placeholder="Search terms" data-in="tsearch" aria-label="Search terms" style="flex:1;min-width:200px"></div>
  <div class="tags" style="margin:10px 0">${Object.entries(TERM_GROUPS).map(([k, v]) => `<button class="tagb${TGROUP === k ? " on" : ""}" data-act="tgroup" data-arg="${k}">${esc(v)}</button>`).join("")}</div>
  <ul class="list card">${list.map(t => `<li class="term" data-k="${esc((t.t + " " + t.d).toLowerCase())}"><b>${esc(t.t)}</b> <span class="chip">${esc(TERM_GROUPS[t.g])}</span><br>${esc(t.d)}<br><span class="quiet">${esc(t.ex)}</span></li>`).join("")}</ul>
  <div class="row"><button class="btn" data-act="quiz" data-arg="terms">Terms quiz</button><a class="btn ghost" href="#/review">Review cards</a></div>`;
};
