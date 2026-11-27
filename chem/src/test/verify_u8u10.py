# Independent checks for units 8–10 (exec'd by verify.py)
import math
def v_su_curve(it):
    q = it['q']; S1, T1, S2, T2 = [int(x) for x in re.findall(r'is (\d+) g per 100 g of water at (\d+) °C and (\d+) g per 100 g at (\d+) °C', q)[0]]
    w = int(re.search(r'made with (\d+) g of water', q).group(1)); want = (S1 - S2) * w / 100
    if not close(want, fans(it), 1e-9) or want <= 0: bad(it, 'crystallize')
    else: ok(it)
def v_su_sat(it):
    q = it['q']; S = int(re.search(r'solubility of .* is (\d+) g per 100 g', q).group(1)); amt = int(re.search(r'contains (\d+) g of', q).group(1))
    want = 'Unsaturated' if amt < S else 'Saturated' if amt == S else 'Supersaturated'
    if it['mc'][0] != want: bad(it, 'saturation %s vs %s' % (want, it['mc'][0]))
    else: ok(it)
def v_mz_calc(it):
    q = it['q']; g = nums(q)[0]; mL = nums(q)[1]; f = ces(q)[0]
    if not close(g / mm_with(f, given_masses(q)) / (mL / 1000), fans(it), 1e-6): bad(it, 'molarity')
    else: ok(it)
def v_mz_mass(it):
    q = it['q']; mL, M = nums(q)[:2]; f = ces(q)[0]
    if not close(M * mL / 1000 * mm_with(f, given_masses(q)), fans(it), 1e-6): bad(it, 'grams for solution')
    else: ok(it)
def v_mz_vol(it):
    q = it['q']; M, g = nums(q)[:2]; f = ces(q)[0]
    if not close(g / mm_with(f, given_masses(q)) / M * 1000, fans(it), 1e-6): bad(it, 'volume of solution')
    else: ok(it)
def v_mz_ions(it):
    q = it['q']; ion, f = ces(q)[0], ces(q)[1]; c = nums(q)[0]
    base = re.sub(r'\^.*$', '', ion); cf = counts(f); ci = counts(base)
    # number of ion units per formula unit: an element ion counts that element; a polyatomic ion counts via its first element
    k = cf[list(ci)[0]] // ci[list(ci)[0]]
    if not close(c * k, fans(it), 1e-9): bad(it, 'ion concentration %s in %s' % (ion, f))
    else: ok(it)
