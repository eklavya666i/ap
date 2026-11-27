// End-to-end test of the workbench page in jsdom with an in-memory stand-in for Claude's database.
// Run: npm install && npm test   (from this folder)
'use strict';
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'app');
let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
function d3File() {
  for (const dir of require.resolve.paths('d3') || []) { const f = path.join(dir, 'd3', 'dist', 'd3.min.js'); if (fs.existsSync(f)) return f; }
  throw new Error('d3 not found: run npm install in tests/ first');
}
html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\/[^"]+"><\/script>/, () => '<script>' + fs.readFileSync(d3File(), 'utf8') + '</script>');
for (const f of ['model.js', 'runtime.js', 'app.js', 'import.js', 'rounds.js']) html = html.replace(`<script src="${f}"></script>`, () => '<script>' + fs.readFileSync(path.join(APP, f), 'utf8') + '</script>');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + fs.readFileSync(path.join(APP, 'style.css'), 'utf8') + '</style>');

// In-memory database with live listeners, shaped like the artifact db capability.
function makeDb(seed) {
  const docs = new Map(Object.entries(seed));
  const listeners = [];
  const snap = (p) => { const v = docs.get(p); return {id: p.split('/').pop(), exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))), metadata: {fromCache: false, hasPendingWrites: false}}; };
  const fire = () => setTimeout(() => listeners.forEach((l) => l()), 5);
  const inColl = (c, p) => p.startsWith(c + '/') && p.split('/').length === c.split('/').length + 1;
  const ref = (p) => ({
    id: p.split('/').pop(), path: p, get: async () => snap(p),
    set: async (d) => { if (JSON.stringify(d).length > 262144) throw {code: 'invalid_argument'}; docs.set(p, JSON.parse(JSON.stringify(d))); fire(); },
    update: async (d) => { if (!docs.has(p)) throw {code: 'invalid_argument'}; docs.set(p, Object.assign(docs.get(p), JSON.parse(JSON.stringify(d)))); fire(); },
    delete: async () => { docs.delete(p); fire(); },
    onSnapshot: (next) => { const l = () => next(snap(p)); listeners.push(l); setTimeout(l, 1); return () => {}; },
  });
  return {docs, db: {doc: ref, collection: (c) => ({path: c, doc: (id) => ref(c + '/' + id), onSnapshot: (next) => {
    const l = () => { const ds = [...docs.keys()].filter((p) => inColl(c, p)).sort().map(snap); next({docs: ds, size: ds.length, empty: !ds.length, docChanges: () => [], metadata: {fromCache: false}}); };
    listeners.push(l); setTimeout(l, 1); return () => {};
  }})}};
}

// Synthetic GSPro range exports (documented column names), seeded so runs repeat exactly.
let s0 = 7;
const R = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
const N = () => { let u = 0; for (let i = 0; i < 6; i++) u += R(); return u - 3; };
const HDR = 'Shot,Club,Carry,TotalDistance,BallSpeed,ClubSpeed,BackSpin,SideSpin,HLA,VLA,Offline,PeakHeight,Path,AoA,FaceToTarget,FaceToPath';
function rows(n, cs, first, club = 'DR') {
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = cs + N(), b = c * (1.44 + N() * 0.01);
    out.push([first + i, club, (b * 1.58 + N() * 5).toFixed(1), (b * 1.76 + N() * 6).toFixed(1), b.toFixed(1), c.toFixed(1), (2500 + N() * 150).toFixed(0), (N() * 200).toFixed(0), (N() * 2).toFixed(1), (12.5 + N()).toFixed(1), (N() * 9).toFixed(1), '28', N().toFixed(1), (1.5 + N() * 0.6).toFixed(1), N().toFixed(1), N().toFixed(1)].join(','));
  }
  return out;
}
const FILES = {
  'fast_2026-11-10.csv': [HDR, ...rows(15, 97.2, 1), ...rows(6, 84, 16, 'I7')].join('\n'),
  'slow 11-12-2026.csv': [HDR, ...rows(14, 86.0, 1)].join('\n'),
  'both_2026-11-18.csv': [HDR, ...rows(10, 97.0, 1), ...rows(10, 86.3, 11)].join('\n'),
  'history.csv': ['Date,' + HDR, ...rows(8, 96.5, 1).map((r) => '2026-09-01,' + r), ...rows(8, 96.8, 9).map((r) => '2026-09-08,' + r), ...rows(8, 97.4, 17).map((r) => '2026-10-27,' + r)].join('\n'),
  'slow_2026-11-25.csv': [HDR, ...rows(12, 85.6, 1)].join('\n'),
};
if (process.argv.includes('--write-samples')) {
  Object.entries(FILES).forEach(([n, t]) => fs.writeFileSync(path.join(__dirname, 'sample-data', n), t + '\n'));
  console.log('Wrote sample files to tests/sample-data');
  process.exit(0);
}

