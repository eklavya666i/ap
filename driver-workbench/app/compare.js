/* Compare two weeks (backlog b15): any two imported weeks side by side for one club (the Club filter at the top, the
   driver when no club is picked), with whether each change is bigger than the shot-to-shot noise; and the strike view:
   every shot's smash over time against the club's target smash. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || typeof WB.clubShots !== 'function') return;
  const MIN = 5, RUN = 9;
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const fmtDay = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : ''; };
  const weekLabel = (w) => 'Week ' + WB.wk(w.week) + (w.dates.length ? ' · ' + fmtDay(w.dates[0]) + (w.dates.length > 1 ? '+' : '') : '');

  /* Readings compared. better: which way is better; win: judged by distance from the club's window. */
  const ROWS = [
    {k: 'club', label: 'Club speed', unit: 'mph', d: 1, better: 'up'},
    {k: 'ball', label: 'Ball speed', unit: 'mph', d: 1, better: 'up'},
    {k: 'smash', label: 'Smash', unit: '', d: 2, better: 'up'},
    {k: 'at', label: 'At target smash', share: true, better: 'up'},
    {k: 'launch', label: 'Launch', unit: '°', d: 1, win: 'launch'},
    {k: 'spin', label: 'Spin', unit: 'rpm', d: 0, win: 'spin'},
    {k: 'carry', label: 'Carry', unit: 'yd', d: 0, better: 'up'},
    {k: 'total', label: 'Total', unit: 'yd', d: 0, better: 'up'},
    {k: 'carry', label: 'Carry spread', unit: 'yd', d: 1, better: 'down', spread: true},
    {k: 'offline', label: 'Offline spread', unit: 'yd', d: 1, better: 'down', spread: true},
    {k: 'fair', label: 'In the fairway', share: true, better: 'up', driver: true},
  ];

  function stats(shots, target, sea, corridor) {
    const o = {n: shots.length};
    ['club', 'ball', 'smash', 'launch', 'spin', 'carry', 'total', 'offline'].forEach((k) => { const a = shots.map((s) => s[k]).filter(isNum); o[k] = {v: mean(a), sd: stdev(a), n: a.length}; });
    if (sea) { const f = WB.seaRatio(shots); if (isNum(o.carry.v)) o.carry.v *= f; if (isNum(o.carry.sd)) o.carry.sd *= f; }
    const sm = shots.map((s) => s.smash).filter(isNum), off = shots.map((s) => s.offline).filter(isNum);
    o.at = isNum(target) && sm.length ? {p: sm.filter((v) => v >= target - 0.0049).length / sm.length, n: sm.length} : null;
    o.fair = off.length ? {p: off.filter((v) => Math.abs(v) <= corridor / 2).length / off.length, n: off.length} : null;
    return o;
  }
  /* A change is real when it is at least twice its standard error. Spreads use the large-sample error sd ÷ √(2(n−1)). */
  function judge(row, A, B) {
    if (row.share) {
      const a = A[row.k], b = B[row.k];
      if (!a || !b) return {a: null, b: null};
      const se = Math.sqrt((a.p * (1 - a.p)) / a.n + (b.p * (1 - b.p)) / b.n), dv = b.p - a.p;
      return {a: a.p, b: b.p, dv, real: a.n >= MIN && b.n >= MIN ? (se > 0 ? Math.abs(dv) >= 2 * se : dv !== 0) : null};
    }
    const a = A[row.k], b = B[row.k];
    const av = row.spread ? a.sd : a.v, bv = row.spread ? b.sd : b.v;
    if (!isNum(av) || !isNum(bv)) return {a: av, b: bv};
    const se = row.spread ? Math.sqrt((a.sd * a.sd) / (2 * Math.max(1, a.n - 1)) + (b.sd * b.sd) / (2 * Math.max(1, b.n - 1))) : Math.sqrt(((a.sd || 0) * (a.sd || 0)) / a.n + ((b.sd || 0) * (b.sd || 0)) / b.n);
    const dv = bv - av;
    return {a: av, b: bv, dv, real: a.n >= MIN && b.n >= MIN ? (se > 0 ? Math.abs(dv) >= 2 * se : dv !== 0) : null};
  }
  const off = (v, w) => (!w || !isNum(v) ? null : v < w[0] ? w[0] - v : v > w[1] ? v - w[1] : 0);
  function direction(row, j, win) {
    if (!isNum(j.dv) || j.dv === 0) return 'same';
    if (row.win) {
      const da = off(j.a, win && win[row.win]), db = off(j.b, win && win[row.win]);
      if (da === null || db === null || da === db) return 'neutral';
      return db < da ? 'better' : 'worse';
    }
    if (!row.better) return 'neutral';
    return (row.better === 'up') === (j.dv > 0) ? 'better' : 'worse';
  }

  dash.calc('cmpdata', {
    inputs: ['imports', 'clublist', 'windows'],
    fn: (imports) => {
      const p = dash.params(), c = WB.pickedClub() || {key: 'dr', name: 'Driver'};
      const g = WB.clubShots(imports, c.key).get(c.key);
      const weeks = g ? [...g.weeks.entries()].sort((a, b) => a[0] - b[0]).map(([week, shots]) => ({week, shots, n: shots.length, dates: [...new Set(shots.map((s) => s.date).filter(Boolean))].sort()})) : [];
      const target = WB.clubTarget(c.key), corridor = Number(p.corridor) || 30;
      const find = (w) => weeks.find((x) => x.week === Number(w));
      const B = find(p.cmp_b) || weeks[weeks.length - 1] || null;
      const A = find(p.cmp_a) || weeks[weeks.length - 2] || B;
      const base = {key: c.key, name: c.name, picked: !!WB.pickedClub(), target, weeks: weeks.map((w) => ({week: w.week, n: w.n, dates: w.dates}))};
      /* The strike view: every shot in the date range in the order hit, a gap between weeks, and a running median. */
      let x = 0;
      const pts = [], groups = [];
      weeks.forEach((w, wi) => {
        if (wi) x += 3;
        const x0 = x, sm = [];
        w.shots.forEach((s) => { if (isNum(s.smash)) { pts.push({x, week: w.week, smash: s.smash, ball: s.ball, club: s.club, date: s.date}); sm.push(s.smash); x++; } });
        if (sm.length) groups.push({week: w.week, x0, x1: x - 1, n: sm.length, avg: mean(sm), at: isNum(target) ? sm.filter((v) => v >= target - 0.0049).length / sm.length : null});
      });
      /* Running median of the last 9 shots, restarted each week. */
      groups.forEach((gr) => {
        const wk = pts.filter((q) => q.week === gr.week);
        wk.forEach((q, i) => { const win = wk.slice(Math.max(0, i - (RUN - 1)), i + 1).map((z) => z.smash).sort((a, b) => a - b); q.run = win.length >= 3 ? (win.length % 2 ? win[win.length >> 1] : (win[win.length / 2 - 1] + win[win.length / 2]) / 2) : null; });
      });
      if (!B) return Object.assign(base, {a: null, b: null, rows: [], pts, groups});
      const SA = stats(A.shots, target, p.cview === 'sea', corridor), SB = stats(B.shots, target, p.cview === 'sea', corridor);
      const bs = SB.ball.v, cs = SB.club.v, win = WB.clubWindows(c.key, cs, bs);
      const rows = ROWS.filter((r) => !r.driver || c.key === 'dr').filter((r) => r.k !== 'at' || isNum(target)).map((r) => {
        const j = judge(r, SA, SB);
        const label = (r.k === 'carry' && !r.spread && p.cview === 'sea' ? 'Carry at sea level' : r.label) + (r.unit && r.unit !== '°' ? ' (' + r.unit + ')' : '');
        return Object.assign({label, unit: r.unit, d: r.d, share: !!r.share, dir: j.real ? direction(r, j, win) : null}, j);
      });
      return Object.assign(base, {a: A.week, b: B.week, nA: SA.n, nB: SB.n, rows, pts, groups, corridor});
    },
  });

  dash.draw('cmpweek', (sel) => {
    const d = dash.data('cmpdata');
    const ws = d.status === 'ok' ? d.data.weeks : [];
    const keys = ws.map((w) => w.week + ':' + w.n).join('|');
    if (sel.dataset.keys !== keys) {
      sel.replaceChildren(...ws.slice().reverse().map((w) => { const o = document.createElement('option'); o.value = String(w.week); o.textContent = weekLabel(w); return o; }));
      sel.dataset.keys = keys;
    }
    sel.disabled = ws.length < 2;
    const v = d.status === 'ok' ? d.data[sel.dataset.which] : null;
    if (v !== null && v !== undefined && document.activeElement !== sel) sel.value = String(v);
  });
  ['a', 'b'].forEach((which) => {
    const sel = document.getElementById('cmp-' + which);
    if (sel) sel.addEventListener('change', () => dash.setParams({['cmp_' + which]: Number(sel.value)}));
  });

  dash.draw('cmphead', (box) => {
    const d = dash.data('cmpdata');
    if (d.status !== 'ok') { box.textContent = ''; return; }
    const t = d.data;
    if (!t.weeks.length) { box.textContent = `No ${t.name.toLowerCase()} shots in this date range${t.picked ? '' : '. Pick a club at the top to compare another'}.`; return; }
    if (t.weeks.length < 2) { box.textContent = `${t.name}: only one week with shots in this date range, so there is nothing to compare yet.`; return; }
    box.textContent = `${t.name}${t.picked ? '' : ' (pick a club at the top to compare another)'}: week ${WB.wk(t.a)} (${t.nA} shots) against week ${WB.wk(t.b)} (${t.nB} shots).`;
  });
  dash.draw('cmpcol', (th) => {
    const d = dash.data('cmpdata'), w = d.status === 'ok' ? d.data[th.dataset.which] : null;
    th.textContent = w === null || w === undefined ? (th.dataset.which === 'a' ? 'Week A' : 'Week B') : 'Week ' + WB.wk(w);
  });

  const CHIP = {better: ['ok', 'Better'], worse: ['warn', 'Worse'], neutral: ['none', 'Changed'], same: ['none', 'Same']};
  dash.draw('cmprows', (tb) => {
    tb.replaceChildren();
    const d = dash.data('cmpdata');
    if (d.status !== 'ok') { msgRow(tb, 5, loadingText(d.status, 'The comparison')); return; }
    const t = d.data;
    if (!t.rows.length) { msgRow(tb, 5, 'Import sessions with this club to compare weeks.'); return; }
    const deg = (r) => (r.unit === '°' ? '°' : '');
    const fmt = (r, v) => (!isNum(v) ? '—' : r.share ? Math.round(v * 100) + '%' : fmtD(v, r.d) + deg(r));
    const fmtDv = (r, v) => (!isNum(v) ? '—' : r.share ? F.sg(Math.round(v * 100), 0) + ' pts' : F.sg(v, r.d) + deg(r));
    [{label: 'Shots', a: t.nA, b: t.nB, plain: true}].concat(t.rows).forEach((r) => {
      const tr = tb.insertRow();
      const th = el('th', 'wb-l', r.label); th.scope = 'row'; tr.append(th);
      if (r.plain) { [String(r.a), String(r.b), '', ''].forEach((v) => { tr.insertCell().textContent = v; }); return; }
      tr.insertCell().textContent = fmt(r, r.a);
      tr.insertCell().textContent = fmt(r, r.b);
      tr.insertCell().textContent = fmtDv(r, r.dv);
      const td = tr.insertCell();
      if (r.real === null || r.real === undefined) { td.textContent = isNum(r.dv) ? 'Too few shots' : '—'; td.className = 'wb-sub'; return; }
      if (!r.real) { td.append(el('span', 'wb-chip none', r.dv === 0 ? 'Same' : 'Noise')); return; }
      const [lv, word] = CHIP[r.dir] || CHIP.neutral;
      td.append(el('span', 'wb-chip ' + lv, word));
    });
  });

  dash.draw('strikenote', (box) => {
    const d = dash.data('cmpdata');
    if (d.status !== 'ok' || !d.data.groups.length) { box.textContent = ''; return; }
    const t = d.data, last = t.groups[t.groups.length - 1];
    box.textContent = `${t.name}: every shot’s smash in the date range, in the order hit${isNum(t.target) ? `, against a target of ${t.target.toFixed(2)}${t.key === 'dr' ? ' (the driver dashboard’s target)' : ' (the tour’s ball ÷ club speed)'}` : ''}. ` +
      (isNum(last.at) ? `Week ${WB.wk(last.week)}: ${Math.round(last.at * 100)}% of ${last.n} shots reached it, average ${last.avg.toFixed(2)}.` : '');
  });

  dash.draw('strike', (box) => {
    box.replaceChildren();
    chartTable(box, null);
    const d = dash.data('cmpdata');
    if (d.status !== 'ok') { box.textContent = loadingText(d.status, 'This chart'); return; }
    const t = d.data, pts = t.pts;
    if (!pts.length) { box.append(el('p', 'wb-sub', 'No shots with club and ball speed in this date range.')); return; }
    chartTable(box, t.name + ' smash by week', ['Week', 'Shots', 'Average smash', 'Reached target'], t.groups.map((g) => [WB.wk(g.week), g.n, rd(g.avg, 3), isNum(g.at) ? Math.round(g.at * 100) + '%' : '']));
    const W = Math.max(260, box.clientWidth || 600), H = 220, mt = 10, mb = 24;
    const vals = pts.map((q) => q.smash).concat(isNum(t.target) ? [t.target] : []);
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.1 || 0.02;
    const y = d3.scaleLinear().domain([lo - pad, hi + pad]).range([H - mb, mt]).nice(4);
    const svg = d3.select(box).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', t.name + ' smash by shot over time');
    const yAxis = svg.append('g').attr('class', 'wb-axis').call(d3.axisLeft(y).ticks(4).tickSizeOuter(0).tickFormat(d3.format('.2f')));
    let ml = 8;
    yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 10); });
    yAxis.attr('transform', `translate(${ml},0)`);
    const xMax = pts[pts.length - 1].x;
    const x = d3.scaleLinear().domain([-1, xMax + 1]).range([ml + 4, W - 6]);
    svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(W - ml - 6)).tickFormat(''));
    t.groups.filter((g) => g.week === t.a || g.week === t.b).forEach((g) => {
      svg.append('rect').attr('x', x(g.x0 - 0.5)).attr('width', Math.max(2, x(g.x1 + 0.5) - x(g.x0 - 0.5))).attr('y', mt).attr('height', H - mb - mt).style('fill', 'var(--cds-chart-muted)').style('fill-opacity', 0.35);
    });
    if (isNum(t.target)) svg.append('line').attr('x1', ml).attr('x2', W - 6).attr('y1', y(t.target)).attr('y2', y(t.target)).style('stroke', 'var(--cds-chart-reference)').style('stroke-width', 1.5).style('stroke-dasharray', '4 3');
    const ticks = [];
    t.groups.forEach((g) => { const cx = x((g.x0 + g.x1) / 2); if (!ticks.length || cx - ticks[ticks.length - 1].cx >= 34) ticks.push({cx, label: WB.wk(g.week)}); });
    const xa = svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`);
    xa.append('line').attr('x1', ml).attr('x2', W - 6).style('stroke', 'var(--cds-chart-axis)');
    ticks.forEach((k) => xa.append('text').attr('x', k.cx).attr('y', 16).attr('text-anchor', 'middle').text(k.label));
    const hit = (q) => isNum(t.target) && q.smash >= t.target - 0.0049;
    svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (q) => x(q.x)).attr('cy', (q) => y(q.smash)).attr('r', pts.length > 300 ? 2.2 : 3.2)
      .style('fill', (q) => (hit(q) || !isNum(t.target) ? dash.colors[0] : 'var(--color-panel)')).style('stroke', dash.colors[0]).style('stroke-width', 1.2).style('fill-opacity', 0.85);
    const line = d3.line().x((q) => x(q.x)).y((q) => y(q.run));
    t.groups.forEach((gr) => {
      const run = pts.filter((q) => q.week === gr.week && isNum(q.run));
      if (run.length > 1) svg.append('path').datum(run).attr('d', line).style('fill', 'none').style('stroke', dash.colors[1]).style('stroke-width', 2);
    });
    const tip = d3.select(box).append('div').attr('class', 'wb-tip').style('display', 'none');
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
      .on('pointermove pointerenter', (event) => {
        const [mx, my] = d3.pointer(event), xi = x.invert(mx);
        let best = null;
        pts.forEach((q) => { if (!best || Math.abs(q.x - xi) < Math.abs(best.x - xi)) best = q; });
        if (!best || Math.abs(best.x - xi) > 2) { tip.style('display', 'none'); return; }
        tip.style('display', null).html('');
        tip.append('div').text('Week ' + WB.wk(best.week) + (best.date ? ' · ' + fmtDay(best.date) : ''));
        tip.append('div').append('span').text('Smash ' + best.smash.toFixed(2) + (isNum(best.ball) ? ' · ball ' + best.ball.toFixed(1) + ' mph' : '') + (isNum(best.club) ? ' · club ' + best.club.toFixed(1) : ''));
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 40) + 'px');
      })
      .on('pointerleave', () => tip.style('display', 'none'));
  });
})();
