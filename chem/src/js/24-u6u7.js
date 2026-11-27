// ---------- Templates, unit 6 (the mole and stoichiometry) and unit 7 (gases)
const NA = 6.02e23;
const MMPOOL = ['H2O', 'CO2', 'NaCl', 'CaCO3', 'C6H12O6', 'NH3', 'H2SO4', 'Ca(OH)2', 'Mg(NO3)2', 'Al2(SO4)3', '(NH4)3PO4', 'KMnO4', 'CuSO4·5H2O', 'C2H5OH', 'NaHCO3', 'Fe2O3', 'K2Cr2O7', 'Ba(OH)2', 'CH4', 'HCl', 'HNO3', 'H3PO4', 'Na2CO3', 'MgCl2', 'AlCl3', 'C3H8', 'C12H22O11', 'Ca3(PO4)2', 'Pb(NO3)2', 'AgNO3', 'KClO3', 'NH4NO3', 'SO2', 'Fe(OH)3', 'CaCl2'];
const mmSteps = f => { const c = parseFormula(f).c; return Object.keys(c).map(e => c[e] + '(' + m2(EL[e].m) + ')').join('+') + '=' + m2(molarMass(f)) + TX(' g/mol'); };
const withMasses = f => ' (' + massList(f) + ')';
const gv = (R, lo, hi) => { const v = R.r(lo, hi, lo >= 10 ? 1 : 2); return {v, s: v.toFixed(lo >= 10 ? 1 : 2)}; };   // a 3-significant-figure measurement

// ===== Unit 6 · Molar mass and mole conversions
tpl({id: 'mo-mm', s: 'molar', d: 1, name: 'Molar mass', make(R) {
  const f = R.pick(MMPOOL), M = molarMass(f), c = parseFormula(f).c, traps = [];
  if (/\)\d/.test(f)) traps.push(TR('a', molarMass(f.replace(/\)(\d+)/g, ')')), 'The subscript after the parentheses multiplies everything inside them.', 'paren_subscript'));
  if (f.includes('·')) traps.push(TR('a', molarMass(f.split('·')[0]), 'Include the water of hydration: ·' + f.split('·')[1] + ' adds ' + m2(molarMass(f) - molarMass(f.split('·')[0])) + ' g/mol.', 'hydrate_water'));
  traps.push(TR('a', Object.keys(c).reduce((s, e) => s + c[e] * EL[e].z, 0), 'Use atomic MASSES, not atomic numbers.', 'used_atomic_number', 'concept'));
  traps.push(TR('a', Object.keys(c).reduce((s, e) => s + EL[e].m, 0), 'Multiply each atomic mass by its subscript (how many of that atom there are).', 'ignored_subscripts'));
  return one('What is the molar mass of $' + ce(f) + '$?' + withMasses(f), NUM('a', 'Molar mass', M, {unit: 'g/mol', tol: 0.003}), traps,
    ['Add the atomic masses of every atom in the formula.', 'Count each element: ' + Object.keys(c).map(e => c[e] + ' ' + e).join(', ') + '.'],
    [[mmSteps(f), 'Atoms × atomic mass, added up.']]);
}});
tpl({id: 'mo-g2mol', s: 'molar', d: 1, name: 'Grams to moles', make(R) {
  const f = R.pick(MMPOOL), M = molarMass(f), g = gv(R, 10, 250), n = g.v / M;
  return one('How many moles are in $' + g.s + '$ g of $' + ce(f) + '$?' + withMasses(f), NUM('a', 'Moles', n, {sf: 3, unit: 'mol'}),
    [TR('a', g.v * M, 'Divide by the molar mass: grams ÷ (g/mol) = mol.', 'mole_multiplied'), TR('a', M / g.v, 'Grams go on top: n = mass ÷ molar mass.', 'mole_inverted')],
    ['Find the molar mass first.', '$n=' + F('\\text{mass}', '\\text{molar mass}') + '$'],
    [[mmSteps(f), 'Molar mass.'], [g.s + TX(' g') + '\\times' + F('1\\text{ mol}', m2(M) + '\\text{ g}') + '=' + nT(n, 3) + TX(' mol'), 'Grams cancel.']]);
}});
tpl({id: 'mo-mol2g', s: 'molar', d: 1, name: 'Moles to grams', make(R) {
  const f = R.pick(MMPOOL), M = molarMass(f), n = gv(R, 0.15, 9.5), g = n.v * M;
  return one('What is the mass of $' + n.s + '$ mol of $' + ce(f) + '$?' + withMasses(f), NUM('a', 'Mass', g, {sf: 3, unit: 'g'}),
    [TR('a', n.v / M, 'Multiply by the molar mass: mol × (g/mol) = g.', 'mole_inverted'), TR('a', M / n.v, 'Multiply moles by the molar mass.', 'mole_inverted')],
    ['Find the molar mass first.', '$\\text{mass}=n\\times\\text{molar mass}$'],
    [[mmSteps(f), 'Molar mass.'], [n.s + TX(' mol') + '\\times' + F(m2(M) + '\\text{ g}', '1\\text{ mol}') + '=' + nT(g, 3) + TX(' g'), 'Moles cancel.']]);
}});
tpl({id: 'mo-particles', s: 'molar', d: 2, name: 'Moles and particles', make(R) {
  const k = R.i(0, 2), f = R.pick(MMPOOL.filter(x => !x.includes('·'))), M = molarMass(f);
  if (k === 0) { const g = gv(R, 5, 95), N = g.v / M * NA;
    return one('How many molecules (or formula units) are in $' + g.s + '$ g of $' + ce(f) + '$? (Use $6.02\\times10^{23}$ per mole.)' + withMasses(f), NUM('a', 'Particles', N, {sf: 3}),
      [TR('a', g.v / M, 'That is moles. Multiply by Avogadro\'s number to count particles.', 'stopped_at_moles'), TR('a', g.v / M / NA, 'Multiply by $6.02\\times10^{23}$, don\'t divide.', 'avogadro_divided')],
      ['Grams → moles → particles.', '$' + g.s + '\\text{ g}\\times' + F('1\\text{ mol}', m2(M) + '\\text{ g}') + '\\times' + F('6.02\\times10^{23}', '1\\text{ mol}') + '$'],
      [[g.s + TX(' g') + '\\div' + m2(M) + '=' + nT(g.v / M, 3) + TX(' mol'), 'Grams to moles.'], [nT(g.v / M, 3) + '\\times6.02\\times10^{23}=' + nT(N, 3), 'Moles to particles.']]); }
  if (k === 1) { const m = R.r(1.1, 9.9, 2), e = R.i(21, 24), N = m * Math.pow(10, e), g = N / NA * M;
    return one('What is the mass of $' + nT(N, 3) + '$ molecules of $' + ce(f) + '$? (Use $6.02\\times10^{23}$ per mole.)' + withMasses(f), NUM('a', 'Mass', g, {sf: 3, unit: 'g'}),
      [TR('a', N / NA, 'That is moles. Multiply by the molar mass to get grams.', 'stopped_at_moles'), TR('a', N * NA * M, 'Divide by Avogadro\'s number to turn particles into moles.', 'avogadro_multiplied')],
      ['Particles → moles → grams.', '$n=' + F(nT(N, 3), '6.02\\times10^{23}') + '$'],
      [[F(nT(N, 3), '6.02\\times10^{23}') + '=' + nT(N / NA, 3) + TX(' mol'), 'Particles to moles.'], [nT(N / NA, 3) + '\\times' + m2(M) + '=' + nT(g, 3) + TX(' g'), 'Moles to grams.']]); }
  const ff = R.pick(['H2O', 'CO2', 'CH4', 'NH3', 'C6H12O6', 'H2SO4', 'C3H8', 'Fe2O3', 'Al2(SO4)3', 'C2H5OH']), c = parseFormula(ff).c, el = R.pick(Object.keys(c).filter(x => c[x] > 1).concat(Object.keys(c))), n = gv(R, 0.15, 4.5), N = n.v * c[el] * NA;
  return one('How many atoms of ' + EL[el].n.toLowerCase() + ' are in $' + n.s + '$ mol of $' + ce(ff) + '$? (Use $6.02\\times10^{23}$ per mole.)', NUM('a', 'Atoms of ' + el, N, {sf: 3}),
    c[el] > 1 ? [TR('a', n.v * NA, 'Each ' + ce(ff) + ' contains ' + c[el] + ' ' + el + ' atoms: multiply by ' + c[el] + ' too.', 'forgot_subscript'), TR('a', n.v * c[el], 'That is moles of ' + el + ' atoms. Multiply by Avogadro\'s number.', 'stopped_at_moles')] : [TR('a', n.v, 'That is moles. Multiply by Avogadro\'s number.', 'stopped_at_moles'), TR('a', n.v / NA, 'Multiply by Avogadro\'s number, don\'t divide.', 'avogadro_divided')],
    ['Moles of compound → particles, then count ' + el + ' atoms in each.', 'One ' + ce(ff) + ' has ' + c[el] + ' ' + el + ' atom' + (c[el] > 1 ? 's' : '') + '.'],
    [[n.s + '\\times' + c[el] + '=' + niceN(+(n.v * c[el]).toFixed(4)) + TX(' mol ' + el), c[el] + ' ' + el + ' per formula.'], [niceN(+(n.v * c[el]).toFixed(4)) + '\\times6.02\\times10^{23}=' + nT(N, 3), 'Moles to atoms.']]);
}});

