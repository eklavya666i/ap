"""iPad checks for Math 6, served at /ap/math6/ next to World History, Cyber and SAT Daily, like GitHub Pages.
Adapted from SAT Daily's check_ipad.py. Covers: first visit in Safari (offline copy saved, manifest installable),
every screen by touch, the voice queue with a stubbed voice, network off, share-sheet backup and restore,
World History installed first (its worker must leave /math6/ alone), Home Screen mode, other iPad sizes and Split View.
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
  speak(u) { window.__said.push(u.text); this.speaking = true; setTimeout(() => { this.speaking = false; u.onend && u.onend(); }, 20); }
};
Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true, writable: true});
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
"""

def ipad(w, h, **kw):
    return dict(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, **kw)

async def probe(page):
    return await page.evaluate("""() => {
      const small = [...document.querySelectorAll('button, label.btn, a, select, input:not(.sr)')].filter(e => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return false;
        if (e.tagName === 'A' && e.closest('.lessons, p')) return false;   // inline text links
        return r.height < 44 || r.width < 44;
      }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      return {overflow: document.documentElement.scrollWidth - innerWidth, small,
              fonts: document.fonts.check('16px Archivo') && document.fonts.check('17px "Source Serif 4"')};
    }""")

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
            await ctx.add_init_script(SHARE_STUB); await ctx.add_init_script(VOICE_STUB)
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
            await page.locator("nav a", has_text="Units").tap()
            await page.locator(".unit").first.tap(); await page.wait_for_selector(".lessons")
            screens["unit_1"] = {"lessons": await page.locator(".lessons li").count(), **(await probe(page))}
            await page.locator(".lessons a", has_text="Unit rates").tap(); await page.wait_for_selector("#view h2")
            screens["lesson_1.5"] = await page.locator("#view h2").inner_text()
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
            r["voice_unspoken_symbols"] = [s for s in said if any(c in s for c in "/^−<>≤≥×÷=|²³$%")]
            r["voice"] = await probe(page)
            await page.screenshot(path=str(OUT / "ipad-voice.png"), full_page=True)

            # 4. Network off: the saved copy still opens
            await ctx.set_offline(True)
            await page.goto(URL + "#/units"); await page.wait_for_selector(".unit")
            r["offline_units"] = await page.locator(".unit").count()

            # 5. Back up through the share sheet, then restore from that file
            await page.goto(URL + "#/settings"); await page.wait_for_selector("#name")
            await page.fill("#name", "Test"); await page.locator("#name").dispatch_event("change")
            await page.locator("#bkup").tap(); await page.wait_for_timeout(300)
            shared = await page.evaluate("window.__shared")
            j = json.loads(shared["text"])
            r["backup"] = {"name": shared["name"], "type": shared["type"], "v": j.get("v"), "student": j.get("name")}
            await page.evaluate("localStorage.clear()"); await page.reload(); await page.wait_for_selector("#rst", state="attached")
            await page.set_input_files("#rst", files=[{"name": shared["name"], "mimeType": "application/json", "buffer": shared["text"].encode()}])
            await page.wait_for_timeout(400)
            r["restored_name"] = await page.locator("#name").input_value()
            await ctx.set_offline(False)

            # 6. The other apps still open as themselves with Math 6 installed
            others = {}
            for path in ["", "cyber/", "sat/"]:
                await page.goto(BASE + path); await page.wait_for_function("document.title.length > 0", timeout=20000)
                others[path or "world"] = await page.title()
            r["other_apps"] = others
            r["errors"] = errs
            report["safari_ipad_air"] = r
            await ctx.close()

            # 7. Home Screen app in landscape, then other iPads and Split View
            sizes = {"home-screen-landscape": (1180, 820), "ipad-mini-portrait": (744, 1133), "ipad-pro-13-landscape": (1376, 1032),
                     "split-view-third": (320, 1180), "split-view-half-landscape": (590, 820)}
            report["sizes"] = {}
            for tag, (w, h) in sizes.items():
                ctx = await b.new_context(**ipad(w, h))
                await ctx.add_init_script(STANDALONE_STUB); await ctx.add_init_script(VOICE_STUB)
                page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
                got = {}
                for view in ["", "#/units", "#/unit/1", "#/voice"]:
                    await page.goto(URL + view); await page.wait_for_selector("#view h2")
                    got[view or "#/today"] = await probe(page)
                got["install_note_hidden"] = await page.locator("#inst").is_hidden()
                got["errors"] = errs
                await page.screenshot(path=str(OUT / f"{tag}.png"))
                report["sizes"][tag] = got
                await ctx.close()
            await b.close()
    finally:
        server.terminate()

    # Verdict
    s = report["safari_ipad_air"]
    if s["math6_title_after_world_history"] != "Math 6": problems.append("World History's worker served /math6/")
    if not (s["controlled_by"] or "").endswith("/math6/sw.js"): problems.append("Math 6 is not controlled by its own worker")
    # Playwright contexts are incognito, which Chrome reports as "in-incognito"; anything else is a real problem.
    if s["manifest_errors"] or [e for e in s["installability_errors"] or [] if e.get("errorId") != "in-incognito"]:
        problems.append("manifest or installability errors")
    if s["voice_spoken"] < 20 or s["voice_unspoken_symbols"]: problems.append("voice queue or speech text")
    if s["offline_units"] != 10: problems.append("offline copy")
    if s["restored_name"] != "Test": problems.append("backup and restore")
    if s["other_apps"].get("world") == "Math 6" or s["other_apps"].get("sat/") == "Math 6" or s["other_apps"].get("cyber/") == "Math 6":
        problems.append("another app opened as Math 6")
    if s["errors"]: problems.append("page errors")
    for tag, got in report["sizes"].items():
        for view, pr in got.items():
            if isinstance(pr, dict) and (pr.get("overflow", 0) > 0 or pr.get("small")): problems.append(f"{tag} {view}: {pr}")
        if got["errors"]: problems.append(f"{tag}: page errors")
    for view, pr in s["screens"].items():
        if isinstance(pr, dict) and (pr.get("overflow", 0) > 0 or pr.get("small")): problems.append(f"screen {view}: {pr}")
    print(json.dumps(report, indent=1))
    print("\n".join(problems) if problems else "ALL IPAD CHECKS PASSED")
    sys.exit(1 if problems else 0)

asyncio.run(main())
