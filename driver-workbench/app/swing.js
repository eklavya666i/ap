/* Swing and strike (FR-10, FR-26; design package v1.0): club delivery measured when the monitor sends it, otherwise
   inferred from the ball (face ≈ start line + (1 − w)·face-to-path, face-to-path ≈ curve ÷ k, read as ±1.5°),
   the strike on a driver face from face-spray zones, delivery consistency, launch and spin, and start line against curve. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || !window.LAB) return;
  const X = window.LAB, ZR = ['High', 'Mid', 'Low'], ZC = ['Heel', 'Center', 'Toe'];

  dash.calc('swing', {
    inputs: ['labshots'],
    fn: (all) => {
      const by = new Map();
      all.forEach((s) => { if (s.used && s.hla !== null && s.axis !== null && (s.swing === null || s.swing === 'Full')) { const g = by.get(s.key) || {key: s.key, name: s.name, order: s.order, cat: s.cat, n: 0}; g.n++; by.set(s.key, g); } });
      const clubs = [...by.values()].filter((c) => c.n >= 6).sort((a, b) => a.order - b.order);
      if (!clubs.length) return {clubs};
      const key = clubs.some((c) => c.key === X.state.scl) ? X.state.scl : clubs[0].key, club = clubs.find((c) => c.key === key);
      const sh = all.filter((s) => s.key === key && s.used && s.hla !== null && s.axis !== null && (s.swing === null || s.swing === 'Full'));
      const cm = sh.filter((s) => s.measured).length >= sh.length * 0.8;
      const face = (s) => (cm ? s.face : s.faceE), path = (s) => (cm ? s.path : s.pathE), ftp = (s) => (cm ? (s.f2p !== null ? s.f2p : s.face - s.path) : s.f2pE);
      const pts = sh.map((s) => ({s, face: face(s), path: path(s), ftp: ftp(s)})).filter((q) => X.fin(q.face) && X.fin(q.path));
      const weeks = [...new Set(sh.map((s) => s.week).filter(Number.isInteger))].sort((a, b) => a - b), early = weeks.slice(0, 2), late = weeks.slice(-2);
      const MET = [['Club speed', (s) => s.club_speed, ' mph', 1.5, 'Measured'], ['Smash', (s) => s.smash, '', 0.015, 'Measured'], ['Start line (HLA)', (s) => s.hla, '°', 2, 'Measured'], ['Curve (spin axis)', (s) => s.axis, '°', 4, 'Measured'], ['Launch', (s) => s.launch, '°', 1.2, 'Measured'],
        ['Face to target', face, '°', 2, cm ? 'Measured' : 'Inferred'], ['Club path', path, '°', 2, cm ? 'Measured' : 'Inferred'], ['Face to path', ftp, '°', 2, cm ? 'Measured' : 'Inferred']];
      if (cm) MET.push(['Attack angle', (s) => s.attack, '°', 1, 'Measured'], ['Dynamic loft', (s) => s.dyn_loft, '°', 1, 'Measured']);
      const rows = MET.map(([k, fn, u, tg, src]) => {
        const v = sh.map(fn).filter(X.fin), e = sh.filter((s) => early.includes(s.week)).map(fn).filter(X.fin), l = sh.filter((s) => late.includes(s.week)).map(fn).filter(X.fin), sp = X.sd(v);
        return {k, u, tg, src, med: X.med(v), sd: sp, e: X.sd(e), l: X.sd(l), st: sp === null ? null : sp <= tg ? 'ok' : sp <= tg * 1.3 ? 'warn' : 'bad'};
      });
      const zones = all.filter((s) => s.key === key && s.used && typeof s.target === 'string' && /^(high|mid|low)[ -](heel|center|centre|toe)$/i.test(s.target));
      return {clubs, key, club, sh, cm, pts, rows, zones, ftpMed: X.med(pts.map((q) => q.ftp).filter(X.fin)), pathMed: X.med(pts.map((q) => q.path).filter(X.fin))};
    },
  });

  dash.draw('swing', (box) => {
    X.reset(box);
    X.wireShots(box);
    const g = WB.golfer();
    if (!g) { box.append(X.el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const d = dash.data('swing');
    if (d.status !== 'ok') { box.append(X.el('p', 'wb-note', d.status === 'loading' ? 'Loading shots…' : 'Swing and strike couldn’t be worked out.')); return; }
    const S = d.data;
    if (!S.clubs.length) { X.head(box, 'No club has 6 full swings with start line and curve in this date range', 'Import GSPro range sessions, or widen the date range.'); return; }
    const cn = S.club.name.toLowerCase(), est = S.cm ? '' : ', estimated from the ball';
    X.head(box, X.fin(S.ftpMed) ? `The face sits ${X.f1(Math.abs(S.ftpMed))}° ${S.ftpMed >= 0 ? 'open' : 'closed'} to the path on a typical ${cn}${est}` : `Delivery for the ${cn}`,
      `${g.name}: path ${X.fin(S.pathMed) ? X.sg(S.pathMed) + '° (' + (S.pathMed >= 0 ? 'in to out' : 'out to in') + ')' : '—'} across ${S.sh.length} full swings. ${S.cm ? 'Measured club delivery.' : 'Face and path are estimated from start line and curve, ±1.5°, until the monitor sends club data.'}`);
    X.chips(box, S.clubs.map((c) => [c.key, `${c.name} (${c.n})`]), S.key, (k) => { X.state.scl = k; dash.schedule(); }, 'Club');

    const grid = X.el('div', 'lab-grid2');
    box.append(grid);
    const dp = X.dplane(S.key, S.club.cat);
    const dc = X.card(grid, S.cm ? 'Club delivery: path and face' : 'Club delivery, inferred from ball flight', S.cm ? 'The diagonal is face square to path: above it the ball fades, below it draws.' : `Face ≈ start line + ${Math.round((1 - dp.w) * 100)}% of face-to-path; face-to-path ≈ curve ÷ ${dp.k}. Assumes centred contact, so read it as ±1.5°.`, 'lab-c6');
    if (S.pts.length) {
      const col = (q) => (q.s.axis < -3 ? 'var(--series-1)' : q.s.axis > 3 ? 'var(--series-2)' : 'var(--series-3)');
      X.fig(dc, 300, 'Face against path', (W, H) => {
        const m = {l: 44, r: 14, t: 30, b: 30}, A = X.axes(W, H, m, [-9, 9], [-9, 9], {xl: 'Club path, ° (in to out +)' + (S.cm ? '' : ', inferred'), yl: 'Face to target, ° (open +)' + (S.cm ? '' : ', inferred'), xgrid: true, zero: true});
        const cl = (v) => Math.max(-9, Math.min(9, v));
        return A.g + `<line x1="${A.sx(-9)}" y1="${A.sy(-9)}" x2="${A.sx(9)}" y2="${A.sy(9)}" class="lab-axis" stroke-dasharray="4 4"/><text x="${A.sx(-8.6)}" y="${A.sy(7.6)}" class="lab-tick">Face open to path: fades</text><text x="${A.sx(8.6)}" y="${A.sy(-7.6)}" text-anchor="end" class="lab-tick">Face closed to path: draws</text>` + S.pts.map((q) => X.dot(A.sx(cl(q.path)), A.sy(cl(q.face)), col(q), X.tipOf(q.s), q.s.sid + '|' + q.s.k, 3.5, 0.85)).join('');
      });
      X.legend(dc, [['var(--series-1)', 'Draw', 'dt'], ['var(--series-3)', 'No curve', 'dt'], ['var(--series-2)', 'Fade', 'dt']]);
      if (typeof chartTable === 'function') chartTable(dc.querySelector('svg'), 'Club delivery', ['Date', 'Shot', 'Path (°)', 'Face (°)', 'Face to path (°)', 'Source'], S.pts.map((q) => [q.s.date, q.s.n, X.f1(q.path), X.f1(q.face), X.f1(q.ftp), S.cm ? 'Measured' : 'Inferred']));
    }

    const fc = X.card(grid, 'Strike on the face', S.key === 'dr' ? 'Face-spray zones logged on driver shots: hits per zone and their median smash.' : 'Strike zones are logged for the driver first.', 'lab-c6');
    const cnt = (r, c) => S.zones.filter((s) => s.target.toLowerCase().replace('centre', 'center').replace(' ', '-') === (r + '-' + c).toLowerCase());
    const mxz = Math.max(1, ...ZR.flatMap((r) => ZC.map((c) => cnt(r, c).length)));
    X.fig(fc, 300, S.zones.length ? 'Face-spray hits by zone on the driver face' : 'Driver face with no face-spray zones logged yet', (W, H) => {
      const F = X.face(W, H), XE = [-58, -17, 17, 62], YE = [36, 9, -9, -32], fz = Math.round(Math.min(26, Math.max(17, F.sc * 7.5)));
      let z = '';
      ZR.forEach((r, ri) => ZC.forEach((c, ci) => {
        const a = cnt(r, c), sm = X.med(a.map((s) => s.smash).filter(X.fin)), x0 = F.X(XE[ci]), x1 = F.X(XE[ci + 1]), y0 = F.Y(YE[ri]), y1 = F.Y(YE[ri + 1]), mx2 = (x0 + x1) / 2, my = F.Y([18, 0, -14.5][ri]) + 7;
        const mix = a.length ? Math.round(25 + a.length / mxz * 60) : 0;
        z += `<g><title>${r} ${c.toLowerCase()}: ${a.length} logged hits${a.length ? ', median smash ' + X.f2(sm) : ''}</title><rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" fill="#338ced" fill-opacity="${(mix / 100).toFixed(2)}" stroke="#121925" stroke-width="2"/>${S.zones.length ? `<text x="${mx2.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle" class="lab-zone"><tspan class="lab-zn" style="font-size:${fz}px">${a.length}</tspan>${a.length ? `<tspan dx="5">${X.f2(sm)}</tspan>` : ''}</text>` : ''}</g>`;
      }));
      return F.base + `<g clip-path="url(#${F.u}c)">${z}</g><path d="${F.ol}" fill="none" stroke="#6f8379" stroke-width="1.5"/>` + F.lab;
    }, 'lab-face');
    fc.append(X.el('p', 'wb-note', S.zones.length ? `Large number: hits in the zone; small: their median smash. ${S.zones.length} hits logged.` : 'Needs data: face-spray zones. Tag driver shots in Shots with a target such as “Mid center” or “Low toe” (Drill Runner will log them by tap). Until then contact can’t be split from swing.'));

    const ct = X.card(box, 'Delivery consistency', `Spread is one standard deviation across ${S.sh.length} shots; the change compares the first two weeks in range with the last two.${S.cm ? '' : ' Not measured by this export: attack angle, dynamic loft, spin loft and impact location.'}`);
    const stc = {ok: ['Tight', 'wb-ok'], warn: ['Close', 'wb-warnc'], bad: ['Wide', 'wb-badc']};
    X.table(ct, ['Measure', 'Source', 'Median', 'Spread', 'Target spread', 'Spread, first → last 2 weeks', 'Status'], S.rows.filter((r) => r.med !== null).map((r) => {
      const d2 = r.u === '' ? 3 : r.k === 'Club speed' ? 1 : 1, fm = (v) => (X.fin(v) ? (r.u === '' ? v.toFixed(3).replace(/0$/, '') : v.toFixed(d2)) + r.u : '—');
      const st = r.st ? X.el('span', 'lab-st ' + stc[r.st][1], stc[r.st][0]) : '';
      const src = X.el('span', 'lab-src' + (r.src === 'Inferred' ? ' inf' : ''), r.src);
      return [r.k, src, r.u === '' ? X.f2(r.med) : (r.k === 'Club speed' ? X.f1(r.med) : X.sg(r.med)) + r.u, fm(r.sd), fm(r.tg), `${fm(r.e)} → ${fm(r.l)}`, st];
    }), [2, 3, 4, 5]);

    const grid2 = X.el('div', 'lab-grid2');
    box.append(grid2);
    const ls = X.card(grid2, 'Launch and spin, as measured', 'Both come straight from the ball. Spin waits on the spin check before it drives decisions.', 'lab-c6');
    const lsp = S.sh.filter((s) => X.fin(s.launch) && X.fin(s.spin));
    if (lsp.length) {
      X.fig(ls, 260, 'Launch against spin', (W, H) => {
        const m = {l: 54, r: 14, t: 30, b: 30}, la = lsp.map((s) => s.launch), sp = lsp.map((s) => s.spin), A = X.axes(W, H, m, [Math.floor(Math.min(...la)) - 1, Math.ceil(Math.max(...la)) + 1], [Math.floor(Math.min(...sp) / 500) * 500, Math.ceil(Math.max(...sp) / 500) * 500], {xl: 'Launch, °', yl: 'Spin, rpm', yf: (t) => Math.round(t).toLocaleString('en-US')});
        return A.g + lsp.map((s) => X.dot(A.sx(s.launch), A.sy(s.spin), 'var(--series-1)', X.tipOf(s), s.sid + '|' + s.k, 3.5, 0.8)).join('');
      });
      X.legend(ls, [['var(--series-1)', 'Shots', 'dt']]);
    }
    const sc = X.card(grid2, 'Start line against curve', 'Measured shot shape; the box is straight: ±2° start and ±3° curve.', 'lab-c6');
    X.fig(sc, 260, 'Start line against curve', (W, H) => {
      const m = {l: 44, r: 14, t: 30, b: 30}, A = X.axes(W, H, m, [-10, 10], [-20, 20], {xl: 'Start line (HLA), ° (right +)', yl: 'Curve (spin axis), ° (fade +)', xgrid: true, zero: true}), cl = (v, a) => Math.max(-a, Math.min(a, v));
      const col = (s) => (s.axis < -3 ? 'var(--series-1)' : s.axis > 3 ? 'var(--series-2)' : 'var(--series-3)');
      return A.g + `<rect x="${A.sx(-2)}" y="${A.sy(3)}" width="${A.sx(2) - A.sx(-2)}" height="${A.sy(-3) - A.sy(3)}" class="lab-box"/>` + S.sh.map((s) => X.dot(A.sx(cl(s.hla, 10)), A.sy(cl(s.axis, 20)), col(s), X.tipOf(s), s.sid + '|' + s.k, 3.5, 0.85)).join('');
    });
    X.legend(sc, [['var(--series-1)', 'Draw', 'dt'], ['var(--series-3)', 'No curve', 'dt'], ['var(--series-2)', 'Fade', 'dt']]);
  });
})();
