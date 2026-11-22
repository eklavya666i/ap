# Math 6: source

Built on SAT Daily's source (`sat/src/`). The full spec is the Claude doc "Grade 6 Math iPad App — Build Spec".

## What's here

- `app.html`: the shell and all the styles. The build drops the scripts below into it, in this order.
- `lib.js`: the engine core: seeded numbers, exact fractions, answer checking with named mistakes, and `speak()`, which turns math into words for the voice.
- `curriculum.js`: the 75 lessons in 10 units.
- `drills.js`: the 17 speed-test drills and their medal levels.
- `units/u01.js` … `u10.js`: each unit's lesson scripts, "another way" explanations, notes, misconceptions and question templates. Each file registers only itself.
- `js/NN-name.js`: the app, run in number order:
  - `00-core.js` state, dates, streaks, XP and levels, coins, quests, badges, mastery and reviews
  - `10-voice.js` the voice player (sentence queue, pause, rate, watchdog)
  - `20-board.js` the board models: words, equations, ratio tables, double number lines, tape diagrams, 100-grids, graphs
  - `30-question.js` the 10 question types, the keypad, grading, hints and solutions
  - `40-teach.js` the lesson player (Learn)
  - `50-modes.js` practice, quizzes, 5-minute tests, unit tests, the word-problem workshop, Beat the Clock, the boss
  - `60-speed.js` Speed Round, Beat the Clock and Lightning Ladder
  - `70-views.js` the screens
  - `90-boot.js` routing, taps and keys, backup and restore, the offline worker
- `build.js`: writes `../index.html`, `../sw.js` and `../manifest.webmanifest`, plus `Math-6.html` (a single offline file) and `math-6.html` (a Claude artifact preview).

## Checks

```
npm install
node test.js          # engine, speech, every lesson and template (120 seeds each), drills
node build.js         # rebuild; the offline cache version changes automatically
python3 check_ipad.py # iPad checks in headless Chrome: a whole lesson with the voice, practice to mastery,
                      # quiz, 5-minute tests, all 3 speed formats, the boss, mistakes, offline, backup,
                      # other apps, 5 iPad sizes (needs Playwright and Chrome)
python3 check_voice.py # the voice against Safari's speech rules: silent until a tap, silent voices, blocked speech,
                      # Premium voice first, no novelty voices
python3 make_icons.py # redraw the icons
```

`test.js` holds every lesson to the spec's gate: all seven parts, 550 to 950 spoken words, two "We do" checks,
another way to explain it, three named misconceptions, and at least four templates covering Warm-up, Standard and
Stretch, with a word problem. Every template answer is checked a second way by its own `verify()`, and every
string the voice reads must come out as words (no symbols left over).

## Adding a unit

Write `units/uNN.js` in the same shape as `u01.js`. A new board model or question type goes in its own new file,
for example `js/25-models-fractions.js`, registered into `MODELS` or `QTYPES`, so no two branches edit the same file.

## Branches

- `feature/math6` is the Math 6 branch; it merges into `main` when a phase is done. Math 6 is on `main` unlisted
  at `/ap/math6/`; the README link comes with Phase 5.
- Three lane branches start from `feature/math6`: `feature/math6-units-2-4`, `feature/math6-units-5-7` and
  `feature/math6-units-8-10`. Each adds only its own unit and model files, and merges back after `node test.js`
  and `python3 check_ipad.py` pass.
- The root `sw.js` leaves `/math6/` alone, so Math 6 and World History can't take over each other's pages.
