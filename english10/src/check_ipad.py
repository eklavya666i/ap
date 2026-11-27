"""iPad checks for English 10H, served at /ap/english10/ next to World History and the other apps, like GitHub Pages.
Adapted from Math 6's check_ipad.py. Covers: first visit (offline copy saved), every screen with no errors, setup,
spoiler gating, a perfect reading check, misses and fixing them, the timed unit test, a full assignment (plan, prompt
decoder, thesis checks, outline that survives a reload, evidence, draft, draft checker with highlights, rubric, Claude
hand-off and the AI log), the Quote Log, drills, review cards, seminar prep, a timed write, A Small Place, the argument
workshop, network off, share-sheet backup and restore, progress saved under the old unit numbers, World History
installed first (its worker must leave /english10/ alone), and five iPad sizes.
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
ROUTES = ["today", "learn", "unit/1", "unit/2", "unit/3", "unit/3/characters", "unit/3/symbols", "unit/3/themes", "unit/3/craft", "unit/3/context",
          "unit/4", "unit/4/characters", "unit/4/symbols", "unit/4/themes", "unit/4/rhetoric", "unit/4/context", "unit/5", "unit/5/fallacies",
          "unit/5/sources", "unit/5/debate", "unit/6", "unit/7", "unit/8", "unit/9", "unit/10", "ch/f451/1", "ch/f451/4", "ch/f451/7", "ch/3",
          "ch/asp/1", "ch/asp/4", "terms", "write", "asg/new", "guide/lit", "guide/argument", "guide/rhetorical", "guide/synthesis",
          "guide/narrative", "quotes", "quotes/new/f451/1/0", "quotes/new/asp/1/0", "quotes/new/3/1", "seminar", "drills", "drill/mla2",
          "drill/w-embed", "drill/w-symbol", "check", "check/t/argument", "check/t/lit", "rubric/t/lit", "claude/t/lit", "test", "tw/lit-foil",
          "tw/arg-service", "coach", "advice/teacher", "advice/heavy", "advice/ai", "ailog", "review", "me", "settings", "parent",
          "lesson/claims", "lesson/fallacies", "lesson/debate", "soap", "soap/new/asp", "debate", "debate/new/0"]
# Progress saved before the syllabus update: old unit 4 (Lord of the Flies), a lens essay, and misses on retired questions
OLD_STATE = {"v": 1, "name": "Ira", "days": {}, "xp": 120, "read": {"lotf": 5, "asp": 1}, "set": {"unit": 4, "sound": True},
             "miss": {"lotf.3.2": {"n": 1}, "lens.marx.1": {"n": 1}, "who.c.ralph": {"n": 1}, "asp.1.2": {"n": 1}},
             "qs": {"lens.marx.1": {"n": 1, "ok": 0, "k": "lens"}}, "quizzes": [{"d": "2026-11-26", "kind": "unit", "unit": 2, "n": 30, "right": 20}],
             "asg": [{"id": "old1", "title": "Lens essay", "type": "lens", "due": "2026-12-04", "created": "2026-11-26", "book": "lotf", "prompt": "", "steps": {}, "thesis": "", "outline": {"body": [{}, {}]}, "draft": "", "quotes": [], "done": None}],
             "writes": [{"d": "2026-11-26", "pid": "lens-any", "prompt": "Choose one critical lens.", "type": "lens", "min": 45, "words": 40, "text": "A short practice answer about a book."}],
             "drafts": {"lastType": "lens", "semBook": "lotf"}, "badges": {"read-1": "2026-11-26"}}

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
            await go("learn")
            R["learn"] = [await pg.locator("#view a.card.unit").count(), "Semester 2" in await pg.inner_text("#view"), "Course goals" in await pg.inner_text("#view")]
            await pg.screenshot(path=str(OUT / "learn.png"), full_page=True)

            # Setup: name, the current unit and how far she has read
            await go("today")
            await pg.fill("input[data-in=name]", "Ira")
            R["setup_unit"] = await pg.eval_on_selector("select[data-in=unit]", "s => s.value")
            await pg.select_option("select[data-in=readto][data-b=f451]", "3"); await pg.wait_for_timeout(150)
            await tap("[data-act=setupdone]")
            R["setup"] = await S("[S.name, S.read.f451, !!S.seen.setup, S.set.unit]")
            # Spoilers stay hidden past section 3
            await go("ch/f451/6")
            R["sec6_locked"] = "Show it anyway" in await pg.inner_text("#view") and "flamethrower" not in await pg.inner_text("#view")
            await go("unit/3/characters")
            R["hidden_characters"] = await pg.locator("text=Another character").count()
            await go("unit/3/craft")
            R["craft"] = [await pg.locator("#view .list li .spoiler").count(), "Foil" in await pg.inner_text("#view")]

            # A perfect reading check on section 1, through the real buttons
            await go("test"); await tap('[data-act=quiz][data-arg="ch:f451:1"]')
            for i in range(8):
                right = await pg.evaluate("E10.SES.items[E10.SES.i].choices.findIndex(c => c.ok)")
                await tap(f'[data-act=pick][data-arg="{right}"]')
                await tap("[data-act=qnext]")
            R["ch1_result"] = await pg.inner_text("#view")
            R["ch1_badge"] = await S("!!S.badges.perfect")
            await pg.screenshot(path=str(OUT / "results.png"))
            # A wrong answer goes to My misses, and getting it right clears it
            await go("test"); await tap('[data-act=quiz][data-arg="ch:f451:2"]')
            wrong = await pg.evaluate("E10.SES.items[0].choices.findIndex(c => !c.ok)")
            await tap(f'[data-act=pick][data-arg="{wrong}"]')
            R["miss_saved"] = await S("Object.keys(S.miss).length")
            await go("test"); await tap('[data-act=quiz][data-arg="miss"]')
            right = await pg.evaluate("E10.SES.items[0].choices.findIndex(c => c.ok)")
            await tap(f'[data-act=pick][data-arg="{right}"]')
            R["miss_cleared"] = await S("[Object.keys(S.miss).length, S.fixed]")
            # The unit test: timed, scored at the end
            await go("test"); await tap('[data-act=quiz][data-arg="unit:3"]')
            R["unit_timer"] = await pg.inner_text("#timer")
            n = await pg.evaluate("E10.SES.items.length")
            R["unit_spoilers"] = await pg.evaluate("E10.SES.items.filter(it => /^f451\\.[4-7]\\./.test(it.id)).length")
            for i in range(n):
                right = await pg.evaluate("E10.SES.items[E10.SES.i].choices.findIndex(c => c.ok)")
                await pg.locator(f'[data-act=pick][data-arg="{right}"]').click()
                if i < n - 1: await pg.locator("[data-act=qnext]").click()
            await tap("[data-act=qsubmit]")
            R["unit_result"] = [n, await S("S.quizzes[S.quizzes.length - 1].right"), await S("!!S.badges.unit90"), await S("S.quizzes[S.quizzes.length - 1].unit")]

            # A whole assignment
            await go("asg/new")
            await pg.fill("#na-title", "Literary analysis essay")
            await pg.select_option("#na-type", "lit"); await pg.select_option("#na-book", "f451")
            await pg.fill("#na-prompt", "Analyze how Bradbury uses fire as a symbol in Fahrenheit 451. Use at least two quotations and MLA citations.")
            await tap("[data-act=addasg]")
            aid = await S("S.asg[0].id")
            view = await pg.inner_text("#view")
            R["plan"] = [await S("Object.keys(S.asg[0].plan).length"), "Analyze:" in view, "two quotations" in view, "MLA" in view, "Craft: Fahrenheit 451" in view]
            await go(f"asg/{aid}/thesis")
            await pg.fill("#thesisbox", "In Fahrenheit 451, Bradbury uses the parlor walls to show that constant entertainment can leave people unable to feel their own lives.")
            await pg.wait_for_timeout(150)
            R["thesis_checks"] = [await pg.locator("#tcheck .y").count(), await pg.locator("#tcheck li").count(), await S("!!S.badges.thesis")]
            await tap(f'[data-act=step][data-arg="{aid}:thesis"]')
            await go(f"asg/{aid}/outline")
            await pg.fill('[data-path="body.0.claim"]', "Clarisse's questions crack Montag's routine.")
            await pg.wait_for_timeout(700); await pg.reload(); await pg.wait_for_timeout(300)
            R["outline_kept"] = await pg.input_value('[data-path="body.0.claim"]')
            await go(f"asg/{aid}/evidence")
            R["tags_gated"] = [await pg.locator('#nq-tags [data-arg="clarisse"]').count(), await pg.locator('#nq-tags [data-arg="faber"]').count()]
            await pg.fill("#nq-text", "a practice line from my own copy")
            await pg.select_option("#nq-ch", "1"); await pg.fill("#nq-page", "42")
            await tap('#nq-tags [data-arg="clarisse"]'); await tap('#nq-tags [data-arg="foil"]')
            await tap("[data-act=addquote]")
            R["quote"] = await S("[S.quotes.length, S.asg[0].quotes.length, S.quotes[0].tags.join(',')]")
            await go(f"asg/{aid}/draft")
            draft = ("In Fahrenheit 451, Bradbury uses the parlor walls to show that entertainment numbs people.\n\n"
                     "\"A practice line from my own copy\" (Bradbury 42). This quote shows that Mildred is numb. Then she went to bed. Next Montag called for help. After that the technicians came. I think it's really about TV.\n\n"
                     "In conclusion, TV matters a lot in the book.")
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
            R["claude"] = ["Do not rewrite my sentences" in shared, "This quote shows" in shared, "Thesis and theme" in shared, "Text: Fahrenheit 451 by Ray Bradbury" in shared, await S("S.ai.length")]
            await go("ailog")
            R["ailog"] = "Literary analysis essay" in await pg.inner_text("#view")

            # Drills, review cards, seminar prep
            await go("drill/mla1")
            idx = await pg.evaluate("[...document.querySelectorAll('[data-act=dpick]')].findIndex(b => b.innerText.includes('(Bradbury 42)'))")
            await tap(f'[data-act=dpick][data-arg="{idx}"]')
            R["drill_mc"] = "Right." in await pg.inner_text("#view")
            await go("drill/w-present")
            await pg.fill("textarea[data-in=dtext]", "When Montag walks home, he meets Clarisse, and she asks him whether he is happy.")
            await tap("[data-act=dshow]")
            R["drill_write"] = "Every verb is in the present" in await pg.inner_text("#view")
            await go("review")
            R["review_first_f451"] = await pg.inner_text(".tesbar .chip")
            for _ in range(3):
                await tap("[data-act=rflip]"); await tap('[data-act=rgrade][data-arg="1"]')
            R["cards"] = await S("Object.keys(S.cards).length")
            await go("seminar")
            await pg.fill('[data-k="q.0"]', "Why does Clarisse's question bother Montag so much?"); await pg.wait_for_timeout(500)
            await tap("[data-act=semsave]")
            R["seminar"] = await S("[S.sem.length, S.sem[0].book]")

            # A timed write after finishing the book
            await go("unit/3"); await pg.select_option("select[data-in=readto][data-b=f451]", "7"); await pg.wait_for_timeout(200)
            R["finished_badge"] = await S("!!S.badges['f451-7']")
            await go("tw/lit-fire"); await tap('[data-act=twstart]')
            R["tw_timer"] = await pg.inner_text("#twtimer")
            await pg.fill("textarea[data-in=twtext]", " ".join(["Fire changes meaning across the novel, and Bradbury uses that change to show that knowledge can destroy or renew."] * 5))
            await pg.wait_for_timeout(500); await tap("[data-act=twfinish]")
            R["tw_done"] = [await pg.evaluate("location.hash"), await S("S.writes.length"), await S("S.tw")]
            await go("coach")
            R["coach_recs"] = await pg.locator(".card.hi .list li").count()
            await pg.screenshot(path=str(OUT / "coach.png"), full_page=True)
            await go("today"); await pg.screenshot(path=str(OUT / "today.png"), full_page=True)
            await go("ch/f451/1"); await pg.screenshot(path=str(OUT / "f451-1.png"), full_page=True)
            await go("unit/3/craft"); await pg.screenshot(path=str(OUT / "unit3.png"), full_page=True)

            # Unit 4: A Small Place, spoiler gating by section, a reading check, a rhetorical analysis assignment
            async def perfect(selector):
                await tap(selector)
                n = await pg.evaluate("E10.SES.items.length")
                for i in range(n):
                    right = await pg.evaluate("E10.SES.items[E10.SES.i].choices.findIndex(c => c.ok)")
                    await pg.locator(f'[data-act=pick][data-arg="{right}"]').click()
                    if await pg.evaluate("E10.SES.mode") == "test":
                        if i < n - 1: await pg.locator("[data-act=qnext]").click()
                    else: await pg.locator("[data-act=qnext]").click()
                if await pg.evaluate("!E10.SES.done"): await tap("[data-act=qsubmit]")
                return [n, await S("S.quizzes[S.quizzes.length - 1].right")]
            await go("unit/4")
            R["u4_tabs"] = await pg.locator(".ltabs a").all_inner_texts()
            await pg.select_option("select[data-in=readto][data-b=asp]", "2"); await pg.wait_for_timeout(200)
            await go("ch/asp/4")
            R["asp4_locked"] = "Show it anyway" in await pg.inner_text("#view") and "prose poem" not in await pg.inner_text("#view")
            await go("ch/asp/1")
            R["asp1_move"] = "Rhetorical move: Second-person address" in await pg.inner_text("#view")
            await go("test")
            R["asp_check"] = await perfect('[data-act=quiz][data-arg="ch:asp:1"]')
            await go("unit/4/rhetoric")
            R["asp_rhetoric"] = await pg.locator(".tbl tr").count()
            await go("soap/new/asp")
            for k, v in [("sp", "Kincaid, a native Antiguan"), ("au", "Tourists and readers from the US and Europe"), ("pu", "To make readers see the costs of tourism"), ("to", "Sarcastic, then lyrical")]:
                await pg.fill(f'textarea[data-in=soapf][data-k="{k}"]', v)
            await pg.wait_for_timeout(500); await tap("[data-act=soapsave]")
            R["soap"] = [await S("S.soaps.length"), await pg.evaluate("location.hash")]
            await go("quotes/new/asp/1/0")
            await pg.fill("#nq-text", "a practice line from the reader's own copy"); await pg.fill("#nq-page", "12")
            await tap('#nq-tags [data-arg="you"]'); await tap("[data-act=addquote]")
            R["asp_quote"] = await pg.evaluate("(() => { const q = E10.S.quotes[E10.S.quotes.length - 1]; return [q.book, q.ch, q.tags.join(',')]; })()")
            await go("asg/new")
            await pg.fill("#na-title", "Rhetorical analysis"); await pg.select_option("#na-type", "rhetorical"); await pg.select_option("#na-book", "asp")
            await tap("[data-act=addasg]")
            aid2 = await S("S.asg[S.asg.length - 1].id")
            await go(f"asg/{aid2}/thesis")
            await pg.fill("#thesisbox", "In A Small Place, Kincaid casts the reader as a tourist to expose how a vacation depends on not seeing the people who make it possible.")
            await pg.wait_for_timeout(150)
            R["asp_thesis"] = [await pg.locator("#tcheck .y").count(), await pg.locator("#tcheck li").count()]
            await go("test")
            R["unit4_test"] = await perfect('[data-act=quiz][data-arg="unit:4"]')

            # Unit 5: the argument workshop, the fallacy finder, a debate case, the unit test
            await go("unit/5"); await tap('[data-act=setunit][data-arg="5"]')
            R["u5_stat"] = await pg.inner_text("#stats")
            await go("lesson/claims")
            R["lesson"] = [await S("!!S.seen['lesson:claims']"), "Key points" in await pg.inner_text("#view"), await pg.get_attribute(".crumb a", "href")]
            await go("unit/5/fallacies")
            R["fallacy_cards"] = await pg.locator("#view .grid .card").count()
            R["fallacy_finder"] = await perfect('[data-act=quiz][data-arg="fallacies"]')
            R["fallacy_badge"] = await S("!!S.badges.fallacy90")
            await go("unit/5/sources")
            R["douglass"] = await perfect('[data-act=quiz][data-arg="arg:douglass"]')
            await go("debate/new/0")
            await pg.fill('textarea[data-in=debf][data-k="args.0.claim"]', "Later starts protect sleep.")
            await pg.fill('textarea[data-in=debf][data-k="args.1.claim"]', "Rested students learn more.")
            await pg.wait_for_timeout(500); await tap("[data-act=debsave]")
            R["debate"] = [await S("S.debates.length"), await S("S.debates[0].motion"), await pg.evaluate("location.hash"), await pg.get_attribute(".crumb a", "href")]
            await go("test")
            R["unit5_test"] = await perfect('[data-act=quiz][data-arg="unit:5"]')
            await go("today")
            R["today_u5"] = "Workshop" in await pg.inner_text("#view")
            await go("coach")
            R["coach_u5"] = await pg.locator(".card.hi .list li").count()
            await go("review")
            R["review_first"] = await pg.inner_text(".tesbar .chip")
            await go("unit/5/fallacies"); await pg.screenshot(path=str(OUT / "unit5.png"), full_page=True)
            await go("ch/asp/1"); await pg.screenshot(path=str(OUT / "asp1.png"), full_page=True)
            # A writing unit and a unit whose guide is coming
            await go("unit/1"); await tap('[data-act=setunit][data-arg="1"]')
            await go("today")
            R["today_u1"] = ["Writing unit" in await pg.inner_text("#view"), await pg.inner_text("#stats")]
            await go("unit/9")
            R["unit9"] = ["coming" in await pg.inner_text("#view"), "Literary analysis essay guide" in await pg.inner_text("#view")]
            await go("unit/3"); await tap('[data-act=setunit][data-arg="3"]')

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

            # Progress saved under the old unit numbers moves to the new syllabus
            # Leave the app first so its save-on-hide can't overwrite the injected copy, then come back
            (SITE / "blank.html").write_text('<!doctype html><link rel="icon" href="data:,"><title>blank</title>')
            await pg.goto(f"http://127.0.0.1:{PORT}/blank.html"); await pg.wait_for_timeout(200)
            await pg.evaluate(f"localStorage.setItem('eng10h.v1', {json.dumps(json.dumps(OLD_STATE))})")
            await pg.goto(URL); await pg.wait_for_timeout(500)
            R["migrated"] = await S("[S.set.unit, Object.keys(S.miss).join(','), S.asg[0].type, S.asg[0].book, S.writes[0].type, S.quizzes[0].unit, S.drafts.lastType, S.syl]")
            n0 = len(errs)
            for r in ["today", "check/a/old1", "check/tw/0", "check", "test", "coach", "seminar", "me", "quotes"]:
                await go(r, 120)
            R["migrated_errors"] = errs[n0:]
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
                for r in ["today", "learn", "unit/3", "ch/f451/1", "write", "guide/lit", "check", "rubric/t/lit", "test", "coach", "me"]:
                    await q.evaluate(f"location.hash = '#/{r}'"); await q.wait_for_timeout(80)
                    if await q.evaluate("document.documentElement.scrollWidth > innerWidth + 1"): over.append(r)
                R["sizes"][tag] = over
                if tag in ("split-view", "ipad-portrait"):
                    await q.evaluate("location.hash = '#/learn'"); await q.wait_for_timeout(150); await q.screenshot(path=str(OUT / f"{tag}.png"))
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
    need(R["learn"] == [10, True, True], f"learn page {R['learn']}")
    need(R["setup_unit"] == "3" and R["setup"] == ["Ira", 3, True, 3], f"setup {R['setup_unit']} {R['setup']}")
    need(R["sec6_locked"] and R["hidden_characters"] >= 3, "spoilers not hidden")
    need(R["craft"][0] == 4 and R["craft"][1], f"craft tab gating {R['craft']}")
    need("8 of 8" in R["ch1_result"] and R["ch1_badge"], f"reading check {R['ch1_result'][:200]}")
    need(R["miss_saved"] == 1 and R["miss_cleared"] == [0, 1], f"misses {R['miss_saved']} {R['miss_cleared']}")
    need(R["unit_timer"].startswith("39:") or R["unit_timer"].startswith("40:"), f"unit timer {R['unit_timer']}")
    need(R["unit_spoilers"] == 0, "unit test drew questions from unread sections")
    need(R["unit_result"][0] == 30 and R["unit_result"][1] == 30 and R["unit_result"][2] and R["unit_result"][3] == 3, f"unit test {R['unit_result']}")
    need(R["plan"] == [7, True, True, True, True], f"plan and prompt decoder {R['plan']}")
    need(R["thesis_checks"][0] == R["thesis_checks"][1] == 6 and R["thesis_checks"][2], f"thesis {R['thesis_checks']}")
    need(R["outline_kept"] == "Clarisse's questions crack Montag's routine.", "outline lost on reload")
    need(R["tags_gated"] == [1, 0], f"quote tags should hide characters not met yet {R['tags_gated']}")
    need(R["quote"] == [1, 1, "clarisse,foil"], f"quote {R['quote']}")
    need(R["check"][0] >= 5 and R["check"][1] >= 3 and R["check"][2] == 1 and R["mark_on"] >= 1, f"draft check {R['check']} {R['mark_on']}")
    need(R["rubric"] == [1, "33333"], f"rubric {R['rubric']}")
    need(R["claude"][:4] == [True, True, True, True] and R["claude"][4] == 1 and R["ailog"], f"claude {R['claude']}")
    need(R["drill_mc"] and R["drill_write"], "drills")
    need(R["review_first_f451"] in ("Character", "Symbol"), f"review cards start with the current unit: {R['review_first_f451']}")
    need(R["cards"] == 3 and R["seminar"] == [1, "f451"], f"cards {R['cards']} seminar {R['seminar']}")
    need(R["finished_badge"], "finishing the book earns its badge")
    need(R["tw_timer"].startswith("44:") or R["tw_timer"].startswith("45:"), f"timed write timer {R['tw_timer']}")
    need(R["tw_done"][0] == "#/check/tw/0" and R["tw_done"][1] == 1 and R["tw_done"][2] is None, f"timed write {R['tw_done']}")
    need(R["coach_recs"] >= 1, "coach recommendations")
    need(R["offline"], "offline reload")
    need(R["backup"] == [True, "Ira"] and R["restored"] == ["Ira", 2, 2], f"backup {R['backup']} restore {R['restored']}")
    need(R["migrated"] == [3, "asp.1.2", "lit", "", "lit", 4, "lit", 2] and not R["migrated_errors"], f"migration {R['migrated']} {R['migrated_errors']}")
    need(R["after_world_history"] == "English 10H", f"World History's worker served /english10/: {R['after_world_history']}")
    for tag, over in R["sizes"].items(): need(not over, f"{tag}: wider than the screen on {over}")
    need(R["u4_tabs"] == ["Sections", "Voices", "Motifs", "Themes", "Rhetoric", "Context"], f"unit 4 tabs {R['u4_tabs']}")
    need(R["asp4_locked"] and R["asp1_move"], "A Small Place gating or guide")
    need(R["asp_check"] == [8, 8], f"A Small Place check {R['asp_check']}")
    need(R["asp_rhetoric"] >= 6, "SOAPSTone model")
    need(R["soap"] == [1, "#/soap"], f"SOAPSTone {R['soap']}")
    need(R["asp_quote"] == ["asp", 1, "you"], f"A Small Place quote {R['asp_quote']}")
    need(R["asp_thesis"][0] == R["asp_thesis"][1] and R["asp_thesis"][1] >= 6, f"A Small Place thesis {R['asp_thesis']}")
    need(R["unit4_test"][0] == R["unit4_test"][1] and R["unit4_test"][0] >= 25, f"unit 4 test {R['unit4_test']}")
    need("lessons" in R["u5_stat"], f"unit 5 header {R['u5_stat']}")
    need(R["lesson"] == [True, True, "#/unit/5"] and R["fallacy_cards"] == 14, f"lessons {R['lesson']} fallacies {R['fallacy_cards']}")
    need(R["fallacy_finder"][0] == 15 and R["fallacy_finder"][1] == 15 and R["fallacy_badge"], f"fallacy finder {R['fallacy_finder']}")
    need(R["douglass"] == [2, 2], f"source practice {R['douglass']}")
    need(R["debate"][0] == 1 and R["debate"][1].startswith("High schools") and R["debate"][2] == "#/debate" and R["debate"][3] == "#/unit/5/debate", f"debate {R['debate']}")
    need(R["unit5_test"] == [30, 30], f"unit 5 test {R['unit5_test']}")
    need(R["today_u5"] and R["coach_u5"] >= 1, "today and coach for unit 5")
    need(R["review_first"] == "Fallacy", f"review cards for the current unit first: {R['review_first']}")
    need(R["today_u1"][0] and "unit" in R["today_u1"][1], f"writing unit on Today {R['today_u1']}")
    need(R["unit9"] == [True, True], f"unit 9 page {R['unit9']}")
    need(not [e for e in errs if "favicon" not in e], f"console errors: {errs[:5]}")
    R["ch1_result"] = R["ch1_result"][:60]
    print(json.dumps(R, default=str)[:3000])
    print("FAILED:\n - " + "\n - ".join(fails) if fails else "All iPad checks passed.")
    sys.exit(1 if fails else 0)

asyncio.run(main())
