/* Data trust (FR-25 in the dashboards spec v0.4): what this monitor's data can be trusted for, as a chip under the
   golfer bar, and a banner on views that lean on spin or on club data. Worked out from the last four weeks in range. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const CLUB = ['attack', 'path', 'face', 'f2p', 'dyn_loft'];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  dash.calc('trust', {
    inputs: ['csvweeks'],
    fn: (csv) => {
      const pts = csv.slice(-4).flatMap((w) => w.pts.filter((p) => p.used));
      if (!pts.length) return null;
      const ball = pts.filter((p) => typeof p.ball_speed === 'number' && typeof p.launch === 'number').length / pts.length;
      const spins = pts.map((p) => p.spin).filter((v) => typeof v === 'number').sort((a, b) => a - b);
      const med = spins.length ? spins[spins.length >> 1] : null;
      const measured = pts.filter((p) => CLUB.some((k) => typeof p[k] === 'number' && p[k] !== 0)).length / pts.length;
      return {
        ball: ball >= 0.9 ? 'ok' : 'partly',
        spin: med === null ? 'missing' : med < 2000 ? 'check' : 'ok', spinMed: med,
        club: measured >= 0.8 ? 'measured' : measured > 0.05 ? 'partly' : 'not',
        n: pts.length,
      };
    },
  });

  dash.draw('trust', (box) => {
    box.replaceChildren();
    const d = dash.data('trust');
    if (d.status !== 'ok' || !d.data) return;
    const t = d.data;
    const chip = (label, state, level) => { const c = el('span', 'wb-chip ' + level, label + ': ' + state); box.append(c); };
    box.append(el('span', 'wb-trust-lead', 'Monitor data'));
    chip('Ball data', t.ball === 'ok' ? 'good' : 'patchy', t.ball === 'ok' ? 'ok' : 'warn');
    chip('Spin', t.spin === 'ok' ? 'good' : t.spin === 'check' ? 'check' : 'missing', t.spin === 'ok' ? 'ok' : 'warn');
    chip('Club data', t.club === 'measured' ? 'measured' : t.club === 'partly' ? 'partly measured' : 'not measured', t.club === 'measured' ? 'ok' : 'none');
  });

  /* Banners: data-need="spin" or "club" on the views that lean on them. */
  dash.draw('trustbanner', (box) => {
    box.replaceChildren();
    const d = dash.data('trust');
    if (d.status !== 'ok' || !d.data) return;
    const t = d.data, need = box.dataset.need;
    let msg = '';
    if (need === 'spin' && t.spin === 'check') msg = `Spin reads low (driver median ${Math.round(t.spinMed).toLocaleString('en-US')} rpm, against about 2,200–2,800 for these speeds). Launch and spin targets, and carry and roll from the flight model, need the spin check before you act on them.`;
    if (need === 'club' && t.club !== 'measured') msg = t.club === 'not' ? 'This monitor isn’t sending club data: attack angle, path, face and loft read as zero, so those rows stay hidden.' : 'Club data is only partly measured; read path, face and loft with care.';
    if (!msg) return;
    box.textContent = msg;
  });
})();
