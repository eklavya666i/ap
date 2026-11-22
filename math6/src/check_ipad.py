"""iPad checks for Math 6, served at /ap/math6/ next to World History, Cyber and SAT Daily, like GitHub Pages.
Adapted from SAT Daily's check_ipad.py. Covers: first visit in Safari (offline copy saved, manifest installable),
every screen by touch, the voice queue with a stubbed voice, a whole lesson played and answered, practice to mastery,
a lesson quiz, the unit and daily 5-minute tests, all three speed formats, the boss challenge, fixing a mistake,
network off, share-sheet backup and restore, World History installed first (its worker must leave /math6/ alone),
Home Screen mode, other iPad sizes and Split View.
Run: python3 check_ipad.py   (needs Playwright and Chrome)"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
ROOT = HERE.parent            # math6/
REPO = ROOT.parent            # the ap repo, served at /ap/ like GitHub Pages
OUT = HERE / "shots"; OUT.mkdir(exist_ok=True)
SITE = Path("/tmp/ap-site"); SITE.mkdir(exist_ok=True)
link = SITE / "ap"
if not link.exists(): link.symlink_to(REPO)
PORT = 8766
BASE = f"http://127.0.0.1:{PORT}/ap/"
URL = BASE + "math6/"
UA = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
SHARE_STUB = """
navigator.canShare = () => true;
navigator.share = async d => { const f = d.files[0]; window.__shared = {name: f.name, type: f.type, text: await f.text()}; };
"""
STANDALONE_STUB = "Object.defineProperty(navigator, 'standalone', {get: () => true});"
# A stand-in voice: records each utterance and finishes it after 20 ms, so the sentence queue can be checked.
VOICE_STUB = """
window.__said = [];
const fakeVoice = {name: 'Samantha', lang: 'en-US', voiceURI: 'samantha'};
const synth = {
  speaking: false, pending: false,
  getVoices: () => [fakeVoice], addEventListener: () => {}, cancel() { this.speaking = false; },
  // like a real voice: "start" first, then "end" after a time that grows with the sentence
  speak(u) { if (u.text) window.__said.push(u.text); this.speaking = true;
    setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => { this.speaking = false; u.onend && u.onend(); }, Math.max(15, u.text.length)); }, 5); }
};
Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true, writable: true});
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
"""
# What a student who knows the answer would do, through the real controls: tap the choice, or focus the box and
# tap the number keys. Grids, orderings, matches, yes/no rows and find-the-mistake set the answer directly.
ANSWER = """
window.__answer = (wrong) => {
  const Q = M6APP.Q, it = Q.it, $ = s => document.querySelector(s);
  const tap = el => { if (!el) throw new Error('missing control for ' + it.type); el.click(); };
  const type = (i, text) => { const box = $(`.ans[data-i="${i}"]`); box.focus();
    for (const ch of text) tap($(`.kp[data-key="${ch === ' ' ? '␣' : ch === '-' ? '−' : ch}"]`)); };
  if (wrong) {   // a wrong answer: a trap if the question has one, else a wrong choice
    if (it.type === 'num') {   // the first trap that can be typed on this keypad, else a plain wrong number
      const keys = [...document.querySelectorAll('.kp')].map(k => k.dataset.key).join('');
      const t = (it.traps || []).map(t => String(Array.isArray(t) ? t[0] : t.v).replace('/', Array.isArray(it.ans) ? ':' : '/').replace(/-/g, '−'))
        .find(v => [...v].every(ch => keys.includes(ch === ' ' ? '␣' : ch)));
      type(0, t || (String(it.ans) === '1' ? '2' : '1')); return it.type;
    }
    if (it.type === 'mc') { tap($(`[data-pick="${it.choices.findIndex(c => !c.ok)}"]`)); return it.type; }
    if (it.type === 'multi') { tap($(`[data-pick="${it.opts.findIndex(o => !o.ok)}"]`)); return it.type; }
    if (it.type === 'table') { it.blanks.forEach(([r, c], k) => type(k, String(it.rows[r][c]) === '1' ? '2' : '1')); return it.type; }
    const wrongs = {grid: () => it.n === 1 ? 2 : 1, order: () => it.items.map(t => it.shown.indexOf(t)).reverse(),
      match: () => { const o = {}; it.pairs.forEach((p, i) => { o[i] = it.rights.indexOf(it.pairs[(i + 1) % it.pairs.length][1]); }); return o; },
      yn: () => it.rows.map(x => !x.ok), mistake: () => ({step: (it.wrong + 1) % it.steps.length, fix: 0})};
    if (wrongs[it.type]) { Q.r = wrongs[it.type](); return it.type; }
  }
  switch (it.type) {
    case 'mc': tap($(`[data-pick="${it.choices.findIndex(c => c.ok)}"]`)); break;
    case 'multi': it.opts.forEach((o, i) => o.ok && tap($(`[data-pick="${i}"]`))); break;
    case 'num': type(0, Array.isArray(it.ans) ? it.ans.join(':') : String(it.show || it.ans).replace(/,/g, '')); break;
    case 'table': it.blanks.forEach(([r, c], k) => type(k, String(it.rows[r][c]))); break;
    case 'grid': Q.r = it.n; break;
    case 'order': Q.r = it.items.map(t => it.shown.indexOf(t)); break;
    case 'match': { const o = {}; it.pairs.forEach((p, i) => { o[i] = it.rights.indexOf(p[1]); }); Q.r = o; break; }
    case 'yn': Q.r = it.rows.map(x => x.ok); break;
    case 'mistake': Q.r = {step: it.wrong, fix: it.fixes.findIndex(f => f.ok)}; break;
  }
  return it.type;
};
window.__speedType = () => { for (const ch of String(M6APP.SP.cur.a)) document.querySelector(`.kp[data-key="${ch === '-' ? '−' : ch === ' ' ? '␣' : ch}"]`).click(); };
"""
SYMBOLS = "/^−<>≤≥×÷=|²³$%"

def ipad(w, h, **kw):
    return dict(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, **kw)

async def probe(page):
    return await page.evaluate("""() => {
      const small = [...document.querySelectorAll('button, label.btn, a, select, input:not(.sr)')].filter(e => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return false;
        if (e.tagName === 'A' && e.closest('.lessons, p')) return false;   // inline text links
        const lab = e.tagName === 'INPUT' && e.closest('label');             // a checkbox inside a big label: the label is the target
        if (lab && lab.getBoundingClientRect().height >= 44 && lab.getBoundingClientRect().width >= 44) return false;
        return r.height < 44 || r.width < 44;
      }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      const clipped = [...document.querySelectorAll('nav a, .ltabs a, .btn, .chip, .pill, .kp, .choice, .stat')].filter(e => {
        const r = e.getBoundingClientRect(); return r.width && e.scrollWidth > e.clientWidth + 1;
      }).map(e => (e.textContent || '').trim().slice(0, 30));
      const cut = [...document.querySelectorAll('.q, .card, .tboard, .tside')].flatMap(box => [...box.querySelectorAll('input.ans, td, .choice')].filter(el => {
        const b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), wrap = el.closest('.tablewrap, .brt');
        return r.width && !wrap && (r.right > b.right + 1 || r.left < b.left - 1);
      })).map(e => e.tagName + ' ' + (e.textContent || e.value || '').trim().slice(0, 12));
      return {overflow: document.documentElement.scrollWidth - innerWidth, small, clipped, cut,
              fonts: document.fonts.check('16px Archivo') && document.fonts.check('17px "Source Serif 4"')};
    }""")

async def state(page, expr):
    return await page.evaluate(f"(() => {{ const S = M6APP.S; return {expr}; }})()")

async def run_session(page, wrong_at=()):
    """Answer every question of the open test or quiz; returns the score line from the results."""
    for i in range(40):
        await page.wait_for_selector('[data-act="s-check"], [data-act="s-next"], [data-act="s-submit"], .results', timeout=8000)
        if await page.locator(".results").count(): break
        if await page.locator('[data-act="s-submit"]').count():
            await page.locator('[data-act="s-submit"]').tap(); continue
        await page.evaluate(f"window.__answer({'true' if i in wrong_at else 'false'})")
        if await page.locator('[data-act="s-check"]').count():          # quizzes and the boss check as you go
            await page.locator('[data-act="s-check"]').tap()
            if await page.locator('[data-act="s-check"]').count(): await page.locator('[data-act="s-check"]').tap()   # "close" answers ask once more
        await page.locator('[data-act="s-next"]').tap()
    await page.wait_for_selector(".results", timeout=8000)
    return await page.locator(".results h3").first.inner_text()

async def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(SITE)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    report, problems = {}, []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])

            # 1. First visit in Safari on an iPad Air (portrait), with World History already installed on this iPad
            ctx = await b.new_context(**ipad(820, 1180))
            for s in (SHARE_STUB, VOICE_STUB, ANSWER): await ctx.add_init_script(s)
            page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(BASE); await page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=30000)
            r = {"world_history_title": await page.title()}
            await page.goto(URL); await page.wait_for_selector("#view h2")
            r["math6_title_after_world_history"] = await page.title()
            await page.wait_for_function("navigator.serviceWorker.getRegistration().then(r => !!(r && r.active))", timeout=30000)
            await page.reload(); await page.wait_for_selector("#view h2")
            r["controlled_by"] = await page.evaluate("navigator.serviceWorker.controller && new URL(navigator.serviceWorker.controller.scriptURL).pathname")
            r["caches"] = await page.evaluate("""async () => { const ks = await caches.keys();
                return Promise.all(ks.map(async k => k + ': ' + (await (await caches.open(k)).keys()).length + ' files')); }""")
            cdp = await ctx.new_cdp_session(page)
            r["manifest_errors"] = (await cdp.send("Page.getAppManifest")).get("errors")
            r["installability_errors"] = (await cdp.send("Page.getInstallabilityErrors")).get("installabilityErrors")
            r["install_note"] = await page.locator("#inst .inst b").inner_text() if await page.locator("#inst .inst").count() else None
            r["today"] = await probe(page)
            await page.screenshot(path=str(OUT / "ipad-today.png"), full_page=True)

            # 2. Every screen by touch
            screens = {}
            for tab in ["Units", "Tests", "Mistakes", "Progress", "Settings"]:
                await page.locator("nav a", has_text=tab).tap(); await page.wait_for_selector("#view h2")
                screens[tab] = {"h2": await page.locator("#view h2").inner_text(), **(await probe(page))}
                if tab == "Units": await page.screenshot(path=str(OUT / "ipad-units.png"), full_page=True)
            await page.locator("nav a", has_text="Units").tap(); await page.wait_for_selector(".region")
            screens["regions"] = await page.locator(".region").count()
            await page.locator(".rhead").first.tap(); await page.wait_for_selector(".lessons")
            screens["unit_1"] = {"lessons": await page.locator(".lessons li").count(), **(await probe(page))}
            await page.locator(".lessons a", has_text="Unit rates").first.tap(); await page.wait_for_selector("#view h2")
            screens["lesson_1.5"] = await page.locator("#view h2").inner_text()
            for tab in ["Practice", "Quiz", "5-Minute Test", "Notes", "Learn"]:
                await page.locator(".ltabs a", has_text=tab).tap(); await page.wait_for_timeout(250)
                screens["lesson tab " + tab] = await probe(page)
            r["screens"] = screens

            # 3. Voice check: the queue speaks every line in order, one sentence at a time
            await page.goto(URL + "#/voice"); await page.wait_for_selector(".say")
            r["voice_rows"] = await page.locator(".say").count()
            await page.locator("#vall").tap()
            await page.wait_for_function("window.__said.length >= 20", timeout=10000)
            await page.wait_for_timeout(200)
            said = await page.evaluate("window.__said")
            r["voice_spoken"] = len(said)
            r["voice_first"] = said[:3]
            r["voice_unspoken_symbols"] = [s for s in said if any(c in s for c in SYMBOLS)]
            await page.screenshot(path=str(OUT / "ipad-voice.png"), full_page=True)

            # 4. Learn: play lesson 1.1 start to finish with the voice, answering both "We do" checks
            await page.goto(URL + "#/lesson/1.1/learn"); await page.wait_for_selector('[data-act="t-play"]')
            await page.evaluate("window.__said = []")
            await page.wait_for_timeout(300)
            r["learn_started_on_its_own"] = await page.evaluate("!!(M6APP.T.started)")   # lessons start talking when they open
            if not await page.evaluate("M6APP.T.started"): await page.locator('[data-act="t-play"]').tap()
            checks = []
            for _ in range(200):
                await page.wait_for_timeout(150)
                if await page.locator(".done-card").count(): break
                if await page.locator('[data-act="t-check"]').count():
                    await page.screenshot(path=str(OUT / "ipad-learn-check.png"))
                    await page.evaluate("window.__answer(false)")
                    await page.locator('[data-act="t-check"]').tap()
                    await page.wait_for_selector('[data-act="t-cont"]')
                    checks.append(await page.evaluate("M6APP.Q.g.ok"))
                    await page.locator('[data-act="t-cont"]').tap()
            said = await page.evaluate("window.__said")
            r["learn"] = {"finished": await page.locator(".done-card").count() == 1, "checks_right": checks, "sentences_spoken": len(said),
                          "unspoken_symbols": [s for s in said if any(c in s for c in SYMBOLS)][:5],
                          "learned": await state(page, "S.L['1.1'] && S.L['1.1'].learned"), "xp": await state(page, "S.xp")}
            await page.screenshot(path=str(OUT / "ipad-learn-done.png"), full_page=True)

            # 5. Practice 1.2: one wrong answer (it goes to Mistakes), then right answers until the lesson is mastered
            await page.goto(URL + "#/lesson/1.2/practice"); await page.wait_for_selector('[data-act="p-check"]')
            await page.evaluate("window.__answer(true)"); await page.wait_for_timeout(2100)   # slower than a guess
            await page.locator('[data-act="p-check"]').tap()
            if await page.locator('[data-act="p-check"]').count(): await page.locator('[data-act="p-check"]').tap()
            wrong_fb = await page.locator(".fb.bad").count()
            await page.screenshot(path=str(OUT / "ipad-practice-wrong.png"), full_page=True)
            await page.locator('[data-act="p-next"]').tap()
            answered = 0
            for _ in range(30):
                if await state(page, "S.L['1.2'].mastered"): break
                await page.wait_for_selector('[data-act="p-check"]')
                await page.evaluate("window.__answer(false)")
                await page.locator('[data-act="p-check"]').tap(); answered += 1
                if await page.locator('[data-act="p-check"]').count(): await page.locator('[data-act="p-check"]').tap()
                await page.wait_for_selector('[data-act="p-next"]')
                await page.locator('[data-act="p-next"]').tap()
            r["practice"] = {"wrong_feedback_shown": wrong_fb, "answers_to_master": answered, "mastered": await state(page, "!!S.L['1.2'].mastered"),
                             "review_due": await state(page, "S.L['1.2'].rev"), "mistakes_saved": await state(page, "Object.keys(S.mist).length"), "xp": await state(page, "S.xp")}

            # 6. Fix the mistake from Mistakes
            await page.goto(URL + "#/mistakes"); await page.wait_for_selector("#view h2")
            r["mistakes_listed"] = await page.locator("#view .card").count()
            fix = page.locator("#view a.btn", has_text="Practice these")
            if await fix.count():
                await fix.first.tap(); await page.wait_for_selector('[data-act="p-check"]')
                await page.evaluate("window.__answer(false)"); await page.locator('[data-act="p-check"]').tap()
                if await page.locator('[data-act="p-check"]').count(): await page.locator('[data-act="p-check"]').tap()
            r["fixed"] = await state(page, "S.fixed")

            # 7. Lesson quiz, unit 5-minute test (one wrong on purpose), daily 5-minute test
            await page.goto(URL + "#/lesson/1.5/quiz"); r["quiz"] = await run_session(page)
            await page.screenshot(path=str(OUT / "ipad-quiz-results.png"), full_page=True)
            await page.goto(URL + "#/run/t5u/1"); await page.wait_for_selector(".tesbar")
            r["t5_timer"] = await page.locator("#timer").inner_text()
            r["t5"] = await run_session(page, wrong_at=(2,))
            r["t5_misconceptions_listed"] = await page.locator(".mislist").count()
            await page.screenshot(path=str(OUT / "ipad-t5-results.png"), full_page=True)
            await page.goto(URL + "#/run/daily/x"); r["daily"] = await run_session(page)
            r["tests_saved"] = await state(page, "S.tests.length")

            # 8. Speed: a Speed Round (ended early), Beat the Clock (20 questions), Lightning Ladder (three timeouts)
            await page.goto(URL + "#/speed/times/round"); await page.wait_for_selector(".spq")
            for _ in range(14): await page.evaluate("window.__speedType()")
            combo = await page.evaluate("M6APP.SP.combo")
            await page.screenshot(path=str(OUT / "ipad-speed-round.png"))
            await page.evaluate("M6APP.SP.t0 = Date.now() - 61000"); await page.wait_for_selector('[data-sp="times:round"]', timeout=5000)
            r["speed_round"] = {"combo": combo, "pb": await state(page, "S.pbs.times && S.pbs.times.round")}
            await page.goto(URL + "#/speed/div/clock"); await page.wait_for_selector(".spq")
            for _ in range(20): await page.evaluate("window.__speedType()")
            await page.wait_for_selector('[data-sp="div:clock"]', timeout=5000)
            r["speed_clock"] = await state(page, "S.pbs.div && S.pbs.div.clock")
            await page.goto(URL + "#/speed/times/ladder"); await page.wait_for_selector(".spq")
            for _ in range(6): await page.evaluate("window.__speedType()")
            for _ in range(3): await page.evaluate("M6APP.SP.qt = Date.now() - 30000"); await page.wait_for_timeout(450)
            await page.wait_for_selector('[data-sp="times:ladder"]', timeout=5000)
            r["speed_ladder"] = await state(page, "S.pbs.times && S.pbs.times.ladder")
            await page.screenshot(path=str(OUT / "ipad-speed-done.png"), full_page=True)

            # 9. Boss challenge: open once 9 of 12 lessons are mastered, then win it
            await page.evaluate("""(() => { const S = M6APP.S, t = Date.now(); ['1.1','1.3','1.4','1.5','1.6','1.7','1.8','1.9'].forEach(id => {
                S.L[id] = Object.assign(S.L[id] || {}, {chip: 'mastered', mastered: t, run: [], att: 3, ok: 3, seen: {}, rev: 0, lvl: 2}); }); localStorage.setItem('math6.v1', JSON.stringify(S)); })()""")
            await page.goto(URL + "#/unit/1"); await page.wait_for_selector(".lessons")
            r["boss_offered"] = await page.locator("a.btn, button.btn", has_text="Boss").count()
            await page.goto(URL + "#/run/boss/1"); r["boss"] = await run_session(page)
            r["boss_won"] = await state(page, "!!S.boss[1]")
            await page.screenshot(path=str(OUT / "ipad-boss-results.png"), full_page=True)

            # 10. Progress shows it all
            await page.goto(URL + "#/progress"); await page.wait_for_selector("#view h2")
            r["progress"] = {"mastered_cells": await page.locator(".mc.mastered").count(), "badges": await page.locator(".bdg.got").count(), **(await probe(page))}
            await page.screenshot(path=str(OUT / "ipad-progress.png"), full_page=True)

            # 11. Network off: the saved copy still opens, and a lesson still plays
            await ctx.set_offline(True)
            await page.goto(URL + "#/units"); await page.wait_for_selector(".region")
            r["offline_regions"] = await page.locator(".region").count()
            await page.goto(URL + "#/lesson/1.4/learn"); await page.wait_for_selector('[data-act="t-play"]')
            r["offline_lesson"] = await page.locator("#view h2").inner_text()

            # 12. Back up through the share sheet, then restore from that file
            await page.goto(URL + "#/settings"); await page.wait_for_selector("#name")
            await page.fill("#name", "Test"); await page.locator("#name").dispatch_event("change")
            await page.locator("#bkup").tap(); await page.wait_for_timeout(300)
            shared = await page.evaluate("window.__shared")
            j = json.loads(shared["text"])
            r["backup"] = {"name": shared["name"], "type": shared["type"], "v": j.get("v"), "student": j.get("name"), "xp": j.get("xp")}
            await page.evaluate("localStorage.clear()"); await page.reload(); await page.wait_for_selector("#rst", state="attached")
            await page.set_input_files("#rst", files=[{"name": shared["name"], "mimeType": "application/json", "buffer": shared["text"].encode()}])
            await page.wait_for_timeout(500)
            r["restored"] = {"name": await page.locator("#name").input_value(), "xp": await state(page, "S.xp"), "mastered_1.2": await state(page, "!!(S.L['1.2'] && S.L['1.2'].mastered)")}
            await ctx.set_offline(False)

            # 13. The other apps still open as themselves with Math 6 installed
            others = {}
            for path in ["", "cyber/", "sat/", "alg2-rational/"]:
                await page.goto(BASE + path); await page.wait_for_function("document.title.length > 0", timeout=20000)
                others[path or "world"] = await page.title()
            r["other_apps"] = others
            r["errors"] = errs
            report["safari_ipad_air"] = r
            await ctx.close()

            # 14. Home Screen app in landscape, then other iPads and Split View
            sizes = {"home-screen-landscape": (1180, 820), "ipad-mini-portrait": (744, 1133), "ipad-pro-13-landscape": (1376, 1032),
                     "split-view-third": (320, 1180), "split-view-half-landscape": (590, 820)}
            report["sizes"] = {}
            for tag, (w, h) in sizes.items():
                ctx = await b.new_context(**ipad(w, h))
                for s in (STANDALONE_STUB, VOICE_STUB, ANSWER): await ctx.add_init_script(s)
                page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
                got = {}
                for view in ["", "#/units", "#/unit/1", "#/lesson/1.3/learn", "#/lesson/1.3/practice", "#/lesson/1.12/learn", "#/run/t5u/1", "#/tests/speed", "#/speed/times/round", "#/progress", "#/voice"]:
                    await page.goto(URL + view); await page.wait_for_selector("#view h2, #view .tesbar, #view .spq")
                    await page.wait_for_timeout(150)
                    got[view or "#/today"] = await probe(page)
                    if view == "#/lesson/1.3/practice": await page.screenshot(path=str(OUT / f"{tag}-practice.png"))
                got["install_note_hidden"] = await page.locator("#inst").is_hidden()
                got["errors"] = errs
                await page.goto(URL); await page.wait_for_selector("#view h2")
                await page.screenshot(path=str(OUT / f"{tag}.png"))
                report["sizes"][tag] = got
                await ctx.close()
            await b.close()
    finally:
        server.terminate()

    # Verdict
    s = report["safari_ipad_air"]
    def need(cond, msg):
        if not cond: problems.append(msg)
    need(s["math6_title_after_world_history"] == "Math 6", "World History's worker served /math6/")
    need((s["controlled_by"] or "").endswith("/math6/sw.js"), "Math 6 is not controlled by its own worker")
    # Playwright contexts are incognito, which Chrome reports as "in-incognito"; anything else is a real problem.
    need(not s["manifest_errors"] and not [e for e in s["installability_errors"] or [] if e.get("errorId") != "in-incognito"], "manifest or installability errors")
    need(s["voice_spoken"] >= 20 and not s["voice_unspoken_symbols"], "voice queue or speech text")
    need(s["screens"]["regions"] == 10 and s["screens"]["unit_1"]["lessons"] == 12, "journey map or unit page")
    need(s["learn_started_on_its_own"], "the lesson didn't start talking when it opened")
    L = s["learn"]; need(L["finished"] and L["checks_right"] == [True, True] and L["learned"] == 1 and L["xp"] >= 20 and not L["unspoken_symbols"] and L["sentences_spoken"] > 40, f"learn flow {L}")
    P = s["practice"]; need(P["wrong_feedback_shown"] and P["mastered"] and P["mistakes_saved"] >= 1 and P["answers_to_master"] <= 12, f"practice flow {P}")
    need(s["fixed"] >= 1, "fixing a mistake")
    need(s["quiz"].startswith("8 of 8"), f"quiz {s['quiz']}")
    need(s["t5"].startswith(str(int(s["t5"].split(" of ")[1].split()[0]) - 1) + " of") and s["t5_timer"].startswith(("4:", "5:")), f"unit 5-minute test {s['t5']} {s['t5_timer']}")
    need(" of " in s["daily"] and s["daily"].split(" of ")[0] == s["daily"].split(" of ")[1].split()[0], f"daily test {s['daily']}")
    need(s["tests_saved"] >= 3, "tests saved")
    need(s["speed_round"]["combo"] >= 10 and s["speed_round"]["pb"] and s["speed_round"]["pb"]["right"] >= 14, f"speed round {s['speed_round']}")
    need(s["speed_clock"] and s["speed_clock"]["right"] == 20, f"beat the clock {s['speed_clock']}")
    need(s["speed_ladder"] and s["speed_ladder"]["n"] >= 6, f"lightning ladder {s['speed_ladder']}")
    need(s["boss_offered"] >= 1 and s["boss_won"], f"boss {s['boss']}")
    need(s["progress"]["mastered_cells"] >= 9 and s["progress"]["badges"] >= 2, f"progress {s['progress']}")
    need(s["offline_regions"] == 10 and "1.4" in s["offline_lesson"], "offline copy")
    need(s["restored"]["name"] == "Test" and s["restored"]["xp"] == s["backup"]["xp"] and s["restored"]["mastered_1.2"], f"backup and restore {s['restored']}")
    need(all(v != "Math 6" for v in s["other_apps"].values()), "another app opened as Math 6")
    need(not s["errors"], f"page errors {s['errors'][:3]}")
    for tag, got in report["sizes"].items():
        for view, pr in got.items():
            if isinstance(pr, dict) and (pr.get("overflow", 0) > 0 or pr.get("small") or pr.get("clipped") or pr.get("cut")): problems.append(f"{tag} {view}: {pr}")
        if got["errors"]: problems.append(f"{tag}: page errors {got['errors'][:2]}")
    for view, pr in s["screens"].items():
        if isinstance(pr, dict) and (pr.get("overflow", 0) > 0 or pr.get("small") or pr.get("clipped") or pr.get("cut")): problems.append(f"screen {view}: {pr}")
    print(json.dumps(report, indent=1))
    print("\n".join(problems) if problems else "ALL IPAD CHECKS PASSED")
    sys.exit(1 if problems else 0)

asyncio.run(main())
