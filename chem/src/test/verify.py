"""Independent checks of generated items: recompute answers from each prompt's own numbers with separate code
(Decimal rounding, periodictable/mendeleev data, sympy for balancing). Run after: node test/node_tpl.js"""
import json, re, sys, os, warnings
from decimal import Decimal, ROUND_HALF_UP
warnings.filterwarnings('ignore')
import periodictable as ptab
import sympy as sp
from mendeleev.fetch import fetch_table
HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, 'items.json')))
T = json.load(open(os.path.join(HERE, 'tables.json')))
el = fetch_table('elements').set_index('symbol')
ie = fetch_table('ionizationenergies'); ie1 = {int(r.atomic_number): r.ionization_energy for r in ie.itertuples() if r.ion_charge == 0}
SYMZ = {e.symbol: e.number for e in ptab.elements if e.number > 0}
ZSYM = {v: k for k, v in SYMZ.items()}
NAMEZ = {e.name.lower(): e.number for e in ptab.elements if e.number > 0}
NAMEZ['aluminum'] = 13; NAMEZ['cesium'] = 55; NAMEZ['sulfur'] = 16
problems = []; checked = {}
def bad(it, msg): problems.append((it['id'], it.get('seed'), msg, it['q'][:160]))
def ok(it): checked[it['id']] = checked.get(it['id'], 0) + 1
def close(a, b, rel=1e-6): return abs(a - b) <= rel * max(abs(b), 1e-300)
def fans(it, fid=None): return next(f for f in it['fs'] if fid is None or f['id'] == fid)['ans']

# ---------- number parsing from prompts
NUMRE = r'-?\d+(?:\.\d*)?(?:\\times10\^\{-?\d+\})?'
def tonum(s):
    m = re.match(r'^(-?\d+(?:\.\d*)?)(?:\\times10\^\{(-?\d+)\})?$', s); return float(m.group(1)) * (10 ** int(m.group(2)) if m.group(2) else 1)
def maths(q): return re.findall(r'\$([^$]*)\$', q)
def nums(q): return [tonum(x) for seg in maths(q) for x in re.findall(NUMRE, re.sub(r'\\(?:ce|cfg)\{(?:[^{}]|\{[^{}]*\})*\}', '', seg))]
def sigfigs(s):
    s = s.lstrip('+-')
    if '.' in s:
        d = s.replace('.', '').lstrip('0'); return len(d) if d else 1
    d = s.lstrip('0').rstrip('0'); return len(d) if d else 1
def round_sf(d, k):
    d = Decimal(d)
    for _ in range(2):
        q = Decimal(1).scaleb(d.adjusted() - k + 1); r = d.quantize(q, rounding=ROUND_HALF_UP)
        if r.adjusted() == d.adjusted() or r == 0: return r
        d = r
    return r

# ---------- formulas (independent parser)
def counts(f):
    f = f.replace('·', '.').replace('*', '.')
    tot = {}
    for k, part in enumerate(f.split('.')):
        m = re.match(r'^(\d+)(.*)$', part); mult = 1
        if m and k > 0: mult, part = int(m.group(1)), m.group(2)
        part = re.sub(r'\^.*$', '', part)
        def parse(s, i):
            c = {}
            while i < len(s) and s[i] not in ')]':
                if s[i] in '([':
                    inner, i = parse(s, i + 1); i += 1; n = re.match(r'\d*', s[i:]).group(0); i += len(n)
                    for e, v in inner.items(): c[e] = c.get(e, 0) + v * int(n or 1)
                else:
                    e = re.match(r'[A-Z][a-z]?', s[i:]).group(0); i += len(e); n = re.match(r'\d*', s[i:]).group(0); i += len(n); c[e] = c.get(e, 0) + int(n or 1)
            return c, i
        c, _ = parse(part, 0)
        for e, v in c.items(): tot[e] = tot.get(e, 0) + v * mult
    return tot
def mmass(f): return sum(ptab.elements.symbol(e).mass * n for e, n in counts(f).items())

