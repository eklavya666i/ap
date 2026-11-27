"""Builds alg2-detailed/ (index.html, sw.js, manifest, icons) from js/, shell.html and content.py.
Run: python3 build.py   (needs sympy and pillow). Checks: node test/node_check.js && python3 test/verify_tpl.py && node test/node_bank.js"""
import json, re, os, sys, hashlib, string
import sympy as sp
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import DATA
from PIL import Image, ImageDraw

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(SRC)   # the app folder: alg2-detailed/
os.makedirs(OUT, exist_ok=True)

# ---------- helpers (same conventions as the Algebra app's verifier)
SYM = {ch: sp.Symbol(ch, real=True) for ch in string.ascii_letters}
SYM['sqrt'] = sp.sqrt
def read_arg(s, i):
    if i < len(s) and s[i] == '{':
        d = 0; j = i
        while j < len(s):
            if s[j] == '{': d += 1
            elif s[j] == '}':
                d -= 1
                if d == 0: return s[i+1:j], j+1
            j += 1
        raise ValueError('unbalanced')
    return s[i], i + 1
def tex2py(s):
    for a, b in [(r'\left', ''), (r'\right', ''), (r'\cdot', '*'), (r'\times', '*'), (r'\div', '/'), (r'\approx', ''), (r'\,', ''), (r'\;', ''), (r'\ ', ''), (' ', '')]:
        s = s.replace(a, b)
    toks = []; i = 0
    while i < len(s):
        if s.startswith(r'\frac', i) or s.startswith(r'\f', i):
            i += 5 if s.startswith(r'\frac', i) else 2
            a, i = read_arg(s, i); b, i = read_arg(s, i)
            toks.append(('A', '((' + tex2py(a) + ')/(' + tex2py(b) + '))'))
        elif s.startswith(r'\sqrt', i):
            i += 5; a, i = read_arg(s, i); toks.append(('A', 'sqrt(' + tex2py(a) + ')'))
        elif s[i] == '^':
            a, i = read_arg(s, i + 1); toks.append(('P', '**(' + tex2py(a) + ')'))
        elif s[i].isdigit() or s[i] == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'): j += 1
            toks.append(('A', s[i:j])); i = j
        elif s[i].isalpha(): toks.append(('A', s[i])); i += 1
        elif s[i] == '(': toks.append(('O', '(')); i += 1
        elif s[i] == ')': toks.append(('C', ')')); i += 1
        elif s[i] in '+-*/': toks.append(('X', s[i])); i += 1
        else: raise ValueError('bad char %r in %r' % (s[i], s))
    out = ''; prev = None
    for t, v in toks:
        if prev in ('A', 'C', 'P') and t in ('A', 'O'): out += '*'
        out += v; prev = t
    return out
S_ = lambda tex: sp.nsimplify(sp.sympify(tex2py(tex), locals=SYM), rational=True)
P_ = lambda py: sp.sympify(py, locals=SYM)
segs = lambda ch: re.findall(r'\$(.+?)\$', ch)
text_of = lambda ch: re.sub(r'\$.+?\$', '', ch).lower()
def split_top(s):
    parts, d, cur = [], 0, ''
    for ch in s:
        if ch == '{': d += 1
        elif ch == '}': d -= 1
        if ch == ',' and d == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur); return parts
def vals_from(seg):
    seg = seg.replace(' ', ''); seg = re.sub(r'^[a-zA-Z]\\ne', '', seg); seg = re.sub(r'^[a-zA-Z]=', '', seg)
    out = []
    for p in split_top(seg):
        p = p.strip()
        if not p: continue
        if r'\pm' in p: out += [S_(p.replace(r'\pm', '+', 1)), S_(p.replace(r'\pm', '-', 1))]
        else: out.append(S_(p))
    return [sp.nsimplify(v) for v in out]
def zeros(dens, var):
    zs = set()
    for d in dens:
        num, den = sp.fraction(sp.together(P_(d)))
        for part in (num, den):
            for r in sp.solve(sp.Eq(part, 0), var):
                if r.is_real: zs.add(sp.nsimplify(r))
    return zs
