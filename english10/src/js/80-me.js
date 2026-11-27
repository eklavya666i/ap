// ---------- Me: level, streak, stats and badges; Settings with backup and restore; the parent summary behind a PIN
V.me = () => {
  const Lv = levelOf(S.xp), lo = 50 * Lv * (Lv - 1), hi = 50 * (Lv + 1) * Lv;
  const checks = S.quizzes.filter(q => q.kind === "ch"), acc = checks.length ? pct(sum(checks.map(q => q.right)), sum(checks.map(q => q.n))) : null;
  const stat = (n, t) => `<div class="card" style="margin:0"><div class="big">${n}</div><div class="meta" style="margin:0">${t}</div></div>`;
  const fams = [...new Set(BADGES.map(b => b.fam))];
  return `<h2>${S.name ? esc(S.name) : "Me"}</h2>
  <div class="card"><div class="row" style="margin:0;align-items:baseline"><span class="big">Level ${Lv}</span><span class="chip ac">${titleOf(Lv)}</span><span class="sp"></span><span class="meta">${S.xp} XP · ${hi - S.xp} to level ${Lv + 1}</span></div>
  <span class="bar"><i style="width:${pct(S.xp - lo, hi - lo)}%"></i></span></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${stat(streak(), "day streak")}${Object.values(BOOKS).map(B => stat(`${readTo(B.id)}/${B.chapters_n}`, `${B.title} ${W(B.id).chs.toLowerCase()}`)).join("")}${stat(acc == null ? "–" : acc + "%", "reading-check accuracy")}${stat(S.quizzes.length, "quizzes finished")}
  ${stat(sum(Object.values(S.cards).map(c => c.n || 0)), "cards reviewed")}${stat(S.quotes.length, "quotations logged")}${stat(sum(Object.values(S.drills).map(d => d.n || 0)), "drills done")}${stat(S.writes.length, "timed writes")}${stat(S.asg.filter(a => a.done).length, "assignments finished")}${stat(S.rub.length, "rubric scores")}</div>
  <div class="card" style="margin-top:14px"><h3>Streak</h3>${calHTML()}</div>
  <div class="card"><h3>Badges · ${BADGES.filter(b => S.badges[b.id]).length} of ${BADGES.length}</h3>${fams.map(f => `<h4>${esc(f)}</h4><div class="badges">${BADGES.filter(b => b.fam === f).map(b => `<span class="bdg${S.badges[b.id] ? " got" : ""}" title="${esc(b.rule)}">${S.badges[b.id] ? "★ " : ""}${esc(b.name)}</span>`).join("")}</div>`).join("")}</div>
  <div class="row"><a class="btn ghost" href="#/settings">Settings and backup</a><a class="btn ghost" href="#/parent">Parent view</a></div>`;
};

V.settings = () => `<p class="crumb"><a href="#/me">‹ Me</a></p><h2>Settings</h2>
  <div class="card"><label class="f">First name<input type="text" data-in="name" value="${esc(S.name)}" maxlength="30"></label>
  ${unitSelect()}
  ${Object.values(BOOKS).map(B => `<div class="row">${readSelect(B.id)}<span class="meta"><i>${esc(B.title)}</i></span></div>`).join("")}</div>
  <div class="card"><h3>Comfort</h3><div class="toggles">
  <label class="tog"><input type="checkbox" data-in="setflag" data-k="sound"${S.set.sound ? " checked" : ""}> Sounds for right and wrong answers</label>
  <label class="tog"><input type="checkbox" data-in="setflag" data-k="calm"${S.set.calm ? " checked" : ""}> Calm mode: no confetti, pops or sounds</label>
  <label class="tog"><input type="checkbox" data-in="setflag" data-k="big"${S.set.big ? " checked" : ""}> Larger text</label></div></div>
  <div class="card"><h3>Backup</h3><p class="meta">Progress lives only on this iPad. Back it up to Files now and then, or move it to another device.${S.bk ? ` Last backup: ${nice(S.bk)}.` : ""}</p>
  <div class="row"><button class="btn" id="bkup">Back up progress</button><label class="btn ghost">Restore from a backup<input type="file" id="rst" accept="application/json,.json,text/plain" hidden></label></div></div>
  <div class="card"><h3>Parent PIN</h3><p class="meta">A four-digit PIN for the parent summary. It keeps the summary separate; it isn't security.</p>
  <div class="row"><input type="password" inputmode="numeric" maxlength="4" id="pinset" placeholder="${S.set.pin ? "Change PIN" : "Set a PIN"}" style="width:9em"><button class="btn ghost sm" data-act="setpin">Save PIN</button></div></div>
  <div class="card"><h3>Start over</h3><p class="meta">Deletes all progress on this iPad: assignments, quotations, drafts, scores.</p><div class="row"><button class="btn warn sm" data-act="reset">Reset everything</button></div></div>
  <p class="meta">${esc(COURSE.name)} (${esc(COURSE.code)}), ${esc(COURSE.school)}. Units follow your 2026–27 syllabus.</p>`;
