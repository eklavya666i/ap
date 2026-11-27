// ---------- Templates, unit 1 (matter and measurement) and unit 2 (atomic structure)

// ===== Unit 1 · Classifying matter and changes
const MATTER = {
  el: ['copper wire', 'oxygen gas', 'mercury', 'a diamond (pure carbon)', 'aluminum foil', 'helium in a balloon', 'a sulfur crystal', 'neon in a sign'],
  cpd: ['pure water', 'table salt, \\ce{NaCl}', 'table sugar (sucrose)', 'carbon dioxide gas', 'baking soda, \\ce{NaHCO3}', 'rust, \\ce{Fe2O3}', 'ammonia gas, \\ce{NH3}', 'glucose, \\ce{C6H12O6}'],
  hom: ['salt water', 'clean air', 'brass', 'vinegar', 'steel', 'clear apple juice', 'gasoline', 'sterling silver'],
  het: ['granite', 'sand in water', 'oil-and-vinegar dressing', 'trail mix', 'concrete', 'chicken noodle soup', 'muddy water', 'a chocolate chip cookie']
};
const MNAME = {el: 'Element', cpd: 'Compound', hom: 'Homogeneous mixture', het: 'Heterogeneous mixture'};
const MWHY = {
  el: {cpd: 'A compound has two or more elements chemically bonded. This is one kind of atom.', hom: 'A mixture contains more than one substance. This is one pure element.', het: 'A mixture contains more than one substance. This is one pure element.'},
  cpd: {el: 'An element has one kind of atom; this has two or more elements bonded together.', hom: 'Its composition is fixed by a formula; a mixture\'s composition can vary.', het: 'It is uniform with a fixed formula: a pure substance, not a mixture.'},
  hom: {el: 'It contains more than one substance, so it is a mixture.', cpd: 'Its composition can vary and it can be separated physically, so it is a mixture, not a compound.', het: 'It looks the same throughout (one phase), so it is homogeneous.'},
  het: {el: 'It contains more than one substance, so it is a mixture.', cpd: 'You can see different parts, and they separate physically: a mixture.', hom: 'You can see different parts or layers, so it is heterogeneous, not uniform.'}
};
tpl({id: 'm-class', s: 'matter', d: 1, name: 'Element, compound or mixture', make(R) {
  const k = R.pick(['el', 'cpd', 'hom', 'het']), thing = R.pick(MATTER[k]);
  return MCI('Classify ' + thing + '.', MNAME[k], ['el', 'cpd', 'hom', 'het'].filter(o => o !== k).map(o => [MNAME[o], MWHY[k][o], 'classify_matter', 'concept']),
    ['Is it one pure substance, or more than one substance mixed together?', 'Pure substance: one kind of atom (element) or a fixed formula (compound). Mixture: uniform throughout (homogeneous) or visibly uneven (heterogeneous).'],
    [['', k === 'el' || k === 'cpd' ? 'It is a pure substance with a fixed composition.' : 'It is a mixture: its parts keep their own identities and can be separated physically.'], ['', 'So it is a' + (k === 'el' ? 'n element' : ' ' + MNAME[k].toLowerCase()) + '.']]);
}});
const PCHANGE = ['ice melting', 'water boiling', 'sugar dissolving in tea', 'cutting paper', 'crushing a soda can', 'breaking a glass', 'water vapor condensing on a cold can', 'dry ice turning to gas', 'sanding wood', 'chopping an onion', 'melting butter', 'stretching a rubber band'];
const CCHANGE = [['burning wood', 'heat, light and new substances (ash and gases) form'], ['iron rusting', 'a new substance, iron oxide, forms'], ['baking a cake', 'new substances form, and you can\'t un-bake it'], ['milk souring', 'a new smell and taste show new substances'],
  ['fireworks exploding', 'light, heat, gas and color appear'], ['a silver spoon tarnishing', 'a new dark substance (silver sulfide) forms'], ['baking soda fizzing in vinegar', 'gas bubbles show a new substance, carbon dioxide'], ['digesting food', 'enzymes break food into new substances'],
  ['toasting bread', 'browning makes new substances'], ['a match burning', 'light, heat and new gases form'], ['an egg frying', 'its proteins change permanently'], ['a copper roof turning green', 'a new compound (the green patina) forms']];
tpl({id: 'm-change', s: 'matter', d: 1, name: 'Physical or chemical change', make(R) {
  const chem = R.f() < 0.5, c = chem ? R.pick(CCHANGE) : null, ev = chem ? c[0] : R.pick(PCHANGE);
  return chem ? MCI('Is ' + ev + ' a physical or a chemical change?', 'Chemical change', [['Physical change', 'Evidence of a new substance: ' + c[1] + '.', 'change_type', 'concept']],
      ['Does a new substance form, or does the same substance just change form?', 'Look for evidence: gas, color change, light or heat, a new smell, or a solid forming.'], [['', 'A new substance forms: ' + c[1] + '.'], ['', 'So it is a chemical change.']])
    : MCI('Is ' + ev + ' a physical or a chemical change?', 'Physical change', [['Chemical change', 'Only its form or state changes; it is still the same substance (ice and water are both H₂O).', 'change_type', 'concept']],
      ['Does a new substance form, or does the same substance just change form?', 'Changes of state, shape and size are physical: the particles stay the same.'], [['', 'The substance keeps its identity; only its size, shape or state changes.'], ['', 'So it is a physical change.']]);
}});
const PPROP = ['density', 'melting point', 'color', 'boiling point', 'malleability', 'electrical conductivity', 'solubility in water', 'hardness'];
const CPROP = ['flammability', 'reacts with acids', 'rusts in moist air', 'reacts with water', 'decomposes when heated', 'burns in oxygen'];
tpl({id: 'm-prop', s: 'matter', d: 2, name: 'Physical or chemical property', make(R) {
  const wantChem = R.f() < 0.5, right = R.pick(wantChem ? CPROP : PPROP), wrong = R.some(wantChem ? PPROP : CPROP, 3);
  return MCI('Which of these is a ' + (wantChem ? 'chemical' : 'physical') + ' property?', right[0].toUpperCase() + right.slice(1),
    wrong.map(w => [w[0].toUpperCase() + w.slice(1), wantChem ? w[0].toUpperCase() + w.slice(1) + ' can be observed without changing the substance, so it is a physical property.' : w[0].toUpperCase() + w.slice(1) + ' describes how the substance changes into something new, so it is a chemical property.', 'property_type', 'concept']),
    ['Physical properties can be observed without changing what the substance is. Chemical properties describe how it reacts.', 'Ask: to see this property, would the substance have to turn into something new?'],
    [['', right[0].toUpperCase() + right.slice(1) + (wantChem ? ' describes how the substance reacts to form new substances.' : ' can be measured while the substance stays the same.')], ['', 'So it is a ' + (wantChem ? 'chemical' : 'physical') + ' property.']]);
}});
const EXTP = ['mass', 'volume', 'length', 'total heat content', 'number of moles'], INTP = ['density', 'boiling point', 'color', 'temperature', 'melting point', 'concentration'];
tpl({id: 'm-ext', s: 'matter', d: 2, name: 'Intensive or extensive', make(R) {
  const ext = R.f() < 0.5, right = R.pick(ext ? EXTP : INTP), wrong = R.some(ext ? INTP : EXTP, 3);
  return MCI('Which property ' + (ext ? 'depends' : 'does NOT depend') + ' on how much of the sample you have?', right[0].toUpperCase() + right.slice(1),
    wrong.map(w => [w[0].toUpperCase() + w.slice(1), ext ? w[0].toUpperCase() + w.slice(1) + ' is the same for a drop or a bucket: intensive.' : 'Double the sample and the ' + w + ' doubles: extensive.', 'intensive_extensive', 'concept']),
    ['Imagine cutting the sample in half. Which property changes?', 'Extensive properties (mass, volume) change with amount; intensive ones (density, boiling point) don\'t.'],
    [['', 'Cut the sample in half: the ' + right + (ext ? ' is halved too.' : ' stays the same.')], ['', 'So it is ' + (ext ? 'extensive.' : 'intensive.')]]);
}});

