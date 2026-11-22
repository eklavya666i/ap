// ---------- Screens
const TABS = [["today", "Today"], ["units", "Units"], ["tests", "Tests"], ["mistakes", "Mistakes"], ["progress", "Progress"], ["settings", "Settings"]];
const starsOf = n => "★".repeat(n) + "☆".repeat(3 - n);
const chipOf = id => {
  const st = S.L[id] || {}, c = st.chip || "untouched", due = c === "mastered" && reviewsDue().some(d => d.lesson === id);
  return `<span class="chip${c === "mastered" ? " m" : c === "practicing" ? " p" : ""}">${c === "mastered" ? "Mastered" : c === "practicing" ? "Practicing" : "Untouched"}${due ? ' <i class="due" title="Review due"></i>' : ""}</span>`;
};
const lessonStars = id => { const st = S.L[id] || {}; return (st.chip && st.chip !== "untouched" ? 1 : 0) + (st.chip === "mastered" || (st.rev && st.rev[21] === "ok") ? 1 : 0) + (st.rev && st.rev[21] === "ok" ? 1 : 0); };
const soonCard = l => `<div class="card"><p><b>${esc(l.id)} ${esc(l.title)}</b> is coming in ${LANE(l.u)} of the build.</p><p class="meta">${esc(l.ccss)}${l.added ? " · added from Common Core" : ""}</p></div>`;
const visible = l => S.set.added !== false || !l.added;

