import asyncio, subprocess, time, sys, json
from playwright.async_api import async_playwright
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8781', '--bind', '127.0.0.1', '-d', '/home/claude/chem/dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = 'http://localhost:8781/chem/'
SH = '/home/claude/shots/chem/'
CANON = """(right) => { const d = __dbg(), Q = d.Q, it = Q.it;
  if (Q.mode === 'mc') return {mc: true};
  const out = {};
  it.fs.forEach(fd => { let v;
    if (fd.t === 'num') v = fd.sf ? d.fmtSF(fd.ans, fd.sf, fd.fmt === 'sci' ? 'sci' : fd.fmt === 'fix' ? 'fix' : undefined) : d.niceN(fd.ans, 8);
    else if (fd.t === 'chg') v = d.chgTxt(fd.ans).replace('−', '-');
    else if (fd.t === 'coef') v = fd.ans.map(String);
    else v = String(fd.ans);
    if (!right) v = fd.t === 'num' ? '9999' : fd.t === 'int' ? '77' : fd.t === 'chg' ? '7+' : fd.t === 'coef' ? fd.ans.map(() => '1') : fd.t === 'cfg' ? '1s2' : fd.t === 'sym' ? 'Xe' : fd.t === 'frm' ? 'H2O2' : 'zzz';
    out[fd.id] = {t: fd.t, v}; });
  return out; }"""
errs = []
async def typenum(pg, v):
    for ch in v:
        if ch == '×': continue
        if v[v.index('×'):].startswith('×10^') if '×' in v else False: pass
    s = v.replace('×10^', 'e')
    for ch in s: await pg.keyboard.press(ch if ch != '-' else 'Minus')
