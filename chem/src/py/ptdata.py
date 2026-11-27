"""Periodic table data for the app: [Z, symbol, name, mass, group, period, category, electronegativity, configuration]."""
import json, warnings, re
from decimal import Decimal, ROUND_HALF_UP
warnings.filterwarnings('ignore')
from mendeleev.fetch import fetch_table
t = fetch_table('elements')
CAT = {'Alkali metals': 'alkali', 'Alkaline earth metals': 'alkaline', 'Transition metals': 'transition', 'Poor metals': 'post', 'Metalloids': 'metalloid',
       'Nonmetals': 'nonmetal', 'Halogens': 'halogen', 'Noble gases': 'noble', 'Lanthanides': 'lanthanide', 'Actinides': 'actinide'}
from mendeleev import element
L = 'spdf'
def aufbau(c):
    toks = c.split(); core = [t for t in toks if t.startswith('[')]; sub = []
    for t in toks:
        if t.startswith('['): continue
        m = re.match(r'^(\d)([spdf])(\d*)$', t); n, l, k = int(m.group(1)), L.index(m.group(2)), int(m.group(3) or 1)
        sub.append((n + l, n, l, k))
    sub.sort()
    return ' '.join(core + ['%d%s%d' % (n, L[l], k) for _, n, l, k in sub])
rows = []
for _, r in t.iterrows():
    Z = int(r['atomic_number'])
    if Z > 118: continue
    e = element(Z)
    w = float(r['atomic_weight'])
    stable = Z not in (43, 61) and Z <= 92 and not (84 <= Z <= 89)
    mass = float(Decimal(str(r['atomic_weight'])).quantize(Decimal('0.01'), ROUND_HALF_UP)) if stable else int(round(w))
    cat = CAT.get(e.series, e.series)
    grp = int(r['group_id']) if r['group_id'] == r['group_id'] and r['group_id'] is not None else None
    en = e.en_pauling
    rows.append([Z, e.symbol, e.name, mass, grp, int(r['period']), cat, round(en, 2) if en else None, aufbau(str(e.econf))])
json.dump(rows, open('/home/claude/chem/py/pt.json', 'w'), separators=(',', ':'))
print(len(rows)); [print(rows[i]) for i in (0, 5, 7, 10, 16, 19, 25, 28, 34, 46, 55, 56, 79, 91, 117)]
print(sorted(set(x[6] for x in rows)))
