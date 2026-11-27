const TOL = 0.02, MIN_SHOTS = 10, S_LOW = 1.40, L_LO = 13, L_HI = 15.5, SP_HI = 2800, SP_LO = 2000, SPIN_FLOOR = 2000;
const DECAY = 0.85, BAND_LO = 0.4, BAND_HI = 1.8, LEFT_WARN = 0.15;
const ESSENTIALS = ['club_speed', 'ball_speed', 'smash_device', 'launch', 'spin', 'carry', 'total', 'shots'];
const num = WB.num;

(function () {
  const el = document.getElementById('bench');
  let rows = [];
  try { rows = JSON.parse(el ? el.textContent : '[]'); } catch (e) { rows = []; }
  dash.set('benchmarks', Array.isArray(rows) ? rows : []);
})();

/* Imported sessions grouped by week: driver shots combined, with per-shot points for the dashboard. */
function importWeeksOf(imports, target) {
  const groups = new Map();
  imports.forEach((i) => { if (Number.isInteger(i.week) && Math.abs(i.week) <= 260) { const g = groups.get(i.week) || []; g.push(i); groups.set(i.week, g); } });
  const PT = ['carry', 'total', 'offline', 'hla', 'axis', 'face', 'path', 'f2p', 'attack', 'dyn_loft', 'peak', 'descent', 'launch', 'spin', 'club_speed', 'ball_speed'];
  return [...groups.entries()].map(([week, g]) => {
    const cols = WB.COLS.filter((c) => g.some((i) => i.cols.includes(c)));
    const rows = g.flatMap((i) => { const at = cols.map((c) => i.cols.indexOf(c)); return i.shots.map((r) => at.map((k) => (k < 0 ? null : r[k]))); });
    const dates = [...new Set(g.map((i) => i.date).filter(Boolean))].sort();
    if (!rows.length) return null;
    const st = WB.shotStats(cols, rows, target);
    const at = PT.map((c) => cols.indexOf(c));
    const pts = rows.map((r, n) => { const o = {used: st.dots[n].used}; PT.forEach((c, j) => { const v = at[j] < 0 ? null : r[at[j]]; o[c] = typeof v === 'number' && isFinite(v) ? v : null; }); return o; });
    const wa = g.reduce((a, i) => { const c = i._doc && i._doc.conditions; return c && typeof c.altitude_ft === 'number' ? [a[0] + c.altitude_ft * i.shots.length, a[1] + i.shots.length] : a; }, [0, 0]);
    return Object.assign({week, date: dates[0] || '', files: g.map((i) => i.file), n_sessions: g.length, driver: g[0].driver, cols, pts, alt: wa[1] ? wa[0] / wa[1] : null}, st);
  }).filter(Boolean).sort((a, b) => a.week - b.week);
}
dash.calc('csvweeks', {inputs: ['imports'], fn: (imports) => importWeeksOf(imports, Number(dash.params().smash_target))});

dash.calc('sessionrows', {
  inputs: ['imports_all'],
  fn: (imports) => {
    const target = Number(dash.params().smash_target);
    return imports.map((i) => {
      const s = WB.shotStats(i.cols, i.shots, target);
      return {id: i.id, week: i.week, date: i.date, file: i.file, driver: i.driver, clubs: i.clubs, n_all: i.n_all, imported_at: i.imported_at, conditions: i._doc && i._doc.conditions ? WB.cleanConditions(i._doc.conditions) : null, n_used: s.n_used, n_left: s.n_left, club_speed: s.club_speed, ball_speed: s.ball_speed, smash: s.club_speed && s.ball_speed ? s.ball_speed / s.club_speed : null, launch: s.launch, spin: s.spin, carry: s.carry};
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.imported_at || '').localeCompare(a.imported_at || ''));
  },
});

dash.calc('latestshots', {
  inputs: ['csvweeks'],
  fn: (csv) => (csv.length ? csv[csv.length - 1].dots.map((d) => Object.assign({week: csv[csv.length - 1].week}, d)) : []),
});

/* Typed weeks and imported weeks merged: imported numbers win, typed context stays. */
function mergeWeeks(sessions, csv) {
  {
    const NUMS = ['club_speed', 'ball_speed', 'smash_device', 'launch', 'spin', 'carry', 'total', 'shots', 'attack', 'dyn_loft', 'club_path', 'face_angle', 'offline', 'temp', 'sim_alt'];
    const TEXTS = ['date', 'impact', 'tee', 'device', 'setup', 'note'];
    const FROM_CSV = ['club_speed', 'ball_speed', 'smash_device', 'launch', 'spin', 'carry', 'total', 'attack', 'dyn_loft', 'club_path', 'face_angle'];
    const by = new Map();
    sessions.forEach((s) => { const w = num(s.week); if (w !== null && Number.isInteger(w) && Math.abs(w) <= 260) by.set(w, {typed: s, imp: null}); });
    csv.forEach((c) => { const e = by.get(c.week) || {typed: null, imp: null}; e.imp = c; by.set(c.week, e); });
    const out = [];
    by.forEach((e, w) => {
      const r = {week: w};
      NUMS.forEach((k) => { r[k] = e.typed ? num(e.typed[k]) : null; });
      TEXTS.forEach((k) => { const v = e.typed ? e.typed[k] : null; r[k] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null; });
      if (e.imp) {
        const i = e.imp;
        FROM_CSV.forEach((k) => { if (i[k] !== null && i[k] !== undefined) r[k] = i[k]; });
        r.shots = i.n_used;
        if (i.sd_offline !== null) r.offline = i.sd_offline;
        if (!r.date && i.date) r.date = i.date;
        if (!r.device) r.device = 'GSPro export';
      }
      r.source = e.imp && e.typed ? 'GSPro + typed' : e.imp ? 'GSPro' : 'Typed';
      r.has_import = !!e.imp; r.has_typed = !!e.typed;
      r.files = e.imp ? e.imp.files : []; r.n_sessions = e.imp ? e.imp.n_sessions : 0; r.n_left = e.imp ? e.imp.n_left : null; r.n_total = e.imp ? e.imp.n_total : null;
      r.smash_src = e.imp ? e.imp.smash_src : null; r.pct_target = e.imp ? e.imp.pct_target : null;
      out.push(r);
    });
    return out.sort((a, b) => a.week - b.week);
  }
}
dash.calc('weeks', {inputs: ['typed', 'csvweeks'], fn: mergeWeeks});

dash.calc('checks', {
  inputs: ['weeks'],
  fn: (weeks) => {
    const rnd = (v, d) => (v === null ? null : Math.round(v * Math.pow(10, d)) / Math.pow(10, d));
    const names = {club_speed: 'club speed', ball_speed: 'ball speed', smash_device: 'device smash', launch: 'launch', spin: 'spin', carry: 'carry', total: 'total', shots: 'shot count'};
    let prev = null;
    return weeks.map((s) => {
      const club = num(s.club_speed), ball = num(s.ball_speed), dev = num(s.smash_device);
      const ratio = club && ball ? ball / club : null;
      const gap = ratio !== null && dev !== null ? dev - ratio : null;
      const verdict = ratio === null ? 'Needs both speeds' : gap === null ? 'No device smash' : Math.abs(gap) <= TOL ? 'Adds up' : 'Doesn’t add up';
      const missing = ESSENTIALS.filter((k) => num(s[k]) === null).map((k) => names[k]);
      const row = {
        week: s.week, source: s.source, club_speed: rnd(club, 1), ball_speed: rnd(ball, 1),
        smash_calc: rnd(ratio, 2), smash_device: rnd(dev, 2), smash_gap: rnd(gap, 2), verdict,
        ball_if_device: club && dev ? rnd(club * dev, 1) : null,
        ball_gap: club && dev && ball ? rnd(club * dev - ball, 1) : null,
        club_delta: prev && club !== null && prev.club !== null ? rnd(club - prev.club, 1) : null,
        ball_delta: prev && ball !== null && prev.ball !== null ? rnd(ball - prev.ball, 1) : null,
        prev_week: prev ? prev.week : null,
        missing: missing.length ? missing.join(', ') : 'None',
      };
      prev = {week: s.week, club, ball};
      return row;
    });
  },
});

dash.calc('scenario', {
  inputs: ['checks', 'weeks', 'benchmarks'],
  fn: (checks, weeks, benchmarks) => {
    const p = dash.params();
    const rnd = (v, d) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    const done = checks.filter((c) => c.club_speed !== null && c.ball_speed !== null);
    if (!done.length || !window.BF) return [];
    const last = done[done.length - 1];
    const wk = weeks.find((s) => s.week === last.week) || {};
    const paired = weeks.filter((s) => num(s.launch) !== null && num(s.spin) !== null && s.week <= last.week);
    const earlier = benchmarks.find((b) => b.ref === 'earlier');
    let launch = null, spin = null, from = '';
    if (paired.length) { const d = paired[paired.length - 1]; launch = num(d.launch); spin = num(d.spin); from = 'Week ' + WB.wk(d.week); }
    else if (earlier) { launch = num(earlier.launch); spin = num(earlier.spin); from = earlier.label; }
    if (launch === null || spin === null) return [];
    const temp = num(wk.temp) !== null ? num(wk.temp) : Number(p.temp);
    const air = {temp, turf: p.turf || 'normal', alt: 0};
    const club = num(wk.club_speed), ball = num(wk.ball_speed), dev = num(wk.smash_device);
    const flagged = dev !== null && Math.abs(dev - ball / club) > TOL;
    const rows = [];
    const add = (step, label, cs, sm, L, s) => {
      const f = (WB.fitShot || BF.shot)(cs * sm, L, s, air);
      rows.push({step, label, club_speed: rnd(cs, 1), smash: rnd(sm, 2), ball_speed: rnd(cs * sm, 1), launch: rnd(L, 1), spin: Math.round(s / 5) * 5, carry: Math.round(f.carry), total: Math.round(f.total), week: last.week, delivery_from: from, temp});
    };
    add('logged', 'As logged', club, ball / club, launch, spin);
    if (flagged) add('device', 'If the device smash is right', club, dev, launch, spin);
    const startStep = p.basis === 'device' && flagged ? 'device' : 'logged';
    const sm0 = startStep === 'device' ? dev : ball / club;
    const smT = Math.max(sm0, Number(p.smash_target));
    add('strike', 'Strike to target smash', club, smT, launch, spin);
    const fit = BF.best(club * smT, club, Number(p.aoa), air);
    const shot = WB.fitShot || BF.shot, keep = shot(club * smT, launch, spin, air).total >= shot(club * smT, fit.launch, fit.spin, air).total;
    add('attack', 'Plus target attack angle', club, smT, keep ? launch : fit.launch, keep ? spin : fit.spin);
    let gain = 0;
    for (let k = 0; k < Number(p.weeks); k++) gain += Number(p.gain) * Math.pow(DECAY, k);
    const club2 = club + gain, fit2 = BF.best(club2 * smT, club2, Number(p.aoa), air);
    add('speed', 'Plus ' + Number(p.weeks) + ' weeks of speed', club2, smT, fit2.launch, fit2.spin);
    const start = rows.find((r) => r.step === startStep);
    rows.forEach((r) => { r.start = r.step === startStep; r.d_carry = r.carry - start.carry; r.d_total = r.total - start.total; r.from_carry = start.carry; r.from_total = start.total; });
    return rows;
  },
});

/* Week ticks spaced by pixels, always keeping the latest week. */
function weekTicks(x, weeks, gap) {
  const ws = [...new Set(weeks)].sort((a, b) => a - b), out = [];
  ws.forEach((w) => { if (!out.length || x(w) - x(out[out.length - 1]) >= gap) out.push(w); });
  const last = ws[ws.length - 1];
  if (ws.length && out[out.length - 1] !== last) { if (x(last) - x(out[out.length - 1]) < gap) out.pop(); out.push(last); }
  return out;
}
dash.calc('projection', {
  inputs: ['checks'],
  fn: (checks) => {
    const p = dash.params();
    const rnd = (v, d) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    const rows = checks.filter((c) => c.club_speed !== null).map((c) => ({week: c.week, kind: 'Logged', club: c.club_speed, club_lo: null, club_hi: null, ball: c.ball_speed, ball_lo: null, ball_hi: null, smash: c.smash_calc}));
    const last = checks.filter((c) => c.club_speed !== null && (c.smash_calc !== null || c.smash_device !== null)).slice(-1)[0];
    if (!last) return rows;
    const flagged = last.smash_device !== null && last.smash_calc !== null && Math.abs(last.smash_gap) > TOL;
    const sm0 = (p.basis === 'device' && last.smash_device !== null) || last.smash_calc === null ? last.smash_device : last.smash_calc;
    const smT = Math.max(sm0, Number(p.smash_target));
    const W = Number(p.weeks), g = Number(p.gain), c0 = last.club_speed;
    rows.push({week: last.week, kind: 'Projected', club: c0, club_lo: c0, club_hi: c0, ball: rnd(c0 * sm0, 1), ball_lo: rnd(c0 * sm0, 1), ball_hi: rnd(c0 * sm0, 1), smash: rnd(sm0, 2), from_device: flagged && p.basis === 'device'});
    let mid = 0, lo = 0, hi = 0;
    for (let k = 1; k <= W; k++) {
      const step = g * Math.pow(DECAY, k - 1);
      mid += step; lo += step * BAND_LO; hi += step * BAND_HI;
      const sm = sm0 + (smT - sm0) * k / W;
      rows.push({week: last.week + k, kind: 'Projected', club: rnd(c0 + mid, 1), club_lo: rnd(c0 + lo, 1), club_hi: rnd(c0 + hi, 1), ball: rnd((c0 + mid) * sm, 1), ball_lo: rnd((c0 + lo) * sm, 1), ball_hi: rnd((c0 + hi) * sm, 1), smash: rnd(sm, 2)});
    }
    return rows;
  },
});

