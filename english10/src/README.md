# English 10H: source

Honors Lit Analysis & Composition 2 (EN210A/B), Issaquah High School. Built on Math 6's source (`math6/src/`), which came from SAT Daily.
The plan and status live in the Ira AP project doc `claude/english10h-app.md`.

## What's here

- `app.html`: the shell and all the styles. The build drops the scripts below into it, in this order.
- `content/`: everything Ira reads.
  - `course.js` the 7 units, in the order of the 2024–25 IHS syllabus (reorder here when this year's Canvas syllabus is in hand)
  - `lotf.js` Lord of the Flies (Unit 4): context, 12 chapter guides, characters, symbols, themes, 96 reading checks. Original study text only: the novel is under copyright, so the guide quotes none of it; Ira logs her own quotations with page numbers.
  - `asp.js` A Small Place (Unit 2): context, 4 section guides with a rhetorical move each, voices, motifs, themes, 32 questions. Same no-quotation rule.
  - `argument.js` the argument workshop (Unit 3): 8 lessons, 14 fallacies, 3 public-domain speeches and 2 labeled practice sources, debate motions and format, 55 questions
  - `lenses.js` 9 critical lenses applied to the novel, 27 lens questions, the Hobbes or Rousseau idea
  - `terms.js` 94 glossary terms with examples (terms quizzes and review cards are built from it)
  - `writing.js` 6 essay guides with rubrics and public-domain model paragraphs, 28 drills, 14 timed-write prompts
  - `coach.js` advice cards, seminar help, teacher email templates, content notes (with the 988 line), the AI-honesty line
- `lib/checker.js`: the offline draft checker (thesis, evidence, citations, commentary, organization, style, MLA, plus argument, lens, synthesis and narrative rules). It marks spots; it never rewrites.
- `js/NN-name.js`: the app, run in number order:
  - `00-core.js` state, dates, streak, XP and levels, daily goals, badges, review cards
  - `10-quiz.js` reading checks, mixed review, lens, terms, who-and-what, the timed unit test, My misses
  - `20-learn.js` Learn: units, book guides with spoiler gating (chapters or sections, people, symbols, themes, lenses or rhetoric, context), the argument workshop, glossary
  - `30-write.js` Write: assignments with day plans, the prompt decoder, thesis and outline builders, essay guides, Quote Log, seminar prep, drills, SOAPSTone, debate prep
  - `40-check.js` Check: the checker with highlights, rubric self-scoring, the Claude feedback hand-off and its AI-use log
  - `50-test.js` Test hub and timed writes
  - `60-coach.js` Coach: ranked next steps with reasons, insights, advice, email templates
  - `70-today.js` Today and the review-card player
  - `80-me.js` progress, badges, settings, backup and restore, the parent summary behind a PIN
  - `90-boot.js` routing, taps and keys, the offline worker
- `build.js`: writes `../index.html`, `../sw.js` and `../manifest.webmanifest`, plus `English-10H.html` (a single offline file) and `english-10h.html` (a Claude artifact preview).

## Checks

```
npm install
node test.js           # every chapter guide, question, lens, term, essay guide and drill; the checker on good and weak writing
node build.js          # rebuild; the offline cache version changes automatically
python3 check_ipad.py  # iPad checks in headless Chrome: every screen, setup, spoilers, quizzes, a whole assignment from plan to
                       # Claude hand-off, drills, cards, seminar, a timed write, offline, backup and restore, World History first,
                       # five iPad sizes and Split View (needs Playwright and Chrome; the test server starts and stops with it)
python3 make_icons.py  # redraw the icons
```

`test.js` also guards against answer-length tells: the right answer is the longest choice in about a fifth of the questions in every unit, close to chance.
Every model paragraph in the essay guides must pass the draft checker with no fixes, so the checker never flags strong writing.

## Adding a unit

Add `content/<book>.js` in the shape of `lotf.js` or `asp.js` (set `word` for section names), register it in `build.js`'s CONTENT list and in `BOOKS` in `js/00-core.js`, and point the unit at it in `course.js` with `book` and `ready: true`.
Phases 1 and 2 are done (Units 2, 3 and 4). Phase 3 is Units 1, 5 and 6 (The Astonishing Color of After, Night, book clubs), phase 4 Macbeth.

## Branches

`feature/english10` is the English 10H branch; it merges into `main` when a phase is done. The root `sw.js` leaves `/english10/` alone,
so English 10H and World History can't take over each other's pages.
