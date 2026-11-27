// ---------- Templates, unit 5 (nomenclature and chemical reactions)

// ===== Ionic compounds: names and formulas
const CATF = {Li: 'lithium', Na: 'sodium', K: 'potassium', Mg: 'magnesium', Ca: 'calcium', Sr: 'strontium', Ba: 'barium', Al: 'aluminum', Zn: 'zinc', Ag: 'silver', NH4: 'ammonium'};
const CATQ = {Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Zn: 2, Ag: 1, NH4: 1};
const CATV = {Fe: ['iron', [2, 3]], Cu: ['copper', [1, 2]], Pb: ['lead', [2, 4]], Sn: ['tin', [2, 4]], Co: ['cobalt', [2, 3]]};
const ANM = {F: ['fluoride', -1], Cl: ['chloride', -1], Br: ['bromide', -1], I: ['iodide', -1], O: ['oxide', -2], S: ['sulfide', -2], N: ['nitride', -3], P: ['phosphide', -3]};
const ELNAME = {F: 'fluorine', Cl: 'chlorine', Br: 'bromine', I: 'iodine', O: 'oxygen', S: 'sulfur', N: 'nitrogen', P: 'phosphorus'};
const PRE = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
const anionOf = a => ANM[a] ? ANM[a] : POLY[a];
const altNames = n => { const out = []; if (n.includes('hydrogen carbonate')) out.push(n.replace('hydrogen carbonate', 'bicarbonate')); if (n.includes('aluminum')) out.push(n.replace('aluminum', 'aluminium')); return out; };
function ionicPick(R, hard) {   // -> {cat, q, an, f, name, variable}
  const useV = hard && R.f() < 0.6, usePoly = hard && (!useV || R.f() < 0.5);
  let cat, q, cname, variable = false;
  if (useV) { cat = R.pick(Object.keys(CATV)); q = R.pick(CATV[cat][1]); cname = CATV[cat][0] + '(' + ROMAN[q] + ')'; variable = true; }
  else { cat = R.pick(Object.keys(CATF).filter(c => usePoly || c !== 'NH4')); q = CATQ[cat]; cname = CATF[cat]; }
  let an; do { an = usePoly ? R.pick(Object.keys(POLY).filter(k => k !== 'NH4')) : R.pick(Object.keys(ANM)); } while ((cat === 'NH4' && !POLY[an] && an !== 'Cl' && an !== 'Br' && an !== 'I' && an !== 'F') || (cat === 'NH4' && ['MnO4', 'CrO4', 'Cr2O7', 'OH', 'CN'].includes(an)));
  const [aname, aq] = anionOf(an);
  return {cat, q, an, aq, f: ionFormula(cat, q, an, aq), name: cname + ' ' + aname, variable, cbase: variable ? CATV[cat][0] : CATF[cat], aname};
}
tpl({id: 'nm-ionic', s: 'nameion', d: 1, name: 'Name an ionic compound', make(R) {
  const P = ionicPick(R, R.f() < 0.55), c = parseFormula(P.f).c, nc = c[P.cat] || (P.cat === 'NH4' ? c.N : 1), traps = [];
  if (P.variable) {
    traps.push(TR('n', P.cbase + ' ' + P.aname, P.cbase[0].toUpperCase() + P.cbase.slice(1) + ' can form more than one ion, so its charge goes in Roman numerals.', 'missing_roman', 'concept'));
    if (nc !== P.q && ROMAN[nc]) traps.push(TR('n', P.cbase + '(' + ROMAN[nc] + ') ' + P.aname, 'The Roman numeral is the metal\'s CHARGE, not its subscript. Work it out from the anion: ' + ce(P.an + chgCe(P.aq)) + '.', 'wrong_roman'));
  } else if (P.cat !== 'NH4') traps.push(TR('n', P.cbase + '(' + ROMAN[P.q] + ') ' + P.aname, P.cbase[0].toUpperCase() + P.cbase.slice(1) + ' only forms one ion (' + chgTxt(P.q) + '), so no Roman numeral.', 'extra_roman', 'concept'));
  if (ANM[P.an]) { traps.push(TR('n', P.cbase + (P.variable ? '(' + ROMAN[P.q] + ')' : '') + ' ' + ELNAME[P.an], 'The anion takes the ending -ide: ' + P.aname + '.', 'anion_ending')); const na = c[P.an]; if (P.cat !== 'NH4') traps.push(TR('n', (nc > 1 ? PRE[nc] : '') + P.cbase + ' ' + (na > 1 ? PRE[na] : '') + P.aname, 'Prefixes like di- and tri- are only for compounds of two nonmetals. Ionic names use the ion names.', 'prefix_ionic', 'concept')); }
  else { traps.push(TR('n', P.cbase + (P.variable ? '(' + ROMAN[P.q] + ')' : '') + ' ' + P.aname.replace(/(ate|ite)$/, 'ide'), ce(P.an + chgCe(P.aq)) + ' is a polyatomic ion: keep its name, ' + P.aname + '.', 'poly_as_ide')); if (/ate$/.test(P.aname)) traps.push(TR('n', P.cbase + (P.variable ? '(' + ROMAN[P.q] + ')' : '') + ' ' + P.aname.replace(/ate$/, 'ite'), '-ite ions have one fewer oxygen than -ate ions. ' + ce(P.an + chgCe(P.aq)) + ' is ' + P.aname + '.', 'ate_ite')); }
  return one('Name the compound $' + ce(P.f) + '$.', NAM('n', 'Name', P.name, {alt: altNames(P.name)}), traps,
    ['Name the cation first, then the anion.' + (P.variable ? ' This metal needs a Roman numeral for its charge.' : ''), P.variable ? 'The anion is ' + ce(P.an + chgCe(P.aq)) + '. Find the metal\'s charge that makes the total zero.' : 'The ions are ' + ce((P.cat === 'NH4' ? 'NH4' : P.cat) + chgCe(P.q)) + ' and ' + ce(P.an + chgCe(P.aq)) + '.'],
    [['', 'Anion: ' + ce(P.an + chgCe(P.aq)) + ' = ' + P.aname + '.'], ['', P.variable ? (nc * P.q / Math.abs(P.aq)) + ' anion' + (nc * P.q / Math.abs(P.aq) > 1 ? 's' : '') + ' carry ' + (-nc * P.q) + ', so the ' + nc + ' metal ion' + (nc > 1 ? 's carry' : ' carries') + ' +' + (nc * P.q) + ': each is ' + ce(P.cat + chgCe(P.q)) + ', ' + P.name.split(' ')[0] + '.' : 'Cation: ' + ce(P.cat + chgCe(P.q)) + ' = ' + P.name.split(' ')[0] + '.'], ['', P.name[0].toUpperCase() + P.name.slice(1) + '.']]);
}});
tpl({id: 'nm-formula', s: 'nameion', d: 2, name: 'Formula from an ionic name', make(R) {
  const P = ionicPick(R, R.f() < 0.7), traps = [];
  if (Math.abs(P.q) !== Math.abs(P.aq)) traps.push(TR('f', (POLY[P.cat] ? P.cat : P.cat) + (POLY[P.an] ? P.an : P.an), 'The charges must cancel: ' + ce(P.cat + chgCe(P.q)) + ' and ' + ce(P.an + chgCe(P.aq)) + '.', 'charges_not_balanced'));
  else { const two = POLY[P.an] ? '(' + P.an + ')2' : P.an + '2'; traps.push(TR('f', P.cat + two, ce(P.cat + chgCe(P.q)) + ' and ' + ce(P.an + chgCe(P.aq)) + ' already cancel 1 : 1.', 'charges_not_balanced')); }
  if (P.variable) { const wq = CATV[P.cat][1].find(x => x !== P.q); traps.push(TR('f', ionFormula(P.cat, wq, P.an, P.aq), 'The Roman numeral (' + ROMAN[P.q] + ') is the metal\'s charge: use ' + ce(P.cat + chgCe(P.q)) + '.', 'roman_misread')); }
  const plain = P.f.replace(/[()]/g, ''); if (plain !== P.f && POLY[P.an]) traps.push(TR('f', plain, 'Use parentheses around a polyatomic ion when there is more than one.', 'parentheses'));
  return one('Write the formula for ' + P.name + '.', FRM('f', 'Formula', P.f), traps,
    ['Write each ion with its charge, then balance the charges.', P.name.split(' ')[0] + ' = ' + ce(P.cat + chgCe(P.q)) + '; ' + P.aname + ' = ' + ce(P.an + chgCe(P.aq)) + '.'],
    [[ce(P.cat + chgCe(P.q)) + '\\quad ' + ce(P.an + chgCe(P.aq)), 'Ions and charges.'], [ce(P.f), 'Criss-cross the charges, reduce, and add parentheses for more than one polyatomic ion.']]);
}});

