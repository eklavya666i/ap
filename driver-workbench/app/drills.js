/* Drill studio (FR-14; design package v1.0): did the tagged drills move their number, what the latest data prescribes,
   the tee-height ladder, and the drill library with how each drill's shots are captured. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || !window.LAB) return;
  const X = window.LAB;
  const LIB = [
    ['Speed ladder', 'Distance: club speed', 'Club speed up less than 0.25 mph a week over 4 weeks while speed is still a lever', '3 sets × 5 max-intent drives, 60 s rest; end a set if smash drops below 1.40', 'Peak and median club speed, ball speed, smash', 'Tag the block “Speed ladder”; kept out of accuracy stats'],
    ['Centered strike (face spray)', 'Strike: smash', 'Driver smash under 1.47', '10 balls with face spray; log the zone of each strike', 'Smash, ball speed, strike zone', 'Tag the block; set each shot’s target to its zone, such as “Mid center”'],
    ['Tee height and attack angle ladder', 'Launch and spin', 'Launch under the window, or spin over 2,800 rpm', 'Low, normal and high tee × 5 balls; random order in round two', 'Launch, spin, carry, smash (attack angle when measured)', 'One tagged block per tee height'],
    ['Start-line gate', 'Direction', 'Start-line (HLA) spread over 3°, or a bias beyond 2°', '10 drives through a 2–3° gate of alignment sticks, full routine', 'Start line (HLA)', 'Tag the block “Start-line gate”'],
    ['Stock shape window', 'Curve', 'Curve flips sides on 30%+ of drives, or a wide curve spread', '10 stock shapes, then 5 of the opposite shape', 'Spin axis, start line', 'Tag intent Fade or Draw per block'],
    ['Fairway finder', 'Long and straight', 'Corridor rate under 60%', '14 drives, full routine, new target every ball', 'Corridor %, total, long-and-straight rate', 'On-Course Practice CSV, or a tagged range block'],
    ['Long-drive benchmark', 'Max distance', 'Monthly', 'GSPro Ultimate Long Drive; best drive in bounds counts', 'Best and top-5 total, club and ball speed', 'Tag the block; score entered by hand'],
    ['Wedge clock ladder', 'Partial shots', 'Any club × swing-length spread over 4 yards', '¼, ½, ¾ and full × 3–5 balls each, two wedges a session', 'Carry mean and spread, launch, spin, roll', 'Tag each block with its swing length'],
    ['Random distance test', 'Transfer', 'After two clock-ladder sessions', '20 shots to random targets from 40 to 130 yards', 'Carry error against the target', 'Tag each shot’s target distance'],
    ['Carry book calibration', 'Calibration', 'Quarterly, after an equipment change, or a drift alert', '10 full shots per club indoors, then lasered outdoors', 'Carry against outdoor laser carry', 'Range CSV plus the outdoor numbers'],
    ['Flight window (stock vs knockdown)', 'Carry and roll', 'Roll share or landing angle off target for a club', '5 stock, 5 knockdown, 5 high with a 7- and 9-iron', 'Launch, spin, peak, descent, carry, roll', 'Tag intent High, Low or Stock per block'],
    ['Pressure combine', 'Tempo under pressure', 'Rushed tempo noted in 3+ rounds', 'GSPro Custom Skills Test with the full routine; a miss restarts the hole', 'Score, corridor %, routine time', 'Custom Skills Test score plus notes'],
  ];
  const TOPIC = {strike: ['Centered strike (face spray)'], speed: ['Speed ladder'], launch: ['Tee height and attack angle ladder'], spin: ['Tee height and attack angle ladder'], dispersion: ['Start-line gate', 'Stock shape window'], measure: ['Carry book calibration']};

  dash.calc('drills', {
    inputs: ['labshots', 'topics'],
    fn: (all, topics) => {
      const p = dash.params(), cw = (Number(p.corridor) > 0 ? Number(p.corridor) : 30) / 2;
      const stock = (s) => s.used && s.drill === null && (s.swing === null || s.swing === 'Full');
      const dr = all.filter((s) => s.key === 'dr' && stock(s)), wedges = all.filter((s) => s.used && s.drill === null && s.cat === 'wedge' && X.fin(s.carry));
      const medOf = (k) => (a) => X.med(a.map((s) => s[k]).filter(X.fin)), sdOf = (k) => (a) => X.sd(a.map((s) => s[k]).filter(X.fin));
      const corr = (a) => { const o = a.filter((s) => X.fin(s.offline)); return o.length ? o.filter((s) => Math.abs(s.offline) <= cw).length / o.length * 100 : null; };
      const wsd = (a) => { const by = {}; a.forEach((s) => { const k = s.key + (s.swing || 'Full'); (by[k] = by[k] || []).push(s.carry); }); const v = Object.values(by).filter((x) => x.length >= 3).map(X.sd).filter(X.fin); return v.length ? X.mean(v) : null; };
      const anyMeasured = dr.some((s) => X.fin(s.attack));
      const MET = {
        'Speed ladder': ['Club speed, mph', dr, medOf('club_speed'), 1, 1],
        'Centered strike (face spray)': ['Smash', dr, medOf('smash'), 1, 2],
        'Tee height and attack angle ladder': anyMeasured ? ['Attack angle, °', dr, medOf('attack'), 1, 1] : ['Launch, °', dr, medOf('launch'), 1, 1],
        'Start-line gate': ['Start-line spread, °', dr, sdOf('hla'), -1, 1],
        'Stock shape window': ['Curve spread (spin axis), °', dr, sdOf('axis'), -1, 1],
        'Fairway finder': ['In the corridor, %', dr, corr, 1, 0],
        'Long-drive benchmark': ['Driver total, yd', dr, medOf('total'), 1, 0],
        'Wedge clock ladder': ['Wedge carry spread, yd', wedges, wsd, -1, 1],
      };
      const used = new Map();
      all.forEach((s) => { if (s.drill && Number.isInteger(s.week)) { const u = used.get(s.drill) || {name: s.drill, weeks: new Set(), n: 0}; u.weeks.add(s.week); u.n++; used.set(s.drill, u); } });
      const eff = [...used.values()].map((u) => {
        const w0 = Math.min(...u.weeks), w1 = Math.max(...u.weeks), m = MET[u.name];
        if (!m) return {name: u.name, n: u.n, w0, w1, metric: null};
        const [label, pool, fn, good, dp] = m, before = pool.filter((s) => s.week >= w0 - 2 && s.week < w0), after = pool.filter((s) => s.week >= w0 && s.week <= w1 + 2);
        if (before.length < 8 || after.length < 8) return {name: u.name, n: u.n, w0, w1, metric: label, few: true, nb: before.length, na: after.length};
        const a = fn(before), b = fn(after);
        if (!X.fin(a) || !X.fin(b)) return {name: u.name, n: u.n, w0, w1, metric: label, few: true, nb: before.length, na: after.length};
        const ch = (b - a) / (Math.abs(a) || 1) * good;
        return {name: u.name, n: u.n, w0, w1, metric: label, a, b, dp, good, ch, verdict: ch > 0.03 ? 'Worked' : ch < -0.03 ? 'Worse' : 'No clear change'};
      }).sort((x, y) => (y.ch || -9) - (x.ch || -9));
      const rx = [];
      (topics || []).filter((t) => t.level === 'bad' || t.level === 'warn').forEach((t) => (TOPIC[t.topic] || []).forEach((dname) => { if (!rx.some((r) => r.name === dname)) rx.push({name: dname, why: t.detail, status: t.status, level: t.level}); }));
      const tees = ['Low', 'Normal', 'High'].map((t) => { const a = all.filter((s) => s.key === 'dr' && s.used && s.tee === t); return {t, n: a.length, attack: medOf('attack')(a), launch: medOf('launch')(a), spin: medOf('spin')(a), smash: medOf('smash')(a), carry: medOf('carry')(a)}; });
      return {eff, rx, tees, tagged: [...used.values()].reduce((t, u) => t + u.n, 0)};
    },
  });

  dash.draw('drills', (box) => {
    X.reset(box);
    const g = WB.golfer();
    if (!g) { box.append(X.el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const d = dash.data('drills');
    if (d.status !== 'ok') { box.append(X.el('p', 'wb-note', d.status === 'loading' ? 'Loading drills…' : 'The drill studio couldn’t be worked out.')); return; }
    const D = d.data, best = D.eff.find((e) => e.verdict === 'Worked');
    const fm = (e, v) => (e.dp === 0 ? X.f0(v) : v.toFixed(e.dp));
    X.head(box, best ? `${best.name} worked: ${best.metric.split(',')[0].toLowerCase()} from ${fm(best, best.a)} to ${fm(best, best.b)}` : D.eff.length ? 'No tagged drill has moved its number yet' : 'Tag drill blocks to see which drills work',
      `${g.name}: ${D.tagged} shots tagged with a drill in this date range. ${D.rx.length ? 'Next up: ' + D.rx.slice(0, 3).map((r) => r.name).join(', ') + '.' : 'Nothing urgent in the latest data.'} Each drill is checked on stock shots outside the drill blocks, two weeks before against the weeks after.`);

    const grid = X.el('div', 'lab-grid2');
    box.append(grid);
    const ec = X.card(grid, 'Did the drills work?', 'Before against after, on stock shots outside the drill blocks. A change of 3% or less counts as no clear change.', 'lab-c7');
    if (!D.eff.length) ec.append(X.el('p', 'wb-note', 'No drill blocks are tagged in this date range. Tag shot ranges with a drill in Shots (Data hub); Drill Runner will tag them by shot order when it ships.'));
    D.eff.forEach((e) => {
      const it = X.el('div', 'lab-eff'), hd = X.el('div', 'lab-effh');
      hd.append(X.el('b', '', e.name));
      if (e.verdict) hd.append(X.el('span', 'lab-st ' + (e.verdict === 'Worked' ? 'wb-okc' : e.verdict === 'Worse' ? 'wb-badc' : 'wb-warnc'), e.verdict));
      it.append(hd);
      if (!e.metric) it.append(X.el('p', 'wb-sub', `${e.n} shots tagged, weeks ${WB.wk(e.w0)}–${WB.wk(e.w1)}. This drill has no automatic check yet.`));
      else if (e.few) it.append(X.el('p', 'wb-sub', `${e.metric}: needs 8 stock shots before and after (now ${e.nb} and ${e.na}).`));
      else {
        const lo = Math.min(e.a, e.b), hi = Math.max(e.a, e.b), sp = (hi - lo) || Math.abs(e.a) * 0.05 || 1, d0 = lo - sp * 0.7, d1 = hi + sp * 0.7, P = (v) => ((v - d0) / (d1 - d0) * 100).toFixed(1) + '%';
        const row = X.el('div', 'lab-dumb'), trk = X.el('span', 'lab-dtrack'), bar = X.el('i', 'lab-dbar'), a = X.el('i', 'lab-da'), b = X.el('i', 'lab-db');
        bar.style.left = P(lo); bar.style.width = `calc(${P(hi)} - ${P(lo)})`; a.style.left = P(e.a); b.style.left = P(e.b);
        trk.append(bar, a, b);
        row.append(X.el('span', 'lab-dk', e.metric), trk, X.el('span', 'lab-dv ' + (e.ch > 0 ? 'wb-okc' : e.ch < 0 ? 'wb-badc' : ''), `${fm(e, e.a)} → ${fm(e, e.b)}`));
        it.append(row, X.el('p', 'wb-sub', `${e.n} shots tagged, weeks ${WB.wk(e.w0)}–${WB.wk(e.w1)}. Grey: before; blue: after.`));
      }
      ec.append(it);
    });

    const rc = X.card(grid, 'Prescriptions from the latest data', 'The top three go on next week’s plan; the rest wait.', 'lab-c5');
    if (!D.rx.length) rc.append(X.el('p', 'wb-note', 'Nothing in the latest week needs a drill.'));
    D.rx.forEach((r, i) => {
      const it = X.el('div', 'lab-eff'), hd = X.el('div', 'lab-effh');
      hd.append(X.el('b', '', r.name), X.el('span', 'lab-st ' + (i < 3 ? 'wb-okc' : ''), i < 3 ? 'This week' : 'Queued'));
      it.append(hd, X.el('p', 'wb-sub', r.why));
      rc.append(it);
    });
    rc.append(X.el('p', 'wb-note', 'Drill Runner, the phone screen that tags each shot by its place in the plan, is next (b50). Until then, tag blocks in Shots.'));

    if (D.tees.some((t) => t.n)) {
      const tc = X.card(box, 'Tee height ladder', 'Driver shots tagged with a tee height.');
      X.table(tc, ['Tee', 'Shots', 'Attack angle', 'Launch', 'Spin', 'Smash', 'Carry'], D.tees.map((t) => [t.t, t.n, X.fin(t.attack) ? X.sg(t.attack) + '°' : 'Not measured', X.f1(t.launch) + '°', X.f0(t.spin), X.f2(t.smash), X.f0(t.carry)]), [1, 2, 3, 4, 5, 6]);
    }

    const lc = X.card(box, 'Drill library', 'Every drill knows what triggers it, what it measures and how its shots are captured.');
    const lib = X.el('div', 'lab-lib');
    LIB.forEach(([n, goal, trig, prot, meas, cap]) => {
      const c = X.el('div', 'lab-libc');
      c.append(X.el('span', 'lab-goal', goal), X.el('b', '', n));
      const dl = X.el('dl');
      [['When', trig], ['How', prot], ['Measures', meas], ['Capture', cap]].forEach(([k, v]) => { dl.append(X.el('dt', '', k), X.el('dd', '', v)); });
      c.append(dl);
      lib.append(c);
    });
    lc.append(lib);
  });
})();
