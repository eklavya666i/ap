// ---------- Today: setup, what to do next, due soon, reading, review cards, a drill of the day, goals, streak; and the review-card player
const unitSelect = () => `<label class="f">Your class is on<select data-in="unit">${COURSE.units.map(U => `<option value="${U.u}"${U.u === S.set.unit ? " selected" : ""}>Unit ${U.u}: ${esc(U.title)}${U.text !== U.title && !U.writing ? ` (${esc(U.text)})` : ""}</option>`).join("")}</select></label>`;
function calHTML() {
  const k = today(), cells = [];
  for (let i = 55; i >= 0; i--) { const d = addD(k, -i), x = S.days[d]; cells.push(`<i class="${x && x.frozen ? "fz" : counted(d) ? "on" : ""}${d === k ? " today" : ""}" title="${d}"></i>`); }
  return `<div class="cal" aria-label="Last 8 weeks">${cells.join("")}</div>`;
}
function drillOfDay() {
  const recentFix = {}; for (const c of S.checks.slice(-5)) for (const [a, v] of Object.entries(c.areas || {})) if (v !== "ok") recentFix[a] = (recentFix[a] || 0) + 1;
  const top = Object.entries(recentFix).sort((a, b) => b[1] - a[1])[0];
  const pick = top && DRILL[ROW_DRILL[top[0]]];
  if (pick && !(S.drills[pick.id] || {}).n) return pick;
  const fresh = DRILLS.filter(d => !(S.drills[d.id] || {}).n);
  const pool = fresh.length ? fresh : DRILLS;
  return pool[dn(today()) % pool.length];
}
IN.name = el => { S.name = el.value.trim().slice(0, 30); save(); renderStats(); };
ACT.setupdone = () => { S.seen.setup = today(); save(); render(); };
V.today = () => {
  const h = new Date().getHours(), hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening", U = UNIT(S.set.unit) || UNIT(3);
  const setup = !S.seen.setup ? `<div class="card hi"><h3>Set up in a minute</h3>
    <label class="f">Your first name<input type="text" data-in="name" value="${esc(S.name)}" maxlength="30" autocomplete="given-name"></label>
    ${unitSelect()}
    ${Object.values(BOOKS).map(B => `<div class="row">${readSelect(B.id)}<span class="meta"><i>${esc(B.title)}</i></span></div>`).join("")}<p class="meta">Guides, quizzes and review cards stay hidden past the point you've read, so nothing gets spoiled.</p>
    <div class="row"><a class="btn ghost" href="#/asg/new">Add your next assignment</a><button class="btn" data-act="setupdone">Done</button></div></div>` : "";
  const R = recs().slice(0, 3);
  const soon = S.asg.filter(a => !a.done && daysTo(a.due) <= 7).sort((a, b) => a.due < b.due ? -1 : 1);
  const G = goals(), dc = dueCards(), d = drillOfDay(), B = bookOfUnit(U.u), b = B ? B.id : BOOK0, r = readTo(b), w = W(b).ch.toLowerCase();
  const seenL = ARG.lessons.filter(l => S.seen["lesson:" + l.id]).length, nextL = ARG.lessons.find(l => !S.seen["lesson:" + l.id]);
  return `<h2>${hello}${S.name ? ", " + esc(S.name) : ""}</h2><p class="lead">${nice(today())} · Unit ${U.u}: ${esc(U.title)}${B ? ` · ${B.title === U.title ? "" : `<i>${esc(B.title)}</i>, `}read through ${r ? w + " " + r : `no ${W(b).chs.toLowerCase()} yet`}` : U.workshop ? ` · ${seenL} of ${ARG.lessons.length} lessons opened` : ""}</p>
  ${setup}
  <div class="card"><h3>Do these next</h3><ul class="list">${R.map(recHTML).join("")}</ul><div class="row"><a class="btn ghost sm" href="#/coach">More in Coach</a></div></div>
  <div class="cols">
  <div class="card"><h3>Due this week</h3>${soon.length ? `<ul class="list">${soon.map(a => { const ns = nextStep(a); return `<li><a class="go" href="#/asg/${a.id}"><span class="t"><b>${esc(a.title)}</b><br><span class="s">${dueWords(a.due)}${ns ? " · next: " + esc(ns[1].toLowerCase()) : ""}</span></span></a>${daysTo(a.due) <= 1 ? `<span class="chip fix">soon</span>` : ""}</li>`; }).join("")}</ul>` : `<p class="meta">Nothing due in the next 7 days.</p>`}<div class="row"><a class="btn ghost sm" href="#/asg/new">+ Add assignment</a></div></div>
  ${U.u === ASP.unit ? todayRhet() : ""}
  <div class="card"><h3>${U.workshop ? "Workshop" : U.writing ? "Writing unit" : "Reading"}</h3>${B ? `<p class="meta"><i>${esc(B.title)}</i></p><div class="row" style="margin:0">${readSelect(b)}</div>
    <div class="row">${r < B.chapters_n ? `<a class="btn sm" href="${chHref(b, r + 1)}">${W(b).ch} ${r + 1}: before you read</a>` : ""}${r ? `<button class="btn ghost sm" data-act="quiz" data-arg="ch:${b}:${r}">${W(b).ch} ${r} check</button>` : ""}</div>`
    : U.workshop ? `<p class="meta">${seenL} of ${ARG.lessons.length} argument lessons opened.</p><div class="row">${nextL ? `<a class="btn sm" href="#/lesson/${nextL.id}">Next: ${esc(nextL.title)}</a>` : `<a class="btn sm" href="#/debate">Debate prep</a>`}<button class="btn ghost sm" data-act="quiz" data-arg="fallacies">Fallacy finder</button></div>`
    : U.writing ? `<p class="meta">${esc(U.product)}: the guide, drills and your day-by-day plan are in Write.</p><div class="row"><a class="btn sm" href="#/guide/${U.essay}">${esc(ESSAY(U.essay).name)} guide</a><a class="btn ghost sm" href="#/asg/new">Plan it</a></div>`
    : `<p class="meta">The reading guide for <i>${esc(U.text)}</i> is coming. Writing guides and drills are ready now.</p><div class="row"><a class="btn ghost sm" href="#/unit/${U.u}">Unit ${U.u}</a></div>`}</div>
  <div class="card"><h3>Review cards</h3><p class="meta">${dc.due.length} due · ${dc.fresh.length} new today</p><div class="row"><a class="btn sm${dc.all.length ? "" : " ghost"}" href="#/review">${dc.all.length ? `Review ${dc.all.length} cards` : "All caught up"}</a></div></div>
  <div class="card"><h3>Drill of the day</h3><p><b>${esc(d.title)}</b><br><span class="meta">${esc(SKILLS[d.skill])} · about two minutes</span></p><div class="row"><a class="btn sm" href="#/drill/${d.id}">Start</a></div></div>
  <div class="card"><h3>Today's goals</h3><ul class="goals">${G.list.map(id => { const [t, n] = GOALS[id], got = Math.min(n, G.got[id] || 0), ok = G.paid.includes(id); return `<li class="${ok ? "done" : ""}"><span>${ok ? "✓ " : ""}${esc(t)}</span><span class="gbar"><i style="width:${pct(got, n)}%"></i></span></li>`; }).join("")}</ul><p class="meta">+25 XP each, +40 for all three.</p></div>
  <div class="card"><h3>Streak: ${streak()} day${streak() === 1 ? "" : "s"}</h3><p class="meta">A day counts when you finish all three goals or study 10 minutes.${S.streak.freezes ? ` ${S.streak.freezes} streak freeze${S.streak.freezes > 1 ? "s" : ""} saved.` : ""}</p>${calHTML()}</div>
  </div>`;
};

