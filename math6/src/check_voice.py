"""Voice checks for Math 6 against a stand-in for Safari's speech engine on iPad.
The stand-in follows Safari's rules:
  - speech is locked until something is spoken during a tap; while locked, speak() is ignored without any event
  - utterances play one after another and fire start and end
  - optional: a voice that never starts (some voices in the list are silent), or a fully blocked engine
It can't play sound or prove a real iPad works; it checks that the app's voice logic survives Safari's rules.
Run: python3 check_voice.py   (needs Playwright and Chrome; uses ../index.html)"""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

PAGE = (Path(__file__).parent.parent / "index.html").resolve().as_uri()
SAFARI_SPEECH = """
(() => {
  const rules = Object.assign({}, window.__rules || {}, JSON.parse(sessionStorage.getItem('rules') || '{}'));
  // A mix like a real iPad's: standard, Premium and Enhanced voices, a novelty voice and an "Eloquence" voice
  const VOICES = [
    {name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.voice.compact.en-US.Samantha', localService: true, default: true},
    {name: 'Albert', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.Albert', localService: true, default: false},
    {name: 'Eddy (English (US))', lang: 'en-US', voiceURI: 'com.apple.eloquence.en-US.Eddy', localService: true, default: false},
    {name: 'Zoe (Enhanced)', lang: 'en-US', voiceURI: 'com.apple.voice.enhanced.en-US.Zoe', localService: true, default: false},
    {name: 'Ava (Premium)', lang: 'en-US', voiceURI: 'com.apple.voice.premium.en-US.Ava', localService: true, default: false},
    {name: 'Daniel', lang: 'en-GB', voiceURI: 'com.apple.voice.compact.en-GB.Daniel', localService: true, default: false}]
    .filter(v => !(rules.drop && new RegExp(rules.drop).test(v.name)));
  let unlocked = false, queue = [], cur = null, inTap = false;
  window.__said = []; window.__ignored = []; window.__voices = [];
  // A tap counts only while it is being handled, as in Safari; anything later (timers, hash changes) is not a tap.
  for (const t of ['touchend', 'click', 'keydown']) window.addEventListener(t, () => { inTap = true; setTimeout(() => { inTap = false; }, 0); }, true);
  function next() {
    if (cur || !queue.length) return;
    const u = cur = queue.shift();
    const silent = rules.block || (rules.silentVoice && u.voice && new RegExp(rules.silentVoice).test(u.voice.name));
    if (silent) { setTimeout(() => { if (cur === u) { cur = null; next(); } }, 5); return; }   // accepted, never heard, no events
    setTimeout(() => {
      if (cur !== u) return;
      u.onstart && u.onstart({});
      if (u.text) { window.__said.push(u.text); window.__voices.push(u.voice ? u.voice.name : 'default'); }
      setTimeout(() => { if (cur !== u) return; cur = null; u.onend && u.onend({}); next(); }, Math.max(15, u.text.length));
    }, 10);
  }
  const synth = {
    get speaking() { return !!cur && !rules.block; }, get pending() { return queue.length > 0; }, paused: false,
    getVoices: () => VOICES, addEventListener() {}, removeEventListener() {}, pause() {}, resume() {},
    speak(u) {
      if (!unlocked) { if (inTap) unlocked = true; else { window.__ignored.push(u.text); return; } }
      queue.push(u); next();
    },
    cancel() { queue = []; if (cur) { const c = cur; cur = null; c.onerror && c.onerror({error: 'interrupted'}); } }
  };
  Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true, writable: true});
  window.SpeechSynthesisUtterance = function (t) { this.text = String(t); this.voice = null; this.lang = ''; this.rate = 1; this.volume = 1; };
})();
"""

async def scenario(b, name, rules, steps):
    ctx = await b.new_context(viewport={"width": 820, "height": 1180}, has_touch=True, is_mobile=True)
    await ctx.add_init_script(f"sessionStorage.setItem('rules', {json.dumps(json.dumps(rules))});")
    await ctx.add_init_script(SAFARI_SPEECH)
    page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
    await page.goto(PAGE + "#/unit/1"); await page.wait_for_selector(".lessons")
    out = await steps(page)
    out["errors"] = errs
    await ctx.close()
    return name, out

async def tap_lesson_and_wait(page, ms=1500):
    await page.locator(".lessons a", has_text="What a ratio means").first.tap()
    await page.wait_for_selector('[data-act="t-play"]')
    await page.wait_for_timeout(ms)

async def said(page): return await page.evaluate("({said: window.__said.length, ignored: window.__ignored.filter(t => t).length, step: M6APP.T && M6APP.T.i, voices: [...new Set(window.__voices)]})")

