// Coach: advice cards, Socratic seminar help, email templates to teachers, content notes and the AI-honesty rules.
const ADVICE = [
  {id: "read", tag: "Reading", title: "Read a chapter actively", body: [
    "Before: read the chapter guide's Watch for list (spoiler-free) so you know what to notice.",
    "During: keep page flags or sticky notes in three colors: character moments, symbols, and questions. Write one or two words on each flag.",
    "After: write a two-sentence summary from memory, then log your best quotation in the Quote Log with the page number.",
    "Then take the reading check. Missed questions come back in My misses."]},
  {id: "quiz", tag: "Reading", title: "Get ready for a reading check", body: [
    "Reading checks test who did what, and what changed. Review the chapter's key events and the symbol tracker.",
    "Say the chapter out loud in five sentences. If you can't, reread the guide's summary and skim the pages you flagged.",
    "Take the app's reading check twice: once right after reading, once the next day."]},
  {id: "seminar", tag: "Discussion", title: "Socratic seminar", body: [
    "Prepare three questions: one about the text (what happens), one about meaning (why), one about the world (so what).",
    "Bring three quotations with page numbers, each with one sentence on why it matters.",
    "In the circle: speak two or three times, cite the text every time, and invite a quiet classmate in. Building on someone else's point counts as much as a new one.",
    "Use the starters in Seminar prep if you freeze."]},
  {id: "timed", tag: "Writing", title: "Timed writes", body: [
    "Five minutes to plan: thesis, two body claims, and the evidence for each.",
    "Write the thesis first. A short introduction is fine.",
    "Two developed body paragraphs beat three thin ones. Commentary is where the points are.",
    "Save three minutes to reread your thesis and topic sentences.",
    "Practice in Test, then score yourself with the rubric in Check."]},
  {id: "commentary", tag: "Writing", title: "Commentary that earns points", body: [
    "After each quotation, ask 'so what?' twice. The first answer explains the quotation; the second connects it to your thesis.",
    "Name the specific word or detail doing the work, and say what effect it creates.",
    "Aim for at least two sentences of commentary for every sentence of evidence.",
    "Avoid 'This quote shows...' Start with the idea instead: 'By hiding behind paint, Jack...'"]},
  {id: "revise", tag: "Writing", title: "Revise with feedback", body: [
    "Read every comment and sort them: thesis and ideas first, then evidence and commentary, then sentences and conventions.",
    "Fix the biggest problem first. A sharper thesis changes the whole essay.",
    "Run the revised draft through Check and score it with the rubric again to see what moved."]},
  {id: "rework", tag: "Grades", title: "Late work and reworking", body: [
    "Rules vary by teacher, so check this year's syllabus on Canvas.",
    "In the 2024–25 IHS syllabus for this course, products (essays) could be turned in late for up to 80%, and a product turned in on time that scored below 80% could be reworked after a conference with the teacher for up to 80%. Prep work could not be turned in late.",
    "If a rework option exists, ask early and come with a revision plan."]},
  {id: "grades", tag: "Grades", title: "Where the grade comes from", body: [
    "The 2024–25 syllabus weighted grades as Product 60%, Process 30% and Prep 10%. Confirm this year's weights on Canvas.",
    "Products, meaning essays and major projects, are most of the grade, so drafting time pays off most.",
    "Process work (quote analysis, drafts, discussions) builds the product; don't skip it."]},
  {id: "workload", tag: "Habits", title: "The honors workload", body: [
    "The course syllabus estimates two to three hours a week outside class, mostly reading.",
    "Split each reading assignment into daily chunks. Set the due date in Write and the app plans the days for you.",
    "Do the hard thinking (thesis, commentary) when you're fresh; save formatting and citations for tired time."]},
  {id: "teacher", tag: "Habits", title: "Talking to your teacher", body: [
    "Ask questions early, before the due date, not the night before.",
    "Be specific: say which part of the prompt or comment confuses you and what you've tried.",
    "Use the email templates below, then edit them so they sound like you."]},
  {id: "ai", tag: "Honesty", title: "Using AI honestly", body: [
    "The syllabus says work must be your own, and generative AI must be quoted and cited like any source. Copying, even partly, counts as plagiarism, and violations earn a zero with no recovery.",
    "This app coaches but never writes your essay. Claude feedback is for feedback only: never paste AI-written sentences into your work.",
    "The app keeps an AI-use log. If you used Claude feedback on an assignment, follow your teacher's rules for disclosing it.",
    "Don't share timed-write prompts with anyone; the syllabus forbids it."]},
  {id: "heavy", tag: "Wellbeing", title: "When a book is heavy", body: [
    "Some books in this course deal with suicide, depression, the Holocaust and violence. It is normal for them to stir up strong feelings.",
    "Talk to someone: a parent, your teacher or your school counselor.",
    "If you or someone you know is struggling, call or text 988 to reach the Suicide & Crisis Lifeline, any time."]}
];
const CONTENT_NOTES = {
  1: "The Astonishing Color of After centers on a mother's suicide and her daughter's grief and depression. If it brings up something heavy, talk to a parent, a teacher or your school counselor. You can call or text 988 at any time to reach the Suicide & Crisis Lifeline.",
  5: "Night is Elie Wiesel's memoir of the Holocaust and includes scenes of extreme violence and loss. Take breaks when you need them, and talk to someone you trust about what you're reading."
};
const SEMINAR = {
  levels: [["Level 1: the text", "What happens? Questions with answers on the page.", "Why do the boys choose Ralph as chief?"],
           ["Level 2: meaning", "Why does it matter? Questions with more than one good answer.", "What does the conch give the boys that they could not create without it?"],
           ["Level 3: the world", "So what? Connect the text to people, history or your own life.", "When do rules stop protecting people?"]],
  starters: {
    "Build": ["I'd like to add to what ___ said about...", "That connects to page ___, where...", "Building on that idea..."],
    "Agree": ["I agree with ___ because on page ___...", "That's convincing, especially the part about..."],
    "Challenge": ["I see it differently. On page ___...", "What about the moment when...?", "I'm not sure that holds up, because..."],
    "Ask": ["What makes you say that?", "Can you show us where that is in the text?", "___, what do you think?"],
    "Clarify": ["So are you saying that...?", "Could you explain what you mean by...?"]}
};
const EMAILS = [
  {id: "clarify", title: "Clarify a prompt", subject: "Question about the [assignment] prompt", body: "Hi [teacher name],\n\nI'm working on [assignment] and want to make sure I understand the prompt. When it asks me to [quote the part], does that mean [your understanding], or something else?\n\nSo far I have [what you've done]. Thank you!\n\n[Your name], Period [#]"},
  {id: "conference", title: "Ask for a conference", subject: "Could we meet about my [assignment]?", body: "Hi [teacher name],\n\nI'd like to talk with you about my [assignment]. I want to understand [the feedback or skill] so I can improve, and I'd like to ask whether a rework is possible.\n\nI'm free [days and times, such as before school, lunch or after school]. Would any of those work?\n\nThank you,\n[Your name], Period [#]"},
  {id: "extension", title: "Ask about an extension", subject: "[Assignment]: request for more time", body: "Hi [teacher name],\n\nI was [sick / away for (reason)] on [dates] and missed [what you missed]. I've finished [what is done]. Would it be possible to turn in [assignment] by [proposed date]?\n\nThank you for considering it,\n[Your name], Period [#]"},
  {id: "feedback", title: "Ask for feedback", subject: "Feedback on my [assignment] draft", body: "Hi [teacher name],\n\nI've drafted [assignment] and would appreciate quick feedback on [one specific thing: my thesis, my commentary in paragraph 2...]. My draft is [shared / attached].\n\nThank you!\n[Your name], Period [#]"},
  {id: "missed", title: "Catch up after an absence", subject: "Catching up after [date]", body: "Hi [teacher name],\n\nI was absent on [date]. I checked Canvas and see [what you found]. Is there anything else I missed, such as notes, a discussion or a quiz I should make up?\n\nThank you,\n[Your name], Period [#]"}
];
const INTEGRITY = "The app coaches; every word stays yours. Claude feedback is feedback only. Log it, and follow your teacher's rules on AI.";
if (typeof module !== "undefined") module.exports = {ADVICE, CONTENT_NOTES, SEMINAR, EMAILS, INTEGRITY};
