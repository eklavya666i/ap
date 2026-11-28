/* Shared pieces for the four lab views of design package v1.0 (Ball flight, Swing and strike, Partial shots, Drill studio):
   every club's shots from the imported sessions in range, ball-flight paths drawn through GSPro's own launch, peak height,
   descent, carry and offline, the night-range scene, the driver face, and small SVG chart helpers drawn at real pixel size. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const D2R = Math.PI / 180, NS = 'http://www.w3.org/2000/svg';
  const fin = (v) => typeof v === 'number' && isFinite(v);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const sd = (a) => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((t, v) => t + (v - m) * (v - m), 0) / (a.length - 1)); };
  const qt = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * q, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const sg = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d === undefined ? 1 : d);
  const f0 = (v) => (fin(v) ? Math.round(v).toLocaleString('en-US') : '—');
  const f1 = (v) => (fin(v) ? (Math.round(v * 10) / 10).toFixed(1) : '—');
  const f2 = (v) => (fin(v) ? v.toFixed(2) : '—');

  /* Curve per degree of face-to-path (spin axis ÷ k) and the face's share of start direction (w), by club. */
  function dplane(key, cat) {
    if (key === 'dr') return {k: 2.0, w: 0.86};
    if (/^w/.test(key)) return {k: 1.8, w: 0.84};
    if (/^h/.test(key)) return {k: 1.6, w: 0.8};
    if (/^i[1-6]$/.test(key)) return {k: 1.5, w: 0.78};
    if (/^i[78]$/.test(key)) return {k: 1.4, w: 0.77};
    if (key === 'i9') return {k: 1.3, w: 0.75};
    if (key === 'pw') return {k: 1.2, w: 0.74};
    if (key === 'gw') return {k: 1.1, w: 0.73};
    if (key === 'sw') return {k: 1.0, w: 0.72};
    return cat === 'wedge' ? {k: 0.9, w: 0.7} : {k: 1.4, w: 0.77};
  }

  function tagsOf(s) {
    const t = s && s._doc && Array.isArray(s._doc.tags) ? s._doc.tags : [];
    return t.filter((x) => x && Number.isInteger(x.from) && Number.isInteger(x.to) && x.from >= 0 && x.to >= x.from && x.to < s.arows.length).slice(0, 200);
  }

  /* One record per stored shot of every club, with its tags, the misread check, and delivery measured or inferred. */
  function shotsOf(imports) {
    const out = [];
    imports.forEach((s) => {
      const ix = {}, tags = tagsOf(s);
      s.cols.forEach((c, k) => { ix[c] = k + 1; });
      s.arows.forEach((r, k) => {
        const info = typeof clubInfo === 'function' ? clubInfo(r[0]) : null;
        if (!info) return;
        const o = {sid: s.id, k, n: k + 1, week: s.week, date: s.date, file: s.file, label: String(r[0] || ''), key: info.key, name: info.name, cat: info.cat, order: info.order};
        WB.COLS.forEach((c) => { const j = ix[c], v = j === undefined ? null : r[j]; o[c] = fin(v) ? v : null; });
        if (o.smash === null && o.ball_speed && o.club_speed) o.smash = o.ball_speed / o.club_speed;
        const lim = typeof CLUB_LIMITS === 'object' ? CLUB_LIMITS[info.cat] : null;
        o.used = o.ball_speed !== null && !(lim && o.smash !== null && (o.smash < lim.sm[0] || o.smash > lim.sm[1])) && !(lim && o.spin !== null && o.spin > lim.sp) && (o.carry === null || o.carry > 5);
        const at = tags.filter((x) => k >= x.from && k <= x.to), pick = (f) => { const t = at.find((x) => typeof x[f] === 'string' && x[f]); return t ? t[f].slice(0, 60) : null; };
        o.swing = pick('swing'); o.drill = pick('drill'); o.tee = pick('tee'); o.intent = pick('intent'); o.target = pick('target');
        const dp = dplane(info.key, info.cat);
        o.measured = o.face !== null && o.path !== null;
        o.f2pE = o.axis !== null ? o.axis / dp.k : null;
        o.faceE = o.hla !== null && o.f2pE !== null ? o.hla + (1 - dp.w) * o.f2pE : null;
        o.pathE = o.faceE !== null ? o.faceE - o.f2pE : null;
        out.push(o);
      });
    });
    return out;
  }
  dash.calc('labshots', {inputs: ['imports'], fn: shotsOf});

  /* Start: HLA beyond ±2° is left or right. Curve: spin axis beyond ±3° is a draw or a fade (right-handed golfer). */
  const START = (h) => (h < -2 ? 'pull' : h > 2 ? 'push' : 'straight'), CURVE = (a) => (a < -3 ? 'draw' : a > 3 ? 'fade' : 'straight');
  const PNAME = {'pull-draw': 'Pull-draw', 'pull-straight': 'Pull', 'pull-fade': 'Pull-fade', 'straight-draw': 'Draw', 'straight-straight': 'Straight', 'straight-fade': 'Fade', 'push-draw': 'Push-draw', 'push-straight': 'Push', 'push-fade': 'Push-fade'};
  const patternOf = (s) => (s.hla === null || s.axis === null ? null : START(s.hla) + '-' + CURVE(s.axis));

  /* A flight path through GSPro's own numbers: launch angle out, peak height, descent angle in, carry; start line (HLA) bending to offline. */
  function traj(s) {
    const carry = s.carry;
    if (!fin(carry) || carry < 5) return null;
    const L = (fin(s.launch) ? s.launch : 12) * D2R, D = (fin(s.descent) ? s.descent : carry > 150 ? 38 : 45) * D2R;
    const peak = fin(s.peak) && s.peak > 0 ? s.peak : carry * 0.11;
    const a = carry * 0.42, b = carry * 0.3, P = [[0, 0], [a, a * Math.tan(L)], [carry - b, b * Math.tan(D)], [carry, 0]];
    const N = 36, raw = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t, c0 = u * u * u, c1 = 3 * u * u * t, c2 = 3 * u * t * t, c3 = t * t * t;
      raw.push([c0 * P[0][0] + c1 * P[1][0] + c2 * P[2][0] + c3 * P[3][0], c0 * P[0][1] + c1 * P[1][1] + c2 * P[2][1] + c3 * P[3][1]]);
    }
    const top = Math.max(...raw.map((q) => q[1])) || 1, k = peak / top;
    const off = fin(s.offline) ? s.offline : 0, z0 = Math.tan((fin(s.hla) ? s.hla : 0) * D2R), c = (off - carry * z0) / (carry * carry);
    const zx = (x) => x * z0 + c * x * x;
    const pts = raw.map(([x, y]) => [x, y * k, zx(x)]);
    const roll = fin(s.total) ? Math.max(0, s.total - carry) : 0, th = Math.atan(z0 + 2 * c * carry);
    return {pts, land: [carry, off], end: [carry + roll * Math.cos(th), off + roll * Math.sin(th)], peak, carry, total: carry + roll};
  }

  /* Figures drawn at real pixel size and redrawn when their box changes width. */
  const RO = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => es.forEach((e) => { const f = e.target.__draw; if (f) f(); })) : null;
  function fig(box, h, label, draw, cls) {
    const holder = el('div', 'lab-fig' + (cls ? ' ' + cls : ''));
    holder.style.height = h + 'px';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label);
    holder.append(svg); box.append(holder);
    let lastW = -1;
    holder.__draw = () => {
      const W = Math.round(holder.clientWidth) || 640;
      if (W === lastW) return;
      lastW = W;
      svg.setAttribute('viewBox', `0 0 ${W} ${h}`); svg.setAttribute('width', W); svg.setAttribute('height', h);
      try { svg.innerHTML = draw(W, h); } catch (err) { console.error('lab figure', err); }
    };
    holder.__draw();
    if (RO) { RO.observe(holder); (box.__labFigs = box.__labFigs || []).push(holder); }
    return svg;
  }
  function reset(box) { if (RO && box.__labFigs) box.__labFigs.forEach((h) => RO.unobserve(h)); box.__labFigs = []; box.replaceChildren(); }

  function nice(lo, hi, n) {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const mag = Math.pow(10, Math.floor(Math.log10(span / n)));
    let st = mag;
    for (const m of [1, 2, 2.5, 5, 10]) { st = m * mag; if (span / st <= n) break; }
    const o = [];
    for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6));
    return o;
  }
  /* Axes with recessive grid lines; returns scales and markup. o: {xl, yl, xf, yf, xgrid, zero} */
  function axes(W, H, m, xd, yd, o) {
    o = o || {};
    if (o.xl) m.b = Math.max(m.b, 44);
    const sx = (v) => m.l + (v - xd[0]) / (xd[1] - xd[0]) * (W - m.l - m.r), sy = (v) => H - m.b - (v - yd[0]) / (yd[1] - yd[0]) * (H - m.t - m.b);
    let g = '';
    const nx = W < 520 ? 4 : 7, ny = H < 240 ? 3 : 5;
    nice(yd[0], yd[1], ny).forEach((t) => { g += `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(t).toFixed(1)}" y2="${sy(t).toFixed(1)}" class="lab-grid"/><text x="${m.l - 7}" y="${(sy(t) + 4).toFixed(1)}" text-anchor="end" class="lab-tick">${esc(o.yf ? o.yf(t) : t)}</text>`; });
    nice(xd[0], xd[1], nx).forEach((t) => { if (o.xgrid) g += `<line x1="${sx(t).toFixed(1)}" x2="${sx(t).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" class="lab-grid"/>`; g += `<text x="${sx(t).toFixed(1)}" y="${H - m.b + 18}" text-anchor="middle" class="lab-tick">${esc(o.xf ? o.xf(t) : t)}</text>`; });
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}" class="lab-axis"/>`;
    if (o.zero && xd[0] < 0 && xd[1] > 0) g += `<line x1="${sx(0).toFixed(1)}" x2="${sx(0).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" class="lab-axis"/>`;
    if (o.xl) g += `<text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="lab-tick">${esc(o.xl)}</text>`;
    if (o.yl) g += `<text x="4" y="${m.t - 12}" class="lab-tick">${esc(o.yl)}</text>`;
    return {sx, sy, g};
  }
  const lp = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const dot = (x, y, col, title, act, r, op) => `<g class="lab-dot"${act ? ` data-shot="${esc(act)}" tabindex="0" role="button"` : ''}><title>${esc(title || '')}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r || 4}" fill="${col}" fill-opacity="${op || 0.9}" class="lab-ring"/></g>`;
  function ellipse(xs, ys, k) {
    k = k || 2.4477;
    const mx = mean(xs), my = mean(ys);
    let a = 0, b = 0, c = 0;
    xs.forEach((x, i) => { const dx = x - mx, dy = ys[i] - my; a += dx * dx; b += dx * dy; c += dy * dy; });
    const n = Math.max(1, xs.length - 1); a /= n; b /= n; c /= n;
    const t = (a + c) / 2, d = Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b), l1 = t + d, l2 = Math.max(t - d, 0);
    const ang = Math.abs(b) < 1e-9 ? (a >= c ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b), u = [Math.cos(ang), Math.sin(ang)], v = [-Math.sin(ang), Math.cos(ang)], r1 = k * Math.sqrt(l1), r2 = k * Math.sqrt(l2), pts = [];
    for (let i = 0; i <= 48; i++) { const th = i / 48 * 2 * Math.PI; pts.push([mx + r1 * Math.cos(th) * u[0] + r2 * Math.sin(th) * v[0], my + r1 * Math.cos(th) * u[1] + r2 * Math.sin(th) * v[1]]); }
    return pts;
  }

  /* The night range: tracers over a mown range under floodlights, yardage boards, a painted corridor, ground shadows,
     the landing ellipse and (for the driver) the 260 flag. list: [{t: traj(), col, op, wd, title, act, hot}] */
  let SCN = 0;
  function scene(W, H, list, o) {
    o = o || {};
    const goal = o.goal !== undefined ? o.goal : null, cw = o.half || 15, narrow = W < 560, u = 'lab' + (++SCN);
    let q0 = 11;
    const R = () => { q0 = q0 * 16807 % 2147483647; return q0 / 2147483647; };
    const reach = Math.max(60, ...list.map((x) => x.t.total));
    const Xf = Math.max(goal ? goal + 40 : 0, reach * 1.22), d = Xf * 0.9, hy = Math.round(H * (narrow ? 0.3 : 0.33)), pb = 12, span = H - pb - hy - 2, vN = 1 - d / (Xf + d);
    const v = (x) => (1 - d / (x + d)) / vN, sc = (x) => d / (x + d), gy = (x) => H - pb - v(x) * span, cx = W * (W > 900 ? 0.57 : 0.5);
    const kz = (narrow ? 0.46 : 0.42) * W / (Math.max(cw + 25, 40) * sc(Math.min(goal || Xf * 0.85, Xf * 0.85)));
    let ky = Infinity;
    const top = Math.max(18, H * 0.07);
    list.forEach((x) => x.t.pts.forEach((p) => { if (p[1] > 0.5) { const k = (gy(p[0]) - top) / (p[1] * sc(p[0])); if (k < ky) ky = k; } }));
    if (!isFinite(ky)) ky = kz;
    ky = Math.min(ky, kz * 2.2);
    const P = (x, y, z) => [cx + z * kz * sc(x), gy(x) - y * ky * sc(x)], pt = (x, y, z) => { const p = P(x, y, z); return p[0].toFixed(1) + ',' + p[1].toFixed(1); };
    const L2 = (a, b, at) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${at}/>`;
    let g = `<defs><linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a13"/><stop offset=".6" stop-color="#0f1b2e"/><stop offset="1" stop-color="#2a3550"/></linearGradient><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#163a2b"/><stop offset="1" stop-color="#0a1812"/></linearGradient><radialGradient id="${u}l"><stop offset="0" stop-color="#e6f6ff" stop-opacity=".5"/><stop offset=".22" stop-color="#bfe6ff" stop-opacity=".12"/><stop offset="1" stop-color="#bfe6ff" stop-opacity="0"/></radialGradient><linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d8b4" stop-opacity="0"/><stop offset=".75" stop-color="#e9d8b4" stop-opacity=".16"/><stop offset="1" stop-color="#e9d8b4" stop-opacity="0"/></linearGradient><linearGradient id="${u}e" gradientUnits="userSpaceOnUse" x1="0" y1="${hy}" x2="0" y2="${H}"><stop offset="0" stop-color="#f2e6cc" stop-opacity=".8"/><stop offset=".7" stop-color="#f2e6cc" stop-opacity=".28"/><stop offset="1" stop-color="#f2e6cc" stop-opacity="0"/></linearGradient></defs>`;
    g += `<rect width="${W}" height="${hy + 2}" fill="url(#${u}k)"/>`;
    (narrow ? [W * 0.1, W * 0.9] : [W * 0.06, W * 0.94]).forEach((fx) => {
      const ty = Math.max(10, hy * 0.28);
      g += `<circle cx="${fx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(H * 0.42).toFixed(1)}" fill="url(#${u}l)"/><path d="M${(fx - 7).toFixed(1)} ${ty.toFixed(1)}L${(fx - W * 0.09).toFixed(1)} ${hy}L${(fx + W * 0.09).toFixed(1)} ${hy}L${(fx + 7).toFixed(1)} ${ty.toFixed(1)}Z" fill="#cfeaff" fill-opacity=".035"/><path d="M${fx.toFixed(1)} ${hy}V${ty.toFixed(1)}" stroke="#1d3138" stroke-width="2"/><rect x="${(fx - 10).toFixed(1)}" y="${(ty - 5).toFixed(1)}" width="20" height="6" rx="2" fill="#eef8ff"/>`;
    });
    let tl = `M0 ${hy + 2}`;
    for (let x = 0; x <= W + 8; x += 8) { const h = 9 + 5 * Math.sin(x / 41) + 3.5 * Math.sin(x / 13 + 1.3) + 3 * R(); tl += `L${x} ${(hy - h).toFixed(1)}`; }
    g += `<path d="${tl}L${W + 8} ${hy + 2}Z" fill="#070c12"/><rect y="${hy - 28}" width="${W}" height="36" fill="url(#${u}h)"/><rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#${u}g)"/>`;
    const band = Xf > 200 ? 10 : 5;
    for (let x = 0; x < Xf; x += band * 2) g += `<rect x="0" y="${gy(x + band).toFixed(1)}" width="${W}" height="${(gy(x) - gy(x + band)).toFixed(1)}" fill="#000" fill-opacity=".11"/>`;
    [-120, -80, -40, 40, 80, 120].forEach((zz) => { g += `<path d="M${pt(0, 0, zz)}L${pt(Xf, 0, zz)}" stroke="#000" stroke-opacity=".08" stroke-width="${narrow ? 14 : 30}"/>`; });
    g += `<path d="M${pt(-2, 0, -cw)}L${pt(Xf, 0, -cw)}M${pt(-2, 0, cw)}L${pt(Xf, 0, cw)}" stroke="url(#${u}e)" stroke-width="1.6" stroke-dasharray="10 7" fill="none"/>`;
    const step = Xf > 220 ? 50 : Xf > 110 ? 25 : 10;
    for (let x = step; x < Xf - 5; x += step) g += L2(P(x, 0, -cw - 3), P(x, 0, cw + 3), `stroke="#f2ead8" stroke-opacity="${x % (step * 2) ? 0.13 : 0.24}"`);
    let lastY = Infinity;
    for (let x = step * 2; x < Xf - 10; x += step * (narrow ? 2 : 1)) {
      if (goal && Math.abs(x - goal) < step * 0.6) continue;
      const q = P(x, 0, narrow ? -cw - 7 : -cw - 18), bx = Math.max(22, q[0] - 20);
      if (lastY - q[1] < 27) continue;
      lastY = q[1];
      g += `<line x1="${bx.toFixed(1)}" y1="${q[1].toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(q[1] - 6).toFixed(1)}" stroke="#d9cdb4" stroke-width="1.5"/><rect x="${(bx - 18).toFixed(1)}" y="${(q[1] - 25).toFixed(1)}" width="36" height="19" rx="4" fill="#f4ecdb"/><text class="lab-board" x="${bx.toFixed(1)}" y="${(q[1] - 11).toFixed(1)}" text-anchor="middle">${x}</text>`;
    }
    const ends = list.map((x) => x.t.end);
    if (ends.length >= 8) { const E = ellipse(ends.map((e) => e[1]), ends.map((e) => e[0])); g += `<path d="M${E.map((q) => pt(Math.max(0, q[1]), 0, q[0])).join('L')}Z" fill="#f2ead8" fill-opacity=".05" stroke="#f2ead8" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="5 5"/>`; }
    if (goal && Xf > goal + 2) {
      const a = P(goal, 0, -cw - 8), b = P(goal, 0, cw + 8), fb = P(goal, 0, cw + 9), ft = P(goal, 3.4, cw + 9);
      g += L2(a, b, 'stroke="#ffd23f" stroke-opacity=".28" stroke-width="7"') + L2(a, b, 'stroke="#ffd23f" stroke-width="2"') + L2(fb, ft, 'stroke="#ffd23f" stroke-width="2"') + `<path d="M${ft[0].toFixed(1)} ${ft[1].toFixed(1)}l12 4.5-12 4.5z" fill="#ffd23f"/><text class="lab-goal" x="${(ft[0] + 16).toFixed(1)}" y="${(ft[1] + 13).toFixed(1)}">${goal}</text>`;
    }
    let shd = '', tr = '';
    list.slice().sort((a, b) => (a.op || 0.9) - (b.op || 0.9)).forEach((x, k) => {
      const t = x.t, op = x.hot ? 1 : x.op || 0.9, wd = x.hot ? 3.4 : x.wd || 2.2, col = x.hot ? '#ffffff' : x.col, dd = lp(t.pts.map((p) => P(p[0], p[1], p[2])));
      const land = P(t.land[0], 0, t.land[1]), end = P(t.end[0], 0, t.end[1]), dl = Math.min(k * 32, 1300);
      const an = o.anim ? ` class="lab-draw" style="animation-delay:${dl}ms"` : '', fa = o.anim ? ` class="lab-fade" style="animation-delay:${dl + 1100}ms"` : '';
      shd += `<path d="${lp(t.pts.map((p) => P(p[0], 0, p[2])))}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>`;
      tr += `<g${x.act ? ` data-shot="${esc(x.act)}" tabindex="0" role="button"` : ''} class="lab-tracer"><title>${esc(x.title || '')}</title><path d="${dd}" fill="none" stroke="${col}" stroke-opacity="${(op * 0.24).toFixed(2)}" stroke-width="${wd + 5}" stroke-linecap="round" pathLength="1"${an}/><path d="${dd}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${wd}" stroke-linecap="round" pathLength="1"${an}/><path d="${dd}" fill="none" stroke="transparent" stroke-width="14"/><g${fa}><line x1="${land[0].toFixed(1)}" y1="${land[1].toFixed(1)}" x2="${end[0].toFixed(1)}" y2="${end[1].toFixed(1)}" stroke="${col}" stroke-opacity="${(op * 0.8).toFixed(2)}" stroke-width="1.5"/><circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="${x.hot ? 4.4 : 3.4}" fill="#f4faf6" fill-opacity="${op}" stroke="${col}" stroke-width="1.5"/></g></g>`;
    });
    return g + shd + tr;
  }

  /* A driver face seen from the front: heel and hosel on the left, toe on the right; coordinates in mm from the center. */
  let FCN = 0;
  function face(W, H) {
    const sc = Math.min((W - 24) / 128, (H - 52) / 80), cx = W / 2 + 2 * sc, cy = H / 2 + 9 * sc, X = (v) => cx + v * sc, Y = (v) => cy - v * sc, P = (x, y) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`, u = 'labf' + (++FCN);
    const ol = `M${P(-50, -22)}Q${P(0, -31)} ${P(48, -24)}C${P(58, -18)} ${P(61, 8)} ${P(50, 22)}C${P(36, 33)} ${P(-20, 34)} ${P(-40, 25)}C${P(-54, 17)} ${P(-57, -12)} ${P(-50, -22)}Z`;
    let sl = '';
    for (let y = -14; y <= 14; y += 4.7) sl += `M${P(-30, y)}L${P(30, y)}`;
    const base = `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34433d"/><stop offset=".5" stop-color="#1d2925"/><stop offset="1" stop-color="#121a17"/></linearGradient><clipPath id="${u}c"><path d="${ol}"/></clipPath></defs><path d="M${P(-47, 19)}L${P(-64, 48)}L${P(-56, 50)}L${P(-38, 25)}Z" fill="url(#${u}m)" stroke="#5d6f66" stroke-width="1.2"/><path d="${ol}" fill="url(#${u}m)" stroke="#6f8379" stroke-width="1.5"/><path d="${sl}" stroke="#ffffff" stroke-opacity=".07" stroke-width="1.2"/>`;
    const lab = `<text x="${X(-50).toFixed(1)}" y="${(Y(-31) + 22).toFixed(1)}" class="lab-tick">Heel</text><text x="${X(50).toFixed(1)}" y="${(Y(-31) + 22).toFixed(1)}" text-anchor="end" class="lab-tick">Toe</text>`;
    return {X, Y, P, sc, u, ol, base, lab};
  }

  /* Small HTML pieces shared by the views. */
  function head(box, find, sub) {
    const h = el('p', 'lab-find', find);
    box.append(h);
    if (sub) box.append(el('p', 'lab-sub', sub));
  }
  function card(box, title, sub, cls) {
    const c = el('div', 'wb-card lab-card' + (cls ? ' ' + cls : ''));
    c.append(el('h3', '', title));
    if (sub) c.append(el('p', 'wb-sub lab-csub', sub));
    box.append(c);
    return c;
  }
  function legend(box, items) {
    const l = el('div', 'wb-legend lab-legend');
    items.forEach(([col, text, kind]) => { const s = el('span'), i = el('i', 'lab-key' + (kind ? ' ' + kind : '')); i.style.background = col; s.append(i, document.createTextNode(text)); l.append(s); });
    box.append(l);
    return l;
  }
  function chips(box, items, on, pick, label) {
    const g = el('div', 'lab-chips');
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', label || 'Choose');
    items.forEach(([k, text]) => { const b = el('button', 'lab-chip', text); b.type = 'button'; b.setAttribute('aria-pressed', String(k === on)); b.addEventListener('click', () => pick(k)); g.append(b); });
    box.append(g);
    return g;
  }
  function table(box, cols, rows, numCols) {
    const w = el('div', 'wb-scroll'), t = el('table', 'wb-table lab-table'), hr = t.createTHead().insertRow();
    cols.forEach((c, i) => { const th = el('th', (numCols || []).includes(i) ? '' : 'wb-l', c); th.scope = 'col'; hr.append(th); });
    const tb = t.createTBody();
    rows.forEach((r) => { const tr = tb.insertRow(); r.forEach((v, i) => { const td = tr.insertCell(); if (v && v.nodeType) td.append(v); else td.textContent = v === null || v === undefined ? '' : String(v); if (!(numCols || []).includes(i)) td.className = 'wb-l'; }); });
    w.append(t); box.append(w);
    return t;
  }
  /* A tap on a dot or tracer opens the shot in the Shots drill-down. */
  function wireShots(box) {
    if (box.__labWired) return;
    box.__labWired = true;
    const open = (e) => { const t = e.target.closest && e.target.closest('[data-shot]'); if (!t || !box.contains(t)) return; const [sid, k] = t.getAttribute('data-shot').split('|'); if (typeof WB.openShot === 'function') WB.openShot(sid, Number(k)); };
    box.addEventListener('click', open);
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
  }
  const tipOf = (s) => `${s.name}, ${s.date || 'week ' + WB.wk(s.week)}, shot ${s.n}: carry ${f0(s.carry)} yd, total ${f0(s.total)} yd, offline ${fin(s.offline) ? sg(s.offline, 0) : '—'} yd; ball ${f1(s.ball_speed)} mph, launch ${f1(s.launch)}°, spin ${f0(s.spin)} rpm; start ${fin(s.hla) ? sg(s.hla) : '—'}°, curve ${fin(s.axis) ? sg(s.axis) : '—'}°`;

  window.LAB = {fin, esc, mean, med, sd, qt, el, sg, f0, f1, f2, dplane, patternOf, PNAME, traj, fig, reset, axes, lp, dot, ellipse, scene, face, head, card, legend, chips, table, wireShots, tipOf, state: {club: 'dr', pat: null, cell: null, scl: 'dr'}};
})();
