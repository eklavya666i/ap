(function () {
  var PRM = {cd0: 0.1705, cd1: 0.6191, cla: 0.7525, clp: 0.648, tau: 25, thk: 0.6075, rc: 1.188, ra0: 0.8, e_hi: 0.12, mu: 0.43};
  var TURF = {soft: 0.468, normal: 0.972, firm: 2.413, baked: 4.742};
  var Mb = 0.04593, Rb = 0.021335, Ab = Math.PI * Rb * Rb, Gv = 9.80665, MPH = 0.44704, YD = 0.9144, FT = 0.3048;
  function air(alt, tf) {
    var h = alt * FT, p = 101325 * Math.pow(1 - 2.25577e-5 * h, 5.25588), T = (tf - 32) * 5 / 9 + 273.15, tc = T - 273.15;
    var pv = 0.5 * 610.78 * Math.exp(17.27 * tc / (tc + 237.3));
    return (p - pv) / (287.05 * T) + pv / (461.495 * T);
  }
  function fly(bs, la, sp, c, dt) {
    dt = dt || 0.01;
    var k = 0.5 * air(c.alt || 0, c.temp) * Ab / Mb, w = (c.wind || 0) * MPH, v0 = bs * MPH, a = la * Math.PI / 180, om0 = sp * 2 * Math.PI / 60;
    var x = 0, y = 0, vx = v0 * Math.cos(a), vy = v0 * Math.sin(a), t = 0, ap = 0;
    function acc(vx, vy, t) {
      var om = om0 * Math.exp(-t / PRM.tau), ux = vx - w, uy = vy, V = Math.hypot(ux, uy), S = Rb * om / V;
      var cd = PRM.cd0 + PRM.cd1 * S, cl = PRM.cla * Math.pow(Math.max(S, 0), PRM.clp);
      return [-k * V * (cd * ux + cl * uy), -k * V * (cd * uy - cl * ux) - Gv];
    }
    while (t < 30) {
      var a1 = acc(vx, vy, t), a2 = acc(vx + 0.5 * dt * a1[0], vy + 0.5 * dt * a1[1], t + 0.5 * dt),
        a3 = acc(vx + 0.5 * dt * a2[0], vy + 0.5 * dt * a2[1], t + 0.5 * dt), a4 = acc(vx + dt * a3[0], vy + dt * a3[1], t + dt);
      var nx = x + dt / 6 * (vx + 2 * (vx + 0.5 * dt * a1[0]) + 2 * (vx + 0.5 * dt * a2[0]) + (vx + dt * a3[0]));
      var ny = y + dt / 6 * (vy + 2 * (vy + 0.5 * dt * a1[1]) + 2 * (vy + 0.5 * dt * a2[1]) + (vy + dt * a3[1]));
      var nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]), nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      if (ny < 0 && nvy < 0) { var f = y / (y - ny); x += f * (nx - x); vx += f * (nvx - vx); vy += f * (nvy - vy); t += f * dt; break; }
      x = nx; y = ny; vx = nvx; vy = nvy; t += dt; if (y > ap) ap = y;
    }
    return {carry: x / YD, apex: ap / YD, land: Math.atan2(-vy, vx) * 180 / Math.PI, vx: vx, vy: vy, om: om0 * Math.exp(-t / PRM.tau)};
  }
  function roll(vx, vy, om, firm) {
    var vt = vx, vn = -vy, dist = 0;
    for (var i = 0; i < 12; i++) {
      var v1 = Math.hypot(vt, vn), th1 = Math.atan2(vn, vt);
      if (vn < 0.3 || v1 < 0.5) break;
      var thc = Math.min((15.4 * Math.PI / 180) * (v1 / 18.6) * ((th1 * 180 / Math.PI) / 44.4) * PRM.thk / firm, 35 * Math.PI / 180);
      var e = v1 < 20 ? 0.510 - 0.0375 * v1 + 0.000903 * v1 * v1 : 0.120;
      e = Math.min(0.75, e * (PRM.e_hi / 0.12) * Math.sqrt(firm));
      var a = th1 + thc, un = v1 * Math.sin(a), ut = v1 * Math.cos(a), slip = ut + Rb * om, Jr = (2 / 7) * slip, Jm = PRM.mu * (1 + e) * un, ut2, om2;
      if (Jm >= Math.abs(Jr)) { ut2 = ut - Jr; om2 = -ut2 / Rb; } else { var s = slip > 0 ? 1 : -1; ut2 = ut - s * Jm; om2 = om - s * 2.5 * Jm / Rb; }
      var un2 = e * un, vnn = ut2 * Math.sin(thc) + un2 * Math.cos(thc);
      vt = ut2 * Math.cos(thc) - un2 * Math.sin(thc); om = om2;
      if (vnn <= 0.05 || vt <= 0) break;
      dist += vt * 2 * vnn / Gv; vn = vnn;
    }
    vt = Math.max(vt, 0);
    var a0 = PRM.ra0 / firm, c = PRM.rc / firm, h = 0.01, v = vt, r = 0;
    while (v > 0.02 && r < 300) { var v2 = v - (a0 + c * v) * h; r += 0.5 * (v + Math.max(v2, 0)) * h; v = v2; }
    return dist + r;
  }
  function shot(bs, la, sp, c) {
    var f = fly(bs, la, sp, c);
    var rl = roll(f.vx, f.vy, f.om, TURF[c.turf] || TURF.normal) / YD;
    return {carry: f.carry, roll: rl, total: f.carry + rl, apex: f.apex, land: f.land};
  }
  var SPIN_PER_DEG = 2.17;
  function best(bs, cs, aoa, c) {
    var k = SPIN_PER_DEG * cs, top = null;
    function ok(L, s) { return s >= Math.max(2000, k * (L - aoa) / 0.85); }
    function val(L, s) { return shot(bs, L, s, c).total; }
    for (var L = 9; L <= 19; L += 0.5) {
      var m = Math.max(2000, k * (L - aoa) / 0.85);
      for (var s = Math.ceil(m / 50) * 50; s <= 3600; s += 100) { var v = val(L, s); if (!top || v > top.v) top = {v: v, L: L, s: s}; }
    }
    var L0 = top.L, s0 = top.s;
    for (var i = -4; i <= 4; i++) for (var j = -4; j <= 4; j++) {
      var L2 = L0 + i * 0.125, s2 = s0 + j * 25;
      if (!ok(L2, s2)) continue;
      var v2 = val(L2, s2); if (v2 > top.v) top = {v: v2, L: L2, s: s2};
    }
    return {launch: top.L, spin: top.s};
  }
  window.BF = {shot: shot, best: best, SPIN_PER_DEG: SPIN_PER_DEG};
})();