// ===== Unit 1 · Significant figures and scientific notation
// Values that sit exactly halfway would round differently by hand and in binary floating point: avoid them.
const tieSF = (x, k) => /^50*$/.test(Math.abs(x).toExponential(k + 6).split('e')[0].replace('.', '').slice(k));
const tieDP = (x, dp) => /^50*$/.test(Math.abs(x).toFixed(dp + 6).split('.')[1].slice(dp));
function sfNumber(R) {   // a measured number in one of the rule patterns
  const d = () => R.i(1, 9), z = () => R.i(0, 9);
  switch (R.i(0, 5)) {
    case 0: return '0.0' + (R.f() < .5 ? '0' : '') + d() + z() + (R.f() < .5 ? d() : '0');
    case 1: return '' + d() + '0' + (R.f() < .5 ? '0' : '') + d();
    case 2: return '' + d() + z() + '00' + (R.f() < .4 ? '0' : '');
    case 3: return '' + d() + z() + '.' + z() + '0';
    case 4: return '' + d() + '0' + d() + '.' + '0'.repeat(R.i(1, 2));
    default: return '' + d() + '.' + z() + z() + '0';
  }
}
tpl({id: 'sf-count', s: 'sigfig', d: 1, name: 'Count significant figures', make(R) {
  let str = sfNumber(R), sci = R.f() < 0.25 && !str.startsWith('0') && str.includes('.');
  let shown = str, ex = 0; if (sci) { ex = R.i(-8, 8); const t = str.replace('.', ''), m = t[0] + '.' + t.slice(1); shown = m; str = m; }
  const k = sfOf(str), digits = str.replace(/^[+-]/, '').replace('.', '').length, nonzero = str.replace(/[^1-9]/g, '').length;
  const noLead = str.replace('.', '').replace(/^0+/, '').length, noTrail = str.replace('.', '').replace(/^0+/, '').replace(/0+$/, '').length;
  const traps = [];
  if (digits !== k) traps.push(TR('a', digits, str.startsWith('0') ? 'Leading zeros (the zeros in front) only place the decimal point; they never count.' : 'Trailing zeros in a number without a decimal point are just placeholders, so they don\'t count.', 'sf_zeros', 'concept'));
  if (nonzero !== k && nonzero !== digits) traps.push(TR('a', nonzero, 'Zeros between nonzero digits always count, and so do trailing zeros after a decimal point.', 'sf_zeros', 'concept'));
  if (noTrail !== k && ![digits, nonzero].includes(noTrail)) traps.push(TR('a', noTrail, 'Trailing zeros after a decimal point ARE significant: they show the precision of the measurement.', 'sf_trailing', 'concept'));
  if (noLead !== k && ![digits, nonzero, noTrail].includes(noLead)) traps.push(TR('a', noLead, 'Without a decimal point, trailing zeros are placeholders.', 'sf_trailing', 'concept'));
  const disp = sci ? shown + '\\times10^{' + ex + '}' : shown;
  return one('How many significant figures are in $' + disp + '$?', INT('a', 'Significant figures', k), traps,
    ['Nonzero digits always count. The question is which zeros count.', 'Leading zeros never count; zeros between digits always count; trailing zeros count only if there is a decimal point.' + (sci ? ' In scientific notation, count the digits in the first number only.' : '')],
    [['', (sci ? 'Look only at $' + shown + '$. ' : '') + (str.startsWith('0') ? 'The leading zeros don\'t count. ' : '') + (/\d0+\d/.test(str.replace('.', '')) ? 'Zeros between nonzero digits count. ' : '') + (/0$/.test(str) ? (str.includes('.') ? 'The trailing zeros count, because there is a decimal point. ' : 'The trailing zeros don\'t count: no decimal point. ') : '')], ['', 'That gives ' + k + ' significant figure' + (k === 1 ? '' : 's') + '.']]);
}});
tpl({id: 'sf-round', s: 'sigfig', d: 2, name: 'Round to significant figures', make(R) {
  let v, k, ans;
  do { const digs = R.i(5, 6), m = R.i(Math.pow(10, digs - 1), Math.pow(10, digs) - 1), ex = R.i(-5, 3); v = +(m * Math.pow(10, ex - digs + 1)).toPrecision(digs); k = R.i(2, 4); ans = +v.toPrecision(k); } while (+v.toPrecision(k) === +v.toPrecision(k + 1) || Math.abs(v) < 1e-5 || tieSF(v, k));
  const show = fmtSF(ans, k), trunc = (() => { const e = Math.floor(Math.log10(v)), p = Math.pow(10, e - k + 1); return +(Math.floor(v / p + 1e-9) * p).toPrecision(k); })();
  const traps = [TR('a', +v.toPrecision(k + 1), 'That keeps ' + (k + 1) + ' significant figures; the question asks for ' + k + '.', 'sf_count', 'slip', fmtSF(+v.toPrecision(k + 1), k + 1))];
  if (trunc !== ans) traps.push(TR('a', trunc, 'Round, don\'t chop: look at the next digit, and round up when it is 5 or more.', 'sf_truncate', 'procedure', fmtSF(trunc, k)));
  if (k > 2) traps.push(TR('a', +v.toPrecision(k - 1), 'That keeps only ' + (k - 1) + ' significant figures.', 'sf_count', 'slip', fmtSF(+v.toPrecision(k - 1), k - 1)));
  const vs = String(v).includes('e') ? fmtSF(v, String(v).replace(/e.*/, '').replace('.', '').length) : String(v);
  return one('Round $' + texN(vs) + '$ to ' + k + ' significant figures.', NUM('a', 'Rounded value', ans, {sf: k, sfs: true, tol: 1e-9}), traps,
    ['Find the first nonzero digit, then count ' + k + ' digits from there.', 'Look at the digit right after your last kept digit: 5 or more rounds up.'],
    [['', 'Start counting at the first nonzero digit and keep ' + k + ' digits.'], [texN(vs) + '\\to ' + texN(show), 'Round using the next digit.']]);
}});
tpl({id: 'sf-calc', s: 'sigfig', d: 2, name: 'Calculate with significant figures', make(R) {
  const mult = R.f() < 0.55;
  if (mult) {
    const a = R.r(1.1, 99, R.i(1, 3)), b = R.r(0.12, 9.9, R.i(1, 2)), div = R.f() < 0.4, as = String(a), bs = String(b);
    const sa = sfOf(as), sb = sfOf(bs), k = Math.min(sa, sb), raw = div ? a / b : a * b, ans = +raw.toPrecision(k);
    if (tieSF(raw, k)) return TPL['sf-calc'].make(R);
    const dpA = (as.split('.')[1] || '').length, dpB = (bs.split('.')[1] || '').length, wrongDp = +raw.toFixed(Math.min(dpA, dpB));
    const traps = [TR('a', +raw.toPrecision(Math.max(sa, sb) + 2), 'That is the calculator answer. Round it: the least precise measurement has ' + k + ' significant figures.', 'sf_unrounded', 'procedure', fmtSF(raw, Math.max(sa, sb) + 2))];
    if (wrongDp !== ans) traps.push(TR('a', wrongDp, 'Decimal places are the rule for adding and subtracting. For multiplying and dividing, use the fewest significant figures.', 'sf_rule', 'concept', raw.toFixed(Math.min(dpA, dpB))));
    if (Math.max(sa, sb) !== k) traps.push(TR('a', +raw.toPrecision(Math.max(sa, sb)), 'Use the FEWEST significant figures, not the most.', 'sf_rule', 'concept', fmtSF(raw, Math.max(sa, sb))));
    return one('Calculate and round correctly: $' + as + (div ? '\\div ' : '\\times ') + bs + '$', NUM('a', 'Answer', ans, {sf: k, sfs: true, tol: 1e-9}), traps,
      ['Multiplying or dividing: the answer keeps as many significant figures as the least precise number.', '$' + as + '$ has ' + sa + ' and $' + bs + '$ has ' + sb + ', so keep ' + k + '.'],
      [[as + (div ? '\\div ' : '\\times ') + bs + '=' + texN(String(+raw.toPrecision(8))), 'Calculator value.'], ['', 'Fewest significant figures: ' + k + '.'], ['\\to ' + texN(fmtSF(ans, k)), 'Round.']]);
  }
  const dA = R.i(1, 3); let dB; do { dB = R.i(1, 3); } while (dB === dA);
  const a = R.r(10, 99, dA), b = R.r(1, 30, dB), sub = R.f() < 0.4 && a > b, dp = Math.min(dA, dB);
  const raw = sub ? a - b : a + b, ans = +raw.toFixed(dp), str = raw.toFixed(dp), k = sfOf(str);
  if (tieDP(raw, dp)) return TPL['sf-calc'].make(R);
  const traps = [TR('a', +raw.toFixed(Math.max(dA, dB)), 'For adding and subtracting, round to the FEWEST decimal places (' + dp + ').', 'sf_rule', 'concept', raw.toFixed(Math.max(dA, dB)))];
  const kk = Math.min(sfOf(a.toFixed(dA)), sfOf(b.toFixed(dB))); if (+raw.toPrecision(kk) !== ans) traps.push(TR('a', +raw.toPrecision(kk), 'Significant-figure counting is the rule for multiplying. For adding and subtracting, use decimal places.', 'sf_rule', 'concept', fmtSF(raw, kk)));
  return one('Calculate and round correctly: $' + a.toFixed(dA) + (sub ? '-' : '+') + b.toFixed(dB) + '$', NUM('a', 'Answer', ans, {sf: k, sfs: true, tol: 1e-9}), traps,
    ['Adding or subtracting: line up the decimal points. The answer keeps the fewest decimal places.', 'The fewest decimal places here is ' + dp + '.'],
    [[a.toFixed(dA) + (sub ? '-' : '+') + b.toFixed(dB) + '=' + texN(String(+raw.toFixed(6))), 'Calculator value.'], ['', 'Fewest decimal places: ' + dp + '.'], ['\\to ' + str, 'Round.']]);
}});
tpl({id: 'sf-sci', s: 'sigfig', d: 1, name: 'Scientific notation', make(R) {
  const toSci = R.f() < 0.6, digs = R.i(2, 4), m = R.i(Math.pow(10, digs - 1) + 1, Math.pow(10, digs) - 1), ex = R.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]);
  const v = +(m * Math.pow(10, ex - digs + 1)).toPrecision(digs), sci = fmtSF(v, digs, 'sci'), std = fmtSF(v, digs, 'fix'), mant = sci.split('×')[0];
  if (toSci) return one('Write $' + std + '$ in scientific notation.', NUM('a', 'Scientific notation', v, {sf: digs, sfs: true, fmt: 'sci', tol: 1e-9}),
    [TR('a', +(+mant * Math.pow(10, -ex)).toPrecision(digs), 'Check the sign of the exponent: ' + (ex < 0 ? 'a number smaller than 1 has a negative exponent.' : 'a number bigger than 10 has a positive exponent.'), 'exponent_sign', 'concept'),
      TR('a', +(+mant * Math.pow(10, ex + (ex > 0 ? -1 : 1))).toPrecision(digs), 'Count the places the decimal point moves again: the exponent is off by one.', 'exponent_count', 'slip')],
    ['Move the decimal point so there is exactly one nonzero digit in front of it.', 'Count the places you moved it. Moving ' + (ex > 0 ? 'left gives a positive' : 'right gives a negative') + ' exponent.'],
    [['', 'Place the decimal after the first nonzero digit: $' + mant + '$.'], ['', 'The decimal point moved ' + Math.abs(ex) + ' places ' + (ex > 0 ? 'left' : 'right') + '.'], [texN(sci), '']]);
  return one('Write $' + texN(sci) + '$ in standard form.', NUM('a', 'Standard form', v, {sf: digs, fmt: 'fix', tol: 1e-9}),
    [TR('a', +(+mant * Math.pow(10, -ex)).toPrecision(digs), 'A ' + (ex < 0 ? 'negative exponent makes the number small: move the decimal LEFT.' : 'positive exponent makes the number big: move the decimal RIGHT.'), 'exponent_sign', 'concept'),
      TR('a', +(+mant * Math.pow(10, ex + (ex > 0 ? -1 : 1))).toPrecision(digs), 'Move the decimal exactly ' + Math.abs(ex) + ' places.', 'exponent_count', 'slip')],
    ['The exponent tells you how many places to move the decimal point.', (ex > 0 ? 'Positive: move it right ' : 'Negative: move it left ') + Math.abs(ex) + ' places, filling with zeros.'],
    [['', 'Move the decimal point ' + Math.abs(ex) + ' places ' + (ex > 0 ? 'right' : 'left') + '.'], [std, '']]);
}});

