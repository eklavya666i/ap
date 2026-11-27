// ---------- Fresh-number question templates. Each make(R) returns an item; numbers change with the seed.
// Item kinds: er = expression + excluded values, e = expression, f = factor, v = excluded values,
// s = solutions, p = points, n = number. Traps are named mistakes (they double as multiple-choice options).
function rng(seed) {
  let a = (seed >>> 0) || 1;
  const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const i = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  return {f, i, nz: (lo, hi) => { let v = 0; while (!v) v = i(lo, hi); return v; }, pick: a => a[Math.floor(f() * a.length)]};
}
const gcdi = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lin = k => k === 0 ? 'x' : 'x' + (k < 0 ? '-' : '+') + Math.abs(k);
const bin = (a, b) => { const m = a === 1 ? 'x' : a === -1 ? '-x' : a === 0 ? '' : a + 'x'; if (!m) return String(b); return b === 0 ? m : m + (b < 0 ? '-' : '+') + Math.abs(b); };
const poly = (c2, c1, c0) => { let s = c2 === 1 ? 'x^2' : c2 === -1 ? '-x^2' : c2 + 'x^2'; if (c1) s += (c1 < 0 ? '-' : '+') + (Math.abs(c1) === 1 ? '' : Math.abs(c1)) + 'x'; if (c0) s += (c0 < 0 ? '-' : '+') + Math.abs(c0); return s; };
const fr = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcdi(p, q) || 1; p /= g; q /= g; return q === 1 ? String(p) : p + '/' + q; };
const par = v => (v < 0 ? '(' + v + ')' : String(v));
const F = (a, b) => `\\f{${a}}{${b}}`;
const VT = s => fmtV(EX.val(String(s)));          // value -> math markup
const NE = vs => 'x\\ne ' + vs.map(String).sort((p, q) => EX.val(p) - EX.val(q)).map(VT).join(',\\ ');
const TPLS = [], TPL = {};
function tpl(o) { TPLS.push(o); TPL[o.id] = o; }

/* ============ Factoring ============ */
tpl({id: 'f-dsq', s: 'fac', d: 1, name: 'Difference of squares', make(R) {
  const a = R.i(2, 12), c = a * a, e = 'x^2-' + c, ans = `(x-${a})(x+${a})`;
  return {k: 'f', q: `Factor completely: ${ML(e)}`, ans: {e: ans}, chk: {e},
    traps: [{e: `(x-${a})^2`, why: `$(x-${a})^2=${TEXL(poly(1, -2 * a, c))}$ has a middle term.`, id: 'square_not_difference', cat: 'concept'},
      {e: `(x+${a})^2`, why: `$(x+${a})^2$ has a middle term too.`, id: 'square_not_difference', cat: 'concept'},
      {e: `(x-${c})(x+1)`, why: `That multiplies to $${TEXL(poly(1, 1 - c, -c))}$.`, id: 'wrong_pair', cat: 'procedure'}],
    h: ['Two perfect squares with a minus between them.', `It's $x^2-${a}^2$, so use $a^2-b^2=(a-b)(a+b)$.`],
    x: [[`x^2-${c}=x^2-${a}^2`, 'A difference of squares.'], [`(x-${a})(x+${a})`, '']]};
}});
tpl({id: 'f-tri', s: 'fac', d: 1, name: 'Trinomial', make(R) {
  let r, s; do { r = R.nz(-9, 9); s = R.nz(-9, 9); } while (r === s || r === -s);
  const e = poly(1, r + s, r * s), ans = `(${lin(r)})(${lin(s)})`;
  return {k: 'f', q: `Factor completely: ${ML(e)}`, ans: {e: ans}, chk: {e},
    traps: [{e: `(${lin(-r)})(${lin(-s)})`, why: `Signs flipped: that's $${TEXL(poly(1, -(r + s), r * s))}$.`, id: 'sign', cat: 'slip'},
      {e: `(${lin(r)})(${lin(-s)})`, why: `That's $${TEXL(poly(1, r - s, -r * s))}$ — check the product sign.`, id: 'wrong_pair', cat: 'procedure'},
      {e: `(${lin(-r)})(${lin(s)})`, why: `That's $${TEXL(poly(1, s - r, -r * s))}$.`, id: 'wrong_pair', cat: 'procedure'}],
    h: [`Find two numbers that multiply to $${r * s}$ and add to $${r + s}$.`, `They are $${r}$ and $${s}$.`],
    x: [[`${r}\\cdot ${par(s)}=${r * s},\\ \\ ${r}+${par(s)}=${r + s}`, 'Product and sum.'], [`(${lin(r)})(${lin(s)})`, '']]};
}});
tpl({id: 'f-ac', s: 'fac', d: 2, name: 'ac-method', make(R) {
  let a, b, c, d; do { a = R.pick([2, 3, 5]); c = R.pick([2, 3]); b = R.nz(-5, 5); d = R.nz(-5, 5); } while (a === c || gcdi(a, b) !== 1 || gcdi(c, d) !== 1 || a * d + b * c === 0 || b === d);
  const A = a * c, B = a * d + b * c, C = b * d, e = poly(A, B, C), f1 = bin(a, b), f2 = bin(c, d);
  const g1 = a + 'x' + (a * d < 0 ? '' : '') , split = `${A}x^2${a * d < 0 ? '-' : '+'}${Math.abs(a * d)}x${b * c < 0 ? '-' : '+'}${Math.abs(b * c)}x${C < 0 ? '-' : '+'}${Math.abs(C)}`;
  return {k: 'f', q: `Factor completely: ${ML(e)}`, ans: {e: `(${f1})(${f2})`}, chk: {e},
    traps: [{e: `(${bin(a, -b)})(${bin(c, -d)})`, why: 'Signs flipped — FOIL it and the middle term comes out wrong.', id: 'sign', cat: 'slip'},
      {e: `(${bin(a, d)})(${bin(c, b)})`, why: `Constants swapped: that's $${TEXL(poly(A, a * b + c * d, C))}$.`, id: 'wrong_pair', cat: 'procedure'},
      {e: `(${bin(A, b)})(${bin(1, d)})`, why: 'The leading coefficient splits between both brackets — FOIL to check.', id: 'wrong_pair', cat: 'procedure'}],
    h: [`ac-method: $${A}\\cdot ${par(C)}=${A * C}$. Find two numbers with product $${A * C}$ and sum $${B}$.`, `They are $${a * d}$ and $${b * c}$. Split the middle term: $${split}$.`],
    x: [[split, `Split $${B}x$ using $${a * d}$ and $${b * c}$.`], [`${a}x(${f2})${b < 0 ? '-' : '+'}${Math.abs(b)}(${f2})`, 'Group in pairs.'], [`(${f1})(${f2})`, 'Pull out the common bracket. FOIL to check.']]};
}});
tpl({id: 'f-gcf', s: 'fac', d: 2, name: 'GCF first', make(R) {
  const k = R.pick([2, 3, 5]), a = R.i(2, 9), e = poly(k, 0, -k * a * a), ans = `${k}(x-${a})(x+${a})`;
  return {k: 'f', q: `Factor completely: ${ML(e)}`, ans: {e: ans}, chk: {e},
    traps: [{e: `${k}(x^2-${a * a})`, eqv: 1, why: `Not complete: $x^2-${a * a}$ still factors.`, id: 'not_complete', cat: 'procedure'},
      {e: `${k}(x-${a})^2`, why: `$${k}(x-${a})^2$ has a middle term.`, id: 'square_not_difference', cat: 'concept'},
      {e: `(${k}x-${a})(x+${a})`, why: `That multiplies to $${TEXL(poly(k, k * a - a, -a * a))}$.`, id: 'wrong_pair', cat: 'procedure'}],
    h: ['Take out the GCF first, then look again.', `$${TEXL(e)}=${k}(x^2-${a * a})$ — and that bracket is a difference of squares.`],
    x: [[`${k}(x^2-${a * a})`, 'GCF first.'], [`${k}(x-${a})(x+${a})`, 'Then the difference of squares.']]};
}});