IN.unit = el => { S.set.unit = Number(el.value); save(); render(); };
IN.setflag = el => { S.set[el.dataset.k] = el.checked; save(); document.body.classList.toggle("big", !!S.set.big); };
ACT.setpin = () => { const v = ($("#pinset").value || "").trim(); if (!/^\d{4}$/.test(v)) { toast("Use four digits"); return; } S.set.pin = v; save(); toast("PIN saved"); render(); };
ACT.reset = () => { if (!confirm("Delete all progress on this iPad?")) return; if (!confirm("Really delete everything? This can't be undone unless you have a backup.")) return; S = fresh(); save(); location.hash = "#/today"; render(); };

let PARENT_OK = false;
ACT.unlock = () => { if (($("#pin").value || "") === S.set.pin) { PARENT_OK = true; render(); } else toast("That PIN doesn't match"); };
V.parent = () => {
  if (!S.set.pin) return `<p class="crumb"><a href="#/me">‹ Me</a></p><h2>Parent view</h2><div class="card"><p>Set a four-digit parent PIN in <a href="#/settings">Settings</a> first. The parent view shows a summary of progress, never drafts or quotations.</p></div>`;
  if (!PARENT_OK) return `<p class="crumb"><a href="#/me">‹ Me</a></p><h2>Parent view</h2><div class="card"><div class="row"><input type="password" inputmode="numeric" maxlength="4" id="pin" placeholder="PIN" style="width:8em"><button class="btn" data-act="unlock">Open</button></div></div>`;
  const wk = Array.from({length: 7}, (_, i) => S.days[addD(today(), -i)]).filter(Boolean), mins = Math.round(sum(wk.map(d => d.min || 0)));
  const checks = S.quizzes.filter(q => q.kind === "ch"), rows = rowAverages();
  return `<p class="crumb"><a href="#/me">‹ Me</a></p><h2>Parent view</h2><p class="lead">A summary only. Drafts and quotations stay private to the student.</p>
  <div class="cols"><div class="card"><h3>This week</h3><p>${mins} active minutes · streak ${streak()} days · ${wk.filter(d => d.done).length} days with all goals done</p>
  <p>Current unit: ${esc((UNIT(S.set.unit) || {}).title || "")}. Reading: ${Object.values(BOOKS).map(B => `<i>${esc(B.title)}</i> through ${W(B.id).ch.toLowerCase()} ${readTo(B.id)} of ${B.chapters_n}`).join("; ")}. Argument lessons opened: ${ARG.lessons.filter(l => S.seen["lesson:" + l.id]).length} of ${ARG.lessons.length}.</p><p>Reading checks: ${checks.length} taken${checks.length ? `, ${pct(sum(checks.map(q => q.right)), sum(checks.map(q => q.n)))}% right` : ""}.</p>
  <p>Timed writes: ${S.writes.length} · Drafts checked: ${S.checks.length} · Claude feedback used: ${S.ai.length}</p></div>
  <div class="card"><h3>Assignments</h3>${S.asg.length ? `<table class="tbl">${S.asg.slice().sort((a, b) => a.due < b.due ? 1 : -1).slice(0, 10).map(a => { const ns = nextStep(a); return `<tr><td>${esc(a.title)}</td><td>${a.done ? `done ${nice(a.done)}${a.done <= a.due ? "" : " (late)"}` : dueWords(a.due)}</td><td>${a.done ? "" : ns ? esc(ns[1]) : ""}</td></tr>`; }).join("")}</table>` : `<p class="meta">None added yet.</p>`}</div>
  <div class="card"><h3>Self-scored rubric rows</h3>${Object.keys(rows).length ? `<div class="bars">${Object.values(rows).map(b => `<span>${esc(b.name)}</span><span class="bar"><i style="width:${pct(b.sum / b.n, 4)}%"></i></span><span>${(b.sum / b.n).toFixed(1)}</span>`).join("")}</div>` : `<p class="meta">No rubric scores yet.</p>`}</div></div>`;
};