// ===== Unit 1 · Metric conversions and dimensional analysis
const PFX = {k: [3, 'kilo'], '': [0, ''], d: [-1, 'deci'], c: [-2, 'centi'], m: [-3, 'milli'], 'µ': [-6, 'micro'], n: [-9, 'nano'], M: [6, 'mega']};
const fact = (a, b, u) => { const d = PFX[a][0] - PFX[b][0]; return d >= 0 ? ['1\\text{ ' + a + u + '}', (Math.abs(d) <= 3 ? String(Math.pow(10, d)) : '10^{' + d + '}') + '\\text{ ' + b + u + '}'] : [(Math.abs(d) <= 3 ? String(Math.pow(10, -d)) : '10^{' + (-d) + '}') + '\\text{ ' + a + u + '}', '1\\text{ ' + b + u + '}']; };
tpl({id: 'cv-metric', s: 'convert', d: 1, name: 'Metric prefixes', make(R) {
  const hard = R.f() < 0.3, u = R.pick(['g', 'm', 'L']), pool = hard ? ['k', '', 'c', 'm', 'µ', 'n'] : ['k', '', 'c', 'm'];
  let a, b; do { a = R.pick(pool); b = R.pick(pool); } while (a === b || (u === 'L' && (a === 'k' || b === 'k')));
  const dp = R.i(0, 2), v = R.r(1.2, 950, dp), vs = v.toFixed(dp), d = PFX[a][0] - PFX[b][0], ans = +(v * Math.pow(10, d)).toPrecision(12), [top, bot] = fact(a, b, u);
  return one('Convert $' + vs + '\\text{ ' + a + u + '}$ to ' + b + u + '.', NUM('a', b + u, ans, {sf: sfOf(vs), unit: b + u, tol: 0.001}),
    [TR('a', +(v * Math.pow(10, -d)).toPrecision(12), (d > 0 ? 'A ' + a + u + ' is bigger than a ' + b + u + ', so you need MORE of them: the number gets bigger.' : 'A ' + a + u + ' is smaller than a ' + b + u + ', so you need FEWER of them: the number gets smaller.'), 'conversion_flipped', 'procedure')],
    ['Write the relationship: ' + (d >= 0 ? '1 ' + a + u + ' = ' + niceN(Math.pow(10, d)) + ' ' + b + u : niceN(Math.pow(10, -d)) + ' ' + a + u + ' = 1 ' + b + u) + '.', 'Multiply by a factor with ' + b + u + ' on top so ' + a + u + ' cancels.'],
    [[vs + '\\text{ ' + a + u + '}\\times' + F(top.includes(a + u) ? bot : top, top.includes(a + u) ? top : bot), 'Set up the factor so the old unit cancels.'], ['=' + nT(ans, sfOf(vs)) + '\\text{ ' + b + u + '}', '']]);
}});
tpl({id: 'cv-chain', s: 'convert', d: 2, name: 'Dimensional analysis chains', make(R) {
  const k = R.i(0, 3);
  if (k === 0) { const v = R.r(1.5, 9.5, 1), ans = v * 24 * 60 * 60;
    return one('How many seconds are in $' + v.toFixed(1) + '$ days?', NUM('a', 'Seconds', ans, {sf: 2, unit: 's', tol: 0.005}),
      [TR('a', v * 24 * 60, 'You stopped at minutes: one more factor, 60 s per minute.', 'missing_factor'), TR('a', v / 24 / 60 / 60, 'Each factor needs the old unit on the bottom so it cancels; you divided instead of multiplying.', 'conversion_flipped')],
      ['Chain the factors: days → hours → minutes → seconds.', '$' + v.toFixed(1) + '\\text{ d}\\times' + F('24\\text{ h}', '1\\text{ d}') + '\\times' + F('60\\text{ min}', '1\\text{ h}') + '\\times' + F('60\\text{ s}', '1\\text{ min}') + '$'],
      [[v.toFixed(1) + '\\text{ d}\\times' + F('24\\text{ h}', '1\\text{ d}') + '\\times' + F('60\\text{ min}', '1\\text{ h}') + '\\times' + F('60\\text{ s}', '1\\text{ min}'), 'Each unit cancels the one before it.'], ['=' + nT(ans, 2) + '\\text{ s}', 'Two significant figures, from the measurement.']]); }
  if (k === 1) { const v = R.i(25, 75), ans = v * 1609 / 3600;
    return one('A car travels $' + v + '$ miles per hour. What is its speed in meters per second? (1 mi = 1609 m)', NUM('a', 'Speed', ans, {sf: 2, unit: 'm/s', tol: 0.005}),
      [TR('a', v * 1609 / 60, 'Hours to seconds is 3600 (60 min × 60 s), not 60.', 'missing_factor'), TR('a', v * 1609, 'You converted miles to meters but left the time in hours.', 'missing_factor'), TR('a', v / 1609 * 3600, 'Flip both factors: m on top, mi on the bottom; h on top, s on the bottom.', 'conversion_flipped')],
      ['Convert the distance unit and the time unit separately.', '$' + F(v + '\\text{ mi}', '1\\text{ h}') + '\\times' + F('1609\\text{ m}', '1\\text{ mi}') + '\\times' + F('1\\text{ h}', '3600\\text{ s}') + '$'],
      [[F(v + '\\text{ mi}', '1\\text{ h}') + '\\times' + F('1609\\text{ m}', '1\\text{ mi}') + '\\times' + F('1\\text{ h}', '3600\\text{ s}'), 'Miles cancel, hours cancel.'], ['=' + nT(ans, 2) + '\\text{ m/s}', '']]); }
  if (k === 2) { const v = R.r(1.5, 9.5, 2), ans = v * 453.6;
    return one('How many grams are in $' + v.toFixed(2) + '$ pounds? (1 lb = 453.6 g)', NUM('a', 'Mass', ans, {sf: 3, unit: 'g', tol: 0.005}),
      [TR('a', v / 453.6, 'Pounds go on the bottom of the factor so they cancel: multiply by 453.6 g/1 lb.', 'conversion_flipped')],
      ['Grams per pound is the factor you need.', '$' + v.toFixed(2) + '\\text{ lb}\\times' + F('453.6\\text{ g}', '1\\text{ lb}') + '$'],
      [[v.toFixed(2) + '\\text{ lb}\\times' + F('453.6\\text{ g}', '1\\text{ lb}'), 'Pounds cancel.'], ['=' + nT(ans, 3) + '\\text{ g}', '']]); }
  const v = R.r(1.2, 9.8, 1), ans = v * 3.785 * 1000;
  return one('A fish tank holds $' + v.toFixed(1) + '$ gallons. How many milliliters is that? (1 gal = 3.785 L)', NUM('a', 'Volume', ans, {sf: 2, unit: 'mL', tol: 0.005}),
    [TR('a', v * 3.785, 'That is in liters. One more step: 1 L = 1000 mL.', 'missing_factor'), TR('a', v / 3.785 / 1000, 'Flip the factors so gallons and liters cancel.', 'conversion_flipped')],
    ['Go gallons → liters → milliliters.', '$' + v.toFixed(1) + '\\text{ gal}\\times' + F('3.785\\text{ L}', '1\\text{ gal}') + '\\times' + F('1000\\text{ mL}', '1\\text{ L}') + '$'],
    [[v.toFixed(1) + '\\text{ gal}\\times' + F('3.785\\text{ L}', '1\\text{ gal}') + '\\times' + F('1000\\text{ mL}', '1\\text{ L}'), 'Gallons and liters cancel.'], ['=' + nT(ans, 2) + '\\text{ mL}', '']]);
}});
tpl({id: 'cv-cube', s: 'convert', d: 3, name: 'Squared and cubed units', make(R) {
  const cases = [['m^2', 'cm^2', 1e4, '100^2', 'm²', 'cm²'], ['cm^3', 'm^3', 1e-6, '100^3', 'cm³', 'm³'], ['m^3', 'L', 1000, '1000', 'm³', 'L'], ['L', 'cm^3', 1000, '1000', 'L', 'cm³'], ['cm^2', 'mm^2', 100, '10^2', 'cm²', 'mm²'], ['m^3', 'cm^3', 1e6, '100^3', 'm³', 'cm³']];
  const [a, b, f, how, A, B] = R.pick(cases), v = R.r(1.2, 9.8, 2), ans = +(v * f).toPrecision(10), lin = f === 1e4 ? 100 : f === 1e-6 ? 0.01 : f === 1e6 ? 100 : f === 100 ? 10 : null;
  const traps = lin ? [TR('a', +(v * lin).toPrecision(10), 'The unit is ' + (A.includes('²') ? 'squared' : 'cubed') + ', so the conversion factor is ' + (A.includes('²') ? 'squared' : 'cubed') + ' too: (' + how.replace(/\^.*/, '') + ')' + (A.includes('²') ? '²' : '³') + '.', 'unit_not_cubed', 'concept')] : [TR('a', +(v / f).toPrecision(10), 'Multiply, don\'t divide: 1 ' + A + ' = ' + niceN(f) + ' ' + B + '.', 'conversion_flipped')];
  return one('Convert $' + v.toFixed(2) + '$ ' + A + ' to ' + B + '.', NUM('a', B, ans, {sf: 3, unit: B, tol: 0.001}), traps,
    [A.includes('²') || B.includes('²') ? 'Squared units need the linear factor squared.' : 'Cubed units need the linear factor cubed (and 1 L = 1000 cm³ = 0.001 m³).', '1 ' + A + ' = ' + texN(fmtSF(f, 1)) + ' ' + B + '.'],
    [['1\\text{ ' + A + '}=' + nT(f, 1) + '\\text{ ' + B + '}', how.includes('^') ? 'Because 1 ' + A.replace(/[²³]/, '') + ' = ' + how.replace(/\^.*/, '') + ' ' + B.replace(/[²³]/, '') + ', square or cube it.' : '1 m³ = 1000 L, and 1 L = 1000 cm³.'], [v.toFixed(2) + '\\times' + nT(f, 1) + '=' + nT(ans, 3) + '\\text{ ' + B + '}', '']]);
}});