/* ============ Simplify & domain ============ */
tpl({id: 's-sq', s: 'simp', d: 1, name: 'Squares over a perfect square', make(R) {
  const a = R.i(2, 12), e = `(x^2-${a * a})/(${poly(1, 2 * a, a * a)})`, ans = `(x-${a})/(x+${a})`;
  return {k: 'er', q: `Simplify and state the excluded values: ${ML(e)}`, ans: {e: ans}, rz: [`-${a}`], nz: [`${a}`], chk: {e, dens: [poly(1, 2 * a, a * a)]},
    traps: [{e: ans, v: [`-${a}`, `${a}`], why: `$x=${a}$ only makes the numerator 0 — that's allowed.`, id: 'numerator_zero', cat: 'concept'},
      {e: `-${a * a}/(${2 * a}x+${a * a})`, v: [fr(-a, 2)], why: 'You canceled the $x^2$ terms. Only factors cancel, never terms.', id: 'canceled_terms', cat: 'concept'},
      {e: `(x+${a})/(x-${a})`, v: [`${a}`], why: `Upside down — one $(x+${a})$ stays in the denominator.`, id: 'upside_down', cat: 'procedure'}],
    h: ['Factor the top (difference of squares) and the bottom (perfect square).', `Bottom: $${TEXL(poly(1, 2 * a, a * a))}=(x+${a})^2$, so exclude $x=-${a}$.`],
    x: [[F(`(x-${a})(x+${a})`, `(x+${a})^2`), 'Factor completely.'], [`x+${a}\\ne0\\Rightarrow x\\ne-${a}`, 'Restrictions come from the original denominator.'], [F(`x-${a}`, `x+${a}`), `Cancel one $(x+${a})$.`]]};
}});
tpl({id: 's-com', s: 'simp', d: 1, name: 'Cancel a common binomial', make(R) {
  let a, b, c; do { a = R.nz(-9, 9); b = R.nz(-9, 9); c = R.nz(-9, 9); } while (a === b || b === c || a === c);
  const N = poly(1, a + b, a * b), D = poly(1, a + c, a * c), e = `(${N})/(${D})`, ans = `(${lin(b)})/(${lin(c)})`;
  const ct = a + c !== 0 ? [fr(-a * c, a + c)] : [];
  return {k: 'er', q: `Simplify and state the excluded values: ${ML(e)}`, ans: {e: ans}, rz: [`${-a}`, `${-c}`], cz: [`${-a}`], nz: [`${-b}`], chk: {e, dens: [D]},
    traps: [{e: ans, v: [`${-c}`], why: `$x=${-a}$ was canceled, but it still makes the original denominator 0.`, id: 'lost_restriction', cat: 'concept'},
      {e: `(${lin(a)})/(${lin(c)})`, why: `$(${lin(a)})$ is the shared factor — cancel it and keep $(${lin(b)})$.`, id: 'canceled_wrong', cat: 'procedure'},
      {e: `(${bin(a + b, a * b)})/(${bin(a + c, a * c)})`, v: ct, why: 'You canceled the $x^2$ terms. Only factors cancel.', id: 'canceled_terms', cat: 'concept'}],
    h: [`Factor the top and bottom. Look for the bracket they share.`, `Top: $(${lin(a)})(${lin(b)})$. Bottom: $(${lin(a)})(${lin(c)})$.`],
    x: [[F(`(${lin(a)})(${lin(b)})`, `(${lin(a)})(${lin(c)})`), 'Factor.'], [NE([`${-a}`, `${-c}`]), 'Every factor of the original denominator.'], [F(lin(b), lin(c)), `Cancel $(${lin(a)})$.`]]};
}});
tpl({id: 's-ac', s: 'simp', d: 2, name: 'ac-method (Sheet #2)', make(R) {
  let p, q, r, s; do { p = R.pick([2, 3]); q = R.i(1, 5); r = R.pick([1, 2, 3]); s = R.nz(-5, 5); } while (gcdi(p, q) !== 1 || gcdi(r, s) !== 1 || s * p === q * r || s * p === -q * r);
  const N = poly(p * p, 0, -q * q), D = poly(r * p, r * q - s * p, -s * q), e = `(${N})/(${D})`, ans = `(${bin(p, -q)})/(${bin(r, -s)})`;
  return {k: 'er', q: `Simplify and state the excluded values: ${ML(e)}`, ans: {e: ans}, rz: [fr(-q, p), fr(s, r)], cz: [fr(-q, p)], nz: [fr(q, p)], chk: {e, dens: [D]},
    traps: [{e: ans, v: [fr(s, r)], why: `The canceled factor $(${bin(p, q)})$ still makes the original denominator 0 at $x=${VT(fr(-q, p))}$.`, id: 'lost_restriction', cat: 'concept'},
      {e: `(${bin(p, q)})/(${bin(r, -s)})`, why: `$(${bin(p, q)})$ is the shared factor — cancel it, not $(${bin(p, -q)})$.`, id: 'canceled_wrong', cat: 'procedure'},
      {e: `(${bin(p, -q)})/(${bin(r, s)})`, v: [fr(-q, p), fr(-s, r)], why: 'Sign slip factoring the bottom — FOIL to check.', id: 'sign', cat: 'slip'}],
    h: ['Top: difference of squares. Bottom: ac-method.', `Bottom factors as $(${bin(r, -s)})(${bin(p, q)})$.`],
    x: [[F(`(${bin(p, -q)})(${bin(p, q)})`, `(${bin(r, -s)})(${bin(p, q)})`), 'Factor both.'], [NE([fr(-q, p), fr(s, r)]), 'Both bottom factors give restrictions.'], [F(bin(p, -q), bin(r, -s)), `Cancel $(${bin(p, q)})$.`]]};
}});
tpl({id: 's-opp', s: 'simp', d: 2, name: 'Opposite factors', make(R) {
  const a = R.i(2, 9), e = `(${a}-x)/(x^2-${a * a})`, ans = `-1/(x+${a})`;
  return {k: 'er', q: `Simplify and state the excluded values: ${ML(e)}`, ans: {e: ans}, rz: [`-${a}`, `${a}`], cz: [`${a}`], chk: {e, dens: [`x^2-${a * a}`]},
    traps: [{e: `1/(x+${a})`, why: `$${a}-x=-(x-${a})$, so a $-1$ survives the cancel.`, id: 'opposites', cat: 'slip'},
      {e: ans, v: [`-${a}`], why: `$x=${a}$ still makes the original denominator 0.`, id: 'lost_restriction', cat: 'concept'},
      {e: `-1/(x-${a})`, why: `The canceled factor is $(x-${a})$; $(x+${a})$ stays.`, id: 'canceled_wrong', cat: 'procedure'}],
    h: [`Rewrite $${a}-x$ as $-(x-${a})$.`, `Bottom: $(x-${a})(x+${a})$. Now cancel $(x-${a})$.`],
    x: [[F(`-(x-${a})`, `(x-${a})(x+${a})`), 'Pull out −1 and factor.'], [`x\\ne\\pm${a}`, ''], [`-${F(1, `x+${a}`)}`, '']]};
}});
tpl({id: 's-dom', s: 'simp', d: 1, name: 'Domain', make(R) {
  let a, b, k; do { a = R.nz(-8, 8); b = R.nz(-8, 8); k = R.nz(-8, 8); } while (a === b || a === -b || k === a || k === b);
  const D = poly(1, -(a + b), a * b), e = `(${lin(-k)})/(${D})`;
  return {k: 'v', q: `Which values are excluded from the domain of ${ML(e)}?`, ans: {v: [`${a}`, `${b}`]}, nz: [`${k}`], chk: {dens: [D]},
    traps: [{v: [`${a}`, `${b}`, `${k}`], why: `$x=${k}$ only makes the numerator 0.`, id: 'numerator_zero', cat: 'concept'},
      {v: [`${-a}`, `${-b}`], why: `Sign slip: $${TEXL(lin(-a))}=0$ means $x=${a}$.`, id: 'sign', cat: 'slip'},
      {v: [`${a}`], why: `Missing $x=${b}$ — factor the whole denominator.`, id: 'missing_value', cat: 'procedure'}],
    h: ['Only the denominator matters. Factor it and set each factor to 0.', `$${TEXL(D)}=(${lin(-a)})(${lin(-b)})$.`],
    x: [[`${D}=(${lin(-a)})(${lin(-b)})`, 'Factor the denominator.'], [NE([`${a}`, `${b}`]), 'The numerator never restricts.']]};
}});

