/* Goal tracker (FR-17) and the Driver lab's path to 260 (FR-08), with the dashboards spec's definitions:
   260 is the median driver total over the last 2 weeks (30 or more drives), restated at sea level, fairway firmness 3;
   long and straight is a drive of 250 or more, restated the same way, finishing inside the fairway corridor. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || typeof BF !== 'object') return;
  const GOAL = 260, LONG = 250, MIN_N = 30;
  const TURF = ['soft', 'soft', 'normal', 'firm', 'baked'];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function theilSen(pts) {
    const sl = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (pts[j][0] !== pts[i][0]) sl.push((pts[j][1] - pts[i][1]) / (pts[j][0] - pts[i][0]));
    return sl.length ? median(sl) : null;
  }

  dash.calc('goals', {
    inputs: ['csvweeks'],
    fn: (csv) => {
      const p = dash.params(), c = WB.conditions(), corridor = Number(p.corridor) > 0 ? Number(p.corridor) : 30;
      const std = {alt: 0, temp: 75, turf: 'normal'};
      const weeks = csv.map((w) => {
        const used = w.pts.filter((q) => q.used && typeof q.total === 'number' && q.total > 0);
        const full = used.filter((q) => ['ball_speed', 'launch', 'spin'].every((k) => typeof q[k] === 'number'));
        if (used.length < 3 || full.length < 3) return null;
        const avg = (k) => full.reduce((a, q) => a + q[k], 0) / full.length;
        const alt = typeof w.alt === 'number' ? w.alt : c.altitude_ft;
        const asHit = BF.shot(avg('ball_speed'), avg('launch'), avg('spin'), {alt, temp: c.temp_f, turf: TURF[(c.firmness || 3) - 1] || 'normal'}).total;
        const atStd = BF.shot(avg('ball_speed'), avg('launch'), avg('spin'), std).total;
        const r = asHit > 0 && atStd > 0 ? atStd / asHit : 1;
        const drives = used.map((q) => ({total: q.total * r, offline: q.offline}));
        return {week: w.week, ratio: r, drives, median: median(drives.map((d) => d.total))};
      }).filter(Boolean);
      if (!weeks.length) return null;
      const top = weeks[weeks.length - 1].week, last2 = weeks.filter((w) => w.week > top - 2).flatMap((w) => w.drives);
      const med = median(last2.map((d) => d.total));
      const ls = last2.filter((d) => d.total >= LONG && typeof d.offline === 'number' && Math.abs(d.offline) <= corridor / 2).length;
      const series = weeks.filter((w) => w.drives.length >= 5).map((w) => [w.week, w.median]);
      const slope = series.length >= 4 ? theilSen(series.slice(-8)) : null;
      const eta = med !== null && med < GOAL && slope > 0.2 ? Math.ceil((GOAL - med) / slope) : null;
      /* Club speed that reaches 260 with the target smash and the best launch and spin for it (bisection on the model). */
      const smT = Number(p.smash_target) || 1.47, aoa = Number(p.aoa) || 0;
      const totalAt = (cs) => { const b = BF.best(cs * smT, cs, aoa, std); return b && b.total ? b.total : BF.shot(cs * smT, b ? b.launch : 12, b ? b.spin : 2500, std).total; };
      let lo = 60, hi = 130;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (totalAt(mid) < GOAL) lo = mid; else hi = mid; }
      return {median: med, n: last2.length, provisional: last2.length < MIN_N, gap: med === null ? null : GOAL - med, ls, lsN: last2.length, corridor, series, slope, eta, speedFor: hi, smT,
        weeks: weeks.map((w) => ({week: w.week, median: w.median, n: w.drives.length}))};
    },
  });

  dash.draw('goals', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) return;
    const d = dash.data('goals');
    if (d.status !== 'ok' || !d.data) { box.append(el('p', 'wb-note', d.status === 'loading' ? 'Loading…' : 'Import GSPro CSVs with driver total to track the goals.')); return; }
    const q = d.data;
    const a = el('div', 'wb-card wb-goal');
    a.append(el('h3', '', `${g.name}: ${GOAL} yards`));
    a.append(el('p', 'wb-num', q.median === null ? '—' : Math.round(q.median) + ' yd'));
    a.append(el('p', 'wb-note', `Median driver total over the last 2 weeks, restated at sea level and firmness 3: ${q.n} drives` + (q.provisional ? `, under the ${MIN_N} the goal needs, so treat it as provisional.` : '.')));
    const ms = el('ul', 'wb-cmd-list');
    [240, 250, 260].forEach((m) => ms.append(el('li', '', `${m} yd: ` + (q.median !== null && q.median >= m ? 'reached' : q.median === null ? '—' : `${Math.round(m - q.median)} yd to go`))));
    a.append(ms);
    a.append(el('p', '', q.median !== null && q.median >= GOAL ? 'Goal reached.' : q.eta ? `At the current rate (${q.slope.toFixed(1)} yd a week), about ${q.eta} weeks to ${GOAL}.` : 'Not enough rising weeks yet to project a date.'));
    a.append(el('p', 'wb-note', `With a ${q.smT.toFixed(2)} smash and the best launch and spin, ${GOAL} needs about ${q.speedFor.toFixed(1)} mph of club speed.`));
    const b = el('div', 'wb-card wb-goal');
    b.append(el('h3', '', 'Long and straight'));
    b.append(el('p', 'wb-num', q.lsN ? Math.round((q.ls / q.lsN) * 100) + '%' : '—'));
    b.append(el('p', 'wb-note', `${q.ls} of ${q.lsN} drives in the last 2 weeks went ${LONG} yards or more (restated) and finished inside a ${q.corridor}-yard fairway. Change the fairway width in the filter row.`));
    const t = el('div', 'wb-card wb-goal');
    t.append(el('h3', '', 'Median total by week'));
    t.append(spark(q));
    box.append(a, b, t);
    if (typeof chartTable === 'function') chartTable(t.querySelector('svg'), 'Median restated driver total by week', ['Week', 'Median total (yd)', 'Drives'], q.weeks.map((w) => [WB.wk(w.week), Math.round(w.median), w.n]));
  });

  function spark(q) {
    const ns = 'http://www.w3.org/2000/svg', W = 300, H = 120, pad = 18, s = q.weeks.filter((w) => w.median !== null);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Median restated driver total by week against the 260 goal');
    if (!s.length) return svg;
    const vals = s.map((w) => w.median).concat([GOAL]), y0 = Math.min(...vals) - 5, y1 = Math.max(...vals) + 5;
    const x0 = s[0].week, x1 = Math.max(s[s.length - 1].week, x0 + 1);
    const X = (v) => pad + ((v - x0) / (x1 - x0)) * (W - 2 * pad), Y = (v) => H - pad - ((v - y0) / (y1 - y0)) * (H - 2 * pad);
    const add = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    add('line', {x1: pad, x2: W - pad, y1: Y(GOAL), y2: Y(GOAL), class: 'wb-goal-line'});
    const lbl = add('text', {x: W - pad, y: Y(GOAL) - 4, 'text-anchor': 'end', class: 'wb-fw-label'}); lbl.textContent = GOAL + ' yd';
    add('path', {d: s.map((w, i) => (i ? 'L' : 'M') + X(w.week) + ' ' + Y(w.median)).join(' '), class: 'wb-fl-ball'});
    s.forEach((w) => add('circle', {cx: X(w.week), cy: Y(w.median), r: 3, class: 'wb-fw-in'}));
    return svg;
  }
})();