async def main():
    results = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])

        async def open_only(page):            # open a lesson and listen, without touching Play
            await tap_lesson_and_wait(page, 2500); return await said(page)
        async def play_tap(page):             # open, then tap Play if it isn't already talking
            await tap_lesson_and_wait(page, 300)
            if not await page.evaluate("M6APP.T.playing"): await page.locator('[data-act="t-play"]').tap()
            await page.wait_for_timeout(5500); return await said(page)   # long enough for a silent voice to be replaced
        async def next_only(page):            # step through with Next while it talks, then pause: Next stays quiet
            await tap_lesson_and_wait(page, 300)
            before = (await said(page))["said"]
            for _ in range(2): await page.locator('[data-act="t-next"]').tap(); await page.wait_for_timeout(900)
            r = await said(page); r["said_after_next"] = r["said"] - before
            await page.locator('[data-act="t-play"]').tap()   # pause on purpose
            paused_at = (await said(page))["said"]
            await page.locator('[data-act="t-next"]').tap(); await page.wait_for_timeout(900)
            r["quiet_after_pause"] = (await said(page))["said"] == paused_at
            return r
        async def pause_resume(page):
            await tap_lesson_and_wait(page, 300)
            if not await page.evaluate("M6APP.T.playing"): await page.locator('[data-act="t-play"]').tap()
            await page.wait_for_timeout(400); await page.locator('[data-act="t-play"]').tap()   # pause
            await page.wait_for_timeout(600); a = (await said(page))["said"]
            await page.wait_for_timeout(600); b2 = (await said(page))["said"]
            await page.locator('[data-act="t-play"]').tap(); await page.wait_for_timeout(1200)   # resume
            c = await said(page); return {"quiet_while_paused": a == b2, "resumed": c["said"] > b2, **c}
        async def blocked(page):
            await tap_lesson_and_wait(page, 300)
            if not await page.evaluate("M6APP.T.playing"): await page.locator('[data-act="t-play"]').tap()
            await page.wait_for_timeout(6000)
            r = await said(page)
            r["warning_shown"] = await page.locator(".vfail").count() > 0
            r["still_playing"] = await page.evaluate("M6APP.T.playing")
            return r
        async def premium_missing(page):
            r = await play_tap(page)
            r["note_in_lesson"] = await page.locator(".vnote").count() > 0
            await page.goto(PAGE + "#/voice"); await page.wait_for_selector("#vstat")
            r["guide_on_voice_check"] = await page.locator(".premhelp").count() > 0
            return r
        async def voice_check(page):
            await page.goto(PAGE + "#/voice"); await page.wait_for_selector("#view h2")
            has_test = await page.locator("#vtest").count() > 0
            if has_test:
                await page.locator("#vtest").tap(); await page.wait_for_timeout(1500)
            options = await page.locator("#vsel option").all_inner_texts()
            return {"test_button": has_test, "status": (await page.locator("#vstat").inner_text()) if await page.locator("#vstat").count() else None,
                    "options": options, "premium_guide": await page.locator(".premhelp").count() > 0, **(await said(page))}

        for name, rules, fn in [
            ("open a lesson, don't touch Play", {}, open_only),
            ("tap Play", {}, play_tap),
            ("Next keeps talking; after Pause it stays quiet", {}, next_only),
            ("pause, then resume", {}, pause_resume),
            ("uses the Premium voice by itself", {}, play_tap),
            ("the Premium voice is silent in Safari: next best is Enhanced", {"silentVoice": "Premium"}, play_tap),
            ("no Premium voice installed: Enhanced, plus how to get Premium", {"drop": "Premium"}, premium_missing),
            ("the student picked a voice that's silent", {"silentVoice": "Daniel", "pick": "Daniel"}, play_tap),
            ("speech blocked (iPad muted or engine off)", {"block": True}, blocked),
            ("Voice check screen", {}, voice_check),
        ]:
            if rules.get("pick"):
                async def picked(page, fn=fn):
                    await page.evaluate("(() => { const S = JSON.parse(localStorage.getItem('math6.v1')); S.set.voice.uri = 'com.apple.voice.compact.en-GB.Daniel'; localStorage.setItem('math6.v1', JSON.stringify(S)); })()")
                    await page.reload(); await page.wait_for_selector(".lessons")
                    return await fn(page)
                k, v = await scenario(b, name, rules, picked)
            else:
                k, v = await scenario(b, name, rules, fn)
            results[k] = v
        await b.close()
    print(json.dumps(results, indent=1))
    return results

if __name__ == "__main__":
    r = asyncio.run(main())
    want = {
        "open a lesson, don't touch Play": lambda v: v["said"] >= 3,
        "tap Play": lambda v: v["said"] >= 3,
        "Next keeps talking; after Pause it stays quiet": lambda v: v["said_after_next"] >= 2 and v["quiet_after_pause"],
        "pause, then resume": lambda v: v["quiet_while_paused"] and v["resumed"],
        "uses the Premium voice by itself": lambda v: v["said"] >= 3 and v["voices"] == ["Ava (Premium)"],
        "the Premium voice is silent in Safari: next best is Enhanced": lambda v: v["said"] >= 3 and v["voices"] == ["Zoe (Enhanced)"],
        "no Premium voice installed: Enhanced, plus how to get Premium": lambda v: v["voices"] == ["Zoe (Enhanced)"] and v["note_in_lesson"] and v["guide_on_voice_check"],
        "the student picked a voice that's silent": lambda v: v["said"] >= 3 and v["voices"] == ["Ava (Premium)"],
        "speech blocked (iPad muted or engine off)": lambda v: v["warning_shown"] and not v["still_playing"] and v["step"] == 0,
        "Voice check screen": lambda v: v["test_button"] and v["said"] >= 1 and "working" in (v["status"] or "") and "Premium" in v["status"]
            and v["options"][0].startswith("Ava") and not any(o.startswith(("Albert", "Eddy")) for o in v["options"]) and not v["premium_guide"],
    }
    bad = [k for k, f in want.items() if not f(r[k]) or r[k]["errors"]]
    print("\n".join("FAIL " + k for k in bad) if bad else "ALL VOICE CHECKS PASSED")
    sys.exit(1 if bad else 0)
