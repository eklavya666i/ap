/* Ball flight (FR-09; design package v1.0): the most common miss for a club, its shots against the rest on the night range,
   side and top views, why it happens (measured ball data; face and path inferred until club data arrives), and its trend. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || !window.LAB) return;
  const X = window.LAB, ST = ['pull', 'straight', 'push'], CV = ['draw', 'straight', 'fade'];
  const STN = {pull: 'Starts left', straight: 'On line', push: 'Starts right'}, CVN = {draw: 'Draw or hook', straight: 'No curve', fade: 'Fade or slice'};

  dash.calc('flight', {
    inputs: ['labshots'],
    fn: (all) => {
      const p = dash.params(), cw = (Number(p.corridor) > 0 ? Number(p.corridor) : 30) / 2;
      const by = new Map();
      all.forEach((s) => { if (s.used && s.hla !== null && s.axis !== null && (s.swing === null || s.swing === 'Full')) { const g = by.get(s.key) || {key: s.key, name: s.name, order: s.order, cat: s.cat, n: 0}; g.n++; by.set(s.key, g); } });
      const clubs = [...by.values()].filter((c) => c.n >= 6).sort((a, b) => a.order - b.order);
      if (!clubs.length) return {clubs, cw};
      const key = clubs.some((c) => c.key === X.state.club) ? X.state.club : clubs[0].key, club = clubs.find((c) => c.key === key);
      const sh = all.filter((s) => s.key === key && s.used && s.hla !== null && s.axis !== null && (s.swing === null || s.swing === 'Full'));
      const cnt = {};
      sh.forEach((s) => { s.pat = X.patternOf(s); cnt[s.pat] = (cnt[s.pat] || 0) + 1; });
      const miss = Object.entries(cnt).filter(([k]) => k !== 'straight-straight').sort((a, b) => b[1] - a[1]);
      const sel = X.state.pat && cnt[X.state.pat] ? X.state.pat : miss.length ? miss[0][0] : 'straight-straight';
      const inC = sh.filter((s) => s.offline !== null && Math.abs(s.offline) <= cw), selSh = sh.filter((s) => s.pat === sel);
      const weeks = [...new Set(sh.map((s) => s.week).filter(Number.isInteger))].sort((a, b) => a - b);
      const wk = weeks.map((w) => { const a = sh.filter((s) => s.week === w), o = a.filter((s) => s.offline !== null); return {w, n: a.length, share: a.filter((s) => s.pat === sel).length / a.length * 100, corr: o.length ? o.filter((s) => Math.abs(s.offline) <= cw).length / o.length * 100 : null}; });
      const M = (a, k) => X.med(a.map((s) => s[k]).filter(X.fin));
      const cmp = ['hla', 'axis', 'launch', 'spin', 'smash', 'peak', 'carry', 'faceE', 'pathE'].map((k) => ({k, good: M(inC, k), pat: M(selSh, k)}));
      return {clubs, key, club, sh, cnt, miss, sel, inC, selSh, wk, cmp, cw, top: miss[0] || null};
    },
  });

  dash.draw('flight', (box) => {
    X.reset(box);
    X.wireShots(box);
    const g = WB.golfer();
    if (!g) { box.append(X.el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const d = dash.data('flight');
    if (d.status !== 'ok') { box.append(X.el('p', 'wb-note', d.status === 'loading' ? 'Loading shots…' : 'Ball flight couldn’t be worked out.')); return; }
    const F = d.data;
    if (!F.clubs.length) { X.head(box, 'No club has 6 full swings with start line and curve in this date range', 'Import GSPro range sessions with HLA and spin axis, or widen the date range.'); return; }
    const cn = F.club.name.toLowerCase(), n = F.sh.length;
    X.head(box, F.top ? `${X.PNAME[F.top[0]]} is the most common ${cn} miss: ${Math.round(F.top[1] / n * 100)}% of shots` : `Every ${cn} shot starts and curves on line`,
      `${g.name}, ${n} full ${cn} swings in this date range. Start beyond ±2° and curve beyond ±3° (spin axis) count as a miss; directions assume a right-handed golfer.`);
    X.chips(box, F.clubs.map((c) => [c.key, `${c.name} (${c.n})`]), F.key, (k) => { X.state.club = k; X.state.pat = null; dash.schedule(); }, 'Club');

    const grid = X.el('div', 'lab-grid2');
    box.append(grid);
    const m = X.card(grid, 'Flight pattern matrix', 'Start direction × curve; darker cells are more common. Tap a cell to diagnose it.', 'lab-c5');
    const mx = Math.max(...Object.values(F.cnt)), hm = X.el('div', 'lab-heat');
    hm.append(X.el('span'));
    CV.forEach((c) => hm.append(X.el('span', 'lab-hl', CVN[c])));
    ST.forEach((s) => {
      hm.append(X.el('span', 'lab-hl', STN[s]));
      CV.forEach((c) => {
        const k = s + '-' + c, v = F.cnt[k] || 0, b = X.el('button', 'lab-cell' + (k === F.sel ? ' on' : ''));
        b.type = 'button';
        b.style.setProperty('--mix', v ? Math.round(18 + v / mx * 70) + '%' : '0%');
        if (v / mx > 0.55) b.classList.add('deep');
        b.append(X.el('b', '', Math.round(v / n * 100) + '%'), X.el('span', '', X.PNAME[k]));
        b.title = `${X.PNAME[k]}: ${v} of ${n} shots`;
        b.addEventListener('click', () => { X.state.pat = k; dash.schedule(); });
        hm.append(b);
      });
    });
    m.append(hm);
    if (typeof chartTable === 'function') chartTable(hm, `${F.club.name} flight patterns`, ['Pattern', 'Shots', 'Share %'], Object.keys(X.PNAME).map((k) => [X.PNAME[k], F.cnt[k] || 0, Math.round((F.cnt[k] || 0) / n * 100)]));

    const sc = X.card(grid, `${X.PNAME[F.sel]} against everything else`, 'Each tracer is drawn through GSPro’s launch, peak height, descent, carry and offline. Coral: the selected pattern; faint blue: the other shots. Tap a tracer to open the shot.', 'lab-c7 lab-scene-card');
    const sel = F.selSh.slice(-16), rest = F.sh.filter((s) => s.pat !== F.sel).slice(-24);
    const list = rest.map((s) => ({s, col: '#338ced', op: 0.3, wd: 1.5})).concat(sel.map((s) => ({s, col: '#e76624', op: 0.95, wd: 2.5}))).map((x) => ({t: X.traj(x.s), col: x.col, op: x.op, wd: x.wd, title: X.tipOf(x.s), act: x.s.sid + '|' + x.s.k})).filter((x) => x.t);
    X.fig(sc, 340, `${F.club.name}: ${X.PNAME[F.sel]} shots against the rest`, (W, H) => X.scene(W, H, list, {anim: true, goal: F.key === 'dr' ? 260 : null, half: F.cw}), 'lab-scene');
    X.legend(sc, [['#e76624', X.PNAME[F.sel], 'ln'], ['#338ced', 'Other shots', 'ln']].concat(F.key === 'dr' ? [['#ffd23f', '260 yards', 'ln']] : []));

    const grid2 = X.el('div', 'lab-grid2');
    box.append(grid2);
    const side = X.card(grid2, 'Side view: height by pattern', 'Median flight of in-corridor shots against the selected pattern, through GSPro’s peak height and descent.', 'lab-c6');
    const medShot = (a) => (a.length ? {carry: X.med(a.map((s) => s.carry).filter(X.fin)), total: X.med(a.map((s) => s.total).filter(X.fin)), launch: X.med(a.map((s) => s.launch).filter(X.fin)), peak: X.med(a.map((s) => s.peak).filter(X.fin)), descent: X.med(a.map((s) => s.descent).filter(X.fin)), hla: X.med(a.map((s) => s.hla).filter(X.fin)), offline: X.med(a.map((s) => s.offline).filter(X.fin))} : null);
    const fl = [[medShot(F.inC), 'var(--series-1)', 'In-corridor median'], [medShot(F.selSh), 'var(--series-2)', X.PNAME[F.sel] + ' median']].filter((x) => x[0] && X.fin(x[0].carry)).map(([s, c, l]) => ({t: X.traj(s), c, l, s})).filter((x) => x.t);
    if (fl.length) {
      X.fig(side, 240, 'Median flights from the side', (W, H) => {
        const m2 = {l: 44, r: 14, t: 28, b: 30}, xm = Math.max(...fl.map((f) => f.t.carry)) * 1.06, ym = Math.max(...fl.map((f) => f.t.peak)) * 1.25, A = X.axes(W, H, m2, [0, xm], [0, ym], {xl: 'Distance, yd', yl: 'Height, yd'});
        return A.g + fl.map((f) => `<path d="${X.lp(f.t.pts.map((q) => [A.sx(q[0]), A.sy(q[1])]))}" fill="none" stroke="${f.c}" stroke-width="2.5"/>`).join('');
      });
      X.legend(side, fl.map((f) => [f.c, f.l, 'ln']));
      if (typeof chartTable === 'function') chartTable(side.querySelector('svg'), 'Median flights', ['Group', 'Carry (yd)', 'Peak (yd)', 'Descent (°)'], fl.map((f) => [f.l, Math.round(f.t.carry), X.f1(f.t.peak), X.f1(f.s.descent)]));
    } else side.append(X.el('p', 'wb-note', 'Needs carry and peak height.'));

    const tv = X.card(grid2, 'Top view: how the pattern curves', `Each ${X.PNAME[F.sel].toLowerCase()} shot from above, against the in-corridor median; the band is the ${F.cw * 2}-yard corridor.`, 'lab-c6');
    const paths = F.selSh.slice(-14).map((s) => ({s, t: X.traj(s)})).filter((x) => x.t), gm = fl[0] && fl[0].c === 'var(--series-1)' ? fl[0].t : null;
    if (paths.length) {
      X.fig(tv, 240, 'Curves from above', (W, H) => {
        const m2 = {l: 44, r: 14, t: 28, b: 30}, xm = Math.max(...paths.map((x) => x.t.carry), gm ? gm.carry : 0) * 1.06, L = Math.max(F.cw + 6, ...paths.flatMap((x) => x.t.pts.map((q) => Math.abs(q[2])))) * 1.15;
        const A = X.axes(W, H, m2, [0, xm], [-L, L], {xl: 'Distance, yd', yl: 'Offline, yd (right is up)'});
        let s = A.g + `<rect x="${m2.l}" y="${A.sy(F.cw).toFixed(1)}" width="${W - m2.l - m2.r}" height="${(A.sy(-F.cw) - A.sy(F.cw)).toFixed(1)}" class="lab-band"/>`;
        if (gm) s += `<path d="${X.lp(gm.pts.map((q) => [A.sx(q[0]), A.sy(q[2])]))}" fill="none" stroke="var(--series-1)" stroke-width="2.5"/>`;
        return s + paths.map((x) => `<g class="lab-dot" data-shot="${X.esc(x.s.sid + '|' + x.s.k)}" tabindex="0" role="button"><title>${X.esc(X.tipOf(x.s))}</title><path d="${X.lp(x.t.pts.map((q) => [A.sx(q[0]), A.sy(q[2])]))}" fill="none" stroke="var(--series-2)" stroke-width="1.8" stroke-opacity=".8"/></g>`).join('');
      });
      X.legend(tv, [['var(--series-2)', X.PNAME[F.sel] + ' shots', 'ln'], ['var(--series-1)', 'In-corridor median', 'ln']]);
    } else tv.append(X.el('p', 'wb-note', 'No shots in this pattern.'));

    const grid3 = X.el('div', 'lab-grid2');
    box.append(grid3);
    const why = X.card(grid3, `Why ${X.PNAME[F.sel].toLowerCase()} happens`, 'The pattern’s medians against in-corridor shots. Face and path are inferred from start line and curve (±1.5°) until the monitor sends club data.', 'lab-c7');
    if (F.selSh.length >= 3 && F.inC.length >= 3 && F.sel !== 'straight-straight') {
      const U = {hla: ['Start line', '°', 1], axis: ['Curve (spin axis)', '°', 1], launch: ['Launch', '°', 1], spin: ['Spin', ' rpm', 0], smash: ['Smash', '', 2], peak: ['Peak height', ' yd', 1], carry: ['Carry', ' yd', 0], faceE: ['Face, inferred', '°', 1], pathE: ['Path, inferred', '°', 1]};
      const c = Object.fromEntries(F.cmp.map((r) => [r.k, r])), dAx = c.axis.pat - c.axis.good, dH = c.hla.pat - c.hla.good;
      const dp = X.dplane(F.key, F.club.cat);
      why.append(X.el('p', '', `${X.PNAME[F.sel]} shots curve ${X.sg(dAx)}° more than in-corridor shots, which points to a face-to-path about ${X.sg(dAx / dp.k)}° ${dAx >= 0 ? 'more open' : 'more closed'}. They start ${X.sg(dH)}° ${dH >= 0 ? 'further right' : 'further left'}.`));
      X.table(why, ['Measure', 'In corridor', X.PNAME[F.sel], 'Difference'], F.cmp.filter((r) => X.fin(r.good) && X.fin(r.pat)).map((r) => { const u = U[r.k], fm = (v) => (u[2] === 0 ? X.f0(v) : v.toFixed(u[2])) + u[1]; return [u[0], fm(r.good), fm(r.pat), (r.pat - r.good > 0 ? '+' : r.pat - r.good < 0 ? '−' : '±') + (u[2] === 0 ? X.f0(Math.abs(r.pat - r.good)) : Math.abs(r.pat - r.good).toFixed(u[2])) + u[1]]; }), [1, 2, 3]);
      why.append(X.el('p', 'wb-note', 'Swing or strike: not split yet. Toe and heel strikes also bend the curve (gear effect); face-spray zones from Drill Runner will split the two.'));
    } else why.append(X.el('p', 'wb-note', 'Pick a miss pattern with at least 3 shots, with 3 or more in-corridor shots to compare.'));

    const tr = X.card(grid3, `Is ${X.PNAME[F.sel].toLowerCase()} fading out?`, 'Weekly share of the pattern against the corridor rate.', 'lab-c5');
    if (F.wk.length >= 2) {
      X.fig(tr, 220, 'Weekly share of the pattern and the corridor rate', (W, H) => {
        const m2 = {l: 40, r: 14, t: 28, b: 30}, A = X.axes(W, H, m2, [F.wk[0].w, F.wk[F.wk.length - 1].w], [0, 100], {xl: 'Week', yl: 'Share of shots, %', xf: (t) => (Number.isInteger(t) ? WB.wk(t) : '')});
        const c = F.wk.filter((x) => X.fin(x.corr)), s = F.wk;
        return A.g + `<path d="${X.lp(c.map((x) => [A.sx(x.w), A.sy(x.corr)]))}" fill="none" stroke="var(--series-1)" stroke-width="2"/><path d="${X.lp(s.map((x) => [A.sx(x.w), A.sy(x.share)]))}" fill="none" stroke="var(--series-2)" stroke-width="2"/>` + s.map((x) => X.dot(A.sx(x.w), A.sy(x.share), 'var(--series-2)', `Week ${WB.wk(x.w)}: ${Math.round(x.share)}% ${X.PNAME[F.sel].toLowerCase()} of ${x.n} shots`, null, 3.5, 1)).join('');
      });
      X.legend(tr, [['var(--series-2)', X.PNAME[F.sel] + ' share', 'ln'], ['var(--series-1)', 'In the corridor', 'ln']]);
      if (typeof chartTable === 'function') chartTable(tr.querySelector('svg'), 'Pattern share by week', ['Week', 'Shots', X.PNAME[F.sel] + ' %', 'In corridor %'], F.wk.map((x) => [WB.wk(x.w), x.n, Math.round(x.share), X.fin(x.corr) ? Math.round(x.corr) : '']));
    } else tr.append(X.el('p', 'wb-note', 'Two or more weeks in the range show a trend.'));
  });
})();
