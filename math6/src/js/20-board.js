// ---------- Whiteboard models. Each takes plain data and returns HTML or SVG, so lessons and questions share them.
// Units 2-10 add their models in their own files (for example 25-models-fractions.js) by adding to MODELS.
const mathHTML = s => esc(s)
  .replace(/(^|[^\d.:\/])(\d+)\/(\d+)(?![\d\/])/g, (m, pre, a, b) => `${pre}<span class="fr"><span>${a}</span><span>${b}</span></span>`)
  .replace(/\^(\d)/g, "<sup>$1</sup>");
const MODELS = {
  // A title card for hooks and big ideas
  words: b => `<div class="bw"><div class="bw-big">${mathHTML(b.big || "")}</div>${b.small ? `<div class="bw-small">${mathHTML(b.small)}</div>` : ""}</div>`,
  // Lines of math; hl marks the line being explained
  eq: b => `<div class="beq">${(b.lines || []).map((l, i) => `<div class="beq-l${i === b.hl ? " hl" : ""}${(b.strike || []).includes(i) ? " strike" : ""}">${mathHTML(l)}</div>`).join("")}</div>`,
  // Ratio table: rows of [label, values...]; hl = value column to highlight; ops = [[fromCol, toCol, "x5"]] shown above the table
  rt: b => {
    const rows = b.rows || [], ncol = Math.max(...rows.map(r => r.length)) - 1, hide = b.hide || [], hl = [].concat(b.hl == null ? [] : b.hl);
    const ops = (b.ops || []).map(([f, t, txt]) => `<span class="rt-op" style="grid-column:${f + 1} / ${t + 2}">${esc(txt)}</span>`).join("");
    return `<div class="brt">${ops ? `<div class="rt-ops" style="grid-template-columns:repeat(${ncol + 1},1fr)"><span></span>${ops}</div>` : ""}<table class="rt"><tbody>${rows.map((r, ri) =>
      `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((v, ci) => {
        const hidden = hide.some(h => h[0] === ri && h[1] === ci + 1);
        return `<td class="${hl.includes(ci + 1) ? "hl" : ""}">${hidden ? "?" : mathHTML(String(v))}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
  },
  // Double number line: two scales that line up. top/bot = [label, ...values]; positions follow the top values.
  dnl: b => {
    const top = b.top.slice(1), bot = b.bot.slice(1), max = Math.max(...top.map(Number).filter(n => !isNaN(n)), 1);
    const W = 640, x0 = 120, x1 = 610, X = v => x0 + (x1 - x0) * (Number(v) / max), hide = b.hide || [];
    const posOf = i => isNaN(Number(top[i])) ? x0 + (x1 - x0) * i / (top.length - 1) : X(top[i]);
    let s = `<svg class="bsvg" viewBox="0 0 ${W} 150" role="img" aria-label="Double number line">`;
    s += `<text class="lbl" x="10" y="52">${esc(b.top[0])}</text><text class="lbl" x="10" y="112">${esc(b.bot[0])}</text>`;
    s += `<line class="axis" x1="${x0 - 10}" y1="60" x2="${x1 + 10}" y2="60"/><line class="axis" x1="${x0 - 10}" y1="100" x2="${x1 + 10}" y2="100"/>`;
    top.forEach((v, i) => {
      const x = posOf(i), on = i === b.hl;
      s += `<line class="tick${on ? " on" : ""}" x1="${x}" y1="52" x2="${x}" y2="68"/><line class="tick${on ? " on" : ""}" x1="${x}" y1="92" x2="${x}" y2="108"/>`;
      if (on) s += `<line class="link" x1="${x}" y1="68" x2="${x}" y2="92"/>`;
      s += `<text class="val${on ? " on" : ""}" x="${x}" y="42" text-anchor="middle">${hide.includes("t" + i) ? "?" : esc(v)}</text>`;
      s += `<text class="val${on ? " on" : ""}" x="${x}" y="130" text-anchor="middle">${hide.includes("b" + i) ? "?" : esc(bot[i])}</text>`;
    });
    return s + "</svg>";
  },
  // Tape diagram: rows of [label, parts, valueShownInEachPart?]; total = text beside a brace
  tape: b => {
    const rows = b.rows || [], maxParts = Math.max(...rows.map(r => r[1])), W = 640, x0 = 110, pw = Math.min(56, (W - x0 - 20) / maxParts), h = 40;
    let s = `<svg class="bsvg" viewBox="0 0 ${W} ${rows.length * 58 + 30}" role="img" aria-label="Tape diagram">`;
    rows.forEach((r, i) => {
      const y = 16 + i * 58;
      s += `<text class="lbl" x="10" y="${y + 26}">${esc(r[0])}</text>`;
      for (let k = 0; k < r[1]; k++) s += `<rect class="part p${i % 4}" x="${x0 + k * pw}" y="${y}" width="${pw - 2}" height="${h}" rx="4"/>${r[2] != null ? `<text class="pv" x="${x0 + k * pw + pw / 2 - 1}" y="${y + 26}" text-anchor="middle">${esc(r[2])}</text>` : ""}`;
      if (r[3]) s += `<text class="lbl" x="${x0 + r[1] * pw + 10}" y="${y + 26}">${esc(r[3])}</text>`;
    });
    return s + "</svg>";
  },
  // 10x10 percent grid with n squares shaded
  grid: b => {
    let s = `<svg class="bsvg grid100" viewBox="0 0 212 212" role="img" aria-label="${b.n} of 100 squares shaded">`;
    for (let i = 0; i < 100; i++) s += `<rect class="${i < b.n ? "sq on" : "sq"}" x="${6 + (i % 10) * 20}" y="${6 + Math.floor(i / 10) * 20}" width="19" height="19"/>`;
    return s + "</svg>";
  },
  // Points on a first-quadrant graph, optionally joined by a line through (0, 0)
  pts: b => {
    const pts = b.pts || [], mx = Math.max(...pts.map(p => p[0]), 1), my = Math.max(...pts.map(p => p[1]), 1), W = 360, H = 260;
    const X = v => 50 + (W - 70) * v / (mx * 1.15), Y = v => H - 40 - (H - 70) * v / (my * 1.15);
    let s = `<svg class="bsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph of points">`;
    s += `<line class="axis" x1="50" y1="${H - 40}" x2="${W - 10}" y2="${H - 40}"/><line class="axis" x1="50" y1="${H - 40}" x2="50" y2="14"/>`;
    s += `<text class="lbl" x="${W - 12}" y="${H - 14}" text-anchor="end">${esc(b.xl || "x")}</text><text class="lbl" x="56" y="22">${esc(b.yl || "y")}</text>`;
    // line: true draws through (0, 0) and the farthest point; a number draws y = line × x, for showing a point that is off the line
    if (b.line) { const k = typeof b.line === "number" ? b.line : my / mx, xe = Math.min(mx * 1.1, my * 1.1 / k); s += `<line class="link" x1="${X(0)}" y1="${Y(0)}" x2="${X(xe)}" y2="${Y(k * xe)}"/>`; }
    pts.forEach(([x, y]) => { s += `<circle class="dot" cx="${X(x)}" cy="${Y(y)}" r="6"/><text class="val" x="${X(x) + 9}" y="${Y(y) - 9}">(${x}, ${y})</text>`; });
    return s + "</svg>";
  }
};
function board(b) {
  if (!b) return "";
  const f = MODELS[b.m];
  return f ? `<div class="board-in" data-m="${esc(b.m)}">${f(b)}</div>` : "";
}