// ===== Molecular compounds and acids
const COVN = {C: 'carbon', N: 'nitrogen', P: 'phosphorus', S: 'sulfur', Si: 'silicon', B: 'boron', Cl: 'chlorine', I: 'iodine', Br: 'bromine', Xe: 'xenon', O: 'oxygen', Se: 'selenium'};
const ROOT = {O: 'ox', S: 'sulf', N: 'nitr', P: 'phosph', F: 'fluor', Cl: 'chlor', Br: 'brom', I: 'iod', Se: 'selen', C: 'carb'};
const MOLEC = ['CO', 'CO2', 'N2O', 'NO', 'NO2', 'N2O3', 'N2O4', 'N2O5', 'P2O5', 'P4O10', 'SO2', 'SO3', 'CCl4', 'PCl3', 'PCl5', 'SF6', 'SiO2', 'CS2', 'NF3', 'BF3', 'Cl2O7', 'IF7', 'OF2', 'S2Cl2', 'XeF4', 'SiCl4', 'BrF5', 'ClF3', 'SeO2', 'P4S3'];
function covParts(f) { const m = f.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/); return {e1: m[1], n1: +(m[2] || 1), e2: m[3], n2: +(m[4] || 1)}; }
function covName(f, elide) {
  const {e1, n1, e2, n2} = covParts(f), p2 = PRE[n2], root = ROOT[e2] + 'ide';
  const second = (elide !== false && /[ao]$/.test(p2) && root[0] === 'o') ? p2.slice(0, -1) + root : p2 + root;
  return (n1 > 1 ? PRE[n1] : '') + COVN[e1] + ' ' + (n2 === 1 && root[0] === 'o' ? 'monoxide' : second);
}
const covAlt = f => { const a = covName(f), b = covName(f, false); return a === b ? [] : [b]; };
tpl({id: 'cv-name', s: 'namecov', d: 1, name: 'Name a molecular compound', make(R) {
  const f = R.pick(MOLEC), {e1, n1, e2, n2} = covParts(f), nm = covName(f), traps = [TR('n', COVN[e1] + ' ' + ROOT[e2] + 'ide', 'Two nonmetals: use prefixes to show how many of each atom (the formula can\'t be worked out from charges).', 'missing_prefixes', 'concept')];
  if (n1 === 1) traps.push(TR('n', 'mono' + COVN[e1] + ' ' + nm.split(' ')[1], 'Leave off "mono" on the first element.', 'mono_first'));
  if (n1 !== n2) traps.push(TR('n', (n2 > 1 ? PRE[n2] : '') + COVN[e1] + ' ' + covName(e1 + e2 + (n1 > 1 ? n1 : '')).split(' ')[1], 'The prefixes are swapped: the first prefix counts ' + COVN[e1] + ', the second counts ' + ROOT[e2] + 'ide.', 'prefix_swap'));
  traps.push(TR('n', COVN[e1] + '(' + ROMAN[Math.min(n2 * 2, 7)] + ') ' + ROOT[e2] + 'ide', 'Roman numerals are for metals in ionic compounds. Two nonmetals use prefixes.', 'roman_molecular', 'concept'));
  return one('Name the compound $' + ce(f) + '$.', NAM('n', 'Name', nm, {alt: covAlt(f)}), traps,
    ['Both elements are nonmetals, so use prefixes: mono, di, tri, tetra, penta, hexa, hepta, octa, nona, deca.', 'First element: its name (no "mono"). Second: prefix + root + -ide.'],
    [['', n1 + ' ' + COVN[e1] + (n1 > 1 ? ' atoms → ' + PRE[n1] + COVN[e1] : ' atom → ' + COVN[e1] + ' (no mono)') + '.'], ['', n2 + ' ' + ELNAMEALL(e2) + ' atom' + (n2 > 1 ? 's' : '') + ' → ' + nm.split(' ')[1] + '.'], ['', nm[0].toUpperCase() + nm.slice(1) + '.']]);
}});
const ELNAMEALL = e => (EL[e] ? EL[e].n.toLowerCase() : e);
tpl({id: 'cv-formula', s: 'namecov', d: 1, name: 'Formula from a molecular name', make(R) {
  const f = R.pick(MOLEC), {e1, n1, e2, n2} = covParts(f), nm = covName(f), traps = [];
  if (n1 !== n2) traps.push(TR('f', e1 + (n2 > 1 ? n2 : '') + e2 + (n1 > 1 ? n1 : ''), 'Each prefix belongs to the element right after it.', 'prefix_swap'));
  const g = gcdi(n1, n2); if (g > 1) traps.push(TR('f', e1 + (n1 / g > 1 ? n1 / g : '') + e2 + (n2 / g > 1 ? n2 / g : ''), 'Don\'t reduce a molecular formula: the prefixes give the exact numbers of atoms.', 'reduced_molecular', 'concept'));
  traps.push(TR('f', e1 + e2, 'The prefixes are the subscripts: ' + nm + ' has ' + n1 + ' ' + e1 + ' and ' + n2 + ' ' + e2 + '.', 'ignored_prefixes'));
  if (n2 === 1) traps.push(TR('f', e1 + (n1 > 1 ? n1 : '') + e2 + '2', '"Mono" means one: ' + nm + ' has a single ' + e2 + ' atom.', 'mono_means_one'));
  return one('Write the formula for ' + nm + '.', FRM('f', 'Formula', f), traps,
    ['The prefixes tell you the subscripts directly.', 'No prefix on the first element means 1.'],
    [['', nm.split(' ')[0] + ' → ' + n1 + ' ' + e1 + '; ' + nm.split(' ')[1] + ' → ' + n2 + ' ' + e2 + '.'], [ce(f), 'Molecular formulas are never reduced.']]);
}});
const ACIDS = [['HF', 'hydrofluoric acid', 'bin', 'fluoride', 'fluor'], ['HCl', 'hydrochloric acid', 'bin', 'chloride', 'chlor'], ['HBr', 'hydrobromic acid', 'bin', 'bromide', 'brom'], ['HI', 'hydroiodic acid', 'bin', 'iodide', 'iod'], ['HCN', 'hydrocyanic acid', 'bin', 'cyanide', 'cyan'],
  ['HNO3', 'nitric acid', 'ate', 'nitrate', 'nitr'], ['HNO2', 'nitrous acid', 'ite', 'nitrite', 'nitr'], ['H2SO4', 'sulfuric acid', 'ate', 'sulfate', 'sulfur'], ['H2SO3', 'sulfurous acid', 'ite', 'sulfite', 'sulfur'], ['H3PO4', 'phosphoric acid', 'ate', 'phosphate', 'phosphor'],
  ['H2CO3', 'carbonic acid', 'ate', 'carbonate', 'carbon'], ['HC2H3O2', 'acetic acid', 'ate', 'acetate', 'acet'], ['HClO3', 'chloric acid', 'ate', 'chlorate', 'chlor'], ['HClO2', 'chlorous acid', 'ite', 'chlorite', 'chlor'], ['HClO4', 'perchloric acid', 'ate', 'perchlorate', 'perchlor'], ['HClO', 'hypochlorous acid', 'ite', 'hypochlorite', 'hypochlor']];