def equiv(a, b): return sp.simplify(sp.cancel(sp.together(a - b))) == 0
def solset(lhs, rhs, dens, var):
    L, R = P_(lhs), P_(rhs)
    lcd = sp.lcm_list([P_(d) for d in dens])
    N = sp.expand(sp.cancel((L - R) * lcd))
    bad = zeros(dens, var); good = set(); ext = set()
    for r in sp.solve(sp.Eq(N, 0), var):
        if not r.is_real: continue
        r = sp.nsimplify(r)
        if r in bad: ext.add(r); continue
        if sp.simplify((L - R).subs(var, r)) == 0: good.add(r)
    return good, ext
def vstr(v): return str(sp.nsimplify(v)).replace(' ', '')
def catOf(w):
    w = w or ''
    if re.search(r'sign|opposite', w, re.I): return 'slip'
    if re.search(r'restrict|exclud|extraneous|cancel|only factors|denominator|divisor|never add|flip|series', w, re.I): return 'concept'
    return 'procedure'
x = SYM['x']

def typed_spec(q):
    v = q['v']
    if not v: return None
    kind = v[0]; c0 = q['c'][0]
    traps_e = []
    def expr_traps(ans):
        out = []
        for i, d in enumerate(q['c'][1:]):
            sg = segs(d)
            if not sg: continue
            try:
                e = S_(sg[0]); py = tex2py(sg[0])
            except Exception: continue
            t = {'e': py, 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])}
            if 'all real' in text_of(d): t['v'] = []
            elif len(sg) > 1:
                try: t['v'] = [vstr(z) for z in vals_from(sg[1])]
                except Exception: pass
            if equiv(e, ans): t['eqv'] = 1
            out.append(t)
        return out
    if kind in ('simp', 'eq', 'lcd', 'fac'):
        sg = segs(c0); ans = S_(sg[0]); fv = {str(s) for s in ans.free_symbols}
        if not fv <= {'x'}: return None
        spec = {'k': {'simp': 'er', 'eq': 'e', 'lcd': 'e', 'fac': 'f'}[kind], 'ans': {'e': tex2py(sg[0])}, 'traps': expr_traps(ans)}
        if kind == 'simp':
            orig = P_(v[1]); rz = sorted(zeros(v[2], x), key=lambda z: float(z))
            spec['rz'] = [vstr(z) for z in rz]
            ad = sp.fraction(sp.together(ans))[1]; keep = zeros([str(ad)], x) if ad.free_symbols else set()
            spec['cz'] = [vstr(z) for z in rz if z not in keep]
            num = sp.fraction(sp.together(orig))[0]
            nz = [r for r in sp.solve(sp.Eq(num, 0), x) if r.is_real and sp.nsimplify(r) not in set(rz)] if num.free_symbols else []
            spec['nz'] = [vstr(z) for z in nz]
        return spec
    if kind == 'dom':
        Z = sorted(zeros(v[1], x), key=lambda z: float(z)); tr = []
        for i, d in enumerate(q['c'][1:]):
            t = text_of(d)
            try: vs = [] if ('all real' in t or t.strip().startswith('none')) else [z for sg in segs(d) for z in vals_from(sg)]
            except Exception: continue
            tr.append({'v': [vstr(z) for z in vs], 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])})
        return {'k': 'v', 'ans': {'v': [vstr(z) for z in Z]}, 'traps': tr}
    if kind == 'sol':
        good, ext = solset(v[1], v[2], v[3], x); tr = []
        for i, d in enumerate(q['c'][1:]):
            t = text_of(d)
            if 'all real' in t: continue
            try: vs = [] if 'no solution' in t else [z for sg in segs(d) for z in vals_from(sg)]
            except Exception: continue
            tr.append({'v': [vstr(z) for z in vs], 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])})
        return {'k': 's', 'ans': {'v': [vstr(z) for z in sorted(good, key=float)]}, 'ex': [vstr(z) for z in ext], 'traps': tr}
    if kind == 'sys':
        good, _ = solset(v[1], v[2], v[3], x)
        pts = [[vstr(g), vstr(sp.nsimplify(P_(v[1]).subs(x, g)))] for g in sorted(good, key=float)]
        tr = []
        for i, d in enumerate(q['c'][1:]):
            if 'infinitely' in text_of(d) or (not segs(d) and 'no solution' not in text_of(d)): continue
            if 'no solution' in text_of(d): tr.append({'p': [], 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])}); continue
            try:
                pp = []
                for sg in segs(d):
                    m = re.match(r'^\((.*)\)$', sg.replace(r'\left', '').replace(r'\right', ''))
                    a, b = split_top(m.group(1)); pp.append([vstr(S_(a)), vstr(S_(b))])
                tr.append({'p': pp, 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])})
            except Exception: continue
        return {'k': 'p', 'ans': {'p': pts}, 'traps': tr}
    if kind in ('num', 'numsolve'):
        if kind == 'num': truth = sp.nsimplify(P_(v[1]))
        else:
            var = SYM[v[2]]; num, den = sp.fraction(sp.together(P_(v[1])))
            rs = [r for r in sp.solve(sp.Eq(num, 0), var) if r.is_real and float(r) > v[3] and sp.simplify(den.subs(var, r)) != 0]
            truth = rs[0]
        approx = r'\approx' in c0
        val = round(float(truth), 2) if approx else float(truth)
        nstr = (('%.2f' % val).rstrip('0').rstrip('.')) if approx else (str(int(val)) if float(val).is_integer() else repr(round(val, 6)))
        tr = []
        for i, d in enumerate(q['c'][1:]):
            try: tr.append({'n': float(S_(segs(d)[0])), 'why': q['w'][i], 'id': 'bank', 'cat': catOf(q['w'][i])})
            except Exception: continue
        unit = text_of(c0).strip()
        return {'k': 'n', 'ans': {'n': nstr, 'tol': 0.02 if approx else 0.001, 'unit': unit}, 'traps': tr}
    return None