async def answer(pg, right=True):
    c = await pg.evaluate('(' + CANON + ')(%s)' % ('true' if right else 'false'))
    if c.get('mc'):
        await pg.click('.qcard .choices .ch[data-ci="%d"]' % (0 if right else 1)); return
    for fid, f in c.items():
        if f['t'] == 'coef':
            for k, v in enumerate(f['v']):
                await pg.click('.cbox[data-k="%d"]' % k)
                for ch in v: await pg.keyboard.press(ch)
        elif f['t'] in ('num', 'int', 'chg'):
            await pg.click('.fld[data-f="%s"]' % fid)
            s = f['v'].replace('×10^', 'e')
            for ch in s: await pg.keyboard.press({'-': 'Minus', '+': 'Shift+Equal'}.get(ch, ch))
        else:
            await pg.fill('.fin[data-f="%s"]' % fid, f['v'])
    await pg.click('[data-a=qcheck]')
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, vp in [('ipad', {'width': 820, 'height': 1180}), ('phone', {'width': 390, 'height': 844})]:
            ctx = await b.new_context(viewport=vp, device_scale_factor=2, accept_downloads=True)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e, n=name: errs.append((n, 'pageerror', str(e))))
            pg.on('console', lambda m, n=name: errs.append((n, 'console', m.text)) if m.type == 'error' else None)
            await pg.goto(URL); await pg.wait_for_timeout(700)
            await pg.screenshot(path=SH + name + '-01-today.png', full_page=True)
            await pg.click('[data-go=learn]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SH + name + '-02-learn.png')
            await pg.click('[data-to="lesson-config"]'); await pg.wait_for_timeout(300)
            await pg.click('[data-a=another]'); await pg.click('[data-a=lnext]'); await pg.click('[data-a=lnext]')
            await pg.click('.ex [data-a=allsteps]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SH + name + '-03-lesson.png', full_page=True)
            await answer(pg, True); await pg.wait_for_timeout(250)
            await pg.click('[data-a=wedonext]'); await pg.wait_for_timeout(150)
            await answer(pg, False); await pg.wait_for_timeout(250)
            await pg.screenshot(path=SH + name + '-04-wedo.png')
            await pg.click('[data-a=pskill]'); await pg.wait_for_timeout(250)
            await pg.screenshot(path=SH + name + '-05-question.png')
            for k in range(5):
                await answer(pg, True); await pg.wait_for_timeout(150)
                if k == 0: await pg.screenshot(path=SH + name + '-06-correct.png', full_page=True)
                await pg.click('#nextb'); await pg.wait_for_timeout(120)
            await pg.click('[data-a=hint]'); await pg.click('[data-a=hint]'); await pg.wait_for_timeout(100)
            await answer(pg, False); await pg.wait_for_timeout(250)
            await pg.screenshot(path=SH + name + '-07-wrong.png', full_page=True)
            # the reference over a question
            await pg.click('#nextb'); await pg.wait_for_timeout(150)
            await pg.click('[data-a=ptable]'); await pg.wait_for_timeout(200); await pg.click('[data-a=el][data-z="29"]'); await pg.wait_for_timeout(100)
            await pg.screenshot(path=SH + name + '-08-ptmodal.png')
            await pg.click('#modal [data-a=mcancel]'); await pg.wait_for_timeout(100)
            # every template once, typed right, in a practice session
            ids = await pg.evaluate('__dbg().TPLS.map(t => [t.id, t.s])')
            bad = []
            for i, (tid, sk) in enumerate(ids):
                await pg.evaluate("([id, s]) => { const d = __dbg(); d.sesStart('practice', {k: s}); const ses = __dbg().SES; ses.items[0] = d.itemFromTpl(id); ses.qs = []; d.sesShowQ(); }", [tid, sk])
                await answer(pg, True); await pg.wait_for_timeout(40)
                ok = await pg.evaluate('__dbg().Q.g && __dbg().Q.g.ok')
                if not ok: bad.append((tid, await pg.evaluate('JSON.stringify({g: __dbg().Q.g, f: __dbg().Q.f, mode: __dbg().Q.mode})')))
                if name == 'ipad' and tid in ('bl-balance', 'at-sym', 'ec-core', 'nm-formula', 'mo-particles', 'nu-missing', 'gl-comb'):
                    await pg.screenshot(path=SH + name + '-t-' + tid + '.png', full_page=True)
            print(name, 'templates typed right:', len(ids) - len(bad), 'of', len(ids), bad[:6])
            # tests: unit test, answer some, submit
            await pg.goto(URL + '#tests'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-09-tests.png', full_page=True)
            await pg.click('[data-a=unit][data-u="6"]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-10-unittest.png')
            for k in range(6):
                await answer(pg, k % 3 != 2); await pg.wait_for_timeout(120)
            await pg.click('[data-a=tsubmit]'); await pg.wait_for_timeout(100); await pg.click('[data-a=mok]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-11-results.png', full_page=True)
            await pg.click('[data-go=practice]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SH + name + '-12-practice.png')
            await pg.click('[data-go=speed]'); await pg.wait_for_timeout(200)
            await pg.click('[data-a=spgo]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-13-speed.png')
            for k in range(4):
                await pg.click('#sq .ch[data-ci="%d"]' % (0 if k % 2 == 0 else 1)); await pg.wait_for_timeout(1000)
            await pg.click('[data-a=spstop]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-14-speedend.png', full_page=True)
            await pg.click('[data-go=me]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SH + name + '-15-me.png', full_page=True)
            await pg.goto(URL + '#ref'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-16-ref.png', full_page=True)
            for t in ('ions', 'eq', 'k'):
                await pg.click('[data-a=reftab][data-t="%s"]' % t); await pg.wait_for_timeout(150)
                await pg.screenshot(path=SH + name + '-17-ref-' + t + '.png', full_page=True)
            await pg.goto(URL + '#mistakes'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SH + name + '-18-mistakes.png', full_page=True)
            await pg.goto(URL + '#lesson-balance'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SH + name + '-19-lesson-balance.png', full_page=True)
            await ctx.close()
        await b.close()
    srv.terminate()
    print('errors:', len(errs)); [print(e) for e in errs[:20]]
asyncio.run(run())
