// ---------- Write: assignments with day plans, prompt decoder, thesis and outline builders, essay guides, Quote Log, seminar prep, drills
const ATYPES = [["lens", "Critical lens essay"], ["lit", "Literary analysis essay"], ["argument", "Argument / persuasive essay"], ["rhetorical", "Rhetorical analysis"], ["synthesis", "Synthesis paragraph or essay"], ["narrative", "Personal narrative"], ["reading", "Reading assignment"], ["seminar", "Socratic seminar"], ["project", "Project or presentation"], ["other", "Other"]];
const ATYPE = id => (ATYPES.find(t => t[0] === id) || [id, id])[1];
const ESSAY_TYPES = ["lens", "lit", "argument", "rhetorical", "synthesis", "narrative"];
const STEPS = {
  essay: [["prompt", "Understand the prompt"], ["evidence", "Gather evidence"], ["thesis", "Write the thesis"], ["outline", "Outline"], ["draft", "Draft"], ["revise", "Check and revise"], ["submit", "Submit"]],
  narrative: [["prompt", "Understand the prompt"], ["moment", "Choose the moment"], ["outline", "Plan the scene"], ["draft", "Draft"], ["revise", "Check and revise"], ["submit", "Submit"]],
  reading: [["read", "Read"], ["notes", "Flag and log quotations"], ["quiz", "Take the reading check"]],
  seminar: [["read", "Read"], ["questions", "Write 3 questions"], ["quotes", "Pick 3 quotations"], ["practice", "Practice the starters"]],
  project: [["plan", "Plan"], ["work", "Make it"], ["practice", "Rehearse or review"], ["submit", "Submit"]]
};
const stepsFor = a => STEPS[a.type === "narrative" ? "narrative" : ESSAY_TYPES.includes(a.type) ? "essay" : a.type] || STEPS.project;
const getA = id => S.asg.find(a => a.id === id);
function makePlan(a) {
  const steps = stepsFor(a), work = steps.filter(s => s[0] !== "submit"), D = Math.max(0, daysTo(a.due) - (steps.some(s => s[0] === "submit") ? 1 : 0)), plan = {};
  work.forEach(([k], i) => { plan[k] = addD(today(), Math.min(D, Math.floor(i * (D + 1) / work.length))); });
  if (steps.some(s => s[0] === "submit")) plan.submit = a.due;
  a.plan = plan;
}
function nextStep(a) { return stepsFor(a).find(([k]) => !(a.steps || {})[k]); }
function stepDone(a, k) {
  a.steps = a.steps || {};
  if (a.steps[k]) return;
  a.steps[k] = today(); addXP(10); goalTick("step");
  if (k === "submit" || !nextStep(a)) { a.done = today(); addXP(40); toast("Assignment done. Nice work."); }
  checkBadges(); save();
}