/* ============ Multiply & divide ============ */
tpl({id: 'm-mul', s: 'md', d: 1, name: 'Multiply and cancel', make(R) {
  let a, b, c, d; do { a = R.nz(-7, 7); b = R.nz(-7, 7); c = R.nz(-7, 7); d = R.nz(-7, 7); } while (new Set([a, b, c, d]).size < 4);
  const N2 = poly(1, b + c, b * c), D2 = poly(1, a + d, a * d), ans = `(${lin(c)})/(${lin(d)})`;
  return {k: 'er', q: `Simplify and state the excluded values: $${F(lin(a), lin(b))}\\cdot${F(N2, D2)}$`, ans: {e: ans}, rz: [`${-a}`, `${-b}`, `${-d}`], cz: [`${-a}`, `${-b}`], nz: [`${-c}`],
    chk: {e: `((${lin(a)})/(${lin(b)}))*((${N2})/(${D2}))`, dens: [lin(b), D2]},
    traps: [{e: ans, v: [`${-d}`], why: 'Canceled factors still restrict — list every original denominator factor.', id: 'lost_restriction', cat: 'concept'},
      {e: `((${lin(a)})(${lin(c)}))/((${lin(b)})(${lin(d)}))`, why: `Cancel across the multiplication: $(${lin(a)})$ and $(${lin(b)})$ cancel too.`, id: 'not_canceled', cat: 'procedure'},
      {e: `(${lin(d)})/(${lin(c)})`, v: [`${-a}`, `${-b}`, `${-c}`], why: 'Upside down.', id: 'upside_down', cat: 'procedure'}],
    h: ['Factor the second fraction, then cancel any top factor with any bottom factor.', `$${TEXL(N2)}=(${lin(b)})(${lin(c)})$ and $${TEXL(D2)}=(${lin(a)})(${lin(d)})$.`],
    x: [[`${F(lin(a), lin(b))}\\cdot${F(`(${lin(b)})(${lin(c)})`, `(${lin(a)})(${lin(d)})`)}`, 'Factor.'], [NE([`${-a}`, `${-b}`, `${-d}`]), 'All original denominator factors.'], [F(lin(c), lin(d)), 'Cancel.']]};
}});
tpl({id: 'm-div', s: 'md', d: 2, name: 'Divide (Sheet #5)', make(R) {
  let k, a, b; do { k = R.i(2, 5); a = R.nz(-6, 6); b = R.nz(-6, 6); } while (a === b);
  const N1 = poly(k, k * a, 0), N2 = poly(1, a + b, a * b), D2 = poly(1, 2 * b, b * b), ans = `${k}x`;
  return {k: 'er', q: `Simplify and state the excluded values: $${F(N1, lin(b))}\\div${F(N2, D2)}$`, ans: {e: ans}, rz: [`${-a}`, `${-b}`], dz: [`${-a}`], nz: ['0'],
    chk: {e: `((${N1})/(${lin(b)}))/((${N2})/(${D2}))`, dens: [lin(b), D2, N2]},
    traps: [{e: ans, v: [`${-b}`], why: "Dividing: the divisor's numerator can't be 0 either.", id: 'divisor_numerator', cat: 'concept'},
      {e: `(${k}x(${lin(a)})^2)/((${lin(b)})^2)`, why: 'You multiplied without flipping the divisor.', id: 'no_flip', cat: 'concept'},
      {e: `1/(${k}x)`, why: 'You flipped the wrong fraction — flip the divisor (the second one).', id: 'wrong_flip', cat: 'concept'}],
    h: ['Factor everything, then keep–change–flip.', `$${TEXL(N1)}=${k}x(${lin(a)})$, $${TEXL(N2)}=(${lin(a)})(${lin(b)})$, $${TEXL(D2)}=(${lin(b)})^2$.`],
    x: [[`${F(`${k}x(${lin(a)})`, lin(b))}\\cdot${F(`(${lin(b)})^2`, `(${lin(a)})(${lin(b)})`)}`, 'Factor and flip the divisor.'], [NE([`${-a}`, `${-b}`]), "Denominators, plus the divisor's numerator."], [`${k}x`, 'Everything else cancels.']]};
}});
tpl({id: 'm-bin', s: 'md', d: 2, name: 'Divide by a binomial', make(R) {
  let a, b; do { a = R.i(2, 9); b = R.nz(-9, 9); } while (b === a || b === -a);
  const ans = `(x+${a})/(${lin(b)})`;
  return {k: 'er', q: `Simplify and state the excluded values: $${F(`x^2-${a * a}`, lin(b))}\\div(x-${a})$`, ans: {e: ans}, rz: [`${-b}`, `${a}`], dz: [`${a}`], nz: [`-${a}`],
    chk: {e: `((x^2-${a * a})/(${lin(b)}))/(x-${a})`, dens: [lin(b), `x-${a}`]},
    traps: [{e: ans, v: [`${-b}`], why: `Dividing by $(x-${a})$ means $x\\ne${a}$.`, id: 'divisor_numerator', cat: 'concept'},
      {e: `((x-${a})^2(x+${a}))/(${lin(b)})`, why: `You multiplied by $(x-${a})$ instead of dividing.`, id: 'no_flip', cat: 'concept'},
      {e: `(x-${a})/(${lin(b)})`, why: `$(x-${a})$ cancels; $(x+${a})$ stays.`, id: 'canceled_wrong', cat: 'procedure'}],
    h: [`Dividing by $(x-${a})$ means multiplying by $${F(1, `x-${a}`)}$.`, `$x^2-${a * a}=(x-${a})(x+${a})$.`],
    x: [[`${F(`(x-${a})(x+${a})`, lin(b))}\\cdot${F(1, `x-${a}`)}`, ''], [NE([`${-b}`, `${a}`]), ''], [F(`x+${a}`, lin(b)), '']]};
}});

/* ============ Add & subtract ============ */
tpl({id: 'a-add', s: 'as', d: 2, name: 'Unlike denominators', make(R) {
  let m, n, a, b; do { m = R.i(1, 6); n = R.i(1, 6); a = R.nz(-7, 7); b = R.nz(-7, 7); } while (m === n || a === b);
  const N1 = m + n, N0 = m * b + n * a, ans = `(${bin(N1, N0)})/((${lin(a)})(${lin(b)}))`;
  return {k: 'er', q: `Add and state the excluded values: $${F(m, lin(a))}+${F(n, lin(b))}$`, ans: {e: ans}, rz: [`${-a}`, `${-b}`], nz: [fr(-N0, N1)], chk: {e: `${m}/(${lin(a)})+${n}/(${lin(b)})`, dens: [lin(a), lin(b)]},
    traps: [{e: `${N1}/(${bin(2, a + b)})`, why: 'Never add denominators.', id: 'added_denominators', cat: 'concept'},
      {e: `${N1}/((${lin(a)})(${lin(b)}))`, why: 'The numerators have to be built up too.', id: 'not_built_up', cat: 'procedure'},
      {e: `(${bin(N1, m * a + n * b)})/((${lin(a)})(${lin(b)}))`, why: 'Each fraction gets multiplied by the OTHER factor.', id: 'built_wrong', cat: 'procedure'}],
    h: [`LCD: $(${lin(a)})(${lin(b)})$.`, `$${F(`${m}(${lin(b)})+${n}(${lin(a)})`, `(${lin(a)})(${lin(b)})`)}$`],
    x: [[F(`${m}(${lin(b)})+${n}(${lin(a)})`, `(${lin(a)})(${lin(b)})`), 'Build each fraction to the LCD.'], [F(bin(N1, N0), `(${lin(a)})(${lin(b)})`), 'Combine like terms.'], [NE([`${-a}`, `${-b}`]), '']]};
}});
tpl({id: 'a-sub', s: 'as', d: 2, name: 'Subtract: distribute the minus', make(R) {
  let m, n, a, b; do { m = R.i(1, 7); n = R.i(1, 7); a = R.nz(-7, 7); b = R.nz(-7, 7); } while (m === n || a === b);
  const N1 = m - n, N0 = m * b - n * a, ans = `(${bin(N1, N0)})/((${lin(a)})(${lin(b)}))`;
  return {k: 'er', q: `Subtract and state the excluded values: $${F(m, lin(a))}-${F(n, lin(b))}$`, ans: {e: ans}, rz: [`${-a}`, `${-b}`], nz: N1 ? [fr(-N0, N1)] : [], chk: {e: `${m}/(${lin(a)})-${n}/(${lin(b)})`, dens: [lin(a), lin(b)]},
    traps: [{e: `(${bin(N1, m * b + n * a)})/((${lin(a)})(${lin(b)}))`, why: `Distribute the minus to both terms: $-${n}(${lin(a)})=${TEXL(bin(-n, -n * a))}$.`, id: 'minus_not_distributed', cat: 'procedure'},
      {e: `(${bin(m + n, m * b + n * a)})/((${lin(a)})(${lin(b)}))`, why: "That's adding, not subtracting.", id: 'added', cat: 'slip'},
      {e: `${N1}/((${lin(a)})(${lin(b)}))`, why: 'The numerators have to be built up too.', id: 'not_built_up', cat: 'procedure'}],
    h: ['LCD first. Put the second numerator in brackets so the minus hits both terms.', `$${F(`${m}(${lin(b)})-${n}(${lin(a)})`, `(${lin(a)})(${lin(b)})`)}$`],
    x: [[F(`${m}(${lin(b)})-${n}(${lin(a)})`, `(${lin(a)})(${lin(b)})`), 'Build to the LCD.'], [F(bin(N1, N0), `(${lin(a)})(${lin(b)})`), 'Distribute, then combine.'], [NE([`${-a}`, `${-b}`]), '']]};
}});
tpl({id: 'a-s3', s: 'as', d: 2, name: 'Reduce first (Sheet #3)', make(R) {
  const a = R.i(2, 9), k = R.i(2, 5), c = R.i(2, 5), ans = `(${bin(k + 1, a)})/(x^2-${a * a})`;
  return {k: 'er', q: `Add and state the excluded values: $${F(k + 'x', `x^2-${a * a}`)}+${F(c, `${c}x-${c * a}`)}$`, ans: {e: ans}, rz: [`-${a}`, `${a}`], nz: [fr(-a, k + 1)], chk: {e: `${k}x/(x^2-${a * a})+${c}/(${c}x-${c * a})`, dens: [`x^2-${a * a}`, `${c}x-${c * a}`]},
    traps: [{e: `(${k}x+1)/(x^2-${a * a})`, why: `Build up the numerator too: $1\\cdot(x+${a})$.`, id: 'not_built_up', cat: 'procedure'},
      {e: ans, v: [`${a}`], why: `$x=-${a}$ also makes $x^2-${a * a}=0$.`, id: 'lost_restriction', cat: 'concept'},
      {e: `(${k}x+${c})/(${poly(1, c, -a * a - c * a)})`, why: 'Never add denominators.', id: 'added_denominators', cat: 'concept'}],
    h: [`Factor: $${c}x-${c * a}=${c}(x-${a})$, so $${F(c, `${c}x-${c * a}`)}=${F(1, `x-${a}`)}$.`, `LCD: $(x-${a})(x+${a})$. Build $${F(1, `x-${a}`)}$ up by $(x+${a})$.`],
    x: [[F(1, `x-${a}`), 'Reduce the second fraction first.'], [F(`${k}x+(x+${a})`, `(x-${a})(x+${a})`), 'Build to the LCD and add.'], [`${F(bin(k + 1, a), `x^2-${a * a}`)},\\ \\ x\\ne\\pm${a}`, '']]};
}});
tpl({id: 'a-s4', s: 'as', d: 3, name: 'Cancel at the end (Sheet #4)', make(R) {
  const k = R.i(1, 6), A = 2 * k, ans = `-(x-${k})/(x-${A})`;
  return {k: 'er', q: `Simplify and state the excluded values: $-${F(k, `x+${A}`)}-${F('x^2', `x^2-${A * A}`)}$`, ans: {e: ans}, rz: [`-${A}`, `${A}`], cz: [`-${A}`], nz: [`${k}`], chk: {e: `-${k}/(x+${A})-x^2/(x^2-${A * A})`, dens: [`x+${A}`, `x^2-${A * A}`]},
    traps: [{e: ans, v: [`${A}`], why: `$x=-${A}$ was canceled, but it still breaks the original denominators.`, id: 'lost_restriction', cat: 'concept'},
      {e: `(x-${k})/(x-${A})`, why: `You lost the leading negative: the numerator is $-(x+${A})(x-${k})$.`, id: 'sign', cat: 'slip'},
      {e: `(-${k}-x^2)/(x^2-${A * A})`, why: `Build up $-${F(k, `x+${A}`)}$ by $(x-${A})$ first.`, id: 'not_built_up', cat: 'procedure'}],
    h: [`LCD: $(x+${A})(x-${A})$. Factor the numerator at the end.`, `Numerator: $-${k}(x-${A})-x^2=-x^2-${k}x+${2 * k * k}$.`],
    x: [[F(`-${k}(x-${A})-x^2`, `(x+${A})(x-${A})`), 'Build to the LCD.'], [F(`-(x+${A})(x-${k})`, `(x+${A})(x-${A})`), 'Factor out −1, then factor.'], [`-${F(`x-${k}`, `x-${A}`)},\\ \\ x\\ne\\pm${A}`, `Cancel $(x+${A})$ — keep its restriction.`]]};
}});
tpl({id: 'a-opp', s: 'as', d: 1, name: 'Opposite denominators', make(R) {
  const p = R.i(2, 9), a = R.i(1, 9);
  return {k: 'er', q: `Simplify and state the excluded values: $${F(p + 'x', `x-${a}`)}+${F(p * a, `${a}-x`)}$`, ans: {e: `${p}`}, rz: [`${a}`], chk: {e: `${p}x/(x-${a})+${p * a}/(${a}-x)`, dens: [`x-${a}`, `${a}-x`]},
    traps: [{e: `(${p}x+${p * a})/(x-${a})`, why: `$${a}-x=-(x-${a})$, so the second fraction changes sign.`, id: 'opposites', cat: 'slip'},
      {e: `-${p}`, why: `Sign: $${p}x-${p * a}=${p}(x-${a})$, so the answer is positive.`, id: 'sign', cat: 'slip'},
      {e: `${p}`, v: [], why: `$x=${a}$ makes the original denominators 0.`, id: 'lost_restriction', cat: 'concept'}],
    h: [`Rewrite $${F(p * a, `${a}-x`)}$ as $-${F(p * a, `x-${a}`)}$.`, `Now it's $${F(`${p}x-${p * a}`, `x-${a}`)}$.`],
    x: [[`${F(p + 'x', `x-${a}`)}-${F(p * a, `x-${a}`)}`, 'Flip the opposite denominator.'], [F(`${p}(x-${a})`, `x-${a}`), 'Factor.'], [`${p},\\ \\ x\\ne${a}`, '']]};
}});