/* Launch and spin windows for this golfer's club speed: the ball-flight model's best launch and spin at the target smash and attack angle. */
dash.calc('windows', {
  inputs: ['checks'],
  fn: (checks) => {
    const p = dash.params();
    const last = checks.filter((c) => c.club_speed !== null).slice(-1)[0];
    if (!last || !window.BF) return {launch: [L_LO, L_HI], spin: [SP_LO, SP_HI], cs: null, opt_launch: null, opt_spin: null};
    const cs = last.club_speed, b = BF.best(cs * Number(p.smash_target), cs, Number(p.aoa), {temp: Number(p.temp), turf: p.turf || 'normal', alt: 0});
    const r1 = (v) => Math.round(v * 10) / 10, r50 = (v) => Math.round(v / 50) * 50;
    return {launch: [r1(b.launch - 1), r1(b.launch + 1.5)], spin: [Math.max(SPIN_FLOOR, r50(b.spin - 300)), r50(b.spin + 400)], cs, opt_launch: r1(b.launch), opt_spin: r50(b.spin)};
  },
});
dash.draw('win', (el) => {
  const w = dash.data('windows');
  if (w.status !== 'ok') { el.textContent = '—'; return; }
  const d = w.data, k = el.dataset.w;
  const v = {cs: d.cs === null ? '—' : d.cs.toFixed(1), l_lo: d.launch[0].toFixed(1), l_hi: d.launch[1].toFixed(1), s_lo: d.spin[0].toLocaleString('en-US'), s_hi: d.spin[1].toLocaleString('en-US'), ol: d.opt_launch === null ? '—' : d.opt_launch.toFixed(1), os: d.opt_spin === null ? '—' : d.opt_spin.toLocaleString('en-US')}[k];
  el.textContent = v === undefined ? '—' : v;
});

dash.calc('topics', {
  inputs: ['checks', 'weeks', 'csvweeks', 'windows'],
  fn: (checks, weeks, csv, win) => {
    const p = dash.params();
    const [LW, LH] = win.launch, [SW, SH] = win.spin;
    const sg = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);
    const last = checks[checks.length - 1];
    if (!last) return [];
    const s = weeks.find((x) => x.week === last.week) || {};
    const imp = csv.find((c) => c.week === last.week) || null;
    const out = [];
    const shots = num(s.shots);
    const target = Number(p.smash_target);
    if (last.verdict === 'Doesn’t add up') out.push({topic: 'measure', status: 'Fix first', level: 'bad', detail: `Week ${WB.wk(last.week)}: ${last.ball_speed.toFixed(1)} ÷ ${last.club_speed.toFixed(1)} = ${last.smash_calc.toFixed(2)}, the device says ${last.smash_device.toFixed(2)}`});
    else if (imp && imp.n_total && imp.n_left / imp.n_total > LEFT_WARN) out.push({topic: 'measure', status: 'Tighten', level: 'warn', detail: `${imp.n_left} of ${imp.n_total} shots in week ${WB.wk(last.week)} were left out as likely misreads; check the monitor's setup and the club stickers`});
    else if (shots === null || shots < MIN_SHOTS) out.push({topic: 'measure', status: 'Tighten', level: 'warn', detail: shots === null ? 'Log how many shots the averages cover' : `Only ${shots} shots in the average`});
    else out.push({topic: 'measure', status: 'Good', level: 'ok', detail: imp ? `Speeds add up across ${imp.n_used} imported shots` : 'Speeds add up'});
    const useDev = (p.basis === 'device' && last.smash_device !== null) || last.smash_calc === null;
    const sm = useDev ? last.smash_device : last.smash_calc;
    if (sm === null) out.push({topic: 'strike', status: 'Not measured', level: 'none', detail: 'Log club and ball speed'});
    else {
      const st = sm < S_LOW ? ['Priority', 'bad'] : sm < target - 0.005 ? ['Work on', 'warn'] : ['On target', 'ok'];
      let detail = last.club_speed === null ? `Smash ${sm.toFixed(2)} against ${target.toFixed(2)}` : `Smash ${sm.toFixed(2)} against ${target.toFixed(2)}, which is ${(last.club_speed * target).toFixed(1)} mph of ball speed at ${last.club_speed.toFixed(1)} mph`;
      if (imp && imp.pct_target !== null) detail += `; ${imp.pct_target}% of shots reached ${target.toFixed(2)}`;
      out.push({topic: 'strike', status: st[0], level: st[1], detail});
    }
    const sp = checks.filter((c) => c.club_speed !== null);
    if (sp.length < 2) out.push({topic: 'speed', status: 'Need 2+ weeks', level: 'none', detail: sp.length ? `Week ${WB.wk(sp[0].week)}: ${sp[0].club_speed.toFixed(1)} mph` : 'Log club speed'});
    else {
      const a = sp[0], b = sp[sp.length - 1], per = (b.club_speed - a.club_speed) / (b.week - a.week);
      out.push({topic: 'speed', status: per >= 0.2 ? 'Gaining' : per > -0.2 ? 'Flat' : 'Dropping', level: per >= 0.2 ? 'ok' : 'warn', detail: `${sg(b.club_speed - a.club_speed, 1)} mph since week ${WB.wk(a.week)}, ${sg(per, 2)} a week`});
    }
    const L = num(s.launch), S = num(s.spin), A = num(s.attack);
    const aoaTxt = A === null ? `attack-angle target +${p.aoa}°` : `attack angle ${sg(A, 1)}° against +${p.aoa}°`;
    out.push(L === null ? {topic: 'launch', status: 'Not measured', level: 'none', detail: `Log launch for week ${WB.wk(last.week)}; ${aoaTxt}`}
      : {topic: 'launch', status: L < LW ? 'Work on' : L <= LH ? 'On target' : 'High', level: L < LW || L > LH ? 'warn' : 'ok', detail: `${L.toFixed(1)}° launch against ${LW.toFixed(1)}–${LH.toFixed(1)}°; ${aoaTxt}`});
    out.push(S === null ? {topic: 'spin', status: 'Not measured', level: 'none', detail: `Log spin for week ${WB.wk(last.week)}`}
      : {topic: 'spin', status: S > SH ? 'High' : S < SW ? 'Low' : 'OK', level: S > SH || S < SW ? 'warn' : 'ok', detail: `${Math.round(S).toLocaleString('en-US')} rpm against ${SW.toLocaleString('en-US')}–${SH.toLocaleString('en-US')}`});
    const off = num(s.offline);
    out.push(off === null ? {topic: 'dispersion', status: 'Not measured', level: 'none', detail: 'Log the offline spread'} : {topic: 'dispersion', status: 'Logged', level: 'ok', detail: `±${off.toFixed(1)} yd offline (one spread)`});
    const ready = L !== null && L >= LW && L <= LH && sm !== null && sm >= target - 0.005;
    out.push({topic: 'equipment', status: ready ? 'Ready to test' : 'Later', level: ready ? 'ok' : 'none', detail: ready ? 'Launch and strike are on target' : 'Fit once strike and launch are on target'});
    return out;
  },
});

(function () {
  const sels = document.querySelectorAll('select[data-param]');
  const set = () => {
    const p = dash.params();
    sels.forEach((s) => { const v = p[s.dataset.param]; if (v !== undefined && v !== null && document.activeElement !== s) s.value = String(v); });
  };
  set();
  sels.forEach((s) => s.addEventListener('change', () => {
    dash.setParams({[s.dataset.param]: s.dataset.num ? Number(s.value) : s.value});
  }));
  dash.onData(set);
})();

(function () {
  const form = document.getElementById('logform');
  if (!form) return;
  const show = (id) => { ['msg-saved', 'msg-week', 'msg-empty', 'unsaved'].forEach((m) => { const el = document.getElementById(m); if (el) el.hidden = m !== id; }); };
  const NUMS = ['club_speed', 'ball_speed', 'smash_device', 'launch', 'spin', 'carry', 'total', 'shots', 'attack', 'dyn_loft', 'club_path', 'face_angle', 'offline', 'temp', 'sim_alt'];
  const TEXTS = ['date', 'impact', 'tee', 'device', 'setup', 'note'];
  const btn = form.querySelector('button[type=submit]');
  form.addEventListener('input', () => show(null));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const week = Number(f.week && f.week.value);
    if (!Number.isInteger(week) || Math.abs(week) > 260) { show('msg-week'); return; }
    const row = {week};
    NUMS.forEach((k) => { if (f[k] && f[k].value !== '' && isFinite(Number(f[k].value))) row[k] = Number(f[k].value); });
    TEXTS.forEach((k) => { if (f[k] && f[k].value.trim() !== '') row[k] = f[k].value.trim().slice(0, 300); });
    const hasImport = (dash.data('weeks').data || []).some((w) => w.week === week && w.has_import);
    if (!hasImport && Object.keys(row).filter((k) => NUMS.includes(k)).length === 0) { show('msg-empty'); return; }
    const g = WB.golfer();
    if (!g) { const u = document.getElementById('unsaved'); if (u) u.textContent = 'Add a golfer first.'; show('unsaved'); return; }
    row.saved_at = new Date().toISOString();
    if (btn) btn.disabled = true;
    let ok = true;
    try { await WB.save('golfers/' + g.id + '/weeks/w' + WB.pad2(week), row); } catch (err) { ok = false; }
    if (btn) btn.disabled = false;
    if (!ok) { const u = document.getElementById('unsaved'); if (u) u.textContent = WB.noDb ? 'Saving is off in this view.' : WB.canWrite === false ? 'That wasn’t saved. Only the owner can save weeks.' : 'That wasn’t saved. Try again in a moment.'; }
    show(ok ? 'msg-saved' : 'unsaved');
    if (ok) { form.reset(); if (f.week) f.week.value = String(week + 1); }
  });
  dash.onData(() => {
    const c = dash.data('checks');
    const wk = form.elements.week;
    if (c.status === 'ok' && c.data.length && wk && wk.value === '' && document.activeElement !== wk) wk.value = String(c.data[c.data.length - 1].week + 1);
  });
})();

const F = {
  mph: (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(1)),
  sm: (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(2)),
  sm3: (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(3)),
  int: (v) => (v === null || v === undefined ? '—' : Math.round(Number(v)).toLocaleString('en-US')),
  deg: (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(1) + '°'),
  pm: (v, d) => (v === null || v === undefined ? '—' : '±' + Number(v).toFixed(d)),
  sg: (v, d) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Number(v)).toFixed(d)),
};
const FMT = {week: (v) => WB.wk(v), club_speed: F.mph, ball_speed: F.mph, smash_calc: F.sm, smash_device: F.sm, ball_if_device: F.mph, ball_gap: F.mph, d_total: (v) => F.sg(v, 0), d_carry: (v) => F.sg(v, 0), carry: F.int, total: F.int, from_carry: F.int, from_total: F.int, club: F.mph, club_lo: F.mph, club_hi: F.mph, ball: F.mph, ball_lo: F.mph, ball_hi: F.mph, smash: F.sm};
function mark(tag, src, field, where, text, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.textContent = text;
  return e;
}
function lastWeek() { const c = dash.data('checks'); return c.status === 'ok' && c.data.length ? c.data[c.data.length - 1] : null; }
function setHidden(ids, show) { ids.forEach((id) => { const el = document.getElementById(id); if (el) el.hidden = id !== show; }); }
function msgRow(el, cols, text) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = cols; td.className = 'wb-wrap'; td.textContent = text; tr.append(td); el.append(tr); }
function loadingText(st, what) { return st === 'loading' ? 'Loading…' : st === 'error' ? what + ' didn’t load.' : '—'; }
function confirmButton(label, confirmLabel, onConfirm) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'wb-btn wb-btn-sm wb-write'; b.textContent = label;
  let armed = false, t = null;
  b.addEventListener('click', async () => {
    if (!armed) {
      armed = true; b.textContent = confirmLabel; b.classList.add('wb-armed');
      t = setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('wb-armed'); }, 4000);
      return;
    }
    clearTimeout(t); b.disabled = true; b.textContent = 'Removing…';
    try { await onConfirm(); } catch (err) { armed = false; b.disabled = false; b.classList.remove('wb-armed'); b.textContent = 'Not removed'; }
  });
  return b;
}

dash.draw('const', (el) => {
  const v = {tol: TOL.toFixed(2), minshots: String(MIN_SHOTS), s_low: S_LOW.toFixed(2), l_lo: String(L_LO), l_hi: String(L_HI), sp_hi: SP_HI.toLocaleString('en-US'), sp_lo: SP_LO.toLocaleString('en-US'), spinfloor: SPIN_FLOOR.toLocaleString('en-US'), spd: window.BF ? String(BF.SPIN_PER_DEG) : '—', decay: Math.round(DECAY * 100) + '%', band_lo: Math.round(BAND_LO * 100) + '%', band_hi: Math.round(BAND_HI * 100) + '%', left_warn: Math.round(LEFT_WARN * 100) + '%'}[el.dataset.c];
  el.textContent = v === undefined ? '—' : v;
});
dash.draw('pv', (el) => { const v = dash.params()[el.dataset.p]; el.textContent = v === undefined || v === null ? '—' : String(v); });

dash.draw('tkstate', () => {
  const c = dash.data('checks');
  if (c.status === 'loading') { setHidden(['tk-load', 'tk-none', 'tk-bad', 'tk-ok'], 'tk-load'); return; }
  const l = lastWeek();
  setHidden(['tk-load', 'tk-none', 'tk-bad', 'tk-ok'], !l ? 'tk-none' : l.verdict === 'Doesn’t add up' ? 'tk-bad' : 'tk-ok');
});
dash.draw('tk', (el) => {
  const f = el.dataset.f;
  if (f === 'd_total') {
    const s = dash.data('scenario');
    const r = s.status === 'ok' ? s.data.find((x) => x.step === 'speed') : null;
    el.replaceChildren(r ? mark('span', 'scenario', 'd_total', 'step=speed', F.sg(r.d_total, 0)) : document.createTextNode('—'));
    return;
  }
  const l = lastWeek();
  el.replaceChildren(l && l[f] !== null && l[f] !== undefined ? mark('span', 'checks', f, 'week=' + l.week, (FMT[f] || String)(l[f])) : document.createTextNode('—'));
});

