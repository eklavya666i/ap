// ---------- Learn: units; book guides (Lord of the Flies, A Small Place) with sections, people, symbols, themes, lenses or rhetoric, context;
// the argument workshop (lessons, fallacies, sources, debate); the glossary
const unitColor = n => (UNIT(n) || {}).color || "var(--accent)";
const readSelect = (b = "lotf") => { const B = BOOKS[b], w = W(b).ch.toLowerCase(), n = B.chapters_n; return `<label class="tog"><span>I've read through</span><select data-in="readto" data-b="${b}" aria-label="${esc(B.title)}: how far I've read">${Array.from({length: n + 1}, (_, i) => `<option value="${i}"${i === readTo(b) ? " selected" : ""}>${i === 0 ? "not started" : i === n ? `${w} ${n} (finished)` : `${w} ${i}`}</option>`).join("")}</select></label>`; };
function setRead(n, b = "lotf") {
  const B = BOOKS[b], old = readTo(b); S.read[b] = n;
  if (n > old) { for (let c = old + 1; c <= n; c++) S.readLog.push({book: b, ch: c, d: today()}); addXP(15 * (n - old)); toast(n === B.chapters_n ? `You finished ${B.title}!` : `Read through ${W(b).ch.toLowerCase()} ${n}`); }
  checkBadges(); save(); render();
}
IN.readto = el => setRead(Number(el.value), el.dataset.b || "lotf");
ACT.readch = a => { const [b, n] = a.includes(":") ? a.split(":") : ["lotf", a]; setRead(Math.max(readTo(b), Number(n)), b); };
ACT.peek = a => { const [b, n] = a.includes(":") ? a.split(":") : ["lotf", a]; S.peek[b + ":" + n] = 1; save(); render(); };
const chHref = (b, n) => b === "lotf" ? `#/ch/${n}` : `#/ch/${b}/${n}`;

V.learn = () => {
  const cards = COURSE.units.map(U => {
    const cur = S.set.unit === U.u;
    return `<a class="card unit${cur ? " hi" : ""}" style="--u:${U.color};display:block;text-decoration:none;color:inherit" href="#/unit/${U.u}">
      <div class="row" style="margin:0"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u}</span>${U.ready ? `<span class="chip ok">Ready</span>` : `<span class="chip">Coming in phase ${U.phase}</span>`}${cur ? `<span class="chip ac">Current unit</span>` : ""}</div>
      <h3 style="margin-top:8px">${esc(U.title)}</h3><p class="meta"><i>${esc(U.text)}</i>${U.author ? " · " + esc(U.author) : ""}</p><p class="meta">Product: ${esc(U.product)}</p></a>`;
  }).join("");
  return `<h2>Learn</h2><p class="lead">The seven units of ${esc(COURSE.name)}, in the order of the IHS syllabus. Units 2, 3 and 4 are fully built; the writing guides for every unit are ready in Write.</p>
  <div class="grid">${cards}<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/terms"><span class="pill">Glossary</span><h3 style="margin-top:8px">Terms</h3><p class="meta">${TERMS.length} literary, rhetorical and essay terms with examples.</p></a></div>`;
};

