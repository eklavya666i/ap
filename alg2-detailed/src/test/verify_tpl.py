import os
import json, string, sys
import sympy as sp
SYM = {ch: sp.Symbol(ch, real=True) for ch in string.ascii_letters}
SYM['sqrt'] = sp.sqrt
def read_arg(s, i):
    if s[i] == '{':
        d = 0; j = i
        while True:
            if s[j] == '{': d += 1
            elif s[j] == '}':
                d -= 1
                if d == 0: return s[i+1:j], j+1
            j += 1
    return s[i], i+1
def lin2py(s):
    s = s.replace(' ', '')
    toks = []; i = 0
    while i < len(s):
        c = s[i]
        if s.startswith('sqrt', i):
            toks.append(('A', 'sqrt')); i += 4
        elif c == '^':
            a, i = read_arg(s, i+1); toks.append(('P', '**(' + lin2py(a) + ')'))
        elif c.isdigit() or c == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'): j += 1
            toks.append(('A', s[i:j])); i = j
        elif c.isalpha(): toks.append(('A', c)); i += 1
        elif c == '(': toks.append(('O', '(')); i += 1
        elif c == ')': toks.append(('C', ')')); i += 1
        elif c in '+-*/': toks.append(('X', c)); i += 1
        else: raise ValueError('bad %r in %r' % (c, s))
    out = ''; prev = None
    for t, v in toks:
        if prev in ('A', 'C', 'P') and t in ('A', 'O') and not (prev == 'A' and out.endswith('sqrt')): out += '*'
        out += v; prev = t
    return out
def P(s): return sp.nsimplify(sp.sympify(lin2py(str(s)), locals=SYM), rational=True)
x = SYM['x']
def zeros(dens, var=x):
    zs = set()
    for d in dens:
        num, den = sp.fraction(sp.together(P(d)))
        for part in (num, den):
            for r in sp.solve(sp.Eq(part, 0), var):
                if r.is_real: zs.add(sp.nsimplify(r))
    return zs
def eq(a, b): return sp.simplify(sp.cancel(sp.together(a - b))) == 0
def solset(lhs, rhs, dens, var=x):
    L, Rr = P(lhs), P(rhs)
    lcd = sp.lcm_list([sp.fraction(sp.together(P(d)))[0] if not sp.fraction(sp.together(P(d)))[1].free_symbols else P(d) for d in dens])
    N = sp.expand(sp.cancel((L - Rr) * lcd))
    bad = zeros(dens, var); good = set(); ext = set()
    for r in sp.solve(sp.Eq(N, 0), var):
        if not r.is_real: continue
        r = sp.nsimplify(r)
        if r in bad: ext.add(r); continue
        if sp.simplify((L - Rr).subs(var, r)) == 0: good.add(r)
    return good, ext
items = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'items.json')))
probs = []; seen = {}
for it in items:
    k = it['k']; c = it.get('chk', {}); tag = '%s#%d' % (it['id'], it['seed'])
    try:
        if k == 'f':
            if sp.expand(P(it['ans']['e']) - P(c['e'])) != 0: probs.append(tag + ' factor mismatch')
            fl = sp.factor_list(P(c['e']))[1]; want = sum(m for f, m in fl if f.free_symbols)
            got = sp.factor_list(P(it['ans']['e']))[1]; gotn = sum(m for f, m in got if f.free_symbols)
            if want != gotn: probs.append(tag + ' not completely factored by sympy: %s' % fl)
        elif k == 'er':
            if not eq(P(c['e']), P(it['ans']['e'])): probs.append(tag + ' expr mismatch %s vs %s' % (c['e'], it['ans']['e']))
            Z = zeros(c['dens']); R = set(P(v) for v in it['rz'])
            if Z != R: probs.append(tag + ' restrictions %s vs %s' % (sorted(R), sorted(Z)))
            for kk in ('cz', 'bz', 'dz'):
                for v in it.get(kk, []):
                    if P(v) not in Z: probs.append(tag + ' %s value %s not a restriction' % (kk, v))
            ad = sp.fraction(sp.together(P(it['ans']['e'])))[1]
            if sp.degree(sp.Poly(sp.cancel(P(c['e'])).as_numer_denom()[1], x)) != sp.degree(sp.Poly(ad, x)) if ad.free_symbols else False:
                probs.append(tag + ' answer not fully simplified')
        elif k == 'v':
            if zeros(c['dens']) != set(P(v) for v in it['ans']['v']): probs.append(tag + ' domain mismatch')
        elif k == 's':
            good, ext = solset(c['lhs'], c['rhs'], c['dens'])
            if good != set(P(v) for v in it['ans']['v']): probs.append(tag + ' solutions %s vs %s' % (sorted(good), it['ans']['v']))
            if set(P(v) for v in it.get('ex', [])) != ext: probs.append(tag + ' extraneous %s vs %s' % (sorted(ext), it.get('ex')))
        elif k == 'p':
            good, _ = solset(c['f1'], c['f2'], c['dens'])
            truth = set((g, sp.nsimplify(P(c['f1']).subs(x, g))) for g in good)
            mine = set((P(a), P(b)) for a, b in it['ans']['p'])
            if truth != mine: probs.append(tag + ' points %s vs %s' % (truth, mine))
        elif k == 'n':
            tol = it['ans'].get('tol', 1e-9) + 1e-9; want = float(P(it['ans']['n']))
            if 'e' in c: truth = float(P(c['e']))
            else:
                v = SYM[c['v']]; num, den = sp.fraction(sp.together(P(c['solve'])))
                rs = [r for r in sp.solve(sp.Eq(num, 0), v) if r.is_real and float(r) > c['gt'] and den.subs(v, r) != 0]
                if len(rs) != 1: probs.append(tag + ' roots %s' % rs); continue
                truth = float(rs[0])
            if abs(truth - want) > tol: probs.append(tag + ' number %s vs truth %s' % (want, truth))
            for t in it['traps']:
                if abs(float(t['n']) - truth) <= tol: probs.append(tag + ' trap equals truth')
    except Exception as e:
        probs.append(tag + ' EXC %s: %s' % (type(e).__name__, e))
    seen[it['id']] = seen.get(it['id'], 0) + 1
print('checked', len(items), 'items across', len(seen), 'templates; problems:', len(probs))
for p in probs[:25]: print('  ', p)
