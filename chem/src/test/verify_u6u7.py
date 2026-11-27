# Independent checks for units 6–7 (exec'd by verify.py, which provides items, V, bad, ok, close, nums, counts, fans, balance_py)
def given_masses(q):
    m = re.search(r'\(((?:[A-Z][a-z]? = [\d.]+(?:, )?)+)\)\s*$', q)
    return {k: float(v) for k, v in re.findall(r'([A-Z][a-z]?) = ([\d.]+)', m.group(1))} if m else {}
def mm_with(f, gm): return sum(gm[e] * n for e, n in counts(f).items())
def ces(q): return re.findall(r'\\ce\{((?:[^{}]|\{[^{}]*\})*)\}', q)
def parse_eq(s):
    L, Rr = s.split(' -> '); out = []
    for side, part in ((0, L), (1, Rr)):
        for t in part.split(' + '):
            m = re.match(r'^(\d*)(.+)$', t.strip()); out.append((side, int(m.group(1) or 1), m.group(2)))
    return out
def eq_balanced(eq):
    tot = {}
    for side, c, f in eq:
        for e, n in counts(f).items(): tot[e] = tot.get(e, 0) + (1 if side == 0 else -1) * c * n
    return all(v == 0 for v in tot.values())
def coef(eq, f): return next(c for s, c, g in eq if g == f)
def periodic_mass(f): return mmass(f)

def v_mo_mm(it):
    f = ces(it['q'])[0]; gm = given_masses(it['q'])
    if not close(mm_with(f, gm), fans(it), 1e-6): bad(it, 'molar mass arithmetic %s' % f); return
    if abs(periodic_mass(f) - fans(it)) / periodic_mass(f) > 0.002: bad(it, 'molar mass vs periodictable %s: %.3f vs %.3f' % (f, periodic_mass(f), fans(it))); return
    ok(it)
def v_mo_g2mol(it):
    f = ces(it['q'])[0]; g = nums(it['q'])[0]; M = mm_with(f, given_masses(it['q']))
    if not close(g / M, fans(it), 1e-6): bad(it, 'g->mol')
    else: ok(it)
def v_mo_mol2g(it):
    f = ces(it['q'])[0]; n = nums(it['q'])[0]; M = mm_with(f, given_masses(it['q']))
    if not close(n * M, fans(it), 1e-6): bad(it, 'mol->g')
    else: ok(it)