dash.draw('kpi', (el) => {
  const k = el.dataset.k, l = lastWeek();
  const c = dash.data('checks');
  el.classList.toggle('dash-skeleton', c.status === 'loading');
  if (c.status === 'loading') { el.replaceChildren(); return; }
  if (c.status === 'error') { el.textContent = 'Didn’t load'; return; }
  el.replaceChildren(l && l[k] !== null ? mark('span', 'checks', k, 'week=' + l.week, (FMT[k] || String)(l[k])) : document.createTextNode('—'));
});
dash.draw('kpisub', (el) => {
  const k = el.dataset.k, l = lastWeek();
  el.replaceChildren();
  if (!l) { el.textContent = '—'; return; }
  el.append(document.createTextNode('Week ' + WB.wk(l.week) + (l.source && l.source !== 'Typed' ? ', GSPro' : '')));
  const dk = {club_speed: 'club_delta', ball_speed: 'ball_delta'}[k];
  if (dk && l[dk] !== null) {
    el.append(document.createTextNode(' · '), mark('span', 'checks', dk, '', F.sg(l[dk], 1), l[dk] > 0 ? 'wb-good' : l[dk] < 0 ? 'wb-badc' : ''), document.createTextNode(' vs week ' + l.prev_week));
  }
  if (k === 'smash_calc' && l.verdict === 'Doesn’t add up') el.append(document.createTextNode(' · '), mark('span', 'checks', 'verdict', '', 'doesn’t match the device', 'wb-badc'));
});

dash.draw('cnstate', () => {
  const c = dash.data('checks');
  if (c.status === 'loading') return;
  const l = lastWeek();
  setHidden(['cn-bad'], l && l.verdict === 'Doesn’t add up' ? 'cn-bad' : null);
});
dash.draw('cn', (el) => {
  const f = el.dataset.f, l = lastWeek();
  el.replaceChildren(l && l[f] !== null && l[f] !== undefined ? mark('span', 'checks', f, '', (FMT[f] || String)(l[f])) : document.createTextNode('—'));
});

dash.draw('checkrows', (el) => {
  const c = dash.data('checks');
  el.replaceChildren();
  if (c.status !== 'ok') { msgRow(el, 8, loadingText(c.status, 'The checks')); return; }
  if (!c.data.length) { msgRow(el, 8, 'No weeks yet.'); return; }
  c.data.slice().reverse().forEach((r) => {
    const tr = document.createElement('tr');
    const cells = [WB.wk(r.week), F.mph(r.club_speed), F.mph(r.ball_speed), F.sm(r.smash_calc), F.sm(r.smash_device), r.verdict, F.mph(r.ball_if_device), r.missing];
    cells.forEach((t, i) => {
      const td = document.createElement('td');
      td.textContent = t;
      if (i === 5) td.className = r.verdict === 'Adds up' ? 'wb-good' : r.verdict === 'Doesn’t add up' ? 'wb-badc' : '';
      if (i === 7) td.className = 'wb-wrap';
      tr.append(td);
    });
    el.append(tr);
  });
});

dash.draw('logstate', () => {
  const s = dash.data('weeks');
  if (s.status === 'loading') return;
  setHidden(['log-empty'], s.status === 'ok' && s.data.length === 0 ? 'log-empty' : null);
});
dash.draw('logrows', (el) => {
  const s = dash.data('weeks'), c = dash.data('checks'), sess = dash.data('typed');
  el.replaceChildren();
  if (s.status !== 'ok') { msgRow(el, 13, loadingText(s.status, 'The log')); return; }
  const smash = new Map((c.status === 'ok' ? c.data : []).map((r) => [r.week, r.smash_calc]));
  const typedBy = new Map((sess.status === 'ok' ? sess.data : []).map((r) => [num(r.week), r]));
  const g = WB.golfer();
  s.data.slice().reverse().forEach((r) => {
    const tr = document.createElement('tr');
    const src = r.source + (r.n_sessions > 1 ? ` (${r.n_sessions} files)` : '');
    const cells = [WB.wk(r.week), src, r.date || '—', F.mph(r.club_speed), F.mph(r.ball_speed), F.sm(smash.get(r.week)), F.deg(r.launch), F.int(r.spin), F.int(r.carry), F.int(r.total), r.shots === null ? '—' : String(r.shots), r.note || '—'];
    cells.forEach((t, i) => { const td = document.createElement('td'); td.textContent = t; if (i === 11) td.className = 'wb-wrap'; tr.append(td); });
    const td = document.createElement('td');
    td.className = 'wb-acttd wb-write';
    const box = document.createElement('div');
    box.className = 'wb-acts';
    td.append(box);
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'wb-btn wb-btn-sm wb-write'; edit.textContent = r.has_typed ? 'Edit' : 'Add notes';
    edit.addEventListener('click', () => {
      const form = document.getElementById('logform');
      if (!form) return;
      form.reset();
      const typed = typedBy.get(r.week) || {week: r.week, date: r.date};
      Object.keys(typed).forEach((k) => { const inp = form.elements[k]; if (inp && k !== 'id' && typed[k] !== null && typed[k] !== undefined && typeof typed[k] !== 'object') inp.value = String(typed[k]); });
      if (r.has_import) { const more = form.querySelector('details'); if (more) more.open = true; }
      form.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    box.append(edit);
    if (r.has_typed && g) box.append(confirmButton(r.has_import ? 'Remove typed' : 'Delete', 'Confirm delete', () => WB.remove('golfers/' + g.id + '/weeks/w' + WB.pad2(r.week))));
    tr.append(td);
    el.append(tr);
  });
});

dash.draw('histstate', () => {
  const s = dash.data('sessionrows');
  if (s.status === 'loading') return;
  setHidden(['hist-none'], s.status === 'ok' && !s.data.length ? 'hist-none' : null);
});
dash.draw('histrows', (el) => {
  const s = dash.data('sessionrows'), g = WB.golfer();
  el.replaceChildren();
  if (s.status !== 'ok') { msgRow(el, 11, loadingText(s.status, 'History')); return; }
  s.data.forEach((r) => {
    const tr = document.createElement('tr');
    const others = r.clubs.filter((c) => c.club !== r.driver).map((c) => c.club + ' ' + c.n).join(', ');
    [r.date || '—', WB.wk(r.week), r.file || '—', `${r.n_used}${r.n_left ? ' (+' + r.n_left + ' out)' : ''}`, F.mph(r.club_speed), F.mph(r.ball_speed), F.sm(r.smash), F.int(r.carry), others || '—'].forEach((t, i) => {
      const td = document.createElement('td'); td.textContent = t;
      if (i === 2 || i === 8) td.className = 'wb-wrap';
      tr.append(td);
    });
    const td = document.createElement('td');
    td.className = 'wb-acttd wb-write';
    const box = document.createElement('div');
    box.className = 'wb-acts';
    td.append(box);
    if (g) {
      const wrap = document.createElement('span');
      wrap.className = 'wb-move wb-write';
      const inp = document.createElement('input');
      inp.type = 'number'; inp.min = '-260'; inp.max = '260'; inp.step = '1'; inp.inputMode = 'numeric'; inp.value = r.week === null ? '' : String(r.week);
      inp.setAttribute('aria-label', 'Week for ' + (r.file || 'this session'));
      const mv = document.createElement('button');
      mv.type = 'button'; mv.className = 'wb-btn wb-btn-sm'; mv.textContent = 'Set week';
      mv.addEventListener('click', async () => {
        const w = Number(inp.value);
        if (!Number.isInteger(w) || Math.abs(w) > 260 || w === r.week) return;
        mv.disabled = true;
        try { await WB.patch('golfers/' + g.id + '/sessions/' + r.id, {week: w}); } catch (err) { mv.textContent = 'Not saved'; }
        mv.disabled = false;
      });
      wrap.append(inp, mv);
      box.append(wrap, condEditor(r, 'golfers/' + g.id + '/sessions/' + r.id), confirmButton('Remove', 'Confirm remove', () => WB.remove('golfers/' + g.id + '/sessions/' + r.id)));
    }
    tr.append(td);
    el.append(tr);
  });
});

/* Golfer switcher and the add-a-golfer form. */
dash.draw('golferbar', (el) => {
  el.replaceChildren();
  const list = WB.golfers(), cur = WB.golfer();
  if (!WB.configLoaded()) { const s = document.createElement('span'); s.className = 'wb-sub'; s.textContent = 'Loading golfers…'; el.append(s); return; }
  if (!list.length) { const s = document.createElement('span'); s.className = 'wb-sub'; s.textContent = WB.noDb ? 'Golfers load when you’re signed in.' : 'No golfers yet. Add one to start.'; el.append(s); return; }
  list.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'wb-seg' + (cur && cur.id === g.id ? ' on' : ''); b.textContent = g.name;
    b.setAttribute('aria-pressed', cur && cur.id === g.id ? 'true' : 'false');
    b.addEventListener('click', () => WB.setGolfer(g.id));
    el.append(b);
  });
});
dash.draw('gname', (el) => { const g = WB.golfer(); el.textContent = g ? g.name : '—'; });
(function () {
  const form = document.getElementById('addgolfer');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = form.elements.gname, msgEl = document.getElementById('addgolfer-msg');
    const name = inp.value.trim().slice(0, 30);
    if (!name) return;
    const list = WB.golfers();
    if (list.some((g) => g.name.toLowerCase() === name.toLowerCase())) { if (msgEl) { msgEl.textContent = name + ' is already here.'; msgEl.hidden = false; } return; }
    if (list.length >= 8) { if (msgEl) { msgEl.textContent = 'Up to 8 golfers.'; msgEl.hidden = false; } return; }
    const id = WB.slug(name);
    try {
      await WB.save('config/golfers', {list: list.concat([{id, name}])});
      inp.value = '';
      if (msgEl) msgEl.hidden = true;
      const d = form.closest('details'); if (d) d.open = false;
      setTimeout(() => WB.setGolfer(id), 300);
    } catch (err) { if (msgEl) { msgEl.textContent = WB.noDb ? 'Saving is off in this view.' : 'That wasn’t saved.'; msgEl.hidden = false; } }
  });
})();

/* Backlog: planned work, kept in the workbench's own store. */
const PRIOS = ['Now', 'Next', 'Later'], STATUSES = ['Planned', 'Doing', 'Waiting', 'Done'];
dash.draw('backlogrows', (el) => {
  const b = dash.data('backlog');
  el.replaceChildren();
  if (b.status !== 'ok') { el.textContent = loadingText(b.status, 'The backlog'); return; }
  if (!b.data.length) { const p = document.createElement('p'); p.className = 'wb-note'; p.textContent = 'Nothing in the backlog yet.'; el.append(p); return; }
  const items = b.data.filter((r) => typeof r.title === 'string' && r.title.trim());
  PRIOS.forEach((pr) => {
    const group = items.filter((r) => (PRIOS.includes(r.priority) ? r.priority : 'Later') === pr).sort((a, c) => (num(a.order) ?? 999) - (num(c.order) ?? 999) || String(a.title).localeCompare(String(c.title)));
    if (!group.length) return;
    const h = document.createElement('h3'); h.className = 'wb-bl-h'; h.textContent = pr + ' (' + group.length + ')';
    const ul = document.createElement('ul'); ul.className = 'wb-bl';
    group.forEach((r) => {
      const li = document.createElement('li'); li.className = 'wb-card wb-bl-item' + (r.status === 'Done' ? ' done' : '');
      const top = document.createElement('div'); top.className = 'wb-bl-top';
      const t = document.createElement('strong'); t.textContent = r.title.slice(0, 140);
      const meta = document.createElement('span'); meta.className = 'wb-bl-meta';
      if (typeof r.area === 'string' && r.area) { const a = document.createElement('span'); a.className = 'wb-chip none'; a.textContent = r.area.slice(0, 30); meta.append(a); }
      const st = STATUSES.includes(r.status) ? r.status : 'Planned';
      const chip = document.createElement('span'); chip.className = 'wb-chip wb-ro-only ' + (st === 'Done' ? 'ok' : st === 'Doing' ? 'warn' : st === 'Waiting' ? 'wait' : 'none'); chip.textContent = st;
      const sel = document.createElement('select'); sel.className = 'wb-bl-status wb-write'; sel.setAttribute('aria-label', 'Status of ' + r.title.slice(0, 60));
      STATUSES.forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; sel.append(o); });
      sel.value = st;
      sel.addEventListener('change', async () => { sel.disabled = true; try { await WB.patch('backlog/' + r.id, {status: sel.value}); } catch (err) { sel.value = st; } sel.disabled = false; });
      meta.append(chip, sel);
      top.append(t, meta);
      li.append(top);
      if (typeof r.detail === 'string' && r.detail) { const p = document.createElement('p'); p.textContent = r.detail.slice(0, 600); li.append(p); }
      ul.append(li);
    });
    el.append(h, ul);
  });
});
(function () {
  const form = document.getElementById('addbacklog');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements, msgEl = document.getElementById('addbacklog-msg');
    const title = f.title.value.trim().slice(0, 140);
    if (!title) return;
    const body = {title, detail: f.detail.value.trim().slice(0, 600), area: f.area.value, priority: f.priority.value, status: 'Planned', order: 500, added: new Date().toISOString()};
    try { await WB.save('backlog/' + WB.newId('b'), body); form.reset(); if (msgEl) msgEl.hidden = true; }
    catch (err) { if (msgEl) { msgEl.textContent = WB.noDb ? 'Saving is off in this view.' : 'That wasn’t saved.'; msgEl.hidden = false; } }
  });
})();