const M = makeDb({
  'config/golfers': {list: [{id: 'a', name: 'Golfer A', start: '2026-10-26'}, {id: 'b', name: 'Golfer B', start: '2026-10-26'}]},
  'golfers/a/weeks/w05': {week: 5, club_speed: 97.0, ball_speed: 130.2, smash_device: 1.44},
});
const errors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    w.SVGElement.prototype.getComputedTextLength = function () { return (this.textContent || '').length * 6.5; };
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.addEventListener('error', (e) => errors.push(e.message));
    w.console.error = (...a) => errors.push(a.map(String).join(' '));
    w.claude = {use: async (n) => (n === 'db' ? M.db : n === 'user' ? {isOwner: async () => true} : n === 'desktop' ? {install: {state: async () => 'unavailable'}} : null)};
  },
});
const w = dom.window, doc = w.document;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const file = (name, text) => ({name, size: text.length, lastModified: Date.parse('2026-11-26T18:00:00'), text: () => Promise.resolve(text)});
let failed = 0;
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) failed++; };

(async () => {
  await sleep(300);
  check(w.WB.mode() === 'analysis' && doc.getElementById('import').hidden, 'opens in Analysis outside the desktop app');
  w.WB.setMode('ingest');
  await sleep(50);
  check(!doc.getElementById('import').hidden && doc.getElementById('dashboard').hidden, 'Import view shows the import station only');

  const P = w.WB.csv;
  const range = P.parse([HDR, ...rows(3, 97, 1)].join('\n'));
  check(range.mapped.length === 16, 'reads all 16 documented GSPro range columns');

  P.start('auto', null, Object.entries(FILES).map(([n, t]) => file(n, t)));
  await sleep(200);
  const S = P.state.sessions;
  const by = (label) => S.find((s) => s.label.startsWith(label));
  check(S.length === 7, 'splits 5 files into 7 sessions by date');
  check(by('fast_').guess === 'a' && by('slow 11').guess === 'b' && by('slow_').guess === 'b', 'sorts sessions to the faster and slower golfer');
  check(by('both_').guess === 'split' && by('both_').parts.a.length === 10 && by('both_').parts.b.length === 10, 'splits a shared session shot by shot');
  const hist = S.filter((s) => s.file === 'history.csv').map((s) => s.date + ':' + w.WB.programWeek('a', s.date)).join(' ');
  check(hist === '2026-09-01:-7 2026-09-08:-6 2026-10-27:1', 'numbers weeks from week 1, older history at 0 or below');

  await P.save();
  await sleep(200);
  const saved = [...M.docs.keys()].filter((k) => k.includes('/sessions/'));
  check(saved.filter((k) => k.startsWith('golfers/a/')).length === 5 && saved.filter((k) => k.startsWith('golfers/b/')).length === 3, 'saves 5 sessions for A and 3 for B');

  const sessDocs = saved.map((k) => M.docs.get(k));
  check(sessDocs.every((d) => d.has_raw === true && d.schema === 2), 'every new session keeps its original CSV lines');
  check([...M.docs.keys()].filter((k) => k.includes('/raw/')).length === 8, 'one original-file record per session');

  P.start('auto', null, [file('fast_2026-11-10.csv', FILES['fast_2026-11-10.csv'])]);
  await sleep(150);
  check(P.state.sessions[0].dup && doc.getElementById('csvsave').disabled, 'skips a session that is already saved');
  doc.getElementById('csvcancel').click();
  await sleep(30);

  // A session saved before originals were kept: same file dropped again attaches the original, adds no session.
  const fastPath = saved.find((k) => M.docs.get(k).file === 'fast_2026-11-10.csv');
  const legacy = Object.assign({}, M.docs.get(fastPath));
  delete legacy.has_raw; delete legacy.schema;
  await M.db.doc(fastPath).set(legacy);
  await M.db.doc(fastPath.replace('/sessions/', '/raw/')).delete();
  await sleep(80);
  const nBefore = [...M.docs.keys()].filter((k) => k.includes('/sessions/')).length;
  P.start('auto', null, [file('fast_2026-11-10.csv', FILES['fast_2026-11-10.csv'])]);
  await sleep(150);
  check(P.plan().length === 1 && P.plan()[0].kind === 'attach', 'offers to attach the original to the older session');
  await P.save();
  await sleep(150);
  check(M.docs.get(fastPath).has_raw === true && M.docs.has(fastPath.replace('/sessions/', '/raw/')) && [...M.docs.keys()].filter((k) => k.includes('/sessions/')).length === nBefore, 'attaches the original without a duplicate session');

  // Older sessions took the file's saved date; a re-drop now reads it from the file name. Same shots, other date: still recognized.
  const slowPath = saved.find((k) => M.docs.get(k).file === 'slow_2026-11-25.csv');
  const legacy2 = Object.assign({}, M.docs.get(slowPath));
  delete legacy2.has_raw; delete legacy2.schema;
  await M.db.doc(slowPath).set(legacy2);
  await M.db.doc(slowPath.replace('/sessions/', '/raw/')).delete();
  await sleep(80);
  P.start('auto', null, [file('slow_2026-11-26.csv', FILES['slow_2026-11-25.csv'])]);
  await sleep(150);
  check(P.state.sessions[0].date === '2026-11-26' && P.plan().length === 1 && P.plan()[0].kind === 'attach', 'recognizes a session saved under another date');
  await P.save();
  await sleep(150);
  check(M.docs.get(slowPath).has_raw === true && [...M.docs.keys()].filter((k) => k.includes('/sessions/')).length === nBefore, 'attaches its original without a duplicate');
  P.start('auto', null, [file('both_2026-11-19.csv', FILES['both_2026-11-18.csv'])]);
  await sleep(150);
  check(P.state.sessions.length > 0 && P.state.sessions.every((s) => s.dup) && P.plan().length === 0, 'recognizes a split session saved under another date');
  doc.getElementById('csvcancel').click();
  await sleep(30);

  // Backup, lose some data, restore: only the missing items come back.
  const backup = JSON.stringify(w.WB.backup());
  const lost = saved.slice(0, 2);
  for (const k of lost) await M.db.doc(k).delete();
  await sleep(80);
  doc.getElementById('restore-text').value = backup;
  doc.getElementById('restore-go').click();
  await sleep(600);
  check(lost.every((k) => M.docs.has(k)) && [...M.docs.keys()].filter((k) => k.includes('/sessions/')).length === nBefore, 'restore brings back exactly the missing sessions');


  P.start('card', 'a', [file('wrong_2026-11-26.csv', [HDR, ...rows(12, 86.2, 1)].join('\n'))]);
  await sleep(150);
  check(/looks like Golfer B/.test(P.state.sessions[0].flag), 'flags a slow session dropped on the faster golfer');
  doc.getElementById('csvcancel').click();

  w.WB.setMode('analysis');
  w.WB.setGolfer('a');
  await sleep(150);
  check(doc.querySelectorAll('[data-draw=trendchart] svg').length === 6, 'draws the six trend charts');
  check(doc.querySelectorAll('#disp-chart circle').length > 0, 'draws where drives land');
  const weeksA = [...doc.querySelectorAll('#log-table tbody tr')].map((tr) => tr.cells[0].textContent).join(',');
  check(weeksA === '5,4,3,1,−6,−7', 'lists A’s weeks newest first');
  const winA = w.dash.data('windows').data;
  w.WB.setGolfer('b');
  await sleep(100);
  const winB = w.dash.data('windows').data;
  check(winB.launch[0] > winA.launch[0], 'the slower golfer gets a higher launch window');
  // GSPro conditions: the SLC preset is assumed until set; carry is restated at sea level; saving changes it.
  const alt = () => doc.querySelector('[data-draw="alttext"]').textContent;
  check(alt().includes('4,450 ft') && alt().includes('at sea level'), 'shows GSPro altitude and carry at sea level');
  const cf = doc.getElementById('cond-form');
  doc.getElementById('cond-box').open = true; doc.getElementById('cond-box').dispatchEvent(new w.Event('toggle'));
  cf.elements.altitude_ft.value = '5000'; cf.requestSubmit();
  await sleep(200);
  check(M.docs.get('config/conditions').altitude_ft === 5000 && alt().includes('5,000 ft') && !alt().includes('preset'), 'saves GSPro conditions');
  check(saved.some((k) => M.docs.has(k) && M.docs.get(k).conditions && M.docs.get(k).conditions.altitude_ft === 4450), 'new sessions record their conditions');

  cf.elements.green_firmness.value = '4'; cf.elements.setting.value = 'outdoor'; cf.elements.ball.value = 'Tour ball'; cf.requestSubmit();
  await sleep(200);
  const cd = M.docs.get('config/conditions');
  check(cd.green_firmness === 4 && cd.setting === 'outdoor' && cd.ball === 'Tour ball' && cd.elevation_mode === 'global', 'saves the rest of the conditions profile');
  w.WB.setMode('ingest');
  await sleep(150);
  const ce = doc.querySelector('[data-draw="histrows"] details.wb-cond-edit');
  ce.open = true;
  ce.querySelector('input[type="number"]').value = '0';
  [...ce.querySelectorAll('button')].find((b) => b.textContent === 'Save conditions').click();
  await sleep(200);
  check(saved.some((k) => M.docs.has(k) && M.docs.get(k).conditions && M.docs.get(k).conditions.altitude_ft === 0 && M.docs.get(k).conditions.ball !== undefined), 'edits one session’s conditions after import');

  // Every chart has a table view and Copy as CSV.
  w.WB.setMode('analysis');
  await sleep(200);
  const tbars = doc.querySelectorAll('.wb-tbar:not([hidden])');
  const carryCard = doc.querySelector('[data-draw="trendchart"][data-m="carry"]').closest('.wb-card');
  const tbtn = carryCard.querySelector('.wb-tbar button');
  tbtn.click();
  const ctab = carryCard.querySelector('.wb-ctable table');
  check(tbars.length >= 7 && ctab && ctab.querySelector('th').textContent === 'Week' && ctab.tBodies[0].rows.length > 0, 'charts have a table view and Copy as CSV');

  // Rounds: a round saved from the form is listed, edited in place, kept in backups and restored if lost.
  w.WB.setMode('analysis');
  const rf = doc.getElementById('round-form');
  check(rf && rf.elements.date.value.length === 10 && doc.getElementById('round-mic-hint').hidden === false && doc.getElementById('round-photo-wrap').hidden, 'round form opens with today and no mic or photo where they are unavailable');
  rf.elements.course.value = 'Test Links'; rf.elements.score.value = '78'; rf.elements.r_driving.value = '4'; rf.elements.r_putting.value = '2';
  rf.elements.what.value = 'Fairways in play, two three-putts.';
  doc.getElementById('round-holes-add').click();
  const hin = doc.querySelectorAll('#round-holes tbody tr');
  hin[0].querySelectorAll('input')[0].value = '4'; hin[0].querySelectorAll('input')[0].dispatchEvent(new w.Event('input'));
  hin[0].querySelectorAll('input')[1].value = '5'; hin[0].querySelectorAll('input')[1].dispatchEvent(new w.Event('input'));
  rf.requestSubmit();
  await sleep(250);
  let rk = [...M.docs.keys()].filter((k) => k.includes('/rounds/'));
  const rd = rk.length === 1 ? M.docs.get(rk[0]) : {};
  check(hin.length === 18 && rk.length === 1 && rd.score === 78 && rd.ratings.driving === 4 && rd.ratings.putting === 2 && rd.holes.length === 1 && rd.holes[0].score === 5, 'saves a round with score, ratings and hole scores');
  const rlist = doc.querySelector('[data-draw="rounds"]');
  check(rlist.textContent.includes('Test Links') && rlist.textContent.includes('Putting 2/5'), 'lists the round with its ratings');
  [...rlist.querySelectorAll('button')].find((b) => b.textContent === 'Edit').click();
  check(rf.elements.course.value === 'Test Links' && doc.getElementById('round-save').textContent === 'Update round', 'opens a saved round for editing');
  rf.elements.score.value = '77'; rf.requestSubmit();
  await sleep(250);
  rk = [...M.docs.keys()].filter((k) => k.includes('/rounds/'));
  check(rk.length === 1 && M.docs.get(rk[0]).score === 77, 'updates the round in place');
  const rb = JSON.stringify(w.WB.backup());
  await M.db.doc(rk[0]).delete();
  await sleep(80);
  doc.getElementById('restore-text').value = rb;
  doc.getElementById('restore-go').click();
  await sleep(600);
  check(M.docs.has(rk[0]) && M.docs.get(rk[0]).course === 'Test Links', 'backup and restore bring back a lost round');

  // Skipped rows are listed with their reason; the last import can be undone in one step.
  w.WB.setMode('ingest');
  await sleep(150);
  P.start('auto', null, [file('fast_2026-11-10.csv', FILES['fast_2026-11-10.csv'] + '\nAverage,,,,\nnot a shot,,,\n')]);
  await sleep(150);
  const rj = doc.querySelector('.wb-rejects summary');
  check(rj && rj.textContent.startsWith('2 rows skipped') && rj.textContent.includes('1 summary row') && rj.textContent.includes('1 no ball speed'), 'lists skipped rows with reasons');
  doc.getElementById('csvcancel').click();
  await sleep(150);
  const ubox = doc.querySelector('[data-draw="undobatch"]'), ub = ubox && ubox.querySelector('button');
  const nS0 = [...M.docs.keys()].filter((k) => k.includes('/sessions/')).length;
  check(ub && ubox.textContent.includes('Last import: ' + nS0 + ' sessions'), 'offers to undo the last import');
  ub.click(); ub.click();
  await sleep(1200);
  check([...M.docs.keys()].filter((k) => k.includes('/sessions/') || k.includes('/raw/')).length === 0, 'undo removes the import’s sessions and original files');

  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(failed ? `${failed} failed` : 'all passed');
  process.exit(failed ? 1 : 0);

})();