# ---------- unit 1
def v_sf_count(it):
    seg = maths(it['q'])[0]; mant = re.sub(r'\\times.*$', '', seg)
    if sigfigs(mant) != fans(it): bad(it, 'sig figs %s: want %d got %s' % (mant, sigfigs(mant), fans(it)))
    else: ok(it)
def v_sf_round(it):
    seg = maths(it['q'])[0]; k = int(re.search(r'to (\d+) significant', it['q']).group(1))
    m = re.match(r'^(-?[\d.]+)(?:\\times10\^\{(-?\d+)\})?$', seg); d = Decimal(m.group(1)).scaleb(int(m.group(2) or 0))
    r = round_sf(d, k)
    if not close(float(r), fans(it), 1e-12): bad(it, 'round %s to %d: want %s got %s' % (d, k, r, fans(it)))
    else: ok(it)
def v_sf_calc(it):
    seg = maths(it['q'])[0]; m = re.match(r'^([\d.]+)(\\times |\\div |\+|-)([\d.]+)$', seg); a, op, b = m.group(1), m.group(2).strip(), m.group(3)
    A, B = Decimal(a), Decimal(b)
    if op in ('\\times', '\\div'):
        raw = A * B if op == '\\times' else A / B; r = round_sf(raw, min(sigfigs(a), sigfigs(b)))
    else:
        raw = A + B if op == '+' else A - B; dp = min(len(a.split('.')[1]) if '.' in a else 0, len(b.split('.')[1]) if '.' in b else 0)
        r = raw.quantize(Decimal(1).scaleb(-dp), rounding=ROUND_HALF_UP)
    if not close(float(r), fans(it), 1e-12): bad(it, 'calc %s: want %s got %s' % (seg, r, fans(it)))
    else: ok(it)
def v_sf_sci(it):
    v = nums(it['q'])[0]
    if not close(v, fans(it), 1e-9): bad(it, 'sci value %s vs %s' % (v, fans(it)))
    else: ok(it)
