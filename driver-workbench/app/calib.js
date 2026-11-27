/* Calibration lab (FR-13): the spin check (FR-27 in the dashboards spec v0.4). Median reported spin per club against
   a typical band, how much carry and total that difference moves on the workbench's flight model, and the steps to check. */
(function () {
  'use strict';
  if (!window.WB || !window.dash || typeof BF !== 'object') return;
  /* Typical bands: about the LPGA Tour averages (TrackMan) ±15%. Approximate, for spotting readings far outside. */
  const AVG = {dr: 2611, w3: 2704, w5: 4501, h: 4693, i4: 4801, i5: 5081, i6: 5943, i7: 6699, i8: 7494, i9: 7589, pw: 8403, wedge: 9500};
  function bandKey(info) {
    if (!info) return null;
    const k = info.key;
    if (k === 'dr') return 'dr';
    if (/^w[23]$/.test(k)) return 'w3';
    if (/^w\d$/.test(k)) return 'w5';
    if (/^h\d$/.test(k)) return 'h';
    if (/^i[1-4]$/.test(k)) return 'i4';
    if (/^i[5-9]$/.test(k)) return k;
    if (k === 'pw') return 'pw';
    if (info.cat === 'wedge') return 'wedge';
    return null;
  }
  const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  dash.calc('spincheck', {
    inputs: ['imports'],
    fn: (imports) => {
      const c = WB.conditions(), cond = {alt: c.altitude_ft, temp: c.temp_f, turf: ['soft', 'soft', 'normal', 'firm', 'baked'][(c.firmness || 3) - 1] || 'normal'};
      const by = new Map();
      imports.forEach((s) => {
        const bi = s.cols.indexOf('ball_speed'), ci = s.cols.indexOf('club_speed'), li = s.cols.indexOf('launch'), si = s.cols.indexOf('spin');
        if (bi < 0 || li < 0 || si < 0) return;
        s.arows.forEach((r) => {
          const info = typeof clubInfo === 'function' ? clubInfo(r[0]) : null, key = bandKey(info);
          if (!key) return;
          const ball = r[bi + 1], club = ci < 0 ? null : r[ci + 1], la = r[li + 1], sp = r[si + 1];
          if (typeof ball !== 'number' || typeof la !== 'number' || typeof sp !== 'number' || sp <= 0) return;
          const lim = typeof CLUB_LIMITS === 'object' ? CLUB_LIMITS[info.cat] : null;
          if (lim && typeof club === 'number' && club > 0 && (ball / club < lim.sm[0] || ball / club > lim.sm[1])) return;
          const g = by.get(info.name) || {name: info.name, order: info.order, key, ball: [], la: [], sp: []};
          g.ball.push(ball); g.la.push(la); g.sp.push(sp); by.set(info.name, g);
        });
      });
      const rows = [...by.values()].filter((g) => g.sp.length >= 5).sort((a, b) => a.order - b.order).map((g) => {
        const avg = AVG[g.key], lo = avg * 0.85, hi = avg * 1.15, sp = med(g.sp), bs = med(g.ball), la = med(g.la);
        const base = BF.shot(bs, la, sp, cond), typ = BF.shot(bs, la, avg, cond);
        return {club: g.name, n: g.sp.length, spin: sp, lo, hi, reads: sp < lo ? 'Low' : sp > hi ? 'High' : 'In band', dCarry: base.carry - typ.carry, dTotal: base.total - typ.total};
      });
      return rows;
    },
  });

  dash.draw('spincheck', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) return;
    const d = dash.data('spincheck');
    if (d.status !== 'ok') { box.append(el('p', 'wb-note', d.status === 'loading' ? 'Loading…' : 'The spin check couldn’t be worked out.')); return; }
    const rows = d.data;
    if (!rows.length) { box.append(el('p', 'wb-note', 'Import sessions with spin to run the spin check (five or more shots a club).')); return; }
    const low = rows.filter((r) => r.reads === 'Low');
    box.append(el('p', '', low.length ? `${g.name}'s reported spin is low on ${low.length} of ${rows.length} clubs. If the real spin is typical, carry and total for those clubs are off by about the shifts below. The shifts come from the workbench's flight model, which isn't fitted to GSPro yet, so GSPro's own numbers may move differently.` : `${g.name}'s reported spin sits in the typical band on every club with enough shots.`));
    const wrap = el('div', 'wb-holes-wrap'), t = el('table', 'wb-table');
    const hr = t.createTHead().insertRow();
    ['Club', 'Shots', 'Median spin', 'Typical band', 'Reads', 'Carry shift', 'Total shift'].forEach((h) => { const th = el('th', '', h); th.scope = 'col'; hr.append(th); });
    const tb = t.createTBody();
    const yd = (v) => (Math.abs(v) < 0.5 ? '0 yd' : (v > 0 ? '+' : '−') + Math.abs(Math.round(v)) + ' yd');
    rows.forEach((r) => {
      const tr = tb.insertRow();
      [r.club, r.n, Math.round(r.spin).toLocaleString('en-US') + ' rpm', `${Math.round(r.lo / 50) * 50}–${Math.round(r.hi / 50) * 50}`, r.reads, yd(r.dCarry), yd(r.dTotal)].forEach((v) => { tr.insertCell().textContent = String(v); });
    });
    wrap.append(t);
    box.append(wrap, el('p', 'wb-note', 'Shift: how much farther (or shorter) the median shot goes with its reported spin than with a typical spin, on the workbench’s flight model at the GSPro conditions. Typical band: about the LPGA Tour average (TrackMan) ±15%; an approximate guide.'));
    const steps = el('ol', 'wb-cmd-list');
    ['Ball and lens: clean the lens, and use clean balls with the markings the monitor expects.',
      'Compare the spin the GOLFJOY app reports with GSPro’s for the same shots.',
      'Outdoors, on a calm day, laser the carry of 10 drives and compare it with GSPro’s carry at the same ball speed and launch (waiting for a good day on the range).',
      'If spin still reads low, fit the flight model to the outdoor carry and use it for the what-ifs.'].forEach((s) => steps.append(el('li', '', s)));
    box.append(el('h3', '', 'The check, step by step'), steps);
  });

  /* FR-31: fit the flight model to GSPro. The carry ratio (GSPro ÷ model) is fitted against spin by least squares over
     the golfer's drives in range; what-ifs then use the fitted carry. Spin outside the measured range is held at the edge. */
  let memo = {key: null, val: null};
  dash.calc('modelfit', {
    inputs: ['csvweeks'],
    fn: (csv) => {
      const c = WB.conditions(), g = WB.golfer(), pts = [];
      csv.forEach((w) => w.pts.forEach((p) => { if (p.used && ['ball_speed', 'launch', 'spin', 'carry'].every((k) => typeof p[k] === 'number') && p.carry > 50 && p.spin > 0) pts.push([p.ball_speed, p.launch, p.spin, p.carry, typeof w.alt === 'number' ? w.alt : c.altitude_ft]); }));
      if (pts.length < 20) return null;
      const step = Math.ceil(pts.length / 300), sample = pts.filter((_, i) => i % step === 0);
      const key = [g && g.id, sample.length, c.temp_f, c.altitude_ft, sample.slice(0, 4).join('|'), sample.slice(-4).join('|')].join(':');
      if (memo.key === key) return memo.val;
      const rows = sample.map(([bs, la, sp, carry, alt]) => { const m = BF.shot(bs, la, sp, {alt, temp: c.temp_f, turf: 'normal'}).carry; return {x: (sp - 1500) / 1000, sp, carry, m, r: carry / m}; }).filter((q) => q.m > 20 && isFinite(q.r));
      if (rows.length < 20) return null;
      const n = rows.length, mx = rows.reduce((t, q) => t + q.x, 0) / n, my = rows.reduce((t, q) => t + q.r, 0) / n;
      const sxx = rows.reduce((t, q) => t + (q.x - mx) * (q.x - mx), 0), b = sxx > 1e-6 ? rows.reduce((t, q) => t + (q.x - mx) * (q.r - my), 0) / sxx : 0, a = my - b * mx;
      const sps = rows.map((q) => q.sp).sort((u, v) => u - v), lo = sps[Math.floor(n * 0.05)], hi = sps[Math.ceil(n * 0.95) - 1];
      const k = (sp) => Math.max(0.6, Math.min(1.6, a + b * (Math.min(hi, Math.max(lo, sp)) - 1500) / 1000));
      const err0 = med(rows.map((q) => Math.abs(q.carry - q.m))), err1 = med(rows.map((q) => Math.abs(q.carry - q.m * k(q.sp)))), bias0 = med(rows.map((q) => q.carry - q.m));
      memo = {key, val: {a, b, lo, hi, n, err0, err1, bias0, k1500: k(1500), k2500: k(2500)}};
      return memo.val;
    },
  });
  WB.fitShot = function (bs, la, sp, cond) {
    const m = BF.shot(bs, la, sp, cond), d = dash.data('modelfit');
    if (d.status !== 'ok' || !d.data) return m;
    const f = d.data, s = Math.min(f.hi, Math.max(f.lo, sp)), k = Math.max(0.6, Math.min(1.6, f.a + f.b * (s - 1500) / 1000)), carry = m.carry * k;
    return Object.assign({}, m, {carry, total: m.total + (carry - m.carry), fitted: true});
  };
  dash.draw('modelfit', (box) => {
    box.replaceChildren();
    const g = WB.golfer(), d = dash.data('modelfit');
    if (!g || d.status !== 'ok') return;
    if (!d.data) { box.append(el('p', 'wb-note', 'The fit needs 20 or more drives with ball speed, launch, spin and carry in the date range.')); return; }
    const f = d.data, r = (v) => Math.round(v), x = (v) => '×' + v.toFixed(2);
    box.append(el('p', '', `Fitted on ${f.n} of ${g.name}'s drives. Before fitting, the model's carry was off by a median ${r(f.err0)} yd (GSPro ${f.bias0 >= 0 ? 'longer' : 'shorter'} by ${r(Math.abs(f.bias0))} yd); after fitting, ${r(f.err1)} yd.`));
    box.append(el('p', 'wb-note', `The correction is ${x(f.k1500)} at 1,500 rpm and ${x(f.k2500)} at 2,500 rpm; spin outside the measured ${r(f.lo).toLocaleString('en-US')}–${r(f.hi).toLocaleString('en-US')} rpm is held at the edge. The Realistic look and the goal tracker's speed for 260 use the fitted model. Once outdoor carry is measured (the spin check's step 3), the fit can move to outdoor carry.`));
  });
})();