const V = {
  today() {
    const Lv = levelOf(S.xp), lo = 50 * Lv * (Lv - 1), hi = 50 * (Lv + 1) * Lv, q = quests(), due = reviewsDue().length;
    const last = S.last && LESSONS[S.last] && LESSONS[S.last].c ? LESSONS[S.last] : null;
    const cur = S.set.current || 1, next = builtLessons(cur).map(id => LESSONS[id]).find(l => (S.L[l.id] || {}).chip !== "mastered" && visible(l)) || null;
    const openDrills = DRILLS.filter(drillOpen), dash = openDrills[dn(today()) % openDrills.length];
    return `<h2>${S.name ? "Hi, " + esc(S.name) : "Welcome to Math 6"}</h2>
<div class="cols">
<div class="card lvl"><div class="lvlrow"><b>Level ${Lv}</b><span>${titleOf(Lv)}</span><span class="sp"></span><span>${S.coins} coins</span></div><div class="bar"><i style="width:${Math.round(100 * (S.xp - lo) / (hi - lo))}%"></i></div><p class="meta">${S.xp} XP · ${hi - S.xp} to level ${Lv + 1} · ${streak()}-day streak${S.streak.freezes ? ` · ${S.streak.freezes} streak freeze${S.streak.freezes > 1 ? "s" : ""}` : ""}</p></div>
<div class="card"><b>Today's quests</b><ul class="quests">${q.list.map(id => { const got = Math.min(q.got[id] || 0, QUESTS[id][1]), done = q.paid.includes(id); return `<li class="${done ? "done" : ""}"><span>${done ? "✓" : "○"} ${esc(QUESTS[id][0])}</span><span class="qbar"><i style="width:${100 * got / QUESTS[id][1]}%"></i></span></li>`; }).join("")}</ul><p class="meta">30 XP each, 50 more for all three.</p></div>
</div>
<div class="cols">
<div class="card"><b>Daily 5-minute test</b><p>${due ? `${due} review${due > 1 ? "s" : ""} due, then fresh questions.` : "Fresh questions from what you've practiced."}</p><a class="btn" href="#/run/daily/${today()}">Start</a></div>
${last ? `<div class="card"><b>Continue</b><p>${esc(last.id)} ${esc(last.title)}</p><a class="btn ghost" href="#/lesson/${last.id}">Open</a></div>` : ""}
${next ? `<div class="card"><b>Up next</b><p>${esc(next.id)} ${esc(next.title)}</p><a class="btn ghost" href="#/lesson/${next.id}">Start</a></div>` : ""}
${S.set.speed !== false && dash ? `<div class="card"><b>Daily Dash</b><p>${esc(dash.name)}: a 60-second Speed Round. Double XP on your first one today.</p><a class="btn ghost" href="#/speed/${dash.id}/round">Go</a></div>` : ""}
</div>
<div class="card"><b>Last 8 weeks</b>${calendarHTML()}</div>`;
  },
  units() {
    return `<h2>Journey map</h2><p class="lead">Ten regions in your list's order. Each stop is a lesson: one star when started, two when mastered, three after its last review.</p>${CURRICULUM.map(U => {
      const ids = U.lessons.map(l => l[0]).filter(id => visible(LESSONS[id])), beaten = (S.boss || {})[U.u];
      const trophies = ["bronze", "silver", "gold"].map(t => S.badges[`u${U.u}-${t}`] ? `<span class="tro ${t}" title="${t} trophy">◆</span>` : "").join("");
      return `<section class="region${U.u === (S.set.current || 1) ? " cur" : ""}" style="--u:${U.color}"><a class="rhead" href="#/unit/${U.u}"><span class="k">Unit ${U.u} · ${starsOf(U.stars)}</span><b>${esc(U.title)}</b>${trophies}</a>
<div class="path">${ids.map(id => { const l = LESSONS[id], s = lessonStars(id); return `<a class="stop${l.c ? "" : " soon"}" href="#/lesson/${id}" aria-label="${esc(id + " " + l.title)}"><span class="ring">${id.split(".")[1]}</span><span class="st">${l.c ? starsOf(s) : "soon"}</span></a>`; }).join("")}<a class="stop boss${beaten ? " won" : ""}" href="#/unit/${U.u}" aria-label="Unit ${U.u} boss"><span class="ring">⚔</span><span class="st">${beaten ? "beaten" : "boss"}</span></a></div></section>`;
    }).join("")}`;
  },
  unit(u) {
    const U = CURRICULUM[Number(u) - 1]; if (!U) return V.units();
    const ids = U.lessons.map(l => l[0]).filter(id => visible(LESSONS[id])), built = builtLessons(U.u), mastered = ids.filter(id => (S.L[id] || {}).chip === "mastered").length;
    const bossOpen = built.length && mastered >= Math.ceil(0.75 * ids.length);
    const tools = built.length ? `<div class="tools">
<a class="btn" href="#/run/t5u/${U.u}">5-minute unit test</a><a class="btn ghost" href="#/run/unit/${U.u}">Unit test (25 questions)</a><a class="btn ghost" href="#/run/shop/${U.u}">Word problem workshop</a><a class="btn ghost" href="#/run/uclock/${U.u}">Unit speed test</a>
${bossOpen ? `<a class="btn ghost" href="#/run/boss/${U.u}">⚔ Boss challenge${(S.boss || {})[U.u] ? " (beaten)" : ""}</a>` : `<span class="btn ghost disabled" aria-disabled="true">⚔ Boss opens at ${Math.ceil(0.75 * ids.length)} mastered (${mastered} now)</span>`}</div>` : `<p class="meta">This unit is built in ${LANE(U.u)}.</p>`;
    return `<p><a href="#/units">← Journey map</a></p><h2 style="color:${U.color}">Unit ${U.u}: ${esc(U.title)}</h2><p class="lead">${ids.length} lessons · ${esc(U.ccss)} · ${mastered} mastered</p>${tools}
<div class="card" style="--u:${U.color}"><ul class="lessons">${ids.map(id => { const l = LESSONS[id]; return `<li><span class="id">${l.id}</span><span class="t"><a href="#/lesson/${l.id}">${esc(l.title)}</a>${l.added ? '<span class="plus" title="Added from Common Core">+</span>' : ""}<br><span class="std">${l.ccss}${l.c ? "" : " · coming soon"}</span></span>${chipOf(l.id)}</li>`; }).join("")}</ul></div>`;
  },
  lesson(id, tab) {
    const l = LESSONS[id]; if (!l) return V.units();
    const head = `<p><a href="#/unit/${l.u}">← Unit ${l.u}: ${esc(l.U.title)}</a></p><h2>${l.id} · ${esc(l.title)}</h2><p class="lead">${l.ccss}${l.added ? " · added from Common Core" : ""} · ${chipOf(id)}</p>`;
    if (!l.c) return head + soonCard(l);
    S.last = id; save();
    tab = tab || "learn";
    const tabs = [["learn", "Learn"], ["practice", "Practice"], ["quiz", "Quiz"], ["test5", "5-Minute Test"], ["notes", "Notes"]];
    const bar = `<div class="ltabs">${tabs.map(([k, t]) => `<a href="#/lesson/${id}/${k}"${k === tab ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div>`;
    if (tab === "learn") { if (!T || T.lesson !== id || T.alt) { teachStart(id); T.i = 0; } CUR = "teach"; setTimeout(teachAuto, 0); return head + bar + `<div id="teach">${teachHTML()}</div>`; }
    if (tab === "practice") { if (!P || P.lesson !== id || P.mode !== "practice" || !Q) practiceStart(id); CUR = "practice"; return head + bar + `<div id="mode">${practiceHTML()}</div>`; }
    if (tab === "quiz" || tab === "test5") { const k = tab === "quiz" ? "quiz" : "t5"; if (!SES || SES.kind !== k || SES.scope !== id || SES.done && SES.stale) startKind(k, id, `#/lesson/${id}`); SES.stale = SES.done; CUR = "ses"; return head + bar + `<div id="mode">${sesHTML()}</div>`; }
    const c = l.c;
    return head + bar + `<div class="card notes"><h3>Big idea</h3><p>${mathHTML(c.notes.idea)}</p><button type="button" class="btn ghost sm" data-say="${esc(c.notes.idea)}">🔊 Listen</button>
<h3>Words to know</h3><dl>${c.vocab.map(([t, d]) => `<dt>${esc(t)} <button type="button" class="ico" data-say="${esc(t + ". " + d)}" aria-label="Hear ${esc(t)}">🔊</button></dt><dd>${mathHTML(d)}</dd>`).join("")}</dl>
<h3>Worked examples</h3>${c.notes.examples.map(e => `<p class="ex">${mathHTML(e)}</p>`).join("")}
<h3>Watch out</h3><p>${mathHTML(c.notes.watch)}</p><ul>${Object.values(c.misconceptions).map(m => `<li>${mathHTML(m)}</li>`).join("")}</ul></div>`;
  },
  run(kind, scope) {
    if (!SES || SES.kind !== kind || String(SES.scope) !== String(scope) || SES.stale) startKind(kind, scope, kind === "daily" ? "#/today" : `#/unit/${scope}`);
    SES.stale = SES.done; CUR = "ses";
    return `<div id="mode">${sesHTML()}</div>`;
  },
  speed(drill, fmt) {
    if (S.set.speed === false) return `<div class="card"><p>Speed tests are turned off in the parent settings.</p></div>`;
    if (!SP || SP.d.id !== drill || SP.fmt !== fmt || SP.stale) speedStart(drill, fmt);
    SP.stale = SP.done; CUR = "speed";
    return `<div id="mode">${speedHTML()}</div>`;
  },
  tests(sub) {
    if (sub === "speed") return `<p><a href="#/tests">← Tests</a></p><h2>Speed tests</h2><p class="lead">Speed Round: 60 seconds, combos multiply your score. Beat the Clock: 20 questions, 5 seconds added per miss. Lightning Ladder: the time limit shrinks, 3 lives.</p>
<div class="grid">${DRILLS.map(d => { const open = drillOpen(d), pb = S.pbs[d.id] || {};
      return `<div class="card drill${open ? "" : " locked"}"><b>${esc(d.name)}</b><p class="meta">${open ? `Best: ${pb.round ? pb.round.score + " pts" : "—"} · ${pb.clock ? mmss(pb.clock.secs) : "—"} · ${pb.ladder ? pb.ladder.n + " rungs" : "—"}` : `Opens with lesson ${d.opens}`}</p>${open ? `<div class="row">${Object.entries(FORMATS).map(([f, t]) => `<button type="button" class="btn ghost sm" data-sp="${d.id}:${f}">${t}</button>`).join("")}</div>` : ""}</div>`; }).join("")}</div>`;
    const units = CURRICULUM.filter(U => builtLessons(U.u).length);
    return `<h2>Tests</h2><div class="grid">
<div class="card"><b>Daily 5-minute test</b><p class="meta">Reviews due today, then fresh questions and one fluency question.</p><a class="btn" href="#/run/daily/${today()}">Start</a></div>
${S.set.speed !== false ? `<div class="card"><b>Speed tests</b><p class="meta">17 drills, 3 formats, medals and personal bests.</p><a class="btn ghost" href="#/tests/speed">Choose a drill</a></div>` : ""}
${units.map(U => `<div class="card" style="border-left:6px solid ${U.color}"><b>Unit ${U.u}: ${esc(U.title)}</b><div class="row"><a class="btn ghost sm" href="#/run/t5u/${U.u}">5-minute test</a><a class="btn ghost sm" href="#/run/unit/${U.u}">Unit test</a><a class="btn ghost sm" href="#/run/shop/${U.u}">Workshop</a><a class="btn ghost sm" href="#/unit/${U.u}">Boss</a></div></div>`).join("")}
<div class="card"><b>MCQ Sprint and Benchmark</b><p class="meta">Arrive in Phase 5, once every unit is built.</p></div></div>
${S.tests.length ? `<div class="card"><b>Recent</b><ul class="hist">${S.tests.slice(-8).reverse().map(t => `<li><span>${esc((KINDS[t.kind] || {title: t.kind}).title)} · ${esc(String(t.scope))}</span><span>${t.right}/${t.n}</span><span>${new Date(t.t).toLocaleDateString("en-US", {month: "short", day: "numeric"})}</span></li>`).join("")}</ul></div>` : ""}`;
  },
  mistakes(sub) {
    if (sub === "practice") { if (!P || P.mode !== "mistakes") practiceStart(null, "mistakes"); CUR = "practice"; return `<p><a href="#/mistakes">← My Mistakes</a></p><h2>Fixing mistakes</h2><div id="mode">${practiceHTML()}</div>`; }
    const list = Object.entries(S.mist).filter(([t]) => TPL[t]), by = {};
    list.forEach(([t, m]) => { (by[m.lesson] = by[m.lesson] || []).push(m); });
    const types = {concept: 0, procedure: 0, careless: 0}; list.forEach(([, m]) => types[m.err] = (types[m.err] || 0) + 1);
    return `<h2>My Mistakes</h2><p class="lead">Every miss lands here and comes back with new numbers. Get it right once to clear it.</p>
${list.length ? `<div class="card"><p>${list.length} to fix · ${S.fixed || 0} fixed so far</p><p class="meta">Concept ${types.concept} · Procedure ${types.procedure} · Slip ${types.careless}</p><a class="btn" href="#/mistakes/practice">Practice these</a></div>
<div class="card"><ul class="lessons">${Object.entries(by).map(([id, ms]) => `<li><span class="id">${id}</span><span class="t">${esc(LESSONS[id].title)}</span><span class="chip">${ms.length}</span></li>`).join("")}</ul></div>` : `<div class="card"><p>Nothing to fix. Nice.</p><p class="meta">${S.fixed || 0} fixed so far.</p></div>`}`;
  },
  progress() {
    const Lv = levelOf(S.xp), earned = BADGES.filter(b => S.badges[b.id]).length;
    const acc = CURRICULUM.map(U => { const a = S.att.filter(x => TPL[x.tpl] && LESSONS[TPL[x.tpl].lesson].u === U.u).slice(-40); return [U, a.length, a.filter(x => x.ok).length]; }).filter(x => x[1]);
    const fams = [...new Set(BADGES.map(b => b.fam))];
    return `<h2>Progress</h2><div class="cols"><div class="card"><b>Level ${Lv} · ${titleOf(Lv)}</b><p class="meta">${S.xp} XP · ${S.coins} coins · ${earned} of ${BADGES.length} badges · ${streak()}-day streak</p></div>
<div class="card"><b>Accuracy by unit</b>${acc.length ? acc.map(([U, n, ok]) => `<div class="accrow"><span>Unit ${U.u}</span><span class="bar"><i style="width:${Math.round(100 * ok / n)}%;background:${U.color}"></i></span><span>${Math.round(100 * ok / n)}%</span></div>`).join("") : '<p class="meta">Starts with your first practice question.</p>'}</div></div>
<div class="card"><b>Mastery grid</b><div class="mgrid">${ORDER.map(id => { const st = S.L[id] || {}, c = st.chip || "untouched"; return `<a href="#/lesson/${id}" class="mc ${c}" title="${esc(id + " " + LESSONS[id].title + ": " + c)}" style="--u:${LESSONS[id].U.color}">${id}</a>`; }).join("")}</div><p class="meta">Filled: mastered · outlined: practicing · faint: untouched</p></div>
<div class="card"><b>Badges</b>${fams.map(f => `<h4>${esc(f)}</h4><div class="badges">${BADGES.filter(b => b.fam === f).map(b => `<span class="bdg${S.badges[b.id] ? " got" : ""}${b.lvl ? " " + b.lvl : ""}" title="${esc(b.rule)}">${esc(b.name)}</span>`).join("")}</div>`).join("")}</div>
<div class="card"><b>Speed records</b><table class="tbl"><thead><tr><th>Drill</th><th>Speed Round</th><th>Beat the Clock</th><th>Ladder</th></tr></thead><tbody>${DRILLS.filter(d => S.pbs[d.id]).map(d => { const p = S.pbs[d.id]; return `<tr><td>${esc(d.name)}</td><td>${p.round ? `${p.round.score} pts, ${p.round.right} right` : "—"}</td><td>${p.clock ? mmss(p.clock.secs) : "—"}</td><td>${p.ladder ? p.ladder.n : "—"}</td></tr>`; }).join("") || '<tr><td colspan="4" class="meta">No speed tests yet.</td></tr>'}</tbody></table></div>
<div class="card"><b>Times tables</b><p class="meta">Green: automatic (3 right in under 3 seconds) · light green: getting there · amber: right but slow · red: missed last time · grey: not seen yet</p>${heatHTML()}</div>`;
  },
  settings() {
    return `<h2>Settings</h2>
<div class="card"><label class="f">Student's name<input type="text" id="name" value="${esc(S.name)}" autocomplete="off" placeholder="First name"></label></div>
<div class="card"><b>Voice and sound</b><div class="toggles">${tog("autoplay", "Start lessons talking as soon as they open", true)}${tog("autoRead", "Read feedback and hints aloud")}${tog("sound", "Sound effects")}${tog("calm", "Calm mode: hide combos, pops and confetti")}</div><a class="btn ghost" href="#/voice">Voice check</a></div>
${OFFLINE ? `<div class="card"><b>Back up progress</b><div class="row"><button type="button" id="bkup" class="btn ghost sm">Back up progress</button><label class="btn ghost sm" for="rst">Restore</label><input id="rst" type="file" accept=".json,application/json,text/plain" class="sr"></div><p class="meta">Last backup: ${S.bk ? nice(S.bk) : "never"}${S.bk && dn(today()) - dn(S.bk) > 14 ? " · time for a new one" : ""}</p></div>` : ""}
<div class="card"><b>Parent</b><p class="meta">Current unit, timers, speed tests, rest days and a summary. PIN-locked.</p><a class="btn ghost" href="#/parent">Open parent settings</a></div>`;
  },
  parent() {
    if (!S.set.pin) return `<h2>Parent settings</h2><div class="card"><label class="f">Choose a 4-digit PIN<input type="text" id="newpin" inputmode="numeric" maxlength="4" autocomplete="off"></label><div class="row"><button type="button" class="btn" data-act="pin-set">Save PIN</button></div></div>`;
    if (!parentOpen) return `<h2>Parent settings</h2><div class="card"><label class="f">PIN<input type="password" id="pin" inputmode="numeric" maxlength="4" autocomplete="off"></label><div class="row"><button type="button" class="btn" data-act="pin-open">Open</button></div></div>`;
    const wk = [...Array(7)].map((_, k) => S.days[addD(today(), -k)] || {}), mins = Math.round(sum(wk.map(d => d.min || 0)));
    const mis = {}; S.att.slice(-300).forEach(a => { if (a.mis) mis[a.mis] = (mis[a.mis] || 0) + 1; });
    const top = Object.entries(mis).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const errs = {concept: 0, procedure: 0, careless: 0}; Object.values(S.mist).forEach(m => errs[m.err] = (errs[m.err] || 0) + 1);
    return `<h2>Parent settings</h2><div class="cols">
<div class="card"><b>This week</b><p>${mins} minutes · ${ORDER.filter(id => (S.L[id] || {}).chip === "mastered").length} lessons mastered · ${S.tests.filter(t => Date.now() - t.t < 7 * 864e5).length} tests · ${streak()}-day streak</p>
<p class="meta">Open mistakes: concept ${errs.concept}, procedure ${errs.procedure}, slip ${errs.careless}</p>${top.length ? `<b>Most common named mistakes</b><ul>${top.map(([m, c]) => `<li>${esc(m.replace(/_/g, " ").toLowerCase())} (×${c})</li>`).join("")}</ul>` : ""}</div>
<div class="card"><label class="f">Current unit<select id="p-cur">${CURRICULUM.map(U => `<option value="${U.u}"${(S.set.current || 1) === U.u ? " selected" : ""}>Unit ${U.u}: ${esc(U.title)}</option>`).join("")}</select></label>
<label class="f">Test timer<select id="p-timer">${[["always", "Always show"], ["last", "Last minute only"], ["never", "Hide"]].map(([v, t]) => `<option value="${v}"${S.set.timer === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
<div class="toggles">${tog("speed", "Speed tests on")}${tog("added", "Show the 12 added Common Core lessons")}</div></div></div>
<div class="card"><b>Rest days</b><p class="meta">Travel or sick days pause the streak instead of breaking it.</p><div class="row"><button type="button" class="btn ghost sm" data-act="rest-today">Rest today</button><button type="button" class="btn ghost sm" data-act="rest-tomorrow">Rest tomorrow</button></div><p class="meta">${(S.set.rest || []).slice(-6).map(nice).join(", ") || "None set"}</p></div>
<div class="card"><b>Reset a lesson</b><div class="row"><select id="p-reset">${ORDER.filter(id => S.L[id]).map(id => `<option value="${id}">${id} ${esc(LESSONS[id].title)}</option>`).join("") || "<option value=''>No lessons started</option>"}</select><button type="button" class="btn ghost sm" data-act="reset-lesson">Reset</button></div></div>
<div class="row"><button type="button" class="btn ghost" data-act="pin-close">Lock parent settings</button></div>`;
  },
  voice() {
    if (!Voice.ok) return `<h2>Voice check</h2><div class="card"><p>This browser has no speech voice, so lessons show captions and move on when you tap Next.</p></div>`;
    const vs = Voice.voices(), cur = Voice.chosen();
    return `<p><a href="#/settings">← Settings</a></p><h2>Voice check</h2><p class="lead">Check that the voice works on this iPad, pick a voice, then play the math lines and listen for anything read wrong.</p>
<div class="card" id="vstat">${voiceStatusHTML()}</div>
<div class="card"><div class="row"><label class="f">Voice<select id="vsel">${vs.map(v => `<option value="${esc(v.voiceURI)}"${cur && v.voiceURI === cur.voiceURI ? " selected" : ""}>${esc(voiceLabel(v))}</option>`).join("")}<option value=""${cur ? "" : " selected"}>iPad's default English voice</option></select></label>
<label class="f">Speed<select id="vrate">${[0.8, 0.9, 1, 1.1].map(r => `<option value="${r}"${(S.set.voice.rate || 1) === r ? " selected" : ""}>${r}×</option>`).join("")}</select></label>
<button type="button" class="btn" id="vall">Play all</button><button type="button" class="btn ghost" id="vstop">Stop</button></div>
<p class="meta">Voices are listed best first. Robotic and cartoon voices are left out.</p></div>
<div class="card">${SPEECH_TEST.map((s, i) => `<div class="say" data-i="${i}"><span class="shown">${esc(s)}</span><span class="spoken">${esc(M6.speak(s))}</span><button type="button" class="btn ghost sm" data-play="${i}" aria-label="Play ${esc(M6.speak(s))}">Play</button></div>`).join("")}</div>`;
  }
};
let parentOpen = false, CUR = null;
function tog(key, label, def = false) { const on = S.set[key] === undefined ? def : !!S.set[key]; return `<label class="tog"><input type="checkbox" data-set="${key}"${on ? " checked" : ""}><span>${esc(label)}</span></label>`; }
// The voice check's status card: is speech working on this iPad, and what to try when it isn't
function voiceStatusHTML() {
  const st = Voice.status, cur = Voice.chosen();
  const line = st.state === "spoke" ? `<p class="okmsg"><b>✓ The voice is working.</b> Last sentence spoken with ${esc(st.voice)}.</p>`
    : st.state === "blocked" ? `<p class="nomsg"><b>✗ The voice didn't start</b> (${esc(st.error || "no sound")}). Try the steps below, then tap the test again.</p>`
    : `<p>Tap the button and listen for a short sentence.</p>`;
  return `<b>Is the voice working?</b>${line}
<div class="row"><button type="button" class="btn" id="vtest">🔊 Say a test sentence</button></div>
<p class="meta">Speech engine: found · English voices on this iPad: ${Voice.voices().length} · Voice in use: ${esc(cur ? voiceLabel(cur) : "the iPad's default English voice")}</p>
${Voice.hasPremium() ? "" : premiumHelpHTML()}
<details${st.state === "blocked" ? " open" : ""}><summary>No sound? Try these, in order</summary><ol class="tips">
<li>Turn the volume up with the buttons on the side of the iPad.</li>
<li>Swipe down from the top-right corner for Control Center. If Silent Mode (the bell) is on, turn it off.</li>
<li>Pick "iPad's default English voice" below, then tap the test again.</li>
<li>On the iPad, open Settings → Accessibility → Spoken Content → Voices → English, and make sure a voice is downloaded.</li>
<li>Close Math 6 completely (swipe it away in the app switcher) and open it again.</li></ol></details>`;
}
Voice.watch = () => { const el = $("#vstat"); if (el) el.innerHTML = voiceStatusHTML(); };
function voiceLabel(v) {
  const q = Voice.quality(v), tag = q === 3 ? "Premium" : q === 2 ? "Enhanced" : "Standard";
  return `${v.name.replace(/\s*\((premium|enhanced)\)/i, "")} · ${tag} · ${v.lang}`;
}
// How to get Apple's Premium voice: the app can only use voices that are downloaded on the device.
function premiumHelpHTML() {
  return `<div class="premhelp"><b>Get the natural Premium voice</b>
<p>This iPad doesn't have a Premium voice yet, so Math 6 is using the best voice it has. Premium voices sound like a real person. Download one once:</p>
<ol class="tips"><li>Open the iPad's Settings → Accessibility → Spoken Content → Voices → English.</li>
<li>Tap a voice such as Ava, Zoe or Evan, then tap the download button next to its Premium version.</li>
<li>When it finishes, close Math 6 completely (swipe it away in the app switcher) and open it again. It will use the Premium voice on its own.</li></ol>
<p class="meta">On a Mac: System Settings → Accessibility → Spoken Content → System voice → Manage Voices. Siri voices can't be used by websites, so Premium is the best voice Math 6 can use.</p></div>`;
}
function calendarHTML() {
  const end = dn(today()), start = end - 55 - ((new Date().getDay() + 6) % 7);
  let s = '<div class="cal">';
  for (let n = start; n <= end; n++) { const k = fromN(n), d = S.days[k]; s += `<i class="${counted(k) ? (d && d.frozen ? "fz" : "on") : ""}${n === end ? " today" : ""}" title="${k}"></i>`; }
  return s + "</div>";
}
function heatHTML() {
  let s = '<div class="heat">';
  for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) {
    const f = S.facts[`${Math.min(a, b)}x${Math.max(a, b)}`], cls = !f ? "" : f.last === false ? "miss" : f.fast >= 3 ? "auto" : (f.slow || 0) > f.fast ? "slow" : "learn";
    s += `<i class="${cls}" title="${a} × ${b}"></i>`;
  }
  return s + "</div>";
}
Object.assign(ACT, {
  "pin-set": () => { const v = ($("#newpin") || {}).value || ""; if (!/^\d{4}$/.test(v)) return toast("Use 4 digits"); S.set.pin = v; parentOpen = true; save(); render(); },
  "pin-open": () => { if ((($("#pin") || {}).value || "") === S.set.pin) { parentOpen = true; render(); } else toast("Wrong PIN"); },
  "pin-close": () => { parentOpen = false; render(); },
  "rest-today": () => { S.set.rest = [...new Set([...(S.set.rest || []), today()])]; save(); render(); },
  "rest-tomorrow": () => { S.set.rest = [...new Set([...(S.set.rest || []), addD(today(), 1)])]; save(); render(); },
  "reset-lesson": () => { const id = ($("#p-reset") || {}).value; if (id && S.L[id]) { delete S.L[id]; save(); toast(`Reset ${id}`); render(); } }
});
