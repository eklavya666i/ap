/* Finding headlines (design package v1.1 §3): each of the seven older views leads with its computed finding and a
   one-line sub instead of its name. The four lab views (Ball flight, Swing and strike, Partial shots, Drill studio) draw
   their own. A view without enough data says so. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const GOAL = 260;
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const day = (d) => d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
  const ok = (name) => { const d = dash.data(name); return d.status === 'ok' ? d.data : null; };

  /* The last two weeks' counted drives, as the goal tracker uses them. */
  function lastTwo() {
    const ws = ok('csvweeks');
    if (!ws || !ws.length) return [];
    const top = ws[ws.length - 1].week;
    return ws.filter((w) => w.week > top - 2).flatMap((w) => w.pts.filter((q) => q.used));
  }
  /* Strike (smash to 1.48 at the same club speed), launch and spin (the model's best window at that ball speed) and
     speed (the rest of the gap), each as model yards at sea level, firmness 3. */
  function levers(gap) {
    const pts = lastTwo(), avg = (k) => mean(pts.map((q) => q[k]).filter(isNum));
    const cs = avg('club_speed'), bs = avg('ball_speed'), la = avg('launch'), sp = avg('spin');
    if (![cs, bs, la, sp].every(isNum) || typeof BF !== 'object') return null;
    const std = {alt: 0, temp: 75, turf: 'normal'}, shot = WB.fitShot || BF.shot, aoa = Number(dash.params().aoa) || 0;
    const now = shot(bs, la, sp, std).total, bs2 = Math.max(bs, cs * 1.48);
    const strike = Math.max(0, shot(bs2, la, sp, std).total - now);
    const b = BF.best(bs2, cs, aoa, std);
    const launch = b ? Math.max(0, shot(bs2, b.launch, b.spin, std).total - now - strike) : 0;
    return {strike, launch, speed: Math.max(0, gap - strike - launch)};
  }
  WB.levers = levers;
  function lastDate() {
    const im = ok('imports');
    const ds = (im || []).map((i) => i.date).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x || '')).sort();
    return ds.length ? ds[ds.length - 1] : null;
  }

  const HEADS = {
    command() {
      const q = ok('goals');
      if (!q || q.median === null) return null;
      if (q.gap <= 0) return {title: `${Math.round(q.median)} yards: 260 is reached`, sub: `Median standard total from ${q.n} drives in the last two weeks, restated at sea level and firmness 3.`};
      const L = levers(q.gap), NAME = {strike: 'strike', launch: 'launch and spin', speed: 'speed'};
      const top = L ? Object.keys(L).sort((a, b) => L[b] - L[a])[0] : null;
      const tr = ok('trust'), spinPending = tr && tr.spin !== 'ok';
      return {
        title: `${Math.round(q.gap)} yards to 260` + (top ? `, and ${NAME[top]} is most of the gap` : ''),
        sub: `Median standard total ${Math.round(q.median)} yards from ${q.n} drives in the last two weeks${q.provisional ? ', provisional under 30 drives' : ''}.` +
          (L ? ` Strike to a 1.48 smash: +${Math.round(L.strike)}; best launch and spin: +${Math.round(L.launch)}${spinPending ? ' (estimated until the spin check passes)' : ''}; speed: the other ${Math.round(L.speed)}.` : ''),
      };
    },
    progress() {
      const q = ok('goals');
      if (!q || q.median === null) return null;
      if (!isNum(q.slope)) return {title: `${Math.round(q.median)} yards now; the trend needs four weeks of 5 drives or more`, sub: 'Median standard total of the last two weeks. The trend is Theil–Sen on weekly medians.'};
      const s = q.series.slice(-8), span = s[s.length - 1][0] - s[0][0], ch = q.slope * span;
      const t1 = Math.abs(ch) < 0.5 ? `Level over ${span} weeks` : `${ch > 0 ? 'Up' : 'Down'} ${Math.abs(Math.round(ch))} yards in ${span} weeks`;
      let t2 = '260 is not on this trend yet';
      if (q.median >= GOAL) t2 = '260 is reached';
      else if (q.eta) { const ld = lastDate(); if (ld) { const d = new Date(ld + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + q.eta * 7); t2 = `260 arrives around ${day(d)} on this trend`; } else t2 = `260 is about ${q.eta} weeks away on this trend`; }
      return {title: `${t1}; ${t2}`, sub: `Theil–Sen trend on weekly medians, weeks with 5 or more drives: ${q.slope >= 0 ? '+' : '−'}${Math.abs(q.slope).toFixed(1)} yards a week, restated at sea level and firmness 3.`};
    },
    driver() {
      const q = ok('goals'), g = WB.golfer();
      if (!q || !g) return null;
      const now = median(lastTwo().map((p) => p.ball_speed).filter(isNum));
      if (!isNum(now)) return null;
      return {title: `260 needs about ${Math.round(q.speedFor * q.smT)} mph of ball speed; ${g.name} is at ${Math.round(now)}`,
        sub: `From the flight model at the best launch and spin, sea level and firmness 3: about ${q.speedFor.toFixed(1)} mph of club speed at a ${q.smT.toFixed(2)} smash. Now is the median ball speed of the last two weeks.`};
    },
    bag() {
      const b = ok('bag');
      if (!b) return null;
      const cl = b.clubs.filter((c) => isNum(c.carry) && c.n_used >= 3).sort((x, y) => x.order - y.order);
      if (!cl.length) return null;
      if (cl.length < 2) return {title: `Only the ${cl[0].name.toLowerCase().replace(/^pw$/, 'pitching wedge')} has enough shots to place in the bag`, sub: 'Carry gaps need two clubs or more with 3 counted shots each in these sessions.'};
      const gaps = cl.slice(1).map((c, i) => ({a: cl[i], b: c, d: cl[i].carry - c.carry}));
      const over = gaps.filter((x) => x.d < 7).sort((x, y) => x.d - y.d)[0], hole = gaps.filter((x) => x.d > 18).sort((x, y) => y.d - x.d)[0];
      const sub = `Average carry by club over ${b.sessions} session${b.sessions === 1 ? '' : 's'}; under 7 yards apart is an overlap, over 18 is a hole.`;
      if (over) return {title: `${over.a.name} and ${over.b.name} overlap: ${Math.round(over.d)} yards of carry apart`, sub};
      if (hole) return {title: `${hole.a.name} to ${hole.b.name} leaves a ${Math.round(hole.d)}-yard carry hole`, sub};
      return {title: 'Every carry gap sits between 7 and 18 yards', sub};
    },
    calib() {
      const rows = ok('spincheck');
      if (!rows || !rows.length) return null;
      const dr = rows.find((r) => r.club === 'Driver');
      if (dr && dr.spin < dr.lo) return {title: `Driver spin reads ${Math.round(((dr.lo - dr.spin) / dr.lo) * 100)}% under its typical band, so carry isn’t trusted yet`, sub: `Median ${Math.round(dr.spin).toLocaleString('en-US')} rpm from ${dr.n} drives, against ${Math.round(dr.lo).toLocaleString('en-US')}–${Math.round(dr.hi).toLocaleString('en-US')} rpm. The four-step check is below.`};
      const off = rows.filter((r) => r.reads !== 'In band');
      if (off.length) return {title: `${off[0].club} spin reads ${off[0].reads.toLowerCase()} against its typical band`, sub: `Median ${Math.round(off[0].spin).toLocaleString('en-US')} rpm from ${off[0].n} shots, against ${Math.round(off[0].lo).toLocaleString('en-US')}–${Math.round(off[0].hi).toLocaleString('en-US')} rpm.`};
      return {title: 'Spin reads inside its typical band for every club', sub: 'Drift against the 7-iron needs outdoor laser checks, which come later.'};
    },
    rounds() {
      const g = WB.golfer();
      return g && typeof WB.roundFinding === 'function' ? WB.roundFinding(g) : null;
    },
    data() {
      const im = ok('imports_all');
      if (!im) return null;
      let total = 0, kept = 0;
      im.forEach((i) => {
        const ix = {};
        i.cols.forEach((c, k) => { ix[c] = k + 1; });
        i.arows.forEach((r) => {
          total++;
          const info = clubInfo(r[0]);
          if (!info) return;
          const get = (c) => (ix[c] === undefined || !isNum(r[ix[c]]) ? null : r[ix[c]]);
          if (shotOk({club: get('club_speed'), ball: get('ball_speed'), launch: get('launch'), spin: get('spin'), carry: get('carry')}, info.cat)) kept++;
        });
      });
      if (!total) return {title: 'No shots stored yet', sub: 'Drop GSPro exports on the import station.'};
      return {title: `${total.toLocaleString('en-US')} shots stored; ${(total - kept).toLocaleString('en-US')} flagged and kept out of the stats`, sub: `${im.length} session${im.length === 1 ? '' : 's'}. Flagged shots look like misreads or tops for their club; they stay stored and show in the shot list.`};
    },
  };
  WB.viewHeadline = (v) => { const f = HEADS[v || WB.view()]; if (!f) return null; try { return f(); } catch (e) { return null; } };

  dash.draw('viewhead', (box) => {
    box.replaceChildren();
    const v = WB.view();
    if (!WB.golfer() || v === 'all') return;
    if (!HEADS[v]) { box.append(el('h1', 'ph-vh-sr', WB.viewName(v))); return; }
    const h = WB.viewHeadline(v);
    box.append(el('h1', 'ph-h', h ? h.title : WB.viewName(v)));
    box.append(el('p', 'ph-sub', h ? h.sub : 'No shots match this selection. Widen the range or session filter.'));
  });
})();
