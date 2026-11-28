/* Club by club (backlog b19): smash, launch, spin and descent windows for every club at the golfer's own speed, from the
   TrackMan LPGA Tour averages, and week-by-week trends: one club's readings against its windows (the Club filter at the
   top), or carry by week for every club. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || typeof clubInfo !== 'function') return;

  /* TrackMan LPGA Tour averages, yards (support.trackmangolf.com, "LPGA Tour averages"): club and ball speed (mph),
     launch (°), spin (rpm), landing angle (°) and carry (yd). The table has no hybrid row. */
  const LPGA = {
    dr: {row: 'Driver', cs: 94, bs: 140, la: 13.2, sp: 2611, land: 37, carry: 218},
    w3: {row: '3-wood', cs: 90, bs: 132, la: 11.2, sp: 2704, land: 39, carry: 195},
    w5: {row: '5-wood', cs: 88, bs: 128, la: 12.1, sp: 4501, land: 43, carry: 185},
    w7: {row: '7-wood', cs: 85, bs: 123, la: 12.7, sp: 4693, land: 46, carry: 174},
    i4: {row: '4 iron', cs: 80, bs: 116, la: 14.3, sp: 4801, land: 43, carry: 169},
    i5: {row: '5 iron', cs: 79, bs: 112, la: 14.8, sp: 5081, land: 45, carry: 161},
    i6: {row: '6 iron', cs: 78, bs: 109, la: 17.1, sp: 5943, land: 46, carry: 152},
    i7: {row: '7 iron', cs: 76, bs: 104, la: 19.0, sp: 6699, land: 47, carry: 141},
    i8: {row: '8 iron', cs: 74, bs: 100, la: 20.8, sp: 7494, land: 47, carry: 130},
    i9: {row: '9 iron', cs: 72, bs: 93, la: 23.9, sp: 7589, land: 47, carry: 119},
    pw: {row: 'Pitching wedge', cs: 70, bs: 86, la: 25.7, sp: 8403, land: 48, carry: 107},
  };
  /* Smash at least the tour's ball ÷ club speed less 0.04; launch within 2° of the tour; spin within 15% of the tour's,
     scaled to this club speed (spin rises with speed for the same strike); descent at most 3° flatter than the tour lands. */
  const TOL = {smash: 0.04, launch: 2, spin: 0.15, land: 3}, MIN_N = 5, THIN = 3, WEEKS = 8;
  const r50 = (v) => Math.round(v / 50) * 50, r2 = (v) => Math.round(v * 100) / 100, r1 = (v) => Math.round(v * 10) / 10;
  /* Judge the number as shown, so a status never contradicts the value beside it. */
  const shown = (v, d) => (typeof v === 'number' && isFinite(v) ? Math.round(v * Math.pow(10, d)) / Math.pow(10, d) : v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const isNum = (v) => typeof v === 'number' && isFinite(v);

  function refKey(info) {
    if (!info) return null;
    const k = info.key;
    if (k === 'dr' || k === 'pw' || /^i[4-9]$/.test(k)) return k;
    if (/^i[1-3]$/.test(k)) return 'i4';
    if (/^w[23]$/.test(k)) return 'w3';
    if (/^w[45]$/.test(k)) return 'w5';
    if (/^w\d$/.test(k) || /^h\d$/.test(k)) return 'w7';
    return null;
  }
  WB.clubRef = (label) => { const k = refKey(clubInfo(label)); return k ? Object.assign({key: k}, LPGA[k]) : null; };

  /* Windows for one club at this golfer's club speed (or ball speed when club speed wasn't read). The driver uses the
     driver dashboard's windows: the best launch and spin on the flight model for the logged club speed. */
  function windowsFor(info, cs, bs, drv) {
    const rk = refKey(info), ref = rk ? LPGA[rk] : null;
    if (!ref) return null;
    if (rk === 'dr') {
      const t = Number(dash.params().smash_target) || 1.47, d = drv || {};
      return {rk, ref, driver: true, smash: r2(t - TOL.smash), launch: d.launch || [r1(ref.la - TOL.launch), r1(ref.la + TOL.launch)],
        spin: d.spin || [r50(ref.sp * (1 - TOL.spin)), r50(ref.sp * (1 + TOL.spin))], land: null};
    }
    const f = Math.max(0.6, Math.min(1.2, isNum(cs) && cs > 0 ? cs / ref.cs : isNum(bs) && bs > 0 ? bs / ref.bs : 1)), sp = ref.sp * f;
    return {rk, ref, f, smash: r2(ref.bs / ref.cs - TOL.smash), launch: [r1(ref.la - TOL.launch), r1(ref.la + TOL.launch)],
      spin: [r50(sp * (1 - TOL.spin)), r50(sp * (1 + TOL.spin))], land: ref.land - TOL.land};
  }
  WB.clubWindows = (label, cs, bs) => windowsFor(clubInfo(label), cs, bs, dash.data('windows').status === 'ok' ? dash.data('windows').data : null);
  const status = (v, lo, hi) => (!isNum(v) || !isNum(lo) ? null : v < lo ? 'low' : isNum(hi) && v > hi ? 'high' : 'in');

  /* Every club the golfer has hit, across all history, for the Club filter. */
  dash.calc('clublist', {
    inputs: ['imports_all'],
    fn: (all) => {
      const by = new Map();
      all.forEach((i) => i.arows.forEach((r) => {
        const info = clubInfo(r[0]);
        if (!info) return;
        const g = by.get(info.key) || {key: info.key, name: info.name, order: info.order, n: 0};
        g.n++; by.set(info.key, g);
      }));
      return [...by.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    },
  });
  function picked() {
    const p = dash.params().club, l = dash.data('clublist');
    if (!p || p === 'all' || l.status !== 'ok') return null;
    return l.data.find((c) => c.key === p) || null;
  }
  WB.pickedClub = picked;

  dash.draw('clubpick', (sel) => {
    const d = dash.data('clublist'), list = d.status === 'ok' ? d.data : [];
    const keys = ['all'].concat(list.map((c) => c.key)).join('|');
    if (sel.dataset.keys !== keys) {
      const opts = [['all', 'All clubs']].concat(list.map((c) => [c.key, c.name]));
      sel.replaceChildren(...opts.map(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; return o; }));
      sel.dataset.keys = keys;
    }
    const c = picked();
    if (document.activeElement !== sel) sel.value = c ? c.key : 'all';
  });
  (function () {
    const sel = document.getElementById('club-pick');
    if (sel) sel.addEventListener('change', () => dash.setParams({club: sel.value || 'all'}));
  })();

  /* The whole-bag numbers (same sessions as the table above) against each club's windows. */
  dash.calc('clubtargets', {
    inputs: ['bag', 'windows'],
    fn: (bag, wins) => bag.clubs.map((c) => {
      const w = windowsFor(c, c.club, c.ball, wins);
      const o = {key: c.key, name: c.name, order: c.order, n: c.n_used, club: c.club, ball: c.ball, smash: c.smash, launch: c.launch, spin: c.spin, descent: c.descent, carry: c.carry, w, thin: c.n_used < MIN_N};
      if (w && !o.thin) {
        o.s = {smash: status(shown(c.smash, 2), w.smash, null), launch: status(shown(c.launch, 1), w.launch[0], w.launch[1]), spin: status(shown(c.spin, 0), w.spin[0], w.spin[1]), descent: w.land === null ? null : status(shown(c.descent, 1), w.land, null)};
        o.tour_carry = isNum(c.ball) && c.ball > 0 ? w.ref.carry * c.ball / w.ref.bs : null;
      }
      return o;
    }),
  });

  const WORD = {in: 'In', low: 'Low', high: 'High'}, LEVEL = {in: 'ok', low: 'warn', high: 'warn'};
  function cell(text, st, win, stWord) {
    const td = el('td');
    td.append(el('span', 'wb-cv', text));
    if (st) { const c = el('span', 'wb-chip ' + LEVEL[st], stWord || WORD[st]); td.append(c); }
    if (win) td.append(el('small', 'wb-cw', win));
    return td;
  }
  const f1 = (v) => (isNum(v) ? v.toFixed(1) : '—'), f0 = (v) => (isNum(v) ? Math.round(v).toLocaleString('en-US') : '—');
  dash.draw('clubtargets', (tb) => {
    tb.replaceChildren();
    const d = dash.data('clubtargets');
    if (d.status !== 'ok') { msgRow(tb, 8, loadingText(d.status, 'Club by club')); return; }
    if (!d.data.length) { msgRow(tb, 8, 'Import GSPro sessions to see each club against its windows.'); return; }
    const pk = picked();
    d.data.forEach((r) => {
      const tr = el('tr'), w = r.w, s = r.s || {};
      if (r.thin) tr.className = 'thin';
      if (pk && pk.key === r.key) tr.classList.add('wb-sel');
      const nm = el('td', 'wb-wrap');
      nm.append(el('span', '', r.name));
      if (w && !w.driver && w.rk !== r.key) nm.append(el('small', 'wb-cw', 'Tour row: ' + w.ref.row));
      if (!w) nm.append(el('small', 'wb-cw', 'No tour row'));
      tr.append(nm, el('td', '', r.thin ? r.n + ' (too few)' : String(r.n)));
      tr.append(cell(isNum(r.smash) ? r.smash.toFixed(2) : '—', s.smash, w ? '≥ ' + w.smash.toFixed(2) : ''));
      tr.append(cell(isNum(r.launch) ? r.launch.toFixed(1) + '°' : '—', s.launch, w ? w.launch[0].toFixed(1) + '–' + w.launch[1].toFixed(1) + '°' : ''));
      tr.append(cell(f0(r.spin), s.spin, w ? f0(w.spin[0]) + '–' + f0(w.spin[1]) : ''));
      tr.append(cell(isNum(r.descent) ? r.descent.toFixed(1) + '°' : '—', s.descent, w ? (w.land === null ? 'tour ' + w.ref.land + '°' : '≥ ' + w.land + '°') : '', s.descent === 'low' ? 'Flat' : ''));
      tr.append(el('td', '', f0(r.carry)));
      const dc = isNum(r.tour_carry) && isNum(r.carry) ? r.carry - r.tour_carry : null;
      tr.append(cell(dc === null ? '—' : (dc >= 0 ? '+' : '−') + Math.abs(Math.round(dc)) + ' yd', null, isNum(r.tour_carry) ? 'tour-like ' + f0(r.tour_carry) : ''));
      tb.append(tr);
    });
  });

  dash.draw('clubnote', (box) => {
    const d = dash.data('clubtargets');
    if (d.status !== 'ok' || !d.data.length) { box.textContent = ''; return; }
    const NAMES = {smash: 'smash', launch: 'launch', spin: 'spin', descent: 'descent'};
    const out = [];
    d.data.forEach((r) => {
      if (!r.s) return;
      const miss = Object.keys(NAMES).filter((k) => r.s[k] && r.s[k] !== 'in').map((k) => NAMES[k] + ' ' + (k === 'descent' ? 'flat' : r.s[k]));
      if (miss.length) out.push(r.name + ': ' + miss.join(', '));
    });
    const judged = d.data.filter((r) => r.s).length;
    box.textContent = !judged ? 'Five or more shots a club are needed to judge it.' : !out.length ? `All ${judged} judged club${judged === 1 ? ' is' : 's are'} inside the windows.` : `Outside the windows: ${out.slice(0, 4).join('; ')}${out.length > 4 ? `; and ${out.length - 4} more` : ''}.`;
  });

  /* Week by week, from the sessions in the date range: one club's readings, or carry for every club. */
  const statOf = (shots, k) => { const a = shots.map((s) => s[k]).filter(isNum); return {v: mean(a), sd: stdev(a), n: a.length}; };
  function seaRatio(shots) {
    if (typeof BF !== 'object') return 1;
    const c = WB.conditions(), alt = mean(shots.map((s) => s.alt).filter(isNum));
    const bs = statOf(shots, 'ball').v, la = statOf(shots, 'launch').v, sp = statOf(shots, 'spin').v;
    if (!(alt > 200) || !(bs > 0) || !isNum(la) || !(sp > 0)) return 1;
    const up = BF.shot(bs, la, sp, {alt, temp: c.temp_f, turf: 'normal'}).carry, sea = BF.shot(bs, la, sp, {alt: 0, temp: c.temp_f, turf: 'normal'}).carry;
    return up > 0 && sea > 0 ? sea / up : 1;
  }
  /* Every counted shot of one club (or of every club) in these sessions, by week, in the order hit. */
  function collect(imports, key) {
    const c0 = WB.conditions(), by = new Map();
    imports.forEach((i) => {
      if (!Number.isInteger(i.week)) return;
      const ix = {};
      i.cols.forEach((c, k) => { ix[c] = k + 1; });
      const cd = i._doc && i._doc.conditions, alt = cd && isNum(cd.altitude_ft) ? cd.altitude_ft : c0.altitude_ft;
      i.arows.forEach((r, k) => {
        const info = clubInfo(r[0]);
        if (!info || (key && info.key !== key)) return;
        const get = (c) => (ix[c] === undefined || !isNum(r[ix[c]]) ? null : r[ix[c]]);
        const s = {club: get('club_speed'), ball: get('ball_speed'), launch: get('launch'), spin: get('spin'), carry: get('carry'), total: get('total'), descent: get('descent'), offline: get('offline'), alt, date: i.date || '', sid: i.id || '', k};
        if (!shotOk(s, info.cat)) return;
        s.smash = isNum(s.club) && s.club > 0 && isNum(s.ball) ? s.ball / s.club : null;
        const g = by.get(info.key) || {key: info.key, name: info.name, order: info.order, cat: info.cat, weeks: new Map()};
        const wk = g.weeks.get(i.week) || [];
        wk.push(s); g.weeks.set(i.week, wk); by.set(info.key, g);
      });
    });
    by.forEach((g) => g.weeks.forEach((shots) => shots.sort((a, b) => a.date.localeCompare(b.date) || String(a.sid).localeCompare(String(b.sid)) || a.k - b.k)));
    return by;
  }
  WB.clubShots = collect;
  WB.seaRatio = seaRatio;
  /* The smash a club aims for: the driver dashboard's target for the driver, else the tour's ball ÷ club speed. */
  WB.clubTarget = (key) => { const rk = refKey({key}); return !rk ? null : rk === 'dr' ? Number(dash.params().smash_target) || 1.47 : r2(LPGA[rk].bs / LPGA[rk].cs); };
  WB.clubName = (key) => { const l = dash.data('clublist'), c = l.status === 'ok' ? l.data.find((x) => x.key === key) : null; return c ? c.name : key === 'dr' ? 'Driver' : key; };

  dash.calc('clubweeks', {
    inputs: ['imports', 'clublist', 'clubtargets', 'windows'],
    fn: (imports, list, targets, wins) => {
      const p = dash.params(), sea = p.cview === 'sea';
      const pick = p.club && p.club !== 'all' ? list.find((c) => c.key === p.club) || null : null;
      const by = collect(imports, pick ? pick.key : null);
      if (pick) {
        const g = by.get(pick.key);
        const weeks = g ? [...g.weeks.entries()].sort((a, b) => a[0] - b[0]).map(([week, shots]) => {
          const o = {week, n: shots.length};
          ['carry', 'total', 'ball', 'club', 'smash', 'launch', 'spin', 'descent'].forEach((k) => { const st = statOf(shots, k); o[k] = st.v; o[k + '_sd'] = st.sd; o[k + '_n'] = st.n; });
          if (sea) { const f = seaRatio(shots); if (isNum(o.carry)) o.carry *= f; if (isNum(o.carry_sd)) o.carry_sd *= f; }
          return o;
        }) : [];
        const t = targets.find((r) => r.key === pick.key), last = weeks[weeks.length - 1];
        const w = t && t.w ? t.w : windowsFor({key: pick.key}, last ? last.club : null, last ? last.ball : null, wins);
        return {mode: 'club', key: pick.key, name: pick.name, sea, weeks, w, shots: weeks.reduce((a, x) => a + x.n, 0)};
      }
      const allWeeks = [...new Set([...by.values()].flatMap((g) => [...g.weeks.keys()]))].sort((a, b) => a - b).slice(-WEEKS);
      const clubs = [...by.values()].sort((a, b) => a.order - b.order).map((g) => ({key: g.key, name: g.name, cells: allWeeks.map((wk) => {
        const shots = g.weeks.get(wk);
        if (!shots) return null;
        const st = statOf(shots, 'carry');
        return st.n ? {v: st.v * (sea ? seaRatio(shots) : 1), n: st.n} : null;
      })})).filter((c) => c.cells.some(Boolean));
      return {mode: 'all', sea, weeks: allWeeks, clubs};
    },
  });

  /* One small chart: a week's average, its spread, and the club's window (a band) or floor (a dashed line). */
  function miniChart(box, pts, m, band, floor) {
    box.replaceChildren();
    chartTable(box, null);
    if (!pts.length) { box.append(el('p', 'wb-sub', 'No shots with this reading in the date range.')); return; }
    chartTable(box, m.label + ' by week', ['Week', m.label + (m.unit ? ' (' + m.unit + ')' : ''), 'Spread ±', 'Shots'], pts.map((r) => [WB.wk(r.week), rd(r.v, m.d), rd(r.sd, m.d), r.n]));
    const sdOf = (r) => (isNum(r.sd) ? r.sd : 0);
    let vals = pts.flatMap((r) => [r.v - sdOf(r), r.v + sdOf(r)]);
    if (band) vals = vals.concat(band);
    if (isNum(floor)) vals.push(floor);
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.02 || 1;
    const W = Math.max(200, box.clientWidth || 280), H = 150, mt = 8, mb = 22;
    const y = d3.scaleLinear().domain([lo - pad, hi + pad]).range([H - mb, mt]).nice(4);
    const svg = d3.select(box).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', m.label + ' by week');
    const yf = m.d === 0 ? d3.format(',.0f') : m.d === 2 ? d3.format('.2f') : d3.format('.1f');
    const yAxis = svg.append('g').attr('class', 'wb-axis').call(d3.axisLeft(y).ticks(3).tickSizeOuter(0).tickFormat(yf));
    let ml = 8;
    yAxis.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength() + 10); });
    yAxis.attr('transform', `translate(${ml},0)`);
    const w0 = pts[0].week, w1 = pts[pts.length - 1].week;
    const x = d3.scaleLinear().domain(w0 === w1 ? [w0 - 1, w1 + 1] : [w0 - 0.5, w1 + 0.5]).range([ml + 4, W - 6]);
    svg.insert('g', ':first-child').attr('class', 'wb-grid-line').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(3).tickSize(-(W - ml - 6)).tickFormat(''));
    if (band) svg.append('rect').attr('x', ml).attr('width', W - ml - 6).attr('y', y(band[1])).attr('height', Math.max(0, y(band[0]) - y(band[1]))).style('fill', 'var(--cds-chart-muted)').style('fill-opacity', 0.4);
    if (isNum(floor)) svg.append('line').attr('x1', ml).attr('x2', W - 6).attr('y1', y(floor)).attr('y2', y(floor)).style('stroke', dash.colors[1]).style('stroke-width', 1.5).style('stroke-dasharray', '4 3');
    svg.append('g').attr('class', 'wb-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickValues(weekTicks(x, pts.map((r) => r.week), 30)).tickFormat((wk) => WB.wk(wk)).tickSizeOuter(0));
    svg.append('g').selectAll('line').data(pts.filter((r) => sdOf(r) > 0)).join('line').attr('x1', (r) => x(r.week)).attr('x2', (r) => x(r.week)).attr('y1', (r) => y(r.v - sdOf(r))).attr('y2', (r) => y(r.v + sdOf(r))).style('stroke', dash.colors[0]).style('stroke-opacity', 0.3).style('stroke-width', 8).style('stroke-linecap', 'round');
    if (pts.length > 1) svg.append('path').datum(pts).attr('d', d3.line().x((r) => x(r.week)).y((r) => y(r.v))).style('fill', 'none').style('stroke', dash.colors[0]).style('stroke-width', 2);
    svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (r) => x(r.week)).attr('cy', (r) => y(r.v)).attr('r', 4.5)
      .style('fill', (r) => (r.n < THIN ? 'var(--color-panel)' : dash.colors[0])).style('stroke', (r) => (r.n < THIN ? dash.colors[0] : 'var(--color-panel)')).style('stroke-width', 2);
    const tip = d3.select(box).append('div').attr('class', 'wb-tip').style('display', 'none');
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H).style('fill', 'transparent')
      .on('pointermove pointerenter', (event) => {
        const [mx, my] = d3.pointer(event);
        const r = pts.find((q) => q.week === Math.round(x.invert(mx)));
        if (!r) { tip.style('display', 'none'); return; }
        tip.style('display', null).html('');
        tip.append('div').text('Week ' + WB.wk(r.week) + ' · ' + r.n + ' shot' + (r.n === 1 ? '' : 's'));
        tip.append('div').append('span').text(withUnit(fmtD(r.v, m.d), m.unit) + (sdOf(r) ? ' ± ' + fmtD(sdOf(r), m.d) : ''));
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, mx + 10), W - tw) + 'px').style('top', Math.max(0, my - 36) + 'px');
      })
      .on('pointerleave', () => tip.style('display', 'none'));
  }

  dash.draw('clubtrend', (box) => {
    box.replaceChildren();
    if (!WB.golfer()) return;
    const d = dash.data('clubweeks');
    if (d.status !== 'ok') { box.append(el('p', 'wb-note', loadingText(d.status, 'Club trends'))); return; }
    const t = d.data;
    if (t.mode === 'all') {
      if (!t.clubs.length) { box.append(el('p', 'wb-note', 'No imported sessions in this date range.')); return; }
      box.append(el('p', 'wb-note', `Average carry${t.sea ? ' at sea level' : ''} by week, for the last ${t.weeks.length} week${t.weeks.length === 1 ? '' : 's'} with shots in the date range. Grey numbers come from fewer than ${THIN} shots. Pick a club in Club at the top for its smash, launch, spin and descent against its windows.`));
      const wrap = el('div', 'wb-scroll'), tbl = el('table', 'wb-table wb-cheat');
      const cap = el('caption', 'wb-vh', 'Average carry by club and week (yd)'); tbl.append(cap);
      const hr = tbl.createTHead().insertRow();
      ['Club'].concat(t.weeks.map((wk) => 'Wk ' + WB.wk(wk)), [t.weeks.length > 1 ? 'Change' : '']).forEach((h, k) => { const th = el('th', k === 0 ? 'wb-l' : '', h); th.scope = 'col'; hr.append(th); });
      const tb = tbl.createTBody();
      t.clubs.forEach((c) => {
        const tr = tb.insertRow();
        const b = el('button', 'wb-crumb', c.name); b.type = 'button'; b.title = 'Show ' + c.name + ' week by week';
        b.addEventListener('click', () => dash.setParams({club: c.key}));
        const th = el('th', 'wb-l'); th.scope = 'row'; th.append(b); tr.append(th);
        c.cells.forEach((x) => { const td = tr.insertCell(); if (!x) { td.textContent = '—'; return; } td.textContent = Math.round(x.v); td.title = x.n + ' shot' + (x.n === 1 ? '' : 's'); if (x.n < THIN) td.className = 'thin'; });
        const ok = c.cells.filter((x) => x && x.n >= THIN), td = tr.insertCell();
        if (t.weeks.length > 1 && ok.length > 1) { const ch = Math.round(ok[ok.length - 1].v - ok[0].v); td.textContent = (ch > 0 ? '+' : ch < 0 ? '−' : '') + Math.abs(ch) + ' yd'; td.className = ch > 0 ? 'wb-up' : ch < 0 ? 'wb-dn' : ''; }
      });
      wrap.append(tbl); box.append(wrap);
      return;
    }
    const w = t.w;
    const head = el('p', 'wb-note');
    head.textContent = !t.weeks.length ? `No ${t.name} shots in this date range.` : `${t.name}: ${t.shots} shot${t.shots === 1 ? '' : 's'} over ${t.weeks.length} week${t.weeks.length === 1 ? '' : 's'}. ` +
      (!w ? 'There is no tour row for this club, so there are no windows.' : w.driver ? 'Windows from the driver dashboard.' : `Windows from the LPGA ${w.ref.row} row${isNum(w.f) ? ` at ${Math.round(w.f * 100)}% of the tour’s club speed` : ''}.`) +
      ' Hollow points come from fewer than ' + THIN + ' shots.';
    const back = el('button', 'wb-btn wb-btn-sm', 'Show all clubs'); back.type = 'button'; back.addEventListener('click', () => dash.setParams({club: 'all'}));
    const bar = el('div', 'wb-actions'); bar.append(back);
    box.append(head, bar);
    if (!t.weeks.length) return;
    const M = [
      {k: 'carry', label: t.sea ? 'Carry at sea level' : 'Carry', unit: 'yd', d: 0},
      {k: 'ball', label: 'Ball speed', unit: 'mph', d: 1},
      {k: 'smash', label: 'Smash', unit: '', d: 2, floor: w ? w.smash : null},
      {k: 'launch', label: 'Launch', unit: '°', d: 1, band: w ? w.launch : null},
      {k: 'spin', label: 'Spin', unit: 'rpm', d: 0, band: w ? w.spin : null},
      {k: 'descent', label: 'Descent', unit: '°', d: 1, floor: w ? w.land : null},
    ];
    const grid = el('div', 'wb-trends wb-cmode'), todo = [];
    box.append(grid);
    M.forEach((m) => {
      const pts = t.weeks.filter((r) => isNum(r[m.k])).map((r) => ({week: r.week, v: r[m.k], sd: r[m.k + '_sd'], n: r[m.k + '_n']}));
      const card = el('div', 'wb-card wb-trend'), hd = el('div', 'wb-trend-head');
      hd.append(el('h3', '', m.label + (m.unit && m.unit !== '°' ? ' (' + m.unit + ')' : '')));
      const now = el('span', 'wb-trend-now');
      if (pts.length) {
        const last = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null;
        now.append(el('span', 'wb-trend-val', withUnit(fmtD(last.v, m.d), m.unit === '°' ? '°' : '')));
        const lo = m.band ? m.band[0] : m.floor, hi = m.band ? m.band[1] : null, st = status(shown(last.v, m.d), lo, hi);
        if (st) now.append(el('span', 'wb-chip ' + LEVEL[st], m.k === 'descent' && st === 'low' ? 'Flat' : WORD[st]));
        if (prev) now.append(el('span', 'wb-sub', ' ' + F.sg(last.v - prev.v, m.d) + ' vs wk ' + WB.wk(prev.week)));
      }
      hd.append(now);
      const chart = el('div', 'wb-chartbox wb-mini');
      card.append(hd, chart);
      if (pts.length && (m.band || isNum(m.floor))) card.append(el('p', 'wb-sub', m.band ? `Window ${fmtD(m.band[0], m.d)}–${fmtD(m.band[1], m.d)}${m.unit === '°' ? '°' : m.unit ? ' ' + m.unit : ''}` : `At least ${fmtD(m.floor, Number.isInteger(m.floor) ? 0 : m.d)}${m.unit === '°' ? '°' : ''} (dashed)`));
      grid.append(card);
      todo.push([chart, pts, m]);
    });
    /* Draw once every card is in the grid, so each chart is sized to its own card. */
    todo.forEach(([chart, pts, m]) => miniChart(chart, pts, m, m.band, m.floor));
  });
})();