V.unit = (n, tab) => {
  n = Number(n) || 4; const U = UNIT(n); if (!U) return V.learn();
  if (U.book) return bookUnit(U, BOOKS[U.book], tab);
  if (U.workshop) return argUnit(U, tab);
  return unitSoon(U);
};
function bookUnit(U, B, tab) {
  const b = B.id, w = W(b);
  const TABS = [["chapters", w.chs], ["characters", w.people], ["symbols", w.symbols], ["themes", "Themes"], b === "lotf" ? ["lenses", "Lenses"] : ["rhetoric", "Rhetoric"], ["context", "Context"]];
  tab = TABS.some(t => t[0] === tab) ? tab : "chapters";
  const body = {chapters: unitChapters, characters: unitCharacters, symbols: unitSymbols, themes: unitThemes, lenses: unitLenses, rhetoric: unitRhetoric, context: unitContext}[tab];
  const note = CONTENT_NOTES[U.u];
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px"><i>${esc(B.title)}</i></h2><p class="meta">${esc(B.author)} · ${B.year} · Product: ${esc(U.product)}</p>
  <div class="row">${readSelect(b)}${S.set.unit === U.u ? "" : `<button class="btn ghost sm" data-act="setunit" data-arg="${U.u}">Make this my current unit</button>`}</div></div>
  ${note ? `<div class="card note"><b>Content note.</b> ${esc(note)}</div>` : ""}
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/unit/${U.u}/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${body(B)}`;
}
function bestCheck(ch, b = "lotf") { const q = S.quizzes.filter(x => x.kind === "ch" && (x.book || "lotf") === b && x.ch === ch); return q.length ? Math.max(...q.map(x => x.right)) : null; }
function unitChapters(B) {
  const b = B.id, w = W(b).ch.toLowerCase();
  return `<ul class="list card">${B.chapters.map(c => {
    const ok = canSee(c.n, b), best = bestCheck(c.n, b);
    return `<li class="${ok ? "" : "locked"}"><a class="go" href="${chHref(b, c.n)}"><span class="n">${c.n}</span><span class="t">${esc(c.title)}<br><span class="s">${c.n <= readTo(b) ? "Read" : ok ? "Opened early" : "Not read yet: spoilers hidden"}${best != null ? ` · best check ${best}/8` : ""}</span></span></a>${c.n <= readTo(b) ? `<button class="btn ghost sm" data-act="quiz" data-arg="ch:${b}:${c.n}">Check</button>` : ""}</li>`;
  }).join("")}</ul><div class="row"><button class="btn ghost sm" data-act="quiz" data-arg="mix:${b}"${readTo(b) ? "" : " disabled"}>Mixed review</button><button class="btn ghost sm" data-act="quiz" data-arg="who:${b}"${readTo(b) ? "" : " disabled"}>Who and what</button><button class="btn ghost sm" data-act="quiz" data-arg="unit:${B.unit}">Unit ${B.unit} test</button></div>`;
}
const gate = (ch, b = "lotf") => `<span class="spoiler">Unlocks after ${W(b).ch.toLowerCase()} ${ch}.</span>`;
function trackList(track, b = "lotf") {
  const seen = track.filter(([c]) => canSee(c, b)), hid = track.length - seen.length, w = b === "lotf" ? "Ch." : "Sec.";
  return `<ul class="track">${seen.map(([c, t]) => `<li><b>${w} ${c}</b><span>${esc(t)}</span></li>`).join("")}${hid ? `<li><b></b>${gate(track[seen.length][0], b)}</li>` : ""}</ul>`;
}
function unitCharacters(B) {
  const b = B.id, one = b === "lotf" ? "Another character" : "Another voice";
  return `<div class="grid">${B.characters.map(c => canSee(c.from, b) ? `<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p>${c.traits.length ? `<div class="tags">${c.traits.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}${c.arc.length ? `<h4>${b === "lotf" ? "Arc so far" : "Where it appears"}</h4>${trackList(c.arc, b)}` : ""}<h4>${b === "lotf" ? "Through a lens" : "Rhetorical angle"}</h4><p class="meta">${esc(c.lens)}</p></div>`
    : `<div class="card locked"><h3>${one}</h3>${gate(c.from, b)}</div>`).join("")}</div>`;
}
function unitSymbols(B) {
  const b = B.id, one = b === "lotf" ? "Another symbol" : "Another motif";
  return `<div class="grid">${B.symbols.map(s => canSee(s.from, b) ? `<div class="card"><h3>${esc(s.name)}</h3><p>${esc(s.means)}</p><h4>Tracker</h4>${trackList(s.track, b)}</div>`
    : `<div class="card locked"><h3>${one}</h3>${gate(s.from, b)}</div>`).join("")}</div>`;
}
function unitThemes(B) { return `<div class="grid">${B.themes.map(t => `<div class="card"><h3>${esc(t.name)}</h3><p>${esc(t.what)}</p><h4>Where it shows</h4>${trackList(t.track, B.id)}</div>`).join("")}</div>`; }
function unitLenses() {
  return `<p class="lead">A critical lens is a set of questions you bring to a text. Each lens notices different things. Open one to see it applied to <i>Lord of the Flies</i>, then try the lens quiz in Test.</p>
  <div class="grid">${LENSES.map(l => `<a class="card" style="display:block;text-decoration:none;color:inherit;border-left:6px solid ${l.color}" href="#/lens/${l.id}"><h3>${esc(l.name)}${S.seen["lens:" + l.id] ? ` <span class="chip ok">opened</span>` : ""}</h3><p class="meta">${esc(l.q)}</p></a>`).join("")}</div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="lens">Lens quiz</button><a class="btn ghost" href="#/guide/lens">Critical lens essay guide</a></div>`;
}
const SOAP_FIELDS = [["sp", "Speaker", "Who is speaking, and what do we know about them that matters?"], ["oc", "Occasion", "The time, place and event that prompted the text (its exigence)."], ["au", "Audience", "Who the text is written for; there may be more than one."], ["pu", "Purpose", "What the writer wants the audience to think, feel or do."], ["su", "Subject", "The topic, in a phrase."], ["to", "Tone", "The writer's attitude, in precise words: bitter, mocking, reverent..."]];
const ASP_SOAP = {sp: "Jamaica Kincaid, born in colonial Antigua, who left as a teenager and writes as a native daughter with open anger.", oc: "Antigua in the 1980s: newly independent, living on tourism, with a government she sees as corrupt.", au: "Mainly white North American and European readers, the people most likely to visit Antigua as tourists.", pu: "To make readers see the history, poverty and corruption behind the vacation, and their own part in it.", su: "Tourism, colonialism and corruption in Antigua.", to: "Sarcastic and accusatory, bitter about the English, tender and lyrical by the end."};
function unitRhetoric(B) {
  return `<div class="card"><h3>SOAPSTone for <i>${esc(B.title)}</i></h3><p class="meta">A model analysis. Try your own first in the SOAPSTone tool, then compare.</p>
  <table class="tbl">${SOAP_FIELDS.map(([k, t]) => `<tr><th>${t}</th><td>${esc(ASP_SOAP[k])}</td></tr>`).join("")}</table>
  <div class="row"><a class="btn ghost sm" href="#/soap">SOAPSTone tool</a><a class="btn ghost sm" href="#/guide/rhetorical">Rhetorical analysis guide</a></div></div>
  <div class="card"><h3>Kincaid's moves, section by section</h3><ul class="list">${B.chapters.map(c => canSee(c.n, B.id) ? `<li style="display:block"><b>${W(B.id).ch} ${c.n}: ${esc(c.move.name)}.</b> ${esc(c.move.text)}</li>` : `<li>${gate(c.n, B.id)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Devices to name</h3><div class="tags">${["Second-person address", "Sarcasm", "Rhetorical question", "Juxtaposition", "Hyperbole", "Tone", "Pathos", "Ethos", "Diction", "Connotation"].map(t => `<span class="chip ac">${esc(t)}</span>`).join("")}</div><p class="meta">Definitions and examples are in the <a href="#/terms">glossary</a>.</p></div>`;
}
function unitContext(B) {
  return `${B.context.map(c => `<div class="card"><h3>${esc(c.h)}</h3><div class="prose">${c.p.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>`).join("")}
  ${B.id === "lotf" ? `<div class="card"><h3>${esc(BIG_IDEA.h)}</h3><div class="prose">${BIG_IDEA.p.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>` : ""}
  <div class="card"><h3>${B.id === "lotf" ? "Island words" : "Key words"}</h3><table class="tbl">${B.slang.map(([w, m]) => `<tr><th>${esc(w)}</th><td>${esc(m)}</td></tr>`).join("")}</table></div>`;
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

// ---------- The argument workshop (Unit 3)
function argUnit(U, tab) {
  const TABS = [["lessons", "Lessons"], ["fallacies", "Fallacies"], ["sources", "Sources"], ["debate", "Debate"]];
  tab = TABS.some(t => t[0] === tab) ? tab : "lessons";
  const seen = ARG.lessons.filter(l => S.seen["lesson:" + l.id]).length;
  const body = {
    lessons: () => `<ul class="list card">${ARG.lessons.map((l, i) => `<li><a class="go" href="#/lesson/${l.id}"><span class="n">${i + 1}</span><span class="t">${esc(l.title)}<br><span class="s">${S.seen["lesson:" + l.id] ? "Opened ✓" : esc(l.why.split(".")[0] + ".")}</span></span></a></li>`).join("")}</ul>
      <div class="row"><button class="btn" data-act="quiz" data-arg="arg">Argument quiz</button><button class="btn ghost" data-act="quiz" data-arg="unit:3">Unit 3 test</button><a class="btn ghost" href="#/guide/argument">Argument essay guide</a></div>`,
    fallacies: () => `<p class="lead">Fourteen errors in reasoning. Learn to spot them in others' arguments and keep them out of yours.</p>
      <div class="grid">${ARG.fallacies.map(f => `<div class="card"><h3>${esc(f.name)}</h3><p>${esc(f.d)}</p><p class="model">${esc(f.ex)}</p><p class="meta"><b>Fix:</b> ${esc(f.fix)}</p></div>`).join("")}</div>
      <div class="row"><button class="btn" data-act="quiz" data-arg="fallacies">Fallacy finder</button><a class="btn ghost" href="#/review">Review cards</a></div>`,
    sources: () => `<p class="lead">Short public-domain passages to analyze, and two practice sources made up for judging credibility.</p>${ARG.sources.map(x => `<div class="card"><span class="pill">${esc(x.kind)}</span><h3 style="margin-top:8px">${esc(x.title)}</h3><p class="meta">${esc(x.author)}${x.year ? ", " + x.year : ""}</p><p class="model">${esc(x.text)}</p><p class="meta">${esc(x.note)}</p>
      <div class="row"><button class="btn ghost sm" data-act="quiz" data-arg="arg:${x.id}">Practice questions</button>${x.year ? `<a class="btn ghost sm" href="#/soap/new/${x.id}">SOAPSTone it</a>` : ""}</div></div>`).join("")}`,
    debate: () => `<div class="card"><h3>Format</h3><table class="tbl">${ARG.debate.format.map(([a, t, d]) => `<tr><th>${esc(a)}</th><td>${esc(t)}</td><td>${esc(d)}</td></tr>`).join("")}</table></div>
      <div class="card"><h3>Practice motions</h3><ul class="list">${ARG.debate.motions.map((m, i) => `<li><span class="t">${esc(m)}</span><a class="btn ghost sm" href="#/debate/new/${i}">Prep it</a></li>`).join("")}</ul></div>
      <div class="row"><a class="btn" href="#/debate">Debate prep</a><a class="btn ghost" href="#/lesson/debate">Debate lesson</a></div>`
  }[tab];
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit 3 · ${esc(U.title)}</span>
  <h2 style="margin-top:8px">Argument workshop</h2><p class="meta">${seen} of ${ARG.lessons.length} lessons opened · Product: ${esc(U.product)}</p>
  ${S.set.unit === U.u ? "" : `<div class="row"><button class="btn ghost sm" data-act="setunit" data-arg="3">Make this my current unit</button></div>`}</div>
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/unit/3/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${body()}`;
}
V.lesson = id => {
  const L = ARG.lessons.find(x => x.id === id); if (!L) return V.unit(3);
  if (!S.seen["lesson:" + id]) { S.seen["lesson:" + id] = today(); addXP(5); checkBadges(); }
  goalTick("guide");
  const i = ARG.lessons.indexOf(L), next = ARG.lessons[i + 1], qs = AQ.filter(q => q.src === id).length;
  return `<p class="crumb"><a href="#/unit/3">‹ Argument workshop</a></p>
  <div class="card"><span class="pill">Lesson ${i + 1} of ${ARG.lessons.length}</span><h2 style="margin-top:8px">${esc(L.title)}</h2><p class="prose">${esc(L.why)}</p></div>
  <div class="card"><h3>Key points</h3><ul class="tight">${L.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Example</h3>${L.example.map(e => `<p class="model">${esc(e)}</p>`).join("")}</div>
  ${id === "fallacies" ? `<div class="row"><a class="btn ghost" href="#/unit/3/fallacies">Fallacy gallery</a></div>` : ""}
  <div class="row">${qs ? `<button class="btn" data-act="quiz" data-arg="arg:${id}">${qs} practice questions</button>` : `<button class="btn" data-act="quiz" data-arg="fallacies">Fallacy finder</button>`}${next ? `<a class="btn ghost" href="#/lesson/${next.id}">Next: ${esc(next.title)} ›</a>` : `<a class="btn ghost" href="#/debate">Debate prep ›</a>`}</div>`;
};

V.ch = (a, b2) => {
  const b = BOOKS[a] ? a : "lotf", B = BOOKS[b], N = B.chapters_n, w = W(b).ch;
  const n = Math.max(1, Math.min(N, Number(BOOKS[a] ? b2 : a) || 1)), c = CH(n, b), back = `<p class="crumb"><a href="#/unit/${B.unit}">‹ ${esc(B.title)}</a></p>`;
  const nav = `<div class="row">${n > 1 ? `<a class="btn ghost sm" href="${chHref(b, n - 1)}">‹ ${w} ${n - 1}</a>` : ""}<span class="sp"></span>${n < N ? `<a class="btn ghost sm" href="${chHref(b, n + 1)}">${w} ${n + 1} ›</a>` : ""}</div>`;
  if (!canSee(n, b)) return `${back}<div class="card"><h2>${w} ${n}: ${esc(c.title)}</h2>
    <p>You've marked ${readTo(b) ? `${w.toLowerCase()} ${readTo(b)}` : `no ${W(b).chs.toLowerCase()}`} as read, so this guide is hidden to keep it unspoiled.</p>
    <p class="meta">Read with page flags in three colors: ${b === "lotf" ? "character moments, symbols" : "moves that persuade, moments that anger you"}, and questions. Then come back for the guide and the reading check.</p>
    <div class="row"><button class="btn" data-act="readch" data-arg="${b}:${n}">I've read ${w.toLowerCase()} ${n}</button><button class="btn ghost" data-act="peek" data-arg="${b}:${n}">Show it anyway</button></div></div>${nav}`;
  const key = b === "lotf" ? "ch:" + n : `ch:${b}:${n}`;
  if (!S.seen[key]) { S.seen[key] = today(); addXP(5); }
  goalTick("guide");
  const L = c.lens ? LENS(c.lens.id) : null;
  const moment = L ? `<div class="lensm" style="--l:${L.color}"><b><a href="#/lens/${L.id}">${esc(L.name)} lens</a>.</b> ${esc(c.lens.text)}</div>`
    : `<div class="lensm"><b>Rhetorical move: ${esc(c.move.name)}.</b> ${esc(c.move.text)}</div>`;
  return `${back}
  <div class="card"><span class="pill">${w} ${n}</span><h2 style="margin-top:8px">${esc(c.title)}</h2>${n > readTo(b) ? `<div class="row"><button class="btn sm" data-act="readch" data-arg="${b}:${n}">Mark ${w.toLowerCase()} ${n} read</button></div>` : ""}
  <h4>Summary</h4><div class="prose">${c.sum.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>
  <div class="cols"><div class="card"><h3>Key ${b === "lotf" ? "events" : "points"}</h3><ul class="tight">${c.events.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Watch for</h3><ul class="tight">${c.watch.map(e => `<li>${esc(e)}</li>`).join("")}</ul>${moment}</div></div>
  <div class="card"><h3>Quote hunt</h3><p class="meta">Find these in your copy, then log the quotation with its page number.</p>
  <ul class="list">${c.hunt.map((h, i) => `<li><span class="t">${esc(h)}</span><button class="btn ghost sm" data-act="huntq" data-arg="${b}:${n}:${i}">Log it</button></li>`).join("")}</ul></div>
  <div class="card"><h3>Seminar questions</h3><ul class="list">${c.seminar.map((q, i) => `<li><span class="n">L${i + 1}</span><span class="t">${esc(q)}</span></li>`).join("")}</ul></div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="ch:${b}:${n}">Reading check (8 questions)</button><a class="btn ghost" href="#/seminar">Seminar prep</a></div>${nav}`;
};

V.lens = id => {
  const l = LENS(id); if (!l) return V.unit(4, "lenses");
  if (!S.seen["lens:" + id]) { S.seen["lens:" + id] = today(); addXP(5); checkBadges(); }
  const rd = l.lotf.map(([ch, t]) => canSee(ch) ? `<li>${esc(t)}</li>` : `<li>${gate(ch)} <button class="btn ghost sm" data-act="peek" data-arg="lotf:${ch}">Show</button></li>`).join("");
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
