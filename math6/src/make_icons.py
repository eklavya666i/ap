"""Renders the Math 6 icons (blue tile, a big "6" in Archivo, the four operation signs) into ../ (the math6 folder).
Run: python3 make_icons.py   (needs Playwright and Chrome; fonts from node_modules/@fontsource-variable)."""
import asyncio, base64, re
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
ROOT = HERE.parent
FONTS = next(p for p in [HERE / "node_modules/@fontsource-variable", Path("/home/claude/fontpkg/node_modules/@fontsource-variable")] if p.exists())

css = (FONTS / "archivo/wdth.css").read_text()
face = re.search(r"/\* archivo-latin-wdth-normal \*/\s*(@font-face\s*{[^}]*})", css).group(1)
face = re.sub(r"url\(\./files/([\w.-]+)\) format\('woff2-variations'\)",
              lambda m: "url(data:font/woff2;base64," + base64.b64encode((FONTS / "archivo/files" / m.group(1)).read_bytes()).decode() + ") format('woff2')",
              face).replace("font-family: 'Archivo Variable'", "font-family: 'Archivo'")

def page(size, k):
    s = size * k
    return f"""<!DOCTYPE html><html><head><style>{face}
html,body{{margin:0;background:#1d4ed8}}
.i{{width:{size}px;height:{size}px;background:#1d4ed8;display:flex;flex-direction:column;align-items:center;justify-content:center}}
.t{{font:800 {s*0.56:.2f}px/0.86 Archivo;font-stretch:76%;letter-spacing:-0.015em;color:#ffffff;margin-top:{s*0.02:.2f}px}}
.o{{font:700 {s*0.12:.2f}px/1 Archivo;color:#ffffff;margin-top:{s*0.07:.2f}px;letter-spacing:0.06em}}
.b i{{display:block;width:{s*0.105:.2f}px;height:{s*0.105:.2f}px;border-radius:50%;border:{max(1.5, s*0.019):.2f}px solid #ffffff;box-sizing:border-box}}
.b i.f{{background:#ffffff}}
</style></head><body><div class="i"><div class="t">6</div><div class="o">+ &minus; &times; &divide;</div></div></body></html>"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for name, size, k in [("icon-512.png", 512, 1), ("icon-192.png", 192, 1), ("icon-180.png", 180, 1), ("icon-maskable-512.png", 512, 0.74)]:
            pg = await b.new_page(viewport={"width": size, "height": size})
            await pg.set_content(page(size, k))
            await pg.evaluate("document.fonts.ready")
            assert await pg.evaluate("document.fonts.check('800 40px Archivo')"), "Archivo did not load"
            await pg.locator(".i").screenshot(path=str(ROOT / name), omit_background=False)
            await pg.close()
            print("wrote", name)
        await b.close()

asyncio.run(main())