/* ============ Complex fractions ============ */
tpl({id: 'c-sq', s: 'cf', d: 2, name: 'Clear with x²', make(R) {
  const a = R.i(1, 9), e = `(1-${a * a}/x^2)/(1+${a}/x)`, ans = `(x-${a})/x`;
  return {k: 'er', q: `Simplify and state the excluded values: ${ML(e)}`, ans: {e: ans}, rz: ['0', `-${a}`], bz: [`-${a}`], nz: [`${a}`], chk: {e, dens: ['x^2', 'x', `1+${a}/x`]},
    traps: [{e: ans, v: ['0'], why: `$1+${F(a, 'x')}=0$ at $x=-${a}$ — that's the big denominator.`, id: 'big_denominator', cat: 'concept'},
      {e: `(x+${a})/x`, why: `$(x+${a})$ cancels; $(x-${a})$ stays.`, id: 'canceled_wrong', cat: 'procedure'},
      {e: `x-${a}`, why: 'The $x$ from the small fractions stays in the denominator.', id: 'lost_denominator', cat: 'procedure'}],
    h: ['Multiply the top and bottom by $x^2$ — the LCD of the small fractions.', `You get $${F(`x^2-${a * a}`, `x^2+${a}x`)}$. Factor both.`],
    x: [[F(`x^2-${a * a}`, `x^2+${a}x`), 'Multiply every term by $x^2$.'], [F(`(x-${a})(x+${a})`, `x(x+${a})`), 'Factor.'], [`${F(`x-${a}`, 'x')},\\ \\ x\\ne0,\\ -${a}`, '$x=0$ from inside; $x=-' + a + '$ makes the big denominator 0.']]};
}});
tpl({id: 'c-res', s: 'cf', d: 2, name: 'Parallel resistors', make(R) {
  let a, b; do { a = R.i(0, 5); b = R.i(0, 5); } while (a === b);
  const ans = `((${lin(a)})(${lin(b)}))/(${bin(2, a + b)})`, h3 = fr(-(a + b), 2);
  return {k: 'er', q: `Two resistors in parallel: $R=${F(1, `${F(1, 'r_1')}+${F(1, 'r_2')}`)}$ with $r_1=${TEXL(lin(a))}$ and $r_2=${TEXL(lin(b))}$. Simplify $R$ and state the excluded values.`, ans: {e: ans}, rz: [`${-a}`, `${-b}`, h3], bz: [h3], chk: {e: `1/(1/(${lin(a)})+1/(${lin(b)}))`, dens: [lin(a), lin(b), `1/(${lin(a)})+1/(${lin(b)})`]},
    traps: [{e: `(${bin(2, a + b)})/((${lin(a)})(${lin(b)}))`, why: "That's $\\f1R$ — flip it.", id: 'forgot_flip', cat: 'concept'},
      {e: bin(2, a + b), why: 'Adding resistances is the series rule, not parallel.', id: 'series_rule', cat: 'concept'},
      {e: ans, v: [h3], why: '$r_1$ and $r_2$ can\'t be 0 either.', id: 'lost_restriction', cat: 'concept'}],
    h: [`Multiply the top and bottom by $(${lin(a)})(${lin(b)})$.`, `The bottom becomes $(${lin(b)})+(${lin(a)})=${TEXL(bin(2, a + b))}$.`],
    x: [[F(`(${lin(a)})(${lin(b)})`, `(${lin(b)})+(${lin(a)})`), 'Clear the small fractions.'], [F(`(${lin(a)})(${lin(b)})`, bin(2, a + b)), ''], [NE([`${-a}`, `${-b}`, h3]), 'From $r_1$, $r_2$ and the big denominator.']]};
}});
tpl({id: 'c-s6', s: 'cf', d: 3, name: 'Fractions over fractions (Sheet #6)', make(R) {
  const q = R.i(1, 6), p = q + 2, ans = `-1/(2(x-${q}))`;
  return {k: 'er', q: `Simplify and state the excluded values: $${F(`${F(1, 2)}-${F(`x+${p}`, 4)}`, `${F('x^2', 2)}-${F(q * q, 2)}`)}$`, ans: {e: ans}, rz: [`-${q}`, `${q}`], cz: [`-${q}`], chk: {e: `(1/2-(x+${p})/4)/(x^2/2-${q * q}/2)`, dens: [`x^2/2-${q * q}/2`]},
    traps: [{e: ans, v: [`${q}`], why: `$x=-${q}$ also makes the big denominator zero.`, id: 'lost_restriction', cat: 'concept'},
      {e: `1/(2(x-${q}))`, why: `Sign: $2-(x+${p})=-x-${q}$.`, id: 'minus_not_distributed', cat: 'slip'},
      {e: `-2/(x-${q})`, why: `Multiplying by 4 everywhere gives $${F(`2-(x+${p})`, `2x^2-${2 * q * q}`)}$ — check the factor of 2.`, id: 'division', cat: 'procedure'}],
    h: ['Multiply the top and bottom by 4, the LCD of all the small denominators.', `Top: $2-(x+${p})=-(x+${q})$. Bottom: $2x^2-${2 * q * q}=2(x-${q})(x+${q})$.`],
    x: [[F(`2-(x+${p})`, `2x^2-${2 * q * q}`), 'Multiply every small fraction by 4.'], [F(`-(x+${q})`, `2(x-${q})(x+${q})`), 'Factor.'], [`-${F(1, `2(x-${q})`)},\\ \\ x\\ne\\pm${q}`, '']]};
}});

