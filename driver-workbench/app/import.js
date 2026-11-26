/* GSPro import station. Files are read on this device and split into sessions by date. Each session is sorted to a golfer by
   club speed (or goes to the golfer whose card it was dropped on), sessions where both golfers hit are split shot by shot,
   sessions already saved are skipped, and every club and shot is kept for history. The analysis uses the driver. */
(function () {
  'use strict';
  const MAX_BYTES = 20 * 1024 * 1024, MAX_ROWS = 100000, MAX_KEEP = 800, MAX_FILES = 300, NEAR = 6;
  const S = {mode: 'auto', golfer: null, files: [], club: null, units: 'auto', sessions: [], choice: {}, week: null, busy: false, reading: 0};

  const FIELDS = [
    ['club', ['club', 'clubname', 'clubtype', 'clubs', 'clubid']],
    ['shotno', ['shot', 'shotno', 'shotnumber', 'shotid', 'no', 'num', 'number', 'id', 'index', 'globalshotnumber']],
    ['date', ['date', 'datetime', 'time', 'timestamp', 'shottime', 'datetimeutc', 'sessiondate', 'rounddate']],
    ['ball_speed', ['ballspeed', 'ballspd', 'ballvelocity', 'speedball', 'bs']],
    ['club_speed', ['clubspeed', 'clubheadspeed', 'clubspd', 'chs', 'clubheadspd', 'swingspeed', 'cs', 'headspeed']],
    ['smash', ['smashfactor', 'smash', 'efficiency', 'smachfactor']],
    ['launch', ['vla', 'launchangle', 'launch', 'verticallaunchangle', 'verticallaunch', 'launchv', 'launchvertical', 'la', 'launchanglev']],
    ['hla', ['hla', 'launchdirection', 'horizontallaunchangle', 'horizontallaunch', 'direction', 'launchh', 'launchhorizontal', 'startdirection']],
    ['spin', ['totalspin', 'spin', 'spinrate', 'totalspinrate', 'ballspin']],
    ['back', ['backspin', 'backspinrate']],
    ['side', ['sidespin', 'sidespinrate']],
    ['axis', ['spinaxis', 'axis', 'spintilt', 'spinaxistilt']],
    ['carry', ['carry', 'carrydistance', 'carrydist', 'carryyards']],
    ['total', ['total', 'totaldistance', 'totaldist', 'totalyards', 'distance']],
    ['offline', ['offline', 'carryoffline', 'lateral', 'carrylateral', 'lateraldistance', 'carrydeviation', 'deviation', 'carryside', 'side', 'offlinecarry', 'carrydeviationdistance']],
    ['peak', ['peakheight', 'apex', 'height', 'maxheight', 'apexheight', 'peak']],
    ['descent', ['descentangle', 'landingangle', 'descent', 'landangle']],
    ['attack', ['aoa', 'attackangle', 'angleofattack', 'attack']],
    ['path', ['path', 'clubpath', 'swingpath']],
    ['face', ['facetotarget', 'faceangle', 'face', 'clubface', 'facetotgt']],
    ['f2p', ['facetopath', 'ftp']],
    ['dyn_loft', ['dynamicloft', 'dynloft', 'loft', 'deliveredloft']],
  ];
  const SYN = new Map();
  FIELDS.forEach(([f, names]) => names.forEach((n) => SYN.set(n, f)));
  const SPEEDS = ['ball_speed', 'club_speed'], DISTS = ['carry', 'total', 'offline', 'peak'];
  const NAMES = {club_speed: 'club speed', ball_speed: 'ball speed', smash: 'smash', launch: 'launch (VLA)', hla: 'direction (HLA)', spin: 'spin', back: 'back spin', side: 'side spin', axis: 'spin axis', carry: 'carry', total: 'total', offline: 'offline', peak: 'peak height', descent: 'descent angle', attack: 'attack angle', path: 'club path', face: 'face to target', f2p: 'face to path', dyn_loft: 'dynamic loft', club: 'club', shotno: 'shot number', date: 'date'};
  const pad2 = WB.pad2, median = WB.median;

  function detectDelim(line) {
    const c = {',': 0, ';': 0, '\t': 0};
    let q = false;
    for (const ch of line) { if (ch === '"') q = !q; else if (!q && ch in c) c[ch]++; }
    if (c['\t'] > c[','] && c['\t'] >= c[';']) return '\t';
    return c[';'] > c[','] ? ';' : ',';
  }
  function splitRows(text, d) {
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === d) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = ''; rows.push(row); row = [];
        if (rows.length > MAX_ROWS) break;
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
  }
  function normHeader(h) {
    let b = String(h || '').replace(/[\[(][^\])]*[\])]/g, ' ').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!SYN.has(b)) {
      const t = b.replace(/(mph|kmh|kph|kmt|mps|ms|yds|yd|yards|meters|metres|m|ft|feet|deg|degrees|rpm)$/, '');
      if (SYN.has(t)) b = t;
    }
    return b;
  }
  function speedUnit(t) {
    t = String(t || '').toLowerCase();
    if (/mph|mi\/h/.test(t)) return 'mph';
    if (/km\/?h|kph|km\/t|kmh/.test(t)) return 'kmh';
    if (/m\/s|mps|\bms\b/.test(t)) return 'ms';
    return null;
  }
  function distUnit(t) {
    t = String(t || '').toLowerCase();
    if (/\byds?\b|yards?/.test(t)) return 'yd';
    if (/\bft\b|feet/.test(t)) return 'ft';
    if (/\bm\b|meters?|metres?/.test(t)) return 'm';
    return null;
  }
  function toNum(s, dec) {
    if (s === null || s === undefined) return null;
    let t = String(s).trim().replace(/−/g, '-');
    if (!t || /^(-|—|n\/?a|null|nan|none)$/i.test(t)) return null;
    let sign = 1;
    let m = t.match(/^(.*?\d.*?)\s*([LR])$/i);
    if (m) { t = m[1]; if (m[2].toUpperCase() === 'L') sign = -1; }
    m = t.match(/^([LR])\s*(.*\d.*)$/i);
    if (m) { t = m[2]; if (m[1].toUpperCase() === 'L') sign = -1; }
    const re = dec === ',' ? /[+-]?\d[\d.]*(?:,\d+)?/ : /[+-]?\d[\d,]*(?:\.\d+)?|[+-]?\.\d+/;
    const hit = t.match(re);
    if (!hit) return null;
    let n = hit[0];
    n = dec === ',' ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
    const v = Number(n);
    return isFinite(v) ? v * sign : null;
  }
  function isDriver(c) { return /^(dr|driver|1w|w1|d|drv|1 wood|wood 1|1-wood)$/i.test(String(c).trim()) || /driver/i.test(String(c)); }
  /* Club speed of a club as a share of driver speed, from tour averages; null when the label isn't a known club. */
  function clubRatio(label) {
    const c = String(label || '').toLowerCase().replace(/[\s_-]+/g, '');
    if (isDriver(label)) return 1;
    let m;
    if ((m = c.match(/^(\d)(?:w|wood)$/) || c.match(/^w(\d)$/))) return {2: 0.97, 3: 0.955, 4: 0.94, 5: 0.925, 7: 0.9, 9: 0.885}[m[1]] || 0.92;
    if ((m = c.match(/^(\d)(?:h|hy|hyb|hybrid)$/) || c.match(/^h(\d)$/))) return 0.89 - 0.01 * (Number(m[1]) - 3);
    if ((m = c.match(/^(\d)(?:i|iron)$/) || c.match(/^i(\d)$/))) return Math.max(0.74, 0.87 - 0.0183 * (Number(m[1]) - 3));
    if (/^(pw|p|pitchingwedge|pitching)$/.test(c)) return 0.74;
    if (/^(gw|aw|uw|gapwedge|approachwedge)$/.test(c)) return 0.72;
    if (/^(sw|sandwedge)$/.test(c)) return 0.7;
    if (/^(lw|lobwedge)$/.test(c)) return 0.68;
    if ((m = c.match(/^(\d{2})(?:°|deg)?$/)) && Number(m[1]) >= 44 && Number(m[1]) <= 64) return 0.74 - (Number(m[1]) - 46) * 0.004;
    return null;
  }
  function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseDate(s) {
    s = String(s || '').trim();
    let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
    m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + pad2(m[1]) + '-' + pad2(m[2]); }
    if (!/[a-z]{3}|\d{1,2}:\d{2}/i.test(s)) return null;
    const t = Date.parse(s);
    return isFinite(t) ? fmtDate(new Date(t)) : null;
  }
  function nameDate(name) {
    const s = String(name || '');
    let m = s.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})/);
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/(\d{1,2})[-_.](\d{1,2})[-_.](20\d{2})/);
    if (m && +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= 31) return `${m[3]}-${pad2(m[1])}-${pad2(m[2])}`;
    return null;
  }

  function parse(text) {
    text = String(text || '').replace(/^﻿/, '');
    if (!text.trim()) return {error: 'The file is empty.'};
    const firstLines = text.slice(0, 20000).split(/\r?\n/).slice(0, 12);
    const delim = detectDelim(firstLines.find((l) => l.trim()) || '');
    const rows = splitRows(text, delim);
    let hi = -1, map = null;
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const m = {};
      rows[r].forEach((h, k) => { const nh = normHeader(h), f = SYN.get(nh); if (f && (m[f] === undefined || nh === 'globalshotnumber')) m[f] = k; });
      if (m.ball_speed !== undefined && Object.keys(m).length >= 3) { hi = r; map = m; break; }
    }
    if (hi < 0) return {error: 'No ball-speed column found. Is this a GSPro shot export?'};
    const header = rows[hi];
    let start = hi + 1, unitRow = null;
    const nxt = rows[start];
    if (nxt) {
      const filled = nxt.filter((c) => c !== '');
      const textOnly = filled.filter((c) => !/\d/.test(c) || /^\[.*\]$/.test(c));
      if (filled.length && textOnly.length / filled.length > 0.6 && filled.some((c) => /mph|deg|rpm|yds?|m\/s|km\/h|°|\[/.test(c.toLowerCase()))) { unitRow = nxt; start++; }
    }
    let dots = 0, commas = 0;
    rows.slice(start, start + 30).forEach((r) => r.forEach((c) => { if (/^[+-]?\d+,\d+$/.test(c)) commas++; else if (/^[+-]?\d+\.\d+$/.test(c)) dots++; }));
    const dec = delim !== ',' && commas > dots ? ',' : '.';
    const unitText = (f) => (map[f] === undefined ? '' : header[map[f]] + ' ' + (unitRow ? unitRow[map[f]] || '' : ''));
    const detected = {};
    SPEEDS.forEach((f) => { if (map[f] !== undefined) detected[f] = speedUnit(unitText(f)); });
    DISTS.forEach((f) => { if (map[f] !== undefined) detected[f] = distUnit(unitText(f)); });
    const shots = [], clubs = new Map();
    let summary = 0;
    for (let r = start; r < rows.length; r++) {
      const row = rows[r];
      const label = [map.club, map.shotno, 0].map((k) => (k === undefined ? '' : row[k] || '')).join(' ').toLowerCase();
      if (/\b(avg|average|averages|mean|median|std|stdev|deviation|min|max|total|totals|summary|consistency)\b/.test(label)) { summary++; continue; }
      const ball = toNum(row[map.ball_speed], dec);
      if (ball === null) continue;
      const v = {};
      Object.keys(map).forEach((f) => { if (f !== 'club' && f !== 'shotno' && f !== 'date') v[f] = toNum(row[map[f]], dec); });
      const club = map.club !== undefined ? (row[map.club] || '').trim().slice(0, 30) || 'Unlabelled' : 'All shots';
      shots.push({club, v, n: map.shotno !== undefined ? toNum(row[map.shotno], dec) : null, d: map.date !== undefined ? parseDate(row[map.date]) : null});
      clubs.set(club, (clubs.get(club) || 0) + 1);
    }
    if (!shots.length) return {error: 'No shots found in this file.'};
    if (shots.every((s) => s.n !== null)) shots.sort((a, b) => (a.d || '').localeCompare(b.d || '') || a.n - b.n);
    const unmapped = header.filter((h, k) => h && !Object.values(map).includes(k)).slice(0, 30);
    return {delim, dec, map, mapped: Object.keys(map), unmapped, detected, unitRow: !!unitRow, shots, clubs, summary};
  }

  const MODES = {imperial: ['mph', 'yd'], ms: ['ms', 'm'], kmh: ['kmh', 'm']};
  /* All shots of one parsed file in standard units: rows are [club, ...cols], with each shot's date beside it. */
  function standardize(p, mode) {
    const SPD = {mph: 1, ms: 2.2369363, kmh: 0.6213712}, DST = {yd: 1, m: 1.0936133, ft: 1 / 3};
    const unitOf = (f) => (mode !== 'auto' ? (SPEEDS.includes(f) ? MODES[mode][0] : MODES[mode][1]) : p.detected[f] || (SPEEDS.includes(f) ? 'mph' : 'yd'));
    const assumed = mode === 'auto' && [...SPEEDS, 'carry'].some((f) => p.map[f] !== undefined && !p.detected[f]);
    const hasSpin = p.map.spin !== undefined || p.map.back !== undefined;
    const hasAxis = p.map.axis !== undefined || (p.map.back !== undefined && p.map.side !== undefined);
    const cols = WB.COLS.filter((f) => (f === 'spin' ? hasSpin : f === 'axis' ? hasAxis : p.map[f] !== undefined));
    const rows = p.shots.map((s) => [s.club].concat(cols.map((f) => {
      let v;
      if (f === 'spin') v = s.v.spin !== null && s.v.spin !== undefined ? s.v.spin : (s.v.back !== null && s.v.back !== undefined ? Math.hypot(s.v.back, s.v.side || 0) : null);
      else if (f === 'axis' && (s.v.axis === null || s.v.axis === undefined)) v = typeof s.v.back === 'number' && typeof s.v.side === 'number' && s.v.back > 0 ? Math.atan2(s.v.side, s.v.back) * 180 / Math.PI : null;
      else v = s.v[f];
      if (v === null || v === undefined || !isFinite(v)) return null;
      if (SPEEDS.includes(f)) v *= SPD[unitOf(f)] || 1;
      if (DISTS.includes(f)) v *= DST[unitOf(f)] || 1;
      const d = f === 'smash' ? 3 : f === 'spin' ? 0 : 1;
      return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    })));
    const su = unitOf('ball_speed'), du = p.map.carry !== undefined ? unitOf('carry') : 'yd';
    return {cols, rows, dates: p.shots.map((s) => s.d), units: {mph: 'mph', ms: 'm/s', kmh: 'km/h'}[su] + ' and ' + {yd: 'yards', m: 'meters', ft: 'feet'}[du], assumed};
  }

  /* Best split of speeds into a slower and a faster group; a session is mixed when the groups sit well apart. */
  function split2(vals) {
    const v = vals.slice().sort((a, b) => a - b), n = v.length;
    if (n < 6) return null;
    let best = null;
    for (let i = 3; i <= n - 3; i++) {
      const lo = v.slice(0, i), hi = v.slice(i), ml = lo.reduce((s, x) => s + x, 0) / lo.length, mh = hi.reduce((s, x) => s + x, 0) / hi.length;
      const ss = lo.reduce((s, x) => s + (x - ml) * (x - ml), 0) + hi.reduce((s, x) => s + (x - mh) * (x - mh), 0);
      if (!best || ss < best.ss) best = {ss, ml, mh, nl: lo.length, nh: hi.length, t: (v[i - 1] + v[i]) / 2};
    }
    const sd = Math.sqrt(best.ss / Math.max(1, n - 2));
    return best.mh - best.ml >= NEAR - 1 && best.mh - best.ml >= 2.5 * sd ? Object.assign(best, {sd}) : null;
  }
  function validClubSpeed(row, cols) {
    const ci = cols.indexOf('club_speed'), bi = cols.indexOf('ball_speed');
    const c = ci < 0 ? null : row[ci + 1], b = bi < 0 ? null : row[bi + 1];
    return typeof c === 'number' && c > 0 && (typeof b !== 'number' || (b / c >= WB.LIMITS.smash[0] && b / c <= WB.LIMITS.smash[1])) ? c : null;
  }
  function golferName(id) { const g = WB.golfers().find((x) => x.id === id); return g ? g.name : 'this golfer'; }
  function profiles(batchSpeeds) {
    const prof = WB.golfers().map((g) => ({id: g.id, name: g.name, d: WB.profileSpeed(g.id), learned: false}));
    const unknown = prof.filter((p) => p.d === null);
    if (unknown.length === 1 && prof.some((p) => p.d !== null)) {
      const rest = batchSpeeds.filter((v) => prof.every((p) => p.d === null || Math.abs(v - p.d) > NEAR));
      if (rest.length) { unknown[0].d = Math.round(median(rest) * 10) / 10; unknown[0].learned = true; }
    }
    return prof;
  }
  function nearest(cs, ratio, prof) {
    let best = null, bd = Infinity;
    prof.forEach((p) => { if (p.d === null) return; const dd = Math.abs(cs - p.d * ratio); if (dd < bd) { bd = dd; best = p.id; } });
    return best;
  }
  function fileDateInfo(f) {
    const n = nameDate(f.name);
    if (n) return {date: n, from: 'name'};
    if (f.lastModified) return {date: fmtDate(new Date(f.lastModified)), from: 'saved'};
    return {date: fmtDate(new Date()), from: 'today'};
  }
  function driverOf(clubs) {
    if (S.club && clubs.has(S.club)) return S.club;
    const dr = [...clubs.keys()].filter(isDriver).sort((a, b) => clubs.get(b) - clubs.get(a));
    return dr[0] || '';
  }

  /* Files to sessions (one per date), each with a fingerprint, a driver speed, and a golfer guess. */
  function build() {
    const out = [], fps = WB.knownFps(), seen = new Set();
    S.files.filter((f) => f.parsed).forEach((f) => {
      const st = standardize(f.parsed, S.units), fd = fileDateInfo(f);
      const groups = new Map();
      st.rows.forEach((r, i) => { const d = st.dates[i] || fd.date; if (!groups.has(d)) groups.set(d, []); groups.get(d).push(r); });
      const multi = groups.size > 1;
      [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, rowsAll]) => {
        const rows = rowsAll.slice(-MAX_KEEP);
        const clubs = new Map();
        rows.forEach((r) => clubs.set(r[0], (clubs.get(r[0]) || 0) + 1));
        const driver = driverOf(clubs);
        const dvals = rows.filter((r) => r[0] === driver).map((r) => validClubSpeed(r, st.cols)).filter((v) => v !== null);
        const fp = WB.fp(date, rows, ['club'].concat(st.cols));
        const s = {key: f.name + '|' + date, file: f.name, label: multi ? f.name + ' · ' + date : f.name, date, dateFrom: st.dates.some(Boolean) ? 'file' : fd.from,
          cols: st.cols, rows, units: st.units, assumed: st.assumed, dropped: rowsAll.length - rows.length, clubs, driver, dvals, dspeed: median(dvals), fp, dup: fps.has(fp) || seen.has(fp)};
        seen.add(fp);
        let mix = dvals.length >= 6 ? split2(dvals) : null;
        if (!mix) {
          const top = [...clubs.entries()].sort((a, b) => b[1] - a[1])[0];
          if (top && top[0] !== driver) { const tv = rows.filter((r) => r[0] === top[0]).map((r) => validClubSpeed(r, st.cols)).filter((v) => v !== null); if (tv.length >= 6) mix = split2(tv); }
        }
        s.mix = mix;
        out.push(s);
      });
    });
    const batch = [];
    out.forEach((s) => { if (s.mix && s.dvals.length >= 6) batch.push(s.mix.ml, s.mix.mh); else if (s.dspeed !== null) batch.push(s.dspeed); });
    const prof = profiles(batch);
    const known = prof.filter((p) => p.d !== null).length;
    out.forEach((s) => {
      const votes = {};
      s.owner = s.rows.map((r) => { const cs = validClubSpeed(r, s.cols), ratio = clubRatio(r[0]); const o = cs !== null && ratio ? nearest(cs, ratio, prof) : null; if (o) votes[o] = (votes[o] || 0) + 1; return o; });
      const tot = Object.values(votes).reduce((a, b) => a + b, 0);
      const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
      const share = top && tot ? top[1] / tot : 0;
      const mixed = known >= 2 && s.mix && nearest(s.mix.ml, 1, prof) !== nearest(s.mix.mh, 1, prof);
      s.mixed = !!mixed;
      s.canSplit = known >= 2;
      s.flag = '';
      if (S.mode === 'card') {
        s.guess = mixed ? 'split' : S.golfer;
        if (mixed) s.flag = 'Both golfers’ speeds in one session: split by speed.';
        else if (top && top[0] !== S.golfer && share >= 0.7 && s.dspeed !== null) {
          const pd = prof.find((p) => p.id === S.golfer);
          if (!pd || pd.d === null || Math.abs(s.dspeed - pd.d) > NEAR) s.flag = `Driver speed ${s.dspeed.toFixed(1)} mph looks like ${golferName(top[0])}’s.`;
        }
      } else {
        s.guess = mixed ? 'split' : top && share >= 0.6 ? top[0] : s.dspeed !== null ? nearest(s.dspeed, 1, prof) : null;
        if (mixed) s.flag = 'Both golfers’ speeds in one session: split by speed.';
        else if (!s.guess) s.flag = 'No club speed to sort by: choose the golfer.';
      }
      const fallback = top ? top[0] : s.guess && s.guess !== 'split' ? s.guess : null;
      s.parts = {};
      s.rows.forEach((r, i) => { const o = s.owner[i] || fallback; if (!o) return; (s.parts[o] = s.parts[o] || []).push(r); });
    });
    S.sessions = out;
    S.prof = prof;
    if (out.length === 1 && !S.weekTouched) S.week = weekFor(golferOf(out[0]) || S.golfer, out[0].date);
  }
  function golferOf(s) { const c = S.choice[s.key]; return c !== undefined ? c : s.guess; }

  /* Weeks count from each golfer's week 1; without one, the next week after their latest. */
  function weekFor(gid, date) {
    if (!gid || gid === 'skip') return null;
    if (gid === 'split') { const ids = WB.golfers().map((g) => g.id); return weekFor(ids[0], date); }
    const pw = WB.programWeek(gid, date);
    if (pw !== null) return pw;
    const info = WB.weekInfo(gid);
    return info.length ? info[info.length - 1].week + 1 : 1;
  }

  const $ = (id) => document.getElementById(id);
  function msg(id) { ['imp-saved', 'imp-week', 'imp-bad', 'imp-unsaved'].forEach((m) => { const el = $(m); if (el) el.hidden = m !== id; }); }
  function refresh() { dash.redraw('dropcards'); dash.redraw('pvstate'); dash.redraw('importpreview'); }

  function start(mode, gid, list) {
    if (WB.canWrite === false || S.busy) return;
    const files = Array.from(list || []).filter((f) => f && typeof f.name === 'string');
    if (!files.length) return;
    if (mode === 'card' && !gid) mode = 'auto';
    S.mode = mode; S.golfer = gid || null; S.files = []; S.club = null; S.choice = {}; S.week = null; S.weekTouched = false; S.sessions = [];
    msg(null);
    const take = files.slice(0, MAX_FILES);
    S.over = files.length - take.length;
    S.reading = take.length;
    refresh();
    take.forEach((file) => {
      const entry = {name: String(file.name || 'file').slice(0, 140), lastModified: file.lastModified || null, parsed: null, error: null};
      S.files.push(entry);
      const done = () => { S.reading--; if (!S.reading) { build(); refresh(); const pv = $('import-preview'); if (pv && pv.scrollIntoView) pv.scrollIntoView({behavior: 'smooth', block: 'nearest'}); } };
      if (file.size > MAX_BYTES) { entry.error = 'Over 20 MB; export a shorter range of dates.'; done(); return; }
      const read = file.text ? file.text() : new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = rej; r.readAsText(file); });
      read.then((t) => { const p = parse(t); if (p.error) entry.error = p.error; else entry.parsed = p; }, () => { entry.error = 'Couldn’t be read.'; }).then(done);
    });
  }
  function startText(text) { start('auto', null, [{name: 'Pasted text', lastModified: Date.now(), size: text.length, text: () => Promise.resolve(text)}]); }

  function tile(grid, lab, val) {
    const c = document.createElement('div');
    const l = document.createElement('div'); l.className = 'wb-lab'; l.textContent = lab;
    const n = document.createElement('div'); n.className = 'wb-num'; n.textContent = val;
    c.append(l, n); grid.append(c);
  }
  function golferSelect(s, onChange) {
    const sel = document.createElement('select');
    sel.className = 'wb-gsel';
    sel.setAttribute('aria-label', 'Golfer for ' + s.label);
    const opts = WB.golfers().map((g) => [g.id, g.name]);
    if (s.canSplit) opts.push(['split', 'Split by speed']);
    opts.push(['skip', 'Skip']);
    if (!golferOf(s)) opts.unshift(['', 'Choose…']);
    opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.append(o); });
    sel.value = golferOf(s) || '';
    sel.addEventListener('change', () => { S.choice[s.key] = sel.value || null; onChange(); });
    return sel;
  }
  function splitText(s) { return Object.entries(s.parts).map(([g, r]) => golferName(g) + ' ' + r.length).join(', '); }

  dash.draw('dropcards', (el) => {
    const list = WB.golfers();
    const key = list.map((g) => g.id + ':' + g.name).join('|') + '#' + WB.configLoaded();
    if (el.dataset.key === key && el.children.length) {
      el.querySelectorAll('.wb-drop').forEach((c) => c.classList.toggle('target', S.files.length > 0 && (c.dataset.g === S.golfer || (c.dataset.g === 'auto' && S.mode === 'auto'))));
      return;
    }
    el.dataset.key = key;
    el.replaceChildren();
    if (!list.length) {
      const p = document.createElement('p'); p.className = 'wb-note';
      p.textContent = WB.configLoaded() ? (WB.noDb ? 'Golfers and saving need you signed in to Claude.' : 'Add a golfer first.') : 'Loading golfers…';
      el.append(p);
      return;
    }
    const cards = [{g: 'auto', main: 'Sort by club speed', sub: 'Drop any GSPro files. Each session goes to ' + list.map((g) => g.name).join(' or ') + ' by club speed; sessions where both hit are split.'}]
      .concat(list.map((g) => ({g: g.id, main: g.name, sub: 'Only ' + g.name + '’s files'})));
    cards.forEach((cd) => {
      const card = document.createElement('label');
      card.className = 'wb-drop wb-write' + (cd.g === 'auto' ? ' wb-drop-auto' : ''); card.dataset.g = cd.g; card.tabIndex = 0;
      const t = document.createElement('span'); t.className = 'wb-drop-main'; t.textContent = cd.main;
      const s = document.createElement('span'); s.className = 'wb-drop-sub'; s.textContent = cd.sub;
      const inp = document.createElement('input');
      inp.type = 'file'; inp.multiple = true; inp.accept = '.csv,.tsv,.txt,text/csv,text/plain,text/comma-separated-values,application/vnd.ms-excel'; inp.className = 'wb-visually-hidden';
      inp.setAttribute('aria-label', cd.g === 'auto' ? 'Choose GSPro files to sort by club speed' : 'Choose ' + cd.main + '’s GSPro files');
      const go = (files) => (cd.g === 'auto' ? start('auto', null, files) : start('card', cd.g, files));
      inp.addEventListener('change', () => { go(inp.files); inp.value = ''; });
      card.append(t, s, inp);
      card.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); card.classList.add('over'); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
      card.addEventListener('dragleave', () => card.classList.remove('over'));
      card.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); card.classList.remove('over'); document.documentElement.classList.remove('wb-dragging'); go(e.dataTransfer && e.dataTransfer.files); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
      el.append(card);
    });
  });
  dash.draw('pvstate', () => { const w = $('import-preview'); if (w) w.hidden = !S.files.length; });

  dash.draw('importpreview', (el) => {
    el.replaceChildren();
    if (!S.files.length) return;
    const sb = $('csvsave'), single = S.sessions.length === 1;
    const head = document.createElement('h3');
    if (S.reading) { head.textContent = `Reading ${S.files.length} file${S.files.length === 1 ? '' : 's'}…`; el.append(head); if (sb) sb.disabled = true; return; }
    const bad = S.files.filter((f) => f.error);
    head.textContent = S.mode === 'card' ? `For ${golferName(S.golfer)}: ${S.sessions.length} session${S.sessions.length === 1 ? '' : 's'} from ${S.files.length - bad.length} file${S.files.length - bad.length === 1 ? '' : 's'}` : `${S.sessions.length} session${S.sessions.length === 1 ? '' : 's'} from ${S.files.length - bad.length} file${S.files.length - bad.length === 1 ? '' : 's'}, sorted by club speed`;
    el.append(head);
    if (bad.length || S.over) {
      const ul = document.createElement('ul'); ul.className = 'wb-files';
      bad.forEach((f) => { const li = document.createElement('li'); li.className = 'wb-badc'; li.textContent = f.name + ': ' + f.error; ul.append(li); });
      if (S.over) { const li = document.createElement('li'); li.className = 'wb-badc'; li.textContent = `${S.over} more files weren’t read; drop up to ${MAX_FILES} at a time.`; ul.append(li); }
      el.append(ul);
    }
    const wkWrap = $('csvweek-wrap'), gWrap = $('csvgolfer-wrap');
    if (wkWrap) wkWrap.hidden = !single;
    if (gWrap) gWrap.hidden = !single;
    if (!S.sessions.length) { if (sb) sb.disabled = true; return; }
    const clubSel = $('csvclub'), unitSel = $('csvunits');
    if (clubSel) {
      const all = new Map();
      S.sessions.forEach((s) => s.clubs.forEach((n, c) => all.set(c, (all.get(c) || 0) + n)));
      clubSel.replaceChildren();
      [...all.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => { const o = document.createElement('option'); o.value = c; o.textContent = `${c} (${n})`; clubSel.append(o); });
      clubSel.value = S.club || S.sessions[0].driver || '';
    }
    if (unitSel) unitSel.value = S.units;
    const pr = (S.prof || []).filter((p) => p.d !== null).map((p) => `${p.name} ${p.d.toFixed(1)} mph${p.learned ? ' (from these files)' : ''}`);
    if (pr.length) { const p = document.createElement('p'); p.className = 'wb-sub'; p.textContent = 'Typical driver club speed used for sorting: ' + pr.join(', ') + '.'; el.append(p); }
    if (single) singleView(el, S.sessions[0]); else batchView(el);
    const jobs = plan();
    if (sb) {
      sb.disabled = !jobs.length;
      sb.textContent = !jobs.length ? 'Nothing new to save' : single && jobs.length === 1 ? `Save to ${golferName(jobs[0].gid)} · week ${WB.wk(jobs[0].week)}` : `Save ${jobs.length} session${jobs.length === 1 ? '' : 's'}`;
    }
  });

  function singleView(el, s) {
    const gsel = $('csvgolfer'), wkIn = $('csvweek');
    if (gsel) {
      gsel.replaceChildren();
      const opts = WB.golfers().map((g) => [g.id, g.name]);
      if (s.canSplit) opts.push(['split', 'Split by speed']);
      if (!golferOf(s)) opts.unshift(['', 'Choose…']);
      opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; gsel.append(o); });
      gsel.value = golferOf(s) || '';
    }
    if (wkIn && document.activeElement !== wkIn) wkIn.value = S.week === null ? '' : String(S.week);
    const drows = s.rows.filter((r) => r[0] === s.driver).map((r) => r.slice(1));
    const st = WB.shotStats(s.cols, drows, Number(dash.params().smash_target));
    const p = document.createElement('p');
    p.textContent = `${s.label} · ${s.date}${s.dateFrom === 'saved' ? ' (when the file was saved)' : ''} · ${s.rows.length} shots (${[...s.clubs.entries()].map(([c, n]) => c + ' ' + n).join(', ')}). Driver analysis uses ${st.n_used} ${s.driver || 'driver'} shots` + (st.n_left ? `; ${st.n_left} left out as likely misreads or tops` : '') + '. Every club is saved for history.';
    el.append(p);
    if (s.dup) { const d = document.createElement('p'); d.className = 'wb-warnc'; d.textContent = 'This session is already saved, so it will be skipped.'; el.append(d); }
    const grid = document.createElement('div'); grid.className = 'wb-grid wb-pv-tiles';
    const ratio = st.club_speed && st.ball_speed ? st.ball_speed / st.club_speed : null;
    tile(grid, 'Club speed (mph)', F.mph(st.club_speed)); tile(grid, 'Ball speed (mph)', F.mph(st.ball_speed)); tile(grid, 'Ball ÷ club', F.sm(ratio)); tile(grid, 'Launch', F.deg(st.launch)); tile(grid, 'Spin (rpm)', F.int(st.spin)); tile(grid, 'Carry (yd)', F.int(st.carry)); tile(grid, 'Smash spread', F.pm(st.sd_smash, 3));
    el.append(grid);
    const u = document.createElement('p'); u.className = 'wb-sub';
    u.textContent = 'Read as ' + s.units + (S.units === 'auto' ? (s.assumed ? ' (the file doesn’t say; change Units if that’s wrong).' : ' (from the file’s headers).') : ' (set by you).');
    el.append(u);
    const warns = [];
    if (s.flag) warns.push(s.flag);
    if (golferOf(s) === 'split') warns.push('Split: ' + splitText(s) + ' shots.');
    if (st.club_speed === null) warns.push('No club speed in this file, so smash can’t be checked and the session can’t be sorted by speed.');
    if (isDriver(s.driver) && st.club_speed !== null && (st.club_speed < 50 || st.club_speed > 135)) warns.push(`A driver club speed of ${F.mph(st.club_speed)} mph looks wrong. Check Units.`);
    if (st.n_used && st.n_used < MIN_SHOTS) warns.push(`Only ${st.n_used} usable driver shots; ${MIN_SHOTS} or more make the week trustworthy.`);
    if (!s.driver) warns.push('No driver in this session; it is saved for history but adds nothing to the driver analysis.');
    const missing = ['launch', 'spin', 'carry', 'offline', 'attack'].filter((f) => !s.cols.includes(f)).map((f) => NAMES[f]);
    if (missing.length) warns.push('Not in this file: ' + missing.join(', ') + '.');
    const g = golferOf(s);
    const info = g && g !== 'split' && g !== 'skip' ? WB.weekInfo(g).find((w) => w.week === S.week) : null;
    if (info && info.has_import) warns.push(`Week ${WB.wk(S.week)} already has files for ${golferName(g)}; this one is added to it.`);
    else if (info && info.has_typed) warns.push(`Week ${WB.wk(S.week)} has typed numbers for ${golferName(g)}; its numbers will come from these shots. Typed notes stay.`);
    if (warns.length) { const w = document.createElement('ul'); w.className = 'wb-warnlist'; warns.forEach((t) => { const li = document.createElement('li'); li.textContent = t; w.append(li); }); el.append(w); }
  }

  function batchView(el) {
    const jobs = plan(), counts = {};
    jobs.forEach((j) => { counts[j.gid] = (counts[j.gid] || 0) + 1; });
    const dups = S.sessions.filter((s) => s.dup).length, open = S.sessions.filter((s) => !s.dup && !golferOf(s)).length;
    const fromSaved = S.sessions.filter((s) => s.dateFrom === 'saved').length;
    const p = document.createElement('p');
    p.textContent = 'To save: ' + (Object.entries(counts).map(([g, n]) => `${golferName(g)} ${n}`).join(', ') || 'none') + '.' + (dups ? ` ${dups} already saved, skipped.` : '') + (open ? ` ${open} need a golfer.` : '');
    el.append(p);
    if (fromSaved) { const w = document.createElement('p'); w.className = 'wb-warnc'; w.textContent = `${fromSaved} session${fromSaved === 1 ? ' has' : 's have'} no date in the file or its name, so the date is when the file was saved. Check those weeks after saving.`; el.append(w); }
    const wrap = document.createElement('div'); wrap.className = 'wb-scroll';
    const table = document.createElement('table'); table.className = 'wb-table wb-batch';
    table.innerHTML = '<thead><tr><th>Date</th><th class="wb-l">Session</th><th>Shots</th><th>Driver club speed</th><th class="wb-l">Golfer</th><th>Week</th><th class="wb-l">Note</th></tr></thead>';
    const tb = document.createElement('tbody');
    S.sessions.forEach((s) => {
      const tr = document.createElement('tr');
      if (s.dup) tr.className = 'wb-dim';
      const g = golferOf(s);
      const cells = [s.date + (s.dateFrom === 'saved' ? '*' : ''), s.label, `${s.rows.length} (${s.driver ? (s.clubs.get(s.driver) || 0) + ' ' + s.driver : 'no driver'})`, s.dspeed === null ? '—' : s.dspeed.toFixed(1)];
      cells.forEach((t, i) => { const td = document.createElement('td'); td.textContent = t; if (i === 1) td.className = 'wb-wrap'; tr.append(td); });
      const tdg = document.createElement('td'); tdg.className = 'wb-l';
      if (s.dup) tdg.textContent = 'Already saved'; else tdg.append(golferSelect(s, () => dash.redraw('importpreview')));
      tr.append(tdg);
      const tdw = document.createElement('td'); tdw.textContent = s.dup || !g || g === 'skip' ? '—' : g === 'split' ? Object.keys(s.parts).map((x) => WB.wk(weekFor(x, s.date))).join(' / ') : WB.wk(weekFor(g, s.date)); tr.append(tdw);
      const tdn = document.createElement('td'); tdn.className = 'wb-wrap'; tdn.textContent = s.dup ? '' : g === 'split' ? 'Split: ' + splitText(s) : s.flag; tr.append(tdn);
      tb.append(tr);
    });
    table.append(tb); wrap.append(table); el.append(wrap);
  }

  /* What a save would write: one job per golfer per session. */
  function plan() {
    const jobs = [], single = S.sessions.length === 1;
    S.sessions.forEach((s) => {
      const g = golferOf(s);
      if (s.dup || !g || g === 'skip') return;
      if (g === 'split') Object.entries(s.parts).forEach(([gid, rows]) => { if (rows.length) jobs.push({s, gid, rows, part: true, week: single && S.week !== null ? S.week : weekFor(gid, s.date)}); });
      else jobs.push({s, gid: g, rows: s.rows, part: false, week: single && S.week !== null ? S.week : weekFor(g, s.date)});
    });
    return jobs.filter((j) => Number.isInteger(j.week) && Math.abs(j.week) <= 260);
  }
  function docFor(j, now) {
    const s = j.s, target = Number(dash.params().smash_target);
    const drows = j.rows.filter((r) => r[0] === s.driver).map((r) => r.slice(1));
    const ds = WB.shotStats(s.cols, drows, target);
    const clubs = new Map();
    j.rows.forEach((r) => clubs.set(r[0], (clubs.get(r[0]) || 0) + 1));
    return {
      week: j.week, date: s.date, date_from: s.dateFrom, file: s.label + (j.part ? ' (split by speed)' : ''), units: s.units, imported_at: now, driver: s.driver,
      clubs: [...clubs.entries()].map(([club, n]) => ({club, n})), n_total: j.rows.length,
      summary: {driver_used: ds.n_used, driver_left: ds.n_left, club_speed: ds.club_speed, ball_speed: ds.ball_speed, launch: ds.launch, spin: ds.spin, carry: ds.carry, total: ds.total},
      cols: ['club'].concat(s.cols), shots_json: JSON.stringify(j.rows), fp: j.part ? s.fp + ':' + j.gid : s.fp, src_fp: s.fp,
    };
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function saveOne(path, doc) {
    for (let k = 0; ; k++) {
      try { await WB.save(path, doc); return true; }
      catch (e) {
        if (k < 3 && e && (e.code === 'resource_exhausted' || e.code === 'unavailable')) { await wait(2000 * (k + 1)); continue; }
        return false;
      }
    }
  }
  async function save() {
    if (S.busy) return;
    if (S.sessions.length === 1 && S.week !== null && (!Number.isInteger(S.week) || Math.abs(S.week) > 260)) { msg('imp-week'); return; }
    const jobs = plan();
    if (!jobs.length) { msg('imp-bad'); return; }
    S.busy = true;
    const sb = $('csvsave'), prog = $('imp-progress');
    if (sb) sb.disabled = true;
    const now = new Date().toISOString(), counts = {};
    let ok = 0, failed = 0;
    for (let i = 0; i < jobs.length; i++) {
      if (prog) { prog.hidden = false; prog.textContent = `Saving ${i + 1} of ${jobs.length}…`; }
      const doc = docFor(jobs[i], now);
      if (JSON.stringify(doc).length > 240000) { failed++; continue; }
      if (await saveOne('golfers/' + jobs[i].gid + '/sessions/' + WB.newId('s'), doc)) { ok++; counts[jobs[i].gid] = (counts[jobs[i].gid] || 0) + 1; } else failed++;
      if (jobs.length > 1) await wait(120);
    }
    S.busy = false;
    if (prog) prog.hidden = true;
    if (sb) sb.disabled = false;
    if (!ok) {
      const u = $('imp-unsaved');
      if (u) u.textContent = WB.noDb ? 'Saving is off in this view. Open the workbench in the Claude app or on claude.ai while signed in.' : WB.canWrite === false ? 'Not saved. Only the owner can import.' : 'Not saved. Try again in a moment.';
      msg('imp-unsaved');
      return;
    }
    const dups = S.sessions.filter((s) => s.dup).length;
    const sv = $('imp-saved');
    if (sv) sv.textContent = `Saved ${ok} session${ok === 1 ? '' : 's'}: ` + Object.entries(counts).map(([g, n]) => `${golferName(g)} ${n}`).join(', ') + '.' + (dups ? ` ${dups} already saved were skipped.` : '') + (failed ? ` ${failed} didn’t save; drop those files again.` : '');
    msg('imp-saved');
    const only = Object.keys(counts);
    S.files = []; S.sessions = []; S.choice = {}; S.week = null; S.club = null;
    if (only.length === 1) WB.setGolfer(only[0]);
    refresh();
  }

  WB.csv = {parse, standardize, toNum, normHeader, clubRatio, split2, start, startText, save, plan, state: S};

  const rebuild = () => { const keep = S.choice; build(); S.choice = keep; dash.redraw('importpreview'); };
  const cl = $('csvclub');
  if (cl) cl.addEventListener('change', () => { S.club = cl.value; rebuild(); });
  const un = $('csvunits');
  if (un) un.addEventListener('change', () => { S.units = un.value; rebuild(); });
  const gs = $('csvgolfer');
  if (gs) gs.addEventListener('change', () => { const s = S.sessions[0]; if (!s) return; S.choice[s.key] = gs.value || null; if (!S.weekTouched) S.week = weekFor(gs.value, s.date); dash.redraw('importpreview'); });
  const wk = $('csvweek');
  if (wk) wk.addEventListener('input', () => { S.week = wk.value === '' ? null : Number(wk.value); S.weekTouched = true; msg(null); dash.redraw('importpreview'); });
  const sb = $('csvsave');
  if (sb) sb.addEventListener('click', save);
  const cx = $('csvcancel');
  if (cx) cx.addEventListener('click', () => { if (S.busy) return; S.files = []; S.sessions = []; S.choice = {}; msg(null); refresh(); });
  const pb = $('csvpaste-go'), pt = $('csvpaste');
  if (pb && pt) pb.addEventListener('click', () => { if (pt.value.trim()) { startText(pt.value); pt.value = ''; const d = pt.closest('details'); if (d) d.open = false; } });

  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
  document.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; document.documentElement.classList.add('wb-dragging'); });
  document.addEventListener('dragover', (e) => { if (!hasFiles(e)) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = WB.canWrite === false ? 'none' : 'copy'; });
  document.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) document.documentElement.classList.remove('wb-dragging'); });
  document.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    document.documentElement.classList.remove('wb-dragging');
    if (WB.mode() !== 'ingest') WB.setMode('ingest');
    start('auto', null, e.dataTransfer.files);
  });
})();
