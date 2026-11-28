# English 10H: source

Honors Lit Analysis & Composition 2 (EN210A/B), Issaquah High School. Built on Math 6's source (`math6/src/`), which came from SAT Daily.
The plan and status live in the Ira AP project doc `claude/english10h-app.md`.

## What's here

- `app.html`: the shell and all the styles. The build drops the scripts below into it, in this order.
- `content/`: everything Ira reads.
  - `course.js` the 10 units of Ira's 2026–27 syllabus (five a semester) and its 11 course goals
  - `f451.js` Fahrenheit 451 (Unit 3): context, 7 section guides across the three parts, each with a craft focus, plus characters, symbols, themes, quote tags and 56 reading checks. Original study text only: the novel is under copyright, so the guide quotes none of it; Ira logs her own quotations with page numbers.
  - `asp.js` A Small Place (Unit 4): context, 4 section guides with a rhetorical move each, voices, motifs, themes, 32 questions. Same no-quotation rule.
  - `argument.js` the argument workshop (Unit 5): 8 lessons, 14 fallacies, 3 public-domain speeches and 2 labeled practice sources, debate motions and format, 55 questions
  - `terms.js` 112 glossary terms with examples (terms quizzes and review cards are built from it). The 34 marked `sheet` are Ira's class rhetoric study sheet, with her teacher's definitions and examples.
  - `rhetoric.js` Unit 4's Intro to Rhetoric: the study sheet's order, the class notes, the class SOAPSTone of A Small Place, the paragraph plan and annotation steps, quiz banks (47 device sentences, appeals, evidence, faulty reasoning, 41 questions), 15 annotation cards for Part 1, pages 1-9 (described, never quoted), 5 public-domain practice speeches, sentence-building tasks, debate cards and a model paragraph plan on Kennedy's inaugural
  - `writing.js` 5 essay guides with rubrics and public-domain model paragraphs, 28 drills, 20 timed-write prompts (6 are one-paragraph rhetorical analysis writes)
  - `coach.js` advice cards, seminar help, teacher email templates, content notes (with the 988 line), the AI-honesty line
- `lib/checker.js`: the offline draft checker (thesis, evidence, citations, commentary, organization, style, MLA, plus argument, rhetorical, synthesis and narrative rules). It marks spots; it never rewrites.
- `lib/rhetcheck.js`: the rhetoric checks: does a sentence use a device (or ask Ira to check it herself), is an analysis sentence complete, does a debate move have a fair counterargument and a reasoned rebuttal with no fallacy, the paragraph plan's boxes, and an estimated score out of 24 for one rhetorical analysis paragraph (claim, evidence, reasoning, vocabulary, organization, conventions).
- `js/NN-name.js`: the app, run in number order:
  - `00-core.js` state (and the move from the old unit numbers), dates, streak, XP and levels, daily goals, badges, review cards
  - `10-quiz.js` reading checks, mixed review, terms, who-and-what, argument and fallacy quizzes, timed unit tests, My misses
  - `20-learn.js` Learn: units by semester, book guides with spoiler gating (sections, people, symbols, themes, craft or rhetoric, context), the argument workshop, glossary
  - `25-rhetoric.js` Unit 4's rhetoric toolkit: the study sheet, notes, annotations, sentence building, debate moves, passages, the paragraph plan and its score, quizzes, the practice and sample tests, scores
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
node test.js           # every section guide, question, term, essay guide and drill; the checker on good and weak writing
node build.js          # rebuild; the offline cache version changes automatically
python3 check_ipad.py  # iPad checks in headless Chrome: every screen, setup, spoilers, quizzes, a whole assignment from plan to
                       # Claude hand-off, drills, cards, seminar, a timed write, the rhetoric unit end to end (quizzes, tests,
                       # sentence building, annotations, the paragraph plan, a timed paragraph), offline, backup and restore, progress
                       # saved under older unit numbers, World History first, five iPad sizes and Split View (needs Playwright and Chrome;
                       # the test server starts and stops with it)
python3 make_icons.py  # redraw the icons
```

`test.js` also guards against answer-length tells: the right answer is the longest choice in about a fifth of the questions in every unit, close to chance.
Every model paragraph in the essay guides must pass the draft checker with no fixes, so the checker never flags strong writing.

## Adding a unit

Add `content/<book>.js` in the shape of `f451.js` or `asp.js` (its `word` object overrides labels such as Section or Voices), register it in `build.js`'s CONTENT list and in `BOOKS` in `js/00-core.js`, and point the unit at it in `course.js` with `book` and `ready: true`.
Built: Units 1, 3, 4 and 5. Still to build: Unit 2 (The Astonishing Color of After, for review), Semester 2 (Night and synthesis, book clubs and their presentation, the synthesis essay, Macbeth, poetry and the My Favorite Poem presentation).
Lord of the Flies and the critical-lens unit followed an older syllabus and were retired in November 2026; they're in git history before that change.

## Branches

`feature/english10` is the English 10H branch; it merges into `main` when a phase is done. The root `sw.js` leaves `/english10/` alone,
so English 10H and World History can't take over each other's pages.