/* ============ Solving ============ */
tpl({id: 'e-s8', s: 'solve', d: 1, name: 'Check for extraneous (Sheet #8)', make(R) {
  const a = R.i(2, 9), ext = R.f() < 0.5; let m = 0; if (!ext) do { m = R.nz(-9, 9); } while (m === a || m === -a);
  const c = ext ? 2 * a : 2 * m;
  return {k: 's', q: `Solve: $${F(1, `x+${a}`)}+${F(1, `x-${a}`)}=${F(c, `x^2-${a * a}`)}$`, ans: {v: ext ? [] : [`${m}`]}, ex: ext ? [`${a}`] : [], chk: {lhs: `1/(x+${a})+1/(x-${a})`, rhs: `${c}/(x^2-${a * a})`, dens: [`x+${a}`, `x-${a}`, `x^2-${a * a}`]},
    traps: ext ? [{v: [`${a}`], why: `$x=${a}$ makes $x-${a}=0$ — extraneous.`, id: 'kept_extraneous', cat: 'concept'}, {v: [`-${a}`], why: 'Not a root — and excluded anyway.', id: 'wrong_root', cat: 'procedure'}, {v: [`${a}`, `-${a}`], why: 'Both are excluded values.', id: 'kept_extraneous', cat: 'concept'}]
      : [{v: [`${c}`], why: `$2x=${c}$ means $x=${m}$.`, id: 'arith', cat: 'slip'}, {v: [], why: `$x=${m}$ isn't excluded, so it stands.`, id: 'threw_out_valid', cat: 'concept'}, {v: [`${-m}`], why: 'Sign slip.', id: 'sign', cat: 'slip'}],
    h: [`Restrictions: $x\\ne\\pm${a}$. Multiply every term by $(x+${a})(x-${a})$.`, `You get $(x-${a})+(x+${a})=${c}$.`],
    x: [[`x\\ne\\pm${a}`, ''], [`2x=${c}\\Rightarrow x=${ext ? a : m}`, 'Clear the fractions.'], [ext ? `x=${a}\\ \\text{is excluded}` : `x=${m}`, ext ? 'Extraneous: no solution.' : 'Not excluded, so it checks.']]};
}});
tpl({id: 'e-prop', s: 'solve', d: 1, name: 'Proportion', make(R) {
  const a = R.i(1, 6), mm = R.i(1, 3), x0 = R.nz(-9, 9), b = a * (1 + mm), c = x0 * mm;
  return {k: 's', q: `Solve: $${F(a, 'x')}=${F(b, lin(c))}$`, ans: {v: [`${x0}`]}, chk: {lhs: `${a}/x`, rhs: `${b}/(${lin(c)})`, dens: ['x', lin(c)]},
    traps: [{v: [`${-x0}`], why: 'Sign slip — plug it in to check.', id: 'sign', cat: 'slip'}, {v: [`${x0 + c}`], why: "Doesn't check: plug it into both sides.", id: 'arith', cat: 'procedure'}, {v: [`${2 * x0 + c}`], why: `Distribute: $${a}(${TEXL(lin(c))})=${TEXL(bin(a, a * c))}$.`, id: 'distribute', cat: 'procedure'}],
    h: ['Cross-multiply.', `$${a}(${TEXL(lin(c))})=${b}x$.`],
    x: [[`${a}(${lin(c)})=${b}x`, 'Cross-multiply.'], [`${TEXL(bin(a, a * c))}=${b}x\\Rightarrow x=${x0}`, `Check: $x\\ne0,\\ ${-c}$.`]]};
}});
tpl({id: 'e-quad', s: 'solve', d: 2, name: 'Rational to quadratic', make(R) {
  let r1, r2; do { r1 = R.nz(-8, 8); r2 = R.nz(-8, 8); } while (r1 === r2 || r1 === -r2);
  const m = r1 + r2, k = -r1 * r2;
  return {k: 's', q: `Solve: $${F(k, 'x')}=${TEXL(lin(-m))}$`, ans: {v: [`${r1}`, `${r2}`]}, chk: {lhs: `${k}/x`, rhs: lin(-m), dens: ['x']},
    traps: [{v: [`${r1}`], why: "There's a second solution — only $x=0$ is excluded.", id: 'missed_root', cat: 'procedure'}, {v: [`${-r1}`, `${-r2}`], why: 'Sign slip in the factors.', id: 'sign', cat: 'slip'}, {v: [`${k}`], why: 'Multiply both sides by $x$ first.', id: 'not_cleared', cat: 'procedure'}],
    h: ['Multiply both sides by $x$, then set the quadratic equal to 0.', `$${TEXL(poly(1, -m, -k))}=0$`],
    x: [[`${k}=x(${lin(-m)})`, 'Multiply by $x$.'], [`${poly(1, -m, -k)}=0`, ''], [`(${lin(-r1)})(${lin(-r2)})=0\\Rightarrow x=${r1},\\ ${r2}`, 'Neither is 0, so both work.']]};
}});
tpl({id: 'e-s9', s: 'solve', d: 3, name: 'Three fractions (Sheet #9)', make(R) {
  let p, q, a, x0, ext; do { p = R.i(2, 6); q = R.i(2, 6); a = R.i(1, 4); ext = R.f() < 0.3; x0 = ext ? p : R.i(-5, 5); } while (p === q || (!ext && (x0 === p || x0 === q)));
  const D = a - q + 3 * p, c = a * q - x0 * D, top = c === 0 ? '2x^2' : `2x^2${c < 0 ? '-' : '+'}${Math.abs(c)}`, den = poly(1, -(p + q), p * q);
  const s1 = x0 === 0 ? 1 : -x0;
  return {k: 's', q: `Solve: $${F(lin(a), `x-${p}`)}+${F(top, den)}=${F('3x', `x-${q}`)}$`, ans: {v: ext ? [] : [`${x0}`]}, ex: ext ? [`${p}`] : [], chk: {lhs: `(${lin(a)})/(x-${p})+(${top})/(${den})`, rhs: `3x/(x-${q})`, dens: [`x-${p}`, den, `x-${q}`]},
    traps: ext ? [{v: [`${p}`], why: `$x=${p}$ makes $x-${p}=0$ — extraneous.`, id: 'kept_extraneous', cat: 'concept'}, {v: [`${-p}`], why: 'Not a root of the cleared equation.', id: 'wrong_root', cat: 'procedure'}, {v: [`${q}`], why: `$x=${q}$ is excluded too.`, id: 'kept_extraneous', cat: 'concept'}]
      : [{v: [`${s1}`], why: 'Sign slip — redo the last step.', id: 'sign', cat: 'slip'}, {v: [], why: 'It checks — plug it back in.', id: 'threw_out_valid', cat: 'concept'}, {v: [`${x0}`, `${p}`], why: `$x=${p}$ is excluded.`, id: 'kept_extraneous', cat: 'concept'}],
    h: [`$${TEXL(den)}=(x-${p})(x-${q})$ is the LCD. Restrictions: $x\\ne${p},\\ ${q}$.`, `Multiply every term: $(${lin(a)})(x-${q})+${TEXL(top)}=3x(x-${p})$.`],
    x: [[`(${lin(a)})(x-${q})+${top}=3x(x-${p})`, 'Multiply every term by the LCD.'], [`${D}x=${a * q - c}\\Rightarrow x=${x0}`, 'The $x^2$ terms cancel.'], [ext ? `x=${p}\\ \\text{is excluded}` : `x=${x0}`, ext ? 'Extraneous: no solution.' : 'Not excluded, so it checks.']]};
}});
tpl({id: 'e-s7', s: 'solve', d: 2, name: 'Opposite denominator (Sheet #7)', make(R) {
  let a, r1, r2, mm, k; do { a = R.i(3, 7); r1 = R.i(-4, 4); r2 = a - 1 - r1; mm = R.i(1, 6); k = r1 * r2 + mm; } while (r1 === a || r1 === -1 || r2 === a || k === 0);
  const sol = r1 === r2 ? [`${r1}`] : [`${r1}`, `${r2}`];
  return {k: 's', q: `Solve: $x${k < 0 ? '-' : '+'}${F(Math.abs(k), `x-${a}`)}=${F(`x-${mm}`, `${a}-x`)}$`, ans: {v: sol}, chk: {lhs: `x+(${k})/(x-${a})`, rhs: `(x-${mm})/(${a}-x)`, dens: [`x-${a}`, `${a}-x`]},
    traps: [{v: sol.concat([`${a}`]), why: `$x=${a}$ is excluded — it makes the denominators 0.`, id: 'kept_extraneous', cat: 'concept'}, {v: sol.map(s => `${-Number(s)}`), why: 'Sign slip in the factors.', id: 'sign', cat: 'slip'}, {v: r1 === r2 ? [`${r1 + 1}`] : [`${r1}`], why: r1 === r2 ? "Doesn't check — factor again." : "There's another root.", id: 'missed_root', cat: 'procedure'}],
    h: [`Rewrite $${F(`x-${mm}`, `${a}-x`)}=-${F(`x-${mm}`, `x-${a}`)}$, then multiply every term by $(x-${a})$.`, `$x(x-${a})${k < 0 ? '-' : '+'}${Math.abs(k)}=-(x-${mm})$`],
    x: [[`x(x-${a})${k < 0 ? '-' : '+'}${Math.abs(k)}=-(x-${mm})`, `Multiply every term by $(x-${a})$, $x\\ne${a}$.`], [`${poly(1, 1 - a, k - mm)}=0`, ''], [`x=${sol.join(',\\ ')}`, `Neither is ${a}, so ${sol.length > 1 ? 'both work' : 'it works'}.`]]};
}});

