// ---------- Screens: Today, Practice, Tests, Me (progress, badges, mistakes, settings), Parent, backup and restore
const MIS = {lost_restriction: 'Lost a canceled restriction', numerator_zero: 'Excluded a numerator zero', divisor_numerator: "Forgot the divisor's numerator", big_denominator: 'Missed the big denominator',
  canceled_terms: 'Canceled terms, not factors', not_simplified: 'Not fully simplified', not_combined: 'Not one fraction', sign: 'Sign slip', opposites: 'Opposites like a − x',
  kept_extraneous: 'Kept an extraneous root', threw_out_valid: 'Threw out a good root', missed_root: 'Missed a root', no_check: "Didn't check the answer", not_built_up: 'Numerator not built up',
  added_denominators: 'Added denominators', minus_not_distributed: "Didn't distribute the minus", no_flip: "Didn't flip the divisor", wrong_flip: 'Flipped the wrong fraction',
  not_factored: 'Not factored', not_complete: 'Not completely factored', gcf_inside: 'GCF left inside', rates_vs_times: 'Added times, not rates', series_rule: 'Used the series rule',
  forgot_flip: 'Forgot to flip 1/R', wrong_pair: 'Wrong factor pair', square_not_difference: 'Squared instead of difference of squares', upside_down: 'Upside down', canceled_wrong: 'Canceled the wrong factor',
  missing_value: 'Missed an excluded value', extra_value: 'Extra excluded value', not_equal: 'Answer not equivalent', wrong_y: 'Wrong y-value', averaged: 'Averaged instead of using rates', bank: 'Classic trap', trap: 'Trap'};
