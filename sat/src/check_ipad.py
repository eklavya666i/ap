"""iPad checks for the installable app, served at /ap/sat/ next to World History and Cyber, like GitHub Pages:
Safari-style first visit (install note, offline copy saved, manifest installable), a full 16-question set by touch
with the network off, share-sheet backup and restore, Home Screen mode in landscape, other iPad sizes and Split View,
dark mode, and an update arriving while the app is open."""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
ROOT = HERE.parent            # sat/
REPO = ROOT.parent            # the ap repo, served at /ap/ like GitHub Pages
OUT = HERE / "shots"; OUT.mkdir(exist_ok=True)
SITE = Path("/tmp/ap-site"); SITE.mkdir(exist_ok=True)
link = SITE / "ap"
if not link.exists(): link.symlink_to(REPO)
PORT = 8765
URL = f"http://127.0.0.1:{PORT}/ap/sat/"
WORLD = f"http://127.0.0.1:{PORT}/ap/"
CYBER = f"http://127.0.0.1:{PORT}/ap/cyber/"
UA = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
SHARE_STUB = """
navigator.canShare = () => true;
navigator.share = async d => { const f = d.files[0]; window.__shared = {name: f.name, type: f.type, text: await f.text()}; };
"""
STANDALONE_STUB = "Object.defineProperty(navigator, 'standalone', {get: () => true});"

def ipad(w, h, **kw):
    return dict(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, **kw)

async def probe(page):
    return await page.evaluate("""() => {
      const small = [...document.querySelectorAll('button, label.btn, input:not(.sr), summary, a')].filter(e => {
        const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && (r.height < 44 || r.width < 44);
      }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      return {overflow: document.documentElement.scrollWidth - innerWidth, small,
              fonts: document.fonts.check('16px Archivo') && document.fonts.check('17px "Source Serif 4"')};
    }""")

async def answer_all(page, tag):
    n = 0
    while await page.locator("#go").count():
        if await page.locator("#spr").count():
            await page.locator("#spr").tap(); await page.fill("#spr", "3/4")
        else:
            await page.locator(".ch[data-i='1']").tap()
        await page.locator("#go").tap()
        await page.wait_for_selector("#fb")
        n += 1
        if n == 1:
            await page.wait_for_timeout(250)
            await page.screenshot(path=str(OUT / f"{tag}-feedback.png"), full_page=True)
        await page.locator("#nx").tap()
    await page.wait_for_selector(".res")
    return n

