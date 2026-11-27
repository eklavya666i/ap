// The course: Honors Literary Analysis & Composition 2 (EN210A/B), Issaquah High School.
// Unit order and course goals follow Ira's 2026-27 syllabus (confirmed November 27, 2026): five units each semester,
// Socratic seminars throughout the year. book: a full reading guide in the app; workshop: the argument workshop;
// writing: a writing unit whose tools all live in Write. Units without one of these show their skills and the writing guide.
const COURSE = {
  name: "Honors Lit Analysis & Composition 2",
  code: "EN210A/B",
  school: "Issaquah High School",
  seminars: "Socratic seminars throughout the year",
  objectives: [
    "Write a variety of compositions in different modes (personal narrative, expository and argumentative) using the writing process",
    "Demonstrate knowledge of different writing structures",
    "Demonstrate ability to conduct thorough, credible and accurate research",
    "Define, identify and analyze literary devices and elements of fiction and non-fiction",
    "Define, identify and analyze rhetorical devices in texts, and apply persuasive strategies in writing",
    "Improve reading comprehension skills and analytical thinking skills",
    "Read, personally respond to and analyze selected works of fiction and non-fiction, including plays, novels, short stories, poems, feature articles and speeches",
    "Improve presentation skills",
    "Demonstrate an understanding of the structure and mechanics of Standard American English",
    "Participate effectively in class discussions",
    "Work cooperatively in groups"
  ],
  units: [
    {u: 1, sem: 1, title: "Personal Narrative", text: "Your own story", author: "", product: "Personal narrative", essay: "narrative", color: "#854d0e", writing: true, ready: true,
     skills: ["Choosing one true moment", "Building a scene with sensory detail and dialogue", "Pacing and a turning point", "Reflection that goes beyond a lesson learned", "The writing process: draft, feedback, revision"]},
    {u: 2, sem: 1, title: "Lit Analysis Review", text: "The Astonishing Color of After", author: "Emily X.R. Pan", product: "", essay: "lit", color: "#be185d",
     skills: ["Literary devices and elements of fiction", "Theme statements", "Color imagery and symbolism", "Nonlinear structure and flashback", "Magical realism", "Embedding and citing quotations"]},
    {u: 3, sem: 1, title: "Fahrenheit 451", text: "Fahrenheit 451", author: "Ray Bradbury", product: "", essay: "lit", color: "#c2410c", book: "f451", ready: true,
     skills: ["Symbol and motif tracking", "Foil and characterization", "Allusion", "Dystopian fiction", "Theme statements", "Commentary"]},
    {u: 4, sem: 1, title: "Rhetorical Analysis", text: "A Small Place", author: "Jamaica Kincaid", product: "Rhetorical analysis", essay: "rhetorical", color: "#0f766e", book: "asp", ready: true,
     skills: ["Rhetorical situation (SOAPSTone)", "Ethos, pathos, logos", "Second-person address", "Tone and irony", "Rhetorical verbs"]},
    {u: 5, sem: 1, title: "Rhetoric & Argument", text: "Speeches, articles and persuasive texts", author: "", product: "Argument essay", essay: "argument", color: "#1d4ed8", workshop: true, ready: true,
     skills: ["Claim, reasons, evidence", "Reasoning (warrants)", "Counterclaim and rebuttal", "Logical fallacies", "Credible sources and research", "Debate"]},
    {u: 6, sem: 2, title: "Night & Intro Synthesis", text: "Night", author: "Elie Wiesel", product: "Intro synthesis writing", essay: "synthesis", color: "#9f1239",
     skills: ["Memoir and testimony", "Putting sources in conversation", "Synthesis paragraphs", "Faith and silence"]},
    {u: 7, sem: 2, title: "Book Clubs", text: "Book club novels", author: "", product: "Culminating presentation", essay: "", color: "#047857",
     skills: ["Independent reading plans", "Discussion roles", "Working cooperatively in a group", "Presenting to an audience"]},
    {u: 8, sem: 2, title: "Synthesis Essay", text: "Your book club book", author: "", product: "Synthesis essay", essay: "synthesis", color: "#4d7c0f",
     skills: ["A synthesis thesis", "Connecting a novel with outside sources", "Credible research", "Citing several sources in MLA"]},
    {u: 9, sem: 2, title: "Macbeth", text: "Macbeth", author: "William Shakespeare", product: "Literary analysis essay", essay: "lit", color: "#7f1d1d", drama: true,
     skills: ["Blank verse and iambic pentameter", "Soliloquy and aside", "Dramatic irony", "Ambition and guilt", "Literary analysis essay"]},
    {u: 10, sem: 2, title: "Poetry", text: "Poems, including the one you choose", author: "", product: "My Favorite Poem presentation", essay: "", color: "#6d28d9",
     skills: ["Speaker, imagery and figurative language", "Sound: rhyme, meter and repetition", "Reading a poem aloud", "Explaining why a poem matters to you"]}
  ]
};
if (typeof module !== "undefined") module.exports = {COURSE};
