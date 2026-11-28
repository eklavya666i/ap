/* What's working and what isn't (backlog b26): patterns across a golfer's rounds, from hole-by-hole scores and the
   1–5 ratings: scoring by hole type and nine, round stats, ratings over time, the holes that cost the most on courses
   played more than once, what to work on from the notes, and how the driver on the range compares with the course. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const AREAS = [['driving', 'Driving'], ['approach', 'Approach'], ['short', 'Short game'], ['putting', 'Putting'], ['mental', 'Mental game']];
  const RECENT = 3, RECENT_R = 5;
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const pct = (v) => (isNum(v) ? Math.round(v * 100) + '%' : '—');
  const sg1 = (v) => (isNum(v) ? (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1) : '—');
  const scroll = (box, t) => { const w = el('div', 'wb-scroll'); w.append(t); box.append(w); };
  const fmtDay = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : d || ''; };

  /* The golfer's rounds in the date range (range or lesson entries are not rounds), newest first. */
  function roundsOf(g) {
    const rs = WB.roundsFor(g.id);
    if (rs === null) return null;
    const n = Number(dash.params().range);
    const cut = n > 0 ? new Date(Date.now() - n * 7 * 864e5).toISOString().slice(0, 10) : '';
    return rs.map((r) => Object.assign({id: r.id}, r.data || {})).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && d.kind !== 'Range or lesson' && d.date >= cut)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const holesOf = (r) => (Array.isArray(r.holes) ? r.holes : []).filter((h) => h && isNum(h.hole) && isNum(h.par) && isNum(h.score));

  /* Stats over a set of rounds: per-18 rates use the holes actually entered. */
  function stats(rounds) {
    const H = rounds.flatMap(holesOf);
    if (!H.length) return null;
    const per18 = (n) => (n * 18) / H.length;
    const fwy = H.filter((h) => h.par >= 4 && typeof h.fairway === 'boolean'), gir = H.filter((h) => typeof h.green === 'boolean');
    const missed = gir.filter((h) => h.green === false), putts = H.filter((h) => isNum(h.putts));
    const hitG = putts.filter((h) => h.green === true);
    return {
      holes: H.length, rounds: rounds.filter((r) => holesOf(r).length).length,
      toPar: per18(H.reduce((s, h) => s + h.score - h.par, 0)),
      fairways: fwy.length ? fwy.filter((h) => h.fairway).length / fwy.length : null, n_fwy: fwy.length,
      gir: gir.length ? gir.filter((h) => h.green).length / gir.length : null, n_gir: gir.length,
      updown: missed.length ? missed.filter((h) => h.score - h.par <= 0).length / missed.length : null, n_ud: missed.length,
      putts: putts.length ? (putts.reduce((s, h) => s + h.putts, 0) * 18) / putts.length : null,
      puttsGir: hitG.length ? avg(hitG.map((h) => h.putts)) : null,
      three: putts.length ? (putts.filter((h) => h.putts >= 3).length * 18) / putts.length : null,
      birdies: per18(H.filter((h) => h.score - h.par <= -1).length),
      doubles: per18(H.filter((h) => h.score - h.par >= 2).length),
    };
  }
  /* Average to par a hole by hole type and by nine. */
  function byType(rounds) {
    const out = [];
    const add = (label, hs) => { if (hs.length) out.push({label, n: hs.length, v: avg(hs.map((h) => h.score - h.par))}); };
    const H = rounds.flatMap(holesOf);
    [3, 4, 5].forEach((p) => add('Par ' + p + 's', H.filter((h) => h.par === p)));
    add('Front nine', H.filter((h) => h.hole <= 9));
    add('Back nine', H.filter((h) => h.hole >= 10));
    return out;
  }
  /* Holes on courses played two or more times, by average over par. */
  function costly(rounds) {
    const by = new Map();
    rounds.forEach((r) => {
      const c = String(r.course || '').trim();
      if (!c) return;
      holesOf(r).forEach((h) => { const k = c.toLowerCase() + '#' + h.hole; const g = by.get(k) || {course: c, hole: h.hole, par: h.par, v: [], putts: []}; g.v.push(h.score - h.par); if (isNum(h.putts)) g.putts.push(h.putts); by.set(k, g); });
    });
    return [...by.values()].filter((g) => g.v.length >= 2).map((g) => Object.assign(g, {avg: avg(g.v), n: g.v.length, puttsAvg: avg(g.putts)}))
      .filter((g) => g.avg >= 1).sort((a, b) => b.avg - a.avg || b.n - a.n).slice(0, 5);
  }
  function ratings(rounds) {
    const recent = rounds.slice(0, RECENT_R), before = rounds.slice(RECENT_R);
    const of = (rs, k) => avg(rs.map((r) => r.ratings && Number(r.ratings[k])).filter((v) => v >= 1 && v <= 5));
    return AREAS.map(([k, label]) => ({k, label, recent: of(recent, k), before: of(before, k), n: rounds.filter((r) => r.ratings && Number(r.ratings[k]) >= 1).length})).filter((a) => a.n);
  }
  /* The driver on the range: share of drives in the last 4 weeks inside the fairway width picked at the top. */
  function rangeFairway() {
    const d = dash.data('imports');
    if (d.status !== 'ok' || typeof WB.clubShots !== 'function') return null;
    const g = WB.clubShots(d.data, 'dr').get('dr');
    if (!g) return null;
    const weeks = [...g.weeks.keys()].sort((a, b) => a - b).slice(-4), corridor = Number(dash.params().corridor) || 30;
    const off = weeks.flatMap((w) => g.weeks.get(w)).map((s) => s.offline).filter(isNum);
    return off.length >= 10 ? {p: off.filter((v) => Math.abs(v) <= corridor / 2).length / off.length, n: off.length, corridor} : null;
  }

  /* What's working and what needs work, each with its evidence. */
  function verdicts(all, types, rates, rng) {
    const good = [], bad = [];
    const ty = types.filter((t) => /^Par/.test(t.label) && t.n >= 9).sort((a, b) => a.v - b.v);
    if (ty.length >= 2 && ty[ty.length - 1].v - ty[0].v >= 0.2) {
      good.push(`${ty[0].label} are the best scoring: ${sg1(ty[0].v)} a hole over ${ty[0].n} holes.`);
      bad.push(`${ty[ty.length - 1].label} cost the most: ${sg1(ty[ty.length - 1].v)} a hole over ${ty[ty.length - 1].n} holes.`);
    }
    if (all) {
      if (isNum(all.fairways) && all.n_fwy >= 10) (all.fairways >= 0.6 ? good : all.fairways < 0.45 ? bad : []).push(`Fairways hit: ${pct(all.fairways)} of ${all.n_fwy}.`);
      if (isNum(all.gir) && all.n_gir >= 18) (all.gir >= 0.5 ? good : all.gir < 0.3 ? bad : []).push(`Greens in regulation: ${pct(all.gir)} of ${all.n_gir}.`);
      if (isNum(all.updown) && all.n_ud >= 8) (all.updown >= 0.4 ? good : all.updown < 0.2 ? bad : []).push(`Up and down after a missed green: ${pct(all.updown)} of ${all.n_ud}.`);
      if (isNum(all.three) && all.holes >= 18) (all.three <= 1 ? good : all.three >= 2 ? bad : []).push(`Three-putts: ${all.three.toFixed(1)} a round.`);
      if (isNum(all.doubles) && all.holes >= 18 && all.doubles >= 3) bad.push(`Doubles or worse: ${all.doubles.toFixed(1)} a round.`);
    }
    const rr = rates.filter((a) => isNum(a.recent)).sort((a, b) => b.recent - a.recent);
    if (rr.length >= 2 && rr[0].recent - rr[rr.length - 1].recent >= 0.5) {
      if (rr[0].recent >= 3.5) good.push(`${rr[0].label} is rated highest lately: ${rr[0].recent.toFixed(1)} of 5.`);
      if (rr[rr.length - 1].recent <= 3) bad.push(`${rr[rr.length - 1].label} is rated lowest lately: ${rr[rr.length - 1].recent.toFixed(1)} of 5.`);
    }
    if (rng && all && isNum(all.fairways) && all.n_fwy >= 10) {
      const gap = rng.p - all.fairways;
      if (gap >= 0.15) bad.push(`Driving holds up on the range but not on the course: ${pct(rng.p)} of range drives stay inside ${rng.corridor} yards, against ${pct(all.fairways)} of fairways hit.`);
      else if (gap <= 0.05) good.push(`Fairways hit on the course (${pct(all.fairways)}) keep up with the range (${pct(rng.p)} inside ${rng.corridor} yards).`);
    }
    return {good, bad};
  }

  /* The Round journal headline (design package §3). Issue tags per hole come later; until then the costliest hole type,
     else the lowest-rated area. */
  WB.roundFinding = (g) => {
    const rounds = roundsOf(g);
    if (rounds === null) return null;
    if (!rounds.length) return {title: 'No rounds in this date range yet', sub: 'Save a round below, with hole-by-hole scores where you can, or import notes from a phone.'};
    const withHoles = rounds.filter((r) => holesOf(r).length);
    const ty = byType(rounds).filter((t) => /^Par/.test(t.label) && t.n >= 9).sort((a, b) => b.v - a.v);
    if (ty.length >= 2 && ty[0].v - ty[ty.length - 1].v >= 0.2) return {title: `${ty[0].label} cost the most: ${sg1(ty[0].v)} strokes a hole across ${withHoles.length} round${withHoles.length === 1 ? '' : 's'}`, sub: `${ty[ty.length - 1].label} score best at ${sg1(ty[ty.length - 1].v)} a hole. Issue tags per hole will show which part of the game costs the strokes.`};
    const rr = ratings(rounds).filter((a) => isNum(a.recent)).sort((a, b) => a.recent - b.recent);
    if (rr.length && rr[0].recent <= 3) return {title: `${rr[0].label} is rated lowest: ${rr[0].recent.toFixed(1)} of 5 over the last ${Math.min(RECENT_R, rounds.length)} rounds`, sub: rr.length > 1 ? `${rr[rr.length - 1].label} is rated highest at ${rr[rr.length - 1].recent.toFixed(1)}.` : ''};
    return {title: `${rounds.length} round${rounds.length === 1 ? '' : 's'} logged; nothing stands out yet`, sub: 'Hole-by-hole scores and ratings bring out the patterns.'};
  };

  dash.draw('patterns', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) return;
    const rounds = roundsOf(g);
    if (rounds === null) { box.append(el('p', 'wb-note', 'Loading rounds…')); return; }
    if (!rounds.length) { box.append(el('p', 'wb-note', `No rounds for ${g.name} in this date range yet. Save rounds above, with hole-by-hole scores where you can, and the patterns show here.`)); return; }
    const withHoles = rounds.filter((r) => holesOf(r).length), all = stats(rounds), recent = stats(withHoles.slice(0, RECENT)), earlier = stats(withHoles.slice(RECENT));
    const types = byType(rounds), rates = ratings(rounds), rng = rangeFairway(), v = verdicts(all, types, rates, rng);
    const span = rounds.length > 1 ? `${fmtDay(rounds[rounds.length - 1].date)} to ${fmtDay(rounds[0].date)}` : fmtDay(rounds[0].date);
    box.append(el('p', 'wb-note', `${rounds.length} round${rounds.length === 1 ? '' : 's'}, ${span}; ${withHoles.length} with hole-by-hole scores${all ? ` (${all.holes} holes)` : ''}.`));

    const grid = el('div', 'wb-grid2 wb-pat');
    [['What’s working', v.good, 'ok'], ['What needs work', v.bad, 'warn']].forEach(([h, list, lv]) => {
      const c = el('div', 'wb-card wb-pat-' + lv);
      c.append(el('h3', '', h));
      if (!list.length) c.append(el('p', 'wb-note', withHoles.length ? 'Nothing stands out yet.' : 'Enter hole-by-hole scores to find patterns.'));
      else { const ul = el('ul', 'wb-pat-list'); list.forEach((t) => ul.append(el('li', '', t))); c.append(ul); }
      grid.append(c);
    });
    box.append(grid);

    if (types.length) {
      box.append(el('h3', 'wb-pat-h', 'Scoring by hole'));
      const t = el('table', 'wb-table wb-pat-t'), hr = t.createTHead().insertRow();
      ['Holes', 'Played', 'To par a hole'].forEach((x, k) => { const th = el('th', k ? '' : 'wb-l', x); th.scope = 'col'; hr.append(th); });
      const tb = t.createTBody();
      types.forEach((x) => { const tr = tb.insertRow(); const th = el('th', 'wb-l', x.label); th.scope = 'row'; tr.append(th); tr.insertCell().textContent = String(x.n); tr.insertCell().textContent = sg1(x.v); });
      scroll(box, t);
    }

    if (all) {
      box.append(el('h3', 'wb-pat-h', 'Round stats'));
      const t = el('table', 'wb-table wb-pat-t'), hr = t.createTHead().insertRow();
      const cols = ['', 'All rounds'].concat(recent && earlier ? [`Last ${Math.min(RECENT, withHoles.length)}`, 'Before'] : []);
      cols.forEach((x, k) => { const th = el('th', k ? '' : 'wb-l', x); th.scope = 'col'; hr.append(th); });
      const tb = t.createTBody();
      const ROWS = [['To par a round', (s) => sg1(s.toPar)], ['Fairways hit', (s) => pct(s.fairways)], ['Greens in regulation', (s) => pct(s.gir)], ['Up and down', (s) => pct(s.updown)],
        ['Putts a round', (s) => (isNum(s.putts) ? s.putts.toFixed(1) : '—')], ['Putts a green hit', (s) => (isNum(s.puttsGir) ? s.puttsGir.toFixed(2) : '—')], ['Three-putts a round', (s) => (isNum(s.three) ? s.three.toFixed(1) : '—')],
        ['Birdies a round', (s) => s.birdies.toFixed(1)], ['Doubles or worse a round', (s) => s.doubles.toFixed(1)]];
      ROWS.forEach(([label, f]) => {
        const tr = tb.insertRow(); const th = el('th', 'wb-l', label); th.scope = 'row'; tr.append(th);
        [all].concat(recent && earlier ? [recent, earlier] : []).forEach((s) => { tr.insertCell().textContent = f(s); });
      });
      scroll(box, t);
      box.append(el('p', 'wb-sub', 'Rates a round are per 18 holes from the holes entered, so 9-hole rounds count fairly.'));
    }

    if (rates.length) {
      box.append(el('h3', 'wb-pat-h', 'Ratings, 1 to 5'));
      const t = el('table', 'wb-table wb-pat-t'), hr = t.createTHead().insertRow();
      ['Area', `Last ${Math.min(RECENT_R, rounds.length)} rounds`, 'Before', 'Rounds rated'].forEach((x, k) => { const th = el('th', k ? '' : 'wb-l', x); th.scope = 'col'; hr.append(th); });
      const tb = t.createTBody();
      rates.forEach((a) => {
        const tr = tb.insertRow(); const th = el('th', 'wb-l', a.label); th.scope = 'row'; tr.append(th);
        tr.insertCell().textContent = isNum(a.recent) ? a.recent.toFixed(1) : '—';
        const td = tr.insertCell(); td.textContent = isNum(a.before) ? a.before.toFixed(1) : '—';
        if (isNum(a.before) && isNum(a.recent) && Math.abs(a.recent - a.before) >= 0.3) { const s = el('span', 'wb-chip ' + (a.recent > a.before ? 'ok' : 'warn'), a.recent > a.before ? 'Up' : 'Down'); td.append(' ', s); }
        tr.insertCell().textContent = String(a.n);
      });
      scroll(box, t);
    }

    const cost = costly(rounds);
    if (cost.length) {
      box.append(el('h3', 'wb-pat-h', 'Holes that cost the most'));
      const ul = el('ul', 'wb-pat-list');
      cost.forEach((c) => ul.append(el('li', '', `${c.course}, hole ${c.hole} (par ${c.par}): ${sg1(c.avg)} on average over ${c.n} rounds${isNum(c.puttsAvg) ? `, ${c.puttsAvg.toFixed(1)} putts` : ''}.`)));
      box.append(ul);
    }

    const notes = rounds.filter((r) => String(r.work_on || '').trim()).slice(0, RECENT);
    if (notes.length) {
      box.append(el('h3', 'wb-pat-h', 'What to work on, from the latest notes'));
      const ul = el('ul', 'wb-pat-list');
      notes.forEach((r) => { const li = el('li'); li.append(el('b', '', fmtDay(r.date) + (r.course ? ', ' + r.course : '') + ': ')); li.append(String(r.work_on).trim()); ul.append(li); });
      box.append(ul);
    }
  });
})();
