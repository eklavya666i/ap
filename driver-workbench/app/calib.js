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
})();
