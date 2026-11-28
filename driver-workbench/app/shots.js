/* Shots: drill down from the golfer to a week, a session and one shot (FR-06 in the dashboards spec).
   The shot inspector shows every stored field, whether the shot counts or sits outside the misread limits,
   the line it came from in the GSPro file (when the original file was kept), and a side view of its flight. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const D = {gid: null, week: null, sid: null, shot: null};
  const FIELDS = {club_speed: ['Club speed', 'mph', 1], ball_speed: ['Ball speed', 'mph', 1], smash: ['Smash', '', 2], launch: ['Launch (VLA)', '°', 1],
    hla: ['Start direction (HLA)', '°', 1], spin: ['Spin', 'rpm', 0], axis: ['Spin axis', '°', 1], carry: ['Carry', 'yd', 1], total: ['Total', 'yd', 1],
    offline: ['Offline (+ is right)', 'yd', 1], peak: ['Peak height', 'yd', 1], descent: ['Descent', '°', 1], attack: ['Attack angle', '°', 1],
    path: ['Club path', '°', 1], face: ['Face to target', '°', 1], f2p: ['Face to path', '°', 1], dyn_loft: ['Dynamic loft', '°', 1]};
  /* Shot tags (FR-03): ranges of shots in a session, stored on the session as an optional "tags" list. */
  const DRILLS = ['Speed ladder', 'Centered strike (face spray)', 'Tee height and attack angle ladder', 'Start-line gate', 'Stock shape window', 'Fairway finder',
    'Long-drive benchmark', 'Wedge clock ladder', 'Random distance test', 'Carry book calibration', 'Flight window (stock vs knockdown)', 'Pressure combine'];
  const SWINGS = ['Full', '¾', '½', '¼'], TEES = ['Low', 'Normal', 'High'], INTENTS = ['Stock', 'Speed', 'Fade', 'Draw', 'High', 'Low', 'Start line', 'Strike'];
  WB.TAGLISTS = {DRILLS, SWINGS, TEES, INTENTS};
  function tagsOf(s) {
    const t = s && s._doc && Array.isArray(s._doc.tags) ? s._doc.tags : [];
    return t.filter((x) => x && Number.isInteger(x.from) && Number.isInteger(x.to) && x.from >= 0 && x.to >= x.from && x.to < s.arows.length).slice(0, 200);
  }
  const tagText = (x) => [x.swing && x.swing !== 'Full' ? x.swing + ' swing' : '', x.drill, x.intent, x.tee ? x.tee + ' tee' : '', x.target].filter(Boolean).join(' · ');
  const tagsAt = (s, k) => tagsOf(s).filter((x) => k >= x.from && k <= x.to);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const go = (o) => { Object.assign(D, o); dash.schedule(); const s = document.getElementById('shots'); if (s && s.scrollIntoView) s.scrollIntoView({block: 'start'}); };
  /* Other views open a shot here: a tap on a tracer or dot in Ball flight, Swing and strike or Partial shots. */
  WB.openShot = (sid, k) => { const s = (imports() || []).find((i) => i.id === sid); if (!s || !Number.isInteger(k)) return; if (WB.view() !== 'all') WB.setView('data'); go({week: Number.isInteger(s.week) ? s.week : null, sid, shot: k}); };
  const fmt = (k, v) => { if (typeof v !== 'number' || !isFinite(v)) return '—'; const f = FIELDS[k]; const d = f ? f[2] : 1; return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US') + (f && f[1] ? (f[1] === '°' ? '°' : ' ' + f[1]) : ''); };
  const imports = () => { const d = dash.data('imports'); return d.status === 'ok' ? d.data : null; };
  const session = () => (imports() || []).find((i) => i.id === D.sid) || null;
  function syncGolfer() { const g = WB.golfer(), id = g ? g.id : null; if (id !== D.gid) Object.assign(D, {gid: id, week: null, sid: null, shot: null}); return g; }
  function rowOf(s, k) { const r = s.arows[k]; if (!r) return null; const o = {club: r[0]}; s.cols.forEach((c, j) => { o[c] = typeof r[j + 1] === 'number' ? r[j + 1] : null; }); if (o.smash === null && o.ball_speed && o.club_speed) o.smash = o.ball_speed / o.club_speed; return o; }
  function flagOf(o) {
    const info = typeof clubInfo === 'function' ? clubInfo(o.club) : null;
    const lim = typeof CLUB_LIMITS === 'object' ? CLUB_LIMITS[(info && info.cat) || 'iron'] : null;
    if (!lim) return '';
    if (typeof o.smash === 'number' && (o.smash < lim.sm[0] || o.smash > lim.sm[1])) return 'Smash outside ' + lim.sm[0].toFixed(2) + '–' + lim.sm[1].toFixed(2) + ': likely a misread';
    if (typeof o.spin === 'number' && o.spin > lim.sp) return 'Spin over ' + lim.sp.toLocaleString('en-US') + ' rpm: likely a misread';
    return '';
  }

  dash.draw('crumbs', (box) => {
    box.replaceChildren();
    const g = syncGolfer();
    if (!g) return;
    const s = D.sid ? session() : null;
    const parts = [[g.name, {week: null, sid: null, shot: null}]];
    if (D.week !== null) parts.push(['Week ' + WB.wk(D.week), {sid: null, shot: null}]);
    if (s) parts.push([s.file || s.date || 'Session', {shot: null}]);
    if (s && D.shot !== null) parts.push(['Shot ' + (D.shot + 1), null]);
    parts.forEach(([label, to], i) => {
      if (i) box.append(el('span', 'wb-crumb-sep', '›'));
      if (to && i < parts.length - 1) { const b = el('button', 'wb-crumb', label); b.type = 'button'; b.addEventListener('click', () => go(to)); box.append(b); }
      else { const c = el('span', 'wb-crumb-now', label); c.setAttribute('aria-current', 'page'); box.append(c); }
    });
  });

  function table(cols, rows, onPick) {
    const wrap = el('div', 'wb-holes-wrap'), t = el('table', 'wb-table wb-drill');
    const hr = t.createTHead().insertRow();
    cols.forEach((c) => { const th = el('th', '', c); th.scope = 'col'; hr.append(th); });
    const tb = t.createTBody();
    rows.forEach((r, i) => {
      const tr = tb.insertRow();
      r.cells.forEach((v, j) => {
        const td = tr.insertCell();
        if (j === 0 && onPick) { const b = el('button', 'wb-btn wb-btn-sm', String(v)); b.type = 'button'; b.addEventListener('click', () => onPick(r.key, i)); td.append(b); }
        else td.textContent = v === null || v === undefined ? '' : String(v);
      });
      if (r.flag) tr.className = 'wb-drill-flag';
    });
    wrap.append(t);
    return wrap;
  }

  dash.draw('drill', (box) => {
    box.replaceChildren();
    const g = syncGolfer();
    if (!g) { box.append(el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const im = imports();
    if (!im) { box.append(el('p', 'wb-note', 'Loading shots…')); return; }
    if (!im.length) { box.append(el('p', 'wb-note', 'No imported sessions in this date range.')); return; }
    if (D.sid && !session()) Object.assign(D, {sid: null, shot: null});
    if (D.week === null) {
      const by = new Map();
      im.forEach((i) => { if (!Number.isInteger(i.week)) return; const w = by.get(i.week) || {n: 0, shots: 0, drv: 0, dates: new Set()}; w.n++; w.shots += i.n_all || i.arows.length; w.drv += i.shots.length; if (i.date) w.dates.add(i.date); by.set(i.week, w); });
      const rows = [...by.entries()].sort((a, b) => b[0] - a[0]).map(([wk, w]) => ({key: wk, cells: ['Week ' + WB.wk(wk), [...w.dates].sort().join(', '), w.n, w.shots, w.drv]}));
      box.append(table(['Week', 'Dates', 'Sessions', 'Shots', 'Driver shots'], rows, (wk) => go({week: wk})));
      const open = im.filter((i) => { const n = i.arows.length, cov = new Set(); tagsOf(i).forEach((x) => { for (let k = x.from; k <= x.to; k++) cov.add(k); }); return cov.size < n; })
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      if (open.length) {
        const q = el('div', 'wb-queue wb-write');
        q.append(el('h3', '', 'Review queue'), el('p', 'wb-note', `${open.length} session${open.length === 1 ? ' has' : 's have'} untagged shots in this date range. Tag drills, swing length, tee height, intent and target so partial shots and drills can be measured.`));
        const ul = el('ul', 'wb-files');
        open.slice(0, 8).forEach((i) => { const li = el('li'); const b = el('button', 'wb-crumb', (i.date || '') + ' · ' + (i.file || 'Session')); b.type = 'button'; b.addEventListener('click', () => go({week: i.week, sid: i.id, shot: null})); li.append(b); ul.append(li); });
        q.append(ul);
        box.append(q);
      }
      return;
    }
    if (!D.sid) {
      const ss = im.filter((i) => i.week === D.week).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      if (!ss.length) { Object.assign(D, {week: null}); box.append(el('p', 'wb-note', 'That week is outside the date range.')); return; }
      const rows = ss.map((i) => ({key: i.id, cells: [i.file || 'Session', i.date || '—', i.n_all || i.arows.length, (i.clubs || []).map((c) => c.club + ' ' + c.n).join(', ')]}));
      box.append(table(['Session', 'Date', 'Shots', 'Clubs'], rows, (id) => go({sid: id})));
      return;
    }
    const s = session();
    if (D.shot === null) {
      const pk = typeof WB.pickedClub === 'function' ? WB.pickedClub() : null;
      const all = s.arows.map((r, k) => { const o = rowOf(s, k), f = flagOf(o); return {key: k, flag: !!f, club: r[0], cells: [k + 1, o.club, fmt('club_speed', o.club_speed), fmt('ball_speed', o.ball_speed), fmt('smash', o.smash), fmt('launch', o.launch), fmt('spin', o.spin), fmt('carry', o.carry), fmt('offline', o.offline), f ? 'Check' : '', tagsAt(s, k).map(tagText).join('; ')]}; });
      const rows = pk ? all.filter((r) => { const i = clubInfo(r.club); return i && i.key === pk.key; }) : all;
      box.append(tagForm(g, s));
      if (pk) box.append(el('p', 'wb-note wb-club-only', `Showing ${pk.name} shots only (Club at the top): ${rows.length} of ${all.length}. Shot numbers stay as in the file.`));
      box.append(el('p', 'wb-note', 'Rows marked Check sit outside the misread limits for their club and are left out of the analysis.'));
      box.append(table(['Shot', 'Club', 'Club speed', 'Ball', 'Smash', 'Launch', 'Spin', 'Carry', 'Offline', '', 'Tags'], rows, (k) => go({shot: k})));
      return;
    }
    inspector(box, g, s, D.shot);
  });

  function inspector(box, g, s, k) {
    const o = rowOf(s, k);
    if (!o) { Object.assign(D, {shot: null}); return; }
    const card = el('div', 'wb-card wb-inspect');
    const f = flagOf(o);
    card.append(el('h3', '', `Shot ${k + 1} of ${s.arows.length} · ${o.club}`));
    card.append(el('p', f ? 'wb-msg wb-badc' : 'wb-msg wb-good', f || 'Within the misread limits for this club; it counts in the analysis.'));
    const dl = el('dl', 'wb-fields-list');
    Object.keys(FIELDS).forEach((c) => { if (!s.cols.includes(c) && c !== 'smash') return; dl.append(el('dt', '', FIELDS[c][0]), el('dd', '', fmt(c, o[c]))); });
    card.append(dl);
    const tg = tagsAt(s, k);
    if (tg.length) card.append(el('p', 'wb-note', 'Tags: ' + tg.map(tagText).join('; ')));
    card.append(flight(o));
    const src = el('div', 'wb-source');
    src.append(el('h4', '', 'Line in the GSPro file'));
    const line = el('pre', 'wb-line', s.has_raw ? 'Loading…' : 'Not kept: this session was saved before original files were kept. Dropping its file again attaches it.');
    src.append(line, el('p', 'wb-note', `File ${s.file || '—'}, saved ${s.date || ''}. Units: ${s.units || 'mph and yards'}.`));
    card.append(src);
    const nav = el('div', 'wb-actions');
    if (k > 0) { const p = el('button', 'wb-btn wb-btn-sm', 'Previous shot'); p.type = 'button'; p.addEventListener('click', () => go({shot: k - 1})); nav.append(p); }
    if (k < s.arows.length - 1) { const n = el('button', 'wb-btn wb-btn-sm', 'Next shot'); n.type = 'button'; n.addEventListener('click', () => go({shot: k + 1})); nav.append(n); }
    card.append(nav);
    box.append(card);
    if (s.has_raw) originalLine(g.id, s.id, k).then((t) => { line.textContent = t || 'Not found in the kept file.'; });
  }

  function tagForm(g, s) {
    const box = el('details', 'wb-card wb-tagbox wb-write');
    const existing = tagsOf(s);
    box.append(el('summary', '', existing.length ? `Tags (${existing.length})` : 'Tag shots'));
    const grid = el('div', 'wb-cond-grid wb-tag-grid');
    const field = (label, ctl) => { const l = el('label', '', label); l.append(ctl); grid.append(l); return ctl; };
    const num = (v) => Object.assign(el('input'), {type: 'number', min: 1, max: s.arows.length, value: v, inputMode: 'numeric'});
    const sel = (opts, first) => { const x = el('select'); [first].concat(opts).forEach((t, i) => { const o = el('option', '', t); o.value = i ? t : ''; x.append(o); }); return x; };
    const from = field('From shot', num(1)), to = field('To shot', num(s.arows.length));
    const drill = field('Drill', sel(DRILLS, 'None')), swing = field('Swing length', sel(SWINGS, '—')), tee = field('Tee height', sel(TEES, '—')), intent = field('Intent', sel(INTENTS, '—'));
    const target = field('Target', Object.assign(el('input'), {type: 'text', maxLength: 40, placeholder: 'e.g. 150 yd flag'}));
    const save = el('button', 'wb-btn wb-btn-sm', 'Save tag'); save.type = 'button';
    const msg = el('span', 'wb-msg', ''); msg.hidden = true;
    const path = 'golfers/' + g.id + '/sessions/' + s.id;
    save.addEventListener('click', async () => {
      const a = Math.round(Number(from.value)) - 1, b = Math.round(Number(to.value)) - 1;
      if (!(a >= 0 && b >= a && b < s.arows.length)) { msg.textContent = `Shots run 1 to ${s.arows.length}.`; msg.className = 'wb-msg wb-badc'; msg.hidden = false; return; }
      const t = {from: a, to: b, drill: drill.value, swing: swing.value, tee: tee.value, intent: intent.value, target: target.value.trim().slice(0, 40), at: new Date().toISOString()};
      if (!t.drill && !t.swing && !t.tee && !t.intent && !t.target) { msg.textContent = 'Pick at least one tag.'; msg.className = 'wb-msg wb-badc'; msg.hidden = false; return; }
      save.disabled = true;
      try { await WB.patch(path, {tags: existing.concat([t])}); } catch (e) { msg.textContent = 'Not saved.'; msg.className = 'wb-msg wb-badc'; msg.hidden = false; }
      save.disabled = false;
    });
    const acts = el('div', 'wb-actions'); acts.append(save, msg);
    box.append(grid, acts);
    if (existing.length) {
      const ul = el('ul', 'wb-files');
      existing.forEach((x, i) => {
        const li = el('li', '', `Shots ${x.from + 1}–${x.to + 1}: ${tagText(x) || 'no detail'} `);
        if (typeof confirmButton === 'function') li.append(confirmButton('Remove', 'Remove tag', () => WB.patch(path, {tags: existing.filter((_, j) => j !== i)})));
        ul.append(li);
      });
      box.append(ul);
    }
    return box;
  }

  /* The kept original file: golfers/{gid}/raw/{sid}, with -p2, -p3… for long files; its lines follow the session's shots. */
  const rawCache = new Map();
  function readOnce(db, path) {
    return new Promise((res) => {
      let done = false, unsub = null;
      const t = setTimeout(() => finish(null), 8000);
      function finish(v) { if (done) return; done = true; clearTimeout(t); if (typeof unsub === 'function') unsub(); res(v); }
      try { unsub = db.doc(path).onSnapshot((snap) => finish(snap && snap.exists ? snap.data() : null), () => finish(null)); } catch (e) { finish(null); }
      if (done && typeof unsub === 'function') unsub();
    });
  }
  async function originalLine(gid, sid, k) {
    const key = gid + '/' + sid;
    if (!rawCache.has(key)) rawCache.set(key, (async () => {
      const db = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('db') : null;
      if (!db) return null;
      const first = await readOnce(db, `golfers/${gid}/raw/${sid}`);
      if (!first || typeof first.text !== 'string') return null;
      let text = first.text;
      for (let p = 2; p <= Math.min(Number(first.parts) || 1, 12); p++) { const d = await readOnce(db, `golfers/${gid}/raw/${sid}-p${p}`); if (d && typeof d.text === 'string') text += '\n' + d.text; }
      return text.split(/\r?\n/);
    })());
    const lines = await rawCache.get(key);
    return lines && typeof lines[k] === 'string' ? lines[k] : null;
  }

  /* Side view of the flight: GSPro's carry, peak height and total when present, else the flight model's. */
  function flight(o) {
    const wrap = el('div', 'wb-flight');
    let carry = o.carry, peak = o.peak, total = o.total;
    if ((!(carry > 0) || !(peak > 0)) && typeof BF === 'object' && o.ball_speed > 0 && typeof o.launch === 'number' && o.spin > 0) {
      const c = WB.conditions(), m = BF.shot(o.ball_speed, o.launch, o.spin, {alt: c.altitude_ft, temp: c.temp_f, turf: 'normal'});
      if (!(carry > 0)) carry = m.carry; if (!(total > 0)) total = m.total;
    }
    if (!(carry > 0)) { wrap.append(el('p', 'wb-note', 'No carry recorded for this shot.')); return wrap; }
    if (!(peak > 0)) peak = carry * 0.14;
    const W = 320, H = 120, pad = 14, far = Math.max(carry, total || 0) * 1.05;
    const x = (v) => pad + (v / far) * (W - 2 * pad), y = (v) => H - pad - (v / Math.max(peak * 1.25, 1)) * (H - 2 * pad);
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Flight: carry ${Math.round(carry)} yards, peak ${Math.round(peak)} yards` + (total > carry ? `, total ${Math.round(total)} yards` : ''));
    const path = (d, cls) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.append(p); };
    path(`M${x(0)} ${y(0)} L${x(far)} ${y(0)}`, 'wb-fl-ground');
    path(`M${x(0)} ${y(0)} Q${x(carry * 0.56)} ${y(peak * 2)} ${x(carry)} ${y(0)}`, 'wb-fl-ball');
    if (total > carry) path(`M${x(carry)} ${y(0)} L${x(total)} ${y(0)}`, 'wb-fl-roll');
    wrap.append(svg, el('p', 'wb-note', `Carry ${Math.round(carry)} yd · peak ${Math.round(peak)} yd` + (total > carry ? ` · total ${Math.round(total)} yd` : '')));
    return wrap;
  }
})();
