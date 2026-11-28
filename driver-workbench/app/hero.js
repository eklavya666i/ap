/* Command center hero (design package v1.1 §3, backlog b64): the range scene of the last two weeks' stock drives with
   the hero figure, the figures row (in the corridor, long and straight, ball speed, club speed, smash: this week, the
   change on last week and 8 weekly points) and the Path-to-260 ruler (strike, launch and spin, speed). */
(function () {
  'use strict';
  if (!window.WB || !window.dash || !window.LAB) return;
  const GOAL = 260, LONG = 250, MAXN = 40, NS = 'http://www.w3.org/2000/svg';
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const icon = (n, cls) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'ic' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#i-' + n); s.append(u); return s; };
  /* Stock drives: the driver, counted, a full swing and not inside a drill block. */
  const stock = (s) => s.key === 'dr' && s.used && Number.isInteger(s.week) && (!s.swing || s.swing === 'Full') && !s.drill;

  dash.calc('herodata', {
    inputs: ['labshots', 'goals'],
    fn: (shots, goals) => {
      const p = dash.params(), half = (Number(p.corridor) || 30) / 2;
      const dr = shots.filter(stock);
      if (!dr.length) return null;
      const top = Math.max(...dr.map((s) => s.week));
      const recent = dr.filter((s) => s.week > top - 2).sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.sid).localeCompare(String(b.sid)) || a.k - b.k).slice(-MAXN);
      const ratio = new Map(((goals && goals.weeks) || []).map((w) => [w.week, w.ratio]));
      const weeks = [...new Set(dr.map((s) => s.week))].sort((a, b) => a - b).slice(-8).map((wk) => {
        const s = dr.filter((x) => x.week === wk), off = s.filter((x) => isNum(x.offline)), r = ratio.get(wk);
        const avg = (k) => mean(s.map((x) => x[k]).filter(isNum));
        return {week: wk, n: s.length,
          corridor: off.length ? off.filter((x) => Math.abs(x.offline) <= half).length / off.length : null,
          long: off.length && isNum(r) ? off.filter((x) => isNum(x.total) && x.total * r >= LONG && Math.abs(x.offline) <= half).length / off.length : null,
          ball: avg('ball_speed'), club: avg('club_speed'), smash: avg('smash')};
      });
      return {recent, half, weeks};
    },
  });

  function spark(vals) {
    const pts = vals.map((v, i) => [i, v]).filter((q) => isNum(q[1]));
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ph-spark'); svg.setAttribute('viewBox', '0 0 100 26'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    if (pts.length < 2) return svg;
    const lo = Math.min(...pts.map((q) => q[1])), hi = Math.max(...pts.map((q) => q[1])), n = vals.length - 1 || 1;
    const X = (i) => 2 + (i / n) * 96, Y = (v) => (hi === lo ? 13 : 23 - ((v - lo) / (hi - lo)) * 20);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', pts.map((q, k) => (k ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1)).join(' '));
    path.setAttribute('class', 'ph-spark-line'); path.setAttribute('vector-effect', 'non-scaling-stroke');
    const last = pts[pts.length - 1], dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', X(last[0])); dot.setAttribute('cy', Y(last[1])); dot.setAttribute('r', 2.2); dot.setAttribute('class', 'ph-spark-dot');
    svg.append(path, dot);
    return svg;
  }
  /* One figure: label, value with unit, the change on last week as an arrow and a word, and the 8-week sparkline. */
  function figure(label, vals, fmt, unit, d, better) {
    const c = el('div', 'ph-fig'), now = vals.length ? vals[vals.length - 1] : null, prev = vals.length > 1 ? vals[vals.length - 2] : null;
    c.append(el('div', 'ph-fl', label));
    const v = el('div', 'ph-fv', isNum(now) ? fmt(now) : '—');
    if (unit && isNum(now)) v.append(el('small', '', unit));
    c.append(v);
    const ch = el('div', 'ph-fd');
    if (isNum(now) && isNum(prev)) {
      const dv = now - prev, flat = Math.abs(dv) < Math.pow(10, -d) / 2;
      if (flat) ch.append('Level on last week');
      else {
        const up = dv > 0, good = better === 'up' ? up : !up;
        ch.className = 'ph-fd ' + (good ? 'up' : 'dn');
        ch.append(icon(up ? 'up' : 'down', 'sm'), ` ${up ? 'Up' : 'Down'} ${fmt(Math.abs(dv))}${unit === '%' ? ' pts' : unit ? ' ' + unit : ''} on last week`);
      }
    } else ch.append(isNum(now) ? 'First week with data' : 'No data this week');
    c.append(ch, spark(vals));
    return c;
  }

  dash.draw('hero', (box) => {
    LAB.reset(box);
    const g = WB.golfer();
    if (!g) return;
    const d = dash.data('herodata'), q = dash.data('goals');
    if (d.status !== 'ok') { box.append(el('p', 'wb-note', d.status === 'loading' ? 'Loading…' : 'The range scene couldn’t be drawn.')); return; }
    if (!d.data) { box.append(el('p', 'wb-note', 'No shots match this selection. Widen the range or session filter.')); return; }
    const t = d.data, goals = q.status === 'ok' ? q.data : null;
    const list = t.recent.map((s) => ({s, t: LAB.traj(s)})).filter((x) => x.t);
    const scene = el('div', 'wb-card ph-scene');
    const hf = el('div', 'ph-hero');
    if (goals && goals.median !== null) {
      const fv = el('div', 'ph-hv', String(Math.round(goals.median)));
      fv.append(el('small', '', 'yds'));
      hf.append(el('div', 'ph-hl', 'Median standard total, last two weeks'), fv);
      const dv = isNum(goals.prevMedian) ? goals.median - goals.prevMedian : null;
      hf.append(el('div', 'ph-hs', `${goals.n} drive${goals.n === 1 ? '' : 's'}${goals.provisional ? ', provisional' : ''}` + (isNum(dv) ? ` · ${dv >= 0.5 ? '+' : dv <= -0.5 ? '−' : '±'}${Math.abs(Math.round(dv))} on the two weeks before` : '')));
    }
    scene.append(hf);
    const inn = list.filter((x) => isNum(x.s.offline) && Math.abs(x.s.offline) <= t.half).length;
    LAB.fig(scene, window.innerWidth < 600 ? 300 : 400, `The last ${list.length} stock drives on a night range`, (W, H) => LAB.scene(W, H, list.map((x) => ({
      t: x.t, col: isNum(x.s.offline) && Math.abs(x.s.offline) <= t.half ? '#338ced' : '#e76624', op: 0.85, wd: 2.2,
      title: `${x.s.date || ''} · carry ${Math.round(x.s.carry)} · total ${isNum(x.s.total) ? Math.round(x.s.total) : '—'} · ${isNum(x.s.offline) ? Math.abs(Math.round(x.s.offline)) + (x.s.offline < 0 ? ' left' : ' right') : ''}`,
      act: x.s.sid + ':' + x.s.k,
    })), {goal: GOAL, half: t.half}), 'ph-scene-fig');
    const lg = el('p', 'ph-scene-key');
    lg.append(el('i', 'ph-k sky'), `Inside the ${t.half * 2}-yard corridor: ${inn}`, el('i', 'ph-k coral'), `Missed it: ${list.length - inn}`, el('span', 'wb-sub', ' · tracers drawn through GSPro’s launch, peak height, descent, carry and offline · tap one to open the shot'));
    scene.append(lg);
    box.append(scene);
    if (typeof LAB.wireShots === 'function') LAB.wireShots(scene);

    const W = t.weeks, row = el('div', 'ph-figs');
    row.append(
      figure('In the corridor', W.map((w) => (isNum(w.corridor) ? w.corridor * 100 : null)), (v) => String(Math.round(v)), '%', 0, 'up'),
      figure('Long and straight', W.map((w) => (isNum(w.long) ? w.long * 100 : null)), (v) => String(Math.round(v)), '%', 0, 'up'),
      figure('Ball speed', W.map((w) => w.ball), (v) => v.toFixed(1), 'mph', 1, 'up'),
      figure('Club speed', W.map((w) => w.club), (v) => v.toFixed(1), 'mph', 1, 'up'),
      figure('Smash', W.map((w) => w.smash), (v) => v.toFixed(2), '', 2, 'up'));
    box.append(row);
    box.append(el('p', 'wb-sub ph-figs-note', `This week against last week, from stock drives (full swings outside drill blocks). Long and straight: ${LONG} yards or more restated at sea level, inside the corridor. Lines: up to 8 weeks.`));
  });

  /* The Path-to-260 ruler: now, then each lever's model yards, and the flag at 260. */
  dash.draw('ruler', (box) => {
    box.replaceChildren();
    const q = dash.data('goals');
    if (q.status !== 'ok' || !q.data || q.data.median === null || !WB.golfer()) { box.append(el('p', 'wb-note', 'The path to 260 needs driver totals from GSPro.')); return; }
    const g = q.data, now = g.median;
    if (now >= GOAL) { box.append(el('p', 'wb-callout', `${Math.round(now)} yards: 260 is reached.`)); return; }
    const L = typeof WB.levers === 'function' ? WB.levers(g.gap) : null;
    if (!L) { box.append(el('p', 'wb-note', 'The levers need club speed, ball speed, launch and spin on the last two weeks’ drives.')); return; }
    const tr = dash.data('trust'), spinPending = tr.status === 'ok' && tr.data && tr.data.spin !== 'ok';
    const lo = Math.floor((now - 45) / 10) * 10, hi = Math.max(GOAL + 10, Math.ceil((now + L.strike + L.launch + L.speed + 5) / 10) * 10);
    const X = (v) => ((v - lo) / (hi - lo)) * 100;
    const track = el('div', 'ph-rtrack');
    track.setAttribute('role', 'img');
    track.setAttribute('aria-label', `Now ${Math.round(now)} yards; strike +${Math.round(L.strike)}, launch and spin +${Math.round(L.launch)}, speed +${Math.round(L.speed)}; 260 at the flag.`);
    const seg = (cls, a, b, text) => { const s = el('div', 'ph-rseg ' + cls); s.style.left = X(a) + '%'; s.style.width = Math.max(0, X(b) - X(a)) + '%'; if (text) s.append(el('span', '', text)); track.append(s); };
    seg('now', lo, now, `Now ${Math.round(now)}`);
    let at = now;
    [['strike', L.strike], ['launch' + (spinPending ? ' dash' : ''), L.launch], ['speed', L.speed]].forEach(([cls, v]) => {
      if (v >= 0.5) { seg(cls, at, at + v, `+${Math.round(v)}`); at += v; }
    });
    const flag = el('div', 'ph-rflag');
    flag.style.left = X(GOAL) + '%';
    flag.append(icon('flag', 'sm'), el('span', '', String(GOAL)));
    track.append(flag);
    const scale = el('div', 'ph-rscale');
    for (let v = lo; v <= hi; v += 10) { const t = el('span', '', String(v)); t.style.left = X(v) + '%'; scale.append(t); }
    box.append(track, scale);
    const ul = el('ul', 'ph-rlegend');
    const item = (cls, title, yards, text) => { const li = el('li'); li.append(el('i', 'ph-k ' + cls), el('b', '', `${title}: +${Math.round(yards)} yds`), ' ' + text); ul.append(li); };
    item('strike', 'Strike', L.strike, 'Smash to 1.48 at the same club speed, same launch and spin.');
    item('launch' + (spinPending ? ' dash' : ''), 'Launch and spin', L.launch, 'The flight model’s best window at that ball speed.' + (spinPending ? ' Dashed: estimated until the spin check passes.' : ''));
    item('speed', 'Speed', L.speed, `The rest of the gap: about ${g.speedFor.toFixed(1)} mph of club speed at a ${g.smT.toFixed(2)} smash reaches ${GOAL}.`);
    box.append(ul);
    box.append(el('p', 'wb-sub', `Now is the median standard total of the last two weeks (${g.n} drives). Yards come from the flight model fitted to GSPro, at sea level and firmness 3.`));
  });
})();
