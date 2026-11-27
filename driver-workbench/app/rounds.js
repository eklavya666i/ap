/* Rounds: notes from rounds and practice rounds, entered on any device (the phone after a round).
   Ratings, what happened, voice notes (Claude dictation where the device offers it, else the keyboard's mic),
   and scorecard photos that Claude can read into hole-by-hole scores.
   Stored per golfer at golfers/{gid}/rounds/{id}; a photo is an artifact asset referenced by its id. */
(function () {
  'use strict';
  const form = document.getElementById('round-form');
  if (!form || !window.WB || !window.dash) return;
  const $ = (id) => document.getElementById(id);
  const RATINGS = [['driving', 'Driving'], ['approach', 'Approach'], ['short', 'Short game'], ['putting', 'Putting'], ['mental', 'Mental game']];
  const KINDS = ['Tournament', 'Practice round', 'Casual round', 'Range or lesson'];
  const caps = {dictation: null, assets: null, sample: null, images: false};
  let editing = null;   // {gid, id, created_at} while a saved round is in the form
  let photo = null;     // {id, blob?} of the scorecard photo in the form
  let holes = [];       // [{hole, par, score, putts, fairway, green}]
  let target = null;    // textarea receiving dictation
  const num = (v) => (WB.num ? WB.num(v) : (v === '' || v === null || v === undefined || isNaN(+v) ? null : +v));
  const msg = $('round-msg');
  const say = (t, ok) => { msg.textContent = t || ''; msg.className = 'wb-msg ' + (ok ? 'wb-good' : 'wb-badc'); msg.hidden = !t; };
  const localDate = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const intIn = (v, lo, hi) => { const n = num(v); return n !== null && Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null; };
  const yesNo = (v) => (v === true || v === 'yes' ? true : v === false || v === 'no' ? false : null);

  /* Capabilities arrive later, or never: everything works without them. */
  (async () => {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') return;
    const get = (n) => c.use(n).catch(() => null);
    [caps.dictation, caps.assets, caps.sample] = await Promise.all([get('dictation'), get('assets'), get('sample')]);
    if (caps.sample && typeof caps.sample.limits === 'function') {
      try { caps.images = !!(await caps.sample.limits()).images; } catch (e) { caps.images = false; }
    }
    wireDictation();
    showCaps();
  })();

  function showCaps() {
    const dict = !!caps.dictation;
    document.querySelectorAll('.round-mic').forEach((b) => { b.hidden = !dict; });
    $('round-mic-hint').hidden = dict;
    $('round-photo-wrap').hidden = !caps.assets;
    showPhoto();
  }

  function wireDictation() {
    const d = caps.dictation;
    if (!d) return;
    const live = $('round-live');
    const label = (state) => document.querySelectorAll('.round-mic').forEach((b) => {
      const on = state === 'listening' && target && b.dataset.for === target.id;
      b.textContent = on ? 'Stop' : 'Speak';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    d.onPartial(({text}) => { live.textContent = text || ''; live.hidden = !text; });
    d.onFinal(({text}) => {
      const t = String(text || '').trim();
      if (target && t) target.value = (target.value.trim() ? target.value.trim() + ' ' : '') + t;
      live.textContent = ''; live.hidden = true;
    });
    d.onState(({state}) => { label(state); if (state !== 'listening') live.hidden = true; });
    document.querySelectorAll('.round-mic').forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') { d.stop().catch(() => {}); return; }
      target = $(b.dataset.for);
      d.start().catch((e) => {
        const code = e && (e.code || e.message || e);
        if (code === 'not_granted') { caps.dictation = null; showCaps(); }
      });
    }));
  }

  /* Scorecard photo: shrunk on the device, kept as an asset, read by Claude on request. */
  async function shrink(file, max) {
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (k === 1 && file.size < 2.5e6 && /jpe?g/i.test(file.type)) return file;
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      return await new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', 0.85));
    } catch (e) { return file; }
  }
  function showPhoto() {
    const img = $('round-thumb'), has = !!photo;
    if (has) img.src = '/_blob/' + photo.id;
    img.hidden = !has;
    $('round-photo-remove').hidden = !has;
    $('round-read').hidden = !(has && caps.sample && caps.images);
    $('round-photo-label').textContent = has ? 'Replace scorecard photo' : 'Add scorecard photo';
  }
  $('round-photo').addEventListener('change', async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f || !caps.assets) return;
    say('Adding the photo…', true);
    try {
      const blob = await shrink(f, 2000);
      const up = await caps.assets.upload(blob);
      photo = {id: up.id, blob};
      showPhoto();
      say('Photo added.' + (caps.sample && caps.images ? ' Tap Read scores to fill in the holes.' : ''), true);
    } catch (e) { say('The photo couldn’t be added. Try again.', false); }
  });
  $('round-photo-remove').addEventListener('click', () => { photo = null; showPhoto(); say('', true); });

  async function askJson(prompt, opts) {
    const s = caps.sample;
    if (typeof s.json === 'function') return s.json(prompt, opts);
    const r = await s(prompt, opts);
    const m = String((r && r.text) || '').match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
  function cleanCard(out) {
    const o = out && typeof out === 'object' ? out : {};
    const seen = new Set(), hs = [];
    (Array.isArray(o.holes) ? o.holes : []).forEach((h) => {
      if (!h || typeof h !== 'object') return;
      const hole = intIn(h.hole, 1, 27);
      if (hole === null || seen.has(hole)) return;
      seen.add(hole);
      hs.push({hole, par: intIn(h.par, 3, 6), score: intIn(h.score, 1, 15), putts: intIn(h.putts, 0, 9), fairway: yesNo(h.fairway), green: yesNo(h.green)});
    });
    hs.sort((a, b) => a.hole - b.hole);
    return {holes: hs, course: typeof o.course === 'string' ? o.course.trim().slice(0, 80) : '', note: typeof o.note === 'string' ? o.note.trim().slice(0, 300) : ''};
  }
  $('round-read').addEventListener('click', async () => {
    if (!photo || !caps.sample) return;
    const btn = $('round-read');
    btn.disabled = true;
    say('Reading the scorecard…', true);
    const g = WB.golfer();
    const name = g ? g.name : 'the golfer';
    const prompt = 'You read golf scorecards from photos. Read the hole-by-hole row for the player named "' + name + '". ' +
      'If no row is labeled with that name, use the row that looks like the player\'s own scores and say so in "note". ' +
      'Return JSON only, in this shape: {"course": string or null, "holes": [{"hole": number, "par": number or null, "score": number or null, ' +
      '"putts": number or null, "fairway": true, false or null, "green": true, false or null}], "note": string or null}. ' +
      'Use null for anything you cannot read with confidence; never guess a number. Fairway and green are true only where the card marks them as hit.';
    try {
      const blob = photo.blob || await (await fetch('/_blob/' + photo.id)).blob();
      const card = cleanCard(await askJson(prompt, {images: [blob], modelTier: 'default'}));
      if (!card.holes.length) say('No hole scores could be read. Type them in, or try a clearer photo.', false);
      else {
        holes = card.holes;
        if (!form.elements.course.value && card.course) form.elements.course.value = card.course;
        drawHoles();
        say('Read ' + card.holes.length + ' holes. Check them against the card, then save.' + (card.note ? ' Note: ' + card.note : ''), true);
      }
    } catch (e) {
      const code = e && e.code;
      if (code === 'not_granted') { caps.sample = null; showPhoto(); say('Reading scorecards wasn’t allowed here. Type the scores in.', false); }
      else if (code === 'rate_limited') say('Too many requests just now. Try again in a minute.', false);
      else say('The scorecard couldn’t be read. Type the scores in, or try again.', false);
    }
    btn.disabled = false;
  });

  /* Hole-by-hole table in the form. */
  function drawHoles() {
    const box = $('round-holes');
    box.textContent = '';
    if (!holes.length) return;
    const wrap = document.createElement('div'); wrap.className = 'wb-holes-wrap';
    const t = document.createElement('table'); t.className = 'wb-holes';
    const hr = t.createTHead().insertRow();
    [['Hole', 'Hole'], ['Par', 'Par'], ['Score', 'Score'], ['Putts', 'Putts'], ['FW', 'Fairway hit'], ['GIR', 'Green in regulation']].forEach(([h, t]) => { const th = document.createElement('th'); th.textContent = h; th.title = t; hr.append(th); });
    const tb = t.createTBody();
    holes.forEach((h, i) => {
      const tr = tb.insertRow();
      const td0 = tr.insertCell(); td0.textContent = h.hole;
      [['par', 3, 6], ['score', 1, 15], ['putts', 0, 9]].forEach(([k, lo, hi]) => {
        const inp = document.createElement('input');
        inp.type = 'number'; inp.inputMode = 'numeric'; inp.min = lo; inp.max = hi;
        inp.value = h[k] === null ? '' : h[k];
        inp.setAttribute('aria-label', k + ' on hole ' + h.hole);
        inp.addEventListener('input', () => { holes[i][k] = intIn(inp.value, lo, hi); totals(); });
        tr.insertCell().append(inp);
      });
      ['fairway', 'green'].forEach((k) => {
        const sel = document.createElement('select');
        [['', '–'], ['yes', 'Hit'], ['no', 'Missed']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; sel.append(o); });
        sel.value = h[k] === true ? 'yes' : h[k] === false ? 'no' : '';
        sel.setAttribute('aria-label', k + ' on hole ' + h.hole);
        sel.addEventListener('change', () => { holes[i][k] = yesNo(sel.value); totals(); });
        tr.insertCell().append(sel);
      });
    });
    const tf = t.createTFoot().insertRow(); tf.id = 'round-holes-total';
    wrap.append(t);
    box.append(wrap);
    totals();
  }
  function sums(hs) {
    const tot = (k) => hs.reduce((a, h) => a + (h[k] === null ? 0 : h[k]), 0), cnt = (k, v) => hs.filter((h) => h[k] === v).length;
    const scored = hs.filter((h) => h.score !== null), parred = scored.filter((h) => h.par !== null);
    return {score: scored.length ? tot('score') : null, all: scored.length === hs.length && hs.length > 0,
      toPar: parred.length === scored.length && scored.length ? tot('score') - parred.reduce((a, h) => a + h.par, 0) : null,
      putts: hs.some((h) => h.putts !== null) ? tot('putts') : null, fw: cnt('fairway', true), fwOf: hs.filter((h) => h.fairway !== null).length,
      gir: cnt('green', true), girOf: hs.filter((h) => h.green !== null).length};
  }
  function totals() {
    const row = $('round-holes-total');
    if (!row) return;
    const s = sums(holes);
    row.textContent = '';
    ['Total', '', s.score === null ? '' : s.score + (s.toPar === null ? '' : ' (' + (s.toPar > 0 ? '+' : '') + s.toPar + ')'), s.putts === null ? '' : s.putts,
      s.fwOf ? s.fw + '/' + s.fwOf : '', s.girOf ? s.gir + '/' + s.girOf : ''].forEach((v) => { const td = row.insertCell(); td.textContent = v; });
    if (s.all && !form.elements.score.value) form.elements.score.value = s.score;
  }
  $('round-holes-add').addEventListener('click', () => {
    if (holes.length) return;
    const n = form.elements.holes.value === '9' ? 9 : 18;
    holes = Array.from({length: n}, (_, i) => ({hole: i + 1, par: null, score: null, putts: null, fairway: null, green: null}));
    drawHoles();
  });

  /* Notes sent from a golfer's phone (the Golf notes app): a JSON file with rounds, added to the matching golfer's rounds. */
  async function importNotes(data) {
    if (!data || data.app !== 'driver-workbench-notes' || !Array.isArray(data.rounds)) return {ok: false, text: 'That file isn’t a Golf notes file.'};
    const name = typeof data.golfer === 'string' ? data.golfer.trim().toLowerCase() : '';
    const g = WB.golfers().find((x) => x.name.toLowerCase() === name) || WB.golfer();
    if (!g) return {ok: false, text: 'Pick a golfer at the top first.'};
    const have = new Set((WB.roundsFor(g.id) || []).map((r) => r.id));
    let added = 0, skipped = 0, photos = 0;
    for (const n of data.rounds.slice(0, 200)) {
      if (!n || typeof n.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(n.id) || have.has(n.id)) { skipped++; continue; }
      let card = null;
      if (typeof n.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(n.photo) && caps.assets) {
        try { const up = await caps.assets.upload(await (await fetch(n.photo)).blob()); card = {asset: up.id}; photos++; } catch (e) { card = null; }
      }
      const ratings = {};
      RATINGS.forEach(([k]) => { const v = intIn(n.ratings && n.ratings[k], 1, 5); if (v !== null) ratings[k] = v; });
      const now = new Date().toISOString();
      const body = {schema: 1, date: /^\d{4}-\d{2}-\d{2}$/.test(n.date) ? n.date : localDate(), course: String(n.course || '').slice(0, 80),
        kind: KINDS.includes(n.kind) ? n.kind : KINDS[1], holes_played: 18, score: intIn(n.score, 18, 200), ratings,
        what: String(n.what || '').slice(0, 4000), work_on: String(n.work_on || '').slice(0, 2000), card, holes: [],
        created_at: typeof n.created_at === 'string' ? n.created_at.slice(0, 40) : now, updated_at: now, from: 'phone', by: String(data.golfer || '').slice(0, 30)};
      try { await WB.save('golfers/' + g.id + '/rounds/' + n.id, body); added++; have.add(n.id); } catch (e) { skipped++; }
    }
    return {ok: true, text: `Added ${added} note${added === 1 ? '' : 's'} to ${g.name}'s rounds` + (photos ? ` with ${photos} photo${photos === 1 ? '' : 's'}` : '') + (skipped ? `; ${skipped} were already here or unreadable.` : '.')};
  }
  WB.importNotes = importNotes;
  const imp = $('round-import');
  if (imp) imp.addEventListener('change', async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    let data = null;
    try { data = JSON.parse(await f.text()); } catch (e) { data = null; }
    const r = await importNotes(data);
    say(r.text, r.ok);
  });

  /* Offline drafts (b62): what's typed is kept on this device; a round that can't be saved waits in a queue and is
     saved when the connection is back. Saving the same round twice writes the same document, so a retry is safe. */
  const mem = new Map();  /* used when this view has no browser storage */
  const store = {get: (k) => { try { if (window.localStorage) return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { /* fall through */ } return mem.has(k) ? mem.get(k) : null; },
    set: (k, v) => { try { if (window.localStorage) { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return; } } catch (e) { /* fall through */ } if (v === null) mem.delete(k); else mem.set(k, v); }};
  const DRAFT = 'wb-round-draft', QUEUE = 'wb-round-queue';
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  function keepDraft() {
    if (!form.elements.date.value) return;
    const f = form.elements, r = {};
    RATINGS.forEach(([k]) => { r[k] = f['r_' + k].value; });
    store.set(DRAFT, {date: f.date.value, course: f.course.value, kind: f.kind.value, holes: f.holes.value, score: f.score.value, ratings: r,
      what: f.what.value, workon: f.workon.value, editing, photo: photo ? {id: photo.id} : null, holesList: holes, at: Date.now()});
  }
  function restoreDraft() {
    const d = store.get(DRAFT);
    if (!d || Date.now() - d.at > 14 * 864e5 || !(d.what || d.workon || d.course || d.score)) return false;
    const f = form.elements;
    f.date.value = d.date || localDate(); f.course.value = d.course || ''; f.kind.value = KINDS.includes(d.kind) ? d.kind : KINDS[1];
    f.holes.value = d.holes === '9' ? '9' : '18'; f.score.value = d.score || '';
    RATINGS.forEach(([k]) => { f['r_' + k].value = d.ratings && d.ratings[k] ? d.ratings[k] : ''; });
    f.what.value = d.what || ''; f.workon.value = d.workon || '';
    editing = d.editing || null; photo = d.photo && typeof d.photo.id === 'string' ? {id: d.photo.id} : null;
    holes = Array.isArray(d.holesList) ? cleanCard({holes: d.holesList}).holes : [];
    drawHoles(); showPhoto();
    if (editing) { $('round-save').textContent = 'Update round'; $('round-cancel').hidden = false; }
    say('Draft restored from this device.', true);
    return true;
  }
  async function flushQueue() {
    const q = store.get(QUEUE) || [];
    if (!q.length) return;
    const left = [];
    for (const job of q) { try { await within(WB.save(job.path, job.body), 8000); } catch (e) { left.push(job); } }
    store.set(QUEUE, left.length ? left : null);
    if (q.length > left.length) say(`Saved ${q.length - left.length} round${q.length - left.length === 1 ? '' : 's'} kept on this device while offline.`, true);
  }
  WB.flushRoundQueue = flushQueue;
  form.addEventListener('input', keepDraft);
  form.addEventListener('change', keepDraft);
  window.addEventListener('online', flushQueue);
  setTimeout(flushQueue, 1500);

  /* Save, edit, reset. */
  function reset() {
    store.set(DRAFT, null);
    form.reset();
    form.elements.date.value = localDate();
    editing = null; photo = null; holes = [];
    drawHoles(); showPhoto();
    $('round-save').textContent = 'Save round';
    $('round-cancel').hidden = true;
  }
  function collect() {
    const f = form.elements;
    const date = f.date.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { say('Add the date.', false); return null; }
    const ratings = {};
    RATINGS.forEach(([k]) => { const v = intIn(f['r_' + k].value, 1, 5); if (v !== null) ratings[k] = v; });
    const hs = holes.filter((h) => h.score !== null || h.par !== null || h.putts !== null || h.fairway !== null || h.green !== null);
    const now = new Date().toISOString();
    return {schema: 1, date, course: f.course.value.trim().slice(0, 80), kind: KINDS.includes(f.kind.value) ? f.kind.value : KINDS[1],
      holes_played: f.holes.value === '9' ? 9 : 18, score: intIn(f.score.value, 18, 200), ratings,
      what: f.what.value.trim().slice(0, 4000), work_on: f.workon.value.trim().slice(0, 2000),
      card: photo ? {asset: photo.id} : null, holes: hs, created_at: editing ? editing.created_at : now, updated_at: now};
  }
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const g = WB.golfer();
    if (!editing && !g) { say('Pick a golfer at the top first.', false); return; }
    const body = collect();
    if (!body) return;
    const gid = editing ? editing.gid : g.id, id = editing ? editing.id : WB.newId('r');
    const btn = $('round-save');
    btn.disabled = true;
    const path = 'golfers/' + gid + '/rounds/' + id;
    try {
      await within(WB.save(path, body), 8000);
      const was = !!editing;
      reset();
      say(was ? 'Round updated.' : 'Round saved.', true);
    } catch (e) {
      const q = (store.get(QUEUE) || []).filter((j) => j.path !== path);
      q.push({path, body});
      store.set(QUEUE, q);
      reset();
      say('No connection: the round is kept on this device and will be saved when the connection is back.', true);
    }
    btn.disabled = false;
  });
  $('round-cancel').addEventListener('click', () => { reset(); say('', true); });
  function edit(gid, r) {
    const d = r.data, f = form.elements;
    reset();
    editing = {gid, id: r.id, created_at: typeof d.created_at === 'string' ? d.created_at : new Date().toISOString()};
    f.date.value = d.date || localDate();
    f.course.value = d.course || '';
    f.kind.value = KINDS.includes(d.kind) ? d.kind : KINDS[1];
    f.holes.value = d.holes_played === 9 ? '9' : '18';
    f.score.value = d.score === null || d.score === undefined ? '' : d.score;
    RATINGS.forEach(([k]) => { const v = d.ratings && d.ratings[k]; f['r_' + k].value = v ? String(v) : ''; });
    f.what.value = d.what || '';
    f.workon.value = d.work_on || '';
    photo = d.card && typeof d.card.asset === 'string' ? {id: d.card.asset} : null;
    holes = Array.isArray(d.holes) ? cleanCard({holes: d.holes}).holes : [];
    drawHoles(); showPhoto();
    $('round-save').textContent = 'Update round';
    $('round-cancel').hidden = false;
    form.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  /* The list of rounds for the golfer picked at the top. */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  function item(g, r) {
    const d = r.data || {};
    const li = el('li', 'wb-card wb-round');
    const s = sums(Array.isArray(d.holes) ? cleanCard({holes: d.holes}).holes : []);
    const score = typeof d.score === 'number' ? d.score : s.all ? s.score : null;
    li.append(el('h3', '', [d.date, d.kind, d.course].filter(Boolean).join(' · ')));
    const line = el('p', 'wb-round-score');
    line.textContent = score === null ? 'No score entered' : 'Score ' + score + (s.all && s.toPar !== null ? ' (' + (s.toPar > 0 ? '+' : '') + s.toPar + ')' : '') +
      (s.putts !== null ? ' · ' + s.putts + ' putts' : '') + (s.fwOf ? ' · fairways ' + s.fw + '/' + s.fwOf : '') + (s.girOf ? ' · greens ' + s.gir + '/' + s.girOf : '');
    li.append(line);
    const rt = d.ratings && typeof d.ratings === 'object' ? d.ratings : {};
    const chips = el('p', 'wb-round-ratings');
    RATINGS.forEach(([k, l]) => { const v = intIn(rt[k], 1, 5); if (v !== null) chips.append(el('span', 'wb-chip ' + (v >= 4 ? 'ok' : v <= 2 ? 'warn' : 'none'), l + ' ' + v + '/5')); });
    if (chips.childNodes.length) li.append(chips);
    if (typeof d.what === 'string' && d.what) li.append(el('p', '', d.what.slice(0, 4000)));
    if (typeof d.work_on === 'string' && d.work_on) li.append(el('p', 'wb-note', 'Work on: ' + d.work_on.slice(0, 2000)));
    if (d.card && typeof d.card.asset === 'string' && /^[A-Za-z0-9_-]+$/.test(d.card.asset)) {
      const a = el('a'); a.href = '/_blob/' + d.card.asset; a.target = '_blank'; a.rel = 'noopener';
      const img = el('img', 'wb-round-thumb'); img.src = a.href; img.alt = 'Scorecard photo, ' + (d.date || ''); img.loading = 'lazy';
      a.append(img); li.append(a);
    }
    const acts = el('div', 'wb-actions wb-write');
    const eb = el('button', 'wb-btn wb-btn-sm', 'Edit'); eb.type = 'button'; eb.addEventListener('click', () => edit(g.id, r));
    acts.append(eb);
    if (typeof window.confirmButton === 'function') acts.append(window.confirmButton('Delete', 'Delete this round', () => WB.remove('golfers/' + g.id + '/rounds/' + r.id)));
    li.append(acts);
    return li;
  }
  dash.draw('rounds', (box) => {
    box.textContent = '';
    const g = WB.golfer();
    if (!g) { box.append(el('p', 'wb-note', 'Pick a golfer at the top.')); return; }
    const rs = WB.roundsFor(g.id);
    if (rs === null) { box.append(el('p', 'wb-note', 'Loading rounds…')); return; }
    if (!rs.length) { box.append(el('p', 'wb-note', 'No rounds for ' + g.name + ' yet.')); return; }
    const ul = el('ul', 'wb-rounds');
    rs.slice().sort((a, b) => String((b.data || {}).date).localeCompare(String((a.data || {}).date))).forEach((r) => ul.append(item(g, r)));
    box.append(ul);
  });

  reset();
  restoreDraft();
})();
