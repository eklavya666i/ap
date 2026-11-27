// The course: Honors Literary Analysis & Composition 2 (EN210A/B), Issaquah High School.
// Unit order follows the 2024-25 IHS syllabus (Ms. Ohsman); reorder here when this year's Canvas syllabus is in hand.
const COURSE = {
  name: "Honors Lit Analysis & Composition 2",
  code: "EN210A/B",
  school: "Issaquah High School",
  grading: [["Prep", 10, "reading checks, daily responses, exit tickets, warm-ups, discussion prep"],
            ["Process", 30, "quote analysis, writing-process steps, small projects, formal discussions"],
            ["Product", 60, "final-draft essays, major projects, presentations (3 to 5 a semester)"]],
  units: [
    {u: 1, title: "Literary Analysis", text: "The Astonishing Color of After", author: "Emily X.R. Pan", product: "Personal narrative", essay: "narrative", color: "#b45309",
     skills: ["Theme statements", "Figurative language", "Color imagery and symbolism", "Nonlinear structure and flashback", "Magical realism", "Narrative techniques"],
     note: "This novel deals with a parent's suicide, depression and grief.", phase: 3},
    {u: 2, title: "Rhetorical Analysis", text: "A Small Place", author: "Jamaica Kincaid", product: "Socratic seminar and rhetorical analysis", essay: "rhetorical", color: "#0f766e", book: "asp",
     skills: ["Rhetorical situation (SOAPSTone)", "Ethos, pathos, logos", "Second-person address", "Tone and irony", "Rhetorical verbs"], phase: 2, ready: true},
    {u: 3, title: "Argument", text: "Articles and persuasive texts", author: "", product: "Persuasive essay", essay: "argument", color: "#1d4ed8", workshop: true,
     skills: ["Claim, reasons, evidence", "Reasoning (warrants)", "Counterclaim and rebuttal", "Logical fallacies", "Credible sources", "Debate"], phase: 2, ready: true},
    {u: 4, title: "Critical Lenses", text: "Lord of the Flies", author: "William Golding", product: "Critical lens analysis essay", essay: "lens", color: "#5b21b6", book: "lotf",
     skills: ["Nine critical lenses", "Symbol and motif tracking", "Allegory", "Embedding and citing quotations", "Commentary"], phase: 1, ready: true},
    {u: 5, title: "Synthesis", text: "Night", author: "Elie Wiesel", product: "Synthesis paragraph and Socratic seminar", essay: "synthesis", color: "#9f1239",
     skills: ["Putting sources in conversation", "Memoir and testimony", "Faith and silence", "Synthesis paragraphs"],
     note: "Night is a memoir of the Holocaust, with scenes of extreme violence and loss.", phase: 3},
    {u: 6, title: "Book Clubs", text: "Choice novels from the ISD-approved list", author: "", product: "Synthesis essay", essay: "synthesis", color: "#047857",
     skills: ["Discussion roles", "Independent reading plans", "Cross-text synthesis"], phase: 3},
    {u: 7, title: "Shakespeare", text: "Macbeth", author: "William Shakespeare", product: "Literary analysis essay", essay: "lit", color: "#7f1d1d",
     skills: ["Blank verse and iambic pentameter", "Soliloquy and aside", "Dramatic irony", "Ambition and guilt", "Literary analysis essay"], phase: 4}
  ]
};
if (typeof module !== "undefined") module.exports = {COURSE};