def v_mo_particles(it):
    q = it['q']; NA = 6.02e23; f = ces(q)[0]
    if q.startswith('How many molecules'): want = nums(q)[0] / mm_with(f, given_masses(q)) * NA
    elif q.startswith('What is the mass of'): want = nums(q)[0] / NA * mm_with(f, given_masses(q))
    else:
        el = re.search(r'atoms of ([a-z]+) are', q).group(1); sym = ZSYM[NAMEZ[el]]; n = nums(q)[0]; want = n * counts(f)[sym] * NA
    if not close(want, fans(it), 1e-6): bad(it, 'particles want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_pc_elem(it):
    q = it['q']; f = ces(q)[0]; el = re.search(r'mass of ([a-z]+) in', q).group(1); sym = ZSYM[NAMEZ[el]]; gm = given_masses(q)
    want = counts(f)[sym] * gm[sym] / mm_with(f, gm) * 100
    if not close(want, fans(it), 1e-6): bad(it, 'percent')
    else: ok(it)
def v_pc_water(it):
    q = it['q']; f = ces(q)[0]; gm = given_masses(q); x = int(re.search(r'·(\d+)H2O', f).group(1))
    want = x * mm_with('H2O', gm) / mm_with(f, gm) * 100
    if not close(want, fans(it), 1e-6): bad(it, 'percent water')
    else: ok(it)
def v_pc_hydx(it):
    q = it['q']; mt, ma = nums(q)[:2]; salt = ces(q)[1]; gm = given_masses(q)
    x = ((mt - ma) / mm_with('H2O', gm)) / (ma / mm_with(salt, gm))
    if round(x) != fans(it) or abs(x - round(x)) > 0.2: bad(it, 'hydrate x %.3f vs %s' % (x, fans(it)))
    else: ok(it)
def emp_from(pcts, els):
    mol = [p / ptab.elements.symbol(e).mass for p, e in zip(pcts, els)]; mn = min(mol); r = [m / mn for m in mol]
    for k in range(1, 7):
        rr = [x * k for x in r]
        if all(abs(x - round(x)) < 0.12 for x in rr): return {e: round(x) for e, x in zip(els, rr)}
    return None
def v_ef_pct(it):
    c = it['chk']; got = emp_from(c['pcts'], c['els'])
    if got != counts(fans(it)): bad(it, 'empirical from %s -> %s vs %s' % (c['pcts'], got, fans(it)))
    else: ok(it)
def v_ef_molec(it):
    q = it['q']; e = ces(q)[0]; Mm = nums(q)[0]; k = Mm / mmass(e)
    want = {el: n * round(k) for el, n in counts(e).items()}
    if abs(k - round(k)) > 0.02 or want != counts(fans(it)): bad(it, 'molecular formula')
    else: ok(it)
def eq_of(q): return parse_eq(ces(q)[0])
def v_st_mole(it):
    q = it['q']; eq = eq_of(q); assert eq_balanced(eq); sp = ces(q); A, B = sp[2], sp[1]; n = nums(q)[0]
    want = n * coef(eq, B) / coef(eq, A)
    if not close(want, fans(it), 1e-6): bad(it, 'mole ratio %s -> %s' % (A, B))
    else: ok(it)
def v_st_mass(it):
    q = it['q']; eq = eq_of(q); sp = ces(q); B, A = sp[1], sp[2]; g = nums(q)[0]; gm = given_masses(q)
    if not eq_balanced(eq): bad(it, 'equation not balanced'); return
    want = g / mm_with(A, gm) * coef(eq, B) / coef(eq, A) * mm_with(B, gm)
    if not close(want, fans(it), 1e-6): bad(it, 'mass-mass want %s got %s' % (want, fans(it)))
    else: ok(it)
def lim_parse(q):
    eq = eq_of(q); sp = ces(q); gA, gB = nums(q)[:2]; A, B = sp[1], sp[2]; gm = given_masses(q)
    xA = gA / mm_with(A, gm) / coef(eq, A); xB = gB / mm_with(B, gm) / coef(eq, B)
    return eq, sp, A, B, gA, gB, xA, xB, gm
def v_lm_which(it):
    eq, sp, A, B, gA, gB, xA, xB, gm = lim_parse(it['q']); want = A if xA < xB else B
    if '\\ce{' + want + '}' not in it['mc'][0]: bad(it, 'limiting reactant want %s, first choice %s' % (want, it['mc'][0]))
    else: ok(it)
def v_lm_product(it):
    eq, sp, A, B, gA, gB, xA, xB, gm = lim_parse(it['q']); P = sp[3]
    want = min(xA, xB) * coef(eq, P) * mmass_given(P, gm)
    if not close(want, fans(it), 1e-6): bad(it, 'limiting product want %s got %s' % (want, fans(it)))
    else: ok(it)
def mmass_given(f, gm):
    return mm_with(f, gm) if all(e in gm for e in counts(f)) else mmass(f)
def v_lm_excess(it):
    eq, sp, A, B, gA, gB, xA, xB, gm = lim_parse(it['q'])
    if xA < xB: want = gB - xA * coef(eq, B) * mm_with(B, gm)
    else: want = gA - xB * coef(eq, A) * mm_with(A, gm)
    if not close(want, fans(it), 1e-6) or want <= 0: bad(it, 'excess left want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_lm_yield(it):
    th, act = nums(it['q'])[:2]
    if not close(act / th * 100, fans(it), 1e-9): bad(it, 'yield')
    else: ok(it)
def v_lm_yield2(it):
    q = it['q']; eq = eq_of(q); sp = ces(q); A, B = sp[1], sp[2]; g, act = nums(q)[:2]; gm = given_masses(q)
    th = g / mm_with(A, gm) * coef(eq, B) / coef(eq, A) * mm_with(B, gm)
    if not close(act / th * 100, fans(it), 1e-6): bad(it, 'yield2')
    else: ok(it)
PU = {'atm': 1, 'kPa': 101.3, 'mmHg': 760, 'psi': 14.7}
def v_gp_conv(it):
    m = re.match(r'^Convert \$([\d.]+)\$ (\w+) to (\w+)\.', it['q']); v, a, b = float(m.group(1)), m.group(2), m.group(3)
    if not close(v * PU[b] / PU[a], fans(it), 1e-9): bad(it, 'pressure conversion')
    else: ok(it)
def v_gp_temp(it):
    v = nums(it['q'])[0]; want = v + 273.15 if 'to kelvin' in it['q'] else v - 273.15
    if abs(want - fans(it)) > 1e-6: bad(it, 'temperature')
    else: ok(it)
def v_gl(it):
    q = it['q']; n = nums(q)
    if it['id'] == 'gl-boyle':
        if 'what is its volume' in q: V1, P1, P2 = n[:3]; want = P1 * V1 / P2
        else: P1, V1, V2 = n[:3]; want = P1 * V1 / V2
    elif it['id'] == 'gl-charles': V1, t1, t2 = n[:3]; want = V1 * (t2 + 273) / (t1 + 273)
    elif it['id'] == 'gl-gay': P1, t1, t2 = n[:3]; want = P1 * (t2 + 273) / (t1 + 273)
    else: V1, P1, t1, P2, t2 = n[:5]; want = P1 * V1 / (t1 + 273) * (t2 + 273) / P2
    if not close(want, fans(it), 1e-6): bad(it, 'gas law want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_ig_solve(it):
    q = it['q']; R = 0.0821
    g = {k: float(v) for k, v in re.findall(r'\$([PVnT])=(-?[\d.]+)\$', q)}
    if 'T' in g: g['T'] += 273
    fid = it['fs'][0]['lab']
    want = {'P': lambda: g['n'] * R * g['T'] / g['V'], 'V': lambda: g['n'] * R * g['T'] / g['P'], 'n': lambda: g['P'] * g['V'] / (R * g['T']), 'T': lambda: g['P'] * g['V'] / (g['n'] * R)}[fid]()
    if not close(want, fans(it), 1e-6): bad(it, 'ideal gas want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_ig_mass(it):
    q = it['q']; n = nums(q); R = 0.0821
    if q.startswith('What volume'): g, P, t = n[0], n[1], n[2]; f = ces(q)[0]; want = g / mm_with(f, given_masses(q)) * R * (t + 273) / P
    else: g, V, P, t = n[0], n[1], n[2], n[3]; want = g / (P * V / (R * (t + 273)))
    if not close(want, fans(it), 1e-6): bad(it, 'ideal gas mass want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_dg_total(it):
    q = it['q']; ps = [float(x) for x in re.findall(r'\$(\d+)\$ mmHg', q)]
    want = sum(ps) if q.startswith('A container') else None
    if want is None:
        tot = float(re.search(r'total pressure of \$(\d+)\$', q).group(1)); p1, p2 = [float(x) for x in re.findall(r'are \$(\d+)\$ and \$(\d+)\$', q)[0]]; want = tot - p1 - p2
    if not close(want, fans(it), 1e-9) or want <= 0: bad(it, 'dalton')
    else: ok(it)
def v_dg_water(it):
    T, tot, w = nums(it['q'])[:3]
    if abs(tot - w - fans(it)) > 1e-6: bad(it, 'over water')
    else: ok(it)
def v_dg_frac(it):
    na, nb, P = nums(it['q'])[:3]
    if not close(na / (na + nb) * P, fans(it), 1e-6): bad(it, 'mole fraction')
    else: ok(it)
def v_dg_stp(it):
    q = it['q']; eq = eq_of(q); sp = ces(q); B, A = sp[1], sp[2]; g = nums(q)[0]
    want = g / mm_with(A, given_masses(q)) * coef(eq, B) / coef(eq, A) * 22.4
    if not eq_balanced(eq) or not close(want, fans(it), 1e-6): bad(it, 'gas stoichiometry')
    else: ok(it)
V.update({'mo-mm': v_mo_mm, 'mo-g2mol': v_mo_g2mol, 'mo-mol2g': v_mo_mol2g, 'mo-particles': v_mo_particles, 'pc-elem': v_pc_elem, 'pc-water': v_pc_water, 'pc-hydx': v_pc_hydx,
          'ef-pct': v_ef_pct, 'ef-molec': v_ef_molec, 'st-mole': v_st_mole, 'st-mass': v_st_mass, 'lm-which': v_lm_which, 'lm-product': v_lm_product, 'lm-excess': v_lm_excess,
          'lm-yield': v_lm_yield, 'lm-yield2': v_lm_yield2, 'gp-conv': v_gp_conv, 'gp-temp': v_gp_temp, 'gl-boyle': v_gl, 'gl-charles': v_gl, 'gl-gay': v_gl, 'gl-comb': v_gl,
          'ig-solve': v_ig_solve, 'ig-mass': v_ig_mass, 'dg-total': v_dg_total, 'dg-water': v_dg_water, 'dg-frac': v_dg_frac, 'dg-stp': v_dg_stp})