/* ============ Systems ============ */
tpl({id: 'y-s10', s: 'sys', d: 2, name: 'Same denominator (Sheet #10)', make(R) {
  const s = R.i(2, 6), ext = R.f() < 0.5; let a = s; if (!ext) do { a = R.i(1, 7); } while (a === s);
  const y1 = fr(s * s, s + a), pts = ext ? [[`${s}`, y1]] : [[`${s}`, y1], [`${-s}`, fr(s * s, a - s)]];
  return {k: 'p', q: `Solve the system: $y=${F(s * s, `x+${a}`)}$ and $y=${F('x^2', `x+${a}`)}$`, ans: {p: pts}, chk: {f1: `${s * s}/(x+${a})`, f2: `x^2/(x+${a})`, dens: [`x+${a}`]},
    traps: ext ? [{p: [[`${s}`, y1], [`${-s}`, y1]], why: `$x=-${s}$ makes the denominators 0.`, id: 'kept_extraneous', cat: 'concept'}, {p: [[`${s}`, `${s * s}`]], why: `Find $y$ from an equation: $y=${F(s * s, s + a)}$.`, id: 'wrong_y', cat: 'procedure'}, {p: [], why: 'There is one solution.', id: 'threw_out_valid', cat: 'concept'}]
      : [{p: [[`${s}`, y1]], why: `$x=-${s}$ works too here (the restriction is $x\\ne-${a}$).`, id: 'missed_root', cat: 'procedure'}, {p: [[`${s}`, `${s * s}`], [`${-s}`, `${s * s}`]], why: 'Find each $y$ from an equation — divide by $x+' + a + '$.', id: 'wrong_y', cat: 'procedure'}, {p: [], why: 'There are solutions.', id: 'threw_out_valid', cat: 'concept'}],
    h: ['Same denominators, so set the numerators equal — then check the restriction.', `$x^2=${s * s}$, so $x=\\pm${s}$. Exclude $x=-${a}$.`],
    x: [[`x^2=${s * s},\\ \\ x\\ne-${a}`, ''], [`x=${ext ? s : '\\pm' + s}`, ext ? `$x=-${s}$ is excluded.` : ''], [pts.map(p => `(${p[0]},\\ ${VT(p[1])})`).join(',\\ '), 'Find each $y$.']]};
}});
tpl({id: 'y-line', s: 'sys', d: 2, name: 'Hyperbola and line', make(R) {
  let r1, r2; do { r1 = R.nz(-6, 6); r2 = R.nz(-6, 6); } while (r1 === r2 || r1 === -r2);
  const m = -(r1 + r2), k = -r1 * r2, pts = [[`${r1}`, `${r1 + m}`], [`${r2}`, `${r2 + m}`]];
  return {k: 'p', q: `Solve the system: $y=${F(k, 'x')}$ and $y=${TEXL(lin(m))}$`, ans: {p: pts}, chk: {f1: `${k}/x`, f2: lin(m), dens: ['x']},
    traps: [{p: [pts[0]], why: 'The quadratic has two roots — two points.', id: 'missed_root', cat: 'procedure'}, {p: [[`${r1 + m}`, `${r1}`], [`${r2 + m}`, `${r2}`]], why: 'Coordinates swapped: write $(x,y)$.', id: 'swapped', cat: 'slip'}, {p: [[`${-r1}`, `${-r1 + m}`], [`${-r2}`, `${-r2 + m}`]], why: 'Sign slip in the factors.', id: 'sign', cat: 'slip'}],
    h: ['Set them equal and multiply by $x$.', `$${TEXL(poly(1, m, -k))}=0$`],
    x: [[`${k}=x(${lin(m)})\\Rightarrow ${poly(1, m, -k)}=0`, ''], [`x=${r1},\\ ${r2}`, ''], [pts.map(p => `(${p[0]},\\ ${p[1]})`).join(',\\ '), 'Find each $y$ from the line.']]};
}});