dash.draw('consstate', () => {
  const c = dash.data('csvweeks');
  if (c.status === 'loading') return;
  setHidden(['cons-none'], c.status === 'ok' && c.data.length === 0 ? 'cons-none' : null);
  setHidden(['cons-body'], c.status === 'ok' && c.data.length ? 'cons-body' : null);
});
dash.draw('consrows', (el) => {
  const c = dash.data('csvweeks');
  el.replaceChildren();
  if (c.status !== 'ok') { msgRow(el, 9, loadingText(c.status, 'Consistency')); return; }
  c.data.slice().reverse().forEach((r) => {
    const tr = document.createElement('tr');
    [WB.wk(r.week), String(r.n_used), String(r.n_left), F.pm(r.sd_club, 1), F.pm(r.sd_ball, 1), F.pm(r.sd_smash, 3), r.pct_target === null ? '—' : r.pct_target + '%', F.pm(r.sd_carry, 1), F.pm(r.sd_offline, 1)].forEach((t, i) => {
      const td = document.createElement('td'); td.textContent = t;
      if (i === 2 && r.n_total && r.n_left / r.n_total > LEFT_WARN) td.className = 'wb-warnc';
      tr.append(td);
    });
    el.append(tr);
  });
});
dash.draw('dotweek', (el) => { const s = dash.data('latestshots'); el.textContent = s.status === 'ok' && s.data.length ? 'week ' + WB.wk(s.data[0].week) : 'the latest import'; });
dash.draw('shotdots', (el) => {
  const s = dash.data('latestshots');
  el.replaceChildren();
  if (s.status !== 'ok') { el.textContent = loadingText(s.status, 'This chart'); return; }
  const pts = s.data.filter((d) => d.smash !== null);
  if (!pts.length) { el.textContent = 'Import a GSPro CSV with club speed to see this chart.'; return; }
  const target = Number(dash.params().smash_target);
  const used = pts.filter((d) => d.used);
  const lo = Math.min(target, ...(used.length ? used : pts).map((d) => d.smash)) - 0.02, hi = Math.max(target, ...(used.length ? used : pts).map((d) => d.smash)) + 0.02;
  const W = Math.max(260, el.clientWidth || 320), H = 210, mt = 10, mb = 26;
  const y = d3.scaleLinear().domain([Math.max(0.9, lo), Math.min(1.6, hi)]).range([H - mb, mt]).nice();
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', 'Smash factor for each shot in the latest import');
  const yAxis = svg.append('g').attr('class', 'wb-axis').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2f')).tickSizeOuter(0));
  let ml = 8;
  yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 12); });
  yAxis.attr('transform', `translate(${ml},0)`);
  const n = s.data.length;
  const x = d3.scaleLinear().domain([0.5, n + 0.5]).range([ml + 6, W - 8]);
  svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - ml - 8)).tickFormat(''));
  svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).ticks(Math.min(n, Math.floor(W / 40))).tickFormat((v) => (Number.isInteger(v) ? String(v) : '')).tickSizeOuter(0));
  svg.append('line').attr('x1', ml).attr('x2', W - 8).attr('y1', y(target)).attr('y2', y(target)).style('stroke', dash.colors[1]).style('stroke-width', 2).style('stroke-dasharray', '5 4');
  const clamp = (v) => Math.max(y.domain()[0], Math.min(y.domain()[1], v));
  svg.append('g').selectAll('circle').data(pts).join('circle')
    .attr('cx', (d) => x(d.i)).attr('cy', (d) => y(clamp(d.smash))).attr('r', 4.5)
    .style('fill', (d) => (d.used ? dash.colors[0] : 'transparent'))
    .style('stroke', (d) => (d.used ? 'var(--color-panel)' : 'var(--color-bad)')).style('stroke-width', (d) => (d.used ? 1.5 : 2));
  const tip = d3.select(el).append('div').attr('class', 'wb-tip').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
    .on('pointermove pointerenter', (event) => {
      const [mx, my] = d3.pointer(event);
      const i = Math.round(x.invert(mx));
      const d = pts.find((p) => p.i === i);
      if (!d) { tip.style('display', 'none'); return; }
      tip.style('display', null).html('');
      tip.append('div').text('Shot ' + d.i + (d.used ? '' : ', left out'));
      tip.append('div').append('span').text(`Smash ${F.sm(d.smash)} · club ${F.mph(d.club)} · ball ${F.mph(d.ball)}`);
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 40) + 'px');
    })
    .on('pointerleave', () => tip.style('display', 'none'));
});

dash.draw('glstate', () => {
  const s = dash.data('scenario');
  if (s.status === 'loading') return;
  setHidden(['gl-ok', 'gl-none'], s.status === 'ok' && s.data.length ? 'gl-ok' : 'gl-none');
});
dash.draw('gl', (el) => {
  const s = dash.data('scenario'), f = el.dataset.f;
  const r = s.status === 'ok' ? s.data.find((x) => x.step === 'speed') : null;
  el.replaceChildren(r ? mark('span', 'scenario', f, '', (FMT[f] || String)(r[f])) : document.createTextNode('—'));
});
dash.draw('sw', (el) => {
  const i = Number(el.dataset.i);
  el.style.background = i === 1 && el.dataset.muted ? 'var(--cds-chart-muted)' : (dash.colors[i] || dash.colors[0]);
});
dash.draw('asv', (el) => {
  const s = dash.data('scenario');
  const r = s.status === 'ok' && s.data.length ? s.data[0] : null;
  if (!r) { el.textContent = '—'; return; }
  el.textContent = `${F.deg(r.launch)} and ${F.int(r.spin)} rpm, from ${r.delivery_from} at ${r.temp}°F`;
});

