/* Command center (FR-07 in the dashboards spec): what's happening, how it's moving, what needs to happen,
   this week's drives on a fairway, alerts and import status, for the golfer and date range picked. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const sgn = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);
  const M = {club: ['Club speed', 'mph', 1, 0.3], ball: ['Ball speed', 'mph', 1, 0.3], smash: ['Smash', '', 2, 0.005], carry: ['Carry', 'yd', 0, 1]};
  function slope(pts) {
    const n = pts.length; if (n < 3) return null;
    const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
    const sxx = pts.reduce((a, p) => a + (p[0] - mx) * (p[0] - mx), 0);
    return sxx > 0 ? pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / sxx : null;
  }

  dash.calc('command', {
    inputs: ['trend', 'csvweeks', 'topics', 'imports_all'],
    fn: (trend, csv, topics, all) => {
      const p = dash.params(), corridor = Number(p.corridor) > 0 ? Number(p.corridor) : 30;
      const rows = trend.filter((r) => r.club !== null || r.ball !== null || r.carry !== null);
      const cur = rows[rows.length - 1] || null, prev = rows.length > 1 ? rows[rows.length - 2] : null;
      const now = cur ? Object.keys(M).map((k) => ({k, v: cur[k], d: prev && cur[k] !== null && prev[k] !== null ? cur[k] - prev[k] : null})).filter((x) => x.v !== null) : [];
      const recent = rows.slice(-4), moving = Object.keys(M).map((k) => ({k, s: slope(recent.filter((r) => r[k] !== null).map((r) => [r.week, r[k]]))})).filter((x) => x.s !== null);
      const lastCsv = csv.length ? csv[csv.length - 1] : null;
      const drives = lastCsv ? lastCsv.pts.filter((q) => q.used && q.carry !== null && q.offline !== null) : [];
      const inside = drives.filter((q) => Math.abs(q.offline) <= corridor / 2).length;
      const plan = topics.filter((t) => t.level === 'bad' || t.level === 'warn').slice(0, 3);
      const alerts = [];
      if (lastCsv && lastCsv.n_total && lastCsv.n_left / lastCsv.n_total > 0.2) alerts.push(`${lastCsv.n_left} of ${lastCsv.n_total} drives in week ${WB.wk(lastCsv.week)} look like misreads.`);
      const spins = drives.map((q) => q.spin).filter((v) => typeof v === 'number');
      if (spins.length >= 5 && spins.reduce((a, v) => a + v, 0) / spins.length < 2000) alerts.push('Driver spin reads under 2,000 rpm, low for these speeds: check the spin readings before trusting spin targets.');
      if (WB.conditions().assumed) alerts.push('GSPro conditions aren’t set yet; the SLC preset (4,450 ft) is assumed. Set them under Import → GSPro conditions.');
      let lastAt = null, lastDate = null, batch = 0;
      all.forEach((i) => { if (typeof i.imported_at === 'string' && (!lastAt || i.imported_at > lastAt)) lastAt = i.imported_at; if (i.date && (!lastDate || i.date > lastDate)) lastDate = i.date; });
      all.forEach((i) => { if (i.imported_at === lastAt) batch++; });
      if (lastDate && Date.now() - Date.parse(lastDate + 'T12:00:00') > 10 * 864e5) alerts.push(`No sessions since ${lastDate}. Export this week's GSPro files and drop them on the import station.`);
      return {cur, prev, now, moving, drives, inside, corridor, week: lastCsv ? lastCsv.week : null, plan, alerts, lastAt, lastDate, batch, sea: p.cview === 'sea'};
    },
  });

  dash.draw('cmd', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) { box.append(el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const d = dash.data('command');
    if (d.status !== 'ok') { box.append(el('p', 'wb-note', d.status === 'loading' ? 'Loading…' : 'The command center couldn’t be worked out.')); return; }
    const c = d.data;
    if (!c.cur) { box.append(el('p', 'wb-note', `No weeks for ${g.name} in this date range yet.`)); return; }
    const card = (title, cls) => { const k = el('div', 'wb-card wb-cmd-card' + (cls ? ' ' + cls : '')); k.append(el('h3', '', title)); box.append(k); return k; };

    const a = card('What’s happening');
    a.append(el('p', 'wb-cmd-week', `Week ${WB.wk(c.cur.week)}${c.prev ? ', against week ' + WB.wk(c.prev.week) : ''}${c.sea ? ' (carry at sea level)' : ''}`));
    const ul = el('ul', 'wb-cmd-list');
    c.now.forEach((x) => { const m = M[x.k]; ul.append(el('li', '', `${m[0]} ${x.v.toFixed(m[2])}${m[1] ? ' ' + m[1] : ''}` + (x.d === null ? '' : ` (${sgn(x.d, m[2])})`))); });
    a.append(ul);

    const b = card('How it’s moving');
    if (!c.moving.length) b.append(el('p', 'wb-note', 'Three or more weeks in the range show a direction.'));
    else {
      const ul2 = el('ul', 'wb-cmd-list');
      c.moving.forEach((x) => { const m = M[x.k], dir = Math.abs(x.s) < m[3] ? 'steady' : x.s > 0 ? 'rising' : 'falling'; ul2.append(el('li', '', `${m[0]} ${dir}` + (dir === 'steady' ? '' : `, ${sgn(x.s, m[2])}${m[1] ? ' ' + m[1] : ''} a week`))); });
      b.append(ul2, el('p', 'wb-note', 'Over the last four weeks with data.'));
    }

    const n = card('What needs to happen');
    if (!c.plan.length) n.append(el('p', '', 'Nothing urgent: keep the plan and log next week.'));
    else { const ol = el('ol', 'wb-cmd-list'); c.plan.forEach((t) => ol.append(el('li', '', t.detail))); n.append(ol); }

    const f = card('This week’s drives', 'wb-cmd-fair');
    if (!c.drives.length) f.append(el('p', 'wb-note', 'Import a GSPro CSV with carry and offline to see the fairway.'));
    else {
      f.append(fairway(c), el('p', '', `${c.inside} of ${c.drives.length} drives in week ${WB.wk(c.week)} finish inside a ${c.corridor}-yard fairway.`));
      if (typeof chartTable === 'function') chartTable(f.querySelector('svg'), 'This week’s drives', ['Carry (yd)', 'Offline (yd, + is right)', 'Inside the fairway'], c.drives.map((q) => [Math.round(q.carry), Math.round(q.offline * 10) / 10, Math.abs(q.offline) <= c.corridor / 2 ? 'Yes' : 'No']));
    }

    if (c.alerts.length) { const al = card('Alerts', 'wb-cmd-alerts'); const ul3 = el('ul', 'wb-cmd-list'); c.alerts.forEach((t) => ul3.append(el('li', '', t))); al.append(ul3); }

    const im = card('Imports');
    im.append(el('p', '', c.lastAt ? `Last import ${new Date(c.lastAt).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}: ${c.batch} session${c.batch === 1 ? '' : 's'}. Latest session ${c.lastDate || '—'}.` : 'Nothing imported yet.'));
  });

  /* Top-down fairway: drives as dots, the corridor shaded, the target line dashed. */
  function fairway(c) {
    const ns = 'http://www.w3.org/2000/svg', W = 300, H = 220, pad = 16;
    const xs = c.drives.map((q) => q.offline), ys = c.drives.map((q) => q.carry);
    const xm = Math.max(c.corridor, ...xs.map(Math.abs)) * 1.15, y0 = Math.min(...ys) - 10, y1 = Math.max(...ys) + 10;
    const X = (v) => W / 2 + (v / xm) * (W / 2 - pad), Y = (v) => H - pad - ((v - y0) / (y1 - y0)) * (H - 2 * pad);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${c.inside} of ${c.drives.length} drives inside a ${c.corridor}-yard fairway`);
    const add = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    add('rect', {x: X(-c.corridor / 2), y: pad / 2, width: X(c.corridor / 2) - X(-c.corridor / 2), height: H - pad, class: 'wb-fw-band'});
    add('line', {x1: X(0), x2: X(0), y1: pad / 2, y2: H - pad / 2, class: 'wb-fw-line'});
    c.drives.forEach((q) => add('circle', {cx: X(q.offline), cy: Y(q.carry), r: 4, class: Math.abs(q.offline) <= c.corridor / 2 ? 'wb-fw-in' : 'wb-fw-out'}));
    [Math.round(y0 + 10), Math.round(y1 - 10)].forEach((v) => { const t = add('text', {x: 4, y: Y(v) + 4, class: 'wb-fw-label'}); t.textContent = v + ' yd'; });
    return svg;
  }
})();