async def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(SITE)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    report = {}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])

            # 1. First visit in Safari on an iPad Air (portrait)
            ctx = await b.new_context(**ipad(820, 1180))
            await ctx.add_init_script(SHARE_STUB)
            page = await ctx.new_page()
            errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
            page.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await page.goto(URL); await page.wait_for_selector("#qn")
            r = {"install_note": await page.locator("#inst .inst").inner_text() if await page.locator("#inst .inst").count() else None}
            await page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
            await page.wait_for_timeout(300)
            r["toast"] = await page.locator(".toast").inner_text() if await page.locator(".toast").count() else None
            r["sync"] = await page.locator("#sync").inner_text()
            r["cache"] = await page.evaluate("""async () => { const ks = await caches.keys();
                return Promise.all(ks.map(async k => k + ': ' + (await (await caches.open(k)).keys()).map(q => new URL(q.url).pathname).join(' '))); }""")
            cdp = await ctx.new_cdp_session(page)
            man = await cdp.send("Page.getAppManifest")
            r["manifest_errors"] = man.get("errors")
            r["installability_errors"] = (await cdp.send("Page.getInstallabilityErrors")).get("installabilityErrors")
            await page.screenshot(path=str(OUT / "ipad-portrait-question.png"), full_page=True)
            r["question_view"] = await probe(page)

            # 2. Network off: reload from the saved copy and do the whole set by touch
            await ctx.set_offline(True)
            await page.reload(); await page.wait_for_selector("#qn")
            r["offline_reload"] = await page.locator("#qn").inner_text()
            r["offline_answered"] = await answer_all(page, "ipad-portrait")
            r["results_view"] = await probe(page)
            await page.screenshot(path=str(OUT / "ipad-portrait-results.png"), full_page=True)

            # 3. Back up through the share sheet, then restore from that file
            await page.locator("#bkup").tap(); await page.wait_for_timeout(300)
            shared = await page.evaluate("window.__shared")
            j = json.loads(shared["text"])
            r["backup"] = {"name": shared["name"], "type": shared["type"], "v": j.get("v"), "days": len(j.get("days", {})), "bk": j.get("bk")}
            r["last_backup_line"] = await page.locator("#bkm").inner_text()
            await page.evaluate("localStorage.clear()")
            await page.set_input_files("#rst", files=[{"name": shared["name"], "mimeType": "application/json", "buffer": shared["text"].encode()}])
            await page.wait_for_timeout(400)
            r["restore"] = [await page.locator("#bkm").inner_text(), await page.locator("#stk").inner_text()]
            r["errors"] = errs
            report["safari_ipad_air"] = r
            state = await ctx.storage_state()

            # 4. An update arrives while the app is open (online, on the results screen)
            await ctx.set_offline(False)
            sw = (ROOT / "sw.js").read_text()
            (ROOT / "sw.js").write_text(sw.replace("const CACHE = 'satdaily-", "const CACHE = 'satdaily-u"))
            try:
                await page.evaluate("window.__marker = 1")
                await page.evaluate("navigator.serviceWorker.getRegistration().then(r => r.update())")
                await page.wait_for_function("window.__marker === undefined", timeout=20000)
                await page.wait_for_selector(".res")
                report["update"] = {"reloaded": True, "caches": await page.evaluate("caches.keys()"), "view": await page.locator("#qn").inner_text()}
            finally:
                (ROOT / "sw.js").write_text(sw)
            await ctx.close()

            # 5. Home Screen app (standalone) in landscape, fresh install
            ctx = await b.new_context(**ipad(1180, 820))
            await ctx.add_init_script(STANDALONE_STUB)
            page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(URL); await page.wait_for_selector("#qn")
            r = {"install_note_hidden": await page.locator("#inst").is_hidden()}
            await page.screenshot(path=str(OUT / "ipad-landscape-app-question.png"))
            r["question_view"] = await probe(page)
            r["answered"] = await answer_all(page, "ipad-landscape")
            r["results_view"] = await probe(page)
            await page.screenshot(path=str(OUT / "ipad-landscape-app-results.png"), full_page=True)
            r["errors"] = errs
            report["home_screen_landscape"] = r
            await ctx.close()

            # 6. Other iPads and Split View, using the finished day from step 1 (results) and a fresh start (question)
            sizes = {"ipad-mini-portrait": (744, 1133), "ipad-pro-13-landscape": (1376, 1032), "split-view-third": (320, 1180), "split-view-half-landscape": (590, 820)}
            report["sizes"] = {}
            for tag, (w, h) in sizes.items():
                out = {}
                for kind, st in (("question", None), ("results", state)):
                    ctx = await b.new_context(**ipad(w, h), storage_state=st)
                    page = await ctx.new_page()
                    await page.goto(URL); await page.wait_for_selector("#qn")
                    out[kind] = await probe(page)
                    if tag in ("ipad-mini-portrait", "split-view-third"):
                        await page.screenshot(path=str(OUT / f"{tag}-{kind}.png"), full_page=True)
                    await ctx.close()
                report["sizes"][tag] = out

            # 7. Neighbours on the same site: World History installed first, then SAT Daily, then both offline
            ctx = await b.new_context(**ipad(820, 1180))
            page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(WORLD); await page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
            world_title = await page.title()
            await page.goto(URL); await page.wait_for_selector("#qn")
            n = {"world_first": world_title, "sat_after_world": await page.title()}
            await page.wait_for_function("navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.endsWith('/ap/sat/sw.js')", timeout=20000)
            await page.goto(CYBER); n["cyber"] = await page.title()
            await ctx.set_offline(True)
            await page.goto(URL); await page.wait_for_selector("#qn"); n["sat_offline"] = await page.title()
            await page.goto(WORLD); await page.wait_for_load_state("load"); n["world_offline"] = await page.title()
            n["caches"] = sorted(await page.evaluate("caches.keys()")); n["errors"] = errs
            report["neighbours"] = n
            await ctx.close()

            # 8. Dark mode, iPad Air portrait
            ctx = await b.new_context(**ipad(820, 1180), color_scheme="dark")
            page = await ctx.new_page(); await page.goto(URL); await page.wait_for_selector("#qn")
            await page.locator(".ch[data-i='0']").tap(); await page.locator("#go").tap(); await page.wait_for_selector("#fb")
            await page.screenshot(path=str(OUT / "ipad-dark-feedback.png"))
            await ctx.close()
            await b.close()
    finally:
        server.terminate()
    print(json.dumps(report, indent=1))

asyncio.run(main())