tpl({id: 'cv-acid', s: 'namecov', d: 2, name: 'Name an acid', make(R) {
  const [f, nm, kind, an, stem] = R.pick(ACIDS), traps = [TR('n', 'hydrogen ' + an, '"Hydrogen ' + an + '" names the pure compound. Dissolved in water it is an acid: ' + nm + '.', 'acid_as_compound', 'concept')];
  if (kind === 'bin') traps.push(TR('n', stem + 'ic acid', 'A binary acid (hydrogen plus one other element) takes the prefix hydro-: ' + nm + '.', 'missing_hydro', 'concept'));
  if (kind === 'ate') { traps.push(TR('n', 'hydro' + stem + 'ic acid', 'Hydro- is only for binary acids. An -ate ion gives an -ic acid with no prefix.', 'extra_hydro', 'concept')); traps.push(TR('n', stem + 'ous acid', '-ate ions become -ic acids; -ite ions become -ous acids.', 'ate_ite_acid', 'concept')); }
  if (kind === 'ite') { traps.push(TR('n', stem + 'ic acid', '-ite ions become -ous acids; -ate ions become -ic acids.', 'ate_ite_acid', 'concept')); traps.push(TR('n', 'hydro' + stem + 'ous acid', 'Hydro- is only for binary acids.', 'extra_hydro', 'concept')); }
  return one('Name the acid $' + ce(f + '(aq)') + '$.', NAM('n', 'Name', nm), traps,
    ['Find the anion: ' + an + '.', kind === 'bin' ? '-ide anion → hydro- … -ic acid.' : kind === 'ate' ? '-ate anion → …-ic acid.' : '-ite anion → …-ous acid.'],
    [['', 'The anion is ' + an + '.'], ['', kind === 'bin' ? 'Binary acid: hydro + ' + stem + ' + ic acid.' : kind === 'ate' ? '"-ate" becomes "-ic": ' + nm + '.' : '"-ite" becomes "-ous": ' + nm + '.'], ['', nm[0].toUpperCase() + nm.slice(1) + '.']]);
}});

