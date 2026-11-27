// Offline draft checker: plain-text rules a writing teacher would mark, with exact spans to highlight.
// It never rewrites: it points at a spot and says what to look at. Works in the app and in Node (test.js).
const Checker = (() => {
  const ABBR = /(?:\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|al|ch|pg|pp|p|No|Vol|e\.g|i\.e|a\.m|p\.m|U\.S)|\b[A-Z])$/;
  const wordsIn = s => (s.match(/[A-Za-z0-9’']+(?:[-’'][A-Za-z0-9]+)*/g) || []);
  const wc = s => wordsIn(s).length;

  // Paragraphs: blank lines or single line breaks (Google Docs pastes use single breaks).
  function paragraphs(text) {
    const out = []; const re = /[^\n]+/g; let m;
    while ((m = re.exec(text))) { const t = m[0]; if (t.trim()) { const lead = t.length - t.trimStart().length; out.push({s: m.index + lead, e: m.index + t.trimEnd().length, text: t.trim()}); } }
    return out;
  }
  // Sentences with offsets. Ends at . ! ? (plus closing quotes/brackets) followed by space and a capital or an opening quote.
  function sentences(text, para) {
    const out = []; const s0 = para.s, src = text.slice(para.s, para.e);
    let start = 0;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch !== "." && ch !== "!" && ch !== "?") continue;
      let j = i + 1;
      while (j < src.length && /[.!?"”’')\]]/.test(src[j])) j++;
      if (j >= src.length) break;
      if (!/\s/.test(src[j])) continue;
      let k = j; while (k < src.length && /\s/.test(src[k])) k++;
      if (k >= src.length) break;
      const inside = (src.slice(0, i + 1).match(/"/g) || []).length % 2 === 1 || (src.slice(0, i + 1).match(/“/g) || []).length > (src.slice(0, i + 1).match(/”/g) || []).length;
      if (!/[A-Z"“‘(]/.test(src[k]) && !(/[a-z]/.test(src[k]) && !inside && /[a-z]/i.test(src[i - 1] || ""))) continue;
      if (src[k] === "(" && /^\([^()]{1,40}\)\s*(?:[.!?,;:]|$)/.test(src.slice(k, k + 46))) continue;   // a citation follows: same sentence
      if (ch === "." && ABBR.test(src.slice(Math.max(0, i - 6), i))) continue;
      const seg = src.slice(start, j);
      if (seg.trim()) out.push({s: s0 + start + (seg.length - seg.trimStart().length), e: s0 + j, text: seg.trim()});
      start = k; i = k - 1;
    }
    const seg = src.slice(start);
    if (seg.trim()) out.push({s: s0 + start + (seg.length - seg.trimStart().length), e: s0 + start + seg.trimEnd().length, text: seg.trim()});
    return out;
  }
  // Quotations: “...” or "...". Returns spans (including the marks).
  const isTitle = inner => { const w = inner.replace(/[,.!?]+$/, "").split(/\s+/); return w.length <= 6 && /^[A-Z]/.test(w[0]) && w.every(x => /^[A-Z0-9]/.test(x) || /^(?:a|an|the|of|in|on|and|or|to|for|at|by)$/.test(x)); };
  function quotes(text, keepTitles) {
    const out = []; const re = /“([^”]{1,1200})”|"([^"]{1,1200})"/g; let m;
    while ((m = re.exec(text))) { const inner = m[1] || m[2]; if (keepTitles || !isTitle(inner)) out.push({s: m.index, e: m.index + m[0].length, inner}); }
    return out;
  }
  const maskQuotes = (text, qs) => { let t = text; for (const q of qs) t = t.slice(0, q.s) + " ".repeat(q.e - q.s) + t.slice(q.e); return t; };
  const CITE = /\((?:(?:[A-Z][A-Za-z.'’-]+(?:\s+(?:and|&)\s+[A-Z][A-Za-z.'’-]+)?(?:\s+et\s+al\.?)?)(?:\s+(?:\d+(?:[-–]\d+)?|\d+\.\d+\.\d+(?:[-–]\d+)?))?|\d+(?:[-–]\d+)?|\d+\.\d+\.\d+(?:[-–]\d+)?|Source\s+[A-Z0-9]+|[Cc]h(?:apter|\.)?\s*\d+)\)/g;
  const CONTRACTIONS = /\b(?:don't|doesn't|didn't|can't|won't|isn't|aren't|wasn't|weren't|it's|that's|there's|here's|he's|she's|they're|we're|you're|I'm|I've|I'd|I'll|they've|we've|couldn't|shouldn't|wouldn't|hasn't|haven't|hadn't|let's|what's|who's|they'll|we'll|you'll)\b/gi;
  const VAGUE = /\b(?:things?|stuff|a lot|lots of|very|really|basically|literally|kind of|sort of|good|bad|nice|super|huge|awesome)\b/gi;
  const WEAK_COMM = /\b(?:(?:this|the|that) (?:quote|quotation) (?:shows|proves|means|says|explains|tells)|this (?:shows|proves|means)|the author is (?:saying|trying to say)|in other words)\b/gi;
  const SUMMARY_START = /^(?:then|next|after that|afterwards|later|later on|first|finally|in chapter \d+|in (?:section|part) (?:\d+|one|two|three)|at the (?:beginning|end) of the (?:book|novel|story|chapter|section|part))\b/i;
  const PAST_AFTER = "(?:said|wrote|showed|described|used|was|were|did|went|felt|thought|knew|saw|told|asked|decided|realized|became|wanted|tried|took|made|gave|explained|believed|ran|killed)";
  // Class titles whose capitals the checker watches (one-word or common-phrase titles like Night and A Small Place are skipped)
  const CAP_TITLES = ["Fahrenheit 451", "The Astonishing Color of After"];

  function thesisCheck(sentence, ctx = {}) {
    const t = String(sentence || "").trim(), type = ctx.type || "lit", parts = [];
    const add = (label, pass, tip) => parts.push({label, pass: !!pass, tip});
    const n = wc(t);
    add("States a claim, not an announcement", t && !/\b(?:in this essay|this essay will|this paper will|i will (?:discuss|talk|write|explain|show|prove)|i am going to|the purpose of this essay)\b/i.test(t), "Cut the announcement and state the claim itself.");
    add("Is a statement, not a question", t && !/\?\s*$/.test(t), "Turn the question into your answer to it.");
    add("Right length (12 to 50 words)", n >= 12 && n <= 50, n < 12 ? "Too thin: add how and why." : "Too long: split it, or cut to the core claim.");
    if (type === "argument") add("Takes a position", /\b(?:should|must|ought|need to|needs to|is (?:more|less|better|worse)|are (?:more|less|better|worse)|deserve|unfair|necessary|harmful|benefit)\b/i.test(t), "Use a position word: should, must, is better than...");
    else if (type !== "narrative") add("Says how or why, not just what", /\b(?:because|but|disagree|differ|contrast|complicat|reveal|reveals|revealing|suggest|suggests|show(?:s)? that|demonstrat|illustrat|expos|argu|critiqu|warn|prov|ultimately|although|while|despite|through|by|so that|in order to|to show|to reveal|to suggest|to argue)/i.test(t), "Add the insight: '...to show that...' or 'because...'.");
    if (ctx.title || ctx.author) add("Names the title or author", (ctx.title && t.toLowerCase().includes(ctx.title.toLowerCase())) || (ctx.author && t.includes(ctx.author)), `Name ${ctx.title ? ctx.title : "the text"}${ctx.author ? " or " + ctx.author : ""}.`);
    if (type !== "narrative") add("Arguable, not a plain fact", !/^(?:[\w\s,']+ is (?:a|an|the) (?:novel|book|story|play|speech|memoir) (?:about|that|where))/i.test(t) && n >= 8, "A reader should be able to disagree. Say what the book shows, not what it is.");
    const score = parts.filter(p => p.pass).length;
    return {sentence: t, parts, score, of: parts.length, ok: score === parts.length};
  }

  function check(text, cfg = {}, ctx = {}) {
    text = String(text || "").replace(/\r\n?/g, "\n");
    const type = ctx.type || "lit", F = [], goods = [];
    const add = (area, sev, msg, spans = [], hint = "") => F.push({area, sev, msg, hint, spans});
    const P = paragraphs(text), S = []; P.forEach((p, pi) => sentences(text, p).forEach(s => { s.p = pi; S.push(s); }));
    const Q = type === "narrative" ? [] : quotes(text), out = maskQuotes(text, quotes(text, true));
    const cites = []; { let m; const re = new RegExp(CITE.source, "g"); while ((m = re.exec(text))) cites.push({s: m.index, e: m.index + m[0].length, t: m[0]}); }
    let thesis = null;
    const words = wc(text), qWords = Q.reduce((a, q) => a + wc(q.inner), 0);
    const stats = {words, paras: P.length, sents: S.length, avg: S.length ? Math.round(words / S.length) : 0, quotes: Q.length, cites: cites.length, quotePct: words ? Math.round(100 * qWords / words) : 0};
    if (words < 40) { add("organization", "tip", "Paste a full paragraph or essay (40 words or more) to check it."); return finish(); }
    const inPara = (x, pi) => x.s >= P[pi].s && x.e <= P[pi].e + 1;
    const sentOf = pos => S.find(s => pos >= s.s && pos < s.e) || S.find(s => pos >= s.s && pos < s.e + 2);
    const isEssay = P.length >= 3;
    const bodyIdx = isEssay ? P.map((_, i) => i).slice(1, -1) : P.map((_, i) => i);

    // ---- Thesis
    if (type !== "narrative" && type !== "synthesis-paragraph") {
      const intro = S.filter(s => s.p === 0), cands = isEssay ? intro : S.slice(0, 1);
      let best = null;
      for (const s of cands) { const r = thesisCheck(s.text, {...ctx, type}); if (!best || r.score > best.r.score || (r.score === best.r.score && s.s > best.s.s)) best = {s, r}; }
      if (best) {
        thesis = {...best.r, s: best.s.s, e: best.s.e, where: isEssay ? "introduction" : "first sentence"};
        if (best.r.score <= Math.floor(best.r.of / 2)) add("thesis", "fix", isEssay ? "No clear thesis in the introduction." : "The first sentence doesn't state a clear claim (topic sentence).", [[best.s.s, best.s.e]], "A thesis states your arguable answer: what the text shows, and how or why.");
        else if (!best.r.ok) for (const pt of best.r.parts.filter(p => !p.pass)) add("thesis", "tip", `Thesis: ${pt.label.toLowerCase()}.`, [[best.s.s, best.s.e]], pt.tip);
        else goods.push("Your thesis states a claim with a how or why.");
      }
    }

    // ---- Evidence
    if (cfg.quotes) {
      if (!Q.length && (words > 120 || P.length > 1)) add("evidence", "fix", "No quotations found. Analysis needs textual evidence.", [], "Embed short quotations from the text and cite each one.");
      let uncited = 0;
      for (const q of Q) {
        const s = sentOf(q.s); if (!s) continue;
        const qw = wc(q.inner), sw = wc(s.text);
        const lead = text.slice(s.s, q.s).trim();
        if (!lead && qw >= 0.7 * sw) add("evidence", "fix", "Dropped quotation: it stands alone with no lead-in.", [[q.s, q.e]], `Attach it to your own words: 'When ___, ${ctx.author || "the author"} describes...'`);
        if (qw > 40) add("evidence", "tip", "Long quotation: trim it to the words that matter.", [[q.s, q.e]], "Quote only what you analyze. Over four lines of prose needs block format.");
        if (cfg.cite) {
          const after = text.slice(q.e, Math.min(s.e + 2, q.e + 60));
          if (!/^\s*[,.;:!?]?\s*\(/.test(after) && !cites.some(c => c.s >= q.e && c.s <= s.e + 1)) { uncited++; add("conventions", "fix", "Quotation without a citation.", [[q.s, q.e]], `Add the author and page right after it: (${ctx.author || "Bradbury"} 42).`); }
        }
      }
      if (Q.length && cfg.cite && !uncited) goods.push("Every quotation has a citation.");
      P.forEach((p, pi) => {
        const last = S.filter(s => s.p === pi).pop(); if (!last) return;
        const qInLast = Q.filter(q => q.s >= last.s && q.e <= last.e + 1);
        if (qInLast.length) {
          const tail = text.slice(qInLast[qInLast.length - 1].e, last.e).replace(/\([^)]*\)/g, "").replace(/[\s.,;:!?"”]/g, "");
          if (tail.length < 4 && (pi !== 0 || P.length === 1)) add("commentary", "tip", `Paragraph ${pi + 1} ends on a quotation.`, [[last.s, last.e]], "Follow every quotation with commentary. End on your idea, not the text's.");
        }
      });
      if (isEssay && P.length >= 4) { const lastQ = Q.filter(q => inPara(q, P.length - 1)); if (lastQ.length) add("evidence", "tip", "New quotation in the conclusion.", lastQ.map(q => [q.s, q.e]), "Save evidence for body paragraphs; the conclusion extends your insight."); }
    }

    // ---- Commentary
    if (cfg.quotes) {
      for (const pi of bodyIdx) {
        const ss = S.filter(s => s.p === pi); if (!ss.length) continue;
        const pq = Q.filter(q => inPara(q, pi)), qw = pq.reduce((a, q) => a + wc(q.inner), 0), ow = wc(P[pi].text) - qw;
        if (qw && ow < 1.2 * qw) add("commentary", "fix", `Paragraph ${pi + 1}: more quotation than your own words.`, [[P[pi].s, P[pi].e]], "Cut the quotations to the key words and explain each one in your own sentences.");
        else if (qw && ow < 2.5 * qw) add("commentary", "tip", `Paragraph ${pi + 1}: commentary is thin.`, [[P[pi].s, P[pi].e]], "Add a second 'so what?' sentence after each quotation.");
      }
      if (Q.length && !F.some(f => f.area === "commentary" && f.msg.includes("Paragraph"))) goods.push("More of your own words than quotation in every body paragraph.");
    }
    { const m = [...out.matchAll(WEAK_COMM)]; if (m.length) add("commentary", "tip", `Weak commentary starter${m.length > 1 ? "s" : ""} (${m.length}).`, m.map(x => [x.index, x.index + x[0].length]), "Start from the idea: 'By hiding behind paint, Jack...' instead of 'This quote shows...'"); }
    if (type !== "narrative") { const sum = S.filter(s => SUMMARY_START.test(s.text)); if (sum.length >= 2) add("commentary", "tip", `${sum.length} sentences read like plot summary.`, sum.map(s => [s.s, s.e]), "Summarize only what your analysis needs; spend the words on why it matters."); }

    // ---- Organization
    if (cfg.minParas && P.length < cfg.minParas && words > 250) add("organization", "tip", `Only ${P.length} paragraph${P.length === 1 ? "" : "s"}.`, [], "A full essay has an introduction, body paragraphs and a conclusion.");
    P.forEach((p, pi) => { if (wc(p.text) > 260) add("organization", "tip", `Paragraph ${pi + 1} is very long (${wc(p.text)} words).`, [[p.s, p.e]], "Split it where the claim changes."); });
    if (cfg.quotes) for (const pi of bodyIdx) { const first = S.find(s => s.p === pi); if (first && /^["“]/.test(first.text) && (isEssay || pi > 0 || P.length === 1)) add("organization", "fix", `Paragraph ${pi + 1} opens with a quotation.`, [[first.s, first.e]], "Open with your own claim (a topic sentence), then bring in evidence."); }
    if (isEssay) { const c = S.find(s => s.p === P.length - 1); if (c && /^in conclusion\b/i.test(c.text)) add("organization", "tip", "'In conclusion' is a cliché opener.", [[c.s, c.s + 13]], "Open the conclusion with your insight instead."); }

    // ---- Style
    if (!cfg.first) {
      const think = [...out.matchAll(/\b(?:I think|I believe|I feel|In my opinion|I know)\b/g)];
      if (think.length) add("style", "fix", "Cut 'I think' and 'in my opinion'.", think.map(x => [x.index, x.index + x[0].length]), "Just state the claim; it's already your opinion.");
      const fp = [...out.matchAll(/\b(?:I|me|my|mine|myself)\b/g)].filter(x => !think.some(t => x.index >= t.index && x.index < t.index + t[0].length));
      if (fp.length) add("style", "tip", `First person (${fp.length}).`, fp.map(x => [x.index, x.index + x[0].length]), "Formal essays usually avoid I and my. Check your teacher's rule.");
      const sp = [...out.matchAll(/\b(?:you|your|yours|yourself)\b/gi)];
      if (sp.length) add("style", "tip", `'You' in a formal essay (${sp.length}).`, sp.map(x => [x.index, x.index + x[0].length]), "Name who you mean: readers, students, people.");
      const ct = [...out.matchAll(CONTRACTIONS)];
      if (ct.length) add("style", "tip", `Contractions (${ct.length}).`, ct.map(x => [x.index, x.index + x[0].length]), "Spell them out in formal writing: does not, it is.");
    }
    { const v = [...out.matchAll(VAGUE)]; if (v.length >= 2) add("style", "tip", `Vague words (${v.length}).`, v.map(x => [x.index, x.index + x[0].length]), "Swap in precise words: what exactly is 'good' or 'a lot'?"); }
    if (cfg.present) {
      const names = ["Bradbury", "Poe", "Lincoln", "Douglass", "Wiesel", "Shakespeare", "Pan", "Kincaid", "the author", "the narrator", "the speaker", "the poet", ...(ctx.names || [])];
      const re = new RegExp(`\\b(?:${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s+${PAST_AFTER}\\b`, "gi");
      const m = [...out.matchAll(re)];
      if (m.length) add("style", "tip", `Past tense for the story (${m.length}).`, m.map(x => [x.index, x.index + x[0].length]), `Use the literary present: '${ctx.author || "Bradbury"} writes,' not '${ctx.author || "Bradbury"} wrote.'`);
    }
    { const pv = [...out.matchAll(/\b(?:is|are|was|were|be|been|being)\s+(?:\w+ed|written|shown|given|taken|made|seen|known|done|told|thrown|broken|stolen|chosen|beaten|driven)\b/gi)]; if (pv.length >= 4) add("style", "tip", `Passive voice (${pv.length}).`, pv.map(x => [x.index, x.index + x[0].length]), "Name who acts: 'The firemen burn the books,' not 'The books are burned.'"); }
    S.filter(s => wc(s.text) > 45).forEach(s => add("style", "tip", `Long sentence (${wc(s.text)} words).`, [[s.s, s.e]], "Check for a run-on; split at the turn in the idea."));
    for (let i = 0; i + 2 < S.length; i++) {
      const f = S.slice(i, i + 3).map(s => (s.text.match(/^[\W]*([A-Za-z]+)/) || [])[1]);
      if (f[0] && f.every(x => x && x.toLowerCase() === f[0].toLowerCase())) { add("style", "tip", `Three sentences in a row start with '${f[0]}'.`, S.slice(i, i + 3).map(s => [s.s, s.s + f[0].length + 1]), "Vary your sentence openings."); i += 2; }
    }
    { const th = S.filter(s => /^there (?:is|are|was|were)\b/i.test(s.text)); if (th.length >= 2) add("style", "tip", `'There is / there are' openers (${th.length}).`, th.map(s => [s.s, s.s + 9]), "Start with the real subject and a strong verb."); }

    // ---- Conventions
    { const m = [...out.matchAll(/\b(?:alot|could of|should of|would of|irregardless|its')\b/gi)]; if (m.length) add("conventions", "fix", `Usage error${m.length > 1 ? "s" : ""}: ${[...new Set(m.map(x => x[0].toLowerCase()))].join(", ")}.`, m.map(x => [x.index, x.index + x[0].length]), "a lot; could have; regardless; its."); }
    { const m = [...text.matchAll(/\((?:pg?s?\.?|page)\s*\d+(?:[-–]\d+)?\)/gi)]; if (m.length) add("conventions", "fix", "MLA citations use just the page number.", m.map(x => [x.index, x.index + x[0].length]), `Write (42) or (${ctx.author || "Bradbury"} 42), without p. or page.`); }
    { const m = [...text.matchAll(/\([A-Z][A-Za-z'’-]+,\s*\d+(?:[-–]\d+)?\)/g)]; if (m.length) add("conventions", "fix", "No comma between author and page in MLA.", m.map(x => [x.index, x.index + x[0].length]), `Write (${ctx.author || "Bradbury"} 42).`); }
    { const m = [...text.matchAll(/\.["”]\s*\([^)]{1,40}\)|["”]\.\s*\([^)]{1,40}\)/g)]; if (m.length) add("conventions", "fix", "Period before the citation.", m.map(x => [x.index, x.index + x[0].length]), `Close the quote, cite, then the period: ...words" (${ctx.author || "Bradbury"} 64).`); }
    for (const T of CAP_TITLES.concat(ctx.title && ctx.title.includes(" ") && !CAP_TITLES.includes(ctx.title) && !/^a small place$/i.test(ctx.title) ? [ctx.title] : [])) {
      const m = [...out.matchAll(new RegExp(`\\b${T.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"))].filter(x => x[0] !== T);
      if (m.length) add("conventions", "fix", `Capitalize the title: ${T}.`, m.map(x => [x.index, x.index + x[0].length]), "Capitalize the main words of a title; small words like of and the stay lowercase unless they come first.");
    }
    { const low = S.filter(s => /^[("“'‘]?[a-z]/.test(s.text) && !/^["“]/.test(s.text)); if (low.length) add("conventions", "fix", `Sentence${low.length > 1 ? "s" : ""} starting with a lowercase letter.`, low.map(s => [s.s, s.s + 1]), "Capitalize the first word of every sentence."); }
    { const m = [...out.matchAll(/ {2,}/g)]; if (m.length >= 3) add("conventions", "tip", "Extra spaces between words.", m.slice(0, 20).map(x => [x.index, x.index + x[0].length]), "Use one space."); }

    // ---- By essay type
    if (cfg.counter) {
      const cc = [...out.matchAll(/\b(?:some (?:people |critics |parents |students |teachers |experts )?(?:may |might |would |could )?(?:argue|believe|claim|say|contend|point out)|critics|opponents|on the other hand|although some|while some|others (?:argue|believe|say|claim)|it is true that|admittedly|granted)\b/gi)];
      if (!cc.length) add("counter", "fix", "No counterclaim found.", [], "Address the strongest opposing view: 'Critics argue that...; however, ...'");
      else {
        const s = sentOf(cc[0].index), next = S[S.indexOf(s) + 1];
        const zone = (s ? s.text : "") + " " + (next ? next.text : "");
        if (!/\b(?:however|but|yet|nevertheless|still|even so|this overlooks|this ignores|while this|although this)\b/i.test(zone)) add("counter", "tip", "The counterclaim isn't clearly rebutted.", s ? [[s.s, s.e]] : [], "Answer it right away: 'However, ...'");
        else goods.push("Counterclaim and rebuttal are both there.");
      }
      if (!/\d|according to|study|studies|research|survey|report|found that|data|expert/i.test(out)) add("evidence", "tip", "No data, study or expert found.", [], "Add evidence: a statistic, a study or an expert, with a citation.");
    }
    if (cfg.rhetoric) {
      const uses = [...out.matchAll(/\buses?\b/gi)];
      if (uses.length >= 3) add("style", "tip", `'Uses' appears ${uses.length} times.`, uses.map(x => [x.index, x.index + x[0].length]), "Try precise verbs: emphasizes, juxtaposes, evokes, undercuts.");
      if (!/\b(?:audience|readers?|listeners?|purpose|in order to|to persuade|to convince|to move|to urge)\b/i.test(out)) add("commentary", "tip", "No mention of audience or purpose.", [], "Connect each choice to its effect on the audience and the writer's purpose.");
    }
    if (cfg.sources) {
      const names = new Set(cites.map(c => c.t.replace(/[()]/g, "").replace(/\s+\d.*$/, "").trim()).filter(x => x && !/^\d/.test(x)));
      if (names.size < cfg.sources) add("sources", "fix", `${names.size} cited source${names.size === 1 ? "" : "s"}; synthesis needs at least ${cfg.sources}.`, [], "Bring in another source and cite it: (Lincoln), (Source B).");
      if (!/\b(?:both|similarly|likewise|in contrast|while|whereas|builds on|complicates|together|unlike|echoes|extends|like\s+[A-Z])\b/i.test(out)) add("sources", "tip", "Sources aren't connected to each other.", [], "Link them: 'Both...,' 'While A argues..., B shows...'");
      else if (names.size >= cfg.sources) goods.push("You connect your sources to each other.");
    }
    if (cfg.narrative) {
      if (!quotes(text, true).length) add("story", "tip", "No dialogue yet.", [], "One or two lines of dialogue can reveal character fast.");
      const sense = (text.match(/\b(?:smell\w*|scent|taste\w*|sound\w*|heard|hear|loud|quiet|silen\w*|cold|warm|hot|bright|dark|sweet|bitter|sour|rough|soft|sharp|steam|glow\w*|whisper\w*|rattl\w*|creak\w*)\b/gi) || []).length;
      if (sense < 3) add("story", "tip", "Few sensory details.", [], "Add what you saw, heard, smelled or felt in the moment.");
      const lastP = P[P.length - 1];
      if (lastP && !/\b(?:now|realized?|understand|understood|learned|knew|still|years later|since then|looking back|ever since)\b/i.test(lastP.text)) add("story", "tip", "The ending doesn't reflect.", [[lastP.s, lastP.e]], "End with what you understand now that you didn't then.");
      const story = P.length >= 2 ? out.slice(0, P[P.length - 1].s) : out;   // a reflective ending in the present is fine
      const past = (story.match(/\b(?:was|were|had|did|said|went|looked|walked|felt|saw|sat|stood|ran|thought|knew|heard|told|took|made|came)\b/gi) || []).length;
      const pres = (story.match(/\b(?:is|are|am|has|does|says|goes|looks|walks|feels|sees|sits|stands|runs|thinks|knows|hears|tells|takes|makes|comes)\b|\bI (?:walk|go|see|feel|look|say|sit|stand|run|think|know|hear|tell|take|make|come)\b/g) || []).length;
      if (past >= 3 && pres >= 3 && Math.min(past, pres) / (past + pres) >= 0.25) add("story", "tip", "The tense switches between past and present.", [], "Pick past or present and stay consistent.");
      if (!F.some(f => f.area === "story")) goods.push("Dialogue, sensory detail and a reflective ending are all there.");
    }
    return finish();

    function finish() {
      const AREAS = ["thesis", "evidence", "commentary", "organization", "style", "conventions", "counter", "sources", "story"];
      const areas = {};
      for (const a of AREAS) { const f = F.filter(x => x.area === a); areas[a] = f.some(x => x.sev === "fix") ? "fix" : f.length ? "tip" : "ok"; }
      const fixes = F.filter(x => x.sev === "fix").length, tips = F.length - fixes;
      return {stats, findings: F, goods, areas, thesis, fixes, tips};
    }
  }
  return {check, thesisCheck, paragraphs, sentences, quotes, wc};
})();
if (typeof module !== "undefined") module.exports = {Checker};