// ===== Unit 6 · Percent composition and hydrates
tpl({id: 'pc-elem', s: 'pcomp', d: 1, name: 'Percent by mass', make(R) {
  const f = R.pick(['H2O', 'CO2', 'NaCl', 'CaCO3', 'C6H12O6', 'NH3', 'H2SO4', 'Fe2O3', 'Al2O3', 'KMnO4', 'C3H8', 'Mg(NO3)2', 'NaHCO3', 'Ca(OH)2', 'C2H5OH', 'NH4NO3', 'SO3', 'Na2SO4', 'CuO', 'Cu2O']);
  const c = parseFormula(f).c, el = R.pick(Object.keys(c)), M = molarMass(f), part = c[el] * EL[el].m, pct = part / M * 100, atoms = Object.values(c).reduce((a, b) => a + b, 0), traps = [TR('a', c[el] / atoms * 100, 'Percent composition is by MASS, not by number of atoms.', 'atom_fraction', 'concept')];
  if (c[el] > 1) traps.push(TR('a', EL[el].m / M * 100, 'There are ' + c[el] + ' ' + el + ' atoms: use ' + c[el] + ' × ' + m2(EL[el].m) + '.', 'forgot_subscript'));
  traps.push(TR('a', part / (M - part) * 100, 'Divide by the mass of the WHOLE compound, not just the other elements.', 'wrong_whole'));
  return one('What is the percent by mass of ' + EL[el].n.toLowerCase() + ' in $' + ce(f) + '$?' + withMasses(f), NUM('a', 'Percent ' + el, pct, {sf: 3, unit: '%'}), traps,
    ['$\\%=' + F('\\text{mass of ' + el + ' in one mole}', '\\text{molar mass}') + '\\times100$', 'Mass of ' + el + ': ' + c[el] + ' × ' + m2(EL[el].m) + ' = ' + m2(part) + ' g.'],
    [[mmSteps(f), 'Molar mass.'], [F(c[el] + '(' + m2(EL[el].m) + ')', m2(M)) + '\\times100=' + nT(pct, 3) + '\\%', '']]);
}});
const HYD = [['CuSO4', 5], ['MgSO4', 7], ['BaCl2', 2], ['Na2CO3', 10], ['CaCl2', 2], ['CoCl2', 6], ['ZnSO4', 7], ['Na2SO4', 10]];
tpl({id: 'pc-water', s: 'pcomp', d: 2, name: 'Percent water in a hydrate', make(R) {
  const [salt, x] = R.pick(HYD), f = salt + '·' + x + 'H2O', M = molarMass(f), W = molarMass('H2O'), pct = x * W / M * 100;
  return one('What is the percent by mass of water in $' + ce(f) + '$?' + withMasses(f), NUM('a', 'Percent water', pct, {sf: 3, unit: '%'}),
    [TR('a', W / M * 100, 'There are ' + x + ' water molecules per formula: use ' + x + ' × ' + m2(W) + '.', 'forgot_subscript'), TR('a', x * W / molarMass(salt) * 100, 'Divide by the mass of the whole hydrate, including the water.', 'wrong_whole')],
    ['Mass of water in one mole ÷ molar mass of the hydrate × 100.', 'Water: ' + x + ' × ' + m2(W) + ' = ' + m2(x * W) + ' g.'],
    [[mmSteps(f), 'Molar mass of the hydrate.'], [F(x + '(' + m2(W) + ')', m2(M)) + '\\times100=' + nT(pct, 3) + '\\%', '']]);
}});
tpl({id: 'pc-hydx', s: 'pcomp', d: 3, name: 'Find x in a hydrate', make(R) {
  let salt, x, mt, ma, ratio; do { [salt, x] = R.pick(HYD); const Ms = molarMass(salt); mt = R.r(2.5, 9.5, 2); ma = +(mt * Ms / (Ms + x * 18.02)).toFixed(2); ratio = ((mt - ma) / 18.02) / (ma / Ms); } while (Math.abs(ratio - x) > 0.15);
  const Ms = molarMass(salt), mw = +(mt - ma).toFixed(2), nw = mw / 18.02, ns = ma / Ms, traps = [];
  if (Math.round(mw / ma) !== x) traps.push(TR('x', Math.round(mw / ma), 'Compare MOLES, not grams: convert both masses first.', 'mass_ratio'));
  if (Math.round(ns / nw) !== x && Math.round(ns / nw) > 0) traps.push(TR('x', Math.round(ns / nw), 'Divide moles of water by moles of salt, not the other way round.', 'ratio_inverted'));
  traps.push(TR('x', x + 1, 'Recheck the mass of water lost: ' + mt.toFixed(2) + ' − ' + ma.toFixed(2) + ' = ' + mw.toFixed(2) + ' g.', 'not_equal', 'slip'));
  return one('A $' + mt.toFixed(2) + '$ g sample of $' + ce(salt + '·xH2O') + '$ is heated until all the water is gone. $' + ma.toFixed(2) + '$ g of $' + ce(salt) + '$ remains. Find x.' + withMasses([salt, 'H2O']), INT('x', 'x (waters per formula unit)', x), traps,
    ['Mass of water = mass before − mass after. Then convert both masses to moles.', 'x = moles of water ÷ moles of ' + ce(salt) + '.'],
    [[mt.toFixed(2) + '-' + ma.toFixed(2) + '=' + mw.toFixed(2) + TX(' g H₂O'), 'Water driven off.'], [F(mw.toFixed(2), '18.02') + '=' + nT(nw, 3) + TX(' mol H₂O'), ''], [F(ma.toFixed(2), m2(Ms)) + '=' + nT(ns, 3) + TX(' mol ') + ce(salt), ''], [F(nT(nw, 3), nT(ns, 3)) + '=' + (nw / ns).toFixed(2) + '\\approx' + x, 'Round to a whole number.']]);
}});

