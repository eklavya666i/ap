"""iPad checks for English 10H, served at /ap/english10/ next to World History and the other apps, like GitHub Pages.
Adapted from Math 6's check_ipad.py. Covers: first visit (offline copy saved), every screen with no errors, setup,
spoiler gating, a perfect reading check, misses and fixing them, the timed unit test, a full assignment (plan, prompt
decoder, thesis checks, outline that survives a reload, evidence, draft, draft checker with highlights, rubric, Claude
hand-off and the AI log), the Quote Log, drills, review cards, seminar prep, a timed write, network off, share-sheet
backup and restore, World History installed first (its worker must leave /english10/ alone), and five iPad sizes.
Run: python3 check_ipad.py   (needs Playwright and Chrome). The test server starts and stops with the script."""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
REPO = HERE.parent.parent
OUT = HERE / "shots"; OUT.mkdir(exist_ok=True)
SITE = Path("/tmp/ap-site"); SITE.mkdir(exist_ok=True)
link = SITE / "ap"
if not link.exists(): link.symlink_to(REPO)
PORT = 8768
BASE = f"http://127.0.0.1:{PORT}/ap/"
URL = BASE + "english10/"
UA = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
SHARE_STUB = """
navigator.canShare = () => true;
navigator.share = async d => { window.__shared = d.files ? {name: d.files[0].name, text: await d.files[0].text()} : {text: d.text}; };
"""
ROUTES = ["today", "learn", "unit/4", "unit/4/characters", "unit/4/symbols", "unit/4/themes", "unit/4/lenses", "unit/4/context", "unit/1", "unit/2", "unit/3",
          "unit/5", "unit/6", "unit/7", "ch/1", "ch/4", "ch/9", "lens/marx", "lens/eco", "terms", "write", "asg/new", "guide/lens", "guide/lit", "guide/argument",
          "guide/rhetorical", "guide/synthesis", "guide/narrative", "quotes", "quotes/new/3/1", "seminar", "drills", "drill/mla2", "drill/w-embed", "check",
          "check/t/argument", "rubric/t/lens", "claude/t/lens", "test", "tw/lens-any", "coach", "advice/teacher", "advice/heavy", "advice/ai", "ailog", "review",
          "me", "settings", "parent"]

def ipad(w, h, **kw):
    return dict(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, **kw)

