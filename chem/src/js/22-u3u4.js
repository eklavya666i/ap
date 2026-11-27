// ---------- Templates, unit 3 (electrons and the periodic table) and unit 4 (chemical bonding)

// ===== Unit 3 · Light and energy: c = λν, E = hν
const C_LIGHT = 3.00e8, H_PLANCK = 6.626e-34;
const EMR = [['radio waves', 1], ['microwaves', 2], ['infrared light', 3], ['red light', 4], ['green light', 5], ['violet light', 6], ['ultraviolet light', 7], ['X-rays', 8], ['gamma rays', 9]];
tpl({id: 'li-freq', s: 'light', d: 1, name: 'Wavelength and frequency', make(R) {
  if (R.f() < 0.6) {
    const nm = R.i(380, 750), lam = nm * 1e-9, nu = C_LIGHT / lam;
    return one('Visible light has a wavelength of $' + nm + '$ nm. What is its frequency? ($c=3.00\\times10^{8}$ m/s)', NUM('a', 'Frequency', nu, {sf: 3, unit: 'Hz', tol: 0.005}),
      [TR('a', lam / C_LIGHT, 'Frequency is c ÷ λ, not λ ÷ c.', 'wave_inverted'), TR('a', C_LIGHT * lam, 'Divide: ν = c/λ.', 'wave_inverted')],
      ['$c=\\lambda\\nu$, so $\\nu=' + F('c', '\\lambda') + '$. Convert nm to m first.', '$\\lambda=' + nm + '\\times10^{-9}\\text{ m}$'],
      [['\\lambda=' + nm + '\\text{ nm}=' + nT(lam, 3) + '\\text{ m}', '1 nm = 10⁻⁹ m.'], ['\\nu=' + F('3.00\\times10^{8}', nT(lam, 3)) + '=' + nT(nu, 3) + '\\text{ Hz}', 'Hz means s⁻¹.']]);
  }
  const ex = R.i(13, 15), m = R.r(1.1, 9.9, 2), nu = m * Math.pow(10, ex), lam = C_LIGHT / nu, nm = lam * 1e9;
  return one('Light has a frequency of $' + nT(nu, 3) + '$ Hz. What is its wavelength in nanometers? ($c=3.00\\times10^{8}$ m/s)', NUM('a', 'Wavelength', nm, {sf: 3, unit: 'nm', tol: 0.005}),
    [TR('a', nu / C_LIGHT * 1e9, 'Wavelength is c ÷ ν.', 'wave_inverted')],
    ['$\\lambda=' + F('c', '\\nu') + '$ gives meters; then convert to nanometers.', '1 m = $10^{9}$ nm.'],
    [['\\lambda=' + F('3.00\\times10^{8}', nT(nu, 3)) + '=' + nT(lam, 3) + '\\text{ m}', ''], [nT(lam, 3) + '\\text{ m}\\times10^{9}=' + nT(nm, 3) + '\\text{ nm}', 'Meters to nanometers.']]);
}});
tpl({id: 'li-energy', s: 'light', d: 2, name: 'Photon energy', make(R) {
  if (R.f() < 0.5) {
    const ex = R.i(13, 16), m = R.r(1.1, 9.9, 2), nu = m * Math.pow(10, ex), E = H_PLANCK * nu;
    return one('What is the energy of a photon with a frequency of $' + nT(nu, 3) + '$ Hz? ($h=6.626\\times10^{-34}$ J·s)', NUM('a', 'Energy', E, {sf: 3, unit: 'J', tol: 0.005}),
      [TR('a', H_PLANCK / nu, 'Multiply: E = hν.', 'energy_inverted'), TR('a', nu / H_PLANCK, 'Multiply: E = hν.', 'energy_inverted')],
      ['$E=h\\nu$', '$E=(6.626\\times10^{-34})(' + nT(nu, 3) + ')$'], [['E=h\\nu=(6.626\\times10^{-34})(' + nT(nu, 3) + ')', ''], ['=' + nT(E, 3) + '\\text{ J}', '']]);
  }
  const nm = R.i(200, 700), lam = nm * 1e-9, E = H_PLANCK * C_LIGHT / lam;
  return one('What is the energy of one photon of light with a wavelength of $' + nm + '$ nm? ($h=6.626\\times10^{-34}$ J·s, $c=3.00\\times10^{8}$ m/s)', NUM('a', 'Energy', E, {sf: 3, unit: 'J', tol: 0.005}),
    [TR('a', H_PLANCK * C_LIGHT / nm, 'Convert nanometers to meters first (1 nm = 10⁻⁹ m).', 'nm_not_converted'), TR('a', C_LIGHT / lam, 'That is the frequency. Multiply it by h to get energy.', 'stopped_at_frequency')],
    ['Find the frequency with $\\nu=' + F('c', '\\lambda') + '$, then use $E=h\\nu$.', 'Or in one step: $E=' + F('hc', '\\lambda') + '$ with λ in meters.'],
    [['\\lambda=' + nm + '\\times10^{-9}\\text{ m}', ''], ['\\nu=' + F('3.00\\times10^{8}', nT(lam, 3)) + '=' + nT(C_LIGHT / lam, 3) + '\\text{ Hz}', ''], ['E=(6.626\\times10^{-34})(' + nT(C_LIGHT / lam, 3) + ')=' + nT(E, 3) + '\\text{ J}', '']]);
}});
tpl({id: 'li-compare', s: 'light', d: 1, name: 'The electromagnetic spectrum', make(R) {
  const four = R.some(EMR, 4).sort((a, b) => a[1] - b[1]), prop = R.pick([['highest energy', 1], ['highest frequency', 1], ['longest wavelength', -1], ['lowest energy', -1], ['shortest wavelength', 1]]);
  const right = prop[1] > 0 ? four[3] : four[0], cap = t => t[0].toUpperCase() + t.slice(1);
  return MCI('Which has the ' + prop[0] + '?', cap(right[0]), four.filter(x => x !== right).map(x => [cap(x[0]), cap(x[0]) + (/light$/.test(x[0]) ? ' is ' : ' are ') + (x[1] < right[1] ? 'lower in energy and frequency, with longer wavelengths, than ' : 'higher in energy and frequency, with shorter wavelengths, than ') + right[0] + '.', 'spectrum_order', 'concept']),
    ['Order: radio, microwave, infrared, visible (red to violet), ultraviolet, X-ray, gamma.', 'Energy and frequency rise left to right; wavelength falls.'],
    [['', 'From low to high energy: ' + four.map(x => x[0]).join(', ') + '.'], ['', cap(right[0]) + (/light$/.test(right[0]) ? ' is' : ' are') + (prop[1] > 0 ? ' at the high-energy end' : ' at the low-energy end') + ' of this group.']]);
}});