// ---------- Write hub
V.write = () => {
  const open = S.asg.filter(a => !a.done).sort((a, b) => a.due < b.due ? -1 : 1), done = S.asg.filter(a => a.done);
  const row = a => { const ns = nextStep(a); return `<li><a class="go" href="#/asg/${a.id}"><span class="t"><b>${esc(a.title)}</b><br><span class="s">${esc(ATYPE(a.type))} · ${a.done ? "done " + nice(a.done) : dueWords(a.due) + (ns ? " · next: " + ns[1].toLowerCase() : "")}</span></span></a>${!a.done && daysTo(a.due) <= 1 ? `<span class="chip fix">soon</span>` : ""}</li>`; };
  return `<h2>Write</h2><p class="lead">Plan every assignment day by day, build the thesis and outline, collect evidence, and draft. ${esc(INTEGRITY)}</p>
  <div class="card"><div class="row" style="margin:0"><h3 style="margin:0">My assignments</h3><span class="sp"></span><a class="btn sm" href="#/asg/new">+ Add assignment</a></div>
  ${open.length ? `<ul class="list">${open.map(row).join("")}</ul>` : `<p class="meta">No assignments yet. Add the next essay, reading or seminar with its due date and the app will plan the days.</p>`}
  ${done.length ? `<details><summary>Finished (${done.length})</summary><ul class="list">${done.slice(-10).reverse().map(row).join("")}</ul></details>` : ""}</div>
  <h3>Essay guides</h3><div class="grid">${ESSAYS.map(e => `<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/guide/${e.id}"><span class="pill">Unit ${e.unit}</span><h3 style="margin-top:8px">${esc(e.name)}</h3><p class="meta">${esc(e.what)}</p></a>`).join("")}</div>
  <h3>Tools</h3><div class="grid">
  <a class="card" style="display:block;text-decoration:none;color:inherit" href="#/quotes"><h3>Quote Log</h3><p class="meta">${S.quotes.length} quotation${S.quotes.length === 1 ? "" : "s"} saved, with page numbers and MLA citations.</p></a>
  <a class="card" style="display:block;text-decoration:none;color:inherit" href="#/drills"><h3>Writing drills</h3><p class="meta">${DRILLS.length} short drills: citations, embedding, commentary, thesis, counterclaims.</p></a>
  <a class="card" style="display:block;text-decoration:none;color:inherit" href="#/seminar"><h3>Seminar prep</h3><p class="meta">Questions at three levels, quotations and sentence starters.</p></a>
  <a class="card" style="display:block;text-decoration:none;color:inherit" href="#/soap"><h3>SOAPSTone</h3><p class="meta">Pin down a text's rhetorical situation before you analyze it. ${S.soaps.length} saved.</p></a>
  <a class="card" style="display:block;text-decoration:none;color:inherit" href="#/debate"><h3>Debate prep</h3><p class="meta">Your case, their best arguments and your answers. ${S.debates.length} saved.</p></a></div>`;
};

// ---------- New assignment
V.asg = (id, tab) => {
  if (id === "new") return newAsgForm();
  const a = getA(id); if (!a) { location.replace("#/write"); return ""; }
  const essay = ESSAY_TYPES.includes(a.type);
  const TABS = essay ? [["plan", "Plan"], ["thesis", "Thesis"], ["outline", "Outline"], ["evidence", "Evidence"], ["draft", "Draft"]].filter(t => !(a.type === "narrative" && t[0] === "thesis")) : [["plan", "Plan"]];
  tab = TABS.some(t => t[0] === tab) ? tab : "plan";
  const body = {plan: asgPlan, thesis: asgThesis, outline: asgOutline, evidence: asgEvidence, draft: asgDraft}[tab](a);
  return `<p class="crumb"><a href="#/write">‹ Write</a></p>
  <div class="card"><span class="pill">${esc(ATYPE(a.type))}</span><h2 style="margin-top:8px">${esc(a.title)}</h2>
  <p class="meta">${a.done ? "Finished " + nice(a.done) : `Due ${nice(a.due)} · ${dueWords(a.due)}`}${a.book && BOOKS[a.book] ? ` · <i>${esc(BOOKS[a.book].title)}</i>` : ""}</p></div>
  ${TABS.length > 1 ? `<div class="ltabs">${TABS.map(([k, t]) => `<a href="#/asg/${a.id}/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>` : ""}${body}`;
};
function newAsgForm() {
  const U = UNIT(S.set.unit) || UNIT(4);
  return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>Add an assignment</h2>
  <div class="card"><label class="f">Title<input type="text" id="na-title" placeholder="Critical lens essay" maxlength="80"></label>
  <label class="f">Type<select id="na-type">${ATYPES.map(([k, t]) => `<option value="${k}"${k === U.essay ? " selected" : ""}>${t}</option>`).join("")}</select></label>
  <label class="f">Due date<input type="date" id="na-due" value="${addD(today(), 7)}" min="${addD(today(), -30)}"></label>
  <label class="f">It's about<select id="na-book"><option value="">No class text, or another text</option>${Object.values(BOOKS).map(B => `<option value="${B.id}"${B.unit === S.set.unit ? " selected" : ""}>${esc(B.title)}</option>`).join("")}</select></label>
  <label class="f">The prompt <span class="h">Paste it from Canvas. Optional, but the app decodes it for you.</span><textarea id="na-prompt" rows="4"></textarea></label>
  <div class="row"><button class="btn" data-act="addasg">Add and plan it</button></div></div>`;
}
ACT.addasg = () => {
  const title = $("#na-title").value.trim() || ATYPE($("#na-type").value), due = $("#na-due").value || addD(today(), 7);
  const a = {id: uid(), title, type: $("#na-type").value, due, created: today(), book: $("#na-book").value, prompt: $("#na-prompt").value.trim(), steps: {}, thesis: "", outline: {body: [{}, {}]}, draft: "", quotes: [], done: null};
  makePlan(a); S.asg.push(a); addXP(10); checkBadges(); save();
  location.hash = `#/asg/${a.id}`;
};
ACT.replan = id => { const a = getA(id); makePlan(a); save(); toast("Re-planned from today"); render(); };
ACT.step = arg => { const [id, k] = arg.split(":"), a = getA(id); if (!a) return; if (a.steps && a.steps[k]) { delete a.steps[k]; if (a.done) a.done = null; save(); } else stepDone(a, k); render(); };
ACT.asgdel = id => { if (!confirm("Delete this assignment and its outline and draft?")) return; S.asg = S.asg.filter(a => a.id !== id); save(); location.hash = "#/write"; };
IN.adue = el => { const a = getA(el.dataset.id); a.due = el.value; save(); };

// ---------- Plan tab: day plan and prompt decoder
const VERBS = {analyze: "Break it into parts and explain how they work: how and why, not what.", argue: "Take a position and defend it with evidence and reasoning.", explain: "Make clear how or why, with evidence.", compare: "Show similarities, and usually differences, and why they matter.", contrast: "Focus on differences and what they reveal.", evaluate: "Judge how well something works, using clear criteria.", synthesize: "Combine sources to support your own claim.", trace: "Follow how something develops across the text, in order.", describe: "Give the key features in detail.", identify: "Name it specifically.", discuss: "Examine it from several angles, then reach a conclusion.", interpret: "Explain what it means beyond the literal.", examine: "Look closely and explain what you find.", reflect: "Connect the experience to what you learned or how you changed.", choose: "Commit to one and justify the choice.", support: "Back every claim with evidence.", apply: "Use the idea (a lens, a concept) as a tool on the text."};
function decodePrompt(t) {
  if (!t.trim()) return `<p class="meta">Paste the prompt above and the app will pull out what it asks you to do.</p>`;
  const verbs = Object.keys(VERBS).filter(v => new RegExp(`\\b${v}\\w*`, "i").test(t));
  const reqs = [...t.matchAll(/\b(\w+|\d+)\s+(?:or more\s+)?(?:pieces of (?:textual )?evidence|(?:direct )?quotations?|quotes|sources|examples|body paragraphs|paragraphs|pages|words)\b/gi)].map(m => m[0]);
  const keys = [["MLA", /\bMLA\b/], ["Works Cited page", /works cited/i], ["Counterclaim", /counter\s?(?:claim|argument)|opposing/i], ["A thesis", /thesis/i], ["A critical lens", /\blens\b/i], ["Textual evidence", /textual evidence|evidence from the text|quot/i], ["Citations", /\bcit(?:e|ation)/i], ["Typed and double-spaced", /double[- ]spaced/i], ["A title", /\btitle\b/i]].filter(([, r]) => r.test(t)).map(k => k[0]);
  return `${verbs.length ? `<h4>What it asks you to do</h4><ul class="tight">${verbs.map(v => `<li><b>${v[0].toUpperCase() + v.slice(1)}:</b> ${esc(VERBS[v])}</li>`).join("")}</ul>` : ""}
  ${reqs.length || keys.length ? `<h4>Requirements to check off</h4><ul class="tight">${reqs.map(r => `<li>${esc(r)}</li>`).concat(keys.map(k => `<li>${esc(k)}</li>`)).join("")}</ul>` : ""}
  ${!verbs.length && !reqs.length && !keys.length ? `<p class="meta">No task words found. Circle the verbs in the prompt yourself: they tell you what kind of thinking to do.</p>` : ""}`;
}
IN.aprompt = el => { const a = getA(el.dataset.id); a.prompt = el.value; saveSoon(); const d = $("#pdec"); if (d) d.innerHTML = decodePrompt(a.prompt); };
function asgPlan(a) {
  const steps = stepsFor(a), k = today();
  const items = steps.map(([s, label]) => {
    const d = (a.plan || {})[s], done = (a.steps || {})[s], isToday = !done && d && d <= k;
    const link = {thesis: "thesis", outline: "outline", evidence: "evidence", draft: "draft", moment: "outline"}[s];
    const extra = s === "revise" ? ` · <a href="#/check/a/${a.id}">Check</a> · <a href="#/rubric/a/${a.id}">Rubric</a>` : s === "quiz" ? ` · <a href="#/test">Test</a>` : s === "questions" || s === "quotes" ? ` · <a href="#/seminar">Seminar prep</a>` : link ? ` · <a href="#/asg/${a.id}/${link}">Open</a>` : "";
    return `<li class="${done ? "done" : ""}${isToday ? " today" : ""}"><button class="check${done ? " on" : ""}" data-act="step" data-arg="${a.id}:${s}" aria-label="${done ? "Undo" : "Done"}: ${esc(label)}">${done ? "✓" : ""}</button><span class="t">${esc(label)}${extra}</span><span class="d">${d ? (d < k && !done ? "<b style='color:var(--pen)'>" + nice(d) + "</b>" : nice(d)) : ""}</span></li>`;
  }).join("");
  return `<div class="card"><h3>Day plan</h3><ul class="steps">${items}</ul>
  <div class="row"><label class="tog">Due <input type="date" value="${esc(a.due)}" data-in="adue" data-id="${a.id}"></label><button class="btn ghost sm" data-act="replan" data-arg="${a.id}">Re-plan from today</button><span class="sp"></span><button class="btn warn sm" data-act="asgdel" data-arg="${a.id}">Delete</button></div></div>
  <div class="card"><h3>The prompt</h3><textarea rows="4" data-in="aprompt" data-id="${a.id}" placeholder="Paste the prompt from Canvas">${esc(a.prompt)}</textarea><div id="pdec">${decodePrompt(a.prompt || "")}</div></div>
  ${ESSAY_TYPES.includes(a.type) ? `<div class="row"><a class="btn ghost" href="#/guide/${a.type}">${esc(ESSAY(a.type).name)} guide</a>${a.type === "lens" ? `<a class="btn ghost" href="#/unit/4/lenses">Lenses</a>` : ""}</div>` : ""}`;
}

// ---------- Thesis builder
const ctxFor = a => { const B = BOOKS[a.book]; return {type: a.type, title: B ? B.title : "", author: B ? B.cite : "", lenses: LENSES, names: a.book === "lotf" ? LOTF.characters.map(c => c.name.split(" ")[0]).filter(n => /^[A-Z][a-z]+$/.test(n) && n !== "The") : []}; };
function thesisHTML(a) {
  const r = Checker.thesisCheck(a.thesis || "", ctxFor(a));
  return `<ul class="tcheck">${r.parts.map(p => `<li><span class="${p.pass ? "y" : "x"}">${p.pass ? "✓" : "•"}</span><span>${esc(p.label)}${p.pass ? "" : `<span class="h">${esc(p.tip)}</span>`}</span></li>`).join("")}</ul>
  <p class="meta">${r.ok ? "Every check passes. Now make sure it's true to the book and that you can prove it in 2 or 3 paragraphs." : `${r.score} of ${r.of} checks pass.`}</p>`;
}
IN.athesis = el => {
  const a = getA(el.dataset.id); a.thesis = el.value; saveSoon();
  const r = Checker.thesisCheck(a.thesis, ctxFor(a));
  if (r.ok && !a.thesisOk) { a.thesisOk = today(); checkBadges(); }
  const d = $("#tcheck"); if (d) d.innerHTML = thesisHTML(a);
};
ACT.frame = arg => { const [id, i] = arg.split(":"), a = getA(id), f = framesFor(a)[Number(i)], box = $("#thesisbox"); if (!box) return; box.value = box.value.trim() ? box.value + "\n" + f : f; box.focus(); IN.athesis(box); };
const framesFor = a => (ESSAY(a.type) || ESSAY("lit")).frames.concat(a.type === "lens" ? LENSES.map(l => l.frame) : []);
function asgThesis(a) {
  return `<div class="cols"><div class="card"><h3>Your thesis</h3><p class="meta">Write it in your own words. Tap a frame to start from its shape, then replace every bracket.</p>
  <textarea id="thesisbox" rows="4" data-in="athesis" data-id="${a.id}" placeholder="Your thesis">${esc(a.thesis)}</textarea>
  <div id="tcheck">${thesisHTML(a)}</div><div class="row"><button class="btn" data-act="step" data-arg="${a.id}:thesis"${(a.steps || {}).thesis ? " disabled" : ""}>${(a.steps || {}).thesis ? "Thesis done ✓" : "Thesis is done"}</button></div></div>
  <div class="card"><h3>Frames</h3>${framesFor(a).map((f, i) => `<button class="frame" data-act="frame" data-arg="${a.id}:${i}">${esc(f)}</button>`).join("")}</div></div>`;
}

// ---------- Outline builder
function setPath(o, path, v) { const k = path.split("."); let x = o; for (let i = 0; i < k.length - 1; i++) x = x[k[i]] || (x[k[i]] = /^\d+$/.test(k[i + 1]) ? [] : {}); x[k[k.length - 1]] = v; }
const getPath = (o, path) => path.split(".").reduce((x, k) => x == null ? x : x[k], o);
IN.aout = el => { const a = getA(el.dataset.id); a.outline = a.outline || {body: [{}, {}]}; setPath(a.outline, el.dataset.path, el.value); saveSoon(); };
ACT.addbody = id => { const a = getA(id); a.outline.body = a.outline.body || []; if (a.outline.body.length < 5) a.outline.body.push({}); save(); render(); };
ACT.rmbody = id => { const a = getA(id); if ((a.outline.body || []).length > 1) a.outline.body.pop(); save(); render(); };
function field(a, path, label, hint, rows = 2) { return `<label class="f">${esc(label)}${hint ? ` <span class="h">${esc(hint)}</span>` : ""}<textarea rows="${rows}" data-in="aout" data-id="${a.id}" data-path="${path}">${esc(getPath(a.outline || {}, path) || "")}</textarea></label>`; }
function asgOutline(a) {
  a.outline = a.outline || {body: [{}, {}]}; a.outline.body = a.outline.body || [{}, {}];
  if (a.type === "narrative") return `<div class="card outline">
    ${field(a, "moment", "The moment", "One scene: where, when, who. Minutes, not months.")}${field(a, "open", "Opening line idea", "Start inside the action or with a line of dialogue.")}
    ${field(a, "details", "Sensory details", "What you saw, heard, smelled, felt.", 3)}${field(a, "turn", "The turning point", "The instant something shifted.")}${field(a, "reflect", "Reflection", "What you understand now that you didn't then.", 3)}
    <div class="row"><button class="btn" data-act="step" data-arg="${a.id}:outline">Plan is done</button><a class="btn ghost" href="#/asg/${a.id}/draft">Draft ›</a></div></div>`;
  const quotes = S.quotes.filter(q => (a.quotes || []).includes(q.id) || (a.book && q.book === a.book));
  const body = a.outline.body.map((b, i) => `<fieldset><legend>Body paragraph ${i + 1}</legend>
    ${field(a, `body.${i}.claim`, "Topic sentence (claim)", a.type === "lens" ? "A claim in your lens's terms." : "One claim that supports the thesis.")}
    ${field(a, `body.${i}.ev`, "Evidence", quotes.length ? `From your Quote Log: ${quotes.slice(0, 3).map(q => `p. ${q.page || "?"}`).join(", ")}${quotes.length > 3 ? "..." : ""}` : "A quotation with its page number.", 2)}
    ${field(a, `body.${i}.c1`, "Commentary 1", "How does the evidence prove the claim?")}${field(a, `body.${i}.c2`, "Commentary 2", "So what? Connect it to the thesis.")}</fieldset>`).join("");
  return `<div class="outline">
  <fieldset><legend>Introduction</legend>${field(a, "hook", "Hook", "An idea or detail that matters, not a dictionary definition.")}${field(a, "context", a.type === "lens" ? "The lens in a sentence or two, plus context" : "Context", "")}
  <p class="meta"><b>Thesis:</b> ${a.thesis ? esc(a.thesis) : `<a href="#/asg/${a.id}/thesis">Write it on the Thesis tab</a>`}</p></fieldset>
  ${body}<div class="row" style="margin:-4px 0 12px"><button class="btn ghost sm" data-act="addbody" data-arg="${a.id}">+ Paragraph</button>${a.outline.body.length > 1 ? `<button class="btn ghost sm" data-act="rmbody" data-arg="${a.id}">− Paragraph</button>` : ""}</div>
  ${a.type === "argument" ? `<fieldset><legend>Counterclaim</legend>${field(a, "cc", "The best opposing view, stated fairly")}${field(a, "reb", "Your rebuttal", "However, ...")}</fieldset>` : ""}
  <fieldset><legend>Conclusion</legend>${field(a, "insight", "Your insight, in fresh words")}${field(a, "larger", "The larger connection", "What does it say about people or the world?")}</fieldset>
  <div class="row"><button class="btn" data-act="step" data-arg="${a.id}:outline"${(a.steps || {}).outline ? " disabled" : ""}>${(a.steps || {}).outline ? "Outline done ✓" : "Outline is done"}</button><a class="btn ghost" href="#/asg/${a.id}/draft">Draft ›</a></div></div>`;
}

// ---------- Evidence tab and the Quote Log
const QTAG_GROUPS = [
  ["Lord of the Flies", [["ralph", "Ralph"], ["piggy", "Piggy"], ["jack", "Jack"], ["simon", "Simon"], ["roger", "Roger"], ["conch", "Conch"], ["glasses", "Glasses"], ["fire", "Fire"], ["beast", "Beast"], ["paint", "Mask"], ["civ", "Civilization"], ["power", "Power"], ["fear", "Fear"], ["evil", "Evil within"]]],
  ["A Small Place", [["you", "You, the tourist"], ["tourism", "Tourism"], ["colonial", "Colonialism"], ["corruption", "Corruption"], ["library", "Library"], ["language", "Language"], ["beauty", "Beauty"]]],
  ["Rhetoric", [["ethos", "Ethos"], ["pathos", "Pathos"], ["logos", "Logos"], ["sarcasm", "Sarcasm"], ["rq", "Rhetorical question"], ["juxt", "Juxtaposition"], ["tone", "Tone shift"]]],
  ["Lenses", LENSES.map(l => ["lens-" + l.id, l.name])]];
const QTAGS = QTAG_GROUPS.flatMap(g => g[1]);
const qtag = id => (QTAGS.find(t => t[0] === id) || [id, id])[1];
const mla = q => `"${q.text.trim().replace(/[.,]$/, "")}" (${BOOKS[q.book] ? BOOKS[q.book].cite + " " : q.author ? q.author + " " : ""}${q.page || "page"})`;
function quoteCard(q, a) {
  const on = a && (a.quotes || []).includes(q.id);
  return `<div class="qlog"><q>${esc(q.text)}</q><div class="meta">${BOOKS[q.book] ? `<i>${esc(BOOKS[q.book].title)}</i>, ${W(q.book).ch.toLowerCase()} ${q.ch || "?"}, ` : ""}p. ${esc(q.page || "?")}${q.who ? " · " + esc(q.who) : ""}</div>
  ${q.tags && q.tags.length ? `<div class="tags">${q.tags.map(t => `<span class="chip">${esc(qtag(t))}</span>`).join("")}</div>` : ""}${q.note ? `<p class="meta">Why it matters: ${esc(q.note)}</p>` : ""}
  <div class="row"><button class="btn ghost sm" data-act="copymla" data-arg="${q.id}">Copy citation</button>${a ? `<button class="btn ${on ? "" : "ghost "}sm" data-act="attachq" data-arg="${a.id}:${q.id}">${on ? "In this essay ✓" : "Use in this essay"}</button>` : ""}
  <details style="flex-basis:100%"><summary>Practice commentary</summary><p class="meta">Two sentences: what the words do, then why it matters.</p><textarea rows="3" data-in="qcomm" data-id="${q.id}">${esc(q.comm || "")}</textarea></details></div></div>`;
}
ACT.attachq = arg => { const [aid, qid] = arg.split(":"), a = getA(aid); a.quotes = a.quotes || []; a.quotes = a.quotes.includes(qid) ? a.quotes.filter(x => x !== qid) : a.quotes.concat(qid); if (a.quotes.length >= 2) stepDone(a, "evidence"); save(); render(); };
ACT.copymla = id => { const q = S.quotes.find(x => x.id === id); copyText(mla(q), "Copied with its citation"); };
IN.qcomm = el => { const q = S.quotes.find(x => x.id === el.dataset.id); q.comm = el.value; saveSoon(); };
function copyText(t, msg) {
  const done = () => toast(msg || "Copied");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => fallback());
  else fallback();
  function fallback() { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Select the text and copy it"); } ta.remove(); }
}
function quoteForm(pre = {}) {
  return `<div class="card"><h3>Log a quotation</h3>${pre.hint ? `<p class="meta">Hunting for: ${esc(pre.hint)}</p>` : ""}
  <label class="f">The quotation <span class="h">Copy it exactly from your book.</span><textarea id="nq-text" rows="3"></textarea></label>
  <div class="row"><label class="tog">Text <select id="nq-book">${Object.values(BOOKS).map(B => `<option value="${B.id}"${(pre.book || bookOfDefault()) === B.id ? " selected" : ""}>${esc(B.title)}</option>`).join("")}<option value=""${pre.book === "" ? " selected" : ""}>Another text</option></select></label>
  <label class="tog">Chapter or section <select id="nq-ch">${Array.from({length: 13}, (_, i) => `<option value="${i || ""}"${(pre.ch || 0) === i ? " selected" : ""}>${i || "—"}</option>`).join("")}</select></label>
  <label class="tog">Page <input type="number" id="nq-page" min="1" max="999" style="width:6em"></label></div>
  <label class="f">Who says it, or whose moment <input type="text" id="nq-who" maxlength="40"></label>
  <label class="f">Author (if not Golding) <input type="text" id="nq-author" maxlength="40" placeholder="Last name"></label>
  <div class="f">Tags</div><div id="nq-tags">${QTAG_GROUPS.map(([g, tags]) => `<p class="meta" style="margin:6px 0 2px">${esc(g)}</p><div class="tags">${tags.map(([k, t]) => `<button type="button" class="tagb" data-act="qtag" data-arg="${k}">${esc(t)}</button>`).join("")}</div>`).join("")}</div>
  <label class="f">Why it matters <span class="h">One sentence in your words.</span><textarea id="nq-note" rows="2"></textarea></label>
  <div class="row"><button class="btn" data-act="addquote" data-arg="${pre.asg || ""}">Save quotation</button></div></div>`;
}
ACT.qtag = (k, el) => el.classList.toggle("on");
ACT.addquote = asgId => {
  const text = $("#nq-text").value.trim(); if (!text) { toast("Type the quotation first"); return; }
  const q = {id: uid(), d: today(), text: text.replace(/^["“]|["”]$/g, ""), book: $("#nq-book").value, ch: Number($("#nq-ch").value) || 0, page: $("#nq-page").value, who: $("#nq-who").value.trim(), author: $("#nq-author").value.trim(), note: $("#nq-note").value.trim(), tags: $$("#nq-tags .tagb.on").map(b => b.dataset.arg)};
  S.quotes.push(q); addXP(5); goalTick("quote");
  if (asgId) { const a = getA(asgId); if (a) { a.quotes = (a.quotes || []).concat(q.id); if (a.quotes.length >= 2) stepDone(a, "evidence"); } }
  checkBadges(); save(); toast("Quotation saved"); render(); window.scrollTo(0, 0);
};
const bookOfDefault = () => (bookOfUnit(S.set.unit) || LOTF).id;
ACT.huntq = arg => { const [b, n, i] = arg.split(":"); location.hash = `#/quotes/new/${b}/${n}/${i}`; };
ACT.delquote = id => { if (confirm("Delete this quotation?")) { S.quotes = S.quotes.filter(q => q.id !== id); save(); render(); } };
let QFILTER = "";
ACT.qfilter = a => { QFILTER = QFILTER === a ? "" : a; render(); };
V.quotes = function (mode, n, i) {
  if (mode === "new") { const b = BOOKS[n] ? n : "lotf", ch = Number(BOOKS[n] ? i : n) || 0, hi = BOOKS[n] ? arguments[3] : i, c = ch ? CH(ch, b) : null; return `<p class="crumb"><a href="#/quotes">‹ Quote Log</a></p>${quoteForm({book: b, ch, hint: c && hi != null ? c.hunt[Number(hi)] : ""})}`; }
  const list = S.quotes.filter(q => !QFILTER || (q.tags || []).includes(QFILTER)).slice().sort((a, b) => (a.ch || 99) - (b.ch || 99) || (Number(a.page) || 0) - (Number(b.page) || 0));
  const used = [...new Set(S.quotes.flatMap(q => q.tags || []))];
  return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>Quote Log</h2><p class="lead">Every quotation you might use, with its page number. Tag them so you can find evidence for any claim in seconds.</p>
  ${used.length ? `<div class="tags">${used.map(t => `<button class="tagb${QFILTER === t ? " on" : ""}" data-act="qfilter" data-arg="${t}">${esc(qtag(t))}</button>`).join("")}</div>` : ""}
  ${list.length ? list.map(q => `${quoteCard(q)}<div class="row" style="margin:-4px 0 10px"><button class="btn ghost sm" data-act="delquote" data-arg="${q.id}">Delete</button></div>`).join("") : `<p class="meta">No quotations yet.</p>`}
  ${quoteForm({})}`;
};
function asgEvidence(a) {
  const mine = S.quotes.filter(q => (a.quotes || []).includes(q.id)), others = S.quotes.filter(q => !(a.quotes || []).includes(q.id) && (!a.book || q.book === a.book));
  return `<div class="card"><h3>Evidence for this essay (${mine.length})</h3>${mine.length ? mine.map(q => quoteCard(q, a)).join("") : `<p class="meta">Pick quotations from your log below, or log new ones. Two or more completes the Gather evidence step.</p>`}</div>
  ${others.length ? `<details class="card"><summary>From your Quote Log (${others.length})</summary>${others.map(q => quoteCard(q, a)).join("")}</details>` : ""}${quoteForm({asg: a.id, book: a.book})}`;
}

// ---------- Draft tab
IN.adraft = el => { const a = getA(el.dataset.id); a.draft = el.value; saveSoon(); const w = $("#dwc"); if (w) w.textContent = `${wcount(a.draft)} words`; };
ACT.fromoutline = id => {
  const a = getA(id), o = a.outline || {};
  if (a.draft.trim() && !confirm("Replace your draft with text from the outline?")) return;
  const j = (...x) => x.filter(s => s && s.trim()).map(s => s.trim()).join(" ");
  a.draft = a.type === "narrative" ? [o.open, o.moment, o.details, o.turn, o.reflect].filter(Boolean).join("\n\n")
    : [j(o.hook, o.context, a.thesis), ...(o.body || []).map(b => j(b.claim, b.ev, b.c1, b.c2)), a.type === "argument" ? j(o.cc, o.reb) : "", j(o.insight, o.larger)].filter(Boolean).join("\n\n");
  save(); render();
};
function asgDraft(a) {
  return `<div class="card"><h3>Draft</h3><p class="meta">Write here, or paste from Google Docs. It saves as you type.</p>
  <textarea class="draft" data-in="adraft" data-id="${a.id}" placeholder="Start writing...">${esc(a.draft)}</textarea><div class="wc" id="dwc">${wcount(a.draft)} words</div>
  <div class="row">${!a.draft.trim() ? `<button class="btn ghost" data-act="fromoutline" data-arg="${a.id}">Start from my outline</button>` : ""}<a class="btn" href="#/check/a/${a.id}">Check this draft</a><a class="btn ghost" href="#/rubric/a/${a.id}">Score with the rubric</a><a class="btn ghost" href="#/claude/a/${a.id}">Get Claude feedback</a>
  <button class="btn ghost" data-act="step" data-arg="${a.id}:draft"${(a.steps || {}).draft ? " disabled" : ""}>${(a.steps || {}).draft ? "Draft done ✓" : "Draft is done"}</button></div></div>`;
}

// ---------- Essay guides
V.guide = id => {
  const e = ESSAY(id); if (!e) return V.write();
  if (!S.seen["guide:" + id]) { S.seen["guide:" + id] = today(); addXP(5); }
  return `<p class="crumb"><a href="#/write">‹ Write</a></p>
  <div class="card"><span class="pill">Unit ${e.unit} · Guide</span><h2 style="margin-top:8px">${esc(e.name)}</h2><p class="prose">${esc(e.what)}</p></div>
  <div class="cols">${e.parts.map(([h, items]) => `<div class="card"><h3>${esc(h)}</h3><ul class="tight">${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
  <div class="card"><h3>Frames</h3>${e.frames.map(f => `<p class="model">${esc(f)}</p>`).join("")}</div>
  <div class="card"><h3>Model paragraph</h3><p class="meta">${esc(e.model.src)}. A different text on purpose: copy the moves, not the words.</p><p class="model">${esc(e.model.text)}</p>
  <h4>What each part does</h4><ul class="tight">${e.model.notes.map(([h, t]) => `<li><b>${esc(h)}:</b> ${esc(t)}</li>`).join("")}</ul></div>
  <div class="cols"><div class="card okc"><h3>Checklist</h3><ul class="tight">${e.checklist.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="card note"><h3>Traps</h3><ul class="tight">${e.traps.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
  <div class="card"><h3>Rubric</h3><p class="meta">The app's rubric for this type. Swap in your teacher's rubric language when you have it.</p><div class="rubwrap"><table class="tbl"><tr><th></th>${LEVELS.map(l => `<th>${l}</th>`).join("")}</tr>${e.rubric.map(r => `<tr><th>${esc(r.row)}</th>${r.lv.map(x => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div></div>
  <div class="row"><a class="btn" href="#/asg/new">Start an assignment</a><a class="btn ghost" href="#/check/t/${e.id}">Check a draft</a><a class="btn ghost" href="#/drills">Drills</a></div>`;
};

// ---------- Seminar prep
V.seminar = () => {
  const b = S.drafts.semBook || bookOfDefault(), B = BOOKS[b], N = B.chapters_n;
  const from = Math.min(N, Number(S.drafts.semFrom) || Math.max(1, readTo(b) - 1)), to = Math.min(N, Number(S.drafts.semTo) || Math.max(1, readTo(b)));
  const qs = B.chapters.filter(c => c.n >= from && c.n <= to && canSee(c.n, b));
  const prep = S.drafts.sem || {q: ["", "", ""], quotes: ["", "", ""], conn: ""};
  const sel = (id, v) => `<select data-in="semrange" data-k="${id}">${Array.from({length: N}, (_, i) => `<option${i + 1 === v ? " selected" : ""}>${i + 1}</option>`).join("")}</select>`;
  return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>Seminar prep</h2><p class="lead">Come with three questions, three quotations and one connection. Speak two or three times, and cite the text every time.</p>
  <div class="card"><h3>Three levels of questions</h3><ul class="list">${SEMINAR.levels.map(([h, d, ex]) => `<li style="display:block"><b>${esc(h)}</b>: ${esc(d)}<br><span class="quiet">Example: ${esc(ex)}</span></li>`).join("")}</ul></div>
  <div class="card"><h3>Ideas from the guides</h3><div class="row" style="margin:0"><select data-in="semrange" data-k="semBook">${Object.values(BOOKS).map(x => `<option value="${x.id}"${x.id === b ? " selected" : ""}>${esc(x.title)}</option>`).join("")}</select> ${W(b).chs} ${sel("semFrom", from)} to ${sel("semTo", to)}</div>
  ${qs.length ? `<ul class="list">${qs.flatMap(c => c.seminar.map((q, i) => `<li><span class="n">L${i + 1}</span><span class="t">${esc(q)} <span class="s">${W(b).ch} ${c.n}</span></span></li>`)).join("")}</ul>` : `<p class="meta">Mark ${W(b).chs.toLowerCase()} as read to see their seminar questions.</p>`}</div>
  <div class="card"><h3>My prep sheet</h3>${[0, 1, 2].map(i => `<label class="f">Question ${i + 1} <span class="h">${["Level 1, 2 or 3", "Make one a Level 2", "Make one a Level 3"][i]}</span><input type="text" data-in="semf" data-k="q.${i}" value="${esc(prep.q[i])}"></label>`).join("")}
  ${[0, 1, 2].map(i => `<label class="f">Quotation ${i + 1} with page <input type="text" data-in="semf" data-k="quotes.${i}" value="${esc(prep.quotes[i])}" placeholder="p. __: ..."></label>`).join("")}
  <label class="f">One connection to another text, history or life <textarea rows="2" data-in="semf" data-k="conn">${esc(prep.conn)}</textarea></label>
  <div class="row"><button class="btn" data-act="semsave">Save prep</button></div></div>
  <div class="card"><h3>Sentence starters</h3><div class="cols">${Object.entries(SEMINAR.starters).map(([k, list]) => `<div><h4>${esc(k)}</h4><ul class="tight">${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div></div>
  ${S.sem.length ? `<details class="card"><summary>Past preps (${S.sem.length})</summary><ul class="list">${S.sem.slice().reverse().map(p => `<li style="display:block"><b>${nice(p.d)}</b> · ${esc((BOOKS[p.book || "lotf"] || LOTF).title)} ${p.from}–${p.to}<br><span class="s">${p.q.filter(Boolean).map(esc).join(" · ")}</span></li>`).join("")}</ul></details>` : ""}`;
};
IN.semrange = el => { S.drafts[el.dataset.k] = el.value; if (el.dataset.k === "semBook") { delete S.drafts.semFrom; delete S.drafts.semTo; } save(); render(); };
IN.semf = el => { const p = S.drafts.sem || (S.drafts.sem = {q: ["", "", ""], quotes: ["", "", ""], conn: ""}); setPath(p, el.dataset.k, el.value); saveSoon(); };
ACT.semsave = () => {
  const p = S.drafts.sem || {q: [], quotes: [], conn: ""};
  if (!p.q.some(x => x && x.trim())) { toast("Write at least one question first"); return; }
  const b = S.drafts.semBook || bookOfDefault();
  S.sem.push({d: today(), book: b, from: Number(S.drafts.semFrom) || 1, to: Number(S.drafts.semTo) || Math.max(1, readTo(b)), q: p.q.slice(), quotes: p.quotes.slice(), conn: p.conn});
  addXP(15); goalTick("seminar"); checkBadges(); save(); toast("Seminar prep saved"); render();
};

// ---------- Writing drills
const SKILLS = {mla: "MLA citations", tense: "Literary present", evidence: "Embedding evidence", thesis: "Thesis and theme", commentary: "Commentary", counter: "Counterclaims", fallacy: "Fallacies", rhetoric: "Rhetorical verbs", style: "Style", organization: "Organization", synthesis: "Synthesis", lens: "Lens claims"};
V.drills = () => {
  const by = {}; for (const d of DRILLS) (by[d.skill] = by[d.skill] || []).push(d);
  return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>Writing drills</h2><p class="lead">Two minutes each. Multiple-choice drills grade themselves; written drills show a model and a checklist after you try.</p>
  <div class="grid">${Object.entries(by).map(([k, list]) => `<div class="card"><h3>${esc(SKILLS[k] || k)}</h3><ul class="list">${list.map(d => `<li><a class="go" href="#/drill/${d.id}"><span class="t">${esc(d.title)}<br><span class="s">${d.kind === "mc" ? "Multiple choice" : "Write"}${(S.drills[d.id] || {}).n ? " · done ✓" : ""}</span></span></a></li>`).join("")}</ul></div>`).join("")}</div>`;
};
let DR = null;
V.drill = id => {
  const d = DRILL[id]; if (!d) return V.drills();
  if (!DR || DR.id !== id) DR = {id, pick: null, order: d.kind === "mc" ? shuffle(d.c.map((t, i) => ({t, ok: i === 0}))) : null, shown: false, text: ""};
  const idx = DRILLS.indexOf(d), next = DRILLS[idx + 1];
  const tail = `<div class="row">${next ? `<a class="btn ghost" href="#/drill/${next.id}">Next drill ›</a>` : ""}<a class="btn ghost" href="#/drills">All drills</a></div>`;
  if (d.kind === "mc") {
    const shown = DR.pick != null;
    return `<p class="crumb"><a href="#/drills">‹ Drills</a></p><div class="q"><div class="qhead"><span class="pill">${esc(SKILLS[d.skill])}</span><b>${esc(d.title)}</b></div><p class="stem">${esc(d.q)}</p>
    <div class="choices">${DR.order.map((c, i) => `<button class="choice${shown ? (c.ok ? " right" : i === DR.pick ? " wrong" : "") : ""}" data-act="dpick" data-arg="${i}"${shown ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${esc(c.t)}</span></button>`).join("")}</div>
    ${shown ? `<div class="fb${DR.order[DR.pick].ok ? "" : " bad"}"><b>${DR.order[DR.pick].ok ? "Right." : "Not quite."}</b> ${esc(d.why)}</div>` : ""}</div>${tail}`;
  }
  const auto = DR.shown && d.absent ? d.absent.filter(w => new RegExp(`\\b${w}\\b`, "i").test(DR.text)) : [];
  return `<p class="crumb"><a href="#/drills">‹ Drills</a></p><div class="card"><span class="pill">${esc(SKILLS[d.skill])}</span><h2 style="margin-top:8px">${esc(d.title)}</h2><p>${esc(d.q)}</p>${d.given ? `<p class="model">${esc(d.given)}</p>` : ""}
  <textarea rows="4" data-in="dtext" placeholder="Your version">${esc(DR.text)}</textarea>
  ${DR.shown ? `${d.absent ? `<div class="fb${auto.length ? " bad" : ""}">${auto.length ? `Still in the past tense: ${auto.map(esc).join(", ")}.` : "Every verb is in the present. Nice."}</div>` : ""}
  <h4>Compare with a model</h4><p class="model">${esc(d.model)}</p><h4>Check your version</h4><ul class="tcheck">${d.check.map(x => `<li><label class="tog" style="min-height:36px"><input type="checkbox"> ${esc(x)}</label></li>`).join("")}</ul>
  <p class="meta">Your words matter more than matching the model. Revise once, then move on.</p>` : `<div class="row"><button class="btn" data-act="dshow">Compare with a model</button></div>`}</div>${tail}`;
};
IN.dtext = el => { if (DR) DR.text = el.value; };
function drillDone(id, ok) { const r = S.drills[id] || (S.drills[id] = {n: 0, ok: 0}); r.n++; if (ok) r.ok++; r.last = today(); addXP(15); goalTick("drill"); checkBadges(); save(); }
ACT.dpick = a => { if (!DR || DR.pick != null) return; DR.pick = Number(a); const ok = DR.order[DR.pick].ok; beep(ok); drillDone(DR.id, ok); render(); };
ACT.dshow = () => { if (!DR) return; if (wcount(DR.text) < 5) { toast("Write your version first"); return; } DR.shown = true; drillDone(DR.id, true); render(); };

// ---------- SOAPSTone tool (any text: the class books, the unit 3 speeches, an article)
const soapSeed = id => { const x = ARG.sources.find(y => y.id === id); if (x) return {title: `${x.author}, "${x.title}" (${x.year})`}; const B = BOOKS[id]; return B ? {title: `${B.author}, ${B.title} (${B.year})`} : {title: ""}; };
V.soap = (mode, id) => {
  if (mode === "new" || !S.soaps.length) {
    const d = S.drafts.soap && (!id || S.drafts.soap.seed === id) ? S.drafts.soap : (S.drafts.soap = {seed: id || "", title: soapSeed(id).title});
    return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>SOAPSTone</h2><p class="lead">Before analyzing any text, pin down its rhetorical situation: Speaker, Occasion, Audience, Purpose, Subject, Tone. A strong rhetorical analysis thesis grows out of the Purpose and Audience rows.</p>
    <div class="card"><label class="f">Text <input type="text" data-in="soapf" data-k="title" value="${esc(d.title)}" placeholder="Author, title (year)"></label>
    ${SOAP_FIELDS.map(([k, t, h]) => `<label class="f">${t} <span class="h">${esc(h)}</span><textarea rows="2" data-in="soapf" data-k="${k}">${esc(d[k] || "")}</textarea></label>`).join("")}
    <div class="row"><button class="btn" data-act="soapsave">Save</button>${id === "asp" ? `<a class="btn ghost" href="#/unit/2/rhetoric">Compare with the model</a>` : ""}</div></div>
    ${S.soaps.length ? `<div class="row"><a class="btn ghost" href="#/soap">My SOAPSTones (${S.soaps.length})</a></div>` : ""}`;
  }
  return `<p class="crumb"><a href="#/write">‹ Write</a></p><h2>My SOAPSTones</h2><div class="row"><a class="btn" href="#/soap/new">+ New SOAPSTone</a><a class="btn ghost" href="#/soap/new/asp">For A Small Place</a></div>
  ${S.soaps.slice().reverse().map(x => `<div class="card"><h3>${esc(x.title || "Untitled")}</h3><p class="meta">${nice(x.d)}</p><table class="tbl">${SOAP_FIELDS.map(([k, t]) => `<tr><th>${t}</th><td>${esc(x[k] || "")}</td></tr>`).join("")}</table></div>`).join("")}`;
};
IN.soapf = el => { const d = S.drafts.soap || (S.drafts.soap = {}); d[el.dataset.k] = el.value; saveSoon(); };
ACT.soapsave = () => {
  const d = S.drafts.soap || {}, filled = SOAP_FIELDS.filter(([k]) => (d[k] || "").trim()).length;
  if (filled < 4) { toast("Fill in at least four of the six rows"); return; }
  S.soaps.push({...d, d: today()}); S.drafts.soap = null; addXP(15); goalTick("draft"); checkBadges(); save(); toast("SOAPSTone saved"); location.hash = "#/soap";
};

// ---------- Debate prep
V.debate = (mode, i) => {
  if (mode === "new" || !S.debates.length) {
    const m = i != null && ARG.debate.motions[Number(i)] ? ARG.debate.motions[Number(i)] : "";
    const d = S.drafts.debate && (!m || S.drafts.debate.motion === m) ? S.drafts.debate : (S.drafts.debate = {motion: m, side: "for", args: [{}, {}, {}], opp: [{}, {}], cx: ["", ""], close: ""});
    const f = (k, label, v, rows = 2) => `<label class="f">${esc(label)}<textarea rows="${rows}" data-in="debf" data-k="${k}">${esc(v || "")}</textarea></label>`;
    return `<p class="crumb"><a href="#/unit/3/debate">‹ Debate</a></p><h2>Debate prep</h2><p class="lead">Build your case and your answers before the round. Prepare both sides when you can: you may not get to choose.</p>
    <div class="card"><label class="f">Motion <input type="text" data-in="debf" data-k="motion" value="${esc(d.motion)}" placeholder="This house would..."></label>
    <label class="tog">Side <select data-in="debside"><option value="for"${d.side === "for" ? " selected" : ""}>For (proposition)</option><option value="against"${d.side === "against" ? " selected" : ""}>Against (opposition)</option></select></label></div>
    ${d.args.map((a, j) => `<div class="card outline"><fieldset><legend>Argument ${j + 1}</legend>${f(`args.${j}.claim`, "Claim", a.claim)}${f(`args.${j}.ev`, "Evidence (with its source)", a.ev)}${f(`args.${j}.why`, "Why it matters (impact)", a.why)}</fieldset></div>`).join("")}
    ${d.opp.map((o, j) => `<div class="card outline"><fieldset><legend>Their likely argument ${j + 1}</legend>${f(`opp.${j}.arg`, "What they'll say (steelman it)", o.arg)}${f(`opp.${j}.ans`, "Your answer", o.ans)}</fieldset></div>`).join("")}
    <div class="card">${f("cx.0", "Cross-examination question 1", d.cx[0], 1)}${f("cx.1", "Cross-examination question 2", d.cx[1], 1)}${f("close", "Closing line: why your side wins", d.close)}
    <div class="row"><button class="btn" data-act="debsave">Save case</button><a class="btn ghost" href="#/lesson/debate">Debate lesson</a></div></div>`;
  }
  return `<p class="crumb"><a href="#/unit/3/debate">‹ Debate</a></p><h2>My debate cases</h2><div class="row"><a class="btn" href="#/debate/new">+ New case</a></div>
  ${S.debates.slice().reverse().map(x => `<div class="card"><span class="pill">${x.side === "for" ? "For" : "Against"}</span><h3 style="margin-top:8px">${esc(x.motion)}</h3><p class="meta">${nice(x.d)}</p>
  <ol class="tight">${x.args.filter(a => a.claim).map(a => `<li><b>${esc(a.claim)}</b>${a.ev ? `<br><span class="quiet">${esc(a.ev)}</span>` : ""}</li>`).join("")}</ol>${x.close ? `<p class="model">${esc(x.close)}</p>` : ""}</div>`).join("")}`;
};
IN.debf = el => { const d = S.drafts.debate || (S.drafts.debate = {motion: "", side: "for", args: [{}, {}, {}], opp: [{}, {}], cx: ["", ""], close: ""}); setPath(d, el.dataset.k, el.value); saveSoon(); };
IN.debside = el => { const d = S.drafts.debate; if (d) { d.side = el.value; save(); } };
ACT.debsave = () => {
  const d = S.drafts.debate;
  if (!d || !d.motion.trim() || d.args.filter(a => (a.claim || "").trim()).length < 2) { toast("Add the motion and at least two arguments"); return; }
  S.debates.push({...JSON.parse(JSON.stringify(d)), d: today()}); S.drafts.debate = null; addXP(25); checkBadges(); save(); toast("Debate case saved"); location.hash = "#/debate";
};
