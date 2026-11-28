// Rhetoric checks: does a sentence really use a device (sentence building), is an analysis sentence complete, does a
// debate move have a counterargument signal and a rebuttal, and an estimated score for a rhetorical analysis paragraph
// built on the class paragraph plan (claim, evidence, reasoning 2-4 sentences, transitions, concluding sentence).
// Like the checker, it never rewrites: it says what is there and what is missing. Works in the app and in Node.
const RhetCheck = (() => {
  const C = typeof Checker !== "undefined" ? Checker : require("./checker.js").Checker;
  const TT = typeof TERMS !== "undefined" ? TERMS : require("../content/terms.js").TERMS;
  const RH = typeof RHET !== "undefined" ? RHET : require("../content/rhetoric.js").RHET;
  const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be been it its this that these those i you he she we they them his her their our your my me us not no so if then than there here what which who whom whose when where why how all any each every some such just also very can will would should could may might must do does did has have had into out up down over under again more most other own same too only".split(" "));
  // Does the sentence name the author? With no author given, any capitalized word that isn't a common sentence opener counts.
  const STARTERS = new Set("The In This That These Those By Through When While Although Though Throughout With As An Her His Their It Its She He They Using Ultimately Additionally Also Then First Finally Moreover However Overall Thus Therefore Similarly Later Next Here There Both Each Every Such One Some Many Most Because Since If After Before Readers Audiences".split(" "));
  const namesAuthor = (t, ctx) => ctx.author ? new RegExp(`\\b${ctx.author}\\b`).test(t) : (unquote(t).match(/\b[A-Z][a-z]+(?:[’']s)?\b/g) || []).some(w => !STARTERS.has(w.replace(/[’']s$/, "")));
  const sentsOf = text => C.paragraphs(text).flatMap(p => C.sentences(text, p)).map(s => s.text);
  const unquote = t => t.replace(/“[^”]*”|"[^"]*"/g, " ").replace(/(^|[\s(])'[^'\n]{1,60}'(?=[\s.,;:!?)]|$)/g, "$1 ");
  const words = t => (t.toLowerCase().match(/[a-z’']+/g) || []).map(w => w.replace(/[’']s$/, ""));
  // Clauses for anaphora and epistrophe: split on sentence ends, semicolons, colons and commas before a conjunction
  const clauses = t => t.split(/[.!?;:]+|,\s*(?=(?:and|but|or|so|yet)\b)|,(?=\s)/).map(x => x.trim()).filter(x => words(x).length >= 2);
  const ANT = [["rich", "poor"], ["short", "long"], ["love", "hate"], ["remember", "forget"], ["small", "giant"], ["small", "large"], ["win", "lose"], ["light", "dark"], ["give", "take"], ["cheap", "expensive"], ["few", "many"], ["begin", "end"], ["arrive", "leave"], ["open", "closed"], ["private", "public"], ["first", "last"], ["young", "old"], ["strong", "weak"], ["friend", "foe"], ["friend", "enemy"], ["war", "peace"], ["life", "death"], ["living", "dead"], ["say", "did"], ["say", "do"], ["words", "actions"], ["beauty", "ugliness"], ["heaven", "hell"], ["rise", "fall"], ["gain", "loss"], ["build", "destroy"], ["visitor", "local"], ["tourist", "native"], ["here", "there"], ["best", "worst"], ["always", "never"], ["everything", "nothing"], ["everyone", "no one"], ["day", "night"], ["hope", "fear"], ["truth", "lie"], ["easy", "hard"], ["fast", "slow"], ["high", "low"], ["more", "less"], ["can", "cannot"], ["ask", "answer"], ["came", "left"], ["comes", "goes"], ["save", "spend"], ["joy", "sorrow"], ["wealth", "poverty"], ["full", "empty"], ["push", "pull"], ["heard", "ignored"], ["seen", "unseen"]];
  const ALLUSIONS = /\b(?:Eden|Adam|Eve|Noah|Moses|Goliath|David|Judas|Samaritan|Babel|Exodus|Pharaoh|Trojan|Troy|Achilles|Odysseus|Odyssey|Pandora|Hercules|Herculean|Icarus|Midas|Narcissus|Sisyphus|Atlas|Rubicon|Caesar|Brutus|Romeo|Juliet|Hamlet|Macbeth|Scrooge|Cinderella|Big Brother|Frankenstein|Gatsby|Waterloo|Titanic|Everest|Napoleon|Lincoln|Gandhi|Einstein|Shakespeare|Holmes|Robin Hood|Peter Pan|Wonderland|Oz|Mount Olympus|Promised Land|Garden of Eden|Good Samaritan|Pied Piper|Achilles' heel|Achilles’ heel|Catch-22|Mona Lisa)\b/;
  const HYPER = /\b(?:million|millions|billion|billions|trillion|thousand|thousands|hundred times|forever|for ages|eternity|every single|whole world|entire world|the planet|everyone on earth|nobody ever|never ever|infinite|endless|tons? of|starving|dying|died|killing me|a decade|a century|light years|the end of the world|older than|bigger than|taller than|heavier than|expired|exploded|fainted|melted|froze|weighs a ton|a mile long|miles long|ages)\b/i;
  const LITOTES = /\b(?:not|no|never|hardly|scarcely)\s+(?:a\s+|an\s+|the\s+|exactly\s+|at all\s+|entirely\s+|so\s+|too\s+)?(?:un\w+|in(?:significant|correct|competent|considerable|frequent)|im(?:possible|probable|material)|ir(?:relevant|regular)|dis\w+|bad|small|easy|minor|terrible|cheap|simple|trivial|wrong|poor|unlike|ugly|stranger|short|light|little|slight|few|tiny|weak|dull|boring|unusual|uncommon|ordinary|nothing|worthless|pointless|meaningless|average|modest)\b/i;
  const APOS = /^\s*(?:O|Oh)\s+[A-Za-z]|^\s*(?:dear\s+|old\s+|sweet\s+)?[A-Za-z][a-z]+(?:\s+[a-z]+){0,2},\s+(?:you|your|be|do|don't|did|why|how|please|listen|look|hear|stay|come|go|wait|remember|forgive|tell|can|will|are|have|let)\b/i;

  // Does the text use the device? ok: true, false or null (the app can't tell; check it yourself).
  function device(term, text) {
    const t = String(text || "").trim(), ws = words(t), r = (ok, msg) => ({ok, msg});
    if (ws.length < 4) return r(false, "Write a full sentence first.");
    const cl = clauses(t);
    switch (term) {
      case "Anaphora": {
        for (const n of [3, 2, 1]) { const starts = cl.map(c => words(c).slice(0, n).join(" ")).filter(s => s.split(" ").length === n); const cnt = {}; for (const s of starts) cnt[s] = (cnt[s] || 0) + 1; const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= 3 && !(n === 1 && STOP.has(best[0]) && !["we", "they", "you", "if", "when", "every", "never", "no", "not", "let"].includes(best[0]))) return r(true, `${best[1]} clauses begin with "${best[0]}".`); }
        return r(false, "Start at least three sentences or clauses with the same word or words.");
      }
      case "Epistrophe": {
        for (const n of [3, 2, 1]) { const ends = cl.map(c => words(c).slice(-n).join(" ")).filter(s => s.split(" ").length === n); const cnt = {}; for (const s of ends) cnt[s] = (cnt[s] || 0) + 1; const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= 3 && !(n === 1 && STOP.has(best[0]))) return r(true, `${best[1]} clauses end with "${best[0]}".`); }
        return r(false, "End at least three clauses with the same word or words.");
      }
      case "Repetition": {
        const cnt = {}; for (const w of ws) if (w.length >= 4 && !STOP.has(w)) cnt[w] = (cnt[w] || 0) + 1;
        const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
        return best && best[1] >= 3 ? r(true, `"${best[0]}" appears ${best[1]} times.`) : r(false, "Repeat one key word at least three times.");
      }
      case "Asyndeton": {
        const lists = t.split(/[.!?;:]/).filter(s => (s.match(/,/g) || []).length >= 2 && !/\b(?:and|or|nor)\b/i.test(s));
        return lists.length ? r(true, "A list of three or more with no and or or.") : r(false, "List at least three items with commas, and leave out and/or.");
      }
      case "Polysyndeton": {
        const best = Math.max(0, ...t.split(/[.!?;]/).map(s => (s.match(/\b(?:and|or|nor)\b/gi) || []).length));
        return best >= 3 ? r(true, `${best} conjunctions in one sentence.`) : r(false, "Use and (or or) at least three times in one sentence.");
      }
      case "Rhetorical question": {
        const ss = sentsOf(t); const q = ss.filter(s => /\?["”']?$/.test(s));
        if (!q.length) return r(false, "A rhetorical question ends with a question mark.");
        const last = ss[ss.length - 1]; if (!/\?["”']?$/.test(last)) return r(false, "You answered your question; that's hypophora. Let the question stand on its own.");
        return r(true, "A question left for the reader to answer.");
      }
      case "Hypophora": {
        const ss = sentsOf(t); const i = ss.findIndex(s => /\?["”']?$/.test(s));
        if (i < 0) return r(false, "Ask a question first.");
        return ss.slice(i + 1).some(s => !/\?["”']?$/.test(s) && words(s).length >= 2) ? r(true, "A question, then your answer.") : r(false, "Answer your question right after you ask it.");
      }
      case "Litotes": return LITOTES.test(t) ? r(true, "Understatement by negation.") : r(false, "Say what something is not: not small, no easy task, not exactly cheap.");
      case "Antithesis": {
        const has = ANT.find(([a, b]) => new RegExp(`\\b${a}\\w*\\b`, "i").test(t) && new RegExp(`\\b${b}\\w*\\b`, "i").test(t));
        if (has) return r(true, `Opposites: ${has[0]} and ${has[1]}.`);
        return /\b(?:but|not|yet|while|whereas|instead)\b|;/.test(t) ? r(null, "There's a contrast. Check that the two halves are real opposites with the same shape.") : r(false, "Put two opposite ideas side by side, in matching halves.");
      }
      case "Parallel structure": {
        const series = t.split(/[.!?;:]/).map(s => s.split(/,\s*(?:and\s+|or\s+)?|\s+and\s+|\s+or\s+/).map(x => x.trim()).filter(Boolean)).filter(x => x.length >= 3);
        for (const items of series) {
          const firsts = items.map(x => words(x)[0] || ""), lasts = items.map(x => (words(x).slice(-1)[0] || ""));
          const sameStart = firsts.slice(-3).every(w => w === firsts[firsts.length - 1]);
          const ing = items.slice(-3).every(x => /^\w+ing\b/i.test(x.replace(/^(?:and|or)\s+/i, "")));
          const toV = items.slice(-3).every(x => /^(?:and\s+|or\s+)?to\s+\w+/i.test(x));
          const ed = items.slice(-3).every(x => /^\w+ed\b/i.test(x));
          const who = items.slice(-3).every(x => /\b(?:who|that|which)\s+\w+/i.test(x));
          if (sameStart || ing || toV || ed || who || lasts.slice(-3).every(w => /ing$/.test(w))) return r(true, "Three items in the same grammatical form.");
        }
        return r(null, "Check it yourself: are all the items in the same form (all -ing words, all to-verbs, all the same kind of phrase)?");
      }
      case "Analogy": return /\b(?:is|are|was|were|feels?|seems?)\s+(?:just\s+)?like\b|\blike\s+(?:trying|filling|building|painting|running|asking|a|an|the)\b|\bjust as\b.*\bso\b|\bas if\b/i.test(t) ? r(true, "A comparison that explains an idea.")
        : /\b(?:is|are|was|were)\s+(?:a|an|the)\s+\w+/i.test(t) ? r(null, "Check it yourself: does your comparison explain the idea, not just describe it?") : r(false, "Compare your idea to something familiar: X is like Y because...");
      case "Hyperbole": return HYPER.test(t) ? r(true, "An obvious exaggeration.") : r(null, "Check it yourself: is the exaggeration so big no one would take it literally?");
      case "Allusion": return ALLUSIONS.test(t) ? r(true, "A reference to a well-known story, person or place.") : r(null, "Check it yourself: does it refer to a story, person, place or event your audience will recognize?");
      case "Apostrophe": return APOS.test(t) ? r(true, "Speaking directly to something that can't answer.") : r(null, "Check it yourself: do you address the absent person, place or idea directly, by name?");
      case "Diction": return ss2(t) ? r(true, "Two versions to compare.") : r(null, "Write two versions that differ by one loaded word, then name the feeling each word carries.");
      case "Juxtaposition": return /\b(?:beside|next to|across from|while|behind|alongside|between|meanwhile|just outside|a few steps from)\b/i.test(t) ? r(null, "Two things side by side. Check that they really contrast.") : r(null, "Check it yourself: are two contrasting things placed right next to each other?");
      default: return r(null, "Check it yourself against the definition.");
    }
  }
  const ss2 = t => sentsOf(t).length >= 2;

  // An analysis sentence: device named, a precise verb, an effect on the reader, a link to purpose
  // The method words a rhetorical analysis can name: the sheet's devices, appeals and evidence types, plus common devices
  const escRe = x => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const METHOD = [...new Set(TT.filter(t => t.sheet && t.sheet !== "faulty" && !["Rhetoric", "Claim", "Counterargument", "Rebuttal"].includes(t.t)).map(t => t.t.toLowerCase())
    .concat(["second-person address", "second person", "direct address", "sarcasm", "irony", "imagery", "symbol", "symbolism", "tone", "metaphor", "simile", "personification", "satire", "contrast", "parallelism", "word choice", "emotional appeal", "credibility", "logic", "statistics", "connotation", "understatement", "exaggeration"]))].sort((a, b) => b.length - a.length);
  const METHOD_RE = new RegExp(`\\b(?:${METHOD.map(escRe).join("|")})(?:s|es)?\\b`, "gi");
  const methodsIn = t => [...new Set((unquote(t).toLowerCase().match(METHOD_RE) || []).map(m => METHOD.find(x => m === x || m === x + "s" || m === x + "es") || m))];
  const VERB = () => new RegExp(`\\b(?:${RH.verbs.map(v => v.replace(/e?s$/, "")).join("|")}|employ|craft|create|use|deploy|shift)\\w*\\b`, "i");
  const EFFECT = /\b(?:readers?|audience|listeners?|tourists?|the public|viewers?|americans|citizens)\b/i;
  const FEEL = /\b(?:feel|feels|felt|realize|realizes|notice|notices|imagine|imagines|shock\w*|guilt\w*|uncomfortable|suspicio\w*|sympath\w*|angry|anger|ashamed|implicat\w*|complicit|disgust\w*|unsettl\w*|confront\w*)\b/i;
  const WEAK = /\b(?:this|the|that) (?:quote|quotation) (?:shows|proves|means|says)\b|\bthis shows that\b/i;
  const PURPOSE = /\bto\s+(?:\w+\s+){0,2}?(?:show|expose|criticize|criticise|convince|persuade|make|force|urge|reveal|condemn|challenge|warn|argue|inspire|rally|encourage|highlight|emphasize|emphasise|prove|shame|confront|implicate|question|mock|remind|move|push|turn|stir|awaken|provoke|draw|call|win|change|help|get|teach|honor|dedicate)\b|\bin order to\b|\bso that\b|\bwhich (?:\w+\s+){0,2}?(?:shows|reveals|supports|reinforces|proves|suggests|develops|strengthens|exposes)\b|\bpurpose\b|\breinforc\w*|\bsupport\w* (?:her|his|their|the) (?:claim|argument|purpose)\b/i;
  function analysis(text) {
    const t = String(text || ""), low = unquote(t).toLowerCase(), parts = [];
    const add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    add("Names a device or appeal", methodsIn(t).length > 0, "Name the device: anaphora, rhetorical question, juxtaposition, pathos...");
    add("Uses a precise rhetorical verb", VERB().test(low), "Try emphasizes, exposes, mocks, implicates, evokes.");
    add("Explains the effect on the reader", EFFECT.test(low) || FEEL.test(low), "Say what it does to the reader: makes them feel, see, question...");
    add("Links to the author's purpose", PURPOSE.test(low), "Connect to the purpose: ...to expose, ...which reinforces her claim that...");
    return {ok: parts.every(p => p.pass), parts};
  }

  // One reasoning box of the paragraph plan: 2 to 4 sentences on the effect and the purpose
  function reasoning(text) {
    const t = String(text || ""), n = sentsOf(t).length, low = unquote(t).toLowerCase(), parts = [];
    const add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    add("2 to 4 sentences", n >= 2 && n <= 4, n < 2 ? "Add a sentence: what does it do to the reader, and why does that matter?" : "Tighten it to four sentences or fewer.");
    add("Says what it does to the reader", EFFECT.test(low) || FEEL.test(low), "Name the effect on the reader or audience.");
    add("Links to the purpose or claim", PURPOSE.test(low) || /\b(?:claim|argument|message|criticism|critique)\b/.test(low), "Tie it back to the author's purpose.");
    add("Explains instead of announcing", !WEAK.test(t), "Replace 'This quote shows' with what the author does and why.");
    return {ok: parts.every(p => p.pass), parts};
  }
  // One evidence box: a quotation (cited, set up in your words) or an exact moment
  function evidence(text) {
    const t = String(text || ""), parts = [], q = C.quotes(t, false).some(x => C.wc(x.inner) >= 2);
    const add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    add("Quotes or points to a specific moment", q || EVREF.test(t), "Quote a short phrase, or name the exact moment: When Kincaid describes the school...");
    add("Cites the quotation", !q || PAGE.test(t), "Cite it with the page: (Kincaid 4).");
    add("Sets it up in your own words", !q || /\b(?:when|as|after|while|where|because)\b|\b(?:writes|says|asks|describes|notes|declares|promises|tells|explains|admits|warns|insists|calls|compares|repeats|lists)\b/i.test(unquote(t)), "Introduce it: When Kincaid describes the school, she writes...");
    return {ok: parts.every(p => p.pass), parts};
  }

  // A debate move: a counterargument with a signal phrase, and a rebuttal that turns and gives a reason
  const COUNTER = /\b(?:some|critics|others|opponents|supporters|many|people|someone|skeptics|defenders)\b[^.]{0,40}\b(?:argue|argues|claim|claims|say|says|might|may|could|believe|believes|insist|contend|point out|would say)\b/i;
  const TURN = /\b(?:however|but|although|though|while|yet|even so|still|nevertheless|on the other hand|this ignores|this overlooks|that misses)\b/i;
  const REASON = /\b(?:because|since|as|so|which|for example|for instance|when|if|this means|the evidence|shows|proves)\b/i;
  function fallacyScan(text) {
    const t = unquote(String(text || "")), out = [];
    if (/\beither\b[^.]{3,80}\bor\b/i.test(t) && !/\b(?:many|other|several|more than two) (?:options|choices|ways)\b/i.test(t)) out.push(["Either/or fallacy", "Only two choices? Real debates usually have more."]);
    if (/\b(?:everyone|everybody|all (?:the )?(?:other|cool)|most people|millions of people)\b[^.]{0,40}\b(?:so|therefore|which means|must|should)\b/i.test(t)) out.push(["Bandwagon", "Popularity isn't evidence."]);
    if (/\b(?:you're|you are|he's|she's|they're|they are|he is|she is)\s+(?:just\s+|only\s+)?(?:too\s+)?(?:young|old|stupid|dumb|biased|rich|lazy|bitter|jealous|a hypocrite|ignorant)\b|\bwho cares what\b/i.test(t)) out.push(["Ad hominem", "Answer the argument, not the person."]);
    if (/\bif\b[^.]{3,80}\b(?:soon|eventually|next thing|before long|then)\b[^.]{0,60}\b(?:never|no one|nobody|all|every|collapse|destroy|ruin|end)\w*\b/i.test(t)) out.push(["Slippery slope", "Show each step with evidence, or drop the extreme ending."]);
    if (/\b(?:one|two|a few|my|a)\b[^.]{0,30}\b(?:was|were|did|is|are)\b[^.]{0,40}\b(?:so|therefore)\b[^.]{0,30}\b(?:all|every|everyone|always|never|must be)\b/i.test(t)) out.push(["Hasty generalization", "A few examples can't prove a rule."]);
    return out;
  }
  function debateMove(counter, rebuttal) {
    const parts = [], add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    add("Counterargument has a signal phrase", COUNTER.test(counter || ""), "Introduce it fairly: Some argue that..., Critics claim that...");
    add("Counterargument is stated fairly", words(counter || "").length >= 8, "Give the other side its best version in a full sentence.");
    add("Rebuttal turns the argument", TURN.test(rebuttal || ""), "Start the turn: However..., While that is true...");
    add("Rebuttal gives a reason or evidence", REASON.test(rebuttal || "") && words(rebuttal || "").length >= 8, "Say why: ...because..., ...as the evidence shows...");
    const fal = fallacyScan((counter || "") + " " + (rebuttal || ""));
    add("No faulty reasoning", !fal.length, fal.map(f => `${f[0]}: ${f[1]}`).join(" "));
    return {ok: parts.every(p => p.pass), parts, fallacies: fal};
  }

  // ---- Estimated score for one rhetorical analysis paragraph (the class paragraph plan). 6 rows x 4 points.
  const TRANS = /\b(?:additionally|furthermore|moreover|in addition|similarly|likewise|also|another|later|next|then|finally|for example|for instance|in contrast|however|ultimately|thus|therefore|as a result|consequently|in the same way|beyond this|by contrast|on the other hand)\b/i;
  const CONCL = /\b(?:ultimately|overall|thus|in the end|in this way|through (?:\w+\s+){0,4}|by (?:\w+ing)|therefore|as a result|together|in short|altogether)\b/i;
  const EVREF = /\b(?:when|where|as)\s+(?:[A-Z][a-z]+|she|he|they|the (?:author|speaker|writer|narrator))\s+(?:writes|says|describes|asks|explains|notes|tells|compares|calls|points out|imagines|admits|claims|repeats|lists|addresses|promises|declares|insists|warns|mocks)\b|\bin the (?:passage|moment|scene|line|sentence|paragraph) (?:where|when|about)\b/i;
  const PAGE = /\((?:[A-Z][a-z]+\s+)?(?:p\.\s*|pg\.\s*)?\d+(?:[-–]\d+)?\)|\([A-Z][a-z]+\)/;
  const TONEW = () => new RegExp(`\\b(?:${RH.tones.join("|")})\\b`, "i");
  function grade(text, ctx = {}) {
    const t = String(text || "").trim(), ss = sentsOf(t), rows = [], add = (k, name, score, notes) => rows.push({k, name, score: Math.max(1, Math.min(4, score)), max: 4, notes});
    const low = unquote(t).toLowerCase(), wcount = C.wc(t);
    if (wcount < 40) return {rows: [], total: 0, max: 24, pct: 0, words: wcount, short: true};
    // 1. Claim: the topic sentence names the author, a method (device or appeal), a precise verb and the purpose
    const s0 = ss[0] || "", u0 = unquote(s0), d0 = methodsIn(s0);
    const authorOk = namesAuthor(s0, ctx);
    const claimParts = [["names the author", authorOk], ["names a method (device or appeal)", d0.length > 0], ["uses a precise rhetorical verb", VERB().test(u0)], ["states the purpose", PURPOSE.test(u0)]];
    const cOk = claimParts.filter(p => p[1]).length;
    add("claim", "Claim (topic sentence)", cOk, claimParts.filter(p => !p[1]).map(p => `Topic sentence: ${p[0]}.`).concat(cOk === 4 ? ["Purpose and method are both in your claim."] : []));
    // 2. Evidence: quotations or specific references, ideally cited
    const evIdx = ss.map((s, i) => C.quotes(s, false).some(q => C.wc(q.inner) >= 2) || EVREF.test(s) ? i : -1).filter(i => i > 0);
    const cited = PAGE.test(t);
    const ev = evIdx.length;
    const anyQ = C.quotes(t, false).some(q => C.wc(q.inner) >= 2);
    add("evidence", "Evidence", ev >= 2 ? (cited ? 4 : 3) : ev === 1 ? 2 : 1, [ev >= 2 ? `${ev} pieces of evidence.` : ev === 1 ? "Only one piece of evidence; the plan calls for two." : "No quotations or specific references found.",
      ev && !anyQ ? "Your evidence points to moments without quoting: quote a short phrase for at least one, with its page." : ev && !cited ? "Cite each quotation: (Kincaid 3) or (p. 3)." : ""].filter(Boolean));
    // 3. Reasoning: 2-4 sentences after each piece of evidence, about the reader and the purpose
    const last = ss.length - 1, segs = evIdx.map((i, k) => { const end = (k + 1 < evIdx.length ? evIdx[k + 1] : last) - 1; return ss.slice(i + 1, end + 1); });
    const goodSegs = segs.filter(sg => sg.length >= 2 && sg.length <= 4).length, effect = EFFECT.test(low) || FEEL.test(low), purp = PURPOSE.test(low) || /\b(?:claim|argument|message|criticism|critique)\b/.test(low);
    const weak = (t.match(new RegExp(WEAK.source, "gi")) || []).length;
    let rs = !ev ? 1 : segs.every(sg => !sg.length) ? 1 : goodSegs >= Math.min(2, ev) ? 3 : 2;
    if (rs === 3 && effect && purp) rs = 4; if (weak && rs > 2) rs--;
    add("reasoning", "Reasoning and elaboration", rs, [segs.map((sg, k) => `After evidence ${k + 1}: ${sg.length} sentence${sg.length === 1 ? "" : "s"} of reasoning${sg.length < 2 ? " (aim for 2 to 4)" : sg.length > 4 ? " (tighten to 2 to 4)" : ""}.`).join(" "), effect ? "" : "Say what each choice does to the reader or audience.", purp ? "" : "Tie the reasoning back to the author's purpose or claim.", weak ? "Replace 'This quote shows' with what the author does and why." : ""].filter(Boolean));
    // 4. Rhetorical vocabulary: devices, appeals and tone named precisely
    const vocab = methodsIn(t), tone = TONEW().test(low);
    add("vocab", "Rhetorical vocabulary", vocab.length >= 3 ? 4 : vocab.length === 2 ? 3 : vocab.length === 1 ? 2 : 1, [vocab.length ? `Names: ${vocab.slice(0, 6).join(", ")}.` : "Name the devices and appeals you're analyzing.", tone ? "Names the tone." : "Name the tone with a precise word (sarcastic, accusatory, bitter...)."]);
    // 5. Organization: transitions, a concluding sentence, a full paragraph
    const trans = ss.slice(1).filter(s => TRANS.test(unquote(s))).length, concl = ss.length >= 4 && CONCL.test(unquote(ss[last])), lenOk = wcount >= 120 && wcount <= 380;
    add("organization", "Organization", 1 + [trans >= 1, concl, lenOk].filter(Boolean).length, [trans ? `${trans} transition${trans === 1 ? "" : "s"}.` : "Add transitions between your two pieces of evidence (Additionally, Similarly, Later...).", concl ? "Ends with a concluding sentence." : "End with a concluding sentence that returns to the purpose (Ultimately, ...).", lenOk ? "" : wcount < 120 ? `${wcount} words: develop the reasoning further.` : `${wcount} words: tighten it to one paragraph.`].filter(Boolean));
    // 6. Conventions and style: the checker's style and conventions fixes, first person, you, past tense
    const res = C.check(t, {quotes: true, cite: false, present: true}, {type: "rhetorical", author: ctx.author || "", title: ctx.title || "", names: ctx.names || []});
    const issues = res.findings.filter(f => (f.area === "style" || f.area === "conventions") && f.sev === "fix");
    const extra = [];
    if (/\bI (?:think|believe|feel)\b/.test(unquote(t)) && !issues.some(f => /I think/i.test(f.msg))) extra.push("Cut I think / I believe: state the analysis.");
    if (/\byou\b/i.test(unquote(t).replace(/\b(?:as|the word|address(?:es|ing)? (?:the reader|readers|us|them)? ?as|calls? the reader)\s+you\b/gi, ""))) extra.push("Avoid you in your own sentences (quoting Kincaid's you is fine).");
    const n = issues.length + extra.length;
    add("conventions", "Conventions and style", n === 0 ? 4 : n <= 2 ? 3 : n <= 4 ? 2 : 1, n ? issues.slice(0, 4).map(f => f.msg).concat(extra) : ["No conventions or style problems found."]);
    const total = rows.reduce((a, r) => a + r.score, 0), pct = Math.round(100 * total / 24);
    return {rows, total, max: 24, pct, words: wcount, band: pct >= 90 ? "Exceeds" : pct >= 75 ? "Meets" : pct >= 60 ? "Approaching" : "Beginning"};
  }
  // Thesis for a rhetorical analysis: purpose plus method (the paragraph plan's hint)
  function thesis(text, ctx = {}) {
    const t = String(text || ""), u = unquote(t), parts = [];
    const add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    add("Names the author", namesAuthor(t, ctx), "Name the author or speaker.");
    add("Names the method (devices or appeals)", methodsIn(t).length > 0, "Say how: through rhetorical questions, juxtaposition, pathos...");
    add("Uses a precise verb", VERB().test(u), "Try exposes, implicates, mocks, emphasizes.");
    add("States the purpose", PURPOSE.test(u), "Say why: to expose..., to make tourists confront...");
    add("One sentence, 15 to 45 words", sentsOf(t).length <= 1 && C.wc(t) >= 15 && C.wc(t) <= 45, "One complete sentence.");
    return {ok: parts.every(p => p.pass), parts};
  }
  return {device, analysis, reasoning, evidence, debateMove, fallacyScan, grade, thesis, methodsIn, sentsOf, unquote};
})();
if (typeof module !== "undefined") module.exports = {RhetCheck};