async def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(SITE)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    R, errs = {}, []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
            ctx = await b.new_context(**ipad(1180, 820))
            await ctx.add_init_script(SHARE_STUB)
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
            pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
            pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            S = lambda expr: pg.evaluate(f"(() => {{ const S = E10.S; return {expr}; }})()")
            async def go(r, wait=150):
                await pg.evaluate(f"location.hash = '#/{r}'"); await pg.wait_for_timeout(wait)
            async def tap(sel): await pg.locator(sel).first.click(); await pg.wait_for_timeout(120)

            # First visit
            await pg.goto(URL)
            R["title"] = await pg.title()
            await pg.evaluate("navigator.serviceWorker.ready.then(() => true)")
            await pg.wait_for_timeout(600)
            R["sw_controls"] = await pg.evaluate("!!navigator.serviceWorker.controller") or (await pg.reload()) is not None and await pg.evaluate("!!navigator.serviceWorker.controller")
            R["manifest"] = (await (await pg.request.get(URL + "manifest.webmanifest")).json())["name"]

            # Every screen renders
            bad = []
            for r in ROUTES:
                n0 = len(errs); await go(r, 90)
                length = await pg.evaluate("document.querySelector('#view').innerText.length")
                if len(errs) > n0 or length < 60: bad.append([r, length, errs[n0:]])
            R["routes_bad"] = bad

            # Setup: name and how far she has read
            await go("today")
            await pg.fill("input[data-in=name]", "Ira")
            await pg.select_option("select[data-in=readto]", "4"); await pg.wait_for_timeout(150)
            await tap("[data-act=setupdone]")
            R["setup"] = await S("[S.name, S.read.lotf, !!S.seen.setup]")
            # Spoilers stay hidden past chapter 4
            await go("ch/9")
            R["ch9_locked"] = "Show it anyway" in await pg.inner_text("#view") and "Simon wakes" not in await pg.inner_text("#view")
            await go("unit/4/characters")
            R["hidden_characters"] = await pg.locator("text=Another character").count()

            # A perfect reading check on chapter 1, through the real buttons
            await go("test"); await tap('[data-act=quiz][data-arg="ch:1"]')
            for i in range(8):
                right = await pg.evaluate("E10.SES.items[E10.SES.i].choices.findIndex(c => c.ok)")
                await tap(f'[data-act=pick][data-arg="{right}"]')
                await tap("[data-act=qnext]")
            R["ch1_result"] = await pg.inner_text("#view")
            R["ch1_badge"] = await S("!!S.badges.perfect")
            await pg.screenshot(path=str(OUT / "results.png"))
            # A wrong answer goes to My misses, and getting it right clears it
            await go("test"); await tap('[data-act=quiz][data-arg="ch:2"]')
            wrong = await pg.evaluate("E10.SES.items[0].choices.findIndex(c => !c.ok)")
            await tap(f'[data-act=pick][data-arg="{wrong}"]')
            R["miss_saved"] = await S("Object.keys(S.miss).length")
            await go("test"); await tap('[data-act=quiz][data-arg="miss"]')
            right = await pg.evaluate("E10.SES.items[0].choices.findIndex(c => c.ok)")
            await tap(f'[data-act=pick][data-arg="{right}"]')
            R["miss_cleared"] = await S("[Object.keys(S.miss).length, S.fixed]")
            # The unit test: timed, scored at the end
            await go("test"); await tap('[data-act=quiz][data-arg="unit"]')
            R["unit_timer"] = await pg.inner_text("#timer")
            n = await pg.evaluate("E10.SES.items.length")
            for i in range(n):
                right = await pg.evaluate("E10.SES.items[E10.SES.i].choices.findIndex(c => c.ok)")
                await pg.locator(f'[data-act=pick][data-arg="{right}"]').click()
                if i < n - 1: await pg.locator("[data-act=qnext]").click()
            await tap("[data-act=qsubmit]")
            R["unit_result"] = [n, await S("S.quizzes[S.quizzes.length - 1].right"), await S("!!S.badges.unit90")]

            # A whole assignment
            await go("asg/new")
            await pg.fill("#na-title", "Critical lens essay")
            await pg.select_option("#na-type", "lens")
            await pg.fill("#na-prompt", "Choose one critical lens and analyze how it reveals a meaning in Lord of the Flies. Use at least two quotations and MLA citations.")
            await tap("[data-act=addasg]")
            aid = await S("S.asg[0].id")
            view = await pg.inner_text("#view")
            R["plan"] = [await S("Object.keys(S.asg[0].plan).length"), "Analyze:" in view, "two quotations" in view, "MLA" in view]
            await go(f"asg/{aid}/thesis")
            await pg.fill("#thesisbox", "Read through a Marxist lens, Lord of the Flies reveals that power on the island follows control of food and fire rather than the vote.")
            await pg.wait_for_timeout(150)
            R["thesis_checks"] = [await pg.locator("#tcheck .y").count(), await pg.locator("#tcheck li").count(), await S("!!S.badges.thesis")]
            await tap(f'[data-act=step][data-arg="{aid}:thesis"]')
            await go(f"asg/{aid}/outline")
            await pg.fill('[data-path="body.0.claim"]', "Jack's power grows from meat, not votes.")
            await pg.wait_for_timeout(700); await pg.reload(); await pg.wait_for_timeout(300)
            R["outline_kept"] = await pg.input_value('[data-path="body.0.claim"]')
            await go(f"asg/{aid}/evidence")
            await pg.fill("#nq-text", "We've got to have rules and obey them")
            await pg.select_option("#nq-ch", "2"); await pg.fill("#nq-page", "42")
            await tap('#nq-tags [data-arg="power"]'); await tap('#nq-tags [data-arg="lens-marx"]')
            await tap("[data-act=addquote]")
            R["quote"] = await S("[S.quotes.length, S.asg[0].quotes.length, S.quotes[0].tags.join(',')]")
            await go(f"asg/{aid}/draft")
            draft = ("Read through a Marxist lens, Lord of the Flies reveals that power follows food and fire.\n\n"
                     "\"We've got to have rules and obey them\" (Golding 42). This quote shows that Jack wants power. Then he left. Next they voted. After that they hunted. I think it's really about power.\n\n"
                     "In conclusion, power matters a lot in the book.")
            await pg.fill("textarea[data-in=adraft]", draft); await pg.wait_for_timeout(600)
            await go(f"check/a/{aid}")
            await tap("[data-act=runcheck]")
            R["check"] = [await pg.locator(".finding").count(), await pg.locator(".marked mark").count(), await S("S.checks.length")]
            f_with_mark = await pg.evaluate("document.querySelector('.marked mark').dataset.f")
            await tap(f'.finding[data-arg="{f_with_mark}"]')
            R["mark_on"] = await pg.locator("mark.on").count()
            await pg.screenshot(path=str(OUT / "check.png"), full_page=True)
            await go(f"rubric/a/{aid}")
            for k in await pg.evaluate("[...new Set([...document.querySelectorAll('[data-act=rbpick]')].map(b => b.dataset.arg.split(':')[0]))]"):
                await tap(f'[data-act=rbpick][data-arg="{k}:3"]')
            await tap("[data-act=rbsave]")
            R["rubric"] = await S("[S.rub.length, Object.values(S.rub[0].rows).join('')]")
            await go(f"claude/a/{aid}")
            await tap("[data-act=cshare]")
            shared = await pg.evaluate("window.__shared && window.__shared.text")
            R["claude"] = ["Do not rewrite my sentences" in shared, "This quote shows" in shared, "Thesis and lens" in shared, await S("S.ai.length")]
            await go("ailog")
            R["ailog"] = "Critical lens essay" in await pg.inner_text("#view")

            # Drills, review cards, seminar prep
            await go("drill/mla1")
            idx = await pg.evaluate("[...document.querySelectorAll('[data-act=dpick]')].findIndex(b => b.innerText.includes('(Golding 42)'))")
            await tap(f'[data-act=dpick][data-arg="{idx}"]')
            R["drill_mc"] = "Right." in await pg.inner_text("#view")
            await go("drill/w-present")
            await pg.fill("textarea[data-in=dtext]", "When Piggy holds the conch, he asks the tribe which is better, and Roger pushes the rock.")
            await tap("[data-act=dshow]")
            R["drill_write"] = "Every verb is in the present" in await pg.inner_text("#view")
            await go("review")
            for _ in range(3):
                await tap("[data-act=rflip]"); await tap('[data-act=rgrade][data-arg="1"]')
            R["cards"] = await S("Object.keys(S.cards).length")
            await go("seminar")
            await pg.fill('[data-k="q.0"]', "Why does the conch lose its power?"); await pg.wait_for_timeout(500)
            await tap("[data-act=semsave]")
            R["seminar"] = await S("S.sem.length")

            # A timed write after finishing the book
            await go("unit/4"); await pg.select_option("select[data-in=readto]", "12"); await pg.wait_for_timeout(200)
            await go("tw/lens-any"); await tap('[data-act=twstart]')
            R["tw_timer"] = await pg.inner_text("#twtimer")
            await pg.fill("textarea[data-in=twtext]", " ".join(["The conch loses its power as fear grows, and Golding shows that order lives only in belief."] * 5))
            await pg.wait_for_timeout(500); await tap("[data-act=twfinish]")
            R["tw_done"] = [await pg.evaluate("location.hash"), await S("S.writes.length"), await S("S.tw")]
            await go("coach")
            R["coach_recs"] = await pg.locator(".card.hi .list li").count()
            await pg.screenshot(path=str(OUT / "coach.png"), full_page=True)
            await go("today"); await pg.screenshot(path=str(OUT / "today.png"), full_page=True)
            await go("ch/1"); await pg.screenshot(path=str(OUT / "chapter.png"), full_page=True)

            # Network off: the app still opens
            await go("today"); await ctx.set_offline(True)
            await pg.reload(); await pg.wait_for_timeout(500)
            R["offline"] = "Ira" in await pg.inner_text("#view")
            await ctx.set_offline(False)

            # Backup through the share sheet, then restore into a fresh state
            await go("settings"); await tap("#bkup")
            backup = await pg.evaluate("window.__shared")
            R["backup"] = [backup["name"].startswith("english10h-backup-"), json.loads(backup["text"])["name"]]
            Path("/tmp/e10-backup.json").write_text(backup["text"])
            await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
            await go("settings")
            await pg.set_input_files("#rst", "/tmp/e10-backup.json"); await pg.wait_for_timeout(400)
            R["restored"] = await S("[S.name, S.quotes.length, S.asg.length]")
            await b.close()

            # World History installed first must not take over /english10/
            b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
            ctx2 = await b.new_context(**ipad(1180, 820)); pg2 = await ctx2.new_page()
            await pg2.goto(BASE); await pg2.evaluate("navigator.serviceWorker.ready.then(() => true)"); await pg2.wait_for_timeout(800)
            await pg2.goto(URL); await pg2.wait_for_timeout(500)
            R["after_world_history"] = await pg2.title()
            await ctx2.close()

            # Five iPad sizes and Split View: nothing wider than the screen
            sizes = {"ipad-landscape": (1180, 820), "ipad-portrait": (820, 1180), "ipad-mini": (744, 1133), "ipad-pro-13": (1376, 1032), "split-view": (507, 820)}
            R["sizes"] = {}
            for tag, (w, h) in sizes.items():
                c = await b.new_context(**ipad(w, h), color_scheme="dark" if tag == "ipad-portrait" else "light"); q = await c.new_page()
                await q.goto(URL); await q.wait_for_timeout(300)
                over = []
                for r in ["today", "unit/4", "ch/1", "write", "guide/lens", "check", "rubric/t/lens", "test", "coach", "me"]:
                    await q.evaluate(f"location.hash = '#/{r}'"); await q.wait_for_timeout(80)
                    if await q.evaluate("document.documentElement.scrollWidth > innerWidth + 1"): over.append(r)
                R["sizes"][tag] = over
                if tag in ("split-view", "ipad-portrait"):
                    await q.evaluate("location.hash = '#/guide/lens'"); await q.wait_for_timeout(150); await q.screenshot(path=str(OUT / f"{tag}.png"))
                await c.close()
            await b.close()
    finally:
        server.terminate()

    fails = []
    def need(cond, msg):
        if not cond: fails.append(msg)
    need(R["title"] == "English 10H", "title")
    need(R["sw_controls"], "offline worker not controlling the page")
    need(R["manifest"] == "English 10H", "manifest")
    need(not R["routes_bad"], f"screens with errors: {R['routes_bad']}")
    need(R["setup"] == ["Ira", 4, True], f"setup {R['setup']}")
    need(R["ch9_locked"] and R["hidden_characters"] >= 2, "spoilers not hidden")
    need("8 of 8" in R["ch1_result"] and R["ch1_badge"], f"reading check {R['ch1_result'][:200]}")
    need(R["miss_saved"] == 1 and R["miss_cleared"] == [0, 1], f"misses {R['miss_saved']} {R['miss_cleared']}")
    need(R["unit_timer"].startswith("39:") or R["unit_timer"].startswith("40:"), f"unit timer {R['unit_timer']}")
    need(R["unit_result"][0] == 30 and R["unit_result"][1] == 30 and R["unit_result"][2], f"unit test {R['unit_result']}")
    need(R["plan"] == [7, True, True, True], f"plan and prompt decoder {R['plan']}")
    need(R["thesis_checks"][0] == R["thesis_checks"][1] == 7 and R["thesis_checks"][2], f"thesis {R['thesis_checks']}")
    need(R["outline_kept"] == "Jack's power grows from meat, not votes.", "outline lost on reload")
    need(R["quote"] == [1, 1, "power,lens-marx"], f"quote {R['quote']}")
    need(R["check"][0] >= 5 and R["check"][1] >= 3 and R["check"][2] == 1 and R["mark_on"] >= 1, f"draft check {R['check']} {R['mark_on']}")
    need(R["rubric"] == [1, "333333"], f"rubric {R['rubric']}")
    need(R["claude"][:3] == [True, True, True] and R["claude"][3] == 1 and R["ailog"], f"claude {R['claude']}")
    need(R["drill_mc"] and R["drill_write"], "drills")
    need(R["cards"] == 3 and R["seminar"] == 1, f"cards {R['cards']} seminar {R['seminar']}")
    need(R["tw_timer"].startswith("44:") or R["tw_timer"].startswith("45:"), f"timed write timer {R['tw_timer']}")
    need(R["tw_done"][0] == "#/check/tw/0" and R["tw_done"][1] == 1 and R["tw_done"][2] is None, f"timed write {R['tw_done']}")
    need(R["coach_recs"] >= 1, "coach recommendations")
    need(R["offline"], "offline reload")
    need(R["backup"] == [True, "Ira"] and R["restored"] == ["Ira", 1, 1], f"backup {R['backup']} restore {R['restored']}")
    need(R["after_world_history"] == "English 10H", f"World History's worker served /english10/: {R['after_world_history']}")
    for tag, over in R["sizes"].items(): need(not over, f"{tag}: wider than the screen on {over}")
    need(not [e for e in errs if "favicon" not in e], f"console errors: {errs[:5]}")
    R["ch1_result"] = R["ch1_result"][:60]
    print(json.dumps(R, default=str)[:2500])
    print("FAILED:\n - " + "\n - ".join(fails) if fails else "All iPad checks passed.")
    sys.exit(1 if fails else 0)

asyncio.run(main())
