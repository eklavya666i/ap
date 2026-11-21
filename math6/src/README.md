# Math 6: source

Built on SAT Daily's source (`sat/src/`). The full spec is the Claude doc "Grade 6 Math iPad App — Build Spec".

- `app.html`: the app shell: screens, voice player, backup and restore, safe offline updates.
- `lib.js`: the engine core: seeded numbers, exact fractions, answer checking, and `speak()`, which turns math into words for the voice.
- `curriculum.js`: the 75 lessons in 10 units.
- `units/u01.js` … `u10.js`: each unit's lesson scripts, templates and models. Each file registers only itself, so branches building different units never edit the same file.
- `build.js`: writes `../index.html`, `../sw.js` and `../manifest.webmanifest`, plus `Math-6.html` (a single offline file) and `math-6.html` (a Claude artifact preview).
- `make_icons.py`: draws the icons in `..`.

Run these here:

```
npm install
node test.js          # engine, speech, curriculum and unit-file checks
node build.js         # rebuild; the offline cache version changes automatically
python3 make_icons.py # redraw the icons (needs Playwright and Chrome)
python3 check_ipad.py # headless iPad checks (needs Playwright and Chrome)
```

## Branches

- `feature/math6` is the Math 6 branch. GitHub Pages serves only `main`, so nothing here is live until it merges.
- After Phase 1, three lane branches start from `feature/math6`: `feature/math6-units-2-4`, `feature/math6-units-5-7` and `feature/math6-units-8-10`. Each adds only its own unit and model files, and merges back after `node test.js` and `python3 check_ipad.py` pass.
- The root `sw.js` already leaves `/math6/` alone, so Math 6 and World History can't take over each other's pages.
