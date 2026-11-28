/* Drill Runner (backlog b50; design package §3 Drill studio): on the phone or iPad at the range. Pick a plan of blocks
   (drill, swing length, tee, intent, shots), tap after each shot (with its face-spray zone when there is one), watch the
   pre-shot routine time, then merge the run into that day's GSPro session by shot order once the file is imported:
   each block becomes a tag on its shot range and each zone becomes the shot's target, which the strike map reads.
   Runs are saved after every tap under golfers/{id}/runs, with a copy on the device in case the connection drops. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const L = WB.TAGLISTS || {DRILLS: [], SWINGS: ['Full', '¾', '½', '¼'], TEES: ['Low', 'Normal', 'High'], INTENTS: ['Stock']};
  const ROWS = ['High', 'Mid', 'Low'], COLS = ['heel', 'center', 'toe'];
  const blk = (drill, swing, tee, intent, n) => ({drill, swing, tee, intent, n});
  const PLANS = [
    ['Centered strike', [blk('Centered strike (face spray)', 'Full', 'Normal', 'Strike', 10)]],
    ['Tee-height ladder', [blk('Tee height and attack angle ladder', 'Full', 'Low', '', 5), blk('Tee height and attack angle ladder', 'Full', 'Normal', '', 5), blk('Tee height and attack angle ladder', 'Full', 'High', '', 5)]],
    ['Speed ladder', [1, 2, 3].map(() => blk('Speed ladder', 'Full', 'Normal', 'Speed', 5))],
    ['Start-line gate', [blk('Start-line gate', 'Full', 'Normal', 'Start line', 10)]],
    ['Wedge clock ladder', ['¼', '½', '¾', 'Full'].map((w) => blk('Wedge clock ladder', w, '', '', 4))],
    ['Stock warm-up', [blk('', 'Full', 'Normal', 'Stock', 10)]],
  ];
  const LOCAL = 'ph-run-active', MAXB = 20, MAXN = 60, MAXTAGS = 200;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const btn = (text, cls, fn) => { const b = el('button', 'wb-btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const total = (d) => d.blocks.reduce((s, b) => s + (b.n || 0), 0);
  const blockAt = (d, k) => { let c = 0; for (let i = 0; i < d.blocks.length; i++) { c += d.blocks[i].n; if (k < c) return i; } return d.blocks.length - 1; };
  const fmtDay = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : d; };
  const blockText = (b) => [b.drill || 'No drill', b.swing && b.swing !== 'Full' ? b.swing + ' swing' : '', b.tee ? b.tee + ' tee' : '', b.intent].filter(Boolean).join(' · ');

  /* The plan being edited, the active run (for the golfer picked at the top) and the routine clock. */
  let draft = {date: today(), blocks: PLANS[0][1].map((b) => Object.assign({}, b)), plan: PLANS[0][0]};
  let active = null, lastTap = null, clock = null, unsynced = false;
  function local(v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(LOCAL) || 'null'); if (v === null) localStorage.removeItem(LOCAL); else localStorage.setItem(LOCAL, JSON.stringify(v)); } catch (e) { return null; } return null; }
  const runPath = (a) => 'golfers/' + a.gid + '/runs/' + a.id;
  function send(a) {
    return WB.save(runPath(a), a.data).then(() => {
      unsynced = false;
      const l = local();
      if (a.data.done && l && l.id === a.id) local(null);
    }, () => { unsynced = true; dash.redraw('runner'); });
  }
  function persist() {
    if (!active) return;
    active.data.updated_at = new Date().toISOString();
    local(active);
    send(active);
  }
  window.addEventListener('online', () => { const l = local(); if (unsynced && l) send(l); });
  /* Runs ended or cancelled on this page stay closed even before the saved copy catches up. */
  const ended = new Set();
  function current(g) {
    const runs = WB.runsFor(g.id) || [], was = active && active.id;
    const doneThere = (id) => runs.some((r) => r.id === id && r.data && r.data.done);
    if (active && active.gid === g.id && !active.data.done && !ended.has(active.id) && !doneThere(active.id)) return active;
    let loc = local();
    if (loc && loc.gid === g.id && loc.data) {
      if (doneThere(loc.id)) { local(null); loc = null; }
      else if (loc.data.done) { if (!ended.has(loc.id)) { ended.add(loc.id); send(loc); } loc = null; }
      else if (ended.has(loc.id)) loc = null;
    } else loc = null;
    const open = runs.filter((r) => r.data && !r.data.done && !ended.has(r.id)).sort((a, b) => String(b.data.updated_at).localeCompare(String(a.data.updated_at)))[0];
    if (loc && (!open || open.id === loc.id || String(loc.data.updated_at) >= String(open.data.updated_at))) active = loc;
    else if (open) active = {id: open.id, gid: g.id, data: JSON.parse(JSON.stringify(open.data))};
    else active = null;
    if ((active && active.id) !== was) lastTap = null;
    return active;
  }
  function tick() {
    const t = document.querySelector('.ph-rt-time');
    if (!t) { clearInterval(clock); clock = null; return; }
    t.textContent = lastTap ? Math.max(0, Math.round((Date.now() - lastTap) / 1000)) + ' s' : '—';
  }
  function tap(zone) {
    const d = active.data;
    if (d.shots.length >= total(d)) return;
    const now = Date.now();
    d.shots.push({b: blockAt(d, d.shots.length), zone: zone || null, rt: lastTap ? Math.round((now - lastTap) / 1000) : null});
    lastTap = now;
    if (d.shots.length >= total(d)) d.full_at = new Date().toISOString();
    persist();
    dash.redraw('runner');
  }

  function startForm(box, g) {
    const card = el('div', 'wb-card ph-run-start wb-write');
    card.append(el('h3', '', 'Start a run'));
    const chips = el('div', 'ph-run-plans');
    PLANS.forEach(([name, blocks]) => { const c = btn(name, 'wb-chipbtn' + (draft.plan === name ? ' on' : ''), () => { draft.plan = name; draft.blocks = blocks.map((b) => Object.assign({}, b)); dash.redraw('runner'); }); c.setAttribute('aria-pressed', draft.plan === name ? 'true' : 'false'); chips.append(c); });
    card.append(chips);
    const dl = el('label', 'ph-run-date', 'Date');
    const di = Object.assign(el('input'), {type: 'date', value: draft.date, name: 'run-date'});
    di.addEventListener('change', () => { draft.date = di.value || today(); });
    dl.append(di);
    card.append(dl);
    const list = el('div', 'ph-run-blocks');
    const sel = (opts, v, first, set) => { const x = el('select'); [[first, '']].concat(opts.map((o) => [o, o])).forEach(([t, val]) => { const o = el('option', '', t); o.value = val; x.append(o); }); x.value = v || ''; x.addEventListener('change', () => { set(x.value); draft.plan = 'Custom'; }); return x; };
    draft.blocks.forEach((b, i) => {
      const row = el('div', 'ph-run-block');
      row.append(el('b', '', `Block ${i + 1}`));
      const f = (label, ctl) => { const l = el('label', '', label); l.append(ctl); row.append(l); };
      f('Drill', sel(L.DRILLS, b.drill, 'No drill', (v) => { b.drill = v; }));
      f('Swing', sel(L.SWINGS, b.swing, '—', (v) => { b.swing = v; }));
      f('Tee', sel(L.TEES, b.tee, '—', (v) => { b.tee = v; }));
      f('Intent', sel(L.INTENTS, b.intent, '—', (v) => { b.intent = v; }));
      const n = Object.assign(el('input'), {type: 'number', min: 1, max: 60, value: b.n, inputMode: 'numeric'});
      n.addEventListener('change', () => { b.n = Math.max(1, Math.min(60, Math.round(Number(n.value) || 1))); n.value = b.n; draft.plan = 'Custom'; });
      f('Shots', n);
      if (draft.blocks.length > 1) row.append(btn('Remove', 'wb-btn-sm', () => { draft.blocks.splice(i, 1); draft.plan = 'Custom'; dash.redraw('runner'); }));
      list.append(row);
    });
    card.append(list);
    const acts = el('div', 'wb-actions');
    if (draft.blocks.length < MAXB) acts.append(btn('Add a block', '', () => { draft.blocks.push(Object.assign({}, draft.blocks[draft.blocks.length - 1] || blk('', 'Full', 'Normal', '', 5))); draft.plan = 'Custom'; dash.redraw('runner'); }));
    const go = btn(`Start: ${draft.blocks.reduce((s, b) => s + b.n, 0)} shots`, 'wb-btn-main', () => {
      if (WB.canWrite === false) return;
      active = {id: WB.newId('r'), gid: g.id, data: {schema: 1, date: draft.date || today(), plan: draft.plan, blocks: draft.blocks.map((b) => Object.assign({}, b)), shots: [], done: false, started_at: new Date().toISOString(), merged: null}};
      lastTap = Date.now();
      persist();
      dash.redraw('runner');
    });
    go.id = 'run-start';
    acts.append(go);
    card.append(acts);
    card.append(el('p', 'wb-note', 'Start when Ira is ready to hit the first ball of the block, and tap once after every shot, including mishits, so the run lines up with GSPro’s shot order.'));
    box.append(card);
  }

  function runScreen(box, g) {
    const d = active.data, N = total(d), k = d.shots.length, done = k >= N;
    const b = done ? d.blocks.length - 1 : blockAt(d, k), before = d.blocks.slice(0, b).reduce((s, x) => s + x.n, 0);
    const card = el('div', 'wb-card ph-runner wb-write');
    const head = el('div', 'ph-run-head');
    head.append(el('div', 'ph-run-block-name', `Block ${b + 1} of ${d.blocks.length}: ${blockText(d.blocks[b])}`));
    head.append(el('div', 'ph-run-count', done ? `All ${N} shots logged` : `Shot ${k - before + 1} of ${d.blocks[b].n}` + (d.blocks.length > 1 ? ` · ${k + 1} of ${N} in the run` : '')));
    card.append(head);
    const rt = el('div', 'ph-rt');
    rt.append(el('span', 'ph-rt-label', 'Routine'), el('span', 'ph-rt-time', '—'));
    const rts = d.shots.map((s) => s.rt).filter((v) => typeof v === 'number' && v > 0 && v < 300);
    if (rts.length) rt.append(el('span', 'wb-sub', ` · median ${rts.slice().sort((x, y) => x - y)[rts.length >> 1]} s over ${rts.length} shot${rts.length === 1 ? '' : 's'}`));
    card.append(rt);
    const grid = el('div', 'ph-zones');
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Face-spray zone of the shot just hit');
    ROWS.forEach((r) => COLS.forEach((c) => { const z = `${r} ${c}`, bz = btn(z, 'ph-zone', () => tap(z)); bz.disabled = done; bz.dataset.zone = z; grid.append(bz); }));
    card.append(el('p', 'wb-sub ph-zone-note', 'Tap the zone on the face spray after each shot. Heel is on the left, toe on the right, as you look at the face.'));
    card.append(grid);
    const hit = btn('Shot hit, no zone', 'wb-btn-main ph-hit', () => tap(null));
    hit.disabled = done;
    card.append(hit);
    const acts = el('div', 'wb-actions');
    acts.append(btn('Undo last shot', '', () => { if (d.shots.length) { d.shots.pop(); delete d.full_at; persist(); dash.redraw('runner'); } }));
    if (!done && d.blocks[b].n < MAXN) acts.append(btn('Add 5 to this block', '', () => { d.blocks[b].n = Math.min(MAXN, d.blocks[b].n + 5); persist(); dash.redraw('runner'); }));
    if (!k) acts.append(btn('Cancel the run', '', () => { const a = active; ended.add(a.id); local(null); active = null; lastTap = null; WB.remove(runPath(a)).catch(() => {}); dash.redraw('runner'); }));
    else acts.append(btn('End the run', done ? 'wb-btn-main' : '', () => { d.done = true; d.ended_at = new Date().toISOString(); ended.add(active.id); persist(); active = null; lastTap = null; dash.redraw('runner'); }));
    card.append(acts);
    if (unsynced) card.append(el('p', 'wb-msg wb-badc', 'Not saved to your account yet: kept on this device and saved when the connection is back.'));
    box.append(card);
    if (!clock) clock = setInterval(tick, 1000);
    tick();
  }

  /* Merge a finished run into that day's session: block tags on the shot ranges, each zone as its shot's target. */
  function mergeTags(d, runId, offset, n) {
    const out = [], at = new Date().toISOString();
    const ranges = new Map();
    d.shots.forEach((s, k) => { const i = k + offset; if (i < 0 || i >= n) return; const r = ranges.get(s.b) || [i, i]; r[0] = Math.min(r[0], i); r[1] = Math.max(r[1], i); ranges.set(s.b, r); });
    ranges.forEach(([a, z], bi) => { const b = d.blocks[bi] || {}; if (b.drill || (b.swing && b.swing !== 'Full') || b.tee || b.intent) out.push({from: a, to: z, drill: b.drill || '', swing: b.swing || '', tee: b.tee || '', intent: b.intent || '', target: '', at, src: 'runner', run: runId}); });
    d.shots.forEach((s, k) => { const i = k + offset; if (s.zone && i >= 0 && i < n) out.push({from: i, to: i, drill: '', swing: '', tee: '', intent: '', target: s.zone, at, src: 'runner', run: runId}); });
    return out;
  }
  WB.runMergeTags = mergeTags;

  function finished(box, g) {
    const runs = (WB.runsFor(g.id) || []).filter((r) => r.data && r.data.done && Array.isArray(r.data.shots)).sort((a, b) => String(b.data.ended_at || '').localeCompare(String(a.data.ended_at || ''))).slice(0, 6);
    if (!runs.length) return;
    const card = el('div', 'wb-card ph-run-done');
    card.append(el('h3', '', 'Finished runs'));
    const im = dash.data('imports_all'), sessions = im.status === 'ok' ? im.data : [];
    runs.forEach((r) => {
      const d = r.data, zones = d.shots.filter((s) => s.zone).length, row = el('div', 'ph-run-row');
      row.append(el('p', '', `${fmtDay(d.date)} · ${d.plan || 'Custom'} · ${d.blocks.length} block${d.blocks.length === 1 ? '' : 's'}, ${d.shots.length} shots${zones ? `, ${zones} zones` : ''}`));
      const path = (sid) => `golfers/${g.id}/sessions/${sid}`;
      if (d.merged && d.merged.sid) {
        const s = sessions.find((x) => x.id === d.merged.sid);
        const p = el('p', 'wb-sub', `Merged into ${s ? s.file || 'the session' : 'a session'} from shot ${d.merged.offset + 1}.`);
        if (s && typeof confirmButton === 'function') {
          const w = el('span', 'wb-write');
          w.append(confirmButton('Take its tags off', 'Take them off', async () => {
            const tags = ((s._doc && s._doc.tags) || []).filter((t) => t.run !== r.id);
            await WB.patch(path(s.id), {tags});
            await WB.save(`golfers/${g.id}/runs/${r.id}`, Object.assign({}, d, {merged: null}));
          }));
          p.append(' ', w);
        }
        row.append(p);
        card.append(row);
        return;
      }
      const same = sessions.filter((s) => s.date === d.date && Array.isArray(s.arows) && s.arows.length);
      if (!same.length) { row.append(el('p', 'wb-sub', `Import the GSPro file from ${fmtDay(d.date)} to merge this run.`)); card.append(row); return; }
      const pick = el('select');
      pick.setAttribute('aria-label', 'Session to merge into');
      same.slice().sort((a, b) => Math.abs(a.arows.length - d.shots.length) - Math.abs(b.arows.length - d.shots.length)).forEach((s) => { const o = el('option', '', `${s.file || s.id} (${s.arows.length} shots)`); o.value = s.id; pick.append(o); });
      const first = Object.assign(el('input'), {type: 'number', min: 1, value: 1, inputMode: 'numeric'});
      first.setAttribute('aria-label', 'First session shot of the run');
      const note = el('p', 'wb-sub');
      const say = () => { const s = same.find((x) => x.id === pick.value); note.textContent = s && s.arows.length !== d.shots.length ? `The run logged ${d.shots.length} shots and the session has ${s.arows.length}. If shots were hit before the run started, set the first shot of the run to match.` : 'The run and the session have the same number of shots.'; };
      pick.addEventListener('change', say); say();
      const lab = (t, c) => { const l = el('label', '', t); l.append(c); return l; };
      const go = btn('Merge into the session', 'wb-btn-main', async () => {
        const s = same.find((x) => x.id === pick.value);
        if (!s) return;
        const off = Math.max(0, Math.round(Number(first.value) || 1) - 1), add = mergeTags(d, r.id, off, s.arows.length);
        const tags = ((s._doc && s._doc.tags) || []).filter((t) => t.run !== r.id).concat(add);
        if (tags.length > MAXTAGS) { note.textContent = `Not merged: the session would have ${tags.length} tags and the workbench reads ${MAXTAGS}. Take some tags off the session first.`; return; }
        go.disabled = true;
        try {
          await WB.patch(path(s.id), {tags});
          await WB.save(`golfers/${g.id}/runs/${r.id}`, Object.assign({}, d, {merged: {sid: s.id, offset: off, at: new Date().toISOString()}}));
        } catch (e) { go.disabled = false; note.textContent = 'Not merged: the connection or the save failed. Try again.'; }
      });
      go.classList.add('ph-run-merge');
      const f = el('div', 'ph-run-mergeform wb-write');
      f.append(lab('Session', pick), lab('First shot of the run', first), go);
      row.append(f, note);
      card.append(row);
    });
    box.append(card);
  }

  dash.draw('runner', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) return;
    if (WB.runsFor(g.id) === null) { box.append(el('p', 'wb-note', 'Loading runs…')); return; }
    const a = current(g);
    if (a) runScreen(box, g); else startForm(box, g);
    finished(box, g);
  });
})();