// ===== Unit 3 · Electron configurations
const NOEXC = z => ![24, 29, 41, 42, 44, 45, 46, 47].includes(z);
tpl({id: 'ec-write', s: 'config', d: 1, name: 'Write a configuration', make(R) {
  const z = R.i(3, 20), e = ELZ(z), ans = cfgStr(z), traps = [];
  [z - 1, z + 1].forEach(w => { if (w >= 1) traps.push(TR('c', cfgStr(w), 'That configuration has ' + w + ' electrons: it belongs to ' + ELZ(w).n.toLowerCase() + '. ' + e.n + ' has ' + z + '.', 'electron_count')); });
  return one('Write the full electron configuration of ' + e.n.toLowerCase() + ' (atomic number ' + z + ').', CFG('c', 'Electron configuration', ans), traps,
    ['A neutral atom has as many electrons as its atomic number: ' + z + '.', 'Fill in order: 1s 2s 2p 3s 3p 4s, with s holding 2 and p holding 6.'],
    [['', 'Place ' + z + ' electrons, lowest energy first.'], [cfgT(ans), 'Check: the exponents add up to ' + z + '.']]);
}});
tpl({id: 'ec-core', s: 'config', d: 2, name: 'Noble-gas configurations', make(R) {
  let z; do { z = R.i(19, 54); } while (!NOEXC(z) || [36, 54].includes(z));
  const e = ELZ(z), ans = cfgStr(z, true), traps = [];
  [z - 1, z + 1].forEach(w => { if (NOEXC(w)) traps.push(TR('c', cfgStr(w, true), 'That has ' + w + ' electrons, which is ' + ELZ(w).n.toLowerCase() + '. Count again: ' + e.n.toLowerCase() + ' has ' + z + '.', 'electron_count')); });
  if (/ 3d/.test(ans)) traps.push(TR('c', ans.replace(' 3d', ' 4d'), 'After 4s comes 3d: the d sublevel is one shell below the s that fills before it.', 'd_level', 'concept'));
  if (/ 4d/.test(ans)) traps.push(TR('c', ans.replace(' 4d', ' 5d'), 'After 5s comes 4d: the d sublevel is one shell below the s that fills before it.', 'd_level', 'concept'));
  if (/ 3d10 4p/.test(ans)) traps.push(TR('c', ans.replace(' 3d10', ''), 'Don\'t skip the ten 3d electrons that fill between 4s and 4p.', 'electron_count'));
  if (/ 4d10 5p/.test(ans)) traps.push(TR('c', ans.replace(' 4d10', ''), 'Don\'t skip the ten 4d electrons that fill between 5s and 5p.', 'electron_count'));
  return one('Write the noble-gas (shorthand) configuration of ' + e.n.toLowerCase() + '.', CFG('c', 'Electron configuration', ans), traps,
    ['Start with the noble gas from the row above in brackets, then add what comes after it.', e.n + ' is element ' + z + '. The core is ' + ans.split(' ')[0] + '.'],
    [['', 'The previous noble gas is ' + ans.split(' ')[0].replace(/[\[\]]/g, '') + ' (' + CORES[ans.split(' ')[0].replace(/[\[\]]/g, '')] + ' electrons).'], [cfgT(ans), 'Add the remaining ' + (z - CORES[ans.split(' ')[0].replace(/[\[\]]/g, '')]) + (z - CORES[ans.split(' ')[0].replace(/[\[\]]/g, '')] === 1 ? ' electron' : ' electrons') + ' in filling order (4s before 3d, 5s before 4d).']]);
}});
const MAINZ = [1, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20, 31, 32, 33, 34, 35, 37, 38, 49, 50, 51, 52, 53, 55, 56];
tpl({id: 'ec-valence', s: 'config', d: 1, name: 'Valence electrons', make(R) {
  const z = R.pick(MAINZ.filter(n => n > 2)), e = ELZ(z), g = e.g, v = g <= 2 ? g : g - 10, traps = [];
  if (g > 2) traps.push(TR('v', g, 'Use the last digit of the group number for groups 13–18: group ' + g + ' has ' + v + ' valence electrons.', 'valence_group'));
  traps.push(TR('v', e.p, 'The period tells you the energy level of the valence electrons, not how many there are.', 'valence_period'));
  if (8 - v !== v && z > 2) traps.push(TR('v', 8 - v, 'That is how many it would need to reach eight. Valence electrons are the ones it already has.', 'valence_needed', 'concept'));
  traps.push(TR('v', z, 'Valence electrons are only the outermost ones, not all ' + z + ' electrons.', 'valence_total'));
  return one('How many valence electrons does ' + e.n.toLowerCase() + ' (' + ce(e.s) + ') have?', INT('v', 'Valence electrons', v), traps,
    ['Valence electrons are in the outermost s and p sublevels.', ce(e.s) + ' is in group ' + g + (g > 2 ? ', so it has ' + g + ' − 10' : '') + '.'],
    [['', e.n + ' is in group ' + g + ', period ' + e.p + '.'], ['', 'Main-group elements: groups 1–2 have 1–2; groups 13–18 have 3–8. So ' + v + '.']]);
}});
const IONS_MG = [['Na', 1], ['Mg', 2], ['Al', 3], ['K', 1], ['Ca', 2], ['Li', 1], ['N', -3], ['O', -2], ['F', -1], ['P', -3], ['S', -2], ['Cl', -1], ['Se', -2], ['Br', -1], ['Sr', 2], ['Rb', 1]];
tpl({id: 'ec-ion', s: 'config', d: 2, name: 'Configurations of ions', make(R) {
  const [sy, q] = R.pick(IONS_MG), z = EL[sy].z, n = z - q, ans = cfgStr(n, n > 18 && R.f() < 0.5), traps = [];
  traps.push(TR('c', cfgStr(z), 'That is the neutral atom. ' + (q > 0 ? 'A ' + chgTxt(q) + ' ion has lost ' + q + ' electron' + (q > 1 ? 's' : '') + '.' : 'A ' + chgTxt(q) + ' ion has gained ' + (-q) + ' electron' + (q < -1 ? 's' : '') + '.'), 'ion_neutral_config', 'concept'));
  traps.push(TR('c', cfgStr(z + q), q > 0 ? 'Positive ions LOSE electrons; you added them.' : 'Negative ions GAIN electrons; you removed them.', 'ion_wrong_direction', 'concept'));
  return one('Write the electron configuration of the ion $' + ce(sy + chgCe(q)) + '$.', CFG('c', 'Electron configuration', ans, {ion: 1}), traps,
    [EL[sy].n + ' has ' + z + ' electrons as an atom. A ' + chgTxt(q) + ' charge means ' + (q > 0 ? 'it lost ' + q : 'it gained ' + (-q)) + '.', 'The ion has ' + n + ' electrons, the same as ' + ELZ(n).n.toLowerCase() + '.'],
    [['', z + (q > 0 ? ' − ' + q : ' + ' + (-q)) + ' = ' + n + ' electrons.'], [cfgT(ans), 'It matches the noble gas ' + ELZ(n).n.toLowerCase() + ': a stable octet.']]);
}});
tpl({id: 'ec-identify', s: 'config', d: 2, name: 'Name the element from its configuration', make(R) {
  let z; do { z = R.i(5, 54); } while (!NOEXC(z) || [10, 18, 36, 54].includes(z));
  const core = z > 18 && R.f() < 0.7, c = cfgStr(z, core), e = ELZ(z), traps = [TR('s', ELZ(z - 1).s, 'Add up every exponent again (and the core): that gives ' + z + ' electrons.', 'electron_count', 'slip'), TR('s', ELZ(z + 1).s, 'Add up every exponent again (and the core): that gives ' + z + ' electrons.', 'electron_count', 'slip')];
  if (core) { const after = z - CORES[c.split(' ')[0].replace(/[\[\]]/g, '')]; if (ELZ(after) && after !== z) traps.push(TR('s', ELZ(after).s, 'Include the core: ' + c.split(' ')[0] + ' stands for ' + CORES[c.split(' ')[0].replace(/[\[\]]/g, '')] + ' electrons.', 'core_ignored', 'concept')); }
  return one('Which element has the electron configuration ' + cfgT(c) + '?', SYM('s', 'Element symbol', e.s), traps,
    ['Add the electrons: that is the atomic number.', core ? c.split(' ')[0] + ' = ' + CORES[c.split(' ')[0].replace(/[\[\]]/g, '')] + ' electrons, plus the rest.' : 'Add every exponent.'],
    [['', 'Total electrons: ' + z + '.'], ['', 'Atomic number ' + z + ' is ' + e.n.toLowerCase() + ', ' + ce(e.s) + '.']]);
}});