// ===== Unit 1 · Density and percent error
tpl({id: 'dn-calc', s: 'density', d: 1, name: 'Density from mass and volume', make(R) {
  const V = R.r(2.5, 48, 2), D0 = R.r(0.6, 19, 2), m = +(V * D0).toFixed(1), Vs = V.toFixed(2), ms = m.toFixed(1), k = Math.min(sfOf(Vs), sfOf(ms)), D = m / V;
  return one('A sample has a mass of $' + ms + '$ g and a volume of $' + Vs + '$ mL. What is its density?', NUM('a', 'Density', D, {sf: k, unit: 'g/mL'}),
    [TR('a', V / m, 'Density is mass ÷ volume, not volume ÷ mass.', 'density_inverted'), TR('a', m * V, 'Divide, don\'t multiply: D = m/V.', 'density_multiplied')],
    ['$D=' + F('m', 'V') + '$', '$D=' + F(ms + '\\text{ g}', Vs + '\\text{ mL}') + '$'],
    [['D=' + F('m', 'V') + '=' + F(ms + '\\text{ g}', Vs + '\\text{ mL}'), ''], ['=' + nT(D, k) + '\\text{ g/mL}', k + ' significant figures, the fewer of the two measurements.']]);
}});
tpl({id: 'dn-solve', s: 'density', d: 2, name: 'Solve for mass or volume', make(R) {
  const mats = [['aluminum', 2.70], ['iron', 7.87], ['copper', 8.96], ['lead', 11.3], ['gold', 19.3], ['ethanol', 0.789], ['olive oil', 0.918], ['seawater', 1.03], ['silver', 10.5], ['glass', 2.50]];
  const [nm, D] = R.pick(mats), findM = R.f() < 0.5, Ds = String(D);
  if (findM) { const V = R.r(5.0, 95, 1), m = D * V;
    return one('The density of ' + nm + ' is $' + Ds + '$ g/cm³. What is the mass of a $' + V.toFixed(1) + '$ cm³ piece?', NUM('a', 'Mass', m, {sf: Math.min(sfOf(Ds), sfOf(V.toFixed(1))), unit: 'g'}),
      [TR('a', V / D, 'Rearrange D = m/V to m = D × V.', 'rearranged_wrong'), TR('a', D / V, 'Rearrange D = m/V to m = D × V.', 'rearranged_wrong')],
      ['Rearrange $D=' + F('m', 'V') + '$ to solve for mass.', '$m=D\\times V$'], [['m=D\\times V=' + Ds + '\\times' + V.toFixed(1), ''], ['=' + nT(m, Math.min(sfOf(Ds), sfOf(V.toFixed(1)))) + '\\text{ g}', '']]); }
  const m = R.r(10, 250, 1), V = m / D;
  return one('A piece of ' + nm + ' has a mass of $' + m.toFixed(1) + '$ g. Its density is $' + Ds + '$ g/cm³. What is its volume?', NUM('a', 'Volume', V, {sf: Math.min(sfOf(Ds), sfOf(m.toFixed(1))), unit: 'cm³'}),
    [TR('a', m * D, 'Rearrange D = m/V to V = m/D.', 'rearranged_wrong'), TR('a', D / m, 'Rearrange D = m/V to V = m/D.', 'rearranged_wrong')],
    ['Rearrange $D=' + F('m', 'V') + '$ to solve for volume.', '$V=' + F('m', 'D') + '$'], [['V=' + F('m', 'D') + '=' + F(m.toFixed(1), Ds), ''], ['=' + nT(V, Math.min(sfOf(Ds), sfOf(m.toFixed(1)))) + '\\text{ cm}^3', '']]);
}});
const METALS = [['aluminum', 2.70], ['zinc', 7.13], ['iron', 7.87], ['copper', 8.96], ['silver', 10.5], ['lead', 11.3], ['gold', 19.3]];
tpl({id: 'dn-disp', s: 'density', d: 2, name: 'Water displacement', make(R) {
  const [nm, D] = R.pick(METALS), V0 = R.r(20, 40, 1), dV = R.r(2.0, 9.0, 1), m = +(D * dV).toFixed(1), V1 = +(V0 + dV).toFixed(1), dens = m / dV, k = Math.min(sfOf(m.toFixed(1)), sfOf(dV.toFixed(1)));
  return one('A metal block with a mass of $' + m.toFixed(1) + '$ g is dropped into a graduated cylinder. The water level rises from $' + V0.toFixed(1) + '$ mL to $' + V1.toFixed(1) + '$ mL. What is the density of the metal?', NUM('a', 'Density', dens, {sf: k, unit: 'g/mL'}),
    [TR('a', m / V1, 'The metal\'s volume is the CHANGE in water level, not the final reading.', 'displacement_final', 'concept'), TR('a', m / V0, 'The metal\'s volume is the change in water level.', 'displacement_final', 'concept'), TR('a', dV / m, 'Density is mass ÷ volume.', 'density_inverted')],
    ['The block pushes aside its own volume of water.', '$V=' + V1.toFixed(1) + '-' + V0.toFixed(1) + '=' + dV.toFixed(1) + '\\text{ mL}$'],
    [['V=' + V1.toFixed(1) + '-' + V0.toFixed(1) + '=' + dV.toFixed(1) + '\\text{ mL}', 'Volume by displacement.'], ['D=' + F(m.toFixed(1) + '\\text{ g}', dV.toFixed(1) + '\\text{ mL}') + '=' + nT(dens, k) + '\\text{ g/mL}', 'This matches ' + nm + ' (' + D + ' g/mL).']]);
}});
tpl({id: 'dn-id', s: 'density', d: 2, name: 'Identify a metal by density', make(R) {
  const [nm, D] = R.pick(METALS), V = R.r(2.0, 12.0, 2), m = +(D * V).toPrecision(3), dens = m / V;
  const others = R.some(METALS.filter(x => x[0] !== nm), 3);
  return MCI('A shiny metal sample has a mass of $' + nT(m, 3) + '$ g and a volume of $' + V.toFixed(2) + '$ cm³. Which metal is it? (Al 2.70, Zn 7.13, Fe 7.87, Cu 8.96, Ag 10.5, Pb 11.3, Au 19.3 g/cm³)', nm[0].toUpperCase() + nm.slice(1),
    others.map(o => [o[0][0].toUpperCase() + o[0].slice(1), o[0][0].toUpperCase() + o[0].slice(1) + ' has a density of ' + o[1] + ' g/cm³, but this sample\'s density is ' + niceN(+dens.toPrecision(3)) + ' g/cm³.', 'density_match', 'procedure']),
    ['Density is a property you can use to identify a substance.', 'Find $D=' + F('m', 'V') + '$, then match it to the table.'],
    [['D=' + F(nT(m, 3), V.toFixed(2)) + '=' + nT(dens, 3) + '\\text{ g/cm}^3', ''], ['', 'That matches ' + nm + ' (' + D + ' g/cm³).']]);
}});
tpl({id: 'dn-err', s: 'density', d: 2, name: 'Percent error', make(R) {
  const cases = [['the density of copper', 8.96, 'g/cm³', 2], ['the density of aluminum', 2.70, 'g/cm³', 2], ['the boiling point of water', 100.0, '°C', 1], ['the density of water', 1.00, 'g/mL', 2], ['the molar mass of carbon dioxide', 44.01, 'g/mol', 2], ['the specific heat of water', 4.18, 'J/(g·°C)', 2]];
  const [what, acc, u, dp] = R.pick(cases); let exp; do { exp = +(acc * (1 + (R.f() < .5 ? -1 : 1) * R.r(0.015, 0.09, 3))).toFixed(dp); } while (exp === acc);
  const pe = Math.abs(exp - acc) / acc * 100;
  return one('A student measures ' + what + ' as $' + exp.toFixed(dp) + '$ ' + u + '. The accepted value is $' + acc.toFixed(dp) + '$ ' + u + '. What is the percent error?', NUM('a', 'Percent error', pe, {unit: '%', tol: 0.01, sf: 2}),
    [TR('a', Math.abs(exp - acc) / exp * 100, 'Divide by the ACCEPTED value, not the measured one.', 'error_wrong_base'), TR('a', Math.abs(exp - acc) / acc, 'Multiply by 100 to turn the fraction into a percent.', 'error_no_percent')],
    ['$\\%\\text{ error}=' + F('|\\text{measured}-\\text{accepted}|', '\\text{accepted}') + '\\times100$', '$' + F('|' + exp.toFixed(dp) + '-' + acc.toFixed(dp) + '|', acc.toFixed(dp)) + '\\times100$'],
    [['|' + exp.toFixed(dp) + '-' + acc.toFixed(dp) + '|=' + niceN(+Math.abs(exp - acc).toFixed(dp + 1)), 'Size of the error.'], [F(niceN(+Math.abs(exp - acc).toFixed(dp + 1)), acc.toFixed(dp)) + '\\times100=' + nT(pe, 2) + '\\%', 'Divide by the accepted value.']]);
}});