/* ============ Word problems ============ */
const NAMES = [['Ira', 'her coach'], ['Sam', 'Kim'], ['Pat', 'Lee'], ['Ana', 'Ben']];
const JOBS = ['rake all the bunkers', 'mow the practice green', 'refill the ball baskets', 'repair the divots'];
const nice = v => Number.isInteger(v) ? String(v) : String(+v.toFixed(2));
tpl({id: 'w-two', s: 'word', d: 1, name: 'Two workers', word: 1, make(R) {
  const [p, q] = R.pick([[2, 3], [3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [5, 20], [4, 4], [6, 6], [8, 24], [9, 18], [6, 3], [12, 4], [15, 10], [3, 3], [12, 6], [2, 6]]);
  const T = p * q / (p + q), w = R.pick(NAMES), job = R.pick(JOBS);
  return {k: 'n', q: `${w[0]} can ${job} in ${p} hours; ${w[1]} takes ${q} hours. How long working together?`, ans: {n: nice(T), tol: 0.01, unit: 'h'}, chk: {e: `1/(1/${p}+1/${q})`},
    traps: [{n: p + q, why: "Times don't add — rates do.", id: 'rates_vs_times', cat: 'concept'}, {n: (p + q) / 2, why: "Averaging the times doesn't work.", id: 'averaged', cat: 'concept'}, {n: p * q, why: 'Then divide by the sum: $T=\\f{pq}{p+q}$.', id: 'formula', cat: 'procedure'}],
    frame: {q: 'Which equation models this?', opts: [`${F(1, p)}+${F(1, q)}=${F(1, 'T')}`, `${p}+${q}=T`, `${F(`${p}+${q}`, 2)}=T`]},
    h: ['Rate = 1 job ÷ time. Add the rates.', `$${F(1, p)}+${F(1, q)}=${F(1, 'T')}$`],
    x: [[`${F(1, p)}+${F(1, q)}=${F(p + q, p * q)}`, 'Add the rates.'], [`T=${F(p * q, p + q)}=${nice(T)}\\ \\text{h}`, 'Flip.']]};
}});
tpl({id: 'w-other', s: 'word', d: 2, name: 'Find the other worker', word: 1, make(R) {
  const [p, q] = R.pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [5, 20], [8, 24], [9, 18], [6, 3], [12, 4], [15, 10], [12, 6]]);
  const T = p * q / (p + q), w = R.pick(NAMES);
  const tr = [{n: Math.abs(p - T), why: "Subtracting times doesn't work — subtract rates.", id: 'rates_vs_times', cat: 'concept'}, {n: p + T, why: "Times don't add.", id: 'rates_vs_times', cat: 'concept'}, {n: 2 * T, why: `Check: $${F(1, p)}+${F(1, 2 * T)}\\ne${F(1, T)}$.`, id: 'arith', cat: 'procedure'}].filter(t => Math.abs(t.n - q) > 1e-9);
  return {k: 'n', q: `Working together, ${w[0]} and ${w[1]} finish a job in ${nice(T)} hours. ${w[0]} alone takes ${p} hours. How long would ${w[1]} take alone?`, ans: {n: String(q), tol: 0.01, unit: 'h'}, chk: {solve: `1/${p}+1/t-1/${nice(T)}`, v: 't', gt: 0},
    traps: tr.slice(0, 3),
    frame: {q: 'Which equation models this?', opts: [`${F(1, p)}+${F(1, 't')}=${F(1, nice(T))}`, `${p}+t=${nice(T)}`, `${F(1, p)}-${F(1, 't')}=${F(1, nice(T))}`]},
    h: ['Rates add: $\\f1{\\text{one}}+\\f1{\\text{other}}=\\f1{\\text{together}}$.', `$${F(1, 't')}=${F(1, nice(T))}-${F(1, p)}$`],
    x: [[`${F(1, p)}+${F(1, 't')}=${F(1, nice(T))}`, ''], [`${F(1, 't')}=${F(1, nice(T))}-${F(1, p)}=${F(1, q)}`, ''], [`t=${q}\\ \\text{h}`, '']]};
}});
tpl({id: 'w-drain', s: 'word', d: 2, name: 'Fill and drain', word: 1, make(R) {
  const [f, g] = R.pick([[2, 6], [3, 4], [4, 6], [6, 10], [2, 4], [3, 6], [4, 12], [6, 12], [5, 10], [10, 15]]), T = f * g / (g - f);
  return {k: 'n', q: `A hose fills a pond in ${f} hours; a drain empties it in ${g} hours. With both open, how long to fill it?`, ans: {n: String(T), tol: 0.01, unit: 'h'}, chk: {e: `1/(1/${f}-1/${g})`},
    traps: [{n: f * g / (f + g), why: 'The drain works against the hose: subtract its rate.', id: 'added_rates', cat: 'concept'}, {n: g - f, why: 'Subtract the rates, not the times.', id: 'rates_vs_times', cat: 'concept'}, {n: f + g, why: "Times don't add.", id: 'rates_vs_times', cat: 'concept'}],
    frame: {q: 'Which equation models this?', opts: [`${F(1, f)}-${F(1, g)}=${F(1, 'T')}`, `${F(1, f)}+${F(1, g)}=${F(1, 'T')}`, `${g}-${f}=T`]},
    h: ['Filling adds, draining subtracts.', `$${F(1, f)}-${F(1, g)}=${F(1, 'T')}$`],
    x: [[`${F(1, f)}-${F(1, g)}=${F(g - f, f * g)}`, ''], [`T=${F(f * g, g - f)}=${T}\\ \\text{h}`, 'Flip.']]};
}});
tpl({id: 'w-fast', s: 'word', d: 2, name: 'Twice as fast', word: 1, make(R) {
  const T = R.i(2, 8);
  return {k: 'n', q: `Two groundskeepers finish together in ${T} hours. One works twice as fast as the other. How long would the slower one take alone?`, ans: {n: String(3 * T), tol: 0.01, unit: 'h'}, chk: {solve: `1/t+2/t-1/${T}`, v: 't', gt: 0},
    traps: [{n: 1.5 * T, why: "That's the faster one's time.", id: 'wrong_person', cat: 'procedure'}, {n: 2 * T, why: 'Twice as fast means double the rate: $\\f1t+\\f2t$.', id: 'twice_fast', cat: 'concept'}, {n: T / 2, why: 'The slower one takes LONGER than the pair.', id: 'sense', cat: 'concept'}],
    frame: {q: 'Slower one takes $t$ hours. Which equation models this?', opts: [`${F(1, 't')}+${F(2, 't')}=${F(1, T)}`, `${F(1, 't')}+${F(1, '2t')}=${F(1, T)}`, `t+2t=${T}`]},
    h: ['Slower: $t$ hours, rate $\\f1t$. Faster: half the time, rate $\\f2t$.', `$${F(3, 't')}=${F(1, T)}$`],
    x: [[`${F(1, 't')}+${F(2, 't')}=${F(1, T)}`, ''], [`${F(3, 't')}=${F(1, T)}\\Rightarrow t=${3 * T}`, '']]};
}});
tpl({id: 'w-s12', s: 'word', d: 3, name: 'Three workers (Sheet #12)', word: 1, make(R) {
  const k = R.i(2, 8), disc = k * k + 4 * k + 16, L = ((k + 4) + Math.sqrt(disc)) / 2, L2 = ((k + 4) - Math.sqrt(disc)) / 2, nm = R.pick([['Ana', 'Ben', 'Cal'], ['Ira', 'Sam', 'Kim'], ['Pat', 'Lee', 'Max']]);
  const r = v => (+v.toFixed(2)).toString();
  return {k: 'n', q: `${nm[0]} clears the course twice as fast as ${nm[1]}, who takes ${k} fewer hours than ${nm[2]}. Together they finish in 1 hour. How long would ${nm[2]} take alone? (Round to 2 decimals.)`, ans: {n: r(L), tol: 0.02, unit: 'h'}, chk: {solve: `1/C+3/(C-${k})-1`, v: 'C', gt: k},
    traps: [{n: +L2.toFixed(2), why: `Reject that root: ${nm[1]}'s time, $C-${k}$, would be negative.`, id: 'kept_extraneous', cat: 'concept'}, {n: +(L - k).toFixed(2), why: `That's ${nm[1]}'s time.`, id: 'wrong_person', cat: 'procedure'}, {n: +((L - k) / 2).toFixed(2), why: `That's ${nm[0]}'s time.`, id: 'wrong_person', cat: 'procedure'}],
    frame: {q: `${nm[2]} takes $C$ hours. Which equation models this?`, opts: [`${F(1, 'C')}+${F(1, `C-${k}`)}+${F(2, `C-${k}`)}=1`, `${F(1, 'C')}+${F(1, `C-${k}`)}+${F(1, `2(C-${k})`)}=1`, `C+(C-${k})+${F(`C-${k}`, 2)}=1`]},
    h: [`${nm[2]}: $C$. ${nm[1]}: $C-${k}$. ${nm[0]}: half of ${nm[1]}'s time, so rate $${F(2, `C-${k}`)}$.`, `$${F(1, 'C')}+${F(3, `C-${k}`)}=1\\Rightarrow ${TEXL(poly(1, -(k + 4), k))}=0$`],
    x: [[`${F(1, 'C')}+${F(1, `C-${k}`)}+${F(2, `C-${k}`)}=1`, 'Rates add to 1 job per hour.'], [`C^2-${k + 4}C+${k}=0`, `Multiply by $C(C-${k})$.`], [`C=${F(`${k + 4}\\pm\\sqrt{${disc}}`, 2)}\\approx${r(L)}`, `Reject $${r(L2)}$: it makes ${nm[1]}'s time negative.`]]};
}});
tpl({id: 'w-pct', s: 'word', d: 2, name: 'Make the percentage', word: 1, make(R) {
  let pn, pd, b, x, a; do { [pn, pd] = R.pick([[3, 4], [4, 5], [2, 3], [7, 10], [9, 10]]); b = R.i(10, 40); x = R.i(2, 20); a = (pn * (b + x)) / pd - x; } while (!Number.isInteger(a) || a <= 0 || a * pd >= pn * b);
  const pct = Math.round(100 * pn / pd), t1 = Math.ceil(pn * b / pd) - a;
  const tr = [{n: t1, why: 'Each make also adds an attempt — the bottom grows too.', id: 'fixed_total', cat: 'concept'}, {n: b - a, why: "That's how many she has missed.", id: 'wrong_quantity', cat: 'procedure'}, {n: x + 2, why: 'Solve $\\f{a+x}{b+x}=p$ exactly.', id: 'arith', cat: 'procedure'}, {n: x + 1, why: 'One short: solve $\\f{a+x}{b+x}=p$ exactly, then check.', id: 'arith', cat: 'procedure'}, {n: x - 1, why: 'Check it: that falls just short of the target.', id: 'arith', cat: 'procedure'}].filter((t, i, A) => t.n !== x && t.n > 0 && A.findIndex(u => u.n === t.n) === i);
  return {k: 'n', q: `Ira has made ${a} of ${b} putts inside 6 feet. How many in a row must she make to reach ${pct}%?`, ans: {n: String(x), tol: 0.01, unit: ''}, chk: {solve: `(${a}+x)/(${b}+x)-${pn}/${pd}`, v: 'x', gt: 0},
    traps: tr.slice(0, 3),
    frame: {q: 'Which equation models this?', opts: [`${F(`${a}+x`, `${b}+x`)}=${F(pn, pd)}`, `${F(`${a}+x`, b)}=${F(pn, pd)}`, `${F(a, `${b}+x`)}=${F(pn, pd)}`]},
    h: ['Made + x over attempts + x equals the target.', `$${F(`${a}+x`, `${b}+x`)}=${F(pn, pd)}$ — cross-multiply.`],
    x: [[`${pd}(${a}+x)=${pn}(${b}+x)`, 'Cross-multiply.'], [`x=${x}`, `Check: $${F(a + x, b + x)}=${pct}\\%$.`]]};
}});
tpl({id: 'w-res', s: 'word', d: 1, name: 'Parallel resistors', word: 1, make(R) {
  const [p, q] = R.pick([[6, 3], [12, 4], [10, 15], [4, 4], [20, 30], [12, 6], [2, 3], [9, 18]]), T = p * q / (p + q);
  return {k: 'n', q: `Resistors of ${p} Ω and ${q} Ω are wired in parallel. What is the total resistance?`, ans: {n: nice(T), tol: 0.01, unit: 'Ω'}, chk: {e: `1/(1/${p}+1/${q})`},
    traps: [{n: p + q, why: "That's the series total.", id: 'series_rule', cat: 'concept'}, {n: (p + q) / 2, why: "It isn't an average.", id: 'averaged', cat: 'concept'}, {n: +((p + q) / (p * q)).toFixed(4), why: "That's $\\f1R$ — flip it.", id: 'forgot_flip', cat: 'concept'}],
    frame: {q: 'Which equation models this?', opts: [`${F(1, 'R')}=${F(1, p)}+${F(1, q)}`, `R=${p}+${q}`, `${F(1, 'R')}=${F(1, p + q)}`]},
    h: ['Parallel: $\\f1R=\\f1{r_1}+\\f1{r_2}$.', `$${F(1, p)}+${F(1, q)}=${F(p + q, p * q)}$`],
    x: [[`${F(1, 'R')}=${F(p + q, p * q)}`, ''], [`R=${F(p * q, p + q)}=${nice(T)}`, '']]};
}});
tpl({id: 'w-speed', s: 'word', d: 2, name: 'Average speed', word: 1, make(R) {
  const [u, v] = R.pick([[8, 12], [30, 60], [40, 60], [10, 15], [20, 30], [45, 90], [6, 12], [12, 24]]), d = R.i(2, 6), A = 2 * u * v / (u + v);
  return {k: 'n', q: `Ira's cart goes ${d} miles out at ${u} mph and ${d} miles back at ${v} mph. What is the average speed for the round trip?`, ans: {n: nice(A), tol: 0.01, unit: 'mph'}, chk: {e: `${2 * d}/(${d}/${u}+${d}/${v})`},
    traps: [{n: (u + v) / 2, why: 'Average speed = total distance ÷ total time, not the average of the speeds.', id: 'averaged', cat: 'concept'}, {n: nice(u * v / (u + v)), why: `The round trip is ${2 * d} miles, not ${d}.`, id: 'half_trip', cat: 'procedure'}, {n: u + v, why: "Speeds don't add.", id: 'added', cat: 'concept'}],
    frame: {q: 'Which expression gives the average speed?', opts: [`${F(2 * d, `${F(d, u)}+${F(d, v)}`)}`, `${F(`${u}+${v}`, 2)}`, `${F(d, `${F(d, u)}+${F(d, v)}`)}`]},
    h: ['Total distance ÷ total time.', `Time $=${F(d, u)}+${F(d, v)}$ hours.`],
    x: [[`t=${F(d, u)}+${F(d, v)}`, 'Time = distance ÷ rate.'], [`${F(2 * d, 't')}=${nice(A)}\\ \\text{mph}`, '']]};
}});