// ===== Balancing equations: [reactants, products, coefficients, type, difficulty]
const EQS = [[['H2', 'O2'], ['H2O'], [2, 1, 2], 'syn', 1], [['N2', 'H2'], ['NH3'], [1, 3, 2], 'syn', 1], [['Na', 'Cl2'], ['NaCl'], [2, 1, 2], 'syn', 1], [['Mg', 'O2'], ['MgO'], [2, 1, 2], 'syn', 1],
  [['Al', 'O2'], ['Al2O3'], [4, 3, 2], 'syn', 2], [['Fe', 'O2'], ['Fe2O3'], [4, 3, 2], 'syn', 2], [['Fe', 'Cl2'], ['FeCl3'], [2, 3, 2], 'syn', 2], [['SO2', 'O2'], ['SO3'], [2, 1, 2], 'syn', 1], [['P4', 'O2'], ['P4O10'], [1, 5, 1], 'syn', 2],
  [['H2O2'], ['H2O', 'O2'], [2, 2, 1], 'dec', 1], [['KClO3'], ['KCl', 'O2'], [2, 2, 3], 'dec', 2], [['NaHCO3'], ['Na2CO3', 'H2O', 'CO2'], [2, 1, 1, 1], 'dec', 2], [['N2O5'], ['NO2', 'O2'], [2, 4, 1], 'dec', 2], [['CaCO3'], ['CaO', 'CO2'], [1, 1, 1], 'dec', 1], [['HgO'], ['Hg', 'O2'], [2, 2, 1], 'dec', 1],
  [['Zn', 'HCl'], ['ZnCl2', 'H2'], [1, 2, 1, 1], 'sr', 1], [['Al', 'HCl'], ['AlCl3', 'H2'], [2, 6, 2, 3], 'sr', 3], [['Li', 'H2O'], ['LiOH', 'H2'], [2, 2, 2, 1], 'sr', 2], [['Cu', 'AgNO3'], ['Cu(NO3)2', 'Ag'], [1, 2, 1, 2], 'sr', 2],
  [['Al', 'CuSO4'], ['Al2(SO4)3', 'Cu'], [2, 3, 1, 3], 'sr', 3], [['Cl2', 'NaBr'], ['NaCl', 'Br2'], [1, 2, 2, 1], 'sr', 1], [['Fe2O3', 'C'], ['Fe', 'CO2'], [2, 3, 4, 3], 'sr', 3],
  [['AgNO3', 'NaCl'], ['AgCl', 'NaNO3'], [1, 1, 1, 1], 'dr', 1], [['Pb(NO3)2', 'KI'], ['PbI2', 'KNO3'], [1, 2, 1, 2], 'dr', 2], [['BaCl2', 'Na2SO4'], ['BaSO4', 'NaCl'], [1, 1, 1, 2], 'dr', 1], [['H3PO4', 'NaOH'], ['Na3PO4', 'H2O'], [1, 3, 1, 3], 'dr', 2],
  [['Ca(OH)2', 'HCl'], ['CaCl2', 'H2O'], [1, 2, 1, 2], 'dr', 2], [['FeCl3', 'NaOH'], ['Fe(OH)3', 'NaCl'], [1, 3, 1, 3], 'dr', 2],
  [['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2], 'comb', 1], [['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4], 'comb', 2], [['C2H6', 'O2'], ['CO2', 'H2O'], [2, 7, 4, 6], 'comb', 3], [['C4H10', 'O2'], ['CO2', 'H2O'], [2, 13, 8, 10], 'comb', 3],
  [['C6H12O6', 'O2'], ['CO2', 'H2O'], [1, 6, 6, 6], 'comb', 2], [['C2H5OH', 'O2'], ['CO2', 'H2O'], [1, 3, 2, 3], 'comb', 2], [['NH3', 'O2'], ['NO', 'H2O'], [4, 5, 4, 6], 'other', 3]];