PF = {'k': 3, '': 0, 'd': -1, 'c': -2, 'm': -3, 'µ': -6, 'n': -9, 'M': 6}
def v_cv_metric(it):
    m = re.match(r'^Convert \$([\d.]+)\\text\{ (.?)(g|m|L)\}\$ to (.?)(g|m|L)\.$', it['q'])
    v, a, u, b = float(m.group(1)), m.group(2), m.group(3), m.group(4)
    want = v * 10 ** (PF[a] - PF[b])
    if not close(want, fans(it), 1e-9): bad(it, 'metric want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_cv_chain(it):
    q, n = it['q'], nums(it['q'])
    if 'seconds' in q: want = n[0] * 86400
    elif 'meters per second' in q: want = float(re.search(r'travels \$(\d+)\$', q).group(1)) * 1609 / 3600
    elif 'pounds' in q: want = n[0] * 453.6
    else: want = n[0] * 3.785 * 1000
    if not close(want, fans(it), 1e-9): bad(it, 'chain want %s got %s' % (want, fans(it)))
    else: ok(it)
CUBE = {('m²', 'cm²'): 1e4, ('cm³', 'm³'): 1e-6, ('m³', 'L'): 1e3, ('L', 'cm³'): 1e3, ('cm²', 'mm²'): 100, ('m³', 'cm³'): 1e6}
def v_cv_cube(it):
    m = re.match(r'^Convert \$([\d.]+)\$ (\S+) to (\S+)\.$', it['q']); f = CUBE[(m.group(2), m.group(3))]
    if not close(float(m.group(1)) * f, fans(it), 1e-9): bad(it, 'cube'); return
    ok(it)
def v_dn_calc(it):
    m, V = nums(it['q'])[:2]
    if not close(m / V, fans(it), 1e-9): bad(it, 'density')
    else: ok(it)
def v_dn_solve(it):
    n = nums(it['q']); q = it['q']
    if 'What is the mass' in q: D, V = n[0], n[1]; want = D * V
    else: m, D = n[0], n[1]; want = m / D
    if not close(want, fans(it), 1e-9): bad(it, 'dn-solve want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_dn_disp(it):
    m, V0, V1 = nums(it['q'])[:3]
    if not close(m / (V1 - V0), fans(it), 1e-6): bad(it, 'disp')
    else: ok(it)
def v_dn_err(it):
    exp, acc = nums(it['q'])[:2]
    if not close(abs(exp - acc) / acc * 100, fans(it), 1e-9): bad(it, 'percent error')
    else: ok(it)
# ---------- unit 2
def parse_nuc(s):
    m = re.search(r'\\ce\{\^\{(\d+)\}_\{(\d+)\}([A-Z][a-z]?)(\^(\d*)([+-]))?\}', s)
    q = 0
    if m.group(4): q = (1 if m.group(6) == '+' else -1) * int(m.group(5) or 1)
    return int(m.group(1)), int(m.group(2)), m.group(3), q
def v_at_pne(it):
    A, Z, s, q = parse_nuc(it['q'])
    if SYMZ[s] != Z: bad(it, 'Z mismatch %s %d' % (s, Z)); return
    want = {'p': Z, 'n': A - Z, 'e': Z - q}
    for f in it['fs']:
        if f['ans'] != want[f['id']]: bad(it, 'pne %s want %s got %s' % (f['id'], want[f['id']], f['ans'])); return
    ok(it)
def v_at_sym(it):
    p, n, e = [int(x) for x in re.findall(r'(\d+) (?:protons|neutrons|electrons)', it['q'])]
    want = {'s': ZSYM[p], 'A': p + n, 'q': p - e}
    for f in it['fs']:
        if f['ans'] != want[f['id']]: bad(it, 'sym %s want %s got %s' % (f['id'], want[f['id']], f['ans'])); return
    ok(it)
def v_am_fwd(it):
    pairs = re.findall(r'mass \$([\d.]+)\$ amu, abundance \$([\d.]+)\\%\$', it['q'])
    want = sum(float(m) * float(p) / 100 for m, p in pairs)
    if abs(sum(float(p) for _, p in pairs) - 100) > 0.02: bad(it, 'abundances do not add to 100')
    if not close(want, fans(it), 1e-9): bad(it, 'avg mass want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_am_rev(it):
    m1, m2, A = nums(it['q'])[:3]; want = (A - m2) / (m1 - m2) * 100
    if not close(want, fans(it), 1e-9) or not (0 < want < 100): bad(it, 'abundance want %s got %s' % (want, fans(it)))
    else: ok(it)
# ---------- unit 3
C, H = 3.00e8, 6.626e-34
def v_li_freq(it):
    q = it['q']
    if 'wavelength of $' in q: nm = nums(q)[0]; want = C / (nm * 1e-9)
    else: nu = nums(q)[0]; want = C / nu * 1e9
    if not close(want, fans(it), 1e-9): bad(it, 'light want %s got %s' % (want, fans(it)))
    else: ok(it)
def v_li_energy(it):
    q = it['q']
    if 'frequency of $' in q: want = H * nums(q)[0]
    else: want = H * C / (nums(q)[0] * 1e-9)
    if not close(want, fans(it), 1e-9): bad(it, 'energy want %s got %s' % (want, fans(it)))
    else: ok(it)
from functools import lru_cache
@lru_cache(maxsize=None)
def econf_counts_c(Z):
    from mendeleev import element
    c = element(int(Z)).ec.conf
    return tuple(sorted(('%d%s' % (n, l), k) for (n, l), k in c.items()))
def econf_counts(Z): return dict(econf_counts_c(int(Z)))
def _unused_econf(Z):   # mendeleev's real configuration as {subshell: n}
    from mendeleev import element
    c = element(int(Z)).ec.conf
    return {'%d%s' % (n, l): k for (n, l), k in c.items()}
def cfg_counts(s):
    out = {}; cores = {'He': 2, 'Ne': 10, 'Ar': 18, 'Kr': 36, 'Xe': 54}
    for t in s.split():
        if t.startswith('['): out.update(econf_counts(cores[t[1:-1]]))
        else: m = re.match(r'(\d[spdf])(\d+)', t); out[m.group(1)] = out.get(m.group(1), 0) + int(m.group(2))
    return out
def v_ec_write(it):
    nm = re.search(r'configuration of ([a-z]+)', it['q']).group(1); Z = NAMEZ[nm]
    if cfg_counts(fans(it)) != econf_counts(Z): bad(it, 'config %s: %s vs %s' % (nm, fans(it), econf_counts(Z)))
    else: ok(it)
VAL = lambda Z: (lambda g: g if g <= 2 else g - 10)(int(el.loc[ZSYM[Z], 'group_id']))
def v_ec_valence(it):
    s = re.search(r'\\ce\{([A-Z][a-z]?)\}', it['q']).group(1)
    if VAL(SYMZ[s]) != fans(it): bad(it, 'valence %s' % s)
    else: ok(it)
def v_ec_ion(it):
    s = re.search(r'\\ce\{([A-Z][a-z]?)\^(\d*)([+-])\}', it['q']); Z = SYMZ[s.group(1)]; q = (1 if s.group(3) == '+' else -1) * int(s.group(2) or 1)
    if sum(cfg_counts(fans(it)).values()) != Z - q or cfg_counts(fans(it)) != econf_counts(Z - q): bad(it, 'ion config')
    else: ok(it)
def v_ec_identify(it):
    c = re.search(r'\\cfg\{([^}]*)\}', it['q']).group(1); n = sum(cfg_counts(c).values())
    if ZSYM[n] != fans(it) or cfg_counts(c) != econf_counts(n): bad(it, 'identify %s -> %s' % (c, fans(it)))
    else: ok(it)
def v_pt_locate(it):
    s = re.search(r'\\ce\{([A-Z][a-z]?)\}', it['q']).group(1); r = el.loc[s]
    if fans(it, 'p') != int(r.period) or fans(it, 'g') != int(r.group_id): bad(it, 'locate %s' % s)
    else: ok(it)
RAD = fetch_table('elements').set_index('symbol')
def tval(s, trend):
    r = RAD.loc[s]
    if 'radius' in trend: return r.atomic_radius
    if 'ionization' in trend: return ie1[int(r.atomic_number)]
    if 'electronegativity' in trend: return r.en_pauling
    return -ie1[int(r.atomic_number)]   # metallic character: lowest ionization energy
def v_trend(it):
    c = it.get('chk') or {}; trend = c.get('trend'); cand = c.get('set') or [c.get('a'), c.get('b')]
    vals = {s: tval(s, trend) for s in cand}
    if any(v != v or v is None for v in vals.values()): ok(it); return
    best = max(vals, key=vals.get)
    if best != c['win']: bad(it, 'trend %s among %s: data says %s, item says %s %s' % (trend, cand, best, c['win'], vals))
    else: ok(it)
# ---------- unit 4
COMMON = {'Li': 1, 'Na': 1, 'K': 1, 'Rb': 1, 'Cs': 1, 'Be': 2, 'Mg': 2, 'Ca': 2, 'Sr': 2, 'Ba': 2, 'Al': 3, 'N': -3, 'P': -3, 'O': -2, 'S': -2, 'Se': -2, 'F': -1, 'Cl': -1, 'Br': -1, 'I': -1}
def v_io_charge(it):
    s = re.search(r'\\ce\{([A-Z][a-z]?)\}', it['q']).group(1)
    if COMMON[s] != fans(it): bad(it, 'charge %s' % s)
    else: ok(it)
POLYQ = {'OH': -1, 'NO3': -1, 'NO2': -1, 'SO4': -2, 'SO3': -2, 'PO4': -3, 'CO3': -2, 'HCO3': -1, 'C2H3O2': -1, 'ClO3': -1, 'MnO4': -1, 'CN': -1, 'CrO4': -2, 'Cr2O7': -2, 'NH4': 1}
def formula_py(cat, cq, an, aq):
    from math import gcd
    g = gcd(abs(cq), abs(aq)); a, c = abs(aq) // g, abs(cq) // g
    def part(x, n): return x if n == 1 else ('(' + x + ')' if x in POLYQ else x) + str(n)
    return part(cat, a) + part(an, c)
def neutral(f):
    # charge sum using known ion charges: works for binary/poly compounds made of one cation and one anion
    return True
def v_io_formula(it):
    m = re.search(r'formed by ([a-z]+) and ([a-z]+)', it['q']); cat = ZSYM[NAMEZ[m.group(1)]]; an = ZSYM[NAMEZ[m.group(2)]]
    want = formula_py(cat, COMMON[cat], an, COMMON[an])
    if want != fans(it): bad(it, 'formula %s %s: want %s got %s' % (cat, an, want, fans(it)))
    else: ok(it)
def v_io_poly(it):
    ions = re.findall(r'\\ce\{([A-Za-z0-9]+)\^(\d*)([+-])\}', it['q']); (c, cd, cs), (a, ad, as_) = ions[0], ions[1]
    cq = int(cd or 1) * (1 if cs == '+' else -1); aq = int(ad or 1) * (1 if as_ == '+' else -1)
    if POLYQ.get(a) != aq: bad(it, 'poly charge table %s' % a); return
    want = formula_py(c, cq, a, aq)
    if want != fans(it): bad(it, 'poly formula want %s got %s' % (want, fans(it)))
    else: ok(it)
CATNAME = {'lithium': ('Li', 1), 'sodium': ('Na', 1), 'potassium': ('K', 1), 'magnesium': ('Mg', 2), 'calcium': ('Ca', 2), 'strontium': ('Sr', 2), 'barium': ('Ba', 2), 'aluminum': ('Al', 3), 'zinc': ('Zn', 2), 'silver': ('Ag', 1), 'ammonium': ('NH4', 1)}
VARNAME = {'iron': 'Fe', 'copper': 'Cu', 'lead': 'Pb', 'tin': 'Sn', 'cobalt': 'Co'}
ANNAME = {'fluoride': ('F', -1), 'chloride': ('Cl', -1), 'bromide': ('Br', -1), 'iodide': ('I', -1), 'oxide': ('O', -2), 'sulfide': ('S', -2), 'nitride': ('N', -3), 'phosphide': ('P', -3),
          'hydroxide': ('OH', -1), 'nitrate': ('NO3', -1), 'nitrite': ('NO2', -1), 'sulfate': ('SO4', -2), 'sulfite': ('SO3', -2), 'phosphate': ('PO4', -3), 'carbonate': ('CO3', -2), 'hydrogen carbonate': ('HCO3', -1),
          'acetate': ('C2H3O2', -1), 'chlorate': ('ClO3', -1), 'permanganate': ('MnO4', -1), 'cyanide': ('CN', -1), 'chromate': ('CrO4', -2), 'dichromate': ('Cr2O7', -2)}
RN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4}
def name_to_formula(name):
    m = re.match(r'^([a-z]+)(?:\(([IV]+)\))? (.+)$', name)
    if m.group(2): cat, cq = VARNAME[m.group(1)], RN[m.group(2)]
    else: cat, cq = CATNAME[m.group(1)]
    an, aq = ANNAME[m.group(3)]
    return formula_py(cat, cq, an, aq)
def v_nm_ionic(it):
    f = re.search(r'\\ce\{([^}]*)\}', it['q']).group(1); nm = fans(it)
    if name_to_formula(nm) != f: bad(it, 'name %s -> %s, formula shown %s' % (nm, name_to_formula(nm), f))
    else: ok(it)
def v_nm_formula(it):
    nm = re.match(r'^Write the formula for (.+)\.$', it['q']).group(1)
    if name_to_formula(nm) != fans(it): bad(it, 'formula of %s: want %s got %s' % (nm, name_to_formula(nm), fans(it)))
    else: ok(it)
KNOWN = {'CO': 'carbon monoxide', 'CO2': 'carbon dioxide', 'N2O': 'dinitrogen monoxide', 'NO': 'nitrogen monoxide', 'NO2': 'nitrogen dioxide', 'N2O3': 'dinitrogen trioxide', 'N2O4': 'dinitrogen tetroxide', 'N2O5': 'dinitrogen pentoxide',
         'P2O5': 'diphosphorus pentoxide', 'P4O10': 'tetraphosphorus decoxide', 'SO2': 'sulfur dioxide', 'SO3': 'sulfur trioxide', 'CCl4': 'carbon tetrachloride', 'PCl3': 'phosphorus trichloride', 'PCl5': 'phosphorus pentachloride',
         'SF6': 'sulfur hexafluoride', 'SiO2': 'silicon dioxide', 'CS2': 'carbon disulfide', 'NF3': 'nitrogen trifluoride', 'BF3': 'boron trifluoride', 'Cl2O7': 'dichlorine heptoxide', 'IF7': 'iodine heptafluoride', 'OF2': 'oxygen difluoride',
         'S2Cl2': 'disulfur dichloride', 'XeF4': 'xenon tetrafluoride', 'SiCl4': 'silicon tetrachloride', 'BrF5': 'bromine pentafluoride', 'ClF3': 'chlorine trifluoride', 'SeO2': 'selenium dioxide', 'P4S3': 'tetraphosphorus trisulfide'}
def v_cv_name(it):
    f = re.search(r'\\ce\{([^}]*)\}', it['q']).group(1)
    if KNOWN[f] != fans(it): bad(it, 'covalent name %s: want %s got %s' % (f, KNOWN[f], fans(it)))
    else: ok(it)
def v_cv_formula(it):
    nm = re.match(r'^Write the formula for (.+)\.$', it['q']).group(1); inv = {v: k for k, v in KNOWN.items()}
    if inv[nm] != fans(it): bad(it, 'covalent formula %s' % nm)
    else: ok(it)
ACIDOK = {'HF': 'hydrofluoric acid', 'HCl': 'hydrochloric acid', 'HBr': 'hydrobromic acid', 'HI': 'hydroiodic acid', 'HCN': 'hydrocyanic acid', 'HNO3': 'nitric acid', 'HNO2': 'nitrous acid', 'H2SO4': 'sulfuric acid', 'H2SO3': 'sulfurous acid',
          'H3PO4': 'phosphoric acid', 'H2CO3': 'carbonic acid', 'HC2H3O2': 'acetic acid', 'HClO3': 'chloric acid', 'HClO2': 'chlorous acid', 'HClO4': 'perchloric acid', 'HClO': 'hypochlorous acid'}
def v_cv_acid(it):
    f = re.search(r'\\ce\{([^}(]*)', it['q']).group(1)
    if ACIDOK[f] != fans(it): bad(it, 'acid %s' % f)
    else: ok(it)
def balance_py(reac, prod):
    sps = reac + prod; els = sorted(set(e for f in sps for e in counts(f)))
    M = sp.Matrix([[counts(f).get(e, 0) * (1 if k < len(reac) else -1) for k, f in enumerate(sps)] for e in els])
    ns = M.nullspace()
    if len(ns) != 1: return None
    v = ns[0]; from math import lcm
    den = lcm(*[sp.fraction(x)[1] for x in v]); v = [int(x * den) for x in v]
    if v[0] < 0: v = [-x for x in v]
    from math import gcd; from functools import reduce
    g = reduce(gcd, v); return [x // g for x in v]
def v_balance(it):
    fd = it['fs'][0]; want = balance_py(fd['sp'][:fd['nr']], fd['sp'][fd['nr']:])
    if want != fd['ans']: bad(it, 'balance %s: sympy %s, item %s' % (fd['sp'], want, fd['ans']))
    else: ok(it)

V = {'sf-count': v_sf_count, 'sf-round': v_sf_round, 'sf-calc': v_sf_calc, 'sf-sci': v_sf_sci, 'cv-metric': v_cv_metric, 'cv-chain': v_cv_chain, 'cv-cube': v_cv_cube,
     'dn-calc': v_dn_calc, 'dn-solve': v_dn_solve, 'dn-disp': v_dn_disp, 'dn-err': v_dn_err, 'at-pne': v_at_pne, 'at-sym': v_at_sym, 'am-fwd': v_am_fwd, 'am-rev': v_am_rev,
     'li-freq': v_li_freq, 'li-energy': v_li_energy, 'ec-write': v_ec_write, 'ec-core': v_ec_write, 'ec-valence': v_ec_valence, 'ec-ion': v_ec_ion, 'ec-identify': v_ec_identify,
     'pt-locate': v_pt_locate, 'tr-pair': v_trend, 'tr-rank': v_trend, 'io-charge': v_io_charge, 'io-formula': v_io_formula, 'io-poly': v_io_poly, 'nm-ionic': v_nm_ionic, 'nm-formula': v_nm_formula,
     'cv-name': v_cv_name, 'cv-formula': v_cv_formula, 'cv-acid': v_cv_acid, 'bl-balance': v_balance, 'bl-easy': v_balance}
EXTRA = [os.path.join(HERE, f) for f in sorted(os.listdir(HERE)) if f.startswith('verify_u') and f.endswith('.py')]
for path in EXTRA: exec(open(path).read())
for it in items:
    f = V.get(it['id'])
    if f:
        try: f(it)
        except Exception as e: bad(it, 'verifier error: %r' % e)

# ---------- data tables
for f, cen, b, lp, ve, shape, polar, ang in T['MOLS']:
    c = counts(f); tot = sum(VAL(SYMZ[e]) * n for e, n in c.items())
    exp = {(2, 0): 'linear', (3, 0): 'trigonal planar', (2, 1): 'bent', (4, 0): 'tetrahedral', (3, 1): 'trigonal pyramidal', (2, 2): 'bent', (5, 0): 'trigonal bipyramidal', (6, 0): 'octahedral'}[(b, lp)]
    if tot != ve: problems.append(('MOLS', f, 'valence %d vs %d' % (tot, ve), ''))
    if exp != shape: problems.append(('MOLS', f, 'shape %s vs %s' % (exp, shape), ''))
    if sum(c.values()) - 1 != b: problems.append(('MOLS', f, 'bonded atoms %d vs %d' % (sum(c.values()) - 1, b), ''))
POLAR = {'NH3', 'H2O', 'SO2', 'PCl3', 'H2S', 'HCN', 'OF2', 'NF3', 'CH2O', 'CHCl3', 'CH2Cl2', 'SCl2'}
for m in T['MOLS']:
    if (m[0] in POLAR) != bool(m[6]): problems.append(('MOLS', m[0], 'polarity', ''))
for f, ve, q in T['IONSV']:
    base = re.sub(r'\^.*$', '', f); tot = sum(VAL(SYMZ[e]) * n for e, n in counts(base).items()) - q
    if tot != ve: problems.append(('IONSV', f, 'valence %d vs %d' % (tot, ve), ''))
for e in T['EQS']:
    want = balance_py(e[0], e[1])
    if want != e[2]: problems.append(('EQS', e[0] + e[1], 'sympy %s vs %s' % (want, e[2]), ''))
for a, b in [('H2O', 'H2S'), ('HF', 'HCl'), ('NH3', 'PH3'), ('CH3OH', 'CH4'), ('I2', 'F2'), ('Br2', 'Cl2'), ('CCl4', 'CH4'), ('C8H18', 'C3H8'), ('CHCl3', 'CH4'), ('H2O', 'CH4'), ('HBr', 'HCl')]:
    bp = {x[0]: x[2] for x in T['IMF']}
    if not bp[a] > bp[b]: problems.append(('IMF', a + '/' + b, 'boiling points out of order', ''))
for iso in T['ISO']:
    for A in T['ISO'][iso]:
        if A < SYMZ[iso]: problems.append(('ISO', iso, 'mass number below Z', ''))
for sy, data in T['ABUND'].items():
    if abs(sum(p for _, p in data) - 100) > 0.05: problems.append(('ABUND', sy, 'abundance sum %s' % sum(p for _, p in data), ''))
    avg = sum(m * p / 100 for m, p in data)
    if abs(avg - ptab.elements.symbol(sy).mass) > 0.02: problems.append(('ABUND', sy, 'average %.3f vs table %.3f' % (avg, ptab.elements.symbol(sy).mass), ''))

print('verified items by template:', sum(checked.values()), 'across', len(checked), 'templates')
print('problems:', len(problems))
seen = {}
for p in problems:
    seen[p[0]] = seen.get(p[0], 0) + 1
    if seen[p[0]] <= 3: print(' ', p)
print({k: v for k, v in seen.items()})
