/* Partial shots (FR-12; design package v1.0): the wedge yardage book by club and swing length (¼, ½, ¾, full).
   Swing length comes from shot tags. Untagged wedge shots get a suggested length from club speed (their share of the
   club's full-swing speed), marked as suggested, until they are tagged. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || !window.LAB) return;
  const X = window.LAB, LENS = ['¼', '½', '¾', 'Full'], LN = {'¼': 'quarter', '½': 'half', '¾': 'three-quarter', Full: 'full'};
  const isShort = (s) => s.cat === 'wedge' || s.key === 'i9' || s.key === 'i8';

  dash.calc('partials', {
    inputs: ['labshots'],
    fn: (all) => {
      const part = new Set(all.filter((s) => s.swing && s.swing !== 'Full').map((s) => s.key));
      const sh = all.filter((s) => s.used && (isShort(s) || part.has(s.key)) && X.fin(s.carry) && s.carry > 3);
      const full = {};
      sh.forEach((s) => { if (X.fin(s.club_speed)) (full[s.key] = full[s.key] || []).push(s.club_speed); });
      Object.keys(full).forEach((k) => { full[k] = X.qt(full[k], 0.9); });
      sh.forEach((s) => {
        s.len = s.swing && LENS.includes(s.swing) ? s.swing : null;
        s.sug = false;
        if (!s.len && !isShort(s)) s.len = 'Full';
        else if (!s.len && X.fin(s.club_speed) && full[s.key]) { const r = s.club_speed / full[s.key]; s.len = r >= 0.92 ? 'Full' : r >= 0.8 ? '¾' : r >= 0.65 ? '½' : '¼'; s.sug = true; }
      });
      const clubs = [...new Map(sh.map((s) => [s.key, {key: s.key, name: s.name, order: s.order}])).values()].sort((a, b) => a.order - b.order);
      const cells = [];
      clubs.forEach((c) => LENS.forEach((L) => {
        const a = sh.filter((s) => s.key === c.key && s.len === L), cv = a.map((s) => s.carry);
        cells.push({key: c.key, name: c.name, len: L, n: a.length, tagged: a.filter((s) => !s.sug).length, mean: X.mean(cv), sd: X.sd(cv), roll: X.med(a.filter((s) => X.fin(s.total)).map((s) => (s.total - s.carry) / s.total * 100)), spin: X.med(a.map((s) => s.spin).filter(X.fin)), launch: X.med(a.map((s) => s.launch).filter(X.fin)), sh: a});
      }));
      const ok = cells.filter((c) => c.n >= 3 && c.sd !== null);
      const sorted = ok.slice().sort((a, b) => a.mean - b.mean), holes = [];
      for (let i = 1; i < sorted.length; i++) { const a = sorted[i - 1], b = sorted[i]; if (b.mean - a.mean > 10) holes.push({a, b}); }
      return {clubs, cells, ok, holes, n: sh.length, tagged: sh.filter((s) => !s.sug).length, worst: ok.length ? ok.reduce((a, b) => (b.sd > a.sd ? b : a)) : null};
    },
  });

  dash.draw('partials', (box) => {
    X.reset(box);
    X.wireShots(box);
    const g = WB.golfer();
    if (!g) { box.append(X.el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const d = dash.data('partials');
    if (d.status !== 'ok') { box.append(X.el('p', 'wb-note', d.status === 'loading' ? 'Loading shots…' : 'Partial shots couldn’t be worked out.')); return; }
    const P = d.data;
    if (!P.n) { X.head(box, 'No wedge or short-iron shots in this date range', 'Import a session with wedge swings, or widen the date range.'); return; }
    const w = P.worst;
    X.head(box, w ? `The ${w.len === 'Full' ? 'full' : w.len} ${w.name.toLowerCase()} is the least reliable: ±${X.f1(w.sd)} yards of carry` : 'Not enough partial swings yet to compare',
      `${g.name}: ${P.n} wedge and short-iron shots; ${P.tagged} tagged with a swing length, ${P.n - P.tagged} suggested from club speed. ${P.holes.length ? P.holes.length + (P.holes.length === 1 ? ' hole' : ' holes') + ' over 10 yards in the yardage book. ' : ''}The target is 3 yards of spread in every cell.`);

    const cov = X.card(box, 'Distance coverage map', 'Each bar spans the mean ± one spread of carry; the white tick is the mean. Dashed bars are suggested from club speed, not tagged.');
    const max = Math.max(60, ...P.ok.map((c) => c.mean + c.sd)) * 1.05, rows = X.el('div', 'lab-cov');
    P.clubs.forEach((c) => {
      const r = X.el('div', 'lab-covrow'), t = X.el('span', 'lab-covtrack');
      r.append(X.el('span', 'lab-covk', c.name));
      P.cells.filter((x) => x.key === c.key && x.n >= 2 && x.sd !== null).forEach((x) => {
        const a = Math.max(0, x.mean - x.sd), b = x.mean + x.sd, seg = X.el('span', 'lab-covseg l' + LENS.indexOf(x.len) + (x.tagged < x.n / 2 ? ' sug' : ''));
        seg.style.left = (a / max * 100).toFixed(2) + '%'; seg.style.width = ((b - a) / max * 100).toFixed(2) + '%';
        seg.title = `${x.name}, ${LN[x.len]} swing: ${X.f1(x.mean)} ± ${X.f1(x.sd)} yd carry, ${x.n} shots (${x.tagged} tagged)`;
        const tick = X.el('i'); tick.style.left = (((x.mean - a) / (b - a)) * 100).toFixed(1) + '%'; seg.append(tick);
        t.append(seg);
      });
      r.append(t); rows.append(r);
    });
    const ax = X.el('div', 'lab-covax');
    for (let v = 0; v <= max; v += max > 120 ? 25 : 20) { const s = X.el('span', '', String(v)); s.style.left = (v / max * 100).toFixed(2) + '%'; ax.append(s); }
    rows.append(ax);
    cov.append(rows);
    X.legend(cov, LENS.map((L, i) => [`var(--lab-l${i})`, L === 'Full' ? 'Full swing' : L + ' swing']));
    if (typeof chartTable === 'function') chartTable(rows, 'Wedge yardage book', ['Club', 'Swing', 'Shots', 'Tagged', 'Carry mean (yd)', 'Spread (yd)', 'Roll %', 'Spin (rpm)', 'Launch (°)'], P.cells.filter((x) => x.n).map((x) => [x.name, x.len, x.n, x.tagged, X.f1(x.mean), X.f1(x.sd), X.f0(x.roll), X.f0(x.spin), X.f1(x.launch)]));

    const grid = X.el('div', 'lab-grid2');
    box.append(grid);
    const mc = X.card(grid, 'Club × swing-length matrix', 'Carry mean ± spread; darker cells spread wider. Tap a cell for its shots.', 'lab-c6');
    const sds = P.ok.map((c) => c.sd), lo = Math.min(...sds, 3), hi = Math.max(...sds, 3.1), hm = X.el('div', 'lab-heat lab-heat4');
    hm.append(X.el('span'));
    LENS.forEach((L) => hm.append(X.el('span', 'lab-hl', L === 'Full' ? 'Full' : L)));
    const selKey = X.state.cell || (w ? w.key + '|' + w.len : null);
    P.clubs.forEach((c) => {
      hm.append(X.el('span', 'lab-hl', c.name.replace(' wedge', '').replace(' iron', 'i')));
      LENS.forEach((L) => {
        const x = P.cells.find((y) => y.key === c.key && y.len === L), k = c.key + '|' + L, b = X.el('button', 'lab-cell' + (k === selKey ? ' on' : ''));
        b.type = 'button';
        if (x && x.n >= 3 && x.sd !== null) {
          const t = (x.sd - lo) / ((hi - lo) || 1);
          b.style.setProperty('--mix', Math.round(18 + t * 70) + '%');
          if (t > 0.55) b.classList.add('deep');
          if (x.tagged < x.n / 2) b.classList.add('sug');
          b.append(X.el('b', '', X.f0(x.mean)), X.el('span', '', '±' + X.f1(x.sd)));
          b.title = `${x.name}, ${LN[L]} swing: ${X.f1(x.mean)} ± ${X.f1(x.sd)} yd, ${x.n} shots`;
        } else { b.append(X.el('span', '', x && x.n ? x.n + ' shot' + (x.n === 1 ? '' : 's') : '—')); b.classList.add('empty'); }
        b.addEventListener('click', () => { X.state.cell = k; dash.schedule(); });
        hm.append(b);
      });
    });
    mc.append(hm, X.el('p', 'wb-note', 'Target: 3 yards of spread or less in every cell, and neighbouring cells 6 or more yards apart. A dashed outline means most shots were suggested from club speed.'));

    const sel = P.cells.find((x) => x.key + '|' + x.len === selKey) || null;
    const dc = X.card(grid, sel ? `${sel.name}, ${sel.len === 'Full' ? 'full' : sel.len} swing` : 'Pick a cell', sel && sel.n ? `${sel.n} shots: ${X.f1(sel.mean)} yd ± ${X.f1(sel.sd)}, roll ${X.f0(sel.roll)}%, spin ${X.f0(sel.spin)} rpm` : '', 'lab-c6');
    if (sel && sel.n) {
      const pts = sel.sh.filter((s) => X.fin(s.carry)), weeks = [...new Set(pts.map((s) => s.week).filter(Number.isInteger))].sort((a, b) => a - b);
      if (weeks.length) {
        X.fig(dc, 220, 'Carry of each shot by week', (W, H) => {
          const ys = pts.map((s) => s.carry), m = {l: 44, r: 14, t: 28, b: 30}, w0 = weeks[0] - 0.5, w1 = weeks[weeks.length - 1] + 0.5, A = X.axes(W, H, m, [w0, w1], [Math.min(...ys) - 4, Math.max(...ys) + 4], {xl: 'Week', yl: 'Carry, yd', xf: (t) => (Number.isInteger(t) ? WB.wk(t) : '')});
          return A.g + `<line x1="${m.l}" x2="${W - m.r}" y1="${A.sy(sel.mean).toFixed(1)}" y2="${A.sy(sel.mean).toFixed(1)}" stroke="var(--series-3)" stroke-width="1.5"/>` + pts.map((s, i) => X.dot(A.sx(s.week + ((i % 5) - 2) * 0.06), A.sy(s.carry), s.sug ? 'var(--series-2)' : 'var(--series-1)', X.tipOf(s) + (s.sug ? ' (length suggested from club speed)' : ''), s.sid + '|' + s.k, 4, 0.9)).join('');
        });
        X.legend(dc, [['var(--series-1)', 'Tagged', 'dt'], ['var(--series-2)', 'Suggested from club speed', 'dt'], ['var(--series-3)', 'Mean', 'ln']]);
      }
    }

    const hc = X.card(box, 'Holes in the yardage book', 'Gaps of more than 10 yards between neighbouring options, by mean carry.');
    if (!P.holes.length) hc.append(X.el('p', 'wb-note', P.ok.length > 1 ? 'No gaps over 10 yards.' : 'Needs at least two cells with 3 or more shots.'));
    else { const ul = X.el('ul', 'lab-list'); P.holes.forEach((h) => ul.append(X.el('li', '', `${X.f0(h.a.mean)}–${X.f0(h.b.mean)} yd: no reliable option (${h.a.name} ${h.a.len} → ${h.b.name} ${h.b.len})`))); hc.append(ul); }
  });
})();