const eqSkel = E => E[0].join(' + ') + ' -> ' + E[1].join(' + ');
const eqBal = E => { const sp = E[0].concat(E[1]); return sp.map((f, k) => (E[2][k] > 1 ? E[2][k] : '') + f).reduce((s, f, k) => s + (k === 0 ? '' : k === E[0].length ? ' -> ' : ' + ') + f, ''); };
tpl({id: 'bl-balance', s: 'balance', d: 2, name: 'Balance an equation', make(R) {
  const E = R.pick(EQS.filter(e => Math.max.apply(null, e[2]) > 1)), sp = E[0].concat(E[1]), fd = COEF(sp, E[0].length, E[2]), traps = [], why = co => { const b = balanceInfo(fd, co); return b ? 'Not balanced: ' + EL[b.e].n.toLowerCase() + ' (' + b.e + ') has ' + b.L + ' on the left and ' + b.R + ' on the right.' : ''; };
  const ones = sp.map(() => 1); if (balanceInfo(fd, ones)) traps.push(TR('c', ones, why(ones), 'unbalanced'));
  const dbl = E[2].map(x => x * 2); traps.push(TR('c', dbl, 'Balanced, but not in lowest terms: divide every coefficient by 2.', 'not_lowest'));
  const big = E[2].indexOf(Math.max.apply(null, E[2])), near1 = E[2].slice(); near1[big] = near1[big] - 1 || 2; if (balanceInfo(fd, near1)) traps.push(TR('c', near1, why(near1), 'unbalanced'));
  const counts = el => sp.map((f, k) => (parseFormula(f).c[el] || 0) * E[2][k]);
  const els = Object.keys(sp.reduce((a, f) => Object.assign(a, parseFormula(f).c), {}));
  return one('Balance the equation: $' + ce(eqSkel(E)) + '$', fd, traps,
    ['Count atoms of each element on both sides. Change only coefficients, never subscripts.', E[3] === 'comb' ? 'For combustion, balance C first, then H, and O last.' : 'Start with the element in the most complicated formula; leave single elements (like ' + ce(sp.find(f => /^[A-Z][a-z]?\d*$/.test(f)) || sp[0]) + ') for last.'],
    [['', 'Balance one element at a time, leaving lone elements and O for last.'], [ce(eqBal(E)), 'Balanced.'], ['', 'Check: ' + els.map(el => { const c = counts(el); let L = 0, Rr = 0; c.forEach((n, k) => { if (k < E[0].length) L += n; else Rr += n; }); return el + ' ' + L + '=' + Rr; }).join(', ') + '.']]);
}});
tpl({id: 'bl-easy', s: 'balance', d: 1, name: 'Balance a simple equation', make(R) {
  const E = R.pick(EQS.filter(e => e[4] === 1 && Math.max.apply(null, e[2]) > 1)), sp = E[0].concat(E[1]), fd = COEF(sp, E[0].length, E[2]), ones = sp.map(() => 1), b = balanceInfo(fd, ones);
  const traps = [TR('c', E[2].map(x => x * 2), 'Balanced, but not in lowest terms: divide every coefficient by 2.', 'not_lowest')];
  if (b) traps.push(TR('c', ones, 'Not balanced: ' + EL[b.e].n.toLowerCase() + ' has ' + b.L + ' on the left and ' + b.R + ' on the right.', 'unbalanced'));
  return one('Balance the equation: $' + ce(eqSkel(E)) + '$', fd, traps,
    ['Count each element on both sides.', b ? 'Start with ' + EL[b.e].n.toLowerCase() + ': ' + b.L + ' on the left, ' + b.R + ' on the right.' : 'Adjust one coefficient at a time.'],
    [['', 'Change coefficients until every element matches.'], [ce(eqBal(E)), 'Balanced, with the lowest whole numbers.']]);
}});

