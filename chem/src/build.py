"""Builds Chemistry Prep (SC300A/B) into dist/chem: one self-contained index.html, icons, manifest and an offline service worker."""
import json, os, sys, hashlib, subprocess
from PIL import Image, ImageDraw

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, 'dist', 'chem')
os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, SRC)
from content_chem import UNITS, L, B, SKN

pt = json.load(open(os.path.join(SRC, 'py', 'pt.json')))
units = [{'n': n, 't': t, 'ks': ks, 'sem': 'A' if n <= 5 else 'B'} for n, t, ks in UNITS]
order = [k for u in units for k in u['ks']]
assert len(order) == len(set(order)) == len(L) == len(SKN)
skills = [{'k': k, 'n': SKN[k][0], 'sh': SKN[k][1]} for k in order]
ex = json.loads(subprocess.check_output(['node', os.path.join(SRC, 'tools', 'gen_ex.js')]))
lessons = []
for k in order:
    t, hook, big, keys, how, traps, alt = L[k]
    lessons.append({'k': k, 't': t, 'sh': SKN[k][1], 'hook': hook, 'big': big, 'keys': keys, 'how': how, 'ex': ex[k], 'traps': traps, 'alt': alt})
qs = [{'id': 'b%03d' % (i + 1), 's': sk, 'd': d, 'q': q, 'c': c, 'w': w, 'h': h, 'x': [['', x]]} for i, (sk, d, q, c, w, h, x) in enumerate(B)]
assert all(q['s'] in SKN for q in qs)
D = {'pt': pt, 'units': units, 'skills': skills, 'lessons': lessons, 'qs': qs}
js = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
assert '</script' not in js
mods = ['10-chem', '21-u1u2', '22-u3u4', '23-u5', '24-u6u7', '25-u8u10', '29-drills', '00-core', '30-question', '40-voice', '50-learn', '60-sessions', '70-speed', '80-views', '85-ref', '90-boot']
code = '\n'.join(open(os.path.join(SRC, 'js', m + '.js'), encoding='utf-8').read() for m in mods)
assert '</script' not in code
html = open(os.path.join(SRC, 'shell.html'), encoding='utf-8').read().replace('/*__DATA__*/', js).replace('/*__JS__*/', code)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
chk = os.path.join(SRC, 'test', '_bundle_check.js'); open(chk, 'w', encoding='utf-8').write(code)
r = subprocess.run(['node', '--check', chk], capture_output=True, text=True)
assert r.returncode == 0, 'bundle syntax error:\n' + r.stderr[:1500]

TEAL, TEAL2, GOLD = (10, 107, 115), (22, 122, 130), (255, 201, 74)
def icon(size, path, mask=False):
    W = size * 4; im = Image.new('RGB', (W, W), TEAL); d = ImageDraw.Draw(im)
    step = W // 8
    for k in range(1, 8):
        d.line([(k * step, 0), (k * step, W)], fill=TEAL2, width=max(1, W // 256)); d.line([(0, k * step), (W, k * step)], fill=TEAL2, width=max(1, W // 256))
    sc = .78 if mask else 1
    P = lambda x, y: (W / 2 + (x - .5) * W * sc, W / 2 + (y - .5) * W * sc)
    lw = int(W * .045 * sc)
    neck_l, neck_r, top, shoulder, base = .42, .58, .2, .44, .8
    liquid = [P(.27, .64), P(.73, .64), P(.8, .76), P(.78, .8), P(.22, .8), P(.2, .76)]
    d.polygon(liquid, fill=GOLD)
    outline = [P(neck_l, top), P(neck_l, shoulder), P(.2, .76), P(.22, .8), P(.78, .8), P(.8, .76), P(neck_r, shoulder), P(neck_r, top)]
    d.line(outline, fill='white', width=lw, joint='curve')
    d.line([P(.37, top), P(.63, top)], fill='white', width=lw)
    for cx, cy, r in [(.44, .55, .028), (.56, .5, .02), (.5, .38, .016)]:
        x, y = P(cx, cy); rr = W * r * sc; d.ellipse([x - rr, y - rr, x + rr, y + rr], fill='white')
    im.resize((size, size), Image.LANCZOS).save(path)
for sz in (180, 192, 512): icon(sz, os.path.join(OUT, 'icon-%d.png' % sz))
icon(512, os.path.join(OUT, 'icon-maskable-512.png'), mask=True)
man = {"name": "Chemistry Prep", "short_name": "Chemistry", "description": "Chemistry SC300A/B, all 10 units: voice lessons, typed answers with fresh numbers, mastery with spaced reviews, daily 5-minute tests, unit tests and finals, speed drills, XP and streaks. Works offline.",
       "id": "./", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "any", "background_color": "#fbfdfd", "theme_color": "#0a6b73", "lang": "en", "categories": ["education"],
       "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(OUT, 'manifest.webmanifest'), 'w').write(json.dumps(man, indent=1, ensure_ascii=False))
h = hashlib.sha1()
for f in sorted(os.listdir(OUT)):
    if f != 'sw.js': h.update(open(os.path.join(OUT, f), 'rb').read())
ver = h.hexdigest()[:12]
sw = open(os.path.join(SRC, 'sw.template.js')).read().replace('__VERSION__', ver)
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)
json.dump(D, open(os.path.join(SRC, 'test', 'data.json'), 'w'), ensure_ascii=False)
print('built', OUT, 'bytes', len(html.encode()), 'lessons', len(lessons), 'bank', len(qs), 'version', ver)