/* ============ Speed drills: fast multiple-choice recall ============ */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rnz = (a, b) => { let v = 0; while (!v) v = rnd(a, b); return v; };
const rpk = a => a[Math.floor(Math.random() * a.length)];
const mk = (q, c, w, x) => { const all = [c].concat(w); return new Set(all).size < 4 ? null : {q, c: all, x}; };
const DRILLS = [
  {id: 'dsq', name: 'Difference of squares', g: () => { const a = rnd(2, 12); return mk('Factor: $x^2-' + a * a + '$', '$(x-' + a + ')(x+' + a + ')$', ['$(x-' + a + ')^2$', '$(x+' + a + ')^2$', '$(x-' + a * a + ')(x+1)$'], 'Difference of squares.'); }},
  {id: 'tri', name: 'Trinomials', g: () => { let r, s; do { r = rnz(-9, 9); s = rnz(-9, 9); } while (r === s || r === -s); return mk('Factor: $' + TEXL(poly(1, r + s, r * s)) + '$', '$(' + lin(r) + ')(' + lin(s) + ')$', ['$(' + lin(-r) + ')(' + lin(-s) + ')$', '$(' + lin(r) + ')(' + lin(-s) + ')$', '$(' + lin(-r) + ')(' + lin(s) + ')$'], `Product ${r * s}, sum ${r + s}.`); }},
  {id: 'gcf', name: 'GCF first', g: () => { const a = rnd(2, 6), b = rnd(1, 9); return mk('Factor: $' + a + 'x^2+' + a * b + 'x$', '$' + a + 'x(x+' + b + ')$', ['$' + a + '(x^2+' + b + 'x)$', '$x(' + a + 'x+' + a * b + ')$', '$' + a + 'x(x+' + a * b + ')$'], 'Take out the number AND the variable.'); }},
  {id: 'restr', name: 'Excluded values', g: () => { let a, b, k; do { a = rnz(-9, 9); b = rnz(-9, 9); k = rnz(-9, 9); } while (a === b || a === -b || -k === a || -k === b); const v = [a, b].sort((p, q) => p - q); return mk('Excluded values of $' + F(lin(k), '(' + lin(-a) + ')(' + lin(-b) + ')') + '$?', '$x\\ne' + v[0] + ',' + v[1] + '$', ['$x\\ne' + (-v[1]) + ',' + (-v[0]) + '$', '$x\\ne' + [v[0], v[1], -k].sort((p, q) => p - q).join(',') + '$', '$x\\ne' + v[0] + '$ only'], 'Set each denominator factor to 0.'); }},
  {id: 'cancel', name: 'Cancel a factor', g: () => { let r, s; do { r = rnz(-9, 9); s = rnz(-9, 9); } while (r === s || r === -s || r * s === s || r * s === r); return mk('Simplify: $' + F(TEXL(poly(1, r + s, r * s)), lin(r)) + '$', '$' + lin(s) + '$', ['$' + lin(r) + '$', '$' + lin(-s) + '$', '$' + lin(r * s) + '$'], 'Factor, then cancel.'); }},
  {id: 'opp', name: 'Opposites', g: () => { const a = rnd(1, 9), f = Math.random() < 0.5; return mk('Simplify: $' + (f ? F(a + '-x', 'x-' + a) : F('x-' + a, a + '-x')) + '$', '$-1$', ['$1$', '$0$', '$x-' + a + '$'], 'Opposites divide to −1.'); }},
  {id: 'sqcancel', name: 'Squares over a binomial', g: () => { const a = rnd(2, 9); return mk('Simplify: $' + F('x^2-' + a * a, 'x+' + a) + '$', '$x-' + a + '$', ['$x+' + a + '$', '$' + F(1, 'x-' + a) + '$', '$x^2-' + a + '$'], 'Factor the top, cancel.'); }},
  {id: 'lcd', name: 'LCD', g: () => { const a = rnd(2, 9); return mk('LCD of $' + F(1, 'x^2-' + a * a) + '$ and $' + F(1, 'x+' + a) + '$?', '$(x-' + a + ')(x+' + a + ')$', ['$(x^2-' + a * a + ')(x+' + a + ')$', '$x+' + a + '$', '$(x+' + a + ')^2$'], 'The first denominator already contains x + ' + a + '.'); }},
  {id: 'same', name: 'Same denominator', g: () => { let a, b; do { a = rnd(1, 9); b = rnd(1, 9); } while (a * b === a + b); return mk('Simplify: $' + F(a, 'x') + '+' + F(b, 'x') + '$', '$' + F(a + b, 'x') + '$', ['$' + F(a + b, '2x') + '$', '$' + F(a * b, 'x') + '$', '$' + F(a + b, 'x^2') + '$'], 'Add only the numerators.'); }},
  {id: 'flip', name: 'Keep–change–flip', g: () => { let a, b, c; do { a = rnz(-9, 9); b = rnz(-9, 9); c = rnz(-9, 9); } while (a === b || b === c || a === c); const A = lin(a), B = lin(b), C = lin(c); return mk('Simplify: $' + F(A, B) + '\\div' + F(C, B) + '$', '$' + F(A, C) + '$', ['$' + F(C, A) + '$', '$' + F('(' + A + ')(' + C + ')', '(' + B + ')^2') + '$', '$1$'], 'Flip the divisor.'); }},
  {id: 'oppadd', name: 'Opposite denominators', g: () => { let a, b, c; do { a = rnd(2, 9); c = rnd(1, 9); b = rnd(1, 9); } while (a === c); return mk('Simplify: $' + F(a, 'x-' + b) + '+' + F(c, b + '-x') + '$', '$' + F(a - c, 'x-' + b) + '$', ['$' + F(a + c, 'x-' + b) + '$', '$' + F(c - a, 'x-' + b) + '$', '$' + F(a - c, 'x+' + b) + '$'], 'Flip the sign of the opposite fraction.'); }},
  {id: 'mulc', name: 'Multiply and cancel', g: () => { let a, b; do { a = rnz(-9, 9); b = rnz(-9, 9); } while (a === b || a === -b); const A = lin(a), B = lin(b); return mk('Simplify: $' + F(A, B) + '\\cdot' + F(B, 'x') + '$', '$' + F(A, 'x') + '$', ['$' + F(A, B) + '$', '$' + A + '$', '$' + F('(' + A + ')(' + B + ')', 'x') + '$'], 'Cancel the common factor.'); }},
  {id: 'prop', name: 'Proportions', g: () => { const a = rnd(1, 6), m = rnd(1, 3), x0 = rnz(-9, 9), b = a * (1 + m), c = x0 * m; return mk('Solve: $' + F(a, 'x') + '=' + F(b, lin(c)) + '$', '$x=' + x0 + '$', ['$x=' + (-x0) + '$', '$x=' + (x0 + c) + '$', '$x=' + (2 * x0 + c) + '$'], 'Cross-multiply.'); }},
  {id: 'extr', name: 'Extraneous or not', g: () => { const a = rnd(1, 9); if (Math.random() < 0.5) return mk('Solve: $' + F('x', 'x-' + a) + '=' + F(a, 'x-' + a) + '$', 'No solution', ['$x=' + a + '$', '$x=-' + a + '$', 'All real numbers'], 'x = ' + a + ' makes the denominator 0.'); let b; do { b = rnd(1, 9); } while (b === a); return mk('Solve: $' + F('x', 'x-' + a) + '=' + F(b, 'x-' + a) + '$', '$x=' + b + '$', ['$x=' + a + '$', 'No solution', '$x=-' + b + '$'], 'Numerators equal, and it isn\'t excluded.'); }},
  {id: 'sqext', name: 'Squares and extraneous', g: () => { const a = rnd(2, 9); return mk('Solve: $' + F('x^2', 'x-' + a) + '=' + F(a * a, 'x-' + a) + '$', '$x=-' + a + '$', ['$x=\\pm' + a + '$', '$x=' + a + '$', 'No solution'], 'x = ' + a + ' is excluded.'); }},
  {id: 'work', name: 'Work together', g: () => { const P = [[2, 3], [3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [5, 20], [4, 4], [6, 6], [8, 24], [9, 18], [6, 3], [12, 4], [15, 10], [3, 3], [12, 6], [2, 6]], pr = rpk(P), p = pr[0], q = pr[1], T = p * q / (p + q), w = rpk(NAMES); return mk(w[0] + ' takes ' + p + ' h alone; ' + w[1] + ' takes ' + q + ' h. How long together?', nice(T) + ' h', [(p + q) + ' h', nice((p + q) / 2) + ' h', p * q + ' h'], 'Add the rates, then flip.'); }},
  {id: 'res', name: 'Parallel resistors', g: () => { const P = [[2, 1], [3, 1], [6, 2], [6, 3], [12, 4], [10, 5], [8, 2], [9, 3]], pr = rpk(P), A = pr[0], B = pr[1]; return mk('Parallel: $\\f1R=' + F(1, A) + '+' + F(1, B) + '$. Find $R$.', nice(A * B / (A + B)) + ' Ω', [(A + B) + ' Ω', nice((A + B) / 2) + ' Ω', nice((A + B) / (A * B)) + ' Ω'], 'Add the reciprocals, then flip.'); }}
];
DRILLS.forEach(d => { d.medals = [6, 10, 14]; });
function drillQ(d) { let g = null, t = 0; while (!g && t < 80) { g = d.g(); t++; } return g; }
