"""Headless checks: offline file with every network request blocked, full 16-question set,
backup -> wipe -> restore, layout at Windows-laptop and phone widths; web file sanity run."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE / "shots"; OUT.mkdir(exist_ok=True)

async def answer_set(page, n_expected):
    n = 0
    while await page.locator("#go").count():
        if await page.locator("#spr").count():
            await page.fill("#spr", "7")
        else:
            await page.click(".ch[data-i='2']")
        await page.click("#go")
        await page.wait_for_selector("#fb")
        n += 1
        if n == 1:
            await page.wait_for_timeout(300)
            await page.screenshot(path=str(OUT / f"{page.tag}-feedback.png"), full_page=True)
        await page.click("#nx")
    await page.wait_for_selector(".res")
    assert n == n_expected, (n, n_expected)
    return n

async def run(p, file, width, height, tag, offline):
    browser = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = await browser.new_context(viewport={"width": width, "height": height}, accept_downloads=True)
    page = await ctx.new_page(); page.tag = tag
    errors, net = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
    async def guard(route):
        if not route.request.url.startswith("file:"):
            net.append(route.request.url); await route.abort()
        else:
            await route.continue_()
    await page.route("**/*", guard)
    await page.goto((HERE / file).resolve().as_uri())
    await page.wait_for_selector(".qh")
    r = {"tag": tag}
    r["fonts"] = await page.evaluate("document.fonts.ready.then(() => [document.fonts.check('700 16px Archivo'), document.fonts.check('16px \"Source Serif 4\"')])")
    r["dots"] = await page.locator(".dots li").count()
    await page.screenshot(path=str(OUT / f"{tag}-question.png"), full_page=False)
    r["answered"] = await answer_set(page, 16)
    r["overflow"] = await page.evaluate("document.documentElement.scrollWidth - innerWidth")
    await page.screenshot(path=str(OUT / f"{tag}-results.png"), full_page=True)
    r["band"] = await page.inner_text("#tod")
    first = await page.evaluate("JSON.parse(localStorage.getItem('satDaily8.v1')).last.items.map(x => x.id || x.g)")
    r["set_items"] = first
    if offline:
        async with page.expect_download() as dl:
            await page.click("#bkup")
        d = await dl.value
        bpath = HERE / "shots" / d.suggested_filename
        await d.save_as(str(bpath))
        r["backup_file"] = d.suggested_filename
        await page.evaluate("localStorage.clear()")
        await page.reload(); await page.wait_for_selector(".qh")
        r["after_wipe_streak"] = await page.inner_text("#stk")
        await page.set_input_files("#rst", str(bpath))
        await page.wait_for_selector(".res")
        r["after_restore_streak"] = await page.inner_text("#stk")
        r["after_restore_msg"] = await page.inner_text("#bkm")
    await page.click("#again"); await page.wait_for_selector(".qh")
    r["second_set_items"] = await page.evaluate("JSON.parse(JSON.stringify(window.__x||null))")
    r["net_attempts"] = net
    r["errors"] = errors
    await browser.close()
    return r

async def main():
    async with async_playwright() as p:
        out = [await run(p, "SAT-Daily.html", 1366, 768, "win-laptop", True),
               await run(p, "SAT-Daily.html", 390, 844, "offline-phone", True),
               await run(p, "sat-daily.html", 720, 900, "web-pane", False)]
        print(json.dumps(out, indent=1))

asyncio.run(main())