// ===== Unit 2 · Atomic models and subatomic particles
const SCI = [['Democritus', 'proposed that matter is made of tiny, indivisible particles called atoms'], ['John Dalton', 'said each element is made of its own kind of solid, indivisible atom'], ['J.J. Thomson', 'discovered the electron with cathode rays (the plum-pudding model)'],
  ['Ernest Rutherford', 'found a tiny, dense, positive nucleus with the gold-foil experiment'], ['Niels Bohr', 'placed electrons in fixed energy levels around the nucleus'], ['James Chadwick', 'discovered the neutron'], ['Robert Millikan', 'measured the charge of an electron with the oil-drop experiment'], ['Erwin Schrödinger', 'described electrons as probability clouds (orbitals) in the quantum model']];
tpl({id: 'at-who', s: 'models', d: 1, name: 'Who discovered what', make(R) {
  const [who, what] = R.pick(SCI), others = R.some(SCI.filter(s => s[0] !== who), 3);
  if (R.f() < 0.5) return MCI('Which scientist ' + what + '?', who, others.map(o => [o[0], o[0] + ' ' + o[1] + '.', 'atomic_history', 'concept']), ['Put the models in order: Dalton, Thomson, Rutherford, Bohr, quantum.', 'Match the experiment to the discovery.'], [['', who + ' ' + what + '.']]);
  return MCI('What did ' + who + ' contribute to atomic theory?', what[0].toUpperCase() + what.slice(1), others.map(o => [o[1][0].toUpperCase() + o[1].slice(1), 'That was ' + o[0] + '.', 'atomic_history', 'concept']), ['Recall each model and the experiment behind it.', 'Think about what changed in the model after ' + who + '.'], [['', who + ' ' + what + '.']]);
}});
const PART = [
  ['Which particle has no electric charge?', 'Neutron', [['Proton', 'Protons are positive (+1).'], ['Electron', 'Electrons are negative (−1).'], ['Nucleus', 'The nucleus is a region, not a particle, and it is positive overall.']]],
  ['Which particle is found outside the nucleus?', 'Electron', [['Proton', 'Protons are in the nucleus.'], ['Neutron', 'Neutrons are in the nucleus.'], ['Alpha particle', 'An alpha particle is radiation from some nuclei, not part of a normal atom\'s structure.']]],
  ['Which particle\'s number identifies the element?', 'Proton', [['Neutron', 'Changing neutrons makes a different isotope of the SAME element.'], ['Electron', 'Changing electrons makes an ion of the same element.'], ['Photon', 'Photons are packets of light, not atomic particles.']]],
  ['Which two particles have nearly the same mass?', 'Proton and neutron', [['Proton and electron', 'An electron has about 1/1836 the mass of a proton.'], ['Neutron and electron', 'An electron is about 1836 times lighter than a neutron.'], ['All three are equal', 'Electrons are far lighter than protons and neutrons.']]],
  ['An atom becomes an ion. Which particle\'s number changed?', 'Electron', [['Proton', 'Changing protons would change the element.'], ['Neutron', 'Changing neutrons makes an isotope, not an ion.'], ['Nucleus', 'Ions form by gaining or losing electrons; the nucleus is unchanged.']]],
  ['Two isotopes of the same element differ in their number of…', 'Neutrons', [['Protons', 'Same element means same number of protons.'], ['Electrons', 'Neutral isotopes have the same number of electrons.'], ['Charge', 'Isotopes are neutral atoms with the same charge.']]],
  ['Where is almost all of an atom\'s mass?', 'In the nucleus', [['In the electron cloud', 'Electrons are very light; they take up space, not mass.'], ['Spread evenly through the atom', 'That was Thomson\'s plum-pudding idea, disproved by the gold-foil experiment.'], ['In the empty space', 'Empty space has no mass.']]],
  ['Most alpha particles passed straight through gold foil. What did Rutherford conclude?', 'An atom is mostly empty space', [['Atoms are solid spheres', 'Solid spheres would stop or deflect most particles.'], ['Electrons are in fixed orbits', 'That was Bohr, from hydrogen\'s line spectrum.'], ['Gold atoms are positive', 'Atoms are neutral overall.']]],
  ['A few alpha particles bounced back from gold foil. What did that show?', 'A tiny, dense, positive nucleus', [['Electrons fill the atom evenly', 'Light electrons can\'t bounce back heavy alpha particles.'], ['Neutrons exist', 'Neutrons were discovered later, by Chadwick.'], ['Atoms are indivisible', 'The experiment showed atoms have inner structure.']]]
];
tpl({id: 'at-part', s: 'models', d: 1, name: 'Subatomic particles', make(R) {
  const [q, a, w] = R.pick(PART);
  return MCI(q, a, w.map(x => [x[0], x[1], 'particle_facts', 'concept']), ['Proton: +1, 1 amu, nucleus. Neutron: 0, 1 amu, nucleus. Electron: −1, tiny mass, outside the nucleus.', 'Protons set the element; neutrons set the isotope; electrons set the charge.'], [['', a + '.']]);
}});

