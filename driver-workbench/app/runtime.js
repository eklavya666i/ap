/* Driver workbench runtime: a small reactive store and drawing registry (window.dash),
   plus the hookup to Claude's db, user and desktop capabilities (window.WB). */
(function () {
  'use strict';
  var datasets = {}, calcs = {}, cache = {}, draws = {}, onDataFns = [];
  var DEFAULTS = {basis: 'logged', smash_target: 1.47, aoa: 3.5, weeks: 8, gain: 0.3, temp: 70, turf: 'normal', bagspan: 'last4'};
  var params = Object.assign({}, DEFAULTS);
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  try {
    var saved = JSON.parse(store('wb-params') || 'null');
    if (saved && typeof saved === 'object') Object.keys(DEFAULTS).forEach(function (k) { if (saved[k] !== undefined && saved[k] !== null) params[k] = saved[k]; });
  } catch (e) { /* defaults */ }

  /* Golfers: each has typed weeks and imported sessions, all subscribed at once so switching is instant. */
  var golfers = [], configLoaded = false, configDoc = null, conditionsDoc = null, selected = store('wb-golfer'), raw = {}, subs = {};
  var ID_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/;

  function golferData(id) {
    if (!configLoaded) return {status: 'loading', data: null};
    var g = selected && raw[selected];
    if (!g) return {status: 'ok', data: []};
    var v = g[id];
    return v === null || v === undefined ? {status: 'loading', data: null} : {status: 'ok', data: v};
  }
  function data(id) {
    if (id === 'typed' || id === 'imports') return golferData(id);
    if (datasets[id]) return datasets[id];
    var c = calcs[id];
    if (!c) return {status: 'missing', data: []};
    if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
    var ins = c.inputs.map(data), res;
    var bad = ins.filter(function (d) { return d.status !== 'ok'; })[0];
    if (bad) res = {status: bad.status === 'loading' ? 'loading' : 'error', data: null};
    else {
      try { res = {status: 'ok', data: c.fn.apply(null, ins.map(function (d) { return d.data; }))}; }
      catch (err) { console.error('calc ' + id, err); res = {status: 'error', data: null, message: String(err && err.message || err)}; }
    }
    cache[id] = res;
    return res;
  }
  function hiddenUp(el) { for (var e = el; e && e.nodeType === 1; e = e.parentElement) { if (e.hidden) return true; } return false; }
  function drawEl(el) {
    var name = el.getAttribute('data-draw'), fn = draws[name];
    if (!fn) return;
    try { fn(el); } catch (err) { console.error('draw ' + name, err); }
  }
  function runDraws() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-draw]')), skipped = [];
    els.forEach(function (el) { if (hiddenUp(el)) skipped.push(el); else drawEl(el); });
    skipped.forEach(function (el) { if (!hiddenUp(el)) drawEl(el); });
  }
  var queued = false;
  function clearCache() { Object.keys(cache).forEach(function (k) { delete cache[k]; }); }
  function render() {
    queued = false;
    clearCache();
    onDataFns.forEach(function (f) { try { f(); } catch (err) { console.error(err); } });
    runDraws();
  }
  function schedule() { if (queued) return; queued = true; setTimeout(render, 0); }
  function setData(id, rows, status) { datasets[id] = {status: status || 'ok', data: rows}; schedule(); }

  window.dash = {
    data: data,
    calc: function (id, spec) { calcs[id] = spec; },
    draw: function (name, fn) { draws[name] = fn; },
    onData: function (fn) { onDataFns.push(fn); },
    params: function () { return Object.assign({}, params); },
    setParams: function (o) { Object.assign(params, o); store('wb-params', JSON.stringify(params)); schedule(); },
    colors: ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'],
    set: setData,
    schedule: schedule,
    render: render,
    redraw: function (name) {
      clearCache();
      document.querySelectorAll('[data-draw]').forEach(function (el) { if (el.getAttribute('data-draw') === name && !hiddenUp(el)) drawEl(el); });
    },
  };

  var L = {smash: [1.00, 1.56], launch: [-10, 40], spin: [500, 8000]};
  var WB = window.WB = {LIMITS: L, db: null, canWrite: null, noDb: false};
  WB.COLS = ['club_speed', 'ball_speed', 'smash', 'launch', 'hla', 'spin', 'axis', 'carry', 'total', 'offline', 'peak', 'descent', 'attack', 'path', 'face', 'f2p', 'dyn_loft'];
  WB.pad2 = function (n) { return String(n).padStart(2, '0'); };
  WB.num = function (v) { return v === null || v === undefined || v === '' || typeof v === 'boolean' || !isFinite(Number(v)) ? null : Number(v); };
  WB.golfers = function () { return golfers.slice(); };
  function med(a) { if (!a.length) return null; var v = a.slice().sort(function (x, y) { return x - y; }), k = Math.floor(v.length / 2); return v.length % 2 ? v[k] : (v[k - 1] + v[k]) / 2; }
  WB.median = med;
  /* Session fingerprint: the same file or session imported twice gets the same value. */
  WB.fp = function (date, rows, cols) {
    var bi = cols.indexOf('ball_speed'), ci = cols.indexOf('club_speed');
    var s = String(date || '') + '|' + rows.length + '|' + rows.slice(0, 12).map(function (r) { return (bi < 0 ? '' : r[bi]) + '/' + (ci < 0 ? '' : r[ci]); }).join(',');
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 'f' + h.toString(16).padStart(8, '0');
  };
  /* Date-free session key: the ball and club speeds of every shot, in any order. A session saved under another date
     (for example before dates were read from GSPro file names), or split between golfers, is still recognized. */
  WB.speedPairs = function (rows, cols) {
    var bi = cols.indexOf('ball_speed'), ci = cols.indexOf('club_speed');
    var pv = function (r, i) { var v = i < 0 ? null : r[i]; return v === null || v === undefined || v === '' ? '' : String(v); };
    return rows.map(function (r) { return pv(r, bi) + '/' + pv(r, ci); });
  };
  WB.bodyKey = function (pairs) {
    var s = 'b|' + pairs.length + '|' + pairs.slice().sort().join(','), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 'b' + h.toString(16).padStart(8, '0');
  };
  /* Saved sessions by fingerprint and by date-free key, so a file dropped again is recognized; whole sessions saved without their original file can have it attached. */
  WB.knownSessions = function () {
    var map = new Map(), bodies = new Map();
    Object.keys(raw).forEach(function (gid) {
      (raw[gid].imports || []).forEach(function (s) {
        var whole = !s.src_fp || s.src_fp === s.fp;
        if (s.fp) map.set(s.fp, {gid: gid, id: s.id, has_raw: s.has_raw, whole: whole});
        if (s.src_fp && !map.has(s.src_fp)) map.set(s.src_fp, {gid: gid, id: s.id, has_raw: s.has_raw, whole: false});
        var d = s._doc || {}, rows = [];
        try { rows = JSON.parse(d.shots_json || '[]'); } catch (e) { rows = []; }
        if (!Array.isArray(rows) || !rows.length) return;
        var pairs = WB.speedPairs(rows, Array.isArray(d.cols) ? d.cols : (s.cols || []));
        var g = whole ? 'one:' + gid + '/' + s.id : 'src:' + s.src_fp, b = bodies.get(g);
        if (b) b.pairs = b.pairs.concat(pairs);
        else bodies.set(g, {pairs: pairs, ref: {gid: gid, id: s.id, has_raw: s.has_raw, whole: whole}});
      });
    });
    bodies.forEach(function (b) { var k = WB.bodyKey(b.pairs); if (!map.has(k)) map.set(k, b.ref); });
    return map;
  };
  /* Everything saved, as one JSON-ready object: golfers, typed weeks, sessions (all clubs and shots) and the backlog.
     Original CSV files stay out: they live in the raw collections and in the export folders. */
  WB.backup = function () {
    var out = {app: 'driver-workbench', format: 1, exported_at: new Date().toISOString(), config: configDoc, conditions: conditionsDoc, golfers: {}, backlog: []};
    Object.keys(raw).forEach(function (gid) {
      var g = raw[gid];
      out.golfers[gid] = {
        weeks: (g.typed || []).map(function (t) { var o = Object.assign({}, t); var id = o.id; delete o.id; return {id: id, data: o}; }),
        sessions: (g.imports || []).map(function (x) { return {id: x.id, data: x._doc}; }),
        rounds: (g.rounds || []).map(function (x) { return {id: x.id, data: x.data}; }),
      };
    });
    var bl = datasets.backlog && datasets.backlog.data;
    if (bl) out.backlog = bl.map(function (r) { var o = Object.assign({}, r); var id = o.id; delete o.id; return {id: id, data: o}; });
    return out;
  };
  /* A golfer's typical driver club speed: the speed set for them, else learned from their recent sessions or typed weeks. */
  WB.profileSpeed = function (gid, learnedOnly) {
    var g = golfers.filter(function (x) { return x.id === gid; })[0];
    if (!g) return null;
    if (!learnedOnly && g.speed) return g.speed;
    var r = raw[gid];
    if (!r) return null;
    var meds = (r.imports || []).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 10).map(function (s) {
      var ci = s.cols.indexOf('club_speed'), bi = s.cols.indexOf('ball_speed');
      if (ci < 0) return null;
      return med(s.shots.map(function (row) { var c = row[ci], bl = bi < 0 ? null : row[bi]; return c && (bl === null || (bl / c >= L.smash[0] && bl / c <= L.smash[1])) ? c : null; }).filter(function (v) { return v !== null; }));
    }).filter(function (v) { return v !== null; });
    if (meds.length) return Math.round(med(meds) * 10) / 10;
    var typed = (r.typed || []).map(function (t) { return WB.num(t.club_speed); }).filter(function (v) { return v !== null; });
    return typed.length ? med(typed.slice(-4)) : null;
  };
  /* Program week of a date for a golfer, counting from the Monday their week 1 starts. Earlier dates give 0 or negative weeks. */
  WB.programWeek = function (gid, iso) {
    var g = golfers.filter(function (x) { return x.id === gid; })[0];
    if (!g || !g.start || !/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    var p = function (s) { var q = s.split('-').map(Number); return Date.UTC(q[0], q[1] - 1, q[2]); };
    return Math.floor((p(iso) - p(g.start)) / (7 * 864e5)) + 1;
  };
  WB.wk = function (w) { return w === null || w === undefined ? '—' : w < 0 ? '−' + Math.abs(w) : String(w); };
  /* Two views of one app: the import station (the GSPro PC) and analysis by player (the iPad). */
  var mode = store('wb-mode');
  function applyMode() {
    var m = mode === 'ingest' ? 'ingest' : 'analysis';
    document.documentElement.setAttribute('data-mode', m);
    document.querySelectorAll('[data-only]').forEach(function (el) { el.hidden = el.getAttribute('data-only') !== m; });
  }
  WB.mode = function () { return mode === 'ingest' ? 'ingest' : 'analysis'; };
  WB.setMode = function (m, keep) { mode = m; if (keep !== false) store('wb-mode', m); applyMode(); clearCache(); render(); };
  WB.applyMode = applyMode;
  /* GSPro's conditions: they change carry with no swing change. Until set, the SLC preset from the project notes is assumed. */
  WB.conditions = function () {
    var c = conditionsDoc || {};
    var n = function (v, lo, hi, d) { var x = WB.num(v); return x !== null && x >= lo && x <= hi ? x : d; };
    return {altitude_ft: Math.round(n(c.altitude_ft, -500, 12000, 4450)), temp_f: Math.round(n(c.temp_f, 20, 120, 75)),
      firmness: Math.round(n(c.firmness, 1, 5, 3)), lm_carry: c.lm_carry === true, assumed: !conditionsDoc};
  };
  WB.roundsFor = function (gid) { var g = raw[gid]; return g ? g.rounds : null; };
  WB.rawFor = function (gid) { var g = raw[gid]; return g ? {typed: g.typed, imports: g.imports} : null; };
  WB.golfer = function () { return golfers.filter(function (g) { return g.id === selected; })[0] || null; };
  WB.configLoaded = function () { return configLoaded; };
  WB.setGolfer = function (id) {
    if (!golfers.some(function (g) { return g.id === id; }) || id === selected) return;
    selected = id;
    store('wb-golfer', id);
    clearCache();
    render();
  };
  /* Weeks a golfer has, with the earliest known date of each: used to suggest the week for a new file. */
  WB.weekInfo = function (gid) {
    var g = raw[gid], by = {};
    if (!g) return [];
    var add = function (w, d) {
      w = WB.num(w);
      if (w === null || !Number.isInteger(w)) return;
      var e = by[w] || (by[w] = {week: w, date: null, has_import: false, has_typed: false});
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && (!e.date || d < e.date)) e.date = d;
      return e;
    };
    (g.typed || []).forEach(function (r) { var e = add(r.week, r.date); if (e) e.has_typed = true; });
    (g.imports || []).forEach(function (r) { var e = add(r.week, r.date); if (e) e.has_import = true; });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return a.week - b.week; });
  };

  /* Per-shot statistics shared by the import preview and the saved weeks. Rows are arrays matching cols;
     speeds in mph, distances in yards, angles in degrees, spin in rpm. */
  WB.shotStats = function (cols, rows, target) {
    var ix = {};
    cols.forEach(function (c, k) { ix[c] = k; });
    var g = function (r, c) { var k = ix[c]; if (k === undefined) return null; var v = r[k]; return typeof v === 'number' && isFinite(v) ? v : null; };
    var used = [], left = [], dots = [];
    rows.forEach(function (r, n) {
      var club = g(r, 'club_speed'), ball = g(r, 'ball_speed'), la = g(r, 'launch'), sp = g(r, 'spin');
      var sm = club && ball !== null ? ball / club : null;
      var bad = ball === null || (sm !== null && (sm < L.smash[0] || sm > L.smash[1])) || (la !== null && (la < L.launch[0] || la > L.launch[1])) || (sp !== null && (sp < L.spin[0] || sp > L.spin[1]));
      (bad ? left : used).push(r);
      dots.push({i: n + 1, smash: sm, used: !bad, club: club, ball: ball});
    });
    var mean = function (a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; };
    var sd = function (a) { if (a.length < 2) return null; var m = mean(a); return Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1)); };
    var col = function (c) { return used.map(function (r) { return g(r, c); }).filter(function (v) { return v !== null; }); };
    var both = used.filter(function (r) { return g(r, 'club_speed') && g(r, 'ball_speed') !== null; });
    var clubs = both.map(function (r) { return g(r, 'club_speed'); }), balls = both.map(function (r) { return g(r, 'ball_speed'); });
    var ratios = both.map(function (r) { return g(r, 'ball_speed') / g(r, 'club_speed'); });
    var dev = col('smash');
    var rd = function (v, d) { return v === null ? null : Math.round(v * Math.pow(10, d)) / Math.pow(10, d); };
    var t = Number(target);
    return {
      n_total: rows.length, n_used: used.length, n_left: left.length,
      club_speed: rd(mean(clubs), 1),
      ball_speed: rd(clubs.length ? mean(balls) : mean(col('ball_speed')), 1),
      smash_device: dev.length ? rd(mean(dev), 3) : ratios.length ? rd(mean(ratios), 3) : null,
      smash_src: dev.length ? 'device' : ratios.length ? 'shots' : null,
      launch: rd(mean(col('launch')), 1), spin: rd(mean(col('spin')), 0), carry: rd(mean(col('carry')), 1), total: rd(mean(col('total')), 1),
      attack: rd(mean(col('attack')), 1), dyn_loft: rd(mean(col('dyn_loft')), 1), club_path: rd(mean(col('path')), 1), face_angle: rd(mean(col('face')), 1),
      sd_club: rd(sd(clubs), 1), sd_ball: rd(sd(clubs.length ? balls : col('ball_speed')), 1), sd_smash: rd(sd(ratios), 3),
      sd_carry: rd(sd(col('carry')), 1), sd_offline: rd(sd(col('offline')), 1), sd_launch: rd(sd(col('launch')), 1), sd_spin: rd(sd(col('spin')), 0),
      pct_target: ratios.length && isFinite(t) ? Math.round(100 * ratios.filter(function (v) { return v >= t - 0.0049; }).length / ratios.length) : null,
      dots: dots,
    };
  };

  function note(id, show, text) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text !== undefined) el.textContent = text;
    el.hidden = !show;
  }
  WB.note = note;
  WB.setReadOnly = function () {
    WB.canWrite = false;
    document.documentElement.classList.add('wb-readonly');
    note('ro-note', true);
  };

  WB.save = function (path, body) {
    if (!WB.db) return Promise.reject({code: 'no_db'});
    var once = function () { return WB.db.doc(path).set(body); };
    return once().catch(function (e) {
      if (e && e.code === 'unavailable') return new Promise(function (r) { setTimeout(r, 400 + Math.random() * 700); }).then(once);
      throw e;
    }).catch(function (e) {
      if (e && e.code === 'invalid_argument' && WB.canWrite !== true) WB.setReadOnly();
      throw e;
    });
  };
  WB.patch = function (path, body) {
    if (!WB.db) return Promise.reject({code: 'no_db'});
    return WB.db.doc(path).update(body);
  };
  WB.remove = function (path) {
    if (!WB.db) return Promise.reject({code: 'no_db'});
    return WB.db.doc(path).delete();
  };
  WB.newId = function (prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  WB.slug = function (name) {
    var base = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'golfer';
    var id = base, n = 2;
    while (golfers.some(function (g) { return g.id === id; })) id = base + '-' + n++;
    return id;
  };

  var parsedCache = typeof WeakMap === 'function' ? new WeakMap() : null;
  function str(v, n) { return typeof v === 'string' ? v.slice(0, n || 120) : ''; }
  /* One imported session. All clubs are kept (arows: [club, ...cols]); the analysis reads the club marked as the driver (drows).
     Columns a monitor fills with zeros for a club (attack, path, face when it reads no club data) count as not measured.
     Sessions saved before peak_unit was stored hold GSPro's peak height in feet; it is read in yards here. */
  function sessionRow(d) {
    if (parsedCache && parsedCache.has(d)) return parsedCache.get(d);
    var b = d.data() || {}, shots = [];
    try {
      var s = JSON.parse(typeof b.shots_json === 'string' ? b.shots_json : '[]');
      if (Array.isArray(s)) shots = s.filter(Array.isArray).slice(0, 2000);
    } catch (e) { shots = []; }
    var cols = Array.isArray(b.cols) ? b.cols.filter(function (c) { return typeof c === 'string'; }).slice(0, 40) : [];
    var ci = cols.indexOf('club'), driver = str(b.driver, 30);
    var dcols = cols.filter(function (c) { return c !== 'club' && WB.COLS.indexOf(c) >= 0; });
    var at = dcols.map(function (c) { return cols.indexOf(c); });
    var pk = dcols.indexOf('peak'), feet = b.peak_unit !== 'yd';
    var arows = shots.map(function (r) {
      var row = at.map(function (k) { var v = r[k]; return typeof v === 'number' && isFinite(v) ? v : null; });
      if (pk >= 0 && feet && row[pk] !== null) row[pk] = Math.round(row[pk] / 3 * 10) / 10;
      return [ci < 0 ? 'All shots' : String(r[ci] || '').slice(0, 30)].concat(row);
    });
    var groups = {};
    arows.forEach(function (r) { (groups[r[0]] = groups[r[0]] || []).push(r); });
    Object.keys(groups).forEach(function (club) {
      var g = groups[club];
      if (g.length < 3) return;
      dcols.forEach(function (c, j) {
        if (c === 'club_speed' || c === 'ball_speed') return;
        if (g.every(function (r) { return r[j + 1] === 0 || r[j + 1] === null; })) g.forEach(function (r) { r[j + 1] = null; });
      });
    });
    var drows = arows.filter(function (r) { return ci < 0 || r[0] === driver; }).map(function (r) { return r.slice(1); });
    var clubs = Array.isArray(b.clubs) ? b.clubs.filter(function (c) { return c && typeof c.club === 'string'; }).map(function (c) { return {club: c.club.slice(0, 30), n: WB.num(c.n) || 0}; }).slice(0, 30) : [];
    var row = {
      id: d.id, week: WB.num(b.week), date: str(b.date, 10), file: str(b.file, 160), units: str(b.units, 40), imported_at: str(b.imported_at, 40),
      driver: driver, clubs: clubs, n_all: shots.length, cols: dcols, shots: drows, arows: arows,
      fp: str(b.fp, 60) || WB.fp(str(b.date, 10), shots, cols), src_fp: str(b.src_fp, 60), date_from: str(b.date_from, 10),
      has_raw: b.has_raw === true, schema: WB.num(b.schema) || 1, _doc: b,
    };
    if (parsedCache) parsedCache.set(d, row);
    return row;
  }

  function noDb() {
    WB.noDb = true;
    configLoaded = true;
    setData('backlog', [], 'ok');
    note('db-note', true, 'Saving is off in this view. Open the workbench in the Claude app or on claude.ai while signed in. You can still preview a CSV here.');
    schedule();
  }

  async function setupUser() {
    try {
      var user = await window.claude.use('user');
      if (!user) return;
      var own = await user.isOwner();
      if (own === false) WB.setReadOnly();
      else if (own === true) WB.canWrite = true;
    } catch (e) { /* unknown: keep the inputs; a refused write decides */ }
  }

  function drawIcon() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var g = null;
    try { g = c.getContext && c.getContext('2d'); } catch (e) { g = null; }
    if (!g) return null;
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#17673f'); grd.addColorStop(1, '#0a3424');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(0, 200, 256, 56);
    g.strokeStyle = '#f2c230'; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 190); g.quadraticCurveTo(150, 18, 224, 158); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(56, 192, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(15,74,51,0.28)';
    [[-12, -10], [2, -15], [14, -5], [-4, 1], [10, 10], [-14, 9], [0, 17], [-20, -1], [20, 4]].forEach(function (p) { g.beginPath(); g.arc(56 + p[0], 192 + p[1], 3.2, 0, Math.PI * 2); g.fill(); });
    return c.toDataURL('image/png');
  }

  async function setupDesktop() {
    var desktop = null;
    try { desktop = await window.claude.use('desktop'); } catch (e) { desktop = null; }
    if (!desktop) return;
    if (desktop.app && desktop.app.dock) {
      document.documentElement.classList.add('wb-app');
      if (!store('wb-mode')) WB.setMode('ingest', false);
      var icon = drawIcon();
      if (icon) { try { desktop.app.dock.setIcon(icon).catch(function () {}); } catch (e) { /* icon optional */ } }
    }
    if (!desktop.install) return;
    var st = 'unavailable';
    try { st = await desktop.install.state(); } catch (e) { st = 'unavailable'; }
    var btn = document.getElementById('install');
    if (!btn || st !== 'available') return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      desktop.install.request().then(function (r) {
        if (r === 'installed') { btn.textContent = 'Installing as an app…'; btn.disabled = true; }
        else if (r === 'unavailable' || r === 'failed') btn.hidden = true;
      }).catch(function () { /* needs a click: nothing to do */ });
    });
  }

  function subscribeGolfer(db, gid) {
    if (subs[gid]) return;
    raw[gid] = {typed: null, imports: null, rounds: null};
    var fail = function (k, what) {
      return function () { raw[gid][k] = []; note('db-note', true, 'Some ' + what + ' couldn’t be loaded. Reopen the workbench to try again.'); schedule(); };
    };
    var u1 = db.collection('golfers/' + gid + '/weeks').onSnapshot(function (snap) {
      raw[gid].typed = snap.docs.filter(function (d) { return d.exists; }).map(function (d) { return Object.assign({id: d.id}, d.data()); });
      schedule();
    }, fail('typed', 'typed weeks'));
    var u2 = db.collection('golfers/' + gid + '/sessions').onSnapshot(function (snap) {
      raw[gid].imports = snap.docs.filter(function (d) { return d.exists; }).map(sessionRow);
      schedule();
    }, fail('imports', 'imported sessions'));
    var u3 = db.collection('golfers/' + gid + '/rounds').onSnapshot(function (snap) {
      raw[gid].rounds = snap.docs.filter(function (d) { return d.exists; }).map(function (d) { return {id: d.id, data: d.data()}; });
      schedule();
    }, fail('rounds', 'rounds'));
    subs[gid] = [u1, u2, u3];
  }

  async function boot() {
    setData('backlog', null, 'loading');
    render();
    var c = window.claude;
    if (!c || typeof c.use !== 'function') { noDb(); return; }
    setupUser();
    setupDesktop();
    var db = null;
    try { db = await c.use('db'); } catch (e) { db = null; }
    if (!db) { noDb(); return; }
    WB.db = db;
    var timer = setTimeout(function () {
      var g = selected && raw[selected];
      if (!configLoaded || (g && (g.typed === null || g.imports === null))) note('db-note', true, 'Your saved data can’t be reached yet. Anything shown may be out of date.');
    }, 10000);
    db.doc('config/conditions').onSnapshot(function (snap) { conditionsDoc = snap.exists ? snap.data() : null; schedule(); }, function () {});
    db.doc('config/golfers').onSnapshot(function (snap) {
      configDoc = snap.exists ? snap.data() : null;
      var list = configDoc && Array.isArray(configDoc.list) ? configDoc.list : [];
      golfers = list.filter(function (g) { return g && typeof g.id === 'string' && ID_RE.test(g.id) && typeof g.name === 'string'; })
        .map(function (g) {
          var sp = WB.num(g.speed);
          return {id: g.id, name: g.name.slice(0, 30), start: typeof g.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.start) ? g.start : null, speed: sp !== null && sp >= 40 && sp <= 160 ? sp : null};
        }).slice(0, 8);
      golfers.forEach(function (g) { subscribeGolfer(db, g.id); });
      if (!golfers.some(function (g) { return g.id === selected; })) selected = golfers.length ? golfers[0].id : null;
      if (!snap.metadata || !snap.metadata.fromCache) { configLoaded = true; }
      else if (golfers.length) configLoaded = true;
      if (configLoaded) { clearTimeout(timer); note('db-note', false); }
      schedule();
    }, function () {
      configLoaded = true;
      note('db-note', true, 'The golfer list couldn’t be loaded. Reopen the workbench to try again.');
      schedule();
    });
    db.collection('backlog').onSnapshot(function (snap) {
      setData('backlog', snap.docs.filter(function (d) { return d.exists; }).map(function (d) { return Object.assign({id: d.id}, d.data()); }));
    }, function () { setData('backlog', [], 'ok'); });
  }

  /* Charts redraw when their box changes width. */
  function watchSizes() {
    if (typeof ResizeObserver !== 'function') return;
    var widths = new Map(), pending = new Set(), t = null;
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (en) {
        var w = Math.round(en.contentRect.width);
        if (widths.get(en.target) !== w) { widths.set(en.target, w); pending.add(en.target); }
      });
      clearTimeout(t);
      t = setTimeout(function () { pending.forEach(function (el) { if (!hiddenUp(el)) drawEl(el); }); pending.clear(); }, 140);
    });
    document.querySelectorAll('.wb-chartbox[data-draw]').forEach(function (el) { ro.observe(el); });
  }

  window.dash.start = function () { applyMode(); watchSizes(); boot(); };
})();
