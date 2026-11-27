const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {console, Math, Number, String, Array, Set, Object, JSON, isFinite, parseFloat, Error};
vm.createContext(ctx);
ctx.D = {pt: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'py', 'pt.json'), 'utf8'))};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', '10-chem.js'), 'utf8') + '\n;globalThis.E_ = {parseFormula, molarMass, sfOf, parseNum, fmtSF, texN, cfgStr, parseCfg, normN, gradeNumF, gradeIntF, gradeChgF, gradeFrmF, gradeNameF, gradeCfgF, gradeSymF, gradeCoefF, ceHTML, cfgHTML, ceSay, massList, niceN, parseChg};', ctx);
const E = ctx.E_; let bad = 0, n = 0;
const eq = (a, b, label) => { n++; const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) { bad++; console.log('FAIL', label, 'got', A, 'want', B); } };
const pf = f => { const p = E.parseFormula(f); return p.err ? 'ERR:' + p.err : p; };
eq(pf('Ca(NO3)2'), {c: {Ca: 1, N: 2, O: 6}, q: 0}, 'CaNO32');
eq(pf('CuSO4·5H2O'), {c: {Cu: 1, S: 1, O: 9, H: 10}, q: 0}, 'hydrate');
eq(pf('CuSO4.5H2O').c.H, 10, 'hydrate dot');
eq(pf('SO4^2-').q, -2, 'sulfate'); eq(pf('NH4^+').q, 1, 'ammonium'); eq(pf('NH4+').q, 1, 'ammonium2'); eq(pf('SO₄²⁻').q, -2, 'unicode charge');
eq(pf('H₂O').c, {H: 2, O: 1}, 'unicode sub'); eq(pf('Fe2(SO4)3').c, {Fe: 2, S: 3, O: 12}, 'iron sulfate');
eq(pf('nacl'), 'ERR:lower:n', 'lowercase'); eq(pf('Xx2'), 'ERR:sym:Xx', 'bad symbol'); eq(pf('2H2O'), 'ERR:coef', 'coef'); eq(pf('Ca(NO3'), 'ERR:paren', 'paren');
eq(E.molarMass('H2O'), 18.02, 'mm water'); eq(E.molarMass('Ca(NO3)2'), 164.1, 'mm cano3'); eq(E.molarMass('CuSO4·5H2O'), 249.71, 'mm hydrate'); eq(E.molarMass('C6H12O6'), 180.18, 'mm glucose');
[['0.00450', 3], ['1007', 4], ['3400', 2], ['3400.', 4], ['25.00', 4], ['100', 1], ['6.020', 4], ['0.0', 1], ['5', 1], ['10.', 2], ['0.10', 2]].forEach(([s, k]) => eq(E.sfOf(s), k, 'sf ' + s));
const pn = s => { const p = E.parseNum(s); return p && [+p.v.toPrecision(12), p.sf, p.sci]; };
eq(pn('6.02×10^23'), [6.02e23, 3, true], 'sci1'); eq(pn('6.02e23'), [6.02e23, 3, true], 'sci2'); eq(pn('1.2x10^-5'), [1.2e-5, 2, true], 'sci3');
eq(pn('-3.5'), [-3.5, 2, false], 'neg'); eq(pn('1,200'), [1200, 2, false], 'comma'); eq(pn('10^-7'), [1e-7, 1, true], 'bare power'); eq(pn('abc'), null, 'junk'); eq(pn('4.5 × 10^4'), [45000, 2, true], 'spaces'); eq(pn('−2'), [-2, 1, false], 'unicode minus');
eq(E.fmtSF(0.0045627, 3), '0.00456', 'fmt1'); eq(E.fmtSF(13548, 2), '14000', 'fmt2'); eq(E.fmtSF(1200, 3), '1.20×10^3', 'fmt3'); eq(E.fmtSF(6.0221e23, 4), '6.022×10^23', 'fmt4');
eq(E.fmtSF(0.000123, 3), '1.23×10^-4', 'fmt5'); eq(E.fmtSF(0.00123, 3), '0.00123', 'fmt6'); eq(E.fmtSF(25, 3), '25.0', 'fmt7'); eq(E.fmtSF(9.996, 3), '10.0', 'fmt8'); eq(E.fmtSF(-0.5, 2), '-0.50', 'fmt9'); eq(E.fmtSF(45000, 2, 'sci'), '4.5×10^4', 'fmt10');
eq(E.texN('6.02×10^23'), '6.02\\times10^{23}', 'tex'); eq(E.texN('1.2×10^-5'), '1.2\\times10^{-5}', 'tex2');
eq(E.cfgStr(16), '1s2 2s2 2p6 3s2 3p4', 'cfg S'); eq(E.cfgStr(26, true), '[Ar] 4s2 3d6', 'cfg Fe'); eq(E.cfgStr(2, true), '1s2', 'cfg He'); eq(E.cfgStr(10, true), '[He] 2s2 2p6', 'cfg Ne core');
eq(E.parseCfg('1s22s22p63s1').m, {'1s': 2, '2s': 2, '2p': 6, '3s': 1}, 'nospace'); eq(E.parseCfg('[Ne] 3s1').tot, 11, 'core'); eq(E.parseCfg('1s² 2s² 2p⁶').tot, 10, 'unicode sup');
eq(E.parseCfg('[Ar] 4s2 3d10 4p6').tot, 36, 'Kr'); eq(E.parseCfg('1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6 6s2 4f14').tot, 70, 'f14');
eq(E.normN('Iron (III) oxide'), 'iron(iii) oxide', 'roman1'); eq(E.normN('iron III oxide'), 'iron(iii) oxide', 'roman2'); eq(E.normN('  Dinitrogen   Tetroxide '), 'dinitrogen tetroxide', 'spaces'); eq(E.normN('iodine heptafluoride'), 'iodine heptafluoride', 'no false roman');
const N = (t, fd, tr) => { const g = E.gradeNumF(t, Object.assign({id: 'a', t: 'num'}, fd), tr || []); return g.ok ? 'ok' + (g.note ? '+note' : '') : g.bad ? 'bad' : g.id; };
eq(N('8.53', {ans: 8.528, sf: 3}), 'ok', 'num ok'); eq(N('8.5', {ans: 8.528, sf: 3}), 'ok+note', 'num note'); eq(N('0.1173', {ans: 8.528}, [{f: 'a', v: 1 / 8.528, id: 'inverted', why: 'x'}]), 'inverted', 'trap');
eq(N('852.8', {ans: 8.528}), 'power10', 'p10'); eq(N('-8.528', {ans: 8.528}), 'sign', 'sign'); eq(N('8.8', {ans: 8.528}), 'rounding', 'round'); eq(N('x', {ans: 1}), 'bad', 'bad');
eq(N('4.5×10^4', {ans: 45000, sf: 2, sfs: true, fmt: 'sci', tol: 1e-9}), 'ok', 'sci ok'); eq(N('45000', {ans: 45000, sf: 2, sfs: true, fmt: 'sci', tol: 1e-9}), 'sci_format', 'sci needed');
eq(N('0.00457', {ans: 0.00456, sf: 3, sfs: true, tol: 1e-9}), 'not_equal', 'strict round'); eq(N('0.004560', {ans: 0.00456, sf: 3, sfs: true, tol: 1e-9}), 'sigfigs', 'strict sf'); eq(N('2.61', {ans: 2.602, abs: 0.02}), 'ok', 'abs ok'); eq(N('2.65', {ans: 2.602, abs: 0.02}), 'not_equal', 'abs miss');
const C = (t, a) => { const g = E.gradeChgF(t, {id: 'c', t: 'chg', ans: a}, []); return g.ok ? 'ok' : g.bad ? 'bad' : g.id; };
eq([C('2+', 2), C('+2', 2), C('2-', -2), C('−3', -3), C('+', 1), C('-2', 2), C('x', 1), C('0', 0)], ['ok', 'ok', 'ok', 'ok', 'ok', 'charge_sign', 'bad', 'ok'], 'charges');
const F = (t, a, o) => { const g = E.gradeFrmF(t, Object.assign({id: 'f', t: 'frm', ans: a}, o || {}), []); return g.ok ? 'ok' : g.bad ? 'bad' : g.id; };
eq([F('Ca3(PO4)2', 'Ca3(PO4)2'), F('Ca3PO42', 'Ca3(PO4)2'), F('Ca6(PO4)4', 'Ca3(PO4)2'), F('ClNa', 'NaCl'), F('ClNa', 'NaCl', {order: 'any'}), F('nacl', 'NaCl'), F('CO', 'Co'), F('2H2O', 'H2O'), F('Ca₃(PO₄)₂', 'Ca3(PO4)2')],
  ['ok', 'parentheses', 'not_reduced', 'formula_order', 'ok', 'bad', 'not_equal', 'bad', 'ok'], 'formulas');