// ===== Unit 2 · Isotopes, ions and p/n/e
const ISO = {H: [1, 2, 3], He: [3, 4], Li: [6, 7], B: [10, 11], C: [12, 13, 14], N: [14, 15], O: [16, 17, 18], F: [19], Ne: [20, 22], Na: [23], Mg: [24, 25, 26], Al: [27], Si: [28, 29, 30], P: [31], S: [32, 34], Cl: [35, 37], Ar: [40], K: [39, 40, 41], Ca: [40, 42, 44], Fe: [54, 56, 57], Co: [59, 60], Cu: [63, 65], Zn: [64, 66, 68], Br: [79, 81], Sr: [88, 90], Ag: [107, 109], I: [127, 131], Cs: [133, 137], Ba: [137, 138], Au: [197], Pb: [206, 207, 208], U: [235, 238]};
const IONQ = {Li: [1], Na: [1], K: [1], Cs: [1], Mg: [2], Ca: [2], Sr: [2], Ba: [2], Al: [3], O: [-2], S: [-2], N: [-3], P: [-3], F: [-1], Cl: [-1], Br: [-1], I: [-1], Fe: [2, 3], Cu: [1, 2], Zn: [2], Ag: [1], Co: [2, 3], Pb: [2, 4]};
tpl({id: 'at-pne', s: 'isotope', d: 1, name: 'Protons, neutrons, electrons', make(R) {
  const ion = R.f() < 0.55, sy = R.pick(Object.keys(ion ? IONQ : ISO).filter(s => ISO[s])), A = R.pick(ISO[sy]), Z = EL[sy].z, q = ion ? R.pick(IONQ[sy]) : 0, e = Z - q;
  const traps = [TR('n', A, 'The mass number counts protons AND neutrons: subtract the atomic number.', 'neutrons_mass_number', 'concept'), TR('p', A - Z, 'Protons equal the atomic number (' + Z + '), the bottom number.', 'protons_swapped', 'concept'), TR('p', A, 'The top number is the mass number. Protons equal the atomic number.', 'protons_swapped', 'concept')];
  if (Z !== A - Z) traps.push(TR('n', Z, 'Neutrons = mass number − atomic number. They aren\'t always equal to protons.', 'neutrons_mass_number', 'concept'));
  if (q) { traps.push(TR('e', Z, 'This is an ion: a charge of ' + chgTxt(q) + ' means it ' + (q > 0 ? 'lost' : 'gained') + ' ' + Math.abs(q) + ' electron' + (Math.abs(q) > 1 ? 's' : '') + '.', 'ion_electrons', 'concept')); traps.push(TR('e', Z + q, q > 0 ? 'A positive ion LOST electrons, so it has fewer than its protons.' : 'A negative ion GAINED electrons, so it has more than its protons.', 'ion_electrons', 'concept')); }
  return {q: 'How many protons, neutrons and electrons are in $' + ce('^{' + A + '}_{' + Z + '}' + sy + chgCe(q)) + '$?', fs: [INT('p', 'Protons', Z), INT('n', 'Neutrons', A - Z), INT('e', 'Electrons', e)], traps,
    h: ['Top number: mass number (protons + neutrons). Bottom number: atomic number (protons).', 'Neutrons = ' + A + ' − ' + Z + '. Electrons = protons − charge.'],
    x: [['\\text{protons}=Z=' + Z, 'The atomic number.'], ['\\text{neutrons}=' + A + '-' + Z + '=' + (A - Z), 'Mass number minus atomic number.'], ['\\text{electrons}=' + Z + (q ? (q > 0 ? '-' : '+') + Math.abs(q) : '') + '=' + e, q ? (q > 0 ? 'A positive ion lost electrons.' : 'A negative ion gained electrons.') : 'A neutral atom has as many electrons as protons.']]};
}});
tpl({id: 'at-sym', s: 'isotope', d: 2, name: 'Write the symbol from p, n, e', make(R) {
  const sy = R.pick(Object.keys(IONQ).filter(s => ISO[s])), A = R.pick(ISO[sy]), Z = EL[sy].z, q = R.f() < 0.7 ? R.pick(IONQ[sy]) : 0, n = A - Z, e = Z - q;
  const traps = [TR('A', Z + e, 'The mass number is protons + neutrons. Electrons have almost no mass.', 'mass_number_electrons', 'concept'), TR('A', n, 'The mass number is protons + NEUTRONS.', 'mass_number_electrons', 'concept')];
  if (q) traps.push(TR('q', -q, 'More electrons than protons makes a NEGATIVE ion; fewer makes a POSITIVE one.', 'charge_sign', 'concept'));
  if (ELZ(n) && n !== Z) traps.push(TR('s', ELZ(n).s, 'The element is set by the number of PROTONS (' + Z + '), not neutrons.', 'element_from_neutrons', 'concept'));
  if (ELZ(e) && e !== Z) traps.push(TR('s', ELZ(e).s, 'The element is set by the number of PROTONS (' + Z + '), not electrons.', 'element_from_neutrons', 'concept'));
  return {q: 'A particle has ' + Z + ' protons, ' + n + ' neutrons and ' + e + ' electrons. Give its element symbol, mass number and charge.', fs: [SYM('s', 'Element symbol', sy), INT('A', 'Mass number', A), CHG('q', 'Charge (0 if neutral)', q)], traps,
    h: ['Protons identify the element: find atomic number ' + Z + '.', 'Mass number = protons + neutrons. Charge = protons − electrons.'],
    x: [['Z=' + Z + '\\Rightarrow ' + ce(sy), EL[sy].n + ' has atomic number ' + Z + '.'], ['A=' + Z + '+' + n + '=' + A, 'Mass number.'], ['\\text{charge}=' + Z + '-' + e + '=' + (q > 0 ? '+' : '') + q, ''], [ce('^{' + A + '}_{' + Z + '}' + sy + chgCe(q)), '']]};
}});
tpl({id: 'at-isopair', s: 'isotope', d: 1, name: 'Spot the isotopes', make(R) {
  const sy = R.pick(Object.keys(ISO).filter(s => ISO[s].length > 1)), [a1, a2] = R.some(ISO[sy], 2), Z = EL[sy].z;
  const other = R.pick(Object.keys(ISO).filter(s => s !== sy && ISO[s].includes(a1)).concat(Object.keys(ISO).filter(s => s !== sy && ISO[s].includes(a2)))), q = (IONQ[sy] || [1])[0];
  const wr = [[ce('^{' + a1 + '}_{' + Z + '}' + sy) + ' and ' + ce('^{' + a1 + '}_{' + Z + '}' + sy + chgCe(q || 1)), 'An atom and its ion have the same protons and neutrons; only the electrons differ. That makes an ion, not an isotope.', 'isotope_vs_ion', 'concept']];
  if (other) { const Zo = EL[other].z, ao = ISO[other].includes(a1) ? a1 : a2; wr.push([ce('^{' + ao + '}_{' + Z + '}' + sy) + ' and ' + ce('^{' + ao + '}_{' + Zo + '}' + other), 'Same mass number but different atomic numbers: these are different elements.', 'isotope_same_A', 'concept']); }
  wr.push([ce('^{' + a1 + '}_{' + Z + '}' + sy) + ' and ' + ce('^{' + (a1 + 1) + '}_{' + (Z + 1) + '}' + ELZ(Z + 1).s), 'Isotopes must have the same number of protons (the same element).', 'isotope_same_A', 'concept']);
  return MCI('Which pair are isotopes of each other?', ce('^{' + a1 + '}_{' + Z + '}' + sy) + ' and ' + ce('^{' + a2 + '}_{' + Z + '}' + sy), wr.slice(0, 3),
    ['Isotopes: same element (same protons), different number of neutrons.', 'Look for the same atomic number with different mass numbers.'],
    [['', 'Both have ' + Z + (Z === 1 ? ' proton (' : ' protons (') + EL[sy].n.toLowerCase() + '), but ' + (a1 - Z) + ' and ' + (a2 - Z) + ' neutrons.'], ['', 'Same element, different mass number: isotopes.']]);
}});