// ===== Reaction types and predicting products
const RXT = {syn: 'Synthesis', dec: 'Decomposition', sr: 'Single replacement', dr: 'Double replacement', comb: 'Combustion'};
const RXW = {syn: 'two or more substances combine into one product (A + B → AB)', dec: 'one compound breaks into two or more simpler substances (AB → A + B)', sr: 'an element replaces another element in a compound (A + BC → AC + B)', dr: 'two compounds swap partners (AB + CD → AD + CB)', comb: 'a fuel burns in oxygen, making CO₂ and H₂O'};
tpl({id: 'rx-type', s: 'rxtype', d: 1, name: 'Classify a reaction', make(R) {
  const E = R.pick(EQS.filter(e => RXT[e[3]])), t = E[3];
  return MCI('What type of reaction is $' + ce(eqBal(E)) + '$?', RXT[t], R.shuf(Object.keys(RXT).filter(k => k !== t)).slice(0, 3).map(k => [RXT[k], 'In ' + RXT[k].toLowerCase() + ', ' + RXW[k] + '. Here, ' + RXW[t] + '.', 'reaction_type', 'concept']),
    ['Look at how many reactants and products there are, and whether they are elements or compounds.', 'One product: synthesis. One reactant: decomposition. Element + compound: single replacement. Two compounds swap: double replacement. Fuel + O₂: combustion.'],
    [['', 'Here ' + RXW[t] + '.'], ['', 'So it is ' + RXT[t].toLowerCase() + '.']]);
}});
const PRED = [
  ['AgNO3 + NaCl', 'AgCl + NaNO3', [['AgNa + NO3Cl', 'Ions swap partners: each cation pairs with the other anion, never cation with cation.'], ['Ag + NaNO3 + Cl2', 'In double replacement only the partners trade; no elements form.'], ['No reaction', 'Solid AgCl forms (a precipitate), so the reaction happens.']]],
  ['Zn + CuSO4', 'ZnSO4 + Cu', [['No reaction', 'Zinc is more active than copper, so it replaces it.'], ['Zn(SO4)2 + Cu', 'Zn²⁺ and SO₄²⁻ combine 1 : 1.'], ['ZnCu + SO4', 'A free element replaces the metal in the compound.']]],
  ['Cu + ZnSO4', 'No reaction', [['CuSO4 + Zn', 'Copper is less active than zinc, so it can\'t replace it.'], ['Cu2SO4 + Zn', 'Copper is below zinc on the activity series: no reaction.'], ['CuZnSO4', 'Single replacement doesn\'t combine everything into one compound.']]],
  ['CH4 + O2', 'CO2 + H2O', [['C + H2O', 'Complete combustion of a hydrocarbon makes CO₂ and H₂O.'], ['CH4O2', 'Combustion breaks the fuel apart; it doesn\'t join with O₂.'], ['CO2 + H2', 'The hydrogen ends up in water.']]],
  ['Mg + O2', 'MgO', [['MgO2', 'Mg²⁺ and O²⁻ combine 1 : 1.'], ['Mg2O', 'Mg²⁺ and O²⁻ combine 1 : 1.'], ['No reaction', 'Magnesium burns brightly in oxygen.']]],
  ['CaCO3 ->[heat]', 'CaO + CO2', [['Ca + C + O3', 'Carbonates decompose into a metal oxide and carbon dioxide.'], ['CaO2 + CO', 'Calcium forms CaO, and the rest leaves as CO₂.'], ['Ca + CO3', 'CO₃ isn\'t a stable molecule; it leaves as CO₂.']]],
  ['Na + H2O', 'NaOH + H2', [['NaO + H2', 'Sodium forms Na⁺; with OH⁻ that is NaOH.'], ['NaH + O2', 'Active metals in water make a hydroxide and hydrogen gas.'], ['No reaction', 'Sodium reacts vigorously with water.']]],
  ['Pb(NO3)2 + KI', 'PbI2 + KNO3', [['PbI + KNO3', 'Pb²⁺ needs two I⁻ ions: PbI₂.'], ['PbK + I(NO3)2', 'Each cation pairs with the other anion.'], ['No reaction', 'Yellow PbI₂ precipitates, so the reaction happens.']]],
  ['HCl + NaOH', 'NaCl + H2O', [['NaH + ClOH', 'An acid and a base make a salt and water.'], ['NaCl + H2 + O2', 'H⁺ and OH⁻ join to make water.'], ['NaClOH + H', 'The ions trade partners: Na⁺ with Cl⁻, H⁺ with OH⁻.']]],
  ['Cl2 + NaBr', 'NaCl + Br2', [['No reaction', 'Chlorine is more active than bromine, so it replaces it.'], ['NaClBr', 'Single replacement swaps one element for another.'], ['NaBr + Cl', 'Chlorine takes bromine\'s place, and bromine is released as Br₂.']]],
  ['Br2 + NaCl', 'No reaction', [['NaBr + Cl2', 'Bromine is less active than chlorine, so it can\'t replace it.'], ['NaBrCl', 'No replacement happens here.'], ['NaCl + Br2', 'Nothing changes: no reaction.']]],
  ['BaCl2 + Na2SO4', 'BaSO4 + NaCl', [['BaNa + SO4Cl', 'Each cation pairs with the other anion.'], ['Ba2SO4 + NaCl2', 'Ba²⁺ and SO₄²⁻ combine 1 : 1; Na⁺ and Cl⁻ combine 1 : 1.'], ['No reaction', 'White BaSO₄ precipitates, so the reaction happens.']]],
  ['C3H8 + O2', 'CO2 + H2O', [['C3O2 + H8O', 'Combustion makes CO₂ and H₂O from the carbon and hydrogen.'], ['CO2 + H2', 'The hydrogen ends up in water.'], ['C + H2O', 'Complete combustion turns the carbon into CO₂.']]],
  ['H2O2 ->[decomposes]', 'H2O + O2', [['H2 + O2', 'Hydrogen peroxide breaks down into water and oxygen.'], ['HO + HO', 'HO isn\'t a stable product here; water and O₂ form.'], ['H2O + H2', 'Oxygen gas is released, not hydrogen.']]],
  ['Fe + CuSO4', 'FeSO4 + Cu', [['No reaction', 'Iron is more active than copper, so it replaces it.'], ['FeCu + SO4', 'A free element replaces the metal in the compound.'], ['Fe(SO4)2 + Cu', 'Fe²⁺ and SO₄²⁻ combine 1 : 1.']]]];
tpl({id: 'rx-predict', s: 'rxtype', d: 2, name: 'Predict the products', make(R) {
  const [re, pr, wr] = R.pick(PRED), lhs = re.replace(/ ->\[.*\]/, ''), note = (re.match(/->\[(.*)\]/) || [])[1];
  const show = t => t === 'No reaction' ? 'No reaction' : '$' + ce(t) + '$';
  return MCI('Predict the products: $' + ce(lhs) + ' \\to$ ?' + (note ? ' (' + note + ')' : ''), show(pr), wr.map(w => [show(w[0]), w[1], 'predict_products', 'concept']),
    ['Decide the reaction type first.', 'Single replacement: check the activity series. Double replacement: swap the partners and balance charges.'],
    [['', pr === 'No reaction' ? 'The free element is less active than the one in the compound, so nothing happens.' : 'Products: ' + ce(pr) + '.'], ['', pr === 'No reaction' ? 'No reaction.' : 'Then balance the equation.']]);
}});
