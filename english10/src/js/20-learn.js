// ---------- Learn: the ten units by semester; book guides (Fahrenheit 451, A Small Place) with sections, people, symbols,
// themes, craft or rhetoric, and context; the argument workshop (lessons, fallacies, sources, debate); the glossary
const unitColor = n => (UNIT(n) || {}).color || "var(--accent)";
const readSelect = (b = BOOK0) => { const B = BOOKS[b], w = W(b).ch.toLowerCase(), n = B.chapters_n; return `<label class="tog"><span>I've read through</span><select data-in="readto" data-b="${b}" aria-label="${esc(B.title)}: how far I've read">${Array.from({length: n + 1}, (_, i) => `<option value="${i}"${i === readTo(b) ? " selected" : ""}>${i === 0 ? "not started" : i === n ? `${w} ${n} (finished)` : `${w} ${i}`}</option>`).join("")}</select></label>`; };
function setRead(n, b = BOOK0) {
  const B = BOOKS[b], old = readTo(b); S.read[b] = n;
  if (n > old) { for (let c = old + 1; c <= n; c++) S.readLog.push({book: b, ch: c, d: today()}); addXP(15 * (n - old)); toast(n === B.chapters_n ? `You finished ${B.title}!` : `Read through ${W(b).ch.toLowerCase()} ${n}`); }
  checkBadges(); save(); render();
}
const bookArg = a => { const [b, n] = String(a).includes(":") ? String(a).split(":") : [BOOK0, a]; return [bookOf(b), Number(n)]; };
IN.readto = el => setRead(Number(el.value), bookOf(el.dataset.b));
ACT.readch = a => { const [b, n] = bookArg(a); setRead(Math.max(readTo(b), n), b); };
ACT.peek = a => { const [b, n] = bookArg(a); S.peek[b + ":" + n] = 1; save(); render(); };
const chHref = (b, n) => `#/ch/${b}/${n}`;
const partName = (B, c) => c.part && B.parts ? `Part ${["One", "Two", "Three"][c.part - 1]}: ${B.parts[c.part - 1]}` : "";

V.learn = () => {
  const card = U => {
    const cur = S.set.unit === U.u, sub = U.text === U.title ? esc(U.author) : `<i>${esc(U.text)}</i>${U.author ? " · " + esc(U.author) : ""}`;
    return `<a class="card unit${cur ? " hi" : ""}" style="--u:${U.color};display:block;text-decoration:none;color:inherit" href="#/unit/${U.u}">
      <div class="row" style="margin:0"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u}</span>${U.ready ? `<span class="chip ok">${U.writing ? "Writing unit" : "Ready"}</span>` : `<span class="chip">Guide coming</span>`}${cur ? `<span class="chip ac">Current unit</span>` : ""}</div>
      <h3 style="margin-top:8px">${esc(U.title)}</h3><p class="meta">${sub}</p>${U.product ? `<p class="meta">Product: ${esc(U.product)}</p>` : ""}</a>`;
  };
  const sem = n => `<h3>Semester ${n}</h3><div class="grid">${COURSE.units.filter(U => U.sem === n).map(card).join("")}</div>`;
  const ready = COURSE.units.filter(U => U.ready).map(U => U.u);
  return `<h2>Learn</h2><p class="lead">The ten units of ${esc(COURSE.name)} in your syllabus order, five each semester, with ${esc(COURSE.seminars)}. Units ${ready.slice(0, -1).join(", ")} and ${ready[ready.length - 1]} are ready; the writing guides for every unit are in Write.</p>
  ${sem(1)}${sem(2)}
  <div class="grid"><a class="card" style="display:block;text-decoration:none;color:inherit" href="#/terms"><span class="pill">Glossary</span><h3 style="margin-top:8px">Terms</h3><p class="meta">${TERMS.length} literary, rhetorical and essay terms with examples.</p></a>
  <details class="card"><summary><b>Course goals</b> · ${COURSE.objectives.length} from your syllabus</summary><ul class="tight">${COURSE.objectives.map(o => `<li>${esc(o)}</li>`).join("")}</ul></details></div>`;
};