ALT = {
 'fac': "Think of factoring as un-multiplying. Instead of hunting for a pattern, ask what two brackets would FOIL back to this. For $x^2-7x+10$, list the factor pairs of 10 (1 and 10, 2 and 5), then pick the pair that adds to $-7$ once you choose the signs: $-2$ and $-5$. Always multiply your answer back out. If you get the original, you're done.",
 'simp': "Picture the denominator as a machine that breaks at certain x-values. Before you touch anything, write those values in a box: they're excluded. Simplifying is just like reducing $\\f68$ to $\\f34$: divide the top and bottom by the same factor. The excluded values stay in the box even when a factor disappears, because the original machine still breaks there.",
 'md': "Multiplying fractions makes one big fraction: everything on top over everything on the bottom. So factor everything first, then cross out any factor that appears on top and on the bottom, anywhere in the problem. For division, rewrite it as multiplying by the reciprocal first; then it's the same game. The divisor's top becomes a bottom, so it adds a restriction.",
 'as': "You can only add pieces of the same size, which means the same denominator. The LCD is the smallest size every denominator fits into: list each different factor once, at its biggest power. Each fraction gets multiplied by 1 in disguise, like $\\f{x+2}{x+2}$, to reach that size. Only then do you add the tops.",
 'cf': "A complex fraction is a division problem written vertically: the top divided by the bottom. One way is to simplify the top to a single fraction, simplify the bottom to a single fraction, then multiply the top by the flipped bottom. The faster way is to multiply every little fraction by the LCD of all of them, so they all clear in one step.",
 'solve': "In an equation you're allowed to multiply both sides by the same thing, so multiply by the LCD and every fraction disappears. The catch: the LCD is zero for some x, and multiplying by zero can sneak in fake answers. That's why you check every answer against the excluded values you wrote at the start.",
 'sys': "Each equation is a curve, and the solutions are where the curves cross. At a crossing the two y-values match, so set the right-hand sides equal and solve for x. An x that's excluded from either equation can't be a crossing, because the curve has a hole or an asymptote there. Then plug each good x back in to get its y.",
 'word': "Think in jobs per hour. If you can mow a green in 3 hours, you mow $\\f13$ of it each hour. People working together add their per-hour amounts, and when those add up to $\\f1T$, together they finish in T hours. Twice as fast means twice as much per hour: double the rate, which halves the time."}