const misName = id => MIS[id] || String(id || 'miss').replace(/_/g, ' ');
const GENERIC = ['not_equal', 'unreadable', 'blank', 'miss', 'trap', 'bank'];   // misses that don't name a specific trap
const TABS = [['today', 'Today', 'sun'], ['learn', 'Learn', 'book'], ['practice', 'Practice', 'pencil'], ['tests', 'Tests', 'clock'], ['speed', 'Speed', 'bolt'], ['me', 'Me', 'me']];
const tt = $('#tt'), trr = $('#tr'), bk = $('#bk'), main = $('#main');
$('#tabs').innerHTML = TABS.map(t => '<button class="tab" data-a="tab" data-go="' + t[0] + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>').join('');
function statChips(compact) { const st = streak(); return '<span class="chipst fl" title="Streak">' + ic('flame') + '<b>' + st + '</b><span> day' + (st === 1 ? '' : 's') + '</span></span>' + (compact ? '' : '<span class="chipst lv" title="Level">' + ic('star') + '<b>' + levelOf(S.xp) + '</b><span> level</span></span><span class="chipst co" title="Coins">' + ic('coin') + '<b>' + S.coins + '</b><span> coins</span></span>'); }
let topCompact = false;
function top(title, right, back) { tt.textContent = title; topCompact = !!right; trr.innerHTML = (right || '') + '<span id="stc" class="row2" style="gap:12px">' + statChips(topCompact) + '</span>'; if (back) { bk.hidden = false; bk.dataset.to = back[0]; bk.textContent = '‹ ' + back[1]; } else bk.hidden = true; }
function renderStats() { const s = $('#stc'); if (s) s.innerHTML = statChips(topCompact); const due = reviewsDue().length; $$('.tab').forEach(b => { const old = b.querySelector('.dot'); if (old) old.remove(); if (b.dataset.go === 'today' && due) b.insertAdjacentHTML('beforeend', '<span class="dot">' + due + '</span>'); }); }
function setTab(t) { $$('.tab').forEach(b => b.setAttribute('aria-current', b.dataset.go === t ? 'page' : 'false')); }
function calendarHTML() { const end = dn(today()), start = end - 55 - ((new Date().getDay() + 6) % 7); let s = '<div class="cal" aria-label="Last 8 weeks">'; for (let n = start; n <= end; n++) { const k = fromN(n), d = S.days[k]; s += '<i class="' + (counted(k) ? (d && d.frozen ? 'fz' : 'on') : (S.set.rest || []).includes(k) ? 'rs' : '') + (n === end ? ' today' : '') + '" title="' + k + '"></i>'; } return s + '</div>'; }

/* ----- Today ----- */
function vToday() {
  top('Today'); setTab('today');
  const Lv = levelOf(S.xp), lo = lvlFloor(Lv), hi = lvlFloor(Lv + 1), q = quests(), due = reviewsDue(), mist = Object.keys(S.mist).length, st = streak();
  const next = SKILLS.find(k => L(k).chip !== 'mastered'), dd = dashDrill();
  let plan = '<button class="pcard' + (due.length ? ' hot' : '') + '" data-a="daily">' + ic('clock') + '<div><b>Daily 5-minute test</b><span>' + (due.length ? due.length + ' review' + (due.length > 1 ? 's' : '') + ' due' + (due.length <= 2 ? ' (' + due.map(k => SK[k].n).join(', ') + ')' : '') + (day().done ? '. Done today, but run it again to clear them.' : ', then fresh questions.') : day().done ? 'Done today. Take it again any time.' : 'Fresh questions from what you\'ve practiced.') + '</span></div>' + ic('chev') + '</button>';
  if (next) plan += S.ls[next] ? '<button class="pcard" data-a="pskill" data-k="' + next + '">' + ic('pencil') + '<div><b>Up next: ' + SK[next].n + '</b><span>Practice to mastery · ' + Math.min(L(next).run.length, 3) + ' of 3 in a row</span></div>' + ic('chev') + '</button>'
    : '<button class="pcard" data-a="nav" data-to="lesson-' + next + '">' + ic('book') + '<div><b>Up next: ' + SK[next].n + '</b><span>Start with the lesson · ' + (/every/i.test(SK[next].sh) ? 'used in every sheet problem' : 'covers ' + SK[next].sh) + '</span></div>' + ic('chev') + '</button>';
  else plan += '<button class="pcard" data-a="unit">' + ic('trophy') + '<div><b>All eight skills mastered</b><span>Take the unit test, or face the boss.</span></div>' + ic('chev') + '</button>';
  if (mist) plan += '<button class="pcard red" data-a="mistakes">' + ic('wrench') + '<div><b>My Mistakes: ' + mist + ' to fix</b><span>Each comes back with new numbers. Get it right once to clear it.</span></div>' + ic('chev') + '</button>';
  if (S.set.speed !== false) plan += '<button class="pcard gold" data-a="dash">' + ic('bolt') + '<div><b>Daily Dash: ' + dd.name + '</b><span>' + (day().dash ? 'Done today.' : '60-second Speed Round · double XP on your first one today') + '</span></div>' + ic('chev') + '</button>';
  plan += '<button class="pcard" data-a="nav" data-to="sheet">' + ic('sheet') + '<div><b>Review sheet</b><span>' + Object.keys(S.sh).length + ' of 12 problems marked confident</span></div>' + ic('chev') + '</button>';
  main.innerHTML = '<div class="wrap"><section class="card lvl"><div class="badge-lv">' + Lv + '</div><div><b>' + (S.name ? 'Hi, ' + esc(S.name) : 'Rational Expressions · Detailed') + '</b><p class="meta">Level ' + Lv + ' · ' + titleOf(Lv) + ' · ' + (S.xp - lo) + ' / ' + (hi - lo) + ' XP to level ' + (Lv + 1) + '</p>' + bar(100 * (S.xp - lo) / (hi - lo), 'y') + '<div class="stats"><span class="chipst fl">' + ic('flame') + st + '-day streak</span>' + (S.streak.freezes ? '<span class="chipst">' + S.streak.freezes + ' streak freeze' + (S.streak.freezes > 1 ? 's' : '') + '</span>' : '') + '<span class="chipst co">' + ic('coin') + S.coins + ' coins</span><span class="chipst lv">' + ic('star') + Object.keys(S.badges).length + ' / ' + BADGES.length + ' badges</span><span class="chipst">' + masteredCount() + ' / 8 mastered</span></div></div></section>'
    + '<h2 class="h2">Today\'s plan</h2><div class="plan">' + plan + '</div>'
    + '<div class="grid2" style="margin-top:18px"><section class="card"><h3>Today\'s quests</h3>' + q.list.map(id => { const got = Math.min(q.got[id] || 0, QUESTS[id][1]), done = q.paid.includes(id); return '<div class="quest' + (done ? ' done' : '') + '">' + ic(done ? 'check' : 'target') + '<span style="flex:1">' + QUESTS[id][0] + '</span>' + bar(100 * got / QUESTS[id][1], done ? 'g' : '') + '<span class="num">' + got + '/' + QUESTS[id][1] + '</span></div>'; }).join('') + '<p class="meta">30 XP each, plus 50 for all three.</p></section>'
    + '<section class="card"><h3>Last 8 weeks</h3>' + calendarHTML() + '<p class="meta">A day counts with the daily test or 10 minutes of practice.</p></section></div></div>';
}

/* ----- Practice hub ----- */
function vPractice() {
  top('Practice'); setTab('practice');
  const mist = Object.values(S.mist), types = {concept: 0, procedure: 0, slip: 0}; mist.forEach(m => { types[m.cat] = (types[m.cat] || 0) + 1; });
  let h = '<div class="wrap">' + (SES && !SES.done && ['practice', 'mistakes'].includes(SES.kind) ? '<section class="card row2" style="justify-content:space-between"><span>' + esc(SES.title) + ' in progress · ' + SES.n + ' answered</span><button class="btn pri" data-a="resume">Resume</button></section>' : '')
    + '<p class="lede">Practice to mastery: 3 right in a row with no hints, including a Standard or Stretch question. Fresh numbers every time.</p>'
    + '<section class="card row2" style="justify-content:space-between"><span><b>Answer style</b><br><span class="meta">Type answers on the keypad, or pick from choices.</span></span><div class="seg" role="group"><button data-a="style" data-v="type" aria-pressed="' + (S.set.style !== 'mc') + '">Type</button><button data-a="style" data-v="mc" aria-pressed="' + (S.set.style === 'mc') + '">Choices</button></div></section>'
    + '<div class="grid2">' + (mist.length ? '<button class="pcard red" data-a="mistakes">' + ic('wrench') + '<div><b>My Mistakes · ' + mist.length + '</b><span>Concept ' + types.concept + ' · Procedure ' + types.procedure + ' · Slip ' + (types.slip || 0) + '</span></div>' + ic('chev') + '</button>' : '<div class="pcard">' + ic('check') + '<div><b>My Mistakes</b><span>Nothing to fix. ' + S.fixed + ' fixed so far.</span></div></div>')
    + '<button class="pcard" data-a="pmix">' + ic('target') + '<div><b>Mixed practice</b><span>Skills you haven\'t mastered yet, shuffled.</span></div>' + ic('chev') + '</button></div>'
    + '<h2 class="h2">Skills</h2><div class="grid2">';
  D.skills.forEach(s => {
    const st = L(s.k), acc = skillAcc(s.k), r = nextReview(s.k);
    h += '<section class="card skc"><div><b style="font-family:var(--serif);font-size:19px">' + s.n + '</b>' + chipHTML(s.k) + '<p class="meta">' + s.sh + ' · ' + (acc === null ? 'not started' : acc + '% recent accuracy') + (st.chip === 'mastered' && r ? ' · next review ' + niceDate(r.due) : '') + '</p></div>'
      + (st.chip !== 'mastered' ? '<div class="mrun" style="margin:0"><span class="pips">' + [0, 1, 2].map(k => '<i class="' + (k < Math.min(st.run.length, 3) ? 'on' : '') + '"></i>').join('') + '</span><span class="meta">in a row</span></div>' : '')
      + '<div class="row2"><button class="btn pri sm" data-a="pskill" data-k="' + s.k + '">Practice</button><button class="btn sm" data-a="quiz" data-k="' + s.k + '">Quiz</button><button class="btn sm" data-a="five" data-k="' + s.k + '">5-min test</button><button class="btn sm" data-a="nav" data-to="lesson-' + s.k + '">Lesson</button></div></section>';
  });
  main.innerHTML = h + '</div></div>';
}

/* ----- Tests hub ----- */
function vTests() {
  top('Tests'); setTab('tests');
  const due = reviewsDue(), mc = masteredCount();
  const card = (a, icn, t, s, em, extra) => '<button class="tcard' + (extra || '') + '" data-a="' + a + '">' + ic(icn) + '<b>' + t + '</b><span>' + s + '</span>' + (em ? '<em>' + em + '</em>' : '') + '</button>';
  const last = kind => { const t = S.tests.filter(x => x.kind === kind).slice(-1)[0]; return t ? 'Last: ' + t.s + ' / ' + t.n : ''; };
  main.innerHTML = '<div class="wrap"><p class="lede">Test conditions: no hints and no feedback until you submit. Every test ends with each question worked out.</p><div class="grid3">'
    + card('daily', 'clock', 'Daily 5-minute test', due.length ? due.length + ' review' + (due.length > 1 ? 's' : '') + ' due, then fresh questions' : 'Fresh questions from what you\'ve practiced', day().done ? 'Done today' : 'Counts for your streak')
    + card('unit', 'sheet', 'Unit test', '25 questions across all eight skills · 40 minutes', last('unit'))
    + card('sim', 'flag2', 'Test sim', '15 classic questions weighted like the review sheet · 25 minutes', last('sim'))
    + card('workshop', 'wrench', 'Word-problem workshop', 'Pick the right model first, then solve · 4 problems', S.explore.workshop ? S.explore.workshop + ' solved so far' : '')
    + card('boss', mc >= 6 ? 'trophy' : 'lock', 'Boss challenge', '12 hard questions, 3 lives', mc >= 6 ? (S.boss ? 'Beaten ' + S.boss + '×' : 'Unlocked') : 'Unlocks at 6 of 8 mastered (' + mc + ' now)', mc >= 6 ? '' : ' lock')
    + '<button class="tcard" data-a="nav" data-to="sheet">' + ic('sheet') + '<b>Review sheet</b><span>Your 12 original problems, solved</span><em>' + Object.keys(S.sh).length + ' / 12 confident</em></button></div>'
    + '<p class="meta" style="margin-top:12px">Per-skill quizzes and 5-minute tests are on each skill card in Practice.</p>'
    + (S.tests.length ? '<h2 class="h2">Recent results</h2><section class="card list">' + S.tests.slice(-8).reverse().map(t => '<div class="row static"><span class="rt"><b>' + esc(t.title) + '</b><span>' + new Date(t.d).toLocaleDateString() + ' · ' + mmss(t.t) + '</span></span><span class="rm">' + bar(100 * t.s / Math.max(1, t.n), t.s === t.n ? 'g' : '') + '<span class="num">' + t.s + '/' + t.n + '</span></span></div>').join('') + '</section>' : '') + '</div>';
}

/* ----- Me: progress, badges, mistakes, settings ----- */
function vMe() {
  top('Me'); setTab('me');
  const Lv = levelOf(S.xp), mis = {}; S.att.slice(-400).forEach(a => { if (a.mis && !GENERIC.includes(a.mis)) mis[a.mis] = (mis[a.mis] || 0) + 1; });
  const topMis = Object.entries(mis).sort((a, b) => b[1] - a[1]).slice(0, 5), fams = [...new Set(BADGES.map(b => b.fam))];
  const vs = Voice.voices(), cur = Voice.chosen();
  main.innerHTML = '<div class="wrap"><section class="card lvl"><div class="badge-lv">' + Lv + '</div><div><b>' + titleOf(Lv) + '</b><p class="meta">' + S.xp + ' XP · ' + S.coins + ' coins · ' + Object.keys(S.badges).length + ' of ' + BADGES.length + ' badges · best run ' + S.best + ' in a row</p><div class="row2" style="margin-top:8px"><button class="btn sm gold" data-a="buyfreeze"' + (S.coins < 100 || S.streak.freezes >= 2 ? ' disabled' : '') + '>' + ic('coin') + 'Buy a streak freeze · 100 coins</button><span class="meta">You have ' + S.streak.freezes + ' of 2.</span></div></div></section>'
    + '<h2 class="h2">Mastery</h2><div class="mgrid">' + D.skills.map(s => { const c = chipOf(s.k), r = nextReview(s.k), sub = c === 'due' ? 'Day-' + r.stage + ' review due' : c === 'mastered' ? (r ? 'Mastered · next review ' + niceDate(r.due) : 'Mastered · locked in') : c === 'practicing' ? 'Practicing · ' + Math.min(L(s.k).run.length, 3) + ' of 3 in a row' : 'Not started'; return '<button class="mcell ' + c + '" data-a="pskill" data-k="' + s.k + '" style="text-align:left;cursor:pointer;background-color:inherit">' + s.n + '<br><span class="meta">' + sub + '</span></button>'; }).join('') + '</div>'
    + '<div class="grid2" style="margin-top:14px"><section class="card"><h3>Accuracy (last 40 each)</h3>' + D.skills.map(s => { const a = skillAcc(s.k); return '<div class="row2" style="margin:6px 0"><span style="width:44%">' + s.n + '</span><span style="flex:1">' + bar(a || 0, a >= 80 ? 'g' : '') + '</span><span class="num">' + (a === null ? '—' : a + '%') + '</span></div>'; }).join('') + '</section>'
    + '<section class="card"><h3>Most common mistakes</h3>' + (topMis.length ? topMis.map(([m, c]) => '<div class="row2" style="margin:6px 0;justify-content:space-between"><span>' + esc(misName(m)) + '</span><span class="num">×' + c + '</span></div>').join('') : '<p class="meta">None yet.</p>') + '<div class="cta"><button class="btn sm" data-a="nav" data-to="mistakes">My Mistakes (' + Object.keys(S.mist).length + ')</button></div></section></div>'
    + '<h2 class="h2">Badges</h2>' + fams.map(f => '<h3 style="font-size:17px;margin:12px 0 6px">' + f + '</h3><div class="bdg">' + BADGES.filter(b => b.fam === f).map(b => '<div class="bd' + (S.badges[b.id] ? ' got' : '') + '" title="' + esc(b.rule) + '">' + ic('star') + '<span><b>' + esc(b.name) + '</b><br><span class="meta" style="font-size:12px">' + esc(b.rule) + '</span></span></div>').join('') + '</div>').join('')
    + '<h2 class="h2">Speed records</h2><section class="card scroll"><table class="tb"><thead><tr><th>Drill</th><th>Medal</th><th class="r">Round</th><th class="r">Clock</th><th class="r">Ladder</th></tr></thead><tbody>' + (DRILLS.concat([{id: 'mix', name: 'Mixed'}]).filter(d => S.pbs[d.id]).map(d => { const p = S.pbs[d.id]; return '<tr><td>' + d.name + '</td><td>' + medalHTML(p.medal || 0) + '</td><td class="r">' + (p.round ? p.round.score + ' pts' : '—') + '</td><td class="r">' + (p.clock ? mmss(p.clock.secs) : '—') + '</td><td class="r">' + (p.ladder ? p.ladder.n : '—') + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="meta">No speed tests yet.</td></tr>') + '</tbody></table></section>'
    + '<h2 class="h2">Settings</h2><section class="card"><label class="f">Your name<input id="sname" type="text" value="' + esc(S.name) + '" placeholder="First name" autocomplete="off"></label>'
    + '<div class="f">Answer style<div class="seg" role="group"><button data-a="style" data-v="type" aria-pressed="' + (S.set.style !== 'mc') + '">Type on the keypad</button><button data-a="style" data-v="mc" aria-pressed="' + (S.set.style === 'mc') + '">Choices</button></div></div>'
    + '<label class="f">Voice<select id="svoice">' + (vs.length ? vs.map(v => '<option value="' + esc(v.voiceURI) + '"' + (cur && cur.voiceURI === v.voiceURI ? ' selected' : '') + '>' + esc(v.name) + '</option>').join('') : '<option>Default voice</option>') + '</select></label>'
    + '<div class="row2"><button class="btn sm" data-a="vcheck">' + ic('sound') + 'Voice check</button><span class="meta">Speed: ' + (S.set.voice.rate || 1) + '× (change it on the lesson player)</span></div>'
    + '<label class="tog"><input type="checkbox" data-set="autoRead"' + (S.set.autoRead ? ' checked' : '') + '>Read feedback and hints aloud</label><label class="tog"><input type="checkbox" data-set="sound"' + (S.set.sound ? ' checked' : '') + '>Sound effects</label><label class="tog"><input type="checkbox" data-set="calm"' + (S.set.calm ? ' checked' : '') + '>Calm mode: no confetti or combo flashes</label></section>'
    + '<section class="card"><h3>Backup</h3><p class="meta">Progress lives on this device. Back it up to Files, or move it to another iPad with Restore.' + (S.bk ? ' Last backup: ' + niceDate(S.bk) + (dn(today()) - dn(S.bk) > 14 ? ' — time for a new one.' : '.') : ' No backup yet.') + '</p><div class="cta"><button class="btn" data-a="backup">' + ic('save') + 'Back up progress</button><button class="btn" data-a="restorepick">Restore</button><input type="file" id="rfile" accept=".json,application/json" hidden></div></section>'
    + '<section class="card"><h3>Parent</h3><p class="meta">Weekly summary, timers, speed tests, rest days and resets. PIN-locked.</p><div class="cta"><button class="btn" data-a="nav" data-to="parent">' + ic('lock') + 'Parent settings</button></div></section>'
    + '<p class="foot" id="offl">' + offText() + '</p></div>';
}
function vMistakes() {
  top('My Mistakes', '', ['me', 'Me']); setTab('me');
  const list = Object.values(S.mist).sort((a, b) => b.t - a.t), by = {};
  list.forEach(m => { (by[m.s] = by[m.s] || []).push(m); });
  main.innerHTML = '<div class="wrap"><p class="lede">Every miss lands here and comes back with new numbers. Get it right once to clear it. ' + S.fixed + ' fixed so far.</p>' + (list.length ? '<div class="cta"><button class="btn pri big" data-a="mistakes">Fix them now (' + list.length + ')</button></div>' + D.skills.filter(s => by[s.k]).map(s => '<section class="card"><h3>' + s.n + ' · ' + by[s.k].length + '</h3>' + by[s.k].map(m => '<div class="miss"><div><span class="cat">' + CATN[m.cat || 'procedure'] + '</span> <b>' + esc(misName(m.id)) + '</b>' + (m.n > 1 ? ' <span class="num">×' + m.n + '</span>' : '') + '</div>' + (m.why ? '<p class="stx">' + R(m.why) + '</p>' : '') + '</div>').join('') + '</section>').join('') : '<section class="card"><p>Nothing to fix. Nice.</p></section>') + '</div>';
}

/* ----- Parent (PIN) ----- */
let parentOpen = false;
function vParent() {
  top('Parent settings', '', ['me', 'Me']); setTab('me');
  if (!S.set.pin) { main.innerHTML = '<div class="wrap"><section class="card"><label class="f">Choose a 4-digit PIN<input type="password" id="newpin" inputmode="numeric" maxlength="4" autocomplete="off"></label><button class="btn pri" data-a="pinset">Set PIN</button></section></div>'; return; }
  if (!parentOpen) { main.innerHTML = '<div class="wrap"><section class="card"><label class="f">PIN<input type="password" id="pin" inputmode="numeric" maxlength="4" autocomplete="off"></label><button class="btn pri" data-a="pinopen">Open</button></section></div>'; return; }
  const wk = [...Array(7)].map((_, k) => S.days[addD(today(), -k)] || {}), mins = Math.round(sum(wk.map(d => d.min || 0))), errs = {concept: 0, procedure: 0, slip: 0};
  Object.values(S.mist).forEach(m => { errs[m.cat] = (errs[m.cat] || 0) + 1; });
  const mis = {}; S.att.slice(-300).forEach(a => { if (a.mis && !GENERIC.includes(a.mis)) mis[a.mis] = (mis[a.mis] || 0) + 1; }); const topMis = Object.entries(mis).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const wkTests = S.tests.filter(t => Date.now() - t.d < 7 * 864e5);
  main.innerHTML = '<div class="wrap"><section class="card"><h3>This week</h3><p>' + mins + ' minute' + (mins === 1 ? '' : 's') + ' · ' + wk.filter(d => d.done).length + ' daily test' + (wk.filter(d => d.done).length === 1 ? '' : 's') + ' · ' + wkTests.length + ' test' + (wkTests.length === 1 ? '' : 's') + ' in all · ' + masteredCount() + ' of 8 skills mastered · ' + streak() + '-day streak</p><p class="meta">Open mistakes: concept ' + errs.concept + ', procedure ' + errs.procedure + ', slip ' + (errs.slip || 0) + '.</p>'
    + (topMis.length ? '<p><b>Most common named mistakes:</b> ' + topMis.map(([m, c]) => esc(misName(m)) + ' (×' + c + ')').join(', ') + '</p>' : '') + (wkTests.length ? '<p class="meta">Scores: ' + wkTests.map(t => esc(t.title) + ' ' + t.s + '/' + t.n).join(' · ') + '</p>' : '') + '</section>'
    + '<section class="card"><h3>Test timer</h3><div class="seg" role="group">' + [['always', 'Always show'], ['last', 'Last minute only'], ['never', 'Hide']].map(([v, t]) => '<button data-a="ptimer" data-v="' + v + '" aria-pressed="' + (S.set.timer === v) + '">' + t + '</button>').join('') + '</div><label class="tog"><input type="checkbox" data-set="speed"' + (S.set.speed !== false ? ' checked' : '') + '>Speed tests on</label></section>'
    + '<section class="card"><h3>Rest days</h3><p class="meta">Travel or tournament days pause the streak instead of breaking it.</p><div class="cta"><button class="btn sm" data-a="rest" data-d="0">Rest today</button><button class="btn sm" data-a="rest" data-d="1">Rest tomorrow</button><button class="btn sm" data-a="restclear">Clear rest days</button></div><p class="meta">' + ((S.set.rest || []).slice(-6).map(niceDate).join(', ') || 'None set') + '</p></section>'
    + '<section class="card"><h3>Reset</h3><label class="f">Reset one skill<select id="rskill">' + D.skills.map(s => '<option value="' + s.k + '">' + s.n + '</option>').join('') + '</select></label><div class="cta"><button class="btn sm" data-a="resetskill">Reset this skill</button><button class="btn sm" data-a="resetall">Reset everything</button><button class="btn sm" data-a="pinclear">Change PIN</button></div></section>'
    + '<div class="cta"><button class="btn" data-a="pinclose">' + ic('lock') + 'Lock parent settings</button></div></div>';
}
/* ----- backup and restore ----- */
async function backup() {
  const name = 'rational-detailed-backup-' + today() + '.json', data = JSON.stringify(S);
  try { const f = new File([data], name, {type: 'application/json'}); if (navigator.canShare && navigator.canShare({files: [f]})) { await navigator.share({files: [f], title: 'Rational Prep Detailed backup'}); S.bk = today(); save(); checkBadges(); toast('Backed up'); vMe(); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); a.download = name; document.body.appendChild(a); a.click(); a.remove(); S.bk = today(); save(); checkBadges(); toast('Backup saved'); vMe(); } catch (e) { toast('Backup is not available here.'); }
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => { try { const j = JSON.parse(r.result); if (!j || j.v !== 1 || !j.days) throw 0; confirmBox('Replace the progress on this device with the backup' + (j.upd ? ' from ' + new Date(j.upd).toLocaleDateString() : '') + '?', 'Restore', () => { S = loadState(j); save(); toast('Progress restored'); route(true); }); } catch (e) { toast("That file isn't a Rational Prep Detailed backup."); } };
  r.readAsText(file);
}
let SWOK = false;
function offText() { if (SWOK) return 'Saved for offline use on this device.'; if (/claude/i.test(location.hostname) || !/^https?:$/.test(location.protocol)) return 'Online preview. Install from the GitHub link for offline use.'; return 'Saving an offline copy…'; }
Object.assign(ACT, {
  style: t => { S.set.style = t.dataset.v; save(); route(true); },
  resume: () => { if (SES && !SES.done) { quietHash('practice'); sesShowQ(); } },
  buyfreeze: () => { if (S.coins >= 100 && S.streak.freezes < 2) { S.coins -= 100; S.streak.freezes++; save(); toast('Streak freeze bought'); vMe(); } },
  vcheck: () => Voice.say(['This is your voice. $x^2-49$ factors as $(x-7)(x+7)$. $\\f{x-7}{x+7}$, and $x\\ne-7$.']),
  backup: () => backup(),
  restorepick: () => { const f = $('#rfile'); if (f) f.click(); },
  pinset: () => { const v = ($('#newpin') || {}).value || ''; if (!/^\d{4}$/.test(v)) return toast('Use 4 digits'); S.set.pin = v; parentOpen = true; save(); vParent(); },
  pinopen: () => { if ((($('#pin') || {}).value || '') === S.set.pin) { parentOpen = true; vParent(); } else toast('Wrong PIN'); },
  pinclose: () => { parentOpen = false; go('me'); },
  pinclear: () => confirmBox('Clear the PIN? You can set a new one next time.', 'Clear PIN', () => { S.set.pin = null; parentOpen = false; save(); vParent(); }),
  ptimer: t => { S.set.timer = t.dataset.v; save(); vParent(); },
  rest: t => { const k = addD(today(), +t.dataset.d); S.set.rest = S.set.rest || []; if (!S.set.rest.includes(k)) S.set.rest.push(k); save(); toast('Rest day set: ' + niceDate(k)); vParent(); },
  restclear: () => { S.set.rest = []; save(); vParent(); },
  resetskill: () => { const k = ($('#rskill') || {}).value; if (!k) return; confirmBox('Reset ' + SK[k].n + '? Its mastery and reviews start over.', 'Reset', () => { delete S.L[k]; save(); toast(SK[k].n + ' reset'); vParent(); }); },
  resetall: () => confirmBox('Reset all progress on this device? XP, badges, mastery and history are cleared.', 'Reset everything', () => { const pin = S.set.pin; S = fresh(); S.set.pin = pin; save(); SES = null; toast('Progress reset'); go('today'); })
});