V.unit = (n, tab) => {
  n = Number(n) || S.set.unit; const U = UNIT(n); if (!U) return V.learn();
  if (U.book) return bookUnit(U, BOOKS[U.book], tab);
  if (U.workshop) return argUnit(U, tab);
  return unitSoon(U);
};
const curUnitBtn = U => S.set.unit === U.u ? `<span class="chip ac">Current unit</span>` : `<button class="btn ghost sm" data-act="setunit" data-arg="${U.u}">Make this my current unit</button>`;
function bookUnit(U, B, tab) {
  const b = B.id, w = W(b);
  const TABS = [["chapters", w.chs], ["characters", w.people], ["symbols", w.symbols], ["themes", "Themes"], w.tab, ["context", "Context"]];
  tab = TABS.some(t => t[0] === tab) ? tab : "chapters";
  const body = {chapters: unitChapters, characters: unitCharacters, symbols: unitSymbols, themes: unitThemes, craft: unitCraft, rhetoric: unitRhetoric, context: unitContext}[tab];
  const note = CONTENT_NOTES[U.u];
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px"><i>${esc(B.title)}</i></h2><p class="meta">${esc(B.author)} · ${B.year}${U.product ? ` · Product: ${esc(U.product)}` : ""}</p>
  <div class="row">${readSelect(b)}${S.set.unit === U.u ? "" : curUnitBtn(U)}</div></div>
  ${note ? `<div class="card note"><b>Content note.</b> ${esc(note)}</div>` : ""}
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/unit/${U.u}/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${body(B)}`;
}
function bestCheck(ch, b = BOOK0) { const q = S.quizzes.filter(x => x.kind === "ch" && x.book === b && x.ch === ch); return q.length ? Math.max(...q.map(x => x.right)) : null; }
function unitChapters(B) {
  const b = B.id;
  return `<ul class="list card">${B.chapters.map(c => {
    const ok = canSee(c.n, b), best = bestCheck(c.n, b), part = partName(B, c);
    return `<li class="${ok ? "" : "locked"}"><a class="go" href="${chHref(b, c.n)}"><span class="n">${c.n}</span><span class="t">${esc(c.title)}<br><span class="s">${part ? esc(part.split(":")[0]) + " · " : ""}${c.n <= readTo(b) ? "Read" : ok ? "Opened early" : "Not read yet: spoilers hidden"}${best != null ? ` · best check ${best}/8` : ""}</span></span></a>${c.n <= readTo(b) ? `<button class="btn ghost sm" data-act="quiz" data-arg="ch:${b}:${c.n}">Check</button>` : ""}</li>`;
  }).join("")}</ul><div class="row"><button class="btn ghost sm" data-act="quiz" data-arg="mix:${b}"${readTo(b) ? "" : " disabled"}>Mixed review</button><button class="btn ghost sm" data-act="quiz" data-arg="who:${b}"${readTo(b) ? "" : " disabled"}>Who and what</button><button class="btn ghost sm" data-act="quiz" data-arg="unit:${B.unit}">Unit ${B.unit} test</button></div>`;
}
const gate = (ch, b = BOOK0) => `<span class="spoiler">Unlocks after ${W(b).ch.toLowerCase()} ${ch}.</span>`;
function trackList(track, b = BOOK0) {
  const seen = track.filter(([c]) => canSee(c, b)), hid = track.length - seen.length, w = W(b).short;
  return `<ul class="track">${seen.map(([c, t]) => `<li><b>${w} ${c}</b><span>${esc(t)}</span></li>`).join("")}${hid ? `<li><b></b>${gate(track[seen.length][0], b)}</li>` : ""}</ul>`;
}
function unitCharacters(B) {
  const b = B.id, w = W(b);
  return `<div class="grid">${B.characters.map(c => canSee(c.from, b) ? `<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p>${c.traits.length ? `<div class="tags">${c.traits.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}${c.arc.length ? `<h4>${w.arc}</h4>${trackList(c.arc, b)}` : ""}<h4>${w.angle}</h4><p class="meta">${esc(c.angle)}</p></div>`
    : `<div class="card locked"><h3>Another ${w.person.toLowerCase()}</h3>${gate(c.from, b)}</div>`).join("")}</div>`;
}
function unitSymbols(B) {
  const b = B.id, w = W(b);
  return `<div class="grid">${B.symbols.map(s => canSee(s.from, b) ? `<div class="card"><h3>${esc(s.name)}</h3><p>${esc(s.means)}</p><h4>Tracker</h4>${trackList(s.track, b)}</div>`
    : `<div class="card locked"><h3>Another ${w.sym.toLowerCase()}</h3>${gate(s.from, b)}</div>`).join("")}</div>`;
}
function unitThemes(B) { return `<div class="grid">${B.themes.map(t => `<div class="card"><h3>${esc(t.name)}</h3><p>${esc(t.what)}</p><h4>Where it shows</h4>${trackList(t.track, B.id)}</div>`).join("")}</div>`; }
const focusOf = c => c.craft || c.move;
function focusList(B) {
  const w = W(B.id);
  return `<ul class="list">${B.chapters.map(c => canSee(c.n, B.id) ? `<li style="display:block"><b>${w.ch} ${c.n}: ${esc(focusOf(c).name)}.</b> ${esc(focusOf(c).text)}</li>` : `<li>${gate(c.n, B.id)}</li>`).join("")}</ul>`;
}
const deviceChips = B => `<div class="card"><h3>Devices to name</h3><div class="tags">${(B.devices || []).map(t => `<span class="chip ac">${esc(t)}</span>`).join("")}</div><p class="meta">Definitions and examples are in the <a href="#/terms">glossary</a>.</p></div>`;
function unitCraft(B) {
  return `<p class="lead">Analysis is about choices: what ${esc(B.author.split(" ").pop())} does on purpose, and what it does to a reader. Each section's guide names one craft move to watch. Each one could become a body paragraph.</p>
  <div class="card"><h3>Craft focus, section by section</h3>${focusList(B)}
  <div class="row"><a class="btn ghost sm" href="#/guide/lit">Literary analysis guide</a><a class="btn ghost sm" href="#/drill/w-symbol">Symbol drill</a></div></div>${deviceChips(B)}`;
}
const SOAP_FIELDS = [["sp", "Speaker", "Who is speaking, and what do we know about them that matters?"], ["oc", "Occasion", "The time, place and event that prompted the text (its exigence)."], ["au", "Audience", "Who the text is written for; there may be more than one."], ["pu", "Purpose", "What the writer wants the audience to think, feel or do."], ["su", "Subject", "The topic, in a phrase."], ["to", "Tone", "The writer's attitude, in precise words: bitter, mocking, reverent..."]];
const ASP_SOAP = {sp: "Jamaica Kincaid, born in colonial Antigua, who left as a teenager and writes as a native daughter with open anger.", oc: "Antigua in the 1980s: newly independent, living on tourism, with a government she sees as corrupt.", au: "Mainly white North American and European readers, the people most likely to visit Antigua as tourists.", pu: "To make readers see the history, poverty and corruption behind the vacation, and their own part in it.", su: "Tourism, colonialism and corruption in Antigua.", to: "Sarcastic and accusatory, bitter about the English, tender and lyrical by the end."};
function unitRhetoric(B) {
  return `<div class="card"><h3>SOAPSTone for <i>${esc(B.title)}</i></h3><p class="meta">A model analysis. Try your own first in the SOAPSTone tool, then compare.</p>
  <table class="tbl">${SOAP_FIELDS.map(([k, t]) => `<tr><th>${t}</th><td>${esc(ASP_SOAP[k])}</td></tr>`).join("")}</table>
  <div class="row"><a class="btn ghost sm" href="#/soap">SOAPSTone tool</a><a class="btn ghost sm" href="#/guide/rhetorical">Rhetorical analysis guide</a></div></div>
  <div class="card"><h3>Kincaid's moves, section by section</h3>${focusList(B)}</div>${deviceChips(B)}`;
}
function unitContext(B) {
  return `${B.context.map(c => `<div class="card"><h3>${esc(c.h)}</h3><div class="prose">${c.p.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>`).join("")}
  <div class="card"><h3>Key words</h3><table class="tbl">${B.slang.map(([w, m]) => `<tr><th>${esc(w)}</th><td>${esc(m)}</td></tr>`).join("")}</table></div>`;
}
function unitSoon(U) {
  const E = ESSAY(U.essay), note = CONTENT_NOTES[U.u];
  return `<p class="crumb"><a href="#/learn">‹ Learn</a></p>
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px">${U.text === U.title || U.writing ? esc(U.text) : `<i>${esc(U.text)}</i>`}</h2><p class="meta">${[U.author, U.product ? "Product: " + U.product : "", `Semester ${U.sem}`].filter(Boolean).map(esc).join(" · ")}</p>
  <p class="meta">${U.writing ? "A writing unit: everything for it is ready in Write." : "The reading guide and checks for this unit are coming. The writing guide and drills are ready now."}</p>
  <div class="row">${curUnitBtn(U)}</div></div>
  ${note ? `<div class="card note"><b>Content note.</b> ${esc(note)}</div>` : ""}
  <div class="card"><h3>Skills in this unit</h3><ul class="tight">${U.skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Ready now</h3><ul class="tight">${E ? `<li><a href="#/guide/${E.id}">${esc(E.name)} guide</a>: structure, frames, a model, the rubric</li>` : ""}<li><a href="#/drills">Writing drills</a> for this unit's skills</li>${U.essay ? `<li><a href="#/check/t/${U.essay}">Check a draft</a> and score it with the rubric</li>` : ""}<li><a href="#/terms">Glossary</a> terms for the unit</li><li><a href="#/asg/new">Add your assignment</a> and plan it day by day</li><li><a href="#/seminar">Seminar prep</a> for any discussion</li></ul></div>`;
}
ACT.setunit = a => { S.set.unit = Number(a); save(); toast(`Unit ${a} is now your current unit`); render(); };

// ---------- The argument workshop
function argUnit(U, tab) {
  const TABS = [["lessons", "Lessons"], ["fallacies", "Fallacies"], ["sources", "Sources"], ["debate", "Debate"]];
  tab = TABS.some(t => t[0] === tab) ? tab : "lessons";
  const seen = ARG.lessons.filter(l => S.seen["lesson:" + l.id]).length;
  const body = {
    lessons: () => `<ul class="list card">${ARG.lessons.map((l, i) => `<li><a class="go" href="#/lesson/${l.id}"><span class="n">${i + 1}</span><span class="t">${esc(l.title)}<br><span class="s">${S.seen["lesson:" + l.id] ? "Opened ✓" : esc(l.why.split(".")[0] + ".")}</span></span></a></li>`).join("")}</ul>
      <div class="row"><button class="btn" data-act="quiz" data-arg="arg">Argument quiz</button><button class="btn ghost" data-act="quiz" data-arg="unit:${U.u}">Unit ${U.u} test</button><a class="btn ghost" href="#/guide/argument">Argument essay guide</a></div>`,
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
  <div class="card unit" style="--u:${U.color}"><span class="pill" style="background:${U.color};color:#fff">Unit ${U.u} · ${esc(U.title)}</span>
  <h2 style="margin-top:8px">Argument workshop</h2><p class="meta">${seen} of ${ARG.lessons.length} lessons opened · Product: ${esc(U.product)}</p>
  ${S.set.unit === U.u ? "" : `<div class="row">${curUnitBtn(U)}</div>`}</div>
  <div class="ltabs">${TABS.map(([k, t]) => `<a href="#/unit/${U.u}/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>${body()}`;
}
V.lesson = id => {
  const L = ARG.lessons.find(x => x.id === id); if (!L) return V.unit(ARGU);
  if (!S.seen["lesson:" + id]) { S.seen["lesson:" + id] = today(); addXP(5); checkBadges(); }
  goalTick("guide");
  const i = ARG.lessons.indexOf(L), next = ARG.lessons[i + 1], qs = AQ.filter(q => q.src === id).length;
  return `<p class="crumb"><a href="#/unit/${ARGU}">‹ Argument workshop</a></p>
  <div class="card"><span class="pill">Lesson ${i + 1} of ${ARG.lessons.length}</span><h2 style="margin-top:8px">${esc(L.title)}</h2><p class="prose">${esc(L.why)}</p></div>
  <div class="card"><h3>Key points</h3><ul class="tight">${L.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Example</h3>${L.example.map(e => `<p class="model">${esc(e)}</p>`).join("")}</div>
  ${id === "fallacies" ? `<div class="row"><a class="btn ghost" href="#/unit/${ARGU}/fallacies">Fallacy gallery</a></div>` : ""}
  <div class="row">${qs ? `<button class="btn" data-act="quiz" data-arg="arg:${id}">${qs} practice questions</button>` : `<button class="btn" data-act="quiz" data-arg="fallacies">Fallacy finder</button>`}${next ? `<a class="btn ghost" href="#/lesson/${next.id}">Next: ${esc(next.title)} ›</a>` : `<a class="btn ghost" href="#/debate">Debate prep ›</a>`}</div>`;
};

// A section guide: #/ch/f451/3 (or #/ch/3 for the default book)
V.ch = (a, b2) => {
  const b = BOOKS[a] ? a : BOOK0, B = BOOKS[b], N = B.chapters_n, w = W(b).ch;
  const n = Math.max(1, Math.min(N, Number(BOOKS[a] ? b2 : a) || 1)), c = CH(n, b), back = `<p class="crumb"><a href="#/unit/${B.unit}">‹ ${esc(B.title)}</a></p>`;
  const nav = `<div class="row">${n > 1 ? `<a class="btn ghost sm" href="${chHref(b, n - 1)}">‹ ${w} ${n - 1}</a>` : ""}<span class="sp"></span>${n < N ? `<a class="btn ghost sm" href="${chHref(b, n + 1)}">${w} ${n + 1} ›</a>` : ""}</div>`;
  const part = partName(B, c);
  if (!canSee(n, b)) return `${back}<div class="card"><h2>${w} ${n}: ${esc(c.title)}</h2>${part ? `<p class="meta">${esc(part)}</p>` : ""}
    <p>You've marked ${readTo(b) ? `${w.toLowerCase()} ${readTo(b)}` : `no ${W(b).chs.toLowerCase()}`} as read, so this guide is hidden to keep it unspoiled.</p>
    <p class="meta">Read with page flags in three colors: ${esc(W(b).flags)}. Then come back for the guide and the reading check.</p>
    <div class="row"><button class="btn" data-act="readch" data-arg="${b}:${n}">I've read ${w.toLowerCase()} ${n}</button><button class="btn ghost" data-act="peek" data-arg="${b}:${n}">Show it anyway</button></div></div>${nav}`;
  const key = `ch:${b}:${n}`;
  if (!S.seen[key]) { S.seen[key] = today(); addXP(5); checkBadges(); }
  goalTick("guide");
  const f = focusOf(c);
  return `${back}
  <div class="card"><span class="pill">${w} ${n}</span>${part ? ` <span class="chip">${esc(part)}</span>` : ""}<h2 style="margin-top:8px">${esc(c.title)}</h2>${n > readTo(b) ? `<div class="row"><button class="btn sm" data-act="readch" data-arg="${b}:${n}">Mark ${w.toLowerCase()} ${n} read</button></div>` : ""}
  <h4>Summary</h4><div class="prose">${c.sum.map(p => `<p>${esc(p)}</p>`).join("")}</div></div>
  <div class="cols"><div class="card"><h3>${W(b).events}</h3><ul class="tight">${c.events.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>
  <div class="card"><h3>Watch for</h3><ul class="tight">${c.watch.map(e => `<li>${esc(e)}</li>`).join("")}</ul><div class="lensm"><b>${W(b).focus}: ${esc(f.name)}.</b> ${esc(f.text)}</div></div></div>
  <div class="card"><h3>Quote hunt</h3><p class="meta">Find these in your copy, then log the quotation with its page number.</p>
  <ul class="list">${c.hunt.map((h, i) => `<li><span class="t">${esc(h)}</span><button class="btn ghost sm" data-act="huntq" data-arg="${b}:${n}:${i}">Log it</button></li>`).join("")}</ul></div>
  <div class="card"><h3>Seminar questions</h3><ul class="list">${c.seminar.map((q, i) => `<li><span class="n">L${i + 1}</span><span class="t">${esc(q)}</span></li>`).join("")}</ul></div>
  <div class="row"><button class="btn" data-act="quiz" data-arg="ch:${b}:${n}">Reading check (8 questions)</button><a class="btn ghost" href="#/seminar">Seminar prep</a></div>${nav}`;
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
