# SAT Daily: source

- `app.html`: the app shell (layout, daily set picker, feedback, record, backup).
- `rw_bank.js`, `rw_bank2.js`, `gen_*.js`: the 901 Reading and Writing questions. They are written by hand or generated from hand-written banks, and the generation is deterministic.
- `math_gen.js`: 19 math templates that make new numbers every day.
- `build.js`: writes `../index.html`, `../sw.js` and `../manifest.webmanifest` for the web app. It also writes `SAT-Daily.html` (a single offline file for a laptop) and `sat-daily.html` (the Claude artifact version).
- `make_icons.py`: draws the icons in `..`.

Run these here:

```
npm install
node test.js          # checks every question: answer keys, choices, explanations, balance
node sim.js           # how long new questions last at different accuracies
node build.js         # rebuild; the offline cache version changes automatically
python3 check_ipad.py # headless iPad checks (needs Playwright and Chrome)
```