dash.draw('scenrows', (el) => {
  const s = dash.data('scenario');
  el.replaceChildren();
  if (s.status !== 'ok' || !s.data.length) { msgRow(el, 8, s.status === 'ok' ? 'Log club and ball speed for a week to see this.' : loadingText(s.status, 'This look')); return; }
  s.data.forEach((r) => {
    const tr = document.createElement('tr');
    [r.label + (r.start ? ' (start)' : ''), F.mph(r.club_speed), F.sm(r.smash), F.mph(r.ball_speed), F.deg(r.launch), F.int(r.spin), F.int(r.carry), F.int(r.total)].forEach((t) => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
    el.append(tr);
  });
});

dash.draw('scenchart', (el) => {
  const s = dash.data('scenario');
  el.replaceChildren();
  if (s.status !== 'ok') { el.textContent = loadingText(s.status, 'This chart'); return; }
  if (!s.data.length) { el.textContent = 'Log club and ball speed for a week to see this chart.'; return; }
  const rows = s.data, W = Math.max(260, el.clientWidth || 320), rowH = 44, H = rows.length * rowH + 24;
  const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.total) * 1.02]).range([0, W - 4]).nice();
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', 'Carry and roll for each step of the realistic look');
  const g = svg.append('g').attr('transform', 'translate(2,0)');
  g.append('g').attr('class', 'wb-grid-line').attr('transform', `translate(0,${H - 18})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 90))).tickSize(-(H - 18)).tickFormat(''));
  g.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - 18})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 90))).tickSizeOuter(0));
  const tip = d3.select(el).append('div').attr('class', 'wb-tip').style('display', 'none');
  const row = g.selectAll('g.r').data(rows).join('g').attr('class', 'r').attr('transform', (d, i) => `translate(0,${i * rowH})`);
  row.append('text').attr('x', 0).attr('y', 12).style('fill', 'var(--color-fg)').style('font-size', '13px').text((d) => d.label + (d.start ? ' (start)' : ''));
  row.append('text').attr('x', W - 6).attr('y', 12).attr('text-anchor', 'end').style('fill', 'var(--cds-text-secondary)').style('font-size', '13px').style('font-variant-numeric', 'tabular-nums').text((d) => `${F.int(d.carry)} / ${F.int(d.total)} yd`);
  row.append('rect').attr('x', 0).attr('y', 18).attr('height', 14).attr('rx', 3).attr('width', (d) => Math.max(1, x(d.carry))).style('fill', dash.colors[0]);
  row.append('rect').attr('x', (d) => x(d.carry) + 1).attr('y', 18).attr('height', 14).attr('rx', 3).attr('width', (d) => Math.max(1, x(d.total) - x(d.carry) - 1)).style('fill', 'var(--cds-chart-muted)');
  row.append('rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', rowH).style('fill', 'transparent')
    .on('pointerenter pointermove', (event, d) => {
      const [mx, my] = d3.pointer(event, el);
      tip.style('display', null).html('');
      tip.append('div').text(d.label);
      tip.append('div').append('span').text(`Ball ${F.mph(d.ball_speed)} mph · smash ${F.sm(d.smash)}`);
      tip.append('div').append('span').text(`Launch ${F.deg(d.launch)} · spin ${F.int(d.spin)} rpm`);
      tip.append('div').append('span').text(`Carry ${F.int(d.carry)} · roll ${F.int(d.total - d.carry)} · total ${F.int(d.total)}`);
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', (my + 12) + 'px');
    })
    .on('pointerleave', () => tip.style('display', 'none'));
});

dash.draw('proj', (el) => {
  const p = dash.data('projection'), ykey = el.dataset.y;
  el.replaceChildren();
  chartTable(el, null);
  if (p.status !== 'ok') { el.textContent = loadingText(p.status, 'This chart'); return; }
  const logged = p.data.filter((d) => d.kind === 'Logged' && d[ykey] !== null);
  const proj = p.data.filter((d) => d.kind === 'Projected' && d[ykey] !== null);
  if (!logged.length && !proj.length) { el.textContent = 'Log a week to see this chart.'; return; }
  const all = logged.concat(proj);
  chartTable(el, (ykey === 'club' ? 'Club' : 'Ball') + ' speed by week', ['Week', 'Kind', 'mph', 'Low', 'High'], all.map((d) => [d.week !== undefined && d.week !== null ? WB.wk(d.week) : (d.label || ''), d.kind, rd(d[ykey], 1), rd(d[ykey + '_lo'], 1), rd(d[ykey + '_hi'], 1)]));
  const W = Math.max(240, el.clientWidth || 300), H = 220, mt = 8, mb = 26;
  const vals = all.flatMap((d) => [d[ykey], d[ykey + '_lo'], d[ykey + '_hi']]).filter((v) => v !== null && v !== undefined);
  const y = d3.scaleLinear().domain([d3.min(vals) - 1, d3.max(vals) + 1]).nice();
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', (ykey === 'club' ? 'Club' : 'Ball') + ' speed by week, logged and projected');
  const yAxis = svg.append('g').attr('class', 'wb-axis');
  y.range([H - mb, mt]);
  yAxis.call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
  let ml = 8;
  yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 12); });
  yAxis.attr('transform', `translate(${ml},0)`);
  const weeks = all.map((d) => d.week);
  const x = d3.scaleLinear().domain([d3.min(weeks), Math.max(d3.max(weeks), d3.min(weeks) + 1)]).range([ml + 6, W - 8]);
  svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - ml - 8)).tickFormat(''));
  svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickValues(weekTicks(x, all.map((d) => d.week), 30)).tickFormat((w) => WB.wk(w)).tickSizeOuter(0));
  if (proj.length > 1) {
    svg.append('path').datum(proj).attr('d', d3.area().x((d) => x(d.week)).y0((d) => y(d[ykey + '_lo'])).y1((d) => y(d[ykey + '_hi']))).style('fill', dash.colors[2]).style('fill-opacity', 0.15);
    svg.append('path').datum(proj).attr('d', d3.line().x((d) => x(d.week)).y((d) => y(d[ykey]))).style('fill', 'none').style('stroke', dash.colors[2]).style('stroke-width', 2).style('stroke-dasharray', '5 4');
  }
  if (logged.length > 1) svg.append('path').datum(logged).attr('d', d3.line().x((d) => x(d.week)).y((d) => y(d[ykey]))).style('fill', 'none').style('stroke', dash.colors[0]).style('stroke-width', 2).style('stroke-linejoin', 'round');
  svg.append('g').selectAll('circle').data(logged).join('circle').attr('cx', (d) => x(d.week)).attr('cy', (d) => y(d[ykey])).attr('r', 4).style('fill', dash.colors[0]).style('stroke', 'var(--color-panel)').style('stroke-width', 2);
  const tip = d3.select(el).append('div').attr('class', 'wb-tip').style('display', 'none');
  const rule = svg.append('line').attr('y1', mt).attr('y2', H - mb).style('stroke', 'var(--cds-chart-reference)').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
    .on('pointermove pointerenter', (event) => {
      const [mx, my] = d3.pointer(event);
      const wk = Math.round(x.invert(mx));
      const lg = logged.find((d) => d.week === wk), pj = proj.find((d) => d.week === wk && !(lg && d.week === lg.week));
      const d = lg || pj;
      if (!d) { tip.style('display', 'none'); rule.style('display', 'none'); return; }
      rule.attr('x1', x(wk)).attr('x2', x(wk)).style('display', null);
      tip.style('display', null).html('');
      tip.append('div').text('Week ' + WB.wk(wk) + (lg ? ', logged' : ', projected'));
      tip.append('div').append('span').text(lg ? `${F.mph(d[ykey])} mph` : `${F.mph(d[ykey])} mph (${F.mph(d[ykey + '_lo'])}–${F.mph(d[ykey + '_hi'])})`);
      if (ykey === 'ball' && d.smash !== null) tip.append('div').append('span').text('Smash ' + F.sm(d.smash));
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 30) + 'px');
    })
    .on('pointerleave', () => { tip.style('display', 'none'); rule.style('display', 'none'); });
});

dash.draw('plstate', () => {
  const p = dash.data('projection');
  if (p.status === 'loading') return;
  setHidden(['pl-ok'], p.status === 'ok' && p.data.some((d) => d.kind === 'Projected' && d.week > p.data.filter((x) => x.kind === 'Logged').reduce((m, x) => Math.max(m, x.week), 0)) ? 'pl-ok' : null);
});
dash.draw('pl', (el) => {
  const p = dash.data('projection'), f = el.dataset.f;
  const proj = p.status === 'ok' ? p.data.filter((d) => d.kind === 'Projected') : [];
  const r = proj.length ? proj[proj.length - 1] : null;
  el.replaceChildren(r && r[f] !== null && r[f] !== undefined ? mark('span', 'projection', f, '', (FMT[f] || String)(r[f])) : document.createTextNode('—'));
});

dash.draw('topic', (el) => {
  const t = dash.data('topics'), id = el.dataset.t;
  el.replaceChildren();
  const r = t.status === 'ok' ? t.data.find((x) => x.topic === id) : null;
  if (!r) { el.append(mark('span', null, null, null, t.status === 'ok' ? 'Log a week' : t.status === 'loading' ? 'Loading…' : '—', 'wb-chip none')); return; }
  el.append(mark('span', 'topics', 'status', '', r.status, 'wb-chip ' + r.level));
  const d = mark('div', 'topics', 'detail', '', r.detail, 'wb-sub wb-topic-detail');
  el.append(d);
});

dash.draw('capweek', (el) => { const l = lastWeek(); el.textContent = l ? 'week ' + WB.wk(l.week) : 'the latest week'; });
dash.draw('cap', (el) => {
  const s = dash.data('weeks'), f = el.dataset.f, l = lastWeek();
  el.replaceChildren();
  if (s.status !== 'ok' || !l) { el.textContent = '—'; return; }
  const row = s.data.find((r) => r.week === l.week);
  const v = row ? row[f] : undefined;
  if (v === null || v === undefined || v === '') { el.append(mark('span', null, null, null, 'Not logged', 'wb-chip none')); return; }
  const txt = typeof v === 'number' ? (f === 'offline' ? F.pm(v, 1) + ' yd' : ['launch', 'attack', 'dyn_loft', 'club_path', 'face_angle'].includes(f) ? F.deg(v) : f === 'temp' ? v + '°F' : f === 'sim_alt' ? F.int(v) + ' ft' : FMT[f] ? FMT[f](v) : f === 'spin' || f === 'sim_alt' ? F.int(v) : f === 'smash_device' ? F.sm(v) : String(v)) : String(v);
  el.append(mark('span', null, null, null, txt, 'wb-chip ok'));
});

dash.draw('refrows', (el) => {
  const b = dash.data('benchmarks');
  el.replaceChildren();
  if (b.status !== 'ok') { msgRow(el, 9, loadingText(b.status, 'The benchmarks')); return; }
  b.data.forEach((r) => {
    const tr = document.createElement('tr');
    [r.label, F.mph(r.club_speed), F.mph(r.ball_speed), F.sm(r.smash), r.attack === null || r.attack === undefined ? '—' : F.sg(r.attack, 1) + '°', F.deg(r.launch), F.int(r.spin), F.int(r.carry)].forEach((t, i) => { const td = document.createElement('td'); td.textContent = t; if (i === 0) td.className = 'wb-wrap'; tr.append(td); });
    const td = document.createElement('td');
    td.className = 'wb-wrap';
    if (typeof r.url === 'string' && r.url.indexOf('https://') === 0) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.source; td.append(a); } else td.textContent = r.source || '—';
    tr.append(td);
    el.append(tr);
  });
});

/* ---------- Driver dashboard: trends, dispersion, shot shape, golfers side by side ---------- */
const TREND = {
  club: {label: 'Club speed', unit: 'mph', d: 1, sd: 'sd_club'},
  ball: {label: 'Ball speed', unit: 'mph', d: 1, sd: 'sd_ball'},
  smash: {label: 'Smash', unit: '', d: 2, sd: 'sd_smash', target: true},
  launch: {label: 'Launch', unit: '°', d: 1, sd: 'sd_launch', band: [L_LO, L_HI]},
  spin: {label: 'Spin', unit: 'rpm', d: 0, sd: 'sd_spin', band: [SP_LO, SP_HI]},
  carry: {label: 'Carry', unit: 'yd', d: 0, sd: 'sd_carry'},
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const stdev = (a) => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1)); };
const fmtD = (v, d) => (v === null || v === undefined ? '—' : d === 0 ? Math.round(v).toLocaleString('en-US') : Number(v).toFixed(d));
const withUnit = (txt, unit) => (txt === '—' ? txt : unit === '°' ? txt + '°' : unit ? txt + ' ' + unit : txt);

dash.calc('trend', {
  inputs: ['weeks', 'csvweeks', 'checks', 'altitude'],
  fn: (weeks, csv, checks, alt) => {
    const c = new Map(csv.map((x) => [x.week, x])), k = new Map(checks.map((x) => [x.week, x]));
    const sea = dash.params().cview === 'sea', ratio = new Map(alt.map((a) => [a.week, a.carry > 0 ? a.carry_sea / a.carry : 1]));
    return weeks.map((w) => {
      const cw = c.get(w.week) || {}, ck = k.get(w.week) || {};
      const club = num(w.club_speed), ball = num(w.ball_speed);
      const o = {week: w.week, flagged: ck.verdict === 'Doesn’t add up', club, ball, smash: club && ball !== null ? ball / club : null, launch: num(w.launch), spin: num(w.spin), carry: num(w.carry)};
      ['sd_club', 'sd_ball', 'sd_smash', 'sd_launch', 'sd_spin', 'sd_carry'].forEach((s) => { o[s] = cw[s] === undefined ? null : cw[s]; });
      if (sea && ratio.has(w.week)) { const f = ratio.get(w.week); if (o.carry !== null) o.carry *= f; if (o.sd_carry !== null) o.sd_carry *= f; }
      return o;
    });
  },
});
dash.draw('trendhead', (el) => {
  const t = dash.data('trend'), key = el.dataset.m, m = TREND[key];
  el.replaceChildren();
  if (t.status !== 'ok') return;
  const pts = t.data.filter((r) => r[key] !== null);
  if (!pts.length) { el.textContent = '—'; return; }
  const last = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null;
  const v = document.createElement('span'); v.className = 'wb-trend-val'; v.textContent = withUnit(fmtD(last[key], m.d), m.unit === '°' ? '°' : '');
  el.append(v);
  if (prev) { const s = document.createElement('span'); s.className = 'wb-sub'; s.textContent = F.sg(last[key] - prev[key], m.d) + ' vs wk ' + WB.wk(prev.week); el.append(s); }
});
dash.draw('trendchart', (el) => {
  const t = dash.data('trend'), key = el.dataset.m, m = TREND[key];
  el.replaceChildren();
  if (t.status !== 'ok') { el.textContent = loadingText(t.status, 'This chart'); return; }
  const pts = t.data.filter((r) => r[key] !== null);
  chartTable(el, null);
  if (!pts.length) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = 'Not logged yet.'; el.append(p); return; }
  chartTable(el, m.label + ' by week', ['Week', m.label + (m.unit ? ' (' + m.unit + ')' : ''), 'Spread ±'], pts.map((r) => [WB.wk(r.week), rd(r[key], m.d), rd(r[m.sd], m.d)]));
  const sdOf = (r) => (typeof r[m.sd] === 'number' ? r[m.sd] : 0);
  const target = m.target ? Number(dash.params().smash_target) : null;
  const wn = dash.data('windows');
  const band = wn.status === 'ok' ? (key === 'launch' ? wn.data.launch : key === 'spin' ? wn.data.spin : null) : m.band || null;
  let vals = pts.flatMap((r) => [r[key] - sdOf(r), r[key] + sdOf(r)]);
  if (target !== null) vals.push(target);
  if (band) vals = vals.concat(band);
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.02 || 1;
  const W = Math.max(200, el.clientWidth || 280), H = 150, mt = 8, mb = 22;
  const y = d3.scaleLinear().domain([lo - pad, hi + pad]).range([H - mb, mt]).nice(4);
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', m.label + ' by week');
  const yf = m.d === 0 ? d3.format(',.0f') : m.d === 2 ? d3.format('.2f') : d3.format('.1f');
  const yAxis = svg.append('g').attr('class', 'wb-axis').call(d3.axisLeft(y).ticks(3).tickSizeOuter(0).tickFormat(yf));
  let ml = 8;
  yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 10); });
  yAxis.attr('transform', `translate(${ml},0)`);
  const w0 = pts[0].week, w1 = pts[pts.length - 1].week;
  const x = d3.scaleLinear().domain(w0 === w1 ? [w0 - 1, w1 + 1] : [w0 - 0.5, w1 + 0.5]).range([ml + 4, W - 6]);
  svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(3).tickSize(-(W - ml - 6)).tickFormat(''));
  if (band) svg.append('rect').attr('x', ml).attr('width', W - ml - 6).attr('y', y(band[1])).attr('height', Math.max(0, y(band[0]) - y(band[1]))).style('fill', 'var(--cds-chart-muted)').style('fill-opacity', 0.4);
  if (target !== null) svg.append('line').attr('x1', ml).attr('x2', W - 6).attr('y1', y(target)).attr('y2', y(target)).style('stroke', dash.colors[1]).style('stroke-width', 1.5).style('stroke-dasharray', '4 3');
  svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickValues(weekTicks(x, pts.map((r) => r.week), 30)).tickFormat((w) => WB.wk(w)).tickSizeOuter(0));
  svg.append('g').selectAll('line').data(pts.filter((r) => sdOf(r) > 0)).join('line').attr('x1', (r) => x(r.week)).attr('x2', (r) => x(r.week)).attr('y1', (r) => y(r[key] - sdOf(r))).attr('y2', (r) => y(r[key] + sdOf(r))).style('stroke', dash.colors[0]).style('stroke-opacity', 0.3).style('stroke-width', 8).style('stroke-linecap', 'round');
  if (pts.length > 1) svg.append('path').datum(pts).attr('d', d3.line().x((r) => x(r.week)).y((r) => y(r[key]))).style('fill', 'none').style('stroke', dash.colors[0]).style('stroke-width', 2);
  svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (r) => x(r.week)).attr('cy', (r) => y(r[key])).attr('r', 4.5).style('fill', (r) => (r.flagged ? 'var(--color-panel)' : dash.colors[0])).style('stroke', (r) => (r.flagged ? 'var(--color-bad)' : 'var(--color-panel)')).style('stroke-width', 2);
  const tip = d3.select(el).append('div').attr('class', 'wb-tip').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
    .on('pointermove pointerenter', (event) => {
      const [mx, my] = d3.pointer(event);
      const r = pts.find((q) => q.week === Math.round(x.invert(mx)));
      if (!r) { tip.style('display', 'none'); return; }
      tip.style('display', null).html('');
      tip.append('div').text('Week ' + WB.wk(r.week) + (r.flagged ? ', doesn’t add up' : ''));
      tip.append('div').append('span').text(withUnit(fmtD(r[key], m.d), m.unit) + (sdOf(r) ? ' ± ' + fmtD(sdOf(r), key === 'smash' ? 3 : m.d) : ''));
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 36) + 'px');
    })
    .on('pointerleave', () => tip.style('display', 'none'));
});

/* Dispersion: carry against offline for the latest imported week, with a ring that holds about 86% of drives (two spreads). */
function ringOf(pts) {
  const n = pts.length;
  if (n < 3) return null;
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  let sxx = 0, syy = 0, sxy = 0;
  pts.forEach((p) => { sxx += (p.x - mx) * (p.x - mx); syy += (p.y - my) * (p.y - my); sxy += (p.x - mx) * (p.y - my); });
  sxx /= n - 1; syy /= n - 1; sxy /= n - 1;
  const tr = (sxx + syy) / 2, dt = Math.sqrt(((sxx - syy) / 2) * ((sxx - syy) / 2) + sxy * sxy);
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), a = 2 * Math.sqrt(tr + dt), b = 2 * Math.sqrt(Math.max(0, tr - dt));
  const c = Math.cos(th), s = Math.sin(th);
  const path = [];
  for (let k = 0; k <= 72; k++) { const t = (k / 72) * 2 * Math.PI; path.push([mx + a * Math.cos(t) * c - b * Math.sin(t) * s, my + a * Math.cos(t) * s + b * Math.sin(t) * c]); }
  return {mx, my, width: 2 * Math.sqrt(a * a * c * c + b * b * s * s), depth: 2 * Math.sqrt(a * a * s * s + b * b * c * c), path, n};
}
dash.calc('dispweeks', {
  inputs: ['csvweeks', 'altitude'],
  fn: (csv, alt) => csv.map((c) => {
    const a = dash.params().cview === 'sea' ? alt.find((x) => x.week === c.week) : null, f = a && a.carry > 0 ? a.carry_sea / a.carry : 1;
    return {week: c.week, pts: c.pts.filter((p) => p.used && p.carry !== null && p.offline !== null).map((p) => (f === 1 ? p : Object.assign({}, p, {carry: p.carry * f})))};
  })
    .filter((c) => c.pts.length >= 3).slice(-2).map((c) => Object.assign(c, {ring: ringOf(c.pts.map((p) => ({x: p.offline, y: p.carry})))})),
});
dash.draw('dispchart', (el) => {
  const d = dash.data('dispweeks');
  el.replaceChildren();
  chartTable(el, null);
  if (d.status !== 'ok') { el.textContent = loadingText(d.status, 'This chart'); return; }
  if (!d.data.length) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = 'Import a GSPro CSV with carry and offline to see where drives land.'; el.append(p); return; }
  const cur = d.data[d.data.length - 1], prev = d.data.length > 1 ? d.data[0] : null;
  chartTable(el, 'Where drives land', ['Week', 'Carry (yd)', 'Offline (yd, + is right)'], d.data.flatMap((w) => w.pts.map((p) => [WB.wk(w.week), rd(p.carry, 1), rd(p.offline, 1)])));
  const all = d.data.flatMap((w) => w.pts.map((p) => ({x: p.offline, y: p.carry})).concat(w.ring ? w.ring.path.map(([x, y]) => ({x, y})) : []));
  const xm = Math.max(10, ...all.map((p) => Math.abs(p.x))) * 1.1;
  const W = Math.max(260, el.clientWidth || 320), H = 300, mt = 10, mb = 30;
  const y = d3.scaleLinear().domain([Math.min(...all.map((p) => p.y)) - 4, Math.max(...all.map((p) => p.y)) + 4]).range([H - mb, mt]).nice(5);
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', 'Carry against offline for week ' + cur.week);
  const yAxis = svg.append('g').attr('class', 'wb-axis').call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
  let ml = 8;
  yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 10); });
  yAxis.attr('transform', `translate(${ml},0)`);
  const x = d3.scaleLinear().domain([-xm, xm]).range([ml + 6, W - 8]).nice(6);
  svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - ml - 8)).tickFormat(''));
  svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(W / 70))).tickFormat((v) => (v === 0 ? '0' : Math.abs(v) + (v < 0 ? ' L' : ' R'))).tickSizeOuter(0));
  svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', mt).attr('y2', H - mb).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '3 4');
  const line = d3.line().x((p) => x(p[0])).y((p) => y(p[1]));
  if (prev && prev.ring) svg.append('path').attr('d', line(prev.ring.path)).style('fill', 'none').style('stroke', 'var(--cds-chart-reference)').style('stroke-width', 1.5).style('stroke-dasharray', '5 4');
  if (cur.ring) svg.append('path').attr('d', line(cur.ring.path)).style('fill', dash.colors[0]).style('fill-opacity', 0.08).style('stroke', dash.colors[0]).style('stroke-width', 2);
  svg.append('g').selectAll('circle').data(cur.pts).join('circle').attr('cx', (p) => x(p.offline)).attr('cy', (p) => y(p.carry)).attr('r', 4).style('fill', dash.colors[0]).style('fill-opacity', 0.85).style('stroke', 'var(--color-panel)').style('stroke-width', 1);
  const tip = d3.select(el).append('div').attr('class', 'wb-tip').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
    .on('pointermove pointerenter', (event) => {
      const [mx, my] = d3.pointer(event);
      let best = null, bd = 400;
      cur.pts.forEach((p) => { const dd = (x(p.offline) - mx) * (x(p.offline) - mx) + (y(p.carry) - my) * (y(p.carry) - my); if (dd < bd) { bd = dd; best = p; } });
      if (!best) { tip.style('display', 'none'); return; }
      tip.style('display', null).html('');
      tip.append('div').text(`Carry ${F.int(best.carry)} yd`);
      tip.append('div').append('span').text(Math.abs(best.offline) < 0.05 ? 'On the line' : `${Math.abs(best.offline).toFixed(1)} yd ${best.offline < 0 ? 'left' : 'right'}`);
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 40) + 'px');
    })
    .on('pointerleave', () => tip.style('display', 'none'));
});
dash.draw('disptext', (el) => {
  const d = dash.data('dispweeks');
  const leg = document.getElementById('disp-prev');
  if (leg) leg.hidden = !(d.status === 'ok' && d.data.length > 1);
  if (d.status !== 'ok' || !d.data.length || !d.data[d.data.length - 1].ring) { el.textContent = ''; return; }
  const cur = d.data[d.data.length - 1], prev = d.data.length > 1 ? d.data[0] : null, r = cur.ring;
  const side = Math.abs(r.mx) < 0.5 ? 'on the target line' : `${Math.abs(r.mx).toFixed(1)} yd ${r.mx < 0 ? 'left' : 'right'} of the line`;
  let t = `Week ${WB.wk(cur.week)}: the ring holds about 86% of drives, a window ${Math.round(r.width)} yd wide and ${Math.round(r.depth)} yd deep, centered ${side}.`;
  if (prev && prev.ring) t += ` Week ${WB.wk(prev.week)} (dashed): ${Math.round(prev.ring.width)} by ${Math.round(prev.ring.depth)} yd.`;
  el.textContent = t;
});

/* Shot shape and delivery from GSPro's direction, curve, face and path data. Directions assume a right-handed golfer. */
const SHAPE = [['hla', 'Start direction'], ['axis', 'Curve (spin axis)'], ['face', 'Face to target'], ['path', 'Club path'], ['f2p', 'Face to path'], ['attack', 'Attack angle'], ['dyn_loft', 'Dynamic loft'], ['spin_loft', 'Spin loft (loft minus attack angle)'], ['peak', 'Peak height'], ['descent', 'Descent angle']];
dash.calc('shape', {
  inputs: ['csvweeks'],
  fn: (csv) => csv.slice(-2).map((c) => {
    const o = {week: c.week};
    const val = (p, k) => {
      if (k === 'spin_loft') return typeof p.dyn_loft === 'number' && typeof p.attack === 'number' ? p.dyn_loft - p.attack : null;
      return typeof p[k] === 'number' ? p[k] : null;
    };
    SHAPE.forEach(([k]) => { const v = c.pts.filter((p) => p.used && val(p, k) !== null).map((p) => val(p, k)); o[k] = mean(v); o[k + '_sd'] = stdev(v); });
    return o;
  }),
});
function shapeVal(k, v) {
  if (v === null || v === undefined) return '—';
  const a = Math.abs(v).toFixed(1), z = Math.abs(v) < 0.05;
  if (k === 'hla' || k === 'face') return z ? '0.0°' : a + '° ' + (v < 0 ? 'left' : 'right');
  if (k === 'axis') return z ? '0.0°' : a + '° ' + (v < 0 ? 'draw' : 'fade');
  if (k === 'path') return z ? '0.0°' : a + '° ' + (v < 0 ? 'out-to-in' : 'in-to-out');
  if (k === 'f2p') return z ? '0.0°' : a + '° ' + (v < 0 ? 'closed' : 'open');
  if (k === 'attack') return (v > 0 ? '+' : v < 0 ? '−' : '') + a + '°';
  if (k === 'peak') return Math.round(v) + ' yd';
  return a + '°';
}
dash.draw('shapetext', (el) => {
  const s = dash.data('shape');
  if (s.status !== 'ok' || !s.data.length) { el.textContent = s.status === 'ok' ? 'Import a GSPro CSV to see the shot shape.' : ''; return; }
  const r = s.data[s.data.length - 1], parts = [];
  if (r.hla !== null) parts.push(Math.abs(r.hla) < 1 ? 'Drives start on line' : `Drives start ${Math.abs(r.hla).toFixed(1)}° ${r.hla < 0 ? 'left' : 'right'}`);
  if (r.axis !== null) parts.push(Math.abs(r.axis) < 2 ? 'fly fairly straight' : `curve ${r.axis < 0 ? 'left (a draw)' : 'right (a fade)'}`);
  let t = parts.length ? `Week ${WB.wk(r.week)}: ${parts.join(' and ')}.` : `Week ${WB.wk(r.week)}: no direction data in the file.`;
  if (r.f2p !== null) t += ` The face is ${Math.abs(r.f2p).toFixed(1)}° ${r.f2p < 0 ? 'closed' : 'open'} to the path.`;
  if (r.hla_sd !== null) t += ` Start-line spread ±${r.hla_sd.toFixed(1)}°.`;
  if (r.spin_loft !== null && r.spin_loft !== undefined) t += ` Spin loft ${r.spin_loft.toFixed(1)}°: dynamic loft minus attack angle, the main driver of spin.`;
  el.textContent = t;
});
dash.draw('shaperows', (el) => {
  const s = dash.data('shape');
  el.replaceChildren();
  const head = document.getElementById('shape-head');
  if (s.status !== 'ok') { msgRow(el, 3, loadingText(s.status, 'Shot shape')); return; }
  if (!s.data.length) { msgRow(el, 3, 'Import a GSPro CSV to fill this in.'); return; }
  const cur = s.data[s.data.length - 1], prev = s.data.length > 1 ? s.data[0] : null;
  if (head) { head.cells[1].textContent = 'Week ' + WB.wk(cur.week); head.cells[2].textContent = prev ? 'Week ' + WB.wk(prev.week) : 'Earlier'; }
  SHAPE.forEach(([k, label]) => {
    if (cur[k] === null && (!prev || prev[k] === null)) return;
    const tr = document.createElement('tr');
    const cell = (r) => (r && r[k] !== null ? shapeVal(k, r[k]) + (r[k + '_sd'] !== null ? ' ±' + r[k + '_sd'].toFixed(1) : '') : '—');
    [label, cell(cur), cell(prev)].forEach((t, i) => { const td = document.createElement('td'); td.textContent = t; if (i === 0) td.className = 'wb-wrap'; tr.append(td); });
    el.append(tr);
  });
  if (!el.children.length) msgRow(el, 3, 'These files have no direction or delivery columns.');
});

/* Golfers side by side, from each golfer's own latest week. */
dash.draw('compare', (el) => {
  el.replaceChildren();
  const list = WB.golfers();
  if (list.length < 2) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = 'Add a second golfer to compare.'; el.append(p); return; }
  const target = Number(dash.params().smash_target);
  const cols = list.map((g) => {
    const r = WB.rawFor(g.id);
    if (!r || r.typed === null || r.imports === null) return {g, loading: true};
    const csv = importWeeksOf(r.imports, target), weeks = mergeWeeks(r.typed, csv);
    const last = weeks.length ? weeks[weeks.length - 1] : null;
    const firstSpeed = weeks.find((w) => num(w.club_speed) !== null);
    return {g, last, ci: last ? csv.find((c) => c.week === last.week) || null : null, firstSpeed};
  });
  const v = (c, f) => (c.loading ? 'Loading…' : !c.last ? '—' : f(c));
  const ROWS = [
    ['Latest week', (c) => 'Week ' + WB.wk(c.last.week) + (c.last.date ? ', ' + c.last.date : '')],
    ['Club speed (mph)', (c) => F.mph(c.last.club_speed)],
    ['Ball speed (mph)', (c) => F.mph(c.last.ball_speed)],
    ['Smash, ball ÷ club', (c) => (c.last.club_speed && c.last.ball_speed ? F.sm(c.last.ball_speed / c.last.club_speed) : '—')],
    ['Launch', (c) => F.deg(c.last.launch)],
    ['Spin (rpm)', (c) => F.int(c.last.spin)],
    ['Carry (yd)', (c) => F.int(c.last.carry)],
    ['Total (yd)', (c) => F.int(c.last.total)],
    ['Driver shots', (c) => (c.last.shots === null ? '—' : String(c.last.shots))],
    ['Smash spread', (c) => (c.ci ? F.pm(c.ci.sd_smash, 3) : '—')],
    ['Offline spread (yd)', (c) => (c.ci ? F.pm(c.ci.sd_offline, 1) : '—')],
    ['Club speed since first week', (c) => (c.firstSpeed && c.firstSpeed.week !== c.last.week && num(c.last.club_speed) !== null ? F.sg(c.last.club_speed - c.firstSpeed.club_speed, 1) + ' mph since week ' + WB.wk(c.firstSpeed.week) : '—')],
  ];
  const wrap = document.createElement('div'); wrap.className = 'wb-scroll';
  const table = document.createElement('table'); table.className = 'wb-table wb-compare';
  const thead = document.createElement('thead'), hr = document.createElement('tr');
  const th0 = document.createElement('th'); th0.className = 'wb-l'; th0.textContent = 'Driver'; hr.append(th0);
  cols.forEach((c) => { const th = document.createElement('th'); th.textContent = c.g.name; hr.append(th); });
  thead.append(hr);
  const tbody = document.createElement('tbody');
  ROWS.forEach(([label, f]) => {
    const tr = document.createElement('tr');
    const td0 = document.createElement('td'); td0.textContent = label; tr.append(td0);
    cols.forEach((c) => { const td = document.createElement('td'); td.textContent = v(c, f); tr.append(td); });
    tbody.append(tr);
  });
  table.append(thead, tbody); wrap.append(table); el.append(wrap);
});


/* Two views of one app: Import on the GSPro PC, Analysis by player on the iPad. */
dash.draw('modeswitch', (el) => {
  const m = WB.mode();
  if (el.dataset.m === m && el.children.length) return;
  el.dataset.m = m;
  el.replaceChildren();
  [['analysis', 'Analysis'], ['ingest', 'Import']].forEach(([v, t]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'wb-seg wb-seg-sm' + (m === v ? ' on' : ''); b.textContent = t; b.setAttribute('aria-pressed', m === v ? 'true' : 'false');
    b.addEventListener('click', () => WB.setMode(v));
    el.append(b);
  });
});
dash.draw('ingeststatus', (el) => {
  el.replaceChildren();
  const list = WB.golfers();
  if (!list.length) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = WB.configLoaded() ? 'No golfers yet.' : 'Loading golfers…'; el.append(p); return; }
  list.forEach((g) => {
    const r = WB.rawFor(g.id);
    const card = document.createElement('div'); card.className = 'wb-card';
    const n = document.createElement('div'); n.className = 'wb-lab'; n.textContent = g.name;
    const big = document.createElement('div'); big.className = 'wb-num';
    const sub = document.createElement('div'); sub.className = 'wb-sub';
    if (!r || r.imports === null) { big.textContent = '…'; sub.textContent = 'Loading'; }
    else {
      const imps = r.imports, latest = imps.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0], sp = WB.profileSpeed(g.id);
      big.textContent = imps.length.toLocaleString('en-US');
      sub.textContent = (imps.length === 1 ? 'session saved' : 'sessions saved') + (latest ? ` · latest ${latest.date}, week ${WB.wk(latest.week)}` : '') + (sp ? ` · driver about ${sp.toFixed(1)} mph` : '');
    }
    card.append(n, big, sub);
    el.append(card);
  });
});
dash.draw('gsettings', (el) => {
  const list = WB.golfers();
  const key = list.map((g) => [g.id, g.name, g.start, g.speed].join(':')).join('|') + '#' + WB.configLoaded();
  if (el.dataset.key === key && el.children.length) return;
  el.dataset.key = key;
  el.replaceChildren();
  if (!list.length) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = WB.configLoaded() ? 'No golfers yet.' : 'Loading golfers…'; el.append(p); return; }
  list.forEach((g) => {
    const row = document.createElement('div'); row.className = 'wb-gset'; row.dataset.g = g.id;
    const nm = document.createElement('div'); nm.className = 'wb-gset-name'; nm.textContent = g.name;
    const l1 = document.createElement('label'); l1.textContent = 'Monday of week 1';
    const i1 = document.createElement('input'); i1.type = 'date'; i1.name = 'start'; i1.value = g.start || ''; l1.append(i1);
    const l2 = document.createElement('label'); l2.textContent = 'Typical driver club speed (mph)';
    const i2 = document.createElement('input'); i2.type = 'number'; i2.name = 'speed'; i2.min = '40'; i2.max = '160'; i2.step = '0.1'; i2.inputMode = 'decimal'; i2.value = g.speed === null ? '' : String(g.speed);
    const learned = WB.profileSpeed(g.id, true);
    i2.placeholder = learned ? 'Learned: ' + learned.toFixed(1) : 'Learned from files';
    l2.append(i2);
    row.append(nm, l1, l2);
    el.append(row);
  });
});
(function () {
  const form = document.getElementById('gsettings-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('gsettings-msg');
    const list = WB.golfers().map((g) => {
      const row = form.querySelector('.wb-gset[data-g="' + g.id + '"]');
      const st = row ? row.querySelector('input[name=start]').value : g.start;
      const sp = row ? Number(row.querySelector('input[name=speed]').value) : g.speed;
      return {id: g.id, name: g.name, start: /^\d{4}-\d{2}-\d{2}$/.test(st || '') ? st : null, speed: sp && sp >= 40 && sp <= 160 ? Math.round(sp * 10) / 10 : null};
    });
    try { await WB.save('config/golfers', {list}); if (msgEl) { msgEl.textContent = 'Saved.'; msgEl.className = 'wb-msg wb-good'; msgEl.hidden = false; } }
    catch (err) { if (msgEl) { msgEl.textContent = WB.noDb ? 'Saving is off in this view.' : 'That wasn’t saved.'; msgEl.className = 'wb-msg wb-badc'; msgEl.hidden = false; } }
  });
})();

/* ---------- Whole bag: every club from the saved sessions, with gapping ---------- */
function clubInfo(label) {
  const raw = String(label || '').trim(), c = raw.toLowerCase().replace(/[\s_-]+/g, '');
  let m;
  if (/^(dr|driver|1w|w1|d|drv|1wood|wood1)$/.test(c) || /driver/.test(c)) return {key: 'dr', name: 'Driver', order: 0, cat: 'wood'};
  if ((m = c.match(/^(\d)(?:w|wood)$/) || c.match(/^w(\d)$/))) return {key: 'w' + m[1], name: m[1] + ' wood', order: 10 + Number(m[1]), cat: 'wood'};
  if ((m = c.match(/^(\d)(?:h|hy|hyb|hybrid)$/) || c.match(/^h(\d)$/))) return {key: 'h' + m[1], name: m[1] + ' hybrid', order: 30 + Number(m[1]), cat: 'hybrid'};
  if ((m = c.match(/^(\d)(?:i|iron)$/) || c.match(/^i(\d)$/))) return {key: 'i' + m[1], name: m[1] + ' iron', order: 50 + Number(m[1]), cat: 'iron'};
  if (/^(pw|p|pitchingwedge|pitching)$/.test(c)) return {key: 'pw', name: 'Pitching wedge', order: 70, cat: 'wedge'};
  if (/^(gw|aw|uw|gapwedge|approachwedge)$/.test(c)) return {key: 'gw', name: 'Gap wedge', order: 72, cat: 'wedge'};
  if (/^(sw|sandwedge)$/.test(c)) return {key: 'sw', name: 'Sand wedge', order: 74, cat: 'wedge'};
  if (/^(lw|lobwedge)$/.test(c)) return {key: 'lw', name: 'Lob wedge', order: 76, cat: 'wedge'};
  if ((m = c.match(/^(\d{2})(?:°|deg)?$/)) && Number(m[1]) >= 44 && Number(m[1]) <= 64) return {key: 'x' + m[1], name: m[1] + '° wedge', order: 70 + (Number(m[1]) - 44) / 2, cat: 'wedge'};
  if (/^(pt|putter|putt)$/.test(c)) return null;
  return {key: 'o-' + c, name: raw || 'Unlabelled', order: 90, cat: 'iron'};
}
const CLUB_LIMITS = {wood: {sm: [1.0, 1.56], sp: 8000}, hybrid: {sm: [1.0, 1.52], sp: 9000}, iron: {sm: [1.0, 1.5], sp: 11000}, wedge: {sm: [0.95, 1.4], sp: 13000}};
/* A shot counts unless it looks like a misread or a top for its kind of club (shared by Whole bag and Club by club). */
function shotOk(r, cat) {
  const L = CLUB_LIMITS[cat] || CLUB_LIMITS.iron;
  return r.ball !== null && (r.club === null || (r.ball / r.club >= L.sm[0] && r.ball / r.club <= L.sm[1])) && (r.launch === null || (r.launch >= -10 && r.launch <= 50)) && (r.spin === null || (r.spin >= 300 && r.spin <= L.sp)) && (r.carry === null || r.carry > 5);
}
dash.calc('bag', {
  inputs: ['imports'],
  fn: (imports) => {
    const span = dash.params().bagspan || 'last4';
    const dated = imports.filter((i) => Number.isInteger(i.week));
    if (!dated.length) return {clubs: [], from: null, to: null, sessions: 0, span};
    const W = Math.max(...dated.map((i) => i.week));
    const keep = dated.filter((i) => span === 'all' || (span === 'latest' ? i.week === W : i.week > W - (span === 'last12' ? 12 : 4)));
    const by = new Map();
    keep.forEach((i) => {
      const ix = {};
      i.cols.forEach((c, k) => { ix[c] = k + 1; });
      i.arows.forEach((r) => {
        const info = clubInfo(r[0]);
        if (!info) return;
        const g = by.get(info.key) || Object.assign({rows: [], sessions: new Set(), labels: new Set()}, info);
        const get = (c) => (ix[c] === undefined ? null : r[ix[c]]);
        g.rows.push({club: get('club_speed'), ball: get('ball_speed'), launch: get('launch'), spin: get('spin'), carry: get('carry'), total: get('total'), offline: get('offline'), peak: get('peak'), descent: get('descent')});
        g.sessions.add(i.id); g.labels.add(r[0]);
        by.set(info.key, g);
      });
    });
    const out = [...by.values()].map((g) => {
      const used = g.rows.filter((r) => shotOk(r, g.cat));
      const col = (k) => used.map((r) => r[k]).filter((v) => v !== null);
      const both = used.filter((r) => r.club && r.ball !== null);
      return {key: g.key, name: g.name, order: g.order, cat: g.cat, labels: [...g.labels].join(', '), n: g.rows.length, n_used: used.length, sessions: g.sessions.size,
        carry: mean(col('carry')), carry_sd: stdev(col('carry')), total: mean(col('total')), ball: mean(col('ball')), club: mean(both.map((r) => r.club)),
        smash: both.length ? mean(both.map((r) => r.ball / r.club)) : null, launch: mean(col('launch')), spin: mean(col('spin')), peak: mean(col('peak')), descent: mean(col('descent')), offline_sd: stdev(col('offline'))};
    }).filter((c) => c.n_used >= 1).sort((a, b) => a.order - b.order || (b.carry || 0) - (a.carry || 0));
    const real = out.filter((c) => c.carry !== null && c.n_used >= 3);
    real.forEach((c, k) => {
      const nx = real[k + 1];
      if (!nx) return;
      c.gap = c.carry - nx.carry;
      c.gap_to = nx.name;
      const wide = c.cat === 'wood' || nx.cat === 'wood' ? 25 : 18;
      c.gap_flag = c.gap < 0 ? 'overlap' : c.gap < 7 ? 'tight' : c.gap > wide ? 'wide' : '';
    });
    const dates = keep.map((i) => i.date).filter(Boolean).sort();
    return {clubs: out, from: dates[0] || null, to: dates[dates.length - 1] || null, sessions: keep.length, span, week: W};
  },
});
dash.draw('bagnote', (el) => {
  const b = dash.data('bag');
  if (b.status !== 'ok') { el.textContent = b.status === 'loading' ? 'Loading…' : '—'; return; }
  const d = b.data;
  el.textContent = !d.clubs.length ? 'No imported sessions yet for this golfer.' : `${d.sessions} session${d.sessions === 1 ? '' : 's'}${d.from ? `, ${d.from}${d.to && d.to !== d.from ? ' to ' + d.to : ''}` : ''}. Likely misreads and tops are left out using limits for each kind of club.`;
});
dash.draw('gapchart', (el) => {
  const b = dash.data('bag');
  el.replaceChildren();
  chartTable(el, null);
  if (b.status !== 'ok' || !b.data.clubs.length) return;
  const clubs = b.data.clubs.filter((c) => c.carry !== null);
  if (!clubs.length) { el.textContent = 'These sessions have no carry data.'; return; }
  chartTable(el, 'Carry by club', ['Club', 'Carry (yd)', 'Carry ±', 'Total (yd)', 'Shots'], clubs.map((c) => [c.name, rd(c.carry, 0), rd(c.carry_sd, 0), rd(c.total, 0), c.n_used]));
  const max = Math.max(...clubs.map((c) => Math.max(c.total || 0, (c.carry || 0) + (c.carry_sd || 0)))) * 1.04;
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100)) + '%';
  clubs.forEach((c) => {
    const row = document.createElement('div'); row.className = 'wb-gap-row' + (c.n_used < 3 ? ' thin' : '');
    const nm = document.createElement('div'); nm.className = 'wb-gap-name'; nm.textContent = c.name;
    const tr = document.createElement('div'); tr.className = 'wb-gap-track';
    if (c.total !== null && c.total > c.carry) { const t = document.createElement('i'); t.className = 'wb-gap-total'; t.style.left = pct(c.carry); t.style.width = `calc(${pct(c.total)} - ${pct(c.carry)})`; tr.append(t); }
    const bar = document.createElement('i'); bar.className = 'wb-gap-carry'; bar.style.width = pct(c.carry); tr.append(bar);
    if (c.carry_sd) { const w = document.createElement('i'); w.className = 'wb-gap-sd'; w.style.left = pct(c.carry - c.carry_sd); w.style.width = `calc(${pct(c.carry + c.carry_sd)} - ${pct(c.carry - c.carry_sd)})`; tr.append(w); }
    const nums = document.createElement('div'); nums.className = 'wb-gap-nums';
    nums.textContent = `${Math.round(c.carry)}${c.carry_sd ? ' ±' + Math.round(c.carry_sd) : ''} · ${c.total === null ? '—' : Math.round(c.total)}`;
    row.append(nm, tr, nums);
    el.append(row);
    if (c.gap !== undefined) {
      const g = document.createElement('div'); g.className = 'wb-gap-step' + (c.gap_flag ? ' ' + c.gap_flag : '');
      g.textContent = c.gap_flag === 'overlap' ? `${c.gap_to} carries farther (${Math.round(-c.gap)} yd)` : `${Math.round(c.gap)} yd to ${c.gap_to.toLowerCase()}${c.gap_flag === 'tight' ? ': tight' : c.gap_flag === 'wide' ? ': wide' : ''}`;
      el.append(g);
    }
  });
});
dash.draw('bagrows', (el) => {
  const b = dash.data('bag');
  el.replaceChildren();
  if (b.status !== 'ok') { msgRow(el, 12, loadingText(b.status, 'The bag')); return; }
  if (!b.data.clubs.length) { msgRow(el, 12, 'Import GSPro sessions to see every club.'); return; }
  b.data.clubs.forEach((c) => {
    const tr = document.createElement('tr');
    const f1 = (v) => (v === null ? '—' : v.toFixed(1)), f0 = (v) => (v === null ? '—' : Math.round(v).toLocaleString('en-US'));
    [c.name, `${c.n_used}${c.n > c.n_used ? ' (+' + (c.n - c.n_used) + ' out)' : ''}`, f0(c.carry), c.carry_sd === null ? '—' : '±' + c.carry_sd.toFixed(1), f0(c.total), f1(c.club), f1(c.ball), c.smash === null ? '—' : c.smash.toFixed(2), c.launch === null ? '—' : c.launch.toFixed(1) + '°', f0(c.spin), f0(c.peak), c.offline_sd === null ? '—' : '±' + c.offline_sd.toFixed(1)].forEach((t, i) => {
      const td = document.createElement('td'); td.textContent = t; if (i === 0) td.className = 'wb-wrap'; tr.append(td);
    });
    el.append(tr);
  });
});

/* Copy a golfer's every saved shot as CSV: a backup any spreadsheet opens. */
(function () {
  const btn = document.getElementById('copycsv'), out = document.getElementById('copycsv-msg');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const g = WB.golfer(), r = g ? WB.rawFor(g.id) : null;
    if (!r || !r.imports) { if (out) { out.textContent = 'Nothing loaded yet.'; out.hidden = false; } return; }
    const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [['date', 'week', 'file', 'club'].concat(WB.COLS).join(',')];
    r.imports.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach((s) => {
      const ix = s.cols.map((c) => WB.COLS.indexOf(c));
      s.arows.forEach((row) => {
        const vals = WB.COLS.map(() => '');
        ix.forEach((k, j) => { if (k >= 0 && row[j + 1] !== null) vals[k] = row[j + 1]; });
        lines.push([s.date, s.week, s.file, row[0]].concat(vals).map(esc).join(','));
      });
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      if (out) { out.textContent = `Copied ${(lines.length - 1).toLocaleString('en-US')} shots for ${g.name}. Paste into a spreadsheet or a text file.`; out.className = 'wb-msg wb-good'; out.hidden = false; }
    } catch (e) {
      if (out) { out.textContent = 'Copying was blocked here. Try again from the app window.'; out.className = 'wb-msg wb-badc'; out.hidden = false; }
    }
  });
})();

/* Backup and restore. A backup is every golfer, typed week, session and backlog item as JSON;
   a restore adds only what is missing, so it can never overwrite or duplicate what is already here. */
(function () {
  const copyBtn = document.getElementById('backup-copy'), copyMsg = document.getElementById('backup-msg');
  const goBtn = document.getElementById('restore-go'), box = document.getElementById('restore-text'), rMsg = document.getElementById('restore-msg');
  const say = (el, t, ok) => { if (el) { el.textContent = t; el.className = 'wb-msg ' + (ok ? 'wb-good' : 'wb-badc'); el.hidden = false; } };
  const plain = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const ID = /^[A-Za-z0-9_.~:@+-]{1,120}$/, GID = /^[a-z0-9][a-z0-9_-]{0,30}$/;
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const b = WB.backup(), gs = Object.values(b.golfers);
    const nS = gs.reduce((a, g) => a + g.sessions.length, 0), nW = gs.reduce((a, g) => a + g.weeks.length, 0), nR = gs.reduce((a, g) => a + (g.rounds || []).length, 0);
    const text = JSON.stringify(b);
    try {
      await navigator.clipboard.writeText(text);
      say(copyMsg, `Copied ${gs.length} golfers, ${nS} sessions, ${nR} rounds, ${nW} typed weeks and ${b.backlog.length} backlog items (${(text.length / 1e6).toFixed(1)} MB). Paste into a text file named driver-workbench-backup-${new Date().toISOString().slice(0, 10)}.json and keep it with the GSPro export folders.`, true);
    } catch (e) { say(copyMsg, 'Copying was blocked here. Try again from the app window.', false); }
  });
  if (goBtn && box) goBtn.addEventListener('click', async () => {
    let b;
    try { b = JSON.parse(box.value); } catch (e) { say(rMsg, 'That isn’t a backup: the text isn’t valid JSON.', false); return; }
    if (!plain(b) || b.app !== 'driver-workbench' || !plain(b.golfers)) { say(rMsg, 'That isn’t a Pin High (Driver Workbench) backup.', false); return; }
    const jobs = [], cur = WB.golfers();
    const list = plain(b.config) && Array.isArray(b.config.list) ? b.config.list.filter((g) => plain(g) && typeof g.id === 'string' && GID.test(g.id) && typeof g.name === 'string') : [];
    const addG = list.filter((g) => !cur.some((c) => c.id === g.id));
    if (plain(b.conditions) && WB.conditions().assumed && WB.num(b.conditions.altitude_ft) !== null) jobs.push({path: 'config/conditions', data: Object.assign(WB.cleanConditions(b.conditions), {updated_at: new Date().toISOString()})});
    if (addG.length) jobs.push({path: 'config/golfers', data: {list: cur.map((c) => ({id: c.id, name: c.name, start: c.start, speed: c.speed})).concat(addG.map((g) => ({id: g.id, name: g.name.slice(0, 30), start: typeof g.start === 'string' ? g.start : null, speed: WB.num(g.speed)})))}});
    const known = WB.knownSessions();
    Object.entries(b.golfers).forEach(([gid, g]) => {
      if (!GID.test(gid) || !plain(g)) return;
      const r = WB.rawFor(gid) || {typed: [], imports: []};
      const haveW = new Set((r.typed || []).map((t) => t.id)), haveS = new Set((r.imports || []).map((x) => x.id));
      const haveR = new Set((WB.roundsFor(gid) || []).map((x) => x.id));
      (Array.isArray(g.rounds) ? g.rounds : []).forEach((x) => { if (plain(x) && ID.test(String(x.id)) && plain(x.data) && typeof x.data.date === 'string' && !haveR.has(x.id)) jobs.push({path: `golfers/${gid}/rounds/${x.id}`, data: x.data}); });
      (Array.isArray(g.weeks) ? g.weeks : []).forEach((w) => { if (plain(w) && ID.test(String(w.id)) && plain(w.data) && !haveW.has(w.id) && WB.num(w.data.week) !== null) jobs.push({path: `golfers/${gid}/weeks/${w.id}`, data: w.data}); });
      (Array.isArray(g.sessions) ? g.sessions : []).forEach((x) => { if (plain(x) && ID.test(String(x.id)) && plain(x.data) && typeof x.data.shots_json === 'string' && !haveS.has(x.id) && !(typeof x.data.fp === 'string' && known.has(x.data.fp))) jobs.push({path: `golfers/${gid}/sessions/${x.id}`, data: x.data}); });
    });
    const bl = dash.data('backlog'), haveB = new Set((bl.status === 'ok' ? bl.data : []).map((x) => x.id));
    (Array.isArray(b.backlog) ? b.backlog : []).forEach((x) => { if (plain(x) && ID.test(String(x.id)) && plain(x.data) && typeof x.data.title === 'string' && !haveB.has(x.id)) jobs.push({path: 'backlog/' + x.id, data: x.data}); });
    if (!jobs.length) { say(rMsg, 'Nothing to restore: everything in that backup is already here.', true); return; }
    goBtn.disabled = true;
    let ok = 0, bad = 0;
    for (let i = 0; i < jobs.length; i++) {
      say(rMsg, `Restoring ${i + 1} of ${jobs.length}…`, true);
      if (JSON.stringify(jobs[i].data).length > 250000) { bad++; continue; }
      try { await WB.save(jobs[i].path, jobs[i].data); ok++; } catch (e) { bad++; }
      await new Promise((r) => setTimeout(r, 120));
    }
    goBtn.disabled = false;
    say(rMsg, `Restored ${ok} item${ok === 1 ? '' : 's'}${bad ? `; ${bad} couldn’t be saved` : ''}. Nothing already here was changed.`, !bad);
    if (ok) box.value = '';
  });
})();


/* Altitude: GSPro's altitude setting adds carry with no swing change. Each imported week's driver carry is restated
   at sea level with the flight model (same ball speed, launch and spin), so weeks and benchmarks compare fairly. */
dash.calc('altitude', {
  inputs: ['csvweeks'],
  fn: (csv) => {
    const c = WB.conditions();
    return csv.map((w) => {
      const used = w.pts.filter((p) => p.used && ['ball_speed', 'launch', 'spin', 'carry'].every((k) => typeof p[k] === 'number'));
      if (used.length < 3) return null;
      const avg = (k) => used.reduce((a, p) => a + p[k], 0) / used.length;
      const bs = avg('ball_speed'), la = avg('launch'), sp = avg('spin'), carry = avg('carry');
      const alt = typeof w.alt === 'number' ? w.alt : c.altitude_ft;
      const up = BF.shot(bs, la, sp, {alt, temp: c.temp_f, turf: 'normal'}).carry;
      const sea = BF.shot(bs, la, sp, {alt: 0, temp: c.temp_f, turf: 'normal'}).carry;
      if (!(up > 0) || !(sea > 0)) return null;
      return {week: w.week, alt, carry, carry_sea: carry * sea / up};
    }).filter(Boolean);
  },
});
dash.draw('alttext', (el) => {
  const c = WB.conditions(), d = dash.data('altitude'), g = WB.golfer();
  const where = c.assumed ? ' (the SLC preset from the project notes; set the real value under Import → GSPro conditions)' : '';
  let t = `GSPro is set to ${c.altitude_ft.toLocaleString('en-US')} ft${where}.`;
  if (d.status === 'ok' && d.data.length && d.data[d.data.length - 1].alt > 200) {
    const r = d.data[d.data.length - 1], gain = r.carry - r.carry_sea;
    if (Math.abs(r.alt - c.altitude_ft) >= 50) t += ` Week ${WB.wk(r.week)}’s sessions were hit at ${Math.round(r.alt).toLocaleString('en-US')} ft.`;
    t += ` Thinner air adds about ${Math.round(gain)} yd of carry to ${g ? g.name + '’s' : 'these'} drives: week ${WB.wk(r.week)}’s ${Math.round(r.carry)} yd carry is about ${Math.round(r.carry_sea)} yd at sea level.`;
  }
  el.textContent = t + ' The Realistic look and Outlook are at sea level.';
});
(function () {
  const box = document.getElementById('cond-box'), f = document.getElementById('cond-form'), m = document.getElementById('cond-msg');
  if (!box || !f) return;
  const fill = () => { const c = WB.conditions(), e = f.elements; e.altitude_ft.value = c.altitude_ft; e.elevation_mode.value = c.elevation_mode; e.temp_f.value = c.temp_f; e.firmness.value = String(c.firmness); e.green_firmness.value = String(c.green_firmness); e.setting.value = c.setting; e.ball.value = c.ball; e.lm_carry.checked = c.lm_carry; };
  box.addEventListener('toggle', () => { if (box.open) fill(); });
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const n = (v) => WB.num(v);
    const alt = n(f.elements.altitude_ft.value), temp = n(f.elements.temp_f.value);
    if (alt === null || alt < -500 || alt > 12000 || temp === null || temp < 20 || temp > 120) { m.textContent = 'Altitude must be −500 to 12,000 ft and temperature 20 to 120 °F.'; m.className = 'wb-msg wb-badc'; m.hidden = false; return; }
    try {
      const e = f.elements;
      await WB.save('config/conditions', Object.assign(WB.cleanConditions({altitude_ft: alt, elevation_mode: e.elevation_mode.value, temp_f: temp, firmness: e.firmness.value, green_firmness: e.green_firmness.value, setting: e.setting.value, ball: e.ball.value, lm_carry: !!e.lm_carry.checked}), {updated_at: new Date().toISOString()}));
      m.textContent = 'Saved. New imports record these conditions.'; m.className = 'wb-msg wb-good';
    } catch (e) { m.textContent = 'Couldn’t save. Check the connection and try again.'; m.className = 'wb-msg wb-badc'; }
    m.hidden = false;
  });
})();


/* GSPro conditions for one session, editable after import (the conditions profile: FR-02 in the dashboards spec). */
function condEditor(r, path) {
  const c = r.conditions || WB.conditions();
  const det = document.createElement('details'); det.className = 'wb-cond-edit wb-write';
  const sum = document.createElement('summary');
  sum.textContent = r.conditions ? c.altitude_ft.toLocaleString('en-US') + ' ft' : 'Conditions';
  sum.title = 'GSPro conditions for this session';
  const grid = document.createElement('div'); grid.className = 'wb-cond-grid';
  const field = (label, el) => { const l = document.createElement('label'); l.textContent = label; l.append(el); grid.append(l); return el; };
  const num = (v, lo, hi) => { const i = document.createElement('input'); i.type = 'number'; i.inputMode = 'numeric'; i.min = lo; i.max = hi; i.value = v; return i; };
  const sel = (opts, v) => { const s = document.createElement('select'); opts.forEach(([val, txt]) => { const o = document.createElement('option'); o.value = val; o.textContent = txt; s.append(o); }); s.value = String(v); return s; };
  const five = [1, 2, 3, 4, 5].map((k) => [String(k), String(k)]);
  const alt = field('Altitude (ft)', num(c.altitude_ft, -500, 12000));
  const fw = field('Fairway firmness', sel(five, c.firmness));
  const gr = field('Green firmness', sel(five, c.green_firmness));
  const st = field('Setting', sel([['indoor', 'Indoor'], ['outdoor', 'Outdoor']], c.setting));
  const ball = field('Ball', Object.assign(document.createElement('input'), {type: 'text', maxLength: 40, value: c.ball}));
  const lm = Object.assign(document.createElement('input'), {type: 'checkbox', checked: c.lm_carry});
  const lml = document.createElement('label'); lml.className = 'wb-cond-check'; lml.append(lm, ' Use LM Carry'); grid.append(lml);
  const sv = document.createElement('button'); sv.type = 'button'; sv.className = 'wb-btn wb-btn-sm'; sv.textContent = 'Save conditions';
  sv.addEventListener('click', async () => {
    const a = WB.num(alt.value);
    if (a === null || a < -500 || a > 12000) { sv.textContent = 'Altitude −500 to 12,000 ft'; return; }
    sv.disabled = true;
    try {
      await WB.patch(path, {conditions: WB.cleanConditions({altitude_ft: a, firmness: fw.value, green_firmness: gr.value, setting: st.value, ball: ball.value, lm_carry: lm.checked}, c)});
      sv.textContent = 'Saved';
    } catch (e) { sv.textContent = 'Not saved'; }
    sv.disabled = false;
  });
  det.append(sum, grid, sv);
  return det;
}


/* Undo the last import: the sessions saved in the most recent import (within two hours), with their original-file records. */
dash.draw('undobatch', (el) => {
  el.replaceChildren();
  let last = null;
  const each = (fn) => WB.golfers().forEach((g) => { const r = WB.rawFor(g.id); ((r && r.imports) || []).forEach((i) => fn(g, i)); });
  each((g, i) => { if (typeof i.imported_at === 'string' && (!last || i.imported_at > last)) last = i.imported_at; });
  if (!last || !(Date.now() - Date.parse(last) < 2 * 3600e3)) return;
  const items = [];
  each((g, i) => { if (i.imported_at === last) items.push({gid: g.id, id: i.id}); });
  if (!items.length) return;
  const when = new Date(last).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  const t = document.createElement('span');
  t.textContent = `Last import: ${items.length} session${items.length === 1 ? '' : 's'} at ${when}. `;
  el.append(t, confirmButton('Undo this import', `Remove ${items.length} session${items.length === 1 ? '' : 's'}`, async () => {
    for (const it of items) {
      await WB.remove(`golfers/${it.gid}/sessions/${it.id}`);
      for (const p of ['', '-p2', '-p3']) { try { await WB.remove(`golfers/${it.gid}/raw/${it.id}${p}`); } catch (e) { /* none */ } }
      await new Promise((r) => setTimeout(r, 60));
    }
  }));
});


/* Table view and Copy as CSV for every chart (FR-24): each chart draw hands its numbers to chartTable. */
function rd(v, d) { return typeof v === 'number' && isFinite(v) ? Math.round(v * Math.pow(10, d)) / Math.pow(10, d) : ''; }
function csvCell(v) { const t = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
function chartTable(el, title, cols, rows) {
  const card = (el.closest && el.closest('.wb-card')) || el.parentNode;
  if (!card) return;
  let bar = card.querySelector(':scope > .wb-tbar');
  if (!title) { if (bar) { bar.hidden = true; bar.__box.hidden = true; } return; }
  if (!bar) {
    bar = document.createElement('div'); bar.className = 'wb-tbar';
    const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'wb-btn wb-btn-sm'; tb.textContent = 'Table'; tb.setAttribute('aria-expanded', 'false');
    const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'wb-btn wb-btn-sm'; cb.textContent = 'Copy as CSV';
    const box = document.createElement('div'); box.className = 'wb-ctable'; box.hidden = true;
    const render = () => {
      const d = bar.__data;
      if (box.hidden || !d) return;
      const t = document.createElement('table'); t.className = 'wb-table';
      const cap = document.createElement('caption'); cap.textContent = d.title; t.append(cap);
      const hr = t.createTHead().insertRow();
      d.cols.forEach((c) => { const th = document.createElement('th'); th.textContent = c; th.scope = 'col'; hr.append(th); });
      const tbd = t.createTBody();
      d.rows.forEach((r) => { const tr = tbd.insertRow(); r.forEach((v) => { tr.insertCell().textContent = v === null || v === undefined ? '' : String(v); }); });
      box.replaceChildren(t);
    };
    tb.addEventListener('click', () => { box.hidden = !box.hidden; tb.setAttribute('aria-expanded', String(!box.hidden)); tb.textContent = box.hidden ? 'Table' : 'Hide table'; render(); });
    cb.addEventListener('click', async () => {
      const d = bar.__data; if (!d) return;
      const csv = [d.cols].concat(d.rows).map((r) => r.map(csvCell).join(',')).join('\n');
      try { await navigator.clipboard.writeText(csv); cb.textContent = 'Copied'; } catch (e) { cb.textContent = 'Copying was blocked'; }
      setTimeout(() => { cb.textContent = 'Copy as CSV'; }, 1600);
    });
    bar.__render = render; bar.__box = box;
    bar.append(tb, cb);
    card.append(bar, box);
  }
  bar.hidden = false;
  bar.__data = {title, cols, rows};
  bar.__render();
}


/* View tabs (the dashboards spec's views). A link to a section's #id opens the view that holds it. */
(function () {
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { WB.setView(b.getAttribute('data-goto')); window.scrollTo({top: 0}); }));
  const openHash = () => {
    const id = decodeURIComponent((location.hash || '').slice(1));
    const t = id && document.getElementById(id);
    const holder = t && (t.matches('[data-view]') ? t : t.closest('[data-view]'));
    if (holder && holder.getAttribute('data-view') !== WB.view() && WB.view() !== 'all') { WB.setView(holder.getAttribute('data-view')); setTimeout(() => t.scrollIntoView(), 50); }
  };
  window.addEventListener('hashchange', openHash);
  openHash();
  WB.applyMode();
})();