const Nm = (t, a, alt) => { const g = E.gradeNameF(t, {id: 'n', t: 'name', ans: a, alt}, []); return g.ok ? 'ok' : g.bad ? 'bad' : g.id; };
eq([Nm('Iron(III) oxide', 'iron(III) oxide'), Nm('iron oxide', 'iron(III) oxide'), Nm('iron(II) oxide', 'iron(III) oxide'), Nm('sodium(I) chloride', 'sodium chloride'), Nm('dinitrogen tetraoxide', 'dinitrogen tetroxide', ['dinitrogen tetraoxide'])],
  ['ok', 'missing_roman', 'wrong_roman', 'extra_roman', 'ok'], 'names');
const G = (t, a, ion) => { const g = E.gradeCfgF(t, {id: 'g', t: 'cfg', ans: a, ion}, []); return g.ok ? 'ok' : g.bad ? 'bad' : g.id; };
eq([G('1s2 2s2 2p6 3s2 3p4', '1s2 2s2 2p6 3s2 3p4'), G('[Ne] 3s2 3p4', '1s2 2s2 2p6 3s2 3p4'), G('1s2 2s2 2p6 3s2 3p6', '1s2 2s2 2p6 3s2 3p4'), G('1s2 2s2 2p8', '1s2 2s2 2p6 3s2'), G('[Ar] 4s2 4d6', '[Ar] 4s2 3d6'), G('[Ar] 3d6 4s2', '[Ar] 4s2 3d6'), G('1s2 2s2 2p6 3p2', '1s2 2s2 2p6 3s2'), G('hello', '1s2')],
  ['ok', 'ok', 'electron_count', 'sublevel_capacity', 'd_level', 'ok', 'fill_order', 'bad'], 'configs');