// ===== Unit 3 · Periodic table organization
const FAM = {alkali: 'Alkali metal', alkaline: 'Alkaline earth metal', transition: 'Transition metal', halogen: 'Halogen', noble: 'Noble gas'};
const FAMEL = {alkali: ['Li', 'Na', 'K', 'Rb', 'Cs'], alkaline: ['Be', 'Mg', 'Ca', 'Sr', 'Ba'], transition: ['Fe', 'Cu', 'Zn', 'Ni', 'Co', 'Mn', 'Cr', 'Ti', 'Ag', 'Au', 'Pt', 'Hg'], halogen: ['F', 'Cl', 'Br', 'I'], noble: ['He', 'Ne', 'Ar', 'Kr', 'Xe']};
const FAMG = {alkali: 'group 1', alkaline: 'group 2', transition: 'groups 3–12', halogen: 'group 17', noble: 'group 18'};
const FAMP = {alkali: 'Alkali metals', alkaline: 'Alkaline earth metals', transition: 'Transition metals', halogen: 'Halogens', noble: 'Noble gases'};
tpl({id: 'pt-family', s: 'table', d: 1, name: 'Element families', make(R) {
  const f = R.pick(Object.keys(FAM)), sy = R.pick(FAMEL[f]), e = EL[sy], others = R.some(Object.keys(FAM).filter(k => k !== f), 3);
  return MCI('Which family does ' + e.n.toLowerCase() + ' (' + ce(sy) + ') belong to?', FAM[f], others.map(o => [FAM[o], FAMP[o] + ' are in ' + FAMG[o] + '; ' + ce(sy) + ' is in group ' + e.g + '.', 'family', 'concept']),
    ['Find the element\'s group (column).', 'Group 1 alkali metals, group 2 alkaline earth metals, groups 3–12 transition metals, group 17 halogens, group 18 noble gases.'],
    [['', ce(sy) + ' is in group ' + e.g + '.'], ['', 'So it is ' + (/^[AEIOU]/.test(FAM[f]) ? 'an ' : 'a ') + FAM[f].toLowerCase() + '.']]);
}});
const METALLOIDS = ['B', 'Si', 'Ge', 'As', 'Sb', 'Te'];
const mClass = sy => METALLOIDS.includes(sy) ? 'Metalloid' : ['nonmetal', 'halogen', 'noble'].includes(EL[sy].c) ? 'Nonmetal' : 'Metal';
tpl({id: 'pt-metal', s: 'table', d: 1, name: 'Metal, nonmetal or metalloid', make(R) {
  const pool = {Metal: ['Na', 'Mg', 'Al', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Sn', 'Pb', 'Au', 'Li', 'Ba', 'Ni'], Nonmetal: ['C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Se', 'Br', 'I', 'Ne', 'Ar', 'H'], Metalloid: METALLOIDS};
  const k = R.pick(Object.keys(pool)), sy = R.pick(pool[k]), why = {Metal: 'Metals sit to the left of the staircase line: shiny, conductive, malleable.', Nonmetal: 'Nonmetals sit to the right of the staircase (plus hydrogen): dull, brittle, poor conductors.', Metalloid: 'Metalloids sit along the staircase line (B, Si, Ge, As, Sb, Te) and share properties of both.'};
  return MCI('Is ' + EL[sy].n.toLowerCase() + ' (' + ce(sy) + ') a metal, a nonmetal or a metalloid?', k, Object.keys(pool).filter(o => o !== k).map(o => [o, why[k], 'metal_class', 'concept']),
    ['Find the staircase line that runs from boron down to tellurium.', 'Left of it: metals. Right of it: nonmetals. Touching it: metalloids.'],
    [['', ce(sy) + ' is in group ' + EL[sy].g + ', period ' + EL[sy].p + '.'], ['', why[k]]]);
}});
tpl({id: 'pt-locate', s: 'table', d: 1, name: 'Period and group', make(R) {
  let z; do { z = R.i(3, 56); } while (EL[ELZ(z).s].g === null || ELZ(z).g === ELZ(z).p);
  const e = ELZ(z), traps = [TR('p', e.g, 'You swapped them: periods are the rows (1–7), groups are the columns (1–18).', 'period_group_swap', 'concept'), TR('g', e.p, 'You swapped them: periods are the rows, groups are the columns.', 'period_group_swap', 'concept')];
  return {q: 'In which period and group is ' + e.n.toLowerCase() + ' (' + ce(e.s) + ', atomic number ' + z + ') on the periodic table?', fs: [INT('p', 'Period (row)', e.p), INT('g', 'Group (column, 1–18)', e.g)], traps,
    h: ['Periods are horizontal rows; groups are vertical columns numbered 1–18.', 'Use the Reference tab\'s periodic table, or the configuration: the highest energy level is the period.'],
    x: [['', ce(e.s) + ' sits in row ' + e.p + ', so period ' + e.p + '.'], ['', 'It is in column ' + e.g + ', so group ' + e.g + '.']]};
}});

// ===== Unit 3 · Periodic trends (pairs that follow the trend cleanly)
const TRENDEL = ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Rb', 'Sr', 'In', 'Sn', 'Sb', 'Te', 'I', 'Cs', 'Ba'];
const TRENDS = [['larger atomic radius', -1, 'Atomic radius grows down a group (more energy levels) and shrinks across a period (more protons pull the electrons in).'],
  ['higher first ionization energy', 1, 'Ionization energy rises across a period and up a group: electrons closer to a stronger nucleus are harder to remove.'],
  ['higher electronegativity', 1, 'Electronegativity rises across a period and up a group (fluorine is the highest).'],
  ['more metallic character', -1, 'Metallic character grows down a group and toward the left: those atoms lose electrons most easily.']];
// Known exceptions to the simple trends (half-filled and filled sublevels, d-block contraction): never asked
const ANOM = {ionization: ['Be|B', 'Mg|Al', 'N|O', 'P|S', 'As|Se', 'Ca|Ga', 'Sr|In', 'Al|Ga'], electronegativity: ['Si|Ge', 'Al|Ga', 'Ca|Ga', 'Si|Sn'], radius: ['Al|Ga', 'Ga|Ge', 'Si|Ge'], metallic: ['Si|Ge', 'Al|Ga', 'Ca|Ga', 'Si|Sn', 'Be|B', 'Mg|Al', 'N|O', 'P|S', 'As|Se', 'Sr|In']};
const anomKey = prop => /ionization/.test(prop) ? 'ionization' : /electronegativity/.test(prop) ? 'electronegativity' : /radius/.test(prop) ? 'radius' : 'metallic';
const hasAnom = (prop, set) => ANOM[anomKey(prop)].some(p => { const [x, y] = p.split('|'); return set.includes(x) && set.includes(y); });
const tscore = (sy, dir) => { const e = EL[sy], col = e.g > 12 ? e.g - 10 : e.g; return dir > 0 ? col * 10 - e.p * 7 : -col * 10 + e.p * 7; };   // ranking within the rules
const tclear = (a, b) => { const A = EL[a], B = EL[b], ca = A.g > 12 ? A.g - 10 : A.g, cb = B.g > 12 ? B.g - 10 : B.g; return (A.p === B.p && Math.abs(ca - cb) >= 2) || (A.g === B.g && A.p !== B.p) || (ca - cb) * (A.p - B.p) < 0; };
tpl({id: 'tr-pair', s: 'trends', d: 1, name: 'Compare two elements', make(R) {
  const [prop, dir, why] = R.pick(TRENDS); let a, b; do { a = R.pick(TRENDEL); b = R.pick(TRENDEL); } while (a === b || !tclear(a, b) || hasAnom(prop, [a, b]));
  const win = tscore(a, dir) > tscore(b, dir) ? a : b, lose = win === a ? b : a;
  return Object.assign(MCI('Which has the ' + prop + ': ' + ce(a) + ' or ' + ce(b) + '?', ce(win), [[ce(lose), why, 'trend_direction', 'concept']],
    ['Find both elements: compare their periods (rows) and groups (columns).', why],
    [['', ce(win) + ' is in period ' + EL[win].p + ', group ' + EL[win].g + '; ' + ce(lose) + ' is in period ' + EL[lose].p + ', group ' + EL[lose].g + '.'], ['', why]]), {chk: {trend: prop, a, b, win}});
}});
tpl({id: 'tr-rank', s: 'trends', d: 2, name: 'Rank across a period or down a group', make(R) {
  const [prop, dir, why] = R.pick(TRENDS), byGroup = R.f() < 0.5;
  let set;
  if (byGroup) { const g = R.pick([1, 2, 16, 17, 15]); set = TRENDEL.filter(s => EL[s].g === g); }
  else { const p = R.pick([2, 3]); set = TRENDEL.filter(s => EL[s].p === p && ![2, 14].includes(0)); }
  let tries = 0; do { set = R.some(set.length >= 4 ? set : TRENDEL.filter(s => EL[s].p === 3), 4); tries++; } while (hasAnom(prop, set) && tries < 40);
  if (hasAnom(prop, set)) return TPL['tr-rank'].make(R);
  const sorted = set.slice().sort((x, y) => tscore(y, dir) - tscore(x, dir)), win = sorted[0];
  return Object.assign(MCI('Which of these has the ' + prop.replace('larger', 'largest').replace('higher', 'highest').replace('more', 'most') + ': ' + set.map(ce).join(', ') + '?', ce(win), sorted.slice(1).map(s => [ce(s), why, 'trend_direction', 'concept']),
    ['Are they in the same period or the same group?', why],
    [['', byGroup ? 'They are all in group ' + EL[set[0]].g + '.' : 'They are all in period ' + EL[set[0]].p + '.'], ['', why + ' So ' + ce(win) + '.']]), {chk: {trend: prop, set, win}});
}});
tpl({id: 'tr-ion', s: 'trends', d: 2, name: 'Ion size', make(R) {
  if (R.f() < 0.5) {
    const [sy, q] = R.pick(IONS_MG), bigger = q > 0 ? sy : sy + chgCe(q), smaller = q > 0 ? sy + chgCe(q) : sy;
    return MCI('Which is larger: ' + ce(sy) + ' or ' + ce(sy + chgCe(q)) + '?', ce(bigger), [[ce(smaller), q > 0 ? 'A positive ion has lost electrons (often a whole energy level), so it is smaller than its atom.' : 'A negative ion has gained electrons; more electron repulsion with the same nucleus makes it larger.', 'ion_size', 'concept']],
      ['Did the atom lose or gain electrons?', 'Cations are smaller than their atoms; anions are larger.'], [['', q > 0 ? ce(sy) + ' loses ' + q + ' electron' + (q > 1 ? 's' : '') + ' to form the ion, so the ion is smaller.' : ce(sy) + ' gains ' + (-q) + ' electron' + (q < -1 ? 's' : '') + ', so the ion is larger.']]);
  }
  const series = R.pick([[['O', -2], ['F', -1], ['Na', 1], ['Mg', 2]], [['N', -3], ['O', -2], ['F', -1], ['Na', 1]], [['S', -2], ['Cl', -1], ['K', 1], ['Ca', 2]], [['P', -3], ['S', -2], ['Cl', -1], ['K', 1]]]);
  const big = R.f() < 0.5, pick = big ? series[0] : series[3], lab = x => ce(x[0] + chgCe(x[1]));
  return MCI('These ions all have the same number of electrons: ' + series.map(lab).join(', ') + '. Which is the ' + (big ? 'largest' : 'smallest') + '?', lab(pick), series.filter(x => x !== pick).map(x => [lab(x), 'Same electrons, but ' + EL[x[0]].z + ' protons: ' + (big ? 'more protons than ' + lab(pick) + ' pull them closer.' : 'fewer protons than ' + lab(pick) + ', so a weaker pull.'), 'isoelectronic', 'concept']),
    ['Same number of electrons: compare the number of protons.', 'More protons pull the same electrons in tighter, making a smaller ion.'],
    [['', 'Protons: ' + series.map(x => lab(x) + ' ' + EL[x[0]].z).join(', ') + '.'], ['', (big ? 'Fewest' : 'Most') + ' protons: ' + lab(pick) + '.']]);
}});

// ===== Unit 4 · Ions and ionic formulas
const MGQ = {Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, N: -3, P: -3, O: -2, S: -2, Se: -2, F: -1, Cl: -1, Br: -1, I: -1};
tpl({id: 'io-charge', s: 'ionic', d: 1, name: 'Predict the ion charge', make(R) {
  const sy = R.pick(Object.keys(MGQ)), q = MGQ[sy], e = EL[sy], v = e.g > 12 ? e.g - 10 : e.g, traps = [TR('q', -q, q > 0 ? 'Metals LOSE electrons, so they form positive ions.' : 'Nonmetals GAIN electrons, so they form negative ions.', 'charge_sign', 'concept')];
  if (e.g > 12) traps.push(TR('q', v, 'Losing ' + v + ' electrons is far harder than gaining ' + (8 - v) + '. Nonmetals gain to reach eight.', 'charge_from_valence', 'concept'));
  if (e.g > 12) traps.push(TR('q', e.g, 'The group number isn\'t the charge. Count how many electrons it gains to reach a noble-gas configuration.', 'charge_from_valence', 'concept'));
  return one('What is the charge on the ion that ' + e.n.toLowerCase() + ' (' + ce(sy) + ') usually forms?', CHG('q', 'Ion charge', q), traps,
    ['Atoms gain or lose the fewest electrons needed to match the nearest noble gas.', ce(sy) + ' has ' + v + ' valence electron' + (v > 1 ? 's' : '') + '.'],
    [['', ce(sy) + ' has ' + v + ' valence electron' + (v > 1 ? 's' : '') + '.'], ['', q > 0 ? 'Losing ' + q + ' is easiest, so the ion is ' + ce(sy + chgCe(q)) + '.' : 'Gaining ' + (-q) + ' completes the octet, so the ion is ' + ce(sy + chgCe(q)) + '.']]);
}});
const POLY = {OH: ['hydroxide', -1], NO3: ['nitrate', -1], NO2: ['nitrite', -1], SO4: ['sulfate', -2], SO3: ['sulfite', -2], PO4: ['phosphate', -3], CO3: ['carbonate', -2], HCO3: ['hydrogen carbonate', -1], C2H3O2: ['acetate', -1], ClO3: ['chlorate', -1], MnO4: ['permanganate', -1], CN: ['cyanide', -1], CrO4: ['chromate', -2], Cr2O7: ['dichromate', -2], NH4: ['ammonium', 1]};
function ionFormula(cat, cq, an, aq) {   // criss-cross, reduce, parentheses for polyatomic ions
  let a = Math.abs(aq), c = Math.abs(cq); const g = gcdi(a, c); a /= g; c /= g;
  const part = (s, n, poly) => n === 1 ? s : (poly ? '(' + s + ')' : s) + n;
  return part(cat, a, !!POLY[cat] && cat !== 'NH4' ? true : cat === 'NH4') + part(an, c, !!POLY[an]);
}
const CAT1 = ['Li', 'Na', 'K', 'Mg', 'Ca', 'Sr', 'Ba', 'Al'], AN1 = ['N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'];
tpl({id: 'io-formula', s: 'ionic', d: 1, name: 'Formula from two elements', make(R) {
  const cat = R.pick(CAT1), an = R.pick(AN1), cq = MGQ[cat], aq = MGQ[an], f = ionFormula(cat, cq, an, aq), traps = [];
  traps.push(TR('f', cat + an, 'The charges have to cancel: ' + ce(cat + chgCe(cq)) + ' and ' + ce(an + chgCe(aq)) + ' need ' + f.replace(/[A-Z][a-z]?/g, ' ').trim() + ' ratio.', 'charges_not_balanced'));
  const sw = (Math.abs(cq) === 1 ? '' : '') + cat + (Math.abs(cq) > 1 ? Math.abs(cq) : '') + an + (Math.abs(aq) > 1 ? Math.abs(aq) : '');
  if (Math.abs(cq) !== Math.abs(aq)) traps.push(TR('f', sw, 'Criss-cross: each ion\'s charge becomes the OTHER ion\'s subscript.', 'crisscross_wrong'));
  if (['N', 'O', 'F', 'Cl', 'Br', 'I'].includes(an)) traps.push(TR('f', f.replace(new RegExp(an + '(\\d*)$'), (m, d) => an + ((+d || 1) * 2)), ce(an + '2') + ' is the element on its own. In the compound each ' + ce(an + chgCe(aq)) + ' ion counts separately, and the charges set the ratio.', 'diatomic_in_compound'));
  if (Math.abs(cq) === Math.abs(aq) && Math.abs(cq) > 1) traps.push(TR('f', cat + Math.abs(aq) + an + Math.abs(cq), 'Reduce to the lowest whole-number ratio: ' + ce(f) + '.', 'not_reduced'));
  if (Math.abs(cq) === Math.abs(aq)) { traps.push(TR('f', cat + '2' + an, 'The charges ' + chgTxt(cq) + ' and ' + chgTxt(aq) + ' already cancel 1 : 1.', 'charges_not_balanced')); }
  return one('Write the formula of the ionic compound formed by ' + EL[cat].n.toLowerCase() + ' and ' + EL[an].n.toLowerCase() + '.', FRM('f', 'Formula', f), traps,
    ['Find each ion\'s charge: ' + ce(cat) + ' forms ' + ce(cat + chgCe(cq)) + ', ' + ce(an) + ' forms ' + ce(an + chgCe(aq)) + '.', 'The total positive charge must equal the total negative charge.'],
    [[ce(cat + chgCe(cq)) + '\\quad ' + ce(an + chgCe(aq)), 'Ion charges.'], ['', 'Criss-cross the charge numbers into subscripts, then reduce.'], [ce(f), 'Check: ' + Math.abs(cq) + ' × ' + (parseFormula(f).c[cat]) + ' = ' + Math.abs(aq) + ' × ' + (parseFormula(f).c[an]) + '.']]);
}});
const CATP = [['Na', 1], ['K', 1], ['Ca', 2], ['Mg', 2], ['Ba', 2], ['Al', 3], ['NH4', 1], ['Li', 1], ['Sr', 2], ['Zn', 2], ['Ag', 1]];
tpl({id: 'io-poly', s: 'ionic', d: 2, name: 'Formulas with polyatomic ions', make(R) {
  let cat, cq, an; do { [cat, cq] = R.pick(CATP); an = R.pick(Object.keys(POLY).filter(k => k !== 'NH4')); } while (cat === 'NH4' && ['MnO4', 'CrO4', 'Cr2O7'].includes(an));
  const aq = POLY[an][1], f = ionFormula(cat, cq, an, aq), lab = s => (POLY[s] ? s : s), traps = [];
  const plain = f.replace(/[()]/g, ''); if (plain !== f) traps.push(TR('f', plain, 'Put the polyatomic ion in parentheses before its subscript: without them the subscript changes the ion itself.', 'parentheses'));
  traps.push(TR('f', (cat === 'NH4' ? 'NH4' : cat) + an, 'The charges have to cancel: ' + ce((cat) + chgCe(cq)) + ' and ' + ce(an + chgCe(aq)) + '.', 'charges_not_balanced'));
  const ATE = {NO3: 'NO2', NO2: 'NO3', SO4: 'SO3', SO3: 'SO4'};
  if (ATE[an]) traps.push(TR('f', ionFormula(cat, cq, ATE[an], POLY[ATE[an]][1]), ce(ATE[an] + chgCe(POLY[ATE[an]][1])) + ' is ' + POLY[ATE[an]][0] + '; ' + POLY[an][0] + ' is ' + ce(an + chgCe(aq)) + '.', 'ate_ite'));
  if (Math.abs(cq) === Math.abs(aq)) { const p1 = POLY[an] ? '(' + an + ')2' : an + '2', c1 = POLY[cat] ? '(' + cat + ')2' : cat + '2'; traps.push(TR('f', cat + p1, 'The charges ' + chgTxt(cq) + ' and ' + chgTxt(aq) + ' already cancel 1 : 1.', 'charges_not_balanced')); traps.push(TR('f', c1 + an, 'The charges ' + chgTxt(cq) + ' and ' + chgTxt(aq) + ' already cancel 1 : 1.', 'charges_not_balanced')); }
  return one('Write the formula of the compound made of ' + ce(cat + chgCe(cq)) + ' and ' + ce(an + chgCe(aq)) + ' (' + POLY[an][0] + ').', FRM('f', 'Formula', f), traps,
    ['Treat the polyatomic ion as one unit; never change the subscripts inside it.', 'Balance the charges: you need ' + (Math.abs(aq) / gcdi(cq, aq)) + ' of ' + ce(cat + chgCe(cq)) + ' for every ' + (cq / gcdi(cq, Math.abs(aq))) + ' of ' + ce(an + chgCe(aq)) + '.'],
    [[ce(cat + chgCe(cq)) + '\\quad ' + ce(an + chgCe(aq)), 'Charges.'], ['', 'Criss-cross and reduce; use parentheses if there is more than one polyatomic ion.'], [ce(f), '']]);
}});

// ===== Unit 4 · Lewis structures, shapes and polarity
// [formula, central, atoms bonded to central, lone pairs on central, valence electrons, shape, polar, angle]
const MOLS = [['CH4', 'C', 4, 0, 8, 'tetrahedral', 0, '109.5°'], ['NH3', 'N', 3, 1, 8, 'trigonal pyramidal', 1, '107°'], ['H2O', 'O', 2, 2, 8, 'bent', 1, '104.5°'], ['CO2', 'C', 2, 0, 16, 'linear', 0, '180°'],
  ['BF3', 'B', 3, 0, 24, 'trigonal planar', 0, '120°'], ['SO2', 'S', 2, 1, 18, 'bent', 1, ''], ['SO3', 'S', 3, 0, 24, 'trigonal planar', 0, '120°'], ['CCl4', 'C', 4, 0, 32, 'tetrahedral', 0, '109.5°'],
  ['PCl3', 'P', 3, 1, 26, 'trigonal pyramidal', 1, ''], ['H2S', 'S', 2, 2, 8, 'bent', 1, ''], ['HCN', 'C', 2, 0, 10, 'linear', 1, '180°'], ['SiH4', 'Si', 4, 0, 8, 'tetrahedral', 0, '109.5°'],
  ['OF2', 'O', 2, 2, 20, 'bent', 1, ''], ['NF3', 'N', 3, 1, 26, 'trigonal pyramidal', 1, ''], ['CH2O', 'C', 3, 0, 12, 'trigonal planar', 1, '120°'], ['BeCl2', 'Be', 2, 0, 16, 'linear', 0, '180°'],
  ['CS2', 'C', 2, 0, 16, 'linear', 0, '180°'], ['CHCl3', 'C', 4, 0, 26, 'tetrahedral', 1, ''], ['CH2Cl2', 'C', 4, 0, 20, 'tetrahedral', 1, ''], ['SCl2', 'S', 2, 2, 20, 'bent', 1, ''], ['PCl5', 'P', 5, 0, 40, 'trigonal bipyramidal', 0, ''], ['SF6', 'S', 6, 0, 48, 'octahedral', 0, '90°']];
const IONSV = [['NH4^+', 8, 1], ['OH^-', 8, -1], ['CN^-', 10, -1], ['NO3^-', 24, -1], ['CO3^2-', 24, -2], ['SO4^2-', 32, -2], ['PO4^3-', 32, -3], ['ClO3^-', 26, -1], ['H3O^+', 8, 1], ['NO2^-', 18, -1]];
const vOf = sy => { const g = EL[sy].g; return g > 12 ? g - 10 : g; };
tpl({id: 'lw-valence', s: 'lewis', d: 1, name: 'Count valence electrons', make(R) {
  const ion = R.f() < 0.4;
  if (ion) {
    const [f, ve, q] = R.pick(IONSV), base = f.replace(/\^.*/, ''), c = parseFormula(base).c, sum = Object.keys(c).reduce((s, e) => s + c[e] * vOf(e), 0);
    return one('How many valence electrons go into the Lewis structure of $' + ce(f) + '$?', INT('v', 'Valence electrons', ve),
      [TR('v', sum, 'Adjust for the charge: ' + (q < 0 ? 'add ' + (-q) + ' electron' + (q < -1 ? 's' : '') + ' for a negative ion.' : 'remove ' + q + ' electron for a positive ion.'), 'ion_charge_ignored', 'procedure'), TR('v', sum + q, q < 0 ? 'A negative charge means EXTRA electrons: add them.' : 'A positive charge means missing electrons: subtract.', 'ion_charge_ignored', 'procedure')],
      ['Add the valence electrons of every atom, then adjust for the charge.', Object.keys(c).map(e => c[e] + '×' + vOf(e) + ' (' + e + ')').join(' + ') + (q < 0 ? ' + ' + (-q) : ' − ' + q)],
      [[Object.keys(c).map(e => c[e] + '(' + vOf(e) + ')').join('+') + '=' + sum, 'Valence electrons of the atoms.'], [sum + (q < 0 ? '+' + (-q) : '-' + q) + '=' + ve, q < 0 ? 'Add electrons for the negative charge.' : 'Remove electrons for the positive charge.']]);
  }
  const [f, , , , ve] = R.pick(MOLS), c = parseFormula(f).c, once = Object.keys(c).reduce((s, e) => s + vOf(e), 0), zs = Object.keys(c).reduce((s, e) => s + c[e] * EL[e].z, 0), traps = [];
  if (once !== ve) traps.push(TR('v', once, 'Count every atom: there are ' + Object.keys(c).map(e => c[e] + ' ' + e).join(', ') + '.', 'atoms_counted_once', 'slip'));
  traps.push(TR('v', zs, 'Use only VALENCE electrons (from the group number), not all the electrons.', 'used_atomic_number', 'concept'));
  return one('How many valence electrons are in a molecule of $' + ce(f) + '$?', INT('v', 'Valence electrons', ve), traps,
    ['Valence electrons come from the group: C has 4, N 5, O 6, halogens 7, H 1.', Object.keys(c).map(e => c[e] + '×' + vOf(e) + ' (' + e + ')').join(' + ')],
    [[Object.keys(c).map(e => c[e] + '(' + vOf(e) + ')').join('+') + '=' + ve, 'Atoms × valence electrons each.']]);
}});
tpl({id: 'lw-parts', s: 'lewis', d: 2, name: 'Bonded atoms and lone pairs', make(R) {
  const [f, cen, b, lp] = R.pick(MOLS.filter(m => m[2] <= 4)), c = parseFormula(f).c, outer = Object.keys(c).reduce((s, e) => s + c[e], 0) - 1;
  const traps = [TR('l', lp + (b > 1 ? b : 0) + 1, 'Count only the lone pairs on the CENTRAL atom, ' + ce(cen) + '.', 'lone_pairs_all_atoms', 'concept'), TR('l', 2 * lp + (lp ? 0 : 2), 'Count PAIRS, not individual electrons.', 'lone_pair_electrons', 'slip')];
  return {q: 'Draw the Lewis structure of $' + ce(f) + '$. How many atoms are bonded to the central ' + ce(cen) + ' atom, and how many lone pairs are on ' + ce(cen) + '?', fs: [INT('b', 'Atoms bonded to ' + cen, b), INT('l', 'Lone pairs on ' + cen, lp)], traps,
    h: ['Place ' + ce(cen) + ' in the middle and connect the other ' + outer + ' atom' + (outer > 1 ? 's' : '') + '.', 'Fill octets on the outer atoms first; leftover electrons go on ' + ce(cen) + ' as lone pairs.'],
    x: [['', ce(cen) + ' is bonded to ' + b + ' atom' + (b > 1 ? 's' : '') + '.'], ['', lp ? ce(cen) + ' keeps ' + lp + ' lone pair' + (lp > 1 ? 's' : '') + ' to complete its octet.' : ce(cen) + ' has no lone pairs: all its electrons are in bonds' + (f === 'BF3' ? ' (boron is fine with six).' : '.')]]};
}});
const BONDS = [['H2', 'single'], ['O2', 'double'], ['N2', 'triple'], ['Cl2', 'single'], ['F2', 'single'], ['CO', 'triple'], ['HF', 'single'], ['HCl', 'single']];
tpl({id: 'lw-bond', s: 'lewis', d: 1, name: 'Single, double or triple bond', make(R) {
  const [f, b] = R.pick(BONDS), why = {single: 'one shared pair completes both atoms', double: 'each oxygen needs two more electrons, so they share two pairs', triple: 'each atom needs three more electrons, so they share three pairs'};
  const map = {single: 'Single bond', double: 'Double bond', triple: 'Triple bond'};
  return MCI('What kind of bond holds the two atoms of $' + ce(f) + '$ together?', map[b], Object.keys(map).filter(k => k !== b).map(k => [map[k], 'Count the electrons each atom needs to reach an octet (2 for hydrogen): here ' + why[b] + '.', 'bond_order', 'concept']),
    ['How many electrons does each atom need to complete its octet?', 'Each shared pair is one bond.'], [['', 'In ' + ce(f) + ', ' + why[b] + '.'], ['', 'So it is a ' + b + ' bond.']]);
}});
const SHAPES = ['linear', 'bent', 'trigonal planar', 'trigonal pyramidal', 'tetrahedral', 'trigonal bipyramidal', 'octahedral'];
tpl({id: 'sh-vsepr', s: 'shape', d: 1, name: 'Molecular shape', make(R) {
  const [f, cen, b, lp, , shape] = R.pick(MOLS), groups = b + lp, egeo = {2: 'linear', 3: 'trigonal planar', 4: 'tetrahedral', 5: 'trigonal bipyramidal', 6: 'octahedral'}[groups];
  const wrongs = [];
  if (lp && egeo !== shape) wrongs.push([egeo[0].toUpperCase() + egeo.slice(1), 'That is the arrangement of all ' + groups + ' electron groups. The shape names only where the ATOMS are, and ' + lp + ' lone pair' + (lp > 1 ? 's' : '') + ' bend it.', 'electron_vs_molecular', 'concept']);
  R.shuf(SHAPES.filter(s => s !== shape && s !== egeo && (b <= 4 ? !['trigonal bipyramidal', 'octahedral'].includes(s) : true))).slice(0, 3 - wrongs.length).forEach(s => wrongs.push([s[0].toUpperCase() + s.slice(1), ce(f) + ' has ' + b + ' bonded atom' + (b > 1 ? 's' : '') + ' and ' + lp + ' lone pair' + (lp === 1 ? '' : 's') + ' on ' + ce(cen) + ', which gives ' + shape + '.', 'vsepr_shape', 'concept']));
  return MCI('What is the molecular shape of $' + ce(f) + '$?', shape[0].toUpperCase() + shape.slice(1), wrongs,
    ['Count the electron groups on the central atom: bonded atoms plus lone pairs.', ce(cen) + ' has ' + b + ' bonded atom' + (b > 1 ? 's' : '') + ' and ' + lp + ' lone pair' + (lp === 1 ? '' : 's') + '.'],
    [['', groups + ' electron groups spread out as ' + egeo + '.'], ['', lp ? 'With ' + lp + ' lone pair' + (lp > 1 ? 's' : '') + ', the atoms form a ' + shape + ' shape.' : 'No lone pairs, so the shape is ' + shape + '.']]);
}});
tpl({id: 'sh-angle', s: 'shape', d: 2, name: 'Bond angles', make(R) {
  const [f, cen, b, lp, , shape, , ang] = R.pick(MOLS.filter(m => m[7])), opts = ['180°', '120°', '109.5°', '107°', '104.5°', '90°'];
  return MCI('What is the approximate bond angle in $' + ce(f) + '$ (' + shape + ')?', ang, R.shuf(opts.filter(o => o !== ang)).slice(0, 3).map(o => [o, ang + ' fits ' + b + ' atoms and ' + lp + ' lone pair' + (lp === 1 ? '' : 's') + ' around ' + ce(cen) + '. Lone pairs squeeze bond angles a little smaller.', 'bond_angle', 'concept']),
    ['Linear 180°, trigonal planar 120°, tetrahedral 109.5°.', 'Each lone pair pushes the bonds a bit closer: about 107° with one, 104.5° with two.'], [['', ce(f) + ' is ' + shape + '.'], ['', 'Bond angle ≈ ' + ang + '.']]);
}});
const ENPOOL = ['H', 'Li', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Br', 'I', 'Cs'];
const BTYPE = d => d < 0.4 ? 'Nonpolar covalent' : d <= 1.7 ? 'Polar covalent' : 'Ionic';
tpl({id: 'sh-bondtype', s: 'shape', d: 1, name: 'Bond type from electronegativity', make(R) {
  let a, b, d; do { a = R.pick(ENPOOL); b = R.pick(ENPOOL); d = Math.abs(EL[a].en - EL[b].en); } while (Math.abs(d - 0.4) < 0.1 || Math.abs(d - 1.7) < 0.1 || (a === b && R.f() < 0.7));
  const t = BTYPE(+d.toFixed(2)), all = ['Nonpolar covalent', 'Polar covalent', 'Ionic'];
  return Object.assign(MCI('Electronegativities: ' + ce(a) + ' $' + EL[a].en.toFixed(2) + '$, ' + ce(b) + ' $' + EL[b].en.toFixed(2) + '$. What type of bond forms between them? (Difference: below 0.4 nonpolar, 0.4–1.7 polar, above 1.7 ionic)', t, all.filter(x => x !== t).map(x => [x, 'The difference is ' + d.toFixed(2) + ', which falls in the ' + t.toLowerCase() + ' range.', 'bond_type', 'procedure']),
    ['Subtract the smaller electronegativity from the larger.', '$' + Math.max(EL[a].en, EL[b].en).toFixed(2) + '-' + Math.min(EL[a].en, EL[b].en).toFixed(2) + '=' + d.toFixed(2) + '$'],
    [[Math.max(EL[a].en, EL[b].en).toFixed(2) + '-' + Math.min(EL[a].en, EL[b].en).toFixed(2) + '=' + d.toFixed(2), 'Electronegativity difference.'], ['', d.toFixed(2) + ' is ' + (d < 0.4 ? 'below 0.4' : d <= 1.7 ? 'between 0.4 and 1.7' : 'above 1.7') + ': ' + t.toLowerCase() + '.']]), {chk: {a, b, d: +d.toFixed(2), t}});
}});
tpl({id: 'sh-polar', s: 'shape', d: 2, name: 'Polar or nonpolar molecule', make(R) {
  const [f, cen, b, lp, , shape, polar] = R.pick(MOLS), right = polar ? 'Polar' : 'Nonpolar';
  const why = polar ? (lp ? 'The lone pair' + (lp > 1 ? 's' : '') + ' on ' + ce(cen) + ' make' + (lp > 1 ? '' : 's') + ' it ' + shape + ', so the bond dipoles don\'t cancel.' : 'Different atoms surround ' + ce(cen) + ', so the bond dipoles don\'t cancel.') : 'Its polar bonds are arranged symmetrically (' + shape + '), so their pulls cancel out.';
  return MCI('Is $' + ce(f) + '$ a polar or a nonpolar molecule?', right, [[polar ? 'Nonpolar' : 'Polar', why, 'molecule_polarity', 'concept']],
    ['Check the shape first: is it symmetric?', 'Symmetric shapes with identical outer atoms are nonpolar, even with polar bonds.'], [['', ce(f) + ' is ' + shape + '.'], ['', why]]);
}});

// ===== Unit 4 · Intermolecular forces
const IMF = [['H2O', 'h', 100], ['NH3', 'h', -33], ['HF', 'h', 20], ['CH3OH', 'h', 65], ['HCl', 'd', -85], ['H2S', 'd', -60], ['CH2O', 'd', -19], ['SO2', 'd', -10], ['CHCl3', 'd', 61], ['PH3', 'd', -88], ['HBr', 'd', -67],
  ['CH4', 'l', -162], ['CO2', 'l', -78], ['N2', 'l', -196], ['O2', 'l', -183], ['CCl4', 'l', 77], ['I2', 'l', 184], ['Br2', 'l', 59], ['Cl2', 'l', -34], ['F2', 'l', -188], ['He', 'l', -269], ['C3H8', 'l', -42], ['C8H18', 'l', 126]];
const IMFN = {l: 'London dispersion forces', d: 'Dipole–dipole forces', h: 'Hydrogen bonding'};
tpl({id: 'im-strong', s: 'imf', d: 1, name: 'Strongest intermolecular force', make(R) {
  const [f, k] = R.pick(IMF), why = {
    l: {d: 'It is nonpolar, so it has no permanent dipole.', h: 'Hydrogen bonding needs H bonded directly to N, O or F.'},
    d: {l: 'Every molecule has London forces, but this one is polar, so dipole–dipole forces are stronger.', h: 'Hydrogen bonding needs H bonded directly to N, O or F' + (f.includes('Cl') || f.includes('S') || f.includes('Br') || f.includes('P') ? '; this H is bonded to a less electronegative atom.' : '.')},
    h: {l: 'It has London forces, but H bonded to N, O or F gives much stronger hydrogen bonds.', d: 'It is polar, but H bonded to N, O or F makes hydrogen bonding the strongest force.'}};
  const wr = Object.keys(IMFN).filter(o => o !== k).map(o => [IMFN[o], why[k][o], 'imf_type', 'concept']).concat([['Ionic bonding', 'Ionic bonds hold ions together inside a compound; they are not forces between separate molecules.', 'intra_vs_inter', 'concept']]);
  return MCI('What is the strongest intermolecular force between molecules of $' + ce(f) + '$?', IMFN[k], wr,
    ['Is the molecule polar? Does it have H bonded to N, O or F?', 'H–N, H–O or H–F: hydrogen bonding. Polar: dipole–dipole. Nonpolar: London dispersion only.'],
    [['', k === 'h' ? ce(f) + ' has H bonded to ' + (f.includes('O') ? 'O' : f.includes('N') ? 'N' : 'F') + '.' : k === 'd' ? ce(f) + ' is polar, without H on N, O or F.' : ce(f) + ' is nonpolar.'], ['', 'Strongest force: ' + IMFN[k].toLowerCase() + '.']]);
}});
const BPPAIRS = [['H2O', 'H2S'], ['HF', 'HCl'], ['NH3', 'PH3'], ['CH3OH', 'CH4'], ['I2', 'F2'], ['Br2', 'Cl2'], ['CCl4', 'CH4'], ['C8H18', 'C3H8'], ['CHCl3', 'CH4'], ['H2O', 'CH4'], ['HBr', 'HCl']];
tpl({id: 'im-bp', s: 'imf', d: 2, name: 'Higher boiling point', make(R) {
  const [a, b] = R.pick(BPPAIRS), A = IMF.find(x => x[0] === a), B = IMF.find(x => x[0] === b), hi = A[2] > B[2] ? A : B, lo = hi === A ? B : A, first = R.f() < 0.5 ? [a, b] : [b, a];
  const reason = hi[1] !== lo[1] ? ce(hi[0]) + ' has ' + IMFN[hi[1]].toLowerCase() + ', stronger than the ' + IMFN[lo[1]].toLowerCase().replace('forces', '') + 'forces in ' + ce(lo[0]) + '.' : 'Both have ' + IMFN[hi[1]].toLowerCase() + ', but ' + ce(hi[0]) + ' is bigger, with more electrons, so its London forces are stronger.';
  return MCI('Which has the higher boiling point: $' + ce(first[0]) + '$ or $' + ce(first[1]) + '$?', ce(hi[0]), [[ce(lo[0]), reason, 'imf_strength', 'concept']],
    ['Stronger forces between molecules mean more energy is needed to boil.', 'Compare the strongest force in each; if it is the same kind, the bigger molecule wins.'],
    [['', reason], ['', 'So ' + ce(hi[0]) + ' boils higher (' + hi[2] + ' °C vs ' + lo[2] + ' °C).']]);
}});