data = json.loads(json.dumps(DATA))
nt = 0
for q, raw in zip(data['qs'], DATA['qs']):
    try:
        ta = typed_spec(raw)
    except Exception as e:
        print('typed spec failed', q['id'], e); ta = None
    q.pop('v', None)
    if ta: q['ta'] = ta; nt += 1
for l in data['lessons']: l['alt'] = ALT[l['k']]
js = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
assert '</script' not in js
order = ['10-expr', '20-templates', '00-core', '30-question', '40-voice', '50-learn', '60-sessions', '70-speed', '80-views', '90-boot']
code = '\n'.join(open(os.path.join(SRC, 'js', f + '.js'), encoding='utf-8').read() for f in order)
html = open(os.path.join(SRC, 'shell.html'), encoding='utf-8').read().replace('/*__DATA__*/', js).replace('/*__JS__*/', code)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
json.dump(data['qs'], open(os.path.join(SRC, 'test', 'bank_typed.json'), 'w'))

def icon(size, path, mask=False):
    W = size * 4; im = Image.new('RGB', (W, W), (31, 63, 191)); d = ImageDraw.Draw(im)
    step = W // 8
    for k in range(1, 8):
        d.line([(k * step, 0), (k * step, W)], fill=(45, 78, 205), width=max(1, W // 256)); d.line([(0, k * step), (W, k * step)], fill=(45, 78, 205), width=max(1, W // 256))
    sc = .8 if mask else 1; cx = cy = W // 2; bw, bh = int(W * .56 * sc), int(W * .085 * sc)
    d.rounded_rectangle([cx - bw // 2, cy - bh // 2, cx + bw // 2, cy + bh // 2], radius=bh // 2, fill='white')
    r = int(W * .085 * sc)
    d.ellipse([cx - r, cy - int(W * .2 * sc) - r, cx + r, cy - int(W * .2 * sc) + r], fill='white')
    d.ellipse([cx - r, cy + int(W * .2 * sc) - r, cx + r, cy + int(W * .2 * sc) + r], fill=(255, 201, 74))
    rr = int(W * .05 * sc); ox, oy = (W * (.5 + .28 * sc), W * (.5 - .3 * sc))
    d.ellipse([int(ox) - rr, int(oy) - rr, int(ox) + rr, int(oy) + rr], fill=(255, 201, 74))
    im.resize((size, size), Image.LANCZOS).save(path)
for sz in (180, 192, 512): icon(sz, os.path.join(OUT, 'icon-%d.png' % sz))
icon(512, os.path.join(OUT, 'icon-maskable-512.png'), mask=True)
man = {"name": "Rational Prep Detailed", "short_name": "Alg 2 Detailed", "description": "Algebra 2 lessons 4.3–4.5, detailed: typed answers, fresh numbers, mastery with spaced reviews, daily 5-minute tests, voice lessons, speed drills, XP and streaks. Works offline.",
       "id": "./", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "any", "background_color": "#fbfcff", "theme_color": "#1f3fbf", "lang": "en", "categories": ["education"],
       "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(OUT, 'manifest.webmanifest'), 'w').write(json.dumps(man, indent=1, ensure_ascii=False))
h = hashlib.sha1()
for f in sorted(os.listdir(OUT)):
    if f != 'sw.js' and os.path.isfile(os.path.join(OUT, f)): h.update(open(os.path.join(OUT, f), 'rb').read())
ver = h.hexdigest()[:12]
sw = open(os.path.join(SRC, 'sw.template.js'), encoding='utf-8').read().replace('__VERSION__', ver)
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)
print('built', OUT, 'bytes', len(html.encode()), 'typed bank questions', nt, 'of', len(data['qs']), 'version', ver)
