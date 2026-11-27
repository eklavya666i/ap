// ---------- Speed: Speed Round (60 s, combos, ghost of your best), Beat the Clock (20 questions), Lightning Ladder (shrinking timer, 3 lives)
// Speed never counts toward mastery; it has its own records, medals and XP.
const FORMATS = {round: ['Speed Round', '60 seconds. Streaks build a combo: ×2 at 6, ×3 at 11. Medals at 6, 10 and 14 right.'], clock: ['Beat the Clock', '20 questions. Each miss adds 5 seconds. Medals at 2:00, 1:30 and 1:00.'], ladder: ['Lightning Ladder', 'The clock shrinks every rung. Three lives. Medals at 6, 10 and 14 rungs.']};
const clockMedal = s => s <= 60 ? 3 : s <= 90 ? 2 : s <= 120 ? 1 : 0;
let SP = null, spTick = null;
const stopSpeed = () => { if (spTick) { clearInterval(spTick); spTick = null; } };
const dashDrill = () => DRILLS[hashStr('dash' + today()) % DRILLS.length];
const medalOf = n => n >= 14 ? 3 : n >= 10 ? 2 : n >= 6 ? 1 : 0;
const MEDAL = ['', 'b', 's', 'g'], MEDALN = ['', 'Bronze', 'Silver', 'Gold'];
const medalHTML = m => '<span class="medal ' + (m ? MEDAL[m] : 'n') + '" title="' + (m ? MEDALN[m] : 'No medal yet') + '">' + (m ? MEDALN[m][0] : '–') + '</span>';
let spPick = {d: 'mix', fmt: 'round'};
function vSpeed() {
  top('Speed'); setTab('speed');
  if (S.set.speed === false) { main.innerHTML = '<div class="wrap"><section class="card"><p>Speed tests are turned off in parent settings.</p></section></div>'; return; }
  const dd = dashDrill(), dashDone = day().dash;
  main.innerHTML = '<div class="wrap"><p class="lede">Fast recall on the facts every problem leans on: symbols, ions, sig figs, molar masses and more. Questions are generated fresh, so you never run out.</p>'
    + '<button class="pcard gold' + (dashDone ? '' : ' hot') + '" data-a="dash">' + ic('bolt') + '<div><b>Daily Dash: ' + dd.name + '</b><span>' + (dashDone ? 'Done today — come back tomorrow.' : 'A 60-second Speed Round. Double XP on your first one today.') + '</span></div>' + ic('chev') + '</button>'
    + '<h2 class="h2">Format</h2><div class="seg" role="group">' + Object.keys(FORMATS).map(f => '<button data-a="spfmt" data-f="' + f + '" aria-pressed="' + (spPick.fmt === f) + '">' + FORMATS[f][0] + '</button>').join('') + '</div><p class="meta">' + FORMATS[spPick.fmt][1] + '</p>'
    + '<h2 class="h2">Drill</h2><div class="drills"><button class="drill" data-a="spd" data-d="mix" aria-pressed="' + (spPick.d === 'mix') + '">' + ic('target') + '<div><b>Mixed</b><small>All ' + DRILLS.length + ' drills</small></div></button>'
    + DRILLS.map(d => { const p = S.pbs[d.id] || {}; return '<button class="drill" data-a="spd" data-d="' + d.id + '" aria-pressed="' + (spPick.d === d.id) + '">' + medalHTML(p.medal || 0) + '<div><b>' + d.name + '</b><small>' + (p.round ? 'Best ' + p.round.right + ' right' : 'No record yet') + '</small></div></button>'; }).join('') + '</div>'
    + '<div class="cta"><button class="btn pri big" data-a="spgo">Start ' + FORMATS[spPick.fmt][0] + '</button></div></div>';
}
function spStart(dId, fmt, dash) {
  const pb = ((S.pbs[dId] || {})[fmt]) || null;
  SP = {d: dId, fmt, dash: !!dash, t0: Date.now(), score: 0, right: 0, miss: [], combo: 0, best: 0, n: 0, pen: 0, lives: 3, limit: 10000, qt: Date.now(), lock: false, done: false, pb, recent: []};
  spNext(); vSpeedQ();
  stopSpeed(); spTick = setInterval(spUpdate, 100);
}
function spNext() {
  let g = null, t = 0;
  while (!g && t < 50) { const d = SP.d === 'mix' ? rpk(DRILLS) : DRILLS.find(x => x.id === SP.d); g = drillQ(d); if (g && SP.recent.includes(g.q)) g = null; else if (g) g.dn = d.name; t++; }
  g.perm = shuf([0, 1, 2, 3]); SP.cur = g; SP.qt = Date.now(); SP.recent.push(g.q); SP.recent = SP.recent.slice(-8);
}
function spCard() { const g = SP.cur; return (SP.d === 'mix' ? '<div class="qmeta"><span class="tag">' + esc(g.dn) + '</span></div>' : '') + '<div class="prompt">' + R(g.q) + '</div><div class="choices two">' + g.perm.map((ci, k) => '<button class="ch" data-a="spans" data-ci="' + ci + '"><span class="lt">' + 'ABCD'[k] + '</span><span class="ct">' + R(g.c[ci]) + '</span></button>').join('') + '</div>'; }
function vSpeedQ() {
  const name = SP.d === 'mix' ? 'Mixed' : DRILLS.find(x => x.id === SP.d).name;
  top(FORMATS[SP.fmt][0], '<span class="timer" id="stm"></span>'); setTab('speed');
  main.innerHTML = '<div class="wrap"><div class="sbar"><div class="tbar"><i id="tbi"></i></div><span class="num" id="sct"></span></div>'
    + (SP.fmt === 'round' && SP.pb ? '<div class="ghost" aria-hidden="true"><i id="gh"></i><b id="me"></b><span>you vs. your best (' + SP.pb.right + ')</span></div>' : '')
    + '<p class="meta" id="sinfo">' + esc(name) + '</p><section class="card qcard" id="sq">' + spCard() + '</section><div class="cta"><button class="btn" data-a="spstop">Stop</button></div></div>';
  spUpdate();
}
function spUpdate() {
  if (!SP || SP.done) return;
  const t = (Date.now() - SP.t0) / 1000, bi = $('#tbi'), ct = $('#sct'), tm = $('#stm'), mult = SP.combo >= 11 ? 3 : SP.combo >= 6 ? 2 : 1;
  if (SP.fmt === 'round') {
    const l = Math.max(0, 60 - t);
    if (bi) bi.style.width = (100 * l / 60).toFixed(2) + '%';
    if (ct) ct.innerHTML = 'Score <b>' + SP.score + '</b> · <span class="combo' + (mult > 1 && !S.set.calm ? ' hot' : '') + '">combo ' + SP.combo + (mult > 1 ? ' ×' + mult : '') + '</span>';
    if (tm) { tm.textContent = mmss(Math.ceil(l)); tm.className = 'timer' + (l < 10 ? ' low' : ''); }
    const gh = $('#gh'), me = $('#me'); if (gh && SP.pb) { const pace = SP.pb.right * Math.min(t, 60) / 60, top_ = Math.max(SP.pb.right, SP.right, 1); gh.style.width = (100 * pace / top_) + '%'; me.style.width = (100 * SP.right / top_) + '%'; }
    if (l <= 0 && !SP.lock) spEnd();
  } else if (SP.fmt === 'clock') {
    if (bi) bi.style.width = (100 * SP.n / 20) + '%';
    if (ct) ct.textContent = Math.min(SP.n + 1, 20) + ' / 20 · ' + SP.miss.length + ' missed';
    if (tm) tm.textContent = mmss(t + SP.pen);
  } else {
    const l = Math.max(0, SP.limit - (Date.now() - SP.qt));
    if (bi) bi.style.width = (100 * l / SP.limit).toFixed(1) + '%';
    if (ct) ct.innerHTML = 'Rung <b>' + SP.right + '</b> · ' + '♥'.repeat(SP.lives) + '♡'.repeat(3 - SP.lives);
    if (tm) { tm.textContent = (l / 1000).toFixed(1) + ' s'; tm.className = 'timer' + (l < 2500 ? ' low' : ''); }
    if (l <= 0 && !SP.lock) spAnswer(-1);
  }
}
function spAnswer(ci) {
  if (!SP || SP.lock || SP.done) return; SP.lock = true;
  const ok = ci === 0; SP.n++;
  if (ok) { SP.right++; SP.combo++; SP.best = Math.max(SP.best, SP.combo); SP.score += SP.combo >= 11 ? 3 : SP.combo >= 6 ? 2 : 1; if (SP.fmt === 'ladder') SP.limit = Math.max(3000, SP.limit - 500); }
  else { SP.combo = 0; SP.miss.push(SP.cur); if (SP.fmt === 'clock') SP.pen += 5; if (SP.fmt === 'ladder') SP.lives--; }
  beep(ok);
  $$('#sq .ch').forEach(b => { const c = +b.dataset.ci; b.disabled = true; if (c === 0) b.classList.add('ok'); else if (c === ci) b.classList.add('no'); });
  setTimeout(() => {
    if (!SP || SP.done) return; SP.lock = false;
    if ((SP.fmt === 'clock' && SP.n >= 20) || (SP.fmt === 'ladder' && SP.lives <= 0) || (SP.fmt === 'round' && Date.now() - SP.t0 >= 60000)) return spEnd();
    spNext(); const sq = $('#sq'); if (sq) sq.innerHTML = spCard(); spUpdate();
  }, ok ? 280 : 900);
}
function spEnd() {
  if (!SP || SP.done) return; SP.done = true; stopSpeed();
  const secs = (Date.now() - SP.t0) / 1000, rec = S.pbs[SP.d] || (S.pbs[SP.d] = {}), old = rec[SP.fmt];
  const res = SP.fmt === 'round' ? {score: SP.score, right: SP.right, on: today()} : SP.fmt === 'clock' ? {secs: Math.round(secs + SP.pen), on: today()} : {n: SP.right, on: today()};
  const valid = SP.fmt !== 'clock' || SP.n >= 20;
  const better = valid && (!old || (SP.fmt === 'round' ? res.score > old.score : SP.fmt === 'clock' ? res.secs < old.secs : res.n > old.n));
  if (better) rec[SP.fmt] = res;
  const medal = SP.fmt === 'clock' ? (valid ? clockMedal(res.secs) : 0) : medalOf(SP.right);
  rec.medal = Math.max(rec.medal || 0, medal);
  if (SP.fmt === 'ladder') S.explore.ladder = Math.max(S.explore.ladder || 0, SP.right);
  let xp = SP.right + (better && old ? 25 : 0);
  if (SP.dash && !day().dash) { xp *= 2; day().dash = 1; }
  active(); addXP(xp); bumpQuest('speed'); save(); checkBadges();
  top(FORMATS[SP.fmt][0] + ': results');
  main.innerHTML = '<div class="wrap"><section class="card score"><div class="big-n">' + (SP.fmt === 'round' ? SP.score + '<span> points</span>' : SP.fmt === 'clock' ? (valid ? mmss(res.secs) : SP.n + '<span> / 20</span>') : SP.right + '<span> rungs</span>') + (better ? '<span class="newbest">' + (old ? 'New best' : 'First record') + '</span>' : '') + '</div>'
    + '<p>' + (SP.fmt === 'round' ? SP.right + ' right · best combo ' + SP.best : SP.fmt === 'clock' ? SP.right + ' / ' + SP.n + ' right · ' + SP.pen + ' s penalty' : 'Climbed ' + SP.right + ' rung' + (SP.right === 1 ? '' : 's')) + ' · +' + xp + ' XP' + (SP.dash ? ' (Daily Dash: double)' : '') + '</p>'
    + '<p class="row2">' + (medal ? medalHTML(medal) + '<b>' + MEDALN[medal] + ' medal</b>' : '<span class="meta">' + (SP.fmt === 'clock' ? (valid ? 'Finish in 2:00 or less for bronze.' : 'Answer all 20 to set a time.') : '6 ' + (SP.fmt === 'ladder' ? 'rungs' : 'right') + ' earns bronze.') + '</span>') + (!better && old ? '<span class="meta">Best: ' + (SP.fmt === 'round' ? old.score + ' points' : SP.fmt === 'clock' ? mmss(old.secs) : old.n + ' rungs') + '</span>' : '') + '</p></section>'
    + (SP.miss.length ? '<h2 class="h2">Misses</h2><section class="card">' + SP.miss.map(g => '<div class="miss"><div>' + R(g.q) + '</div><div><b>Answer:</b> ' + R(g.c[0]) + '</div><p class="stx">' + R(g.x) + '</p></div>').join('') + '</section>' : '')
    + '<div class="cta"><button class="btn pri big" data-a="spagain">Go again</button><button class="btn big" data-a="nav" data-to="speed">Change drill</button></div></div>';
  window.scrollTo(0, 0);
}
Object.assign(ACT, {
  spfmt: t => { spPick.fmt = t.dataset.f; vSpeed(); },
  spd: t => { spPick.d = t.dataset.d; vSpeed(); },
  spgo: () => { quietHash('speed'); spStart(spPick.d, spPick.fmt, false); window.scrollTo(0, 0); },
  dash: () => { quietHash('speed'); spStart(dashDrill().id, 'round', true); window.scrollTo(0, 0); },
  spans: t => spAnswer(+t.dataset.ci),
  spstop: () => { if (SP && SP.n) spEnd(); else { SP = null; stopSpeed(); go('speed'); } },
  spagain: () => spStart(SP.d, SP.fmt, false)
});