function todayRhet() {
  const n = rhReady().find(r => !r.done), go = r => r.arg ? `<button class="btn sm" data-act="quiz" data-arg="${r.arg}">${esc(r.go)}</button>` : `<a class="btn sm" href="${r.href}">${esc(r.go)}</a>`;
  return `<div class="card"><h3>Intro to Rhetoric</h3><p class="meta">${rhCount()} of 6 ready steps done for the in-class write and debates.</p>
  ${n ? `<p><b>Next: ${esc(n.label)}</b><br><span class="meta">${esc(n.detail)}</span></p><div class="row">${go(n)}<a class="btn ghost sm" href="#/rhetoric">Toolkit</a></div>`
    : `<p class="meta">Every step done. Stay sharp with a sample test.</p><div class="row"><button class="btn sm" data-act="quiz" data-arg="rhet:s2">Sample test B</button><a class="btn ghost sm" href="#/rhetoric">Toolkit</a></div>`}</div>`;
}

// ---------- Review cards
let REV = null;
ACT.rflip = () => { if (REV) { REV.flipped = true; render(); } };
ACT.rgrade = a => { if (!REV) return; const c = REV.queue[REV.i]; gradeCard(c.id, a === "1"); REV.done++; if (a !== "1") REV.again.push(c); REV.i++; REV.flipped = false; render(); };
ACT.ragain = () => { REV = {queue: REV.again, i: 0, flipped: false, done: 0, again: []}; render(); };
V.review = () => {
  if (!REV) REV = {queue: dueCards().all.slice(0, 30), i: 0, flipped: false, done: 0, again: []};
  if (REV.i >= REV.queue.length) {
    return `<p class="crumb"><a href="#/today">‹ Today</a></p><div class="card okc"><h2>${REV.done ? `Done: ${REV.done} card${REV.done === 1 ? "" : "s"}` : "All caught up"}</h2><p class="meta">${REV.again.length ? `${REV.again.length} to see again.` : "Cards come back on a schedule: 1, 3, 7, 21, then 60 days."}</p>
      <div class="row">${REV.again.length ? `<button class="btn" data-act="ragain">Go again (${REV.again.length})</button>` : ""}<a class="btn ghost" href="#/today">Back to Today</a></div></div>`;
  }
  const c = REV.queue[REV.i], box = (S.cards[c.id] || {}).box || 0;
  return `<p class="crumb"><a href="#/today">‹ Today</a></p><div class="tesbar"><b>Review</b><span>${REV.i + 1} of ${REV.queue.length}</span><span class="sp"></span><span class="chip">${esc(c.kind)}</span>${box ? `<span class="chip">box ${box}</span>` : `<span class="chip ac">new</span>`}</div>
  <div class="card flip"><div class="front">${esc(c.front)}</div>${REV.flipped ? `<div class="back">${esc(c.back)}</div>${c.extra ? `<div class="meta">${esc(c.extra)}</div>` : ""}` : ""}</div>
  <div class="row" style="justify-content:center">${REV.flipped ? `<button class="btn ghost" data-act="rgrade" data-arg="0">Not yet</button><button class="btn" data-act="rgrade" data-arg="1">Knew it</button>` : `<button class="btn" data-act="rflip">Show the answer</button>`}</div>`;
};