const B = (v, sp, nr) => { const g = E.gradeCoefF(v, {id: 'b', t: 'coef', sp, nr}, []); return g.ok ? 'ok' : g.bad ? 'bad' : g.id + (g.msg.match(/\(([A-Z][a-z]?)\)/) ? ':' + g.msg.match(/\(([A-Z][a-z]?)\)/)[1] : ''); };
eq([B(['2', '1', '2'], ['H2', 'O2', 'H2O'], 2), B(['4', '2', '4'], ['H2', 'O2', 'H2O'], 2), B(['1', '1', '1'], ['H2', 'O2', 'H2O'], 2), B(['', '5', '3', '4'], ['C3H8', 'O2', 'CO2', 'H2O'], 2), B(['', '', '', ''], ['C3H8', 'O2', 'CO2', 'H2O'], 2), B(['2', 'x', '1'], ['H2', 'O2', 'H2O'], 2), B(['3', '2', '1', '6'], ['Ca(OH)2', 'H3PO4', 'Ca3(PO4)2', 'H2O'], 2)],
  ['ok', 'not_lowest', 'unbalanced:O', 'ok', 'bad', 'bad', 'ok'], 'coefs');
console.log(E.ceHTML('2H2 + O2 -> 2H2O'));
console.log(E.ceHTML('Ca3(PO4)2'), E.ceHTML('SO4^2-'), E.ceHTML('CuSO4·5H2O'), E.ceHTML('^{238}_{92}U -> ^{4}_{2}He + ^{234}_{90}Th'), E.ceHTML('NaCl(aq)'));
console.log(E.ceSay('2H2 + O2 -> 2H2O'), '|', E.ceSay('SO4^2-'), '|', E.ceSay('^{238}_{92}U'), '|', E.massList(['Ca(NO3)2', 'H2O']));
console.log('engine checks:', n, 'failures:', bad);
