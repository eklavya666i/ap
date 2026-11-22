// ---------- Questions: build an item from a template and a seed, show it, collect the answer, grade it, explain it.
// Phase 1 types: mc, multi, num, table, grid, order, match, yn, mistake, explain.
// Lanes add their types (numline, expr, steps, coord, plot) in their own files by adding to QTYPES.
const LETTERS = "ABCDE";
function normItem(it) {
  if (it.type === "mc" && !it.choices) {
    const R = M6.rng(it.seed || 1);
    it.choices = M6.shuffle(R, [{t: it.right, ok: true, why: it.whyRight || ""}].concat((it.wrong || []).map(w => ({t: w[0], ok: false, why: w[1] || "", mis: w[2] || null}))));
  }
  if (it.type === "multi" && it.opts && Array.isArray(it.opts[0])) it.opts = M6.shuffle(M6.rng(it.seed || 2), it.opts.map(o => ({t: o[0], ok: !!o[1], why: o[2] || ""})));
  if (it.type === "yn" && it.rows && Array.isArray(it.rows[0])) it.rows = it.rows.map(r => ({t: r[0], ok: !!r[1], why: r[2] || ""}));
  if (it.type === "order" && !it.shown) {
    const R = M6.rng(it.seed || 3); let sh;
    do sh = M6.shuffle(R, it.items); while (it.items.length > 1 && sh.join("|") === it.items.join("|"));
    it.shown = sh;
  }
  if (it.type === "match" && !it.rights) it.rights = M6.shuffle(M6.rng(it.seed || 4), it.pairs.map(p => p[1]));
  if (it.type === "mistake" && it.fixes && Array.isArray(it.fixes[0])) it.fixes = M6.shuffle(M6.rng(it.seed || 5), it.fixes.map(f => ({t: f[0], ok: !!f[1], why: f[2] || ""})));
  if (it.frame && !it.frame.fr) {          // word problem frame: remember the right options, then shuffle them
    const R = M6.rng((it.seed || 6) + 9);
    it.frame.fr = it.frame.find[0]; it.frame.tr = it.frame.tool[0];
    it.frame.find = M6.shuffle(R, it.frame.find); it.frame.tool = M6.shuffle(R, it.frame.tool);
  }
  it.sol = (it.sol || []).map(x => typeof x === "string" ? {s: x.split(" | ")[0], why: x.split(" | ")[1] || ""} : x);
  it.hints = it.hints || [];
  return it;
}
function makeItem(tplId, seed) {
  const t = TPL[tplId], it = t.make(M6.rng(seed));
  Object.assign(it, {tpl: tplId, seed, type: t.type, tag: t.tag, diff: t.diff, est: t.est, lesson: t.lesson, word: !!t.word});
  return normItem(it);
}
// Keypad keys for a number answer, from what the answer looks like
function keysFor(it) {
  if (it.keys) return it.keys;
  const a = Array.isArray(it.ans) ? "ratio" : String(it.ans);
  if (a === "ratio") return "ratio";
  let k = "int";
  if (/\//.test(a)) k = "frac"; else if (/\./.test(a)) k = "dec";
  if (/^[-−]/.test(a)) k += " neg";
  return k;
}

// ---------- The current question's answer state
let Q = null;           // {it, r: response, focus: input index, done, g: grade}
function startQ(it) { Q = {it, r: blankResponse(it), focus: 0, done: false, g: null, t0: Date.now(), hints: 0}; S.explore.types[it.type] = 1; return Q; }
function blankResponse(it) {
  switch (it.type) {
    case "mc": return null;
    case "multi": return [];
    case "num": return [""];
    case "table": return it.blanks.map(() => "");
    case "grid": return 0;
    case "order": return [];
    case "match": return {};
    case "yn": return it.rows.map(() => null);
    case "mistake": return {step: null, fix: null};
    case "explain": return {text: "", score: null};
    default: return QTYPES[it.type] ? QTYPES[it.type].blank(it) : null;
  }
}
const QTYPES = {};      // extra types registered by later units: {blank, html, grade, keys}

// ---------- Showing a question
const dots = d => `<span class="dots" title="${["Warm-up", "Standard", "Stretch"][d - 1]}">${"●".repeat(d)}${"○".repeat(3 - d)}</span>`;
function qHTML(opts = {}) {
  const it = Q.it, lock = Q.done;
  const head = `<div class="qhead"><span class="pill">${esc(it.tag || "PRACTICE")}</span>${it.diff ? dots(it.diff) : ""}${it.word ? '<span class="pill w">WORD PROBLEM</span>' : ""}<span class="sp"></span><button type="button" class="ico" data-act="say" aria-label="Read the question aloud">🔊</button>${opts.scratch !== false ? '<button type="button" class="ico" data-act="scratch" aria-label="Scratchpad">✎</button>' : ""}</div>`;
  const stem = `<div class="stem">${it.stem}</div>${it.board ? `<div class="qboard">${board(it.board)}</div>` : ""}`;
  return `<div class="q" data-type="${it.type}">${head}${stem}<div class="qa">${answerHTML(it, lock)}</div>${needsKeypad(it) && !lock ? keypadHTML(keysFor(it)) : ""}<div id="scratch"></div><div class="qfb" id="qfb" aria-live="polite">${Q.g ? feedbackHTML(it, Q.g, opts) : ""}</div></div>`;
}
const needsKeypad = it => it.type === "num" || it.type === "table" || (QTYPES[it.type] && QTYPES[it.type].keys);
function inputHTML(i, val, lock, label) {
  const f = Q ? Q.focus : 0;
  return `<input class="ans${f === i ? " focus" : ""}" data-i="${i}" value="${esc(val)}" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${esc(label || "Answer")}"${lock ? " readonly" : ""}>`;
}
function answerHTML(it, lock) {
  const r = Q.r, g = Q.g;
  switch (it.type) {
    case "mc": return `<div class="choices">${it.choices.map((c, i) => {
      const cls = lock ? (c.ok ? " right" : r === i ? " wrong" : "") : r === i ? " sel" : "";
      return `<button type="button" class="choice${cls}" data-pick="${i}"${lock ? " disabled" : ""}><span class="key">${LETTERS[i]}</span><span>${mathHTML(c.t)}</span></button>`;
    }).join("")}</div>`;
    case "multi": return `<p class="hint-sm">Choose all that apply.</p><div class="choices">${it.opts.map((o, i) => {
      const on = r.includes(i), cls = lock ? (o.ok ? (on ? " right" : " missed") : on ? " wrong" : "") : on ? " sel" : "";
      return `<button type="button" class="choice multi${cls}" data-pick="${i}" aria-pressed="${on}"${lock ? " disabled" : ""}><span class="key">${on ? "☑" : "☐"}</span><span>${mathHTML(o.t)}</span></button>`;
    }).join("")}</div>`;
    case "num": return `<div class="numrow">${it.pre ? `<span class="affix">${esc(it.pre)}</span>` : ""}${inputHTML(0, r[0], lock, "Your answer")}${it.post ? `<span class="affix">${esc(it.post)}</span>` : it.unit === "%" ? '<span class="affix">%</span>' : ""}</div>`;
    case "table": {
      let k = 0;
      return `<div class="tablewrap"><table class="rt qrt"><tbody>${it.rows.map((row, ri) => `<tr><th scope="row">${esc(row[0])}</th>${row.slice(1).map((v, ci) => {
        const bi = it.blanks.findIndex(b => b[0] === ri && b[1] === ci + 1);
        if (bi < 0) return `<td>${mathHTML(String(v))}</td>`;
        const cls = lock && g ? (g.cells[bi] ? " right" : " wrong") : "";
        return `<td class="blank${cls}">${inputHTML(bi, r[bi], lock, `${row[0]}, column ${ci + 1}`)}${lock && g && !g.cells[bi] ? `<span class="fix">${esc(String(v))}</span>` : ""}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    case "grid": {
      let s = `<svg class="bsvg grid100 pick" viewBox="0 0 212 212" role="img" aria-label="${r} of 100 squares shaded">`;
      for (let i = 0; i < 100; i++) s += `<rect class="${i < r ? "sq on" : "sq"}" data-cell="${i}" x="${6 + (i % 10) * 20}" y="${6 + Math.floor(i / 10) * 20}" width="19" height="19"/>`;
      return `${s}</svg><div class="row center"><span class="count">${r} shaded</span>${lock ? "" : '<button type="button" class="btn ghost sm" data-act="row+">+ row</button><button type="button" class="btn ghost sm" data-act="row-">− row</button><button type="button" class="btn ghost sm" data-act="clear">Clear</button>'}</div><p class="hint-sm">Tap a square to shade up to it.</p>`;
    }
    case "order": return `<p class="hint-sm">Tap them in order.</p><div class="ordered">${r.map((ix, n) => `<button type="button" class="chipbtn on" data-unpick="${n}"${lock ? " disabled" : ""}>${n + 1}. ${mathHTML(it.shown[ix])}</button>`).join("") || '<span class="hint-sm">…</span>'}</div><div class="pool">${it.shown.map((t, ix) => r.includes(ix) ? "" : `<button type="button" class="chipbtn" data-opick="${ix}"${lock ? " disabled" : ""}>${mathHTML(t)}</button>`).join("")}</div>${lock && g && !g.ok ? `<p class="fix">Right order: ${it.items.map(mathHTML).join(", ")}</p>` : ""}`;
    case "match": {
      const used = Object.values(r), pairNo = {}; Object.keys(r).forEach((li, n) => { pairNo["l" + li] = n + 1; pairNo["r" + r[li]] = n + 1; });
      return `<p class="hint-sm">Tap one on the left, then its partner on the right.</p><div class="match"><div>${it.pairs.map((p, i) => `<button type="button" class="chipbtn${Q.leftSel === i ? " sel" : ""}${pairNo["l" + i] ? " on" : ""}" data-left="${i}"${lock ? " disabled" : ""}>${pairNo["l" + i] ? `<b>${pairNo["l" + i]}</b> ` : ""}${mathHTML(p[0])}</button>`).join("")}</div><div>${it.rights.map((t, j) => `<button type="button" class="chipbtn${used.includes(j) ? " on" : ""}" data-right="${j}"${lock ? " disabled" : ""}>${pairNo["r" + j] ? `<b>${pairNo["r" + j]}</b> ` : ""}${mathHTML(t)}</button>`).join("")}</div></div>${lock && g && !g.ok ? `<p class="fix">Pairs: ${it.pairs.map(p => `${mathHTML(p[0])} ↔ ${mathHTML(p[1])}`).join("; ")}</p>` : ""}`;
    }
    case "yn": return `<div class="yn">${it.rows.map((row, i) => {
      const cls = lock ? (r[i] === row.ok ? " right" : " wrong") : "";
      return `<div class="ynrow${cls}"><span>${mathHTML(row.t)}</span><span class="ynb"><button type="button" class="btn sm ${r[i] === true ? "" : "ghost"}" data-yn="${i}:1"${lock ? " disabled" : ""}>Yes</button><button type="button" class="btn sm ${r[i] === false ? "" : "ghost"}" data-yn="${i}:0"${lock ? " disabled" : ""}>No</button></span>${lock && row.why ? `<span class="why">${mathHTML(row.why)}</span>` : ""}</div>`;
    }).join("")}</div>`;
    case "mistake": return `<p class="hint-sm">${r.step == null ? "Tap the step with the mistake." : "Now choose the fix."}</p><div class="steps">${it.steps.map((s, i) => {
      const cls = lock ? (i === it.wrong ? " wrong" : "") : r.step === i ? " sel" : "";
      return `<button type="button" class="choice${cls}" data-step="${i}"${lock ? " disabled" : ""}><span class="key">${i + 1}</span><span>${mathHTML(s)}</span></button>`;
    }).join("")}</div>${r.step != null ? `<div class="choices">${it.fixes.map((f, i) => {
      const cls = lock ? (f.ok ? " right" : r.fix === i ? " wrong" : "") : r.fix === i ? " sel" : "";
      return `<button type="button" class="choice${cls}" data-fix="${i}"${lock ? " disabled" : ""}><span class="key">${LETTERS[i]}</span><span>${mathHTML(f.t)}</span></button>`;
    }).join("")}</div>` : ""}`;
    case "explain": return `<textarea class="explain" id="explain" rows="4" placeholder="Explain in 1–3 sentences"${lock ? " readonly" : ""}>${esc(r.text)}</textarea>${lock ? `<div class="sample"><b>A strong answer:</b> ${mathHTML(it.sample)}<ul>${it.rubric.map(x => `<li>${mathHTML(x)}</li>`).join("")}</ul><div class="row">How many points did you get? ${[0, 1, 2].map(n => `<button type="button" class="btn sm ${r.score === n ? "" : "ghost"}" data-score="${n}">${n}</button>`).join("")}</div></div>` : ""}`;
    default: return QTYPES[it.type] ? QTYPES[it.type].html(it, r, lock, g) : "";
  }
}
function keypadHTML(keys) {
  const k = String(keys), extra = [];
  if (/dec|money|pct/.test(k)) extra.push(".");
  if (/neg/.test(k)) extra.push("−");
  if (/frac/.test(k)) extra.push("/", "␣");
  if (/ratio/.test(k)) extra.push(":");
  const b = x => x ? `<button type="button" class="kp" data-key="${esc(x)}" aria-label="${x === "␣" ? "space, for a mixed number" : x === "⌫" ? "delete" : x}">${x}</button>` : `<span class="kp-gap" aria-hidden="true"></span>`;
  // a calculator layout: digits in three columns, delete and the extra keys down the right and along the bottom
  const e = i => extra[i] || "", grid = ["7", "8", "9", "⌫", "4", "5", "6", e(0), "1", "2", "3", e(1), "0", e(2), e(3), e(4)];
  while (grid.length > 12 && !grid[grid.length - 1] && !grid[grid.length - 2] && !grid[grid.length - 3]) grid.length -= 3;   // drop an empty tail
  return `<div class="keypad" role="group" aria-label="Number keys">${grid.map(b).join("")}</div>`;
}
function typeKey(key) {
  if (!Q || Q.done) return;
  const box = $(`.ans[data-i="${Q.focus}"]`);
  let v = Q.it.type === "table" ? Q.r[Q.focus] : Q.r[0] || "";
  if (key === "⌫") v = v.slice(0, -1);
  else if (key === "␣") v = /\s$/.test(v) || !v ? v : v + " ";
  else if (key === "−") v = v.startsWith("−") ? v.slice(1) : "−" + v;
  else v += key;
  if (Q.it.type === "table") Q.r[Q.focus] = v; else Q.r[0] = v;
  if (box) box.value = v;
}

// ---------- Grading
function grade(it, r) {
  switch (it.type) {
    case "mc": { const c = it.choices[r]; return c ? {ok: c.ok, msg: c.why, mis: c.mis || null} : {ok: false, empty: true}; }
    case "multi": { const want = it.opts.map((o, i) => o.ok ? i : -1).filter(i => i >= 0); const ok = want.length === r.length && want.every(i => r.includes(i)); return {ok, empty: !r.length, partial: ok ? null : `${r.filter(i => it.opts[i].ok).length} of ${want.length} right choices picked`}; }
    case "num": {
      if (!String(r[0]).trim()) return {ok: false, empty: true};
      const spec = {ans: it.ans, form: it.form, unit: it.unit, simplest: it.simplest, traps: (it.traps || []).map(t => Array.isArray(t) ? {v: t[0], m: t[1], mis: t[2]} : t)};
      return M6.check(spec, r[0]);
    }
    case "table": { const cells = it.blanks.map(([ri, ci], k) => M6.check({ans: it.rows[ri][ci]}, r[k]).ok); return {ok: cells.every(Boolean), cells, empty: r.every(x => !String(x).trim())}; }
    case "grid": return {ok: r === it.n, empty: r === 0 && it.n !== 0};
    case "order": return {ok: r.length === it.items.length && r.every((ix, n) => it.shown[ix] === it.items[n]), empty: r.length < it.items.length};
    case "match": return {ok: it.pairs.every((p, i) => it.rights[r[i]] === p[1]), empty: Object.keys(r).length < it.pairs.length};
    case "yn": return {ok: it.rows.every((row, i) => r[i] === row.ok), empty: r.some(x => x === null)};
    case "mistake": { const f = it.fixes[r.fix]; return {ok: r.step === it.wrong && !!f && f.ok, empty: r.step == null || r.fix == null, msg: r.step !== it.wrong ? "That step is fine. Look for the one that breaks a rule." : f ? f.why : ""}; }
    case "explain": return {ok: r.score === 2, self: true, empty: !r.text.trim()};
    default: return QTYPES[it.type] ? QTYPES[it.type].grade(it, r) : {ok: false};
  }
}
// The right answer, written out
function answerText(it) {
  switch (it.type) {
    case "mc": return it.right;
    case "multi": return it.opts.filter(o => o.ok).map(o => o.t).join("; ");
    case "num": return Array.isArray(it.ans) ? it.ans.join(":") : (it.pre || "") + (it.show || String(it.ans)) + (it.post ? " " + it.post : it.unit === "%" ? "%" : "");
    case "table": return it.blanks.map(([ri, ci]) => String(it.rows[ri][ci])).join(", ");
    case "grid": return `${it.n} squares`;
    case "order": return it.items.join(", ");
    case "yn": return it.rows.map(r => r.ok ? "Yes" : "No").join(", ");
    case "mistake": return `Step ${it.wrong + 1}: ${(it.fixes.find(f => f.ok) || {}).t || ""}`;
    case "match": return it.pairs.map(p => `${p[0]} = ${p[1]}`).join(", ");
    case "explain": return "See the sample answer";
    default: return "";
  }
}
function solutionHTML(it) {
  return `<ol class="sol">${it.sol.map(x => `<li><span class="s">${mathHTML(x.s)}</span>${x.why ? `<span class="why">${mathHTML(x.why)}</span>` : ""}</li>`).join("")}</ol>`;
}
function feedbackHTML(it, g, opts = {}) {
  if (g.self) return "";
  const head = g.ok ? `<b class="okmsg">Right.</b>` : g.close ? `<b class="closemsg">Almost.</b>` : `<b class="nomsg">Not quite.</b> The answer is ${mathHTML(answerText(it))}.`;
  const msg = g.msg ? `<p class="fbmsg">${mathHTML(g.msg)}</p>` : g.partial ? `<p class="fbmsg">${esc(g.partial)}</p>` : "";
  const why = it.type === "mc" && !g.ok ? (() => { const c = it.choices.find(c => c.ok); return c && c.why ? `<p class="fbmsg">${mathHTML(c.why)}</p>` : ""; })() : it.type === "mc" && g.ok && it.whyRight ? `<p class="fbmsg">${mathHTML(it.whyRight)}</p>` : "";
  const show = g.ok ? (opts.showSolOnRight ? solutionHTML(it) : "") : g.close ? "" : solutionHTML(it);
  return `<div class="fb ${g.ok ? "good" : g.close ? "close" : "bad"}">${head}${msg}${why}${show}${show ? '<button type="button" class="btn ghost sm" data-act="saysol">🔊 Read the solution</button>' : ""}${!g.ok && !g.close && opts.slip ? '<button type="button" class="btn ghost sm" data-act="slip">It was a slip</button>' : ""}</div>`;
}
function hintsHTML(it, n) {
  const parts = [];
  if (n >= 1 && it.hints[0]) parts.push(`<p><b>Hint 1.</b> ${mathHTML(it.hints[0])}</p>`);
  if (n >= 2 && it.hints[1]) parts.push(`<p><b>Hint 2: first step.</b> ${mathHTML(it.hints[1])}</p>`);
  if (n >= 3) parts.push(`<div><b>Full solution.</b>${solutionHTML(it)}</div>`);
  return parts.join("");
}
function sayQuestion(it) {
  const parts = [plain(it.stem)];
  if (it.type === "mc") it.choices.forEach((c, i) => parts.push(`${LETTERS[i]}. ${c.t}.`));
  if (it.type === "multi") it.opts.forEach(o => parts.push(o.t + "."));
  if (it.type === "yn") it.rows.forEach(r => parts.push(r.t + "."));
  Voice.play(parts);
}

// ---------- Scratchpad: a drawing layer on grid paper (Apple Pencil or finger)
function scratchOpen() {
  const el = $("#scratch"); if (!el) return;
  if (el.innerHTML) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="scratch"><canvas id="pad" width="1200" height="520"></canvas><div class="row"><button type="button" class="btn ghost sm" data-act="padclear">Clear</button><button type="button" class="btn ghost sm" data-act="scratch">Close</button></div></div>`;
  const c = $("#pad"), x = c.getContext("2d");
  x.lineWidth = 3; x.lineCap = "round"; x.strokeStyle = getComputedStyle(document.body).color;
  let down = false;
  const pt = e => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) * c.width / b.width, (e.clientY - b.top) * c.height / b.height]; };
  c.addEventListener("pointerdown", e => { down = true; c.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(...pt(e)); });
  c.addEventListener("pointermove", e => { if (!down) return; x.lineTo(...pt(e)); x.stroke(); });
  c.addEventListener("pointerup", () => { down = false; });
}
