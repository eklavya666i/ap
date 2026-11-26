"""Renders the English 10H icons (violet tile, "10H" in Archivo, an open-book rule) into ../ (the english10 folder).
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
html,body{{margin:0;background:#5b21b6}}
.i{{width:{size}px;height:{size}px;background:#5b21b6;display:flex;flex-direction:column;align-items:center;justify-content:center}}
.t{{font:800 {s*0.40:.2f}px/0.9 Archivo;font-stretch:78%;letter-spacing:-0.02em;color:#ffffff}}
.o{{font:700 {s*0.095:.2f}px/1 Archivo;color:#ffffff;margin-top:{s*0.06:.2f}px;letter-spacing:0.16em}}
.r{{width:{s*0.44:.2f}px;height:{max(2, s*0.018):.2f}px;background:#e9ddff;margin-top:{s*0.05:.2f}px;border-radius:{s*0.01:.2f}px}}
</style></head><body><div class="i"><div class="t">10H</div><div class="r"></div><div class="o">ENGLISH</div></div></body></html>"""

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