// ===== Unit 2 · Average atomic mass
const ABUND = {Cl: [[34.969, 75.78], [36.966, 24.22]], B: [[10.013, 19.9], [11.009, 80.1]], Cu: [[62.930, 69.15], [64.928, 30.85]], Li: [[6.015, 7.59], [7.016, 92.41]], Ga: [[68.926, 60.11], [70.925, 39.89]], Br: [[78.918, 50.69], [80.916, 49.31]], Ag: [[106.905, 51.84], [108.905, 48.16]], Rb: [[84.912, 72.17], [86.909, 27.83]],
  Mg: [[23.985, 78.99], [24.986, 10.00], [25.983, 11.01]], Si: [[27.977, 92.23], [28.976, 4.67], [29.974, 3.10]], Ne: [[19.992, 90.48], [20.994, 0.27], [21.991, 9.25]]};
tpl({id: 'am-fwd', s: 'avgmass', d: 1, name: 'Average atomic mass', make(R) {
  let sy, data, name;
  if (R.f() < 0.45) { const m1 = R.i(40, 140) + R.r(0.89, 0.99, 3), gap = R.pick([1, 2, 2]), p1 = R.r(15, 85, 1); data = [[+m1.toFixed(3), p1], [+(m1 + gap + R.r(-0.006, 0.006, 3)).toFixed(3), +(100 - p1).toFixed(1)]]; name = 'Element X'; }
  else { sy = R.pick(Object.keys(ABUND).filter(k => R.f() < 0.4 || ABUND[k].length === 2)); data = ABUND[sy]; name = EL[sy].n; }
  const avg = data.reduce((s, [m, p]) => s + m * p / 100, 0), simple = data.reduce((s, [m]) => s + m, 0) / data.length, noPct = data.reduce((s, [m, p]) => s + m * p, 0), massNum = data.reduce((s, [m, p]) => s + Math.round(m) * p / 100, 0);
  const traps = [TR('a', simple, 'Weight each mass by how common it is. A plain average treats every isotope as equally common.', 'unweighted_average', 'concept'), TR('a', noPct, 'Change each percent to a decimal first (75.78% → 0.7578).', 'percent_not_decimal')];
  if (Math.abs(massNum - avg) / avg > 0.0006) traps.push(TR('a', massNum, 'Use the exact isotope masses given, not the rounded mass numbers.', 'used_mass_numbers', 'slip'));
  const rows = data.map(([m, p], k) => 'mass $' + m.toFixed(3) + '$ amu, abundance $' + p.toFixed(2).replace(/0$/, '') + '\\%$').join('; ');
  return one(name + ' has ' + data.length + ' natural isotopes: ' + rows + '. What is its average atomic mass?', NUM('a', 'Average atomic mass', avg, {sf: 4, unit: 'amu', tol: 0.0005}), traps,
    ['Multiply each isotope\'s mass by its abundance as a decimal, then add.', '$' + data.map(([m, p]) => m.toFixed(3) + '(' + (p / 100).toFixed(4).replace(/0+$/, '') + ')').join('+') + '$'],
    [[data.map(([m, p]) => m.toFixed(3) + '\\times' + (p / 100).toFixed(4).replace(/0+$/, '')).join('+'), 'Mass × fraction for each isotope.'], ['=' + data.map(([m, p]) => niceN(+(m * p / 100).toFixed(3), 5)).join('+'), ''], ['=' + nT(avg, 4) + '\\text{ amu}', 'The average sits closest to the most common isotope.']]);
}});
tpl({id: 'am-rev', s: 'avgmass', d: 3, name: 'Find a percent abundance', make(R) {
  const sy = R.pick(Object.keys(ABUND).filter(k => ABUND[k].length === 2)), [[m1], [m2]] = ABUND[sy], A = EL[sy].m, x = (A - m2) / (m1 - m2) * 100;
  return one(EL[sy].n + ' has two isotopes, with masses $' + m1.toFixed(3) + '$ amu and $' + m2.toFixed(3) + '$ amu. Its average atomic mass is $' + A.toFixed(2) + '$ amu. What percent of ' + EL[sy].n.toLowerCase() + ' atoms are the lighter isotope?', NUM('a', 'Percent abundance', x, {unit: '%', tol: 0.006, sf: 3}),
    [TR('a', 100 - x, 'That\'s the heavier isotope. The average is closer to the more common one.', 'other_isotope', 'procedure'), TR('a', x / 100, 'Change the fraction to a percent: multiply by 100.', 'percent_not_decimal')],
    ['Let $x$ be the fraction of the lighter isotope; the heavier one is $1-x$.', '$' + m1.toFixed(3) + 'x+' + m2.toFixed(3) + '(1-x)=' + A.toFixed(2) + '$'],
    [[m1.toFixed(3) + 'x+' + m2.toFixed(3) + '(1-x)=' + A.toFixed(2), 'The weighted average.'], ['x=' + F(A.toFixed(2) + '-' + m2.toFixed(3), m1.toFixed(3) + '-' + m2.toFixed(3)) + '=' + (x / 100).toFixed(4), 'Solve for x.'], [nT(x, 3) + '\\%', 'As a percent.']]);
}});