def v_dl(it):
    q = it['q']; n = nums(q)
    if q.startswith('How many mL'): M1, V2, M2 = n[:3]; want = M2 * V2 / M1
    elif 'is diluted with water to' in q: V1, M1, V2 = n[:3]; want = M1 * V1 / V2
    elif q.startswith('To what final volume'): V1, M1, M2 = n[:3]; want = M1 * V1 / M2
    else: V1, M1, M2 = n[:3]; want = M1 * V1 / M2 - V1
    if not close(want, fans(it), 1e-6) or want <= 0: bad(it, 'dilution want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_cg_pct(it):
    s, w = nums(it['q'])[:2]
    if not close(s / (s + w) * 100, fans(it), 1e-9): bad(it, 'percent by mass')
    else: ok(it)
def v_cg_molal(it):
    q = it['q']; g, gw = nums(q)[:2]; f = ces(q)[0]
    if not close(g / mm_with(f, given_masses(q)) / (gw / 1000), fans(it), 1e-6): bad(it, 'molality')
    else: ok(it)
VANT_I = {'C12H22O11': 1, 'C6H12O6': 1, 'NaCl': 2, 'KBr': 2, 'CaCl2': 3, 'MgCl2': 3, 'KCl': 2}
def v_cg_fp(it):
    q = it['q']; g, gw = nums(q)[:2]; f = ces(q)[0]; m = g / mm_with(f, given_masses(q)) / (gw / 1000); i = VANT_I[f]
    want = -i * 1.86 * m if 'freezing' in q else 100 + i * 0.512 * m
    if abs(want - fans(it)) > 1e-6: bad(it, 'colligative want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_cg_which(it):
    fs = re.findall(r'1\.0 m \$\\ce\{([^}]*)\}\$', ' '.join(it['mc'])); best = max(fs, key=lambda f: VANT_I[f])
    if best not in it['mc'][0] or sorted([VANT_I[f] for f in fs]).count(VANT_I[best]) > 1: bad(it, 'most particles')
    else: ok(it)
def hconc(q):
    m = re.search(r'\[\\text\{(H|OH)\}\^[+-]\]=(\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}', q); return m.group(1), float(m.group(2)) * 10 ** int(m.group(3))
def v_ph_from_h(it):
    _, h = hconc(it['q'])
    if abs(-math.log10(h) - fans(it)) > 1e-9: bad(it, 'pH')
    else: ok(it)
def v_ph_to_h(it):
    p = nums(it['q'])[0]
    if not close(10 ** -p, fans(it), 1e-9): bad(it, '[H+]')
    else: ok(it)
def v_ph_poh(it):
    q = it['q']
    if 'pOH of' in q: want = 14 - nums(q)[0]
    else: _, oh = hconc(q); want = 14 + math.log10(oh)
    if abs(want - fans(it)) > 1e-9: bad(it, 'pH from pOH')
    else: ok(it)
SAB_K = {'HCl': ('a', 1), 'HNO3': ('a', 1), 'HBr': ('a', 1), 'NaOH': ('b', 1), 'KOH': ('b', 1), 'Ca(OH)2': ('b', 2), 'Ba(OH)2': ('b', 2)}
def v_ph_strong(it):
    q = it['q']; c = nums(q)[0]; f = ces(q)[0]; t, k = SAB_K[f]
    want = -math.log10(c) if t == 'a' else 14 + math.log10(c * k)
    if abs(want - fans(it)) > 1e-9: bad(it, 'strong pH %s' % f)
    else: ok(it)
def v_ph_class(it):
    q = it['q']; m = re.search(r'pH of \$([\d.]+)\$', q); p = float(m.group(1)) if m else int(re.search(r'10\^\{-(\d+)\}', q).group(1))
    want = 'Acidic' if p < 7 else 'Basic' if p > 7 else 'Neutral'
    if it['mc'][0] != want: bad(it, 'ph class')
    else: ok(it)
HPER = {'HCl': 1, 'HNO3': 1, 'H2SO4': 2, 'H3PO4': 3, 'HBr': 1}; OHPER = {'NaOH': 1, 'KOH': 1, 'Ca(OH)2': 2, 'Ba(OH)2': 2, 'LiOH': 1}
def v_ti_calc(it):
    q = it['q']; n = nums(q); sp = ces(q)
    if 'What is the molarity' in q: Va, Vb, Mb = n[:3]; a, b = sp[0], sp[1]; want = OHPER[b] * Mb * Vb / (HPER[a] * Va)
    else: Mb, Va, Ma = n[:3]; b, a = sp[0], sp[1]; want = HPER[a] * Ma * Va / (OHPER[b] * Mb)
    if not close(want, fans(it), 1e-6): bad(it, 'titration want %s got %s' % (want, fans(it)))
    else: ok(it)
SALTS = {('HCl', 'NaOH'): 'NaCl', ('HNO3', 'KOH'): 'KNO3', ('HBr', 'LiOH'): 'LiBr', ('HCl', 'KOH'): 'KCl', ('H2SO4', 'NaOH'): 'Na2SO4', ('HCl', 'Ca(OH)2'): 'CaCl2', ('HNO3', 'NaOH'): 'NaNO3', ('H2SO4', 'KOH'): 'K2SO4', ('HI', 'NaOH'): 'NaI'}
def v_ti_salt(it):
    a, b = ces(it['q'])[0].split(' + ')
    if '\\ce{' + SALTS[(a, b)] + ' + H2O}' not in it['mc'][0]: bad(it, 'salt for %s + %s' % (a, b))
    else: ok(it)
def v_he_q(it):
    m, T1, T2, c = nums(it['q'])[:4]
    if not close(m * c * (T2 - T1), fans(it), 1e-9): bad(it, 'q=mcdT')
    else: ok(it)
SPHT = {'Aluminum': 0.897, 'Copper': 0.385, 'Iron': 0.449, 'Lead': 0.129, 'Silver': 0.235, 'Gold': 0.129, 'Glass': 0.840}
def v_he_solve(it):
    q = it['q']; n = nums(q)
    if it.get('k') == 'mc':
        m, Q, dT = n[:3]; c = Q / (m * dT)
        if abs(c - SPHT[it['mc'][0]]) / SPHT[it['mc'][0]] > 0.01: bad(it, 'metal id c=%.3f vs %s' % (c, it['mc'][0]))
        else: ok(it)
        return
    if 'final temperature' in q: m, T1, Q, c = n[:4]; want = T1 + Q / (m * c)
    else: Q, dT, c = n[:3]; want = Q / (c * dT)
    if not close(want, fans(it), 1e-6): bad(it, 'heat solve want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_he_cal(it):
    mm, Tm, mw, Tw, Tf = nums(it['q'])[:5]
    want = mw * 4.18 * (Tf - Tw) / (mm * (Tm - Tf))
    if not close(want, fans(it), 1e-6) or not (0.05 < want < 1.5): bad(it, 'calorimetry c %s' % want)
    else: ok(it)
def v_en_thermo(it):
    q = it['q']; eq = eq_of(q); dH = float(re.search(r'\\Delta H=(-?\d+)\$', q).group(1)); g = nums(q)[-1]; f = ces(q)[1]
    if not eq_balanced(eq): bad(it, 'thermo equation not balanced'); return
    want = abs(dH) * g / mm_with(f, given_masses(q)) / coef(eq, f)
    if not close(want, fans(it), 1e-6): bad(it, 'thermochem want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_en_phase(it):
    q = it['q']; m = nums(q)[0]; want = m * (334 if 'melt' in q else 2260)
    if not close(want, fans(it), 1e-9): bad(it, 'phase heat')
    else: ok(it)
def v_en_total(it):
    m, Ti, Tf = nums(it['q'])[:3]; want = m * 2.09 * (0 - Ti) + m * 334 + m * 4.18 * Tf
    if not close(want, fans(it), 1e-9): bad(it, 'ice to water')
    else: ok(it)
def nuc_parts(s):
    return [(int(a), int(z), sy) for a, z, sy in re.findall(r'\^\{(\d+)\}_\{(-?\d+)\}([A-Za-z]+)', s)]
def v_nu_missing(it):
    eq = ces(it['q'])[0]; (A, Z, sy), (a, z, p) = nuc_parts(eq)[:2]
    if SYMZ[sy] != Z: bad(it, 'parent Z'); return
    want = {'A': A - a, 'Z': Z - z, 's': ZSYM[Z - z]}
    for f in it['fs']:
        if f['ans'] != want[f['id']]: bad(it, 'nuclear %s want %s got %s' % (f['id'], want[f['id']], f['ans'])); return
    ok(it)
def v_nu_type(it):
    eq = ces(it['q'])[0]; (A, Z, sy), (A2, Z2, d) = nuc_parts(eq)[:2]
    if SYMZ[sy] != Z or SYMZ[d] != Z2: bad(it, 'symbols'); return
    want = 'Alpha particle' if (A - A2, Z - Z2) == (4, 2) else 'Beta particle' if (A - A2, Z - Z2) == (0, -1) else 'Positron' if (A - A2, Z - Z2) == (0, 1) else '?'
    if it['mc'][0] != want: bad(it, 'decay type %s vs %s' % (want, it['mc'][0]))
    else: ok(it)
def v_nu_half(it):
    q = it['q']; n = nums(q)
    if 'remains after' in q: th, m0, t = n[:3]; want = m0 / 2 ** (t / th)
    else: m0, left, th = n[:3]; want = th * math.log2(m0 / left)
    if not close(want, fans(it), 1e-6): bad(it, 'half-life want %s got %s' % (want, fans(it)))
    else: ok(it)
V.update({'su-curve': v_su_curve, 'su-sat': v_su_sat, 'mz-calc': v_mz_calc, 'mz-mass': v_mz_mass, 'mz-vol': v_mz_vol, 'mz-ions': v_mz_ions, 'dl-dil': v_dl, 'dl-water': v_dl,
          'cg-pct': v_cg_pct, 'cg-molal': v_cg_molal, 'cg-fp': v_cg_fp, 'cg-which': v_cg_which, 'ph-from-h': v_ph_from_h, 'ph-to-h': v_ph_to_h, 'ph-poh': v_ph_poh, 'ph-strong': v_ph_strong, 'ph-class': v_ph_class,
          'ti-calc': v_ti_calc, 'ti-salt': v_ti_salt, 'he-q': v_he_q, 'he-solve': v_he_solve, 'he-cal': v_he_cal, 'en-thermo': v_en_thermo, 'en-phase': v_en_phase, 'en-total': v_en_total,
          'nu-missing': v_nu_missing, 'nu-type': v_nu_type, 'nu-half': v_nu_half})