// ===== Unit 6 · Empirical and molecular formulas
const EMPS = ['CH2O', 'NO2', 'N2O5', 'Fe2O3', 'P2O5', 'Al2O3', 'Cu2O', 'C2H5', 'CH', 'KMnO4', 'Na2SO4', 'CH4O', 'C2H6O', 'Fe3O4', 'MnO2', 'Cr2O3', 'SO3', 'CaCO3', 'C3H8', 'CH2'];
tpl({id: 'ef-pct', s: 'empir', d: 2, name: 'Empirical formula from percents', make(R) {
  const f = R.pick(EMPS), c = parseFormula(f).c, M = molarMass(f), els = Object.keys(c), pcts = els.map(e => +(c[e] * EL[e].m / M * 100).toFixed(1));
  const mol = els.map((e, k) => pcts[k] / EL[e].m), mn = Math.min.apply(null, mol), rat = mol.map(x => x / mn), traps = [];
  const tryF = arr => els.map((e, k) => e + (arr[k] > 1 ? arr[k] : '')).join('');
  const up = rat.map(Math.ceil), dn = rat.map(x => Math.max(1, Math.floor(x + 0.02)));
  if (rat.some(x => Math.abs(x - Math.round(x)) > 0.1)) { if (tryF(up) !== f) traps.push(TR('f', tryF(up), 'A ratio like 1.5 or 1.33 isn\'t a whole number: multiply every ratio by 2 or 3, don\'t round it.', 'ratio_rounded')); if (tryF(dn) !== f && tryF(dn) !== tryF(up)) traps.push(TR('f', tryF(dn), 'A ratio like 1.5 or 1.33 isn\'t a whole number: multiply every ratio by 2 or 3, don\'t round it.', 'ratio_rounded')); }
  const pm = Math.min.apply(null, pcts), praw = pcts.map(p => Math.round(p / pm)); if (tryF(praw) !== f) traps.push(TR('f', tryF(praw), 'Mass percents aren\'t mole ratios: divide each mass by its atomic mass first.', 'percent_as_moles', 'concept'));
  const mm = els.map(e => c[e]), k2 = mm.map(x => x * 2); traps.push(TR('f', tryF(k2), 'Reduce to the simplest whole-number ratio.', 'not_reduced'));
  return Object.assign(one('A compound is ' + els.map((e, k) => '$' + pcts[k].toFixed(1) + '\\%$ ' + EL[e].n.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' by mass. What is its empirical formula?' + withMasses(els.join('')), FRM('f', 'Empirical formula', f, {order: 'any'}), traps,
    ['Assume 100 g, so each percent becomes grams. Convert each to moles.', 'Divide every mole amount by the smallest; if you get x.5 or x.33, multiply all by 2 or 3.'],
    [['', 'In 100 g: ' + els.map((e, k) => pcts[k].toFixed(1) + ' g ' + e).join(', ') + '.'], [els.map((e, k) => F(pcts[k].toFixed(1), m2(EL[e].m)) + '=' + mol[k].toFixed(3)).join(',\\;'), 'Moles of each.'], [els.map((e, k) => e + ':' + rat[k].toFixed(2)).join(',\\;'), 'Divide by the smallest.'], [ce(f), rat.some(x => Math.abs(x - Math.round(x)) > 0.1) ? 'Multiply to clear the fraction.' : 'Whole-number ratio.']]), {chk: {pcts, els, f}});
}});
const MOLF = [['CH2O', 'C6H12O6'], ['CH', 'C6H6'], ['CH2', 'C6H12'], ['NO2', 'N2O4'], ['P2O5', 'P4O10'], ['C2H5', 'C4H10'], ['CH2O', 'C2H4O2'], ['HO', 'H2O2'], ['C3H4', 'C9H12'], ['CH2', 'C4H8'], ['C2H3', 'C4H6'], ['CH3', 'C2H6']];
tpl({id: 'ef-molec', s: 'empir', d: 2, name: 'Molecular formula', make(R) {
  const [e, m] = R.pick(MOLF), Me = molarMass(e), Mm = molarMass(m), k = Math.round(Mm / Me), sc = (f, n) => { const c = parseFormula(f).c; return Object.keys(c).map(x => x + (c[x] * n > 1 ? c[x] * n : '')).join(''); };
  const traps = [TR('f', e, 'That is the empirical formula. Multiply its subscripts by ' + k + ' to reach ' + m2(Mm) + ' g/mol.', 'stopped_at_empirical')];
  if (k > 2) traps.push(TR('f', sc(e, k - 1), 'Check the multiplier: ' + m2(Mm) + ' ÷ ' + m2(Me) + ' = ' + k + '.', 'wrong_multiple'));
  traps.push(TR('f', sc(e, k + 1), 'Check the multiplier: ' + m2(Mm) + ' ÷ ' + m2(Me) + ' = ' + k + '.', 'wrong_multiple'));
  return one('A compound has the empirical formula $' + ce(e) + '$ and a molar mass of $' + m2(Mm) + '$ g/mol. What is its molecular formula?' + withMasses(e), FRM('f', 'Molecular formula', m, {order: 'any'}), traps,
    ['Find the empirical formula\'s mass, then how many times it fits into the molar mass.', 'Empirical mass: ' + m2(Me) + ' g/mol.'],
    [[mmSteps(e), 'Empirical formula mass.'], [F(m2(Mm), m2(Me)) + '=' + k, 'Multiplier.'], [ce(m), 'Multiply every subscript by ' + k + '.']]);
}});

// ===== Unit 6 · Stoichiometry
const STQ = EQS.filter(e => ['syn', 'dec', 'sr', 'comb', 'dr'].includes(e[3]) && !e[0].concat(e[1]).some(f => ['P4', 'HgO', 'Fe2O3', 'C2H6', 'C4H10', 'N2O5', 'Hg'].includes(f)));
const pickPair = (R, E) => { const sp = E[0].concat(E[1]); let a, b; do { a = R.i(0, E[0].length - 1); b = R.i(0, sp.length - 1); } while (b === a || b < E[0].length && R.f() < 0.8); return [a, b, sp]; };
const ratioF = (E, a, b, sp) => F(E[2][b] + '\\text{ mol ' + sp[b].replace(/(\d)/g, '_$1') + '}', E[2][a] + '\\text{ mol ' + sp[a].replace(/(\d)/g, '_$1') + '}');
tpl({id: 'st-mole', s: 'stoich', d: 1, name: 'Mole-to-mole', make(R) {
  let E, a, b, sp; do { E = R.pick(STQ); [a, b, sp] = pickPair(R, E); } while (E[2][a] === E[2][b]);
  const n = gv(R, 0.25, 9.5), ans = n.v * E[2][b] / E[2][a], traps = [];
  if (E[2][a] !== E[2][b]) { traps.push(TR('a', n.v * E[2][a] / E[2][b], 'The ratio is upside down: put what you want (' + ce(sp[b]) + ') on top.', 'ratio_flipped')); traps.push(TR('a', n.v, 'Use the coefficients: ' + E[2][a] + ' mol ' + sp[a] + ' gives ' + E[2][b] + ' mol ' + sp[b] + '.', 'ratio_ignored')); }
  return one('In $' + ce(eqBal(E)) + '$, how many moles of $' + ce(sp[b]) + '$ ' + (b < E[0].length ? 'react with' : 'form from') + ' $' + n.s + '$ mol of $' + ce(sp[a]) + '$?', NUM('a', 'Moles of ' + sp[b], ans, {sf: 3, unit: 'mol'}), traps,
    ['The coefficients are the mole ratio.', 'Multiply by $' + ratioF(E, a, b, sp) + '$.'],
    [[n.s + '\\text{ mol}\\times' + ratioF(E, a, b, sp) + '=' + nT(ans, 3) + TX(' mol'), 'Mole ratio from the coefficients.']]);
}});
tpl({id: 'st-mass', s: 'stoich', d: 2, name: 'Mass-to-mass', wk: true, make(R) {
  const E = R.pick(STQ), [a, b, sp] = pickPair(R, E), Ma = molarMass(sp[a]), Mb = molarMass(sp[b]), g = gv(R, 5, 95), na = g.v / Ma, nb = na * E[2][b] / E[2][a], ans = nb * Mb, traps = [];
  if (E[2][a] !== E[2][b]) { traps.push(TR('a', na * E[2][a] / E[2][b] * Mb, 'The mole ratio is upside down: what you want goes on top.', 'ratio_flipped')); traps.push(TR('a', na * Mb, 'Include the mole ratio from the coefficients (' + E[2][a] + ' : ' + E[2][b] + ').', 'ratio_ignored')); }
  traps.push(TR('a', nb, 'That is moles of ' + sp[b] + '. Multiply by its molar mass for grams.', 'stopped_at_moles'));
  traps.push(TR('a', g.v * E[2][b] / E[2][a], 'Coefficients are MOLE ratios, not gram ratios: convert grams to moles first.', 'gram_ratio', 'concept'));
  return Object.assign(one('In $' + ce(eqBal(E)) + '$, what mass of $' + ce(sp[b]) + '$ ' + (b < E[0].length ? 'reacts with' : 'forms from') + ' $' + g.s + '$ g of $' + ce(sp[a]) + '$?' + withMasses([sp[a], sp[b]]), NUM('a', 'Mass of ' + sp[b], ans, {sf: 3, unit: 'g'}), traps,
    ['Grams of ' + sp[a] + ' → moles → mole ratio → moles of ' + sp[b] + ' → grams.', 'Mole ratio: $' + ratioF(E, a, b, sp) + '$.'],
    [[F(g.s + '\\text{ g}', m2(Ma) + '\\text{ g/mol}') + '=' + nT(na, 3) + TX(' mol'), 'Grams to moles.'], [nT(na, 3) + '\\times' + ratioF(E, a, b, sp) + '=' + nT(nb, 3) + TX(' mol'), 'Mole ratio.'], [nT(nb, 3) + '\\times' + m2(Mb) + '=' + nT(ans, 3) + TX(' g'), 'Moles to grams.']]),
    {frame: {q: 'Which mole ratio turns moles of ' + ce(sp[a]) + ' into moles of ' + ce(sp[b]) + '?', opts: [ratioF(E, a, b, sp), ratioF(E, b, a, sp), F('1\\text{ mol ' + sp[b].replace(/(\d)/g, '_$1') + '}', '1\\text{ mol ' + sp[a].replace(/(\d)/g, '_$1') + '}')].filter((x, k, arr) => arr.indexOf(x) === k).concat(E[2][a] === E[2][b] ? [F(2 * E[2][b] + '\\text{ mol}', E[2][a] + '\\text{ mol}')] : [])}});
}});

// ===== Unit 6 · Limiting reactant and percent yield
const LIMQ = [[['H2', 'O2'], ['H2O'], [2, 1, 2]], [['N2', 'H2'], ['NH3'], [1, 3, 2]], [['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2]], [['Mg', 'O2'], ['MgO'], [2, 1, 2]], [['Na', 'Cl2'], ['NaCl'], [2, 1, 2]], [['Al', 'Cl2'], ['AlCl3'], [2, 3, 2]],
  [['Zn', 'HCl'], ['ZnCl2', 'H2'], [1, 2, 1, 1]], [['AgNO3', 'NaCl'], ['AgCl', 'NaNO3'], [1, 1, 1, 1]], [['Fe', 'Cl2'], ['FeCl3'], [2, 3, 2]], [['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4]], [['Al', 'O2'], ['Al2O3'], [4, 3, 2]]];
function limSetup(R) {
  const E = R.pick(LIMQ), [A, B] = E[0], MA = molarMass(A), MB = molarMass(B); let gA, gB, xA, xB;
  do { gA = gv(R, 5, 60); gB = gv(R, 5, 60); xA = gA.v / MA / E[2][0]; xB = gB.v / MB / E[2][1]; } while (Math.max(xA, xB) / Math.min(xA, xB) < 1.25 || Math.max(xA, xB) / Math.min(xA, xB) > 4);
  return {E, A, B, MA, MB, gA, gB, xA, xB, lim: xA < xB ? 0 : 1};
}
tpl({id: 'lm-which', s: 'limit', d: 2, name: 'Find the limiting reactant', make(R) {
  const S = limSetup(R), L = S.lim === 0 ? S.A : S.B, X = S.lim === 0 ? S.B : S.A, P = S.E[1][0], cP = S.E[2][2];
  const pA = S.xA * cP, pB = S.xB * cP;
  return MCI('For $' + ce(eqBal([S.E[0], S.E[1], S.E[2]])) + '$, you mix $' + S.gA.s + '$ g of $' + ce(S.A) + '$ with $' + S.gB.s + '$ g of $' + ce(S.B) + '$. Which is the limiting reactant?' + withMasses([S.A, S.B]), '$' + ce(L) + '$',
    [['$' + ce(X) + '$', 'Compare how much product each could make: ' + ce(S.A) + ' → ' + nT(pA, 3) + ' mol ' + P + ', ' + ce(S.B) + ' → ' + nT(pB, 3) + ' mol. The smaller one runs out first.', 'limiting_by_mass', 'concept']],
    ['Don\'t compare grams. Convert both to moles, then see how much product each could make.', 'Divide each reactant\'s moles by its coefficient: the smaller result is limiting.'],
    [[F(S.gA.s, m2(S.MA)) + '=' + nT(S.gA.v / S.MA, 3) + TX(' mol ') + ce(S.A) + ',\\;' + F(S.gB.s, m2(S.MB)) + '=' + nT(S.gB.v / S.MB, 3) + TX(' mol ') + ce(S.B), 'Moles of each.'], ['', 'Product each could make: ' + nT(pA, 3) + ' vs ' + nT(pB, 3) + ' mol ' + P + '.'], ['', ce(L) + ' makes less, so it is limiting.']]);
}});
tpl({id: 'lm-product', s: 'limit', d: 3, name: 'Product from the limiting reactant', make(R) {
  const S = limSetup(R), P = S.E[1][0], cP = S.E[2][2], MP = molarMass(P), nP = Math.min(S.xA, S.xB) * cP, ans = nP * MP, ex = Math.max(S.xA, S.xB) * cP * MP;
  return one('For $' + ce(eqBal([S.E[0], S.E[1], S.E[2]])) + '$, $' + S.gA.s + '$ g of $' + ce(S.A) + '$ reacts with $' + S.gB.s + '$ g of $' + ce(S.B) + '$. What mass of $' + ce(P) + '$ can form?' + withMasses([S.A, S.B, P]), NUM('a', 'Mass of ' + P, ans, {sf: 3, unit: 'g'}),
    [TR('a', ex, 'That uses the reactant in EXCESS. The limiting reactant runs out first and decides how much forms.', 'used_excess', 'concept'), TR('a', nP, 'That is moles of product. Multiply by its molar mass.', 'stopped_at_moles')],
    ['Work out the product from EACH reactant. The smaller answer is the real one.', 'Moles ÷ coefficient tells you which runs out first.'],
    [['', 'From ' + ce(S.A) + ': ' + nT(S.xA * cP * MP, 3) + ' g; from ' + ce(S.B) + ': ' + nT(S.xB * cP * MP, 3) + ' g of ' + ce(P) + '.'], ['', 'The smaller amount, ' + nT(ans, 3) + ' g, is the theoretical yield: ' + ce(S.lim === 0 ? S.A : S.B) + ' is limiting.']]);
}});
tpl({id: 'lm-yield', s: 'limit', d: 1, name: 'Percent yield', make(R) {
  const th = gv(R, 12, 95), act = +(th.v * R.r(0.55, 0.97, 3)).toFixed(1), py = act / th.v * 100;
  return one('A reaction should produce $' + th.s + '$ g of product, but only $' + act.toFixed(1) + '$ g is collected. What is the percent yield?', NUM('a', 'Percent yield', py, {sf: 3, unit: '%'}),
    [TR('a', th.v / act * 100, 'Actual ÷ theoretical, not the other way round: a yield can\'t be over 100% here.', 'yield_inverted'), TR('a', act / th.v, 'Multiply by 100 to get a percent.', 'yield_no_percent')],
    ['$\\%\\text{ yield}=' + F('\\text{actual}', '\\text{theoretical}') + '\\times100$', '$' + F(act.toFixed(1), th.s) + '\\times100$'],
    [[F(act.toFixed(1) + '\\text{ g}', th.s + '\\text{ g}') + '\\times100=' + nT(py, 3) + '\\%', '']]);
}});
tpl({id: 'lm-yield2', s: 'limit', d: 2, name: 'Yield from a reaction', make(R) {
  const E = R.pick(STQ.filter(e => e[0].length >= 1)), sp = E[0].concat(E[1]), a = 0, b = E[0].length, Ma = molarMass(sp[a]), Mb = molarMass(sp[b]), g = gv(R, 10, 90), th = g.v / Ma * E[2][b] / E[2][a] * Mb, act = +(th * R.r(0.6, 0.95, 3)).toPrecision(3), py = act / th * 100;
  return one('In $' + ce(eqBal(E)) + '$, $' + g.s + '$ g of $' + ce(sp[a]) + '$ reacts completely and $' + nT(act, 3) + '$ g of $' + ce(sp[b]) + '$ is collected. What is the percent yield?' + withMasses([sp[a], sp[b]]), NUM('a', 'Percent yield', py, {sf: 3, unit: '%'}),
    [TR('a', act / g.v * 100, 'Compare with the THEORETICAL yield of ' + sp[b] + ' (from stoichiometry), not the mass of ' + sp[a] + '.', 'wrong_theoretical', 'concept'), TR('a', th / act * 100, 'Actual ÷ theoretical.', 'yield_inverted')],
    ['First find the theoretical yield of ' + sp[b] + ' from ' + g.s + ' g of ' + sp[a] + '.', 'Then % yield = actual ÷ theoretical × 100.'],
    [[g.s + '\\div' + m2(Ma) + '\\times' + ratioF(E, a, b, sp) + '\\times' + m2(Mb) + '=' + nT(th, 3) + TX(' g'), 'Theoretical yield.'], [F(nT(act, 3), nT(th, 3)) + '\\times100=' + nT(py, 3) + '\\%', 'Percent yield.']]);
}});
tpl({id: 'lm-excess', s: 'limit', d: 3, name: 'Excess reactant left over', make(R) {
  const S = limSetup(R), L = S.lim, X = 1 - L, gX = X === 0 ? S.gA : S.gB, MX = X === 0 ? S.MA : S.MB, used = Math.min(S.xA, S.xB) * S.E[2][X] * MX, left = gX.v - used, sp = S.E[0];
  return one('For $' + ce(eqBal([S.E[0], S.E[1], S.E[2]])) + '$, $' + S.gA.s + '$ g of $' + ce(S.A) + '$ reacts with $' + S.gB.s + '$ g of $' + ce(S.B) + '$. How many grams of the excess reactant are left over?' + withMasses([S.A, S.B]), NUM('a', 'Excess left', left, {sf: 3, unit: 'g', tol: 0.02}),
    [TR('a', used, 'That is how much of the excess reactant gets USED. Subtract it from the starting amount.', 'used_not_left'), TR('a', gX.v, 'Some of the excess reactant does react: subtract the amount used.', 'nothing_used')],
    ['Find the limiting reactant, then how much of the other reactant it uses up.', 'Left over = starting mass − mass used.'],
    [['', ce(sp[L]) + ' is limiting.'], [nT(Math.min(S.xA, S.xB) * S.E[2][L], 3) + TX(' mol ') + ce(sp[L]) + '\\to' + nT(Math.min(S.xA, S.xB) * S.E[2][X], 3) + TX(' mol ') + ce(sp[X]) + '=' + nT(used, 3) + TX(' g used'), 'Mole ratio, then grams.'], [gX.s + '-' + nT(used, 3) + '=' + nT(left, 3) + TX(' g'), 'Left over.']]);
}});

// ===== Unit 7 · Pressure, temperature and kinetic-molecular theory
const PU = {atm: 1, kPa: 101.3, mmHg: 760, psi: 14.7};
tpl({id: 'gp-conv', s: 'pressure', d: 1, name: 'Pressure units', make(R) {
  let a, b; do { a = R.pick(Object.keys(PU)); b = R.pick(Object.keys(PU)); } while (a === b);
  const v = a === 'mmHg' ? {v: R.i(300, 1500), s: ''} : gv(R, a === 'kPa' ? 50 : 0.5, a === 'kPa' ? 250 : (a === 'psi' ? 40 : 3.5)); if (a === 'mmHg') v.s = String(v.v);
  const ans = v.v * PU[b] / PU[a];
  return one('Convert $' + v.s + '$ ' + a + ' to ' + b + '. (1 atm = 101.3 kPa = 760 mmHg = 14.7 psi)', NUM('a', b, ans, {sf: 3, unit: b, tol: 0.004}),
    [TR('a', v.v * PU[a] / PU[b], 'Flip the factor so ' + a + ' cancels: ' + b + ' on top.', 'conversion_flipped')],
    ['Use the equality ' + PU[a] + ' ' + a + ' = ' + PU[b] + ' ' + b + '.', '$' + v.s + '\\text{ ' + a + '}\\times' + F(PU[b] + '\\text{ ' + b + '}', PU[a] + '\\text{ ' + a + '}') + '$'],
    [[v.s + '\\text{ ' + a + '}\\times' + F(PU[b] + '\\text{ ' + b + '}', PU[a] + '\\text{ ' + a + '}') + '=' + nT(ans, 3) + '\\text{ ' + b + '}', '']]);
}});
tpl({id: 'gp-temp', s: 'pressure', d: 1, name: 'Celsius and kelvin', make(R) {
  const toK = R.f() < 0.6, c = R.i(-80, 250), k = c + 273;
  return toK ? one('Convert $' + c + '$ °C to kelvin.', NUM('a', 'Temperature', k + 0.15, {unit: 'K', abs: 0.2}), [TR('a', c - 273, 'Add 273 to go from °C to K.', 'kelvin_subtracted'), TR('a', 273 - c, 'K = °C + 273.', 'kelvin_subtracted')], ['$K=°C+273$', '$' + c + '+273$'], [[c + '+273=' + k + TX(' K'), 'Kelvin starts at absolute zero (−273 °C).']])
    : one('Convert $' + k + '$ K to degrees Celsius.', NUM('a', 'Temperature', c - 0.15, {unit: '°C', abs: 0.2}), [TR('a', k + 273, 'Subtract 273 to go from K to °C.', 'kelvin_subtracted')], ['$°C=K-273$', '$' + k + '-273$'], [[k + '-273=' + c + TX(' °C'), '']]);
}});
const KMT = [['According to kinetic-molecular theory, the temperature of a gas measures…', 'The average kinetic energy of its particles', [['The total mass of the gas', 'Mass doesn\'t change with temperature.'], ['The size of its particles', 'Gas particles are treated as points; heating doesn\'t make them bigger.'], ['The number of collisions per molecule only', 'Collisions depend on temperature, but temperature itself is average kinetic energy.']]],
  ['What causes gas pressure?', 'Gas particles colliding with the walls of the container', [['Gas particles attracting each other', 'Ideal gas particles don\'t attract; pressure comes from collisions.'], ['The weight of the particles', 'Gas particles are far too light; it is collisions that push.'], ['Particles expanding when heated', 'Particles don\'t expand; they move faster.']]],
  ['Which assumption is part of the kinetic-molecular theory of ideal gases?', 'Gas particles have no attractions or repulsions for each other', [['Gas particles take up most of the container\'s volume', 'They are tiny compared with the space between them.'], ['Collisions between particles lose energy', 'Collisions are elastic: no energy is lost.'], ['Gas particles stay still until heated', 'Gas particles are always in random, rapid motion.']]],
  ['Real gases behave most like ideal gases at…', 'High temperature and low pressure', [['Low temperature and high pressure', 'Those conditions bring particles close and slow, so attractions matter.'], ['Low temperature and low pressure', 'Low temperature makes attractions matter.'], ['High pressure only', 'High pressure squeezes particles together, so their size matters.']]],
  ['Which gas effuses fastest at the same temperature?', 'H₂ (the lightest)', [['O₂', 'Heavier particles move more slowly at the same temperature.'], ['CO₂', 'Heavier particles move more slowly at the same temperature.'], ['They all effuse at the same rate', 'Same average kinetic energy, so lighter particles must move faster.']]],
  ['What is standard temperature and pressure (STP)?', '0 °C (273 K) and 1 atm', [['25 °C and 1 atm', 'That is often called room temperature, not STP.'], ['0 K and 1 atm', 'Standard temperature is 0 °C, which is 273 K.'], ['100 °C and 760 mmHg', 'Standard temperature is 0 °C.']]]];
tpl({id: 'gp-kmt', s: 'pressure', d: 1, name: 'Kinetic-molecular theory', make(R) {
  const [q, a, w] = R.pick(KMT); return MCI(q, a, w.map(x => [x[0], x[1], 'kmt', 'concept']), ['Picture tiny particles in constant, random motion, far apart, bouncing off the walls.', 'Temperature = average kinetic energy; pressure = wall collisions.'], [['', a + '.']]);
}});

// ===== Unit 7 · Boyle, Charles, Gay-Lussac and the combined gas law
const GLAWS = {boyle: 'P_1V_1=P_2V_2', charles: F('V_1', 'T_1') + '=' + F('V_2', 'T_2'), gay: F('P_1', 'T_1') + '=' + F('P_2', 'T_2'), comb: F('P_1V_1', 'T_1') + '=' + F('P_2V_2', 'T_2')};
const lawFrame = (k, held) => ({q: 'Which gas law fits? (' + held + ')', opts: [GLAWS[k]].concat(R_LAWS(k))});
const R_LAWS = k => Object.keys(GLAWS).filter(x => x !== k).slice(0, 2).map(x => GLAWS[x]);
tpl({id: 'gl-boyle', s: 'gaslaw', d: 1, name: "Boyle's law", wk: true, make(R) {
  const P1 = gv(R, 0.8, 3.5), V1 = gv(R, 1.5, 9.5), findV = R.f() < 0.6, P2 = gv(R, 0.8, 3.5), V2 = gv(R, 1.5, 9.5);
  if (Math.abs(P2.v / P1.v - 1) < 0.1 || Math.abs(V2.v / V1.v - 1) < 0.1) return TPL['gl-boyle'].make(R);
  if (findV) { const ans = P1.v * V1.v / P2.v;
    return Object.assign(one('A gas occupies $' + V1.s + '$ L at $' + P1.s + '$ atm. At constant temperature, what is its volume at $' + P2.s + '$ atm?', NUM('a', 'New volume', ans, {sf: 3, unit: 'L'}),
      [TR('a', V1.v * P2.v / P1.v, 'Pressure and volume are inversely related: more pressure, less volume. Use P₁V₁ = P₂V₂.', 'law_inverted', 'concept'), TR('a', P1.v * V1.v * P2.v, 'Divide by P₂: V₂ = P₁V₁ ÷ P₂.', 'rearranged_wrong')],
      ['Temperature is constant: Boyle\'s law, $P_1V_1=P_2V_2$.', '$V_2=' + F('P_1V_1', 'P_2') + '$'], [['V_2=' + F('P_1V_1', 'P_2') + '=' + F('(' + P1.s + ')(' + V1.s + ')', P2.s), ''], ['=' + nT(ans, 3) + TX(' L'), P2.v > P1.v ? 'More pressure, smaller volume.' : 'Less pressure, bigger volume.']]), {frame: lawFrame('boyle', 'temperature and amount stay the same')}); }
  const ans = P1.v * V1.v / V2.v;
  return Object.assign(one('A gas at $' + P1.s + '$ atm is in a $' + V1.s + '$ L container. It is moved, at the same temperature, into a $' + V2.s + '$ L container. What is the new pressure?', NUM('a', 'New pressure', ans, {sf: 3, unit: 'atm'}),
    [TR('a', P1.v * V2.v / V1.v, 'Pressure and volume are inversely related. Use P₁V₁ = P₂V₂.', 'law_inverted', 'concept')],
    ['Temperature is constant: Boyle\'s law.', '$P_2=' + F('P_1V_1', 'V_2') + '$'], [['P_2=' + F('(' + P1.s + ')(' + V1.s + ')', V2.s) + '=' + nT(ans, 3) + TX(' atm'), '']]), {frame: lawFrame('boyle', 'temperature and amount stay the same')});
}});
tpl({id: 'gl-charles', s: 'gaslaw', d: 2, name: "Charles's law", wk: true, make(R) {
  const V1 = gv(R, 1.5, 9.5), t1 = R.i(5, 90), t2 = R.i(-40, 200), T1 = t1 + 273, T2 = t2 + 273; if (Math.abs(T2 / T1 - 1) < 0.1) return TPL['gl-charles'].make(R);
  const ans = V1.v * T2 / T1;
  return Object.assign(one('A balloon holds $' + V1.s + '$ L of gas at $' + t1 + '$ °C. At constant pressure, what is its volume at $' + t2 + '$ °C?', NUM('a', 'New volume', ans, {sf: 3, unit: 'L'}),
    [t1 ? TR('a', V1.v * t2 / t1, 'Gas-law temperatures must be in kelvin: add 273.', 'celsius_in_law', 'concept') : null, TR('a', V1.v * T1 / T2, 'Volume and kelvin temperature are directly proportional: hotter means bigger.', 'law_inverted', 'concept')].filter(Boolean),
    ['Pressure is constant: Charles\'s law, $' + GLAWS.charles + '$, with T in kelvin.', '$T_1=' + T1 + '\\text{ K},\\;T_2=' + T2 + '\\text{ K}$'],
    [['T_1=' + t1 + '+273=' + T1 + '\\text{ K},\\;T_2=' + t2 + '+273=' + T2 + '\\text{ K}', 'Convert to kelvin.'], ['V_2=V_1' + F('T_2', 'T_1') + '=' + V1.s + '\\times' + F(T2, T1) + '=' + nT(ans, 3) + TX(' L'), '']]), {frame: lawFrame('charles', 'pressure and amount stay the same')});
}});
tpl({id: 'gl-gay', s: 'gaslaw', d: 2, name: "Gay-Lussac's law", wk: true, make(R) {
  const P1 = gv(R, 0.8, 3.5), t1 = R.i(5, 40), t2 = R.i(60, 300), T1 = t1 + 273, T2 = t2 + 273, ans = P1.v * T2 / T1;
  return Object.assign(one('A sealed can holds gas at $' + P1.s + '$ atm and $' + t1 + '$ °C. What is the pressure when the can is heated to $' + t2 + '$ °C?', NUM('a', 'New pressure', ans, {sf: 3, unit: 'atm'}),
    [TR('a', P1.v * t2 / t1, 'Gas-law temperatures must be in kelvin: add 273.', 'celsius_in_law', 'concept'), TR('a', P1.v * T1 / T2, 'Pressure and kelvin temperature are directly proportional: hotter means higher pressure.', 'law_inverted', 'concept')],
    ['The volume of a sealed can is fixed: $' + GLAWS.gay + '$, with T in kelvin.', '$T_1=' + T1 + '\\text{ K},\\;T_2=' + T2 + '\\text{ K}$'],
    [['T_1=' + T1 + '\\text{ K},\\;T_2=' + T2 + '\\text{ K}', 'Convert to kelvin.'], ['P_2=P_1' + F('T_2', 'T_1') + '=' + P1.s + '\\times' + F(T2, T1) + '=' + nT(ans, 3) + TX(' atm'), '']]), {frame: lawFrame('gay', 'volume and amount stay the same')});
}});
tpl({id: 'gl-comb', s: 'gaslaw', d: 3, name: 'Combined gas law', wk: true, make(R) {
  const P1 = gv(R, 0.8, 3.5), V1 = gv(R, 1.5, 9.5), t1 = R.i(5, 60), P2 = gv(R, 0.8, 3.5), t2 = R.i(-20, 150), T1 = t1 + 273, T2 = t2 + 273, ans = P1.v * V1.v * T2 / (T1 * P2.v);
  return Object.assign(one('A gas occupies $' + V1.s + '$ L at $' + P1.s + '$ atm and $' + t1 + '$ °C. What volume does it occupy at $' + P2.s + '$ atm and $' + t2 + '$ °C?', NUM('a', 'New volume', ans, {sf: 3, unit: 'L'}),
    [t2 ? TR('a', P1.v * V1.v * t2 / (t1 * P2.v), 'Gas-law temperatures must be in kelvin.', 'celsius_in_law', 'concept') : null, TR('a', P1.v * V1.v * T1 / (T2 * P2.v), 'Volume is directly proportional to kelvin temperature: put T₂ on top.', 'law_inverted', 'concept'), TR('a', P2.v * V1.v * T2 / (T1 * P1.v), 'Volume is inversely proportional to pressure: P₁ goes on top.', 'law_inverted', 'concept')].filter(Boolean),
    ['Pressure, volume and temperature all change: $' + GLAWS.comb + '$.', '$V_2=V_1\\times' + F('P_1', 'P_2') + '\\times' + F('T_2', 'T_1') + '$ (T in K)'],
    [['T_1=' + T1 + '\\text{ K},\\;T_2=' + T2 + '\\text{ K}', 'Kelvin.'], ['V_2=' + V1.s + '\\times' + F(P1.s, P2.s) + '\\times' + F(T2, T1) + '=' + nT(ans, 3) + TX(' L'), '']]), {frame: lawFrame('comb', 'pressure, volume and temperature all change')});
}});

// ===== Unit 7 · Ideal gas law
const RGAS = 0.0821;
tpl({id: 'ig-solve', s: 'ideal', d: 2, name: 'PV = nRT', make(R) {
  const k = R.pick(['P', 'V', 'n', 'T']), P = gv(R, 0.5, 4.5), V = gv(R, 1.5, 45), n = gv(R, 0.12, 3.5), t = R.i(-30, 150), T = t + 273;
  const RS = '0.0821\\text{ L·atm/(mol·K)}', given = {P: '$P=' + P.s + '$ atm', V: '$V=' + V.s + '$ L', n: '$n=' + n.s + '$ mol', T: '$T=' + t + '$ °C'}, unit = {P: 'atm', V: 'L', n: 'mol', T: 'K'};
  const ans = {P: n.v * RGAS * T / V.v, V: n.v * RGAS * T / P.v, n: P.v * V.v / (RGAS * T), T: P.v * V.v / (n.v * RGAS)}[k];
  if (k === 'T' && (ans < 120 || ans > 900)) return TPL['ig-solve'].make(R);
  const traps = [];
  if (k !== 'T' && t) traps.push(TR('a', {P: n.v * RGAS * t / V.v, V: n.v * RGAS * t / P.v, n: P.v * V.v / (RGAS * t)}[k], 'Use kelvin in PV = nRT: ' + t + ' °C = ' + T + ' K.', 'celsius_in_law', 'concept'));
  traps.push(TR('a', ans * (k === 'n' || k === 'T' ? 101.3 / 8.314 * 0.0821 * 0 + 0.0821 / 8.314 : 8.314 / 0.0821), 'With atm and liters, R = 0.0821 L·atm/(mol·K), not 8.314.', 'wrong_R'));
  if (k === 'T') traps.push(TR('a', ans - 273, 'The gas law gives kelvin. The question asks for kelvin, so don\'t subtract 273.', 'kelvin_subtracted'));
  const rest = ['P', 'V', 'n', 'T'].filter(x => x !== k).map(x => given[x]).join(', ');
  return one('A gas sample has ' + rest + '. What is ' + {P: 'its pressure', V: 'its volume', n: 'the number of moles', T: 'its temperature in kelvin'}[k] + '? ($R=' + RS + '$)', NUM('a', k, ans, {sf: 3, unit: unit[k]}), traps,
    ['$PV=nRT$. Convert temperature to kelvin first.', 'Solve for ' + k + ': $' + k + '=' + {P: F('nRT', 'V'), V: F('nRT', 'P'), n: F('PV', 'RT'), T: F('PV', 'nR')}[k] + '$'],
    [[k === 'T' ? '' : 'T=' + t + '+273=' + T + '\\text{ K}', k === 'T' ? '' : 'Kelvin.'], [k + '=' + {P: F('(' + n.s + ')(0.0821)(' + T + ')', V.s), V: F('(' + n.s + ')(0.0821)(' + T + ')', P.s), n: F('(' + P.s + ')(' + V.s + ')', '(0.0821)(' + T + ')'), T: F('(' + P.s + ')(' + V.s + ')', '(' + n.s + ')(0.0821)')}[k] + '=' + nT(ans, 3) + '\\text{ ' + unit[k] + '}', '']].filter(s => s[0]));
}});
const GASES = ['O2', 'N2', 'CO2', 'CH4', 'NH3', 'He', 'Ar', 'Cl2', 'H2', 'SO2', 'C3H8', 'Ne'];
tpl({id: 'ig-mass', s: 'ideal', d: 3, name: 'Ideal gas with grams', make(R) {
  const f = R.pick(GASES), M = molarMass(f), g = gv(R, 2, 95), t = R.i(0, 120), T = t + 273, P = gv(R, 0.8, 3.5);
  if (R.f() < 0.5) { const n = g.v / M, V = n * RGAS * T / P.v;
    return one('What volume does $' + g.s + '$ g of $' + ce(f) + '$ gas occupy at $' + P.s + '$ atm and $' + t + '$ °C? ($R=0.0821$ L·atm/(mol·K))' + withMasses(f), NUM('a', 'Volume', V, {sf: 3, unit: 'L'}),
      [TR('a', g.v * RGAS * T / P.v, 'n in PV = nRT is MOLES: convert grams first.', 'grams_as_moles', 'concept'), t ? TR('a', n * RGAS * t / P.v, 'Use kelvin: ' + t + ' °C = ' + T + ' K.', 'celsius_in_law', 'concept') : null].filter(Boolean),
      ['Convert grams to moles, and °C to K.', '$V=' + F('nRT', 'P') + '$'], [[F(g.s, m2(M)) + '=' + nT(n, 3) + TX(' mol'), 'Moles.'], ['V=' + F('(' + nT(n, 3) + ')(0.0821)(' + T + ')', P.s) + '=' + nT(V, 3) + TX(' L'), '']]); }
  const V = gv(R, 1.5, 25), n = P.v * V.v / (RGAS * T), Mx = g.v / n;
  return one('A $' + g.s + '$ g sample of an unknown gas occupies $' + V.s + '$ L at $' + P.s + '$ atm and $' + t + '$ °C. What is its molar mass? ($R=0.0821$ L·atm/(mol·K))', NUM('a', 'Molar mass', Mx, {sf: 3, unit: 'g/mol'}),
    [TR('a', n, 'That is moles. Molar mass = grams ÷ moles.', 'stopped_at_moles'), TR('a', n / g.v, 'Molar mass is grams ÷ moles, not moles ÷ grams.', 'molar_mass_inverted')],
    ['Find moles with $n=' + F('PV', 'RT') + '$.', 'Molar mass $=' + F('\\text{grams}', '\\text{moles}') + '$'],
    [['n=' + F('(' + P.s + ')(' + V.s + ')', '(0.0821)(' + T + ')') + '=' + nT(n, 3) + TX(' mol'), 'Moles of gas.'], [F(g.s, nT(n, 3)) + '=' + nT(Mx, 3) + TX(' g/mol'), 'Grams per mole.']]);
}});

// ===== Unit 7 · Partial pressures and gas stoichiometry
const H2OVP = {20: 17.5, 21: 18.7, 22: 19.8, 23: 21.1, 24: 22.4, 25: 23.8, 26: 25.2, 27: 26.7, 28: 28.3};
tpl({id: 'dg-total', s: 'dalton', d: 1, name: "Dalton's law", make(R) {
  const gs = R.some(['N2', 'O2', 'Ar', 'CO2', 'He', 'H2'], 3), ps = gs.map(() => R.i(80, 420)), tot = ps.reduce((a, b) => a + b, 0);
  if (R.f() < 0.5) return one('A container holds ' + gs.map((g, k) => '$' + ce(g) + '$ at $' + ps[k] + '$ mmHg').join(', ') + '. What is the total pressure?', NUM('a', 'Total pressure', tot, {unit: 'mmHg', tol: 0.001}),
    [TR('a', Math.round(tot / 3), 'Add the partial pressures; don\'t average them.', 'averaged')], ['Dalton\'s law: total pressure = sum of the partial pressures.', '$' + ps.join('+') + '$'], [[ps.join('+') + '=' + tot + TX(' mmHg'), '']]);
  return one('A mixture of $' + ce(gs[0]) + '$, $' + ce(gs[1]) + '$ and $' + ce(gs[2]) + '$ has a total pressure of $' + tot + '$ mmHg. The partial pressures of $' + ce(gs[0]) + '$ and $' + ce(gs[1]) + '$ are $' + ps[0] + '$ and $' + ps[1] + '$ mmHg. What is the partial pressure of $' + ce(gs[2]) + '$?', NUM('a', 'Partial pressure', ps[2], {unit: 'mmHg', tol: 0.001}),
    [TR('a', tot + ps[0] + ps[1], 'Subtract the known partial pressures from the total.', 'added_instead')], ['$P_{\\text{total}}=P_1+P_2+P_3$', '$P_3=' + tot + '-' + ps[0] + '-' + ps[1] + '$'], [[tot + '-' + ps[0] + '-' + ps[1] + '=' + ps[2] + TX(' mmHg'), '']]);
}});
tpl({id: 'dg-water', s: 'dalton', d: 2, name: 'Gas collected over water', make(R) {
  const T = R.pick(Object.keys(H2OVP)), w = H2OVP[T], tot = R.i(735, 780), g = R.pick(['H2', 'O2', 'N2']), P = tot - w;
  return one('$' + ce(g) + '$ gas is collected over water at $' + T + '$ °C. The total pressure is $' + tot + '$ mmHg, and the vapor pressure of water at that temperature is $' + w + '$ mmHg. What is the pressure of the dry $' + ce(g) + '$?', NUM('a', 'Pressure of ' + g, P, {unit: 'mmHg', abs: 0.15}),
    [TR('a', tot + w, 'The total includes the water vapor: SUBTRACT it to get the dry gas.', 'added_instead')], ['The gas in the tube is a mixture of ' + ce(g) + ' and water vapor.', '$P_{' + g.replace(/\d/, '') + '}=P_{\\text{total}}-P_{\\text{water}}$'], [[tot + '-' + w + '=' + niceN(+P.toFixed(1)) + TX(' mmHg'), 'Remove the water vapor.']]);
}});
tpl({id: 'dg-frac', s: 'dalton', d: 2, name: 'Mole fraction and partial pressure', make(R) {
  const [a, b] = R.some(['N2', 'O2', 'Ar', 'CO2', 'He', 'H2', 'CH4'], 2), na = gv(R, 0.15, 3.5), nb = gv(R, 0.15, 3.5), Pt = gv(R, 0.9, 4.5), X = na.v / (na.v + nb.v), Pa = X * Pt.v;
  return one('A tank holds $' + na.s + '$ mol of $' + ce(a) + '$ and $' + nb.s + '$ mol of $' + ce(b) + '$ at a total pressure of $' + Pt.s + '$ atm. What is the partial pressure of $' + ce(a) + '$?', NUM('a', 'Partial pressure of ' + a, Pa, {sf: 3, unit: 'atm'}),
    [TR('a', nb.v / (na.v + nb.v) * Pt.v, 'That is the other gas. Use the mole fraction of ' + a + '.', 'other_gas'), TR('a', na.v / nb.v * Pt.v, 'The mole fraction is moles of ' + a + ' ÷ TOTAL moles.', 'wrong_fraction')],
    ['$P_A=X_A\\,P_{\\text{total}}$', '$X_A=' + F(na.s, na.s + '+' + nb.s) + '$'], [['X=' + F(na.s, nT(na.v + nb.v, 3)) + '=' + nT(X, 3), 'Mole fraction.'], ['P=' + nT(X, 3) + '\\times' + Pt.s + '=' + nT(Pa, 3) + TX(' atm'), '']]);
}});
const GSTQ = [[['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2], 0, 2], [['Zn', 'HCl'], ['ZnCl2', 'H2'], [1, 2, 1, 1], 0, 3], [['KClO3'], ['KCl', 'O2'], [2, 2, 3], 0, 2], [['CaCO3'], ['CaO', 'CO2'], [1, 1, 1], 0, 2], [['H2O2'], ['H2O', 'O2'], [2, 2, 1], 0, 2], [['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4], 0, 2], [['Mg', 'HCl'], ['MgCl2', 'H2'], [1, 2, 1, 1], 0, 3]];
tpl({id: 'dg-stp', s: 'dalton', d: 2, name: 'Gas stoichiometry at STP', make(R) {
  const E = R.pick(GSTQ), sp = E[0].concat(E[1]), a = E[3], b = E[4], Ma = molarMass(sp[a]), g = gv(R, 2, 60), na = g.v / Ma, nb = na * E[2][b] / E[2][a], V = nb * 22.4;
  return one('In $' + ce(eqBal(E)) + '$, what volume of $' + ce(sp[b]) + '$ gas at STP forms from $' + g.s + '$ g of $' + ce(sp[a]) + '$? (1 mol of gas at STP = 22.4 L)' + withMasses(sp[a]), NUM('a', 'Volume at STP', V, {sf: 3, unit: 'L'}),
    [E[2][a] !== E[2][b] ? TR('a', na * 22.4, 'Include the mole ratio (' + E[2][a] + ' : ' + E[2][b] + ') from the equation.', 'ratio_ignored') : null, TR('a', nb / 22.4, 'Multiply moles by 22.4 L/mol to get liters.', 'molar_volume_divided'), TR('a', nb, 'That is moles. At STP each mole of gas takes up 22.4 L.', 'stopped_at_moles')].filter(Boolean),
    ['Grams → moles → mole ratio → moles of gas → liters.', 'At STP: 1 mol = 22.4 L.'],
    [[F(g.s, m2(Ma)) + '=' + nT(na, 3) + TX(' mol'), 'Moles.'], [nT(na, 3) + '\\times' + ratioF(E, a, b, sp) + '=' + nT(nb, 3) + TX(' mol'), 'Mole ratio.'], [nT(nb, 3) + '\\times22.4=' + nT(V, 3) + TX(' L'), 'Molar volume at STP.']]);
}});
