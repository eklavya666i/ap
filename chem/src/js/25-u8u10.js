// ---------- Templates, unit 8 (solutions), unit 9 (acids and bases) and unit 10 (energy and nuclear)

// ===== Unit 8 · Solubility and solution types
const SOLC = {KNO3: {20: 32, 40: 64, 60: 110}, NaNO3: {20: 88, 40: 104, 60: 124}, KCl: {20: 34, 40: 40, 60: 45}, NH4Cl: {20: 37, 40: 46, 60: 55}, KClO3: {20: 7, 40: 14, 60: 24}, NaCl: {20: 36, 40: 37, 60: 37}};
tpl({id: 'su-sat', s: 'solub', d: 1, name: 'Saturated or not', make(R) {
  const f = R.pick(Object.keys(SOLC)), T = R.pick([20, 40, 60]), S = SOLC[f][T], k = R.i(0, 2), amt = k === 0 ? Math.max(1, Math.round(S * R.r(0.4, 0.85, 2))) : k === 1 ? S : Math.round(S * R.r(1.15, 1.4, 2));
  const nm = ['Unsaturated', 'Saturated', 'Supersaturated'], why = ['It holds less than the ' + S + ' g that could dissolve, so more solute would still dissolve.', 'It holds exactly the maximum, ' + S + ' g, at this temperature.', 'It holds more than the ' + S + ' g that should dissolve: an unstable solution that crystallizes if disturbed.'];
  return MCI('At ' + T + ' °C, the solubility of $' + ce(f) + '$ is ' + S + ' g per 100 g of water. A clear solution at ' + T + ' °C contains ' + amt + ' g of $' + ce(f) + '$ dissolved in 100 g of water, with no crystals. How would you describe it?', nm[k], [0, 1, 2].filter(x => x !== k).map(x => [nm[x], why[k], 'saturation', 'concept']),
    ['Compare the amount dissolved with the solubility (the maximum at that temperature).', 'Less: unsaturated. Equal: saturated. More, still clear: supersaturated.'], [['', 'Dissolved: ' + amt + ' g; maximum: ' + S + ' g.'], ['', why[k]]]);
}});
const POLARS = [['table salt, \\ce{NaCl}', 'ionic'], ['sugar', 'polar'], ['ethanol', 'polar'], ['\\ce{KNO3}', 'ionic'], ['ammonia, \\ce{NH3}', 'polar'], ['vinegar (acetic acid)', 'polar']];
const NONPOLARS = [['cooking oil', 'nonpolar'], ['hexane, \\ce{C6H14}', 'nonpolar'], ['iodine, \\ce{I2}', 'nonpolar'], ['candle wax', 'nonpolar'], ['gasoline', 'nonpolar'], ['carbon tetrachloride, \\ce{CCl4}', 'nonpolar']];
tpl({id: 'su-like', s: 'solub', d: 1, name: 'Like dissolves like', make(R) {
  const water = R.f() < 0.6, right = R.pick(water ? POLARS : NONPOLARS), wrong = R.some(water ? NONPOLARS : POLARS, 3), cap = t => t[0].toUpperCase() + t.slice(1);
  return MCI('Which substance dissolves best in ' + (water ? 'water (polar)' : 'hexane (nonpolar)') + '?', cap(right[0]), wrong.map(w => [cap(w[0]), cap(w[0]) + ' is ' + w[1] + '. "Like dissolves like": ' + (water ? 'water dissolves polar and ionic substances.' : 'a nonpolar solvent dissolves nonpolar substances.'), 'like_dissolves_like', 'concept']),
    ['"Like dissolves like."', water ? 'Water is polar, so look for a polar or ionic solute.' : 'Hexane is nonpolar, so look for a nonpolar solute.'], [['', cap(right[0]) + ' is ' + right[1] + '.'], ['', 'It matches the solvent, so it dissolves.']]);
}});
const SFACT = [['Which change makes MORE carbon dioxide gas dissolve in water?', 'Cooling the water and raising the gas pressure', [['Heating the water', 'Gases are LESS soluble in warm water (warm soda goes flat).'], ['Stirring faster', 'Stirring speeds up dissolving but doesn\'t change how much can dissolve.'], ['Lowering the gas pressure', 'Lower pressure lets gas escape (opening a soda bottle).']]],
  ['Which change speeds up how fast sugar dissolves, without changing how much can dissolve?', 'Stirring or crushing the sugar', [['Raising the temperature', 'That changes how much can dissolve as well.'], ['Adding more sugar', 'That changes how much is in the solution, not the rate.'], ['Using less water', 'That changes the amount that can dissolve.']]],
  ['For most solids dissolving in water, raising the temperature…', 'Increases solubility', [['Decreases solubility', 'That is true for GASES, not most solids.'], ['Has no effect on solubility', 'Most solids become much more soluble when heated.'], ['Turns the solution saturated', 'Heating raises the maximum, so the solution becomes LESS saturated.']]],
  ['A soda fizzes when you open it because…', 'The pressure drops, so less CO₂ can stay dissolved', [['The temperature rises', 'The fizz happens instantly, from the pressure change.'], ['Sugar reacts with air', 'No reaction: dissolved CO₂ is simply escaping.'], ['Water evaporates', 'The bubbles are carbon dioxide leaving solution.']]],
  ['In salt water, which is the solvent?', 'Water', [['Salt', 'The solute is the substance dissolved; salt is the solute.'], ['Both', 'The solvent is the part present in the larger amount, doing the dissolving.'], ['Neither', 'Water does the dissolving, so it is the solvent.']]],
  ['Why does salt dissolve in water but not in oil?', 'Polar water molecules attract the ions; nonpolar oil can\'t', [['Salt is nonpolar', 'Salt is ionic.'], ['Oil is denser than water', 'Density doesn\'t decide solubility; polarity does.'], ['Water is a nonpolar solvent', 'Water is polar.']]]];
tpl({id: 'su-factor', s: 'solub', d: 1, name: 'What affects solubility', make(R) { const [q, a, w] = R.pick(SFACT); return MCI(q, a, w.map(x => [x[0], x[1], 'solubility_factors', 'concept']), ['Separate how FAST something dissolves from how MUCH can dissolve.', 'Gases: more soluble cold and under pressure. Most solids: more soluble hot.'], [['', a + '.']]); }});
tpl({id: 'su-curve', s: 'solub', d: 2, name: 'Crystals from cooling', make(R) {
  const f = R.pick(['KNO3', 'NH4Cl', 'KClO3', 'NaNO3', 'KCl']), [T1, T2] = R.pick([[60, 20], [60, 40], [40, 20]]), S1 = SOLC[f][T1], S2 = SOLC[f][T2], w = R.pick([50, 100, 200, 25]), out = (S1 - S2) * w / 100;
  return one('The solubility of $' + ce(f) + '$ is ' + S1 + ' g per 100 g of water at ' + T1 + ' °C and ' + S2 + ' g per 100 g at ' + T2 + ' °C. A saturated solution made with ' + w + ' g of water at ' + T1 + ' °C is cooled to ' + T2 + ' °C. What mass of $' + ce(f) + '$ crystallizes?', NUM('a', 'Mass that crystallizes', out, {unit: 'g', tol: 0.005}),
    w !== 100 ? [TR('a', S1 - S2, 'Those solubilities are per 100 g of water. This solution has ' + w + ' g of water: scale by ' + w + '/100.', 'per_100g_ignored'), TR('a', S2 * w / 100, 'That is how much stays dissolved. Subtract it from what was dissolved at ' + T1 + ' °C.', 'remaining_not_crystals')] : [TR('a', S2, 'That is how much stays dissolved. The rest crystallizes: ' + S1 + ' − ' + S2 + '.', 'remaining_not_crystals'), TR('a', S1, 'Some of it stays dissolved at ' + T2 + ' °C.', 'remaining_not_crystals')],
    ['Dissolved at ' + T1 + ' °C minus what can stay dissolved at ' + T2 + ' °C.', 'Scale both for ' + w + ' g of water.'],
    [['', 'At ' + T1 + ' °C: ' + S1 + ' × ' + w + '/100 = ' + niceN(S1 * w / 100) + ' g dissolved.'], ['', 'At ' + T2 + ' °C only ' + niceN(S2 * w / 100) + ' g can stay dissolved.'], [niceN(S1 * w / 100) + '-' + niceN(S2 * w / 100) + '=' + niceN(out) + TX(' g'), 'That much crystallizes.']]);
}});

// ===== Unit 8 · Molarity
const SOLUTES = ['NaCl', 'KCl', 'NaOH', 'KNO3', 'CaCl2', 'C6H12O6', 'Na2SO4', 'MgSO4', 'KBr', 'NH4Cl', 'AgNO3', 'CuSO4'];
const MFRAME = {q: 'Which relationship do you need?', opts: ['M=' + F('\\text{mol solute}', '\\text{L solution}'), 'M_1V_1=M_2V_2', F('\\text{mass}', '\\text{volume}')]};
tpl({id: 'mz-calc', s: 'molarity', d: 1, name: 'Molarity from grams', wk: true, make(R) {
  const f = R.pick(SOLUTES), M = molarMass(f), g = gv(R, 2, 60), mL = R.pick([100, 125, 150, 200, 250, 300, 400, 500, 750]), n = g.v / M, c = n / (mL / 1000);
  return Object.assign(one('$' + g.s + '$ g of $' + ce(f) + '$ is dissolved to make $' + mL + '$ mL of solution. What is the molarity?' + withMasses(f), NUM('a', 'Molarity', c, {sf: 3, unit: 'M'}),
    [TR('a', n / mL, 'Molarity uses LITERS: ' + mL + ' mL = ' + mL / 1000 + ' L.', 'molarity_mL'), TR('a', g.v / (mL / 1000), 'Molarity uses MOLES of solute: divide the grams by the molar mass first.', 'grams_as_moles', 'concept')],
    ['$M=' + F('\\text{mol solute}', '\\text{L solution}') + '$', 'Convert grams to moles and mL to L.'],
    [[F(g.s, m2(M)) + '=' + nT(n, 3) + TX(' mol'), 'Moles of solute.'], [mL + TX(' mL') + '=' + mL / 1000 + TX(' L'), ''], ['M=' + F(nT(n, 3), String(mL / 1000)) + '=' + nT(c, 3) + TX(' M'), '']]), {frame: MFRAME});
}});
tpl({id: 'mz-mass', s: 'molarity', d: 2, name: 'Grams for a solution', make(R) {
  const f = R.pick(SOLUTES), M = molarMass(f), c = gv(R, 0.1, 2.5), mL = R.pick([100, 250, 500, 1000, 200, 750]), g = c.v * mL / 1000 * M;
  return one('What mass of $' + ce(f) + '$ is needed to make $' + mL + '$ mL of a $' + c.s + '$ M solution?' + withMasses(f), NUM('a', 'Mass', g, {sf: 3, unit: 'g'}),
    [TR('a', c.v * mL * M, 'Change mL to liters first.', 'molarity_mL'), TR('a', c.v * mL / 1000 / M, 'Multiply moles by the molar mass to get grams.', 'mole_inverted')],
    ['Moles needed = M × liters.', 'Then grams = moles × molar mass.'],
    [[c.s + '\\times' + mL / 1000 + '=' + nT(c.v * mL / 1000, 3) + TX(' mol'), 'Moles of solute.'], [nT(c.v * mL / 1000, 3) + '\\times' + m2(M) + '=' + nT(g, 3) + TX(' g'), 'Grams.']]);
}});
tpl({id: 'mz-vol', s: 'molarity', d: 2, name: 'Volume of solution', make(R) {
  const f = R.pick(SOLUTES), M = molarMass(f), c = gv(R, 0.1, 2.5), g = gv(R, 2, 40), n = g.v / M, mL = n / c.v * 1000;
  return one('What volume of $' + c.s + '$ M $' + ce(f) + '$ contains $' + g.s + '$ g of $' + ce(f) + '$? Give the answer in mL.' + withMasses(f), NUM('a', 'Volume', mL, {sf: 3, unit: 'mL'}),
    [TR('a', c.v / n * 1000, 'Volume = moles ÷ molarity, not molarity ÷ moles.', 'molarity_inverted'), TR('a', g.v / c.v * 1000, 'Convert grams to moles before dividing by the molarity.', 'grams_as_moles', 'concept')],
    ['Moles first, then $V=' + F('n', 'M') + '$ in liters.', 'Convert liters to mL at the end.'],
    [[F(g.s, m2(M)) + '=' + nT(n, 3) + TX(' mol'), 'Moles.'], ['V=' + F(nT(n, 3), c.s) + '=' + nT(n / c.v, 3) + TX(' L') + '=' + nT(mL, 3) + TX(' mL'), '']]);
}});
const IONSOL = [['NaCl', 'Cl^-', 1, 2], ['CaCl2', 'Cl^-', 2, 3], ['Na2SO4', 'Na^+', 2, 3], ['AlCl3', 'Cl^-', 3, 4], ['K3PO4', 'K^+', 3, 4], ['MgCl2', 'Cl^-', 2, 3], ['Fe(NO3)3', 'NO3^-', 3, 4], ['Na3PO4', 'Na^+', 3, 4], ['CaCl2', 'Ca^2+', 1, 3], ['Al2(SO4)3', 'SO4^2-', 3, 5]];
tpl({id: 'mz-ions', s: 'molarity', d: 3, name: 'Ion concentrations', make(R) {
  const [f, ion, k, tot] = R.pick(IONSOL), c = gv(R, 0.1, 1.5), ans = c.v * k, traps = [];
  if (k > 1) traps.push(TR('a', c.v, 'Each ' + ce(f) + ' releases ' + k + ' ' + ce(ion) + ' ions: multiply by ' + k + '.', 'ion_subscript'));
  if (tot !== k) traps.push(TR('a', c.v * tot, 'That counts ALL the ions. The question asks only for ' + ce(ion) + '.', 'all_ions'));
  return one('What is the concentration of $' + ce(ion) + '$ ions in a $' + c.s + '$ M $' + ce(f) + '$ solution?', NUM('a', '[' + ion.replace(/\^.*/, '') + ']', ans, {sf: 3, unit: 'M'}), traps,
    ['Write how the compound breaks into ions when it dissolves.', 'Count how many ' + ce(ion) + ' ions come from one formula unit.'],
    [['', ce(f) + ' gives ' + k + ' ' + ce(ion) + ' per formula unit.'], [c.s + '\\times' + k + '=' + nT(ans, 3) + TX(' M'), '']]);
}});

// ===== Unit 8 · Dilution
const DFRAME = {q: 'Which relationship do you need?', opts: ['M_1V_1=M_2V_2', 'M=' + F('\\text{mol}', '\\text{L}'), 'PV=nRT']};
tpl({id: 'dl-dil', s: 'dilute', d: 1, name: 'Dilution', wk: true, make(R) {
  const k = R.i(0, 2), sol = R.pick(['HCl', 'NaOH', 'H2SO4', 'NaCl', 'HNO3', 'KOH']), M1 = gv(R, 2.0, 12), V2 = R.pick([100, 250, 500, 1000, 200]), M2 = +(M1.v * R.r(0.08, 0.6, 2)).toPrecision(3), V1 = M2 * V2 / M1.v;
  if (k === 0) return Object.assign(one('How many mL of $' + M1.s + '$ M $' + ce(sol) + '$ are needed to make $' + V2 + '$ mL of $' + nT(M2, 3) + '$ M $' + ce(sol) + '$?', NUM('a', 'Volume of stock', V1, {sf: 3, unit: 'mL'}),
    [TR('a', M1.v * V2 / M2, 'Upside down: the concentrated stock needs a SMALLER volume. V₁ = M₂V₂/M₁.', 'dilution_inverted')], ['$M_1V_1=M_2V_2$', '$V_1=' + F('M_2V_2', 'M_1') + '$'],
    [['V_1=' + F('(' + nT(M2, 3) + ')(' + V2 + ')', M1.s) + '=' + nT(V1, 3) + TX(' mL'), 'Moles of solute stay the same; only water is added.']]), {frame: DFRAME});
  if (k === 1) { const V1b = gv(R, 10, 95), V2b = R.pick([250, 500, 1000]), M2b = M1.v * V1b.v / V2b;
    return Object.assign(one('$' + V1b.s + '$ mL of $' + M1.s + '$ M $' + ce(sol) + '$ is diluted with water to $' + V2b + '$ mL. What is the new concentration?', NUM('a', 'New molarity', M2b, {sf: 3, unit: 'M'}),
      [TR('a', M1.v * V2b / V1b.v, 'Diluting makes the solution WEAKER: M₂ = M₁V₁/V₂.', 'dilution_inverted')], ['$M_1V_1=M_2V_2$', '$M_2=' + F('M_1V_1', 'V_2') + '$'], [['M_2=' + F('(' + M1.s + ')(' + V1b.s + ')', V2b) + '=' + nT(M2b, 3) + TX(' M'), '']]), {frame: DFRAME}); }
  const V1c = gv(R, 10, 95), V2c = M1.v * V1c.v / M2;
  return Object.assign(one('To what final volume (in mL) must $' + V1c.s + '$ mL of $' + M1.s + '$ M $' + ce(sol) + '$ be diluted to make it $' + nT(M2, 3) + '$ M?', NUM('a', 'Final volume', V2c, {sf: 3, unit: 'mL'}),
    [TR('a', M2 * V1c.v / M1.v, 'A weaker solution needs a BIGGER volume: V₂ = M₁V₁/M₂.', 'dilution_inverted'), TR('a', V2c - V1c.v, 'That is the water you ADD. The question asks for the final total volume.', 'water_vs_total')],
    ['$M_1V_1=M_2V_2$', '$V_2=' + F('M_1V_1', 'M_2') + '$'], [['V_2=' + F('(' + M1.s + ')(' + V1c.s + ')', nT(M2, 3)) + '=' + nT(V2c, 3) + TX(' mL'), '']]), {frame: DFRAME});
}});
tpl({id: 'dl-water', s: 'dilute', d: 3, name: 'How much water to add', make(R) {
  const M1 = gv(R, 2.0, 12), V1 = gv(R, 10, 95), M2 = +(M1.v * R.r(0.1, 0.5, 2)).toPrecision(3), V2 = M1.v * V1.v / M2, add = V2 - V1.v;
  return one('You have $' + V1.s + '$ mL of $' + M1.s + '$ M HCl. How much water must you ADD to make the solution $' + nT(M2, 3) + '$ M?', NUM('a', 'Water to add', add, {sf: 3, unit: 'mL'}),
    [TR('a', V2, 'That is the FINAL volume. Subtract the ' + V1.s + ' mL you started with.', 'water_vs_total'), TR('a', M2 * V1.v / M1.v, 'Upside down: V₂ = M₁V₁/M₂.', 'dilution_inverted')],
    ['Find the final volume with $M_1V_1=M_2V_2$.', 'Water added = final volume − starting volume.'],
    [['V_2=' + F('(' + M1.s + ')(' + V1.s + ')', nT(M2, 3)) + '=' + nT(V2, 3) + TX(' mL'), 'Final volume.'], [nT(V2, 3) + '-' + V1.s + '=' + nT(add, 3) + TX(' mL'), 'Water to add.']]);
}});

// ===== Unit 8 · Concentration units and colligative properties
const VANT = [['C12H22O11', 1, 'sucrose'], ['C6H12O6', 1, 'glucose'], ['NaCl', 2, 'sodium chloride'], ['KBr', 2, 'potassium bromide'], ['CaCl2', 3, 'calcium chloride'], ['MgCl2', 3, 'magnesium chloride'], ['KCl', 2, 'potassium chloride']];
tpl({id: 'cg-pct', s: 'collig', d: 1, name: 'Percent by mass', make(R) {
  const f = R.pick(['NaCl', 'sugar', 'KNO3', 'NaOH']), s = gv(R, 5, 45), w = gv(R, 50, 250), pct = s.v / (s.v + w.v) * 100;
  return one('A solution is made by dissolving $' + s.s + '$ g of ' + (f === 'sugar' ? 'sugar' : '$' + ce(f) + '$') + ' in $' + w.s + '$ g of water. What is the percent by mass of the solute?', NUM('a', 'Percent by mass', pct, {sf: 3, unit: '%'}),
    [TR('a', s.v / w.v * 100, 'Divide by the mass of the whole SOLUTION (solute + water), not just the water.', 'solvent_not_solution', 'concept'), TR('a', s.v / (s.v + w.v), 'Multiply by 100 to make it a percent.', 'no_percent')],
    ['$\\%=' + F('\\text{mass solute}', '\\text{mass solution}') + '\\times100$', 'Mass of solution = ' + s.s + ' + ' + w.s + ' g.'],
    [[s.s + '+' + w.s + '=' + nT(s.v + w.v, 4) + TX(' g'), 'Mass of solution.'], [F(s.s, nT(s.v + w.v, 4)) + '\\times100=' + nT(pct, 3) + '\\%', '']]);
}});
tpl({id: 'cg-molal', s: 'collig', d: 2, name: 'Molality', make(R) {
  const [f] = R.pick(VANT), M = molarMass(f), g = gv(R, 5, 95), kg = R.pick([0.250, 0.500, 1.00, 0.750, 0.200]), m = g.v / M / kg;
  return one('$' + g.s + '$ g of $' + ce(f) + '$ is dissolved in $' + (kg * 1000) + '$ g of water. What is the molality?' + withMasses(f), NUM('a', 'Molality', m, {sf: 3, unit: 'm'}),
    [TR('a', g.v / M / (kg * 1000), 'Molality uses KILOGRAMS of solvent: ' + kg * 1000 + ' g = ' + kg + ' kg.', 'molality_grams'), TR('a', g.v / kg, 'Convert the solute to moles first.', 'grams_as_moles', 'concept')],
    ['$m=' + F('\\text{mol solute}', '\\text{kg solvent}') + '$', 'Moles of solute, kilograms of water.'],
    [[F(g.s, m2(M)) + '=' + nT(g.v / M, 3) + TX(' mol'), 'Moles.'], ['m=' + F(nT(g.v / M, 3), String(kg)) + '=' + nT(m, 3) + TX(' m'), '']]);
}});
tpl({id: 'cg-fp', s: 'collig', d: 2, name: 'Freezing and boiling points', make(R) {
  const [f, i, nm] = R.pick(VANT), M = molarMass(f), g = gv(R, 10, 120), kg = R.pick([0.500, 1.00, 0.250]), m = g.v / M / kg, fp = R.f() < 0.6, K = fp ? 1.86 : 0.512, dT = i * K * m, ans = fp ? -dT : 100 + dT, traps = [];
  if (i > 1) traps.push(TR('a', fp ? -K * m : 100 + K * m, ce(f) + ' splits into ' + i + ' ions, so i = ' + i + ': multiply by it.', 'vant_hoff_missing', 'concept'));
  traps.push(TR('a', fp ? dT : 100 - dT, fp ? 'A solute LOWERS the freezing point: subtract ΔT from 0 °C.' : 'A solute RAISES the boiling point: add ΔT to 100 °C.', 'colligative_direction', 'concept'));
  traps.push(TR('a', dT, 'That is the CHANGE in temperature. Apply it to ' + (fp ? '0 °C' : '100 °C') + '.', 'change_not_point'));
  return one('$' + g.s + '$ g of $' + ce(f) + '$ (' + nm + ') is dissolved in $' + kg * 1000 + '$ g of water. What is the new ' + (fp ? 'freezing' : 'boiling') + ' point? ($K_' + (fp ? 'f' : 'b') + '=' + K + '$ °C/m; assume ' + (i > 1 ? 'it dissociates completely' : 'it does not dissociate') + '.)' + withMasses(f), NUM('a', (fp ? 'Freezing' : 'Boiling') + ' point', ans, {unit: '°C', abs: 0.03}), traps,
    ['$\\Delta T=i\\,K\\,m$. Find the molality first.', 'i = ' + i + ' (' + (i > 1 ? 'particles per formula unit' : 'molecules don\'t split') + ').'],
    [['m=' + F(nT(g.v / M, 3) + '\\text{ mol}', kg + '\\text{ kg}') + '=' + nT(m, 3) + TX(' m'), 'Molality.'], ['\\Delta T=(' + i + ')(' + K + ')(' + nT(m, 3) + ')=' + nT(dT, 3) + TX(' °C'), ''], [(fp ? '0-' : '100+') + nT(dT, 3) + '=' + (fp ? '-' : '') + nT(fp ? dT : 100 + dT, fp ? 3 : 5) + TX(' °C'), fp ? 'Freezing point goes down.' : 'Boiling point goes up.']]);
}});
tpl({id: 'cg-which', s: 'collig', d: 1, name: 'Most particles wins', make(R) {
  const pick = R.some(VANT, 4); if (new Set(pick.map(p => p[1])).size < 2) return TPL['cg-which'].make(R);
  const best = pick.slice().sort((a, b) => b[1] - a[1])[0]; if (pick.filter(p => p[1] === best[1]).length > 1) return TPL['cg-which'].make(R);
  const lower = R.f() < 0.5;
  return MCI('Each solution is 1.0 m in water. Which has the ' + (lower ? 'lowest freezing point' : 'highest boiling point') + '?', '1.0 m $' + ce(best[0]) + '$', pick.filter(p => p !== best).map(p => ['1.0 m $' + ce(p[0]) + '$', ce(p[0]) + ' gives ' + p[1] + ' particle' + (p[1] > 1 ? 's' : '') + ' per formula unit; ' + ce(best[0]) + ' gives ' + best[1] + '. Colligative effects depend on the NUMBER of particles.', 'particle_count', 'concept']),
    ['Colligative properties depend on how many dissolved particles there are, not what they are.', 'Count particles: ionic compounds split into ions (i = 2 or 3); sugars stay whole (i = 1).'], [['', ce(best[0]) + ' gives the most particles (i = ' + best[1] + ').'], ['', 'More particles: bigger change.']]);
}});

// ===== Unit 9 · Acids, bases and conjugate pairs
// [species, conjugate base, conjugate acid, wrong choices for the base question, wrong choices for the acid question]
const CONJ = [['HCl', 'Cl^-', null, ['H2Cl^+', 'Cl'], null], ['H2SO4', 'HSO4^-', null, ['SO4^2-', 'H3SO4^+'], null], ['HSO4^-', 'SO4^2-', 'H2SO4', ['SO4^-', 'H2SO4'], ['SO4^2-', 'H2SO4^-']], ['H2O', 'OH^-', 'H3O^+', ['H3O^+', 'O^2-'], ['OH^-', 'H2O^+']],
  ['NH4^+', 'NH3', null, ['NH5^2+', 'NH3^+'], null], ['NH3', 'NH2^-', 'NH4^+', ['NH4^+', 'NH2'], ['NH2^-', 'NH4']], ['H3O^+', 'H2O', null, ['H4O^2+', 'OH^-'], null], ['HCO3^-', 'CO3^2-', 'H2CO3', ['H2CO3', 'CO3^-'], ['CO3^2-', 'H2CO3^-']],
  ['H2CO3', 'HCO3^-', null, ['CO3^2-', 'H3CO3^+'], null], ['H3PO4', 'H2PO4^-', null, ['PO4^3-', 'H4PO4^+'], null], ['HF', 'F^-', null, ['H2F^+', 'F'], null], ['HNO3', 'NO3^-', null, ['H2NO3^+', 'NO3'], null], ['HC2H3O2', 'C2H3O2^-', null, ['H2C2H3O2^+', 'C2H3O2'], null],
  ['OH^-', 'O^2-', 'H2O', ['H2O', 'O^-'], ['O^2-', 'H2O^-']], ['CO3^2-', null, 'HCO3^-', null, ['CO3^-', 'H2CO3^2-']], ['F^-', null, 'HF', null, ['F^2-', 'HF^-']], ['CN^-', null, 'HCN', null, ['CN^2-', 'HCN^-']], ['SO4^2-', null, 'HSO4^-', null, ['SO4^3-', 'H2SO4']]];
tpl({id: 'ab-conj', s: 'acidbase', d: 1, name: 'Conjugate acids and bases', make(R) {
  const row = R.pick(CONJ), wantBase = row[1] && (!row[2] || R.f() < 0.5), ans = wantBase ? row[1] : row[2], wr = wantBase ? row[3] : row[4];
  const why = wantBase ? 'A conjugate base is the acid with ONE H⁺ removed: one fewer H, and the charge drops by 1.' : 'A conjugate acid is the base with ONE H⁺ added: one more H, and the charge rises by 1.';
  return MCI('What is the conjugate ' + (wantBase ? 'base' : 'acid') + ' of $' + ce(row[0]) + '$?', '$' + ce(ans) + '$', wr.map(w => ['$' + ce(w) + '$', why, 'conjugate_pair', 'concept']).concat([['$' + ce(wantBase ? (row[2] || 'H' + row[0]) : (row[1] || row[0])) + '$', wantBase ? 'That ADDS H⁺; a conjugate base has one H⁺ fewer.' : 'That REMOVES H⁺; a conjugate acid has one H⁺ more.', 'conjugate_direction', 'concept']]).filter((x, k, arr) => arr.findIndex(y => y[0] === x[0]) === k && x[0] !== '$' + ce(ans) + '$').slice(0, 3),
    ['Conjugate pairs differ by exactly one H⁺.', wantBase ? 'Remove one H and subtract 1 from the charge.' : 'Add one H and add 1 to the charge.'], [['', why], ['', ce(row[0]) + (wantBase ? ' − H⁺ → ' : ' + H⁺ → ') + ce(ans) + '.']]);
}});
const BLRX = [['HCl + H2O -> H3O^+ + Cl^-', 'HCl', 'H2O', 'H3O^+', 'Cl^-'], ['NH3 + H2O -> NH4^+ + OH^-', 'H2O', 'NH3', 'NH4^+', 'OH^-'], ['HF + NH3 -> NH4^+ + F^-', 'HF', 'NH3', 'NH4^+', 'F^-'], ['HC2H3O2 + H2O -> H3O^+ + C2H3O2^-', 'HC2H3O2', 'H2O', 'H3O^+', 'C2H3O2^-'],
  ['CO3^2- + H2O -> HCO3^- + OH^-', 'H2O', 'CO3^2-', 'HCO3^-', 'OH^-'], ['HNO3 + OH^- -> H2O + NO3^-', 'HNO3', 'OH^-', 'H2O', 'NO3^-'], ['H2SO4 + H2O -> H3O^+ + HSO4^-', 'H2SO4', 'H2O', 'H3O^+', 'HSO4^-'], ['HCN + H2O -> H3O^+ + CN^-', 'HCN', 'H2O', 'H3O^+', 'CN^-']];
tpl({id: 'ab-role', s: 'acidbase', d: 2, name: 'Brønsted–Lowry roles', make(R) {
  const [eq, ac, ba, ca, cb] = R.pick(BLRX), k = R.i(0, 3), roles = ['acid', 'base', 'conjugate acid', 'conjugate base'], sp = [ac, ba, ca, cb], defs = ['donates H⁺', 'accepts H⁺', 'forms when the base gains H⁺', 'is what is left after the acid loses H⁺'];
  return MCI('In $' + ce(eq) + '$, which species is the Brønsted–Lowry ' + roles[k] + '?', '$' + ce(sp[k]) + '$', sp.map((x, j) => [x, j]).filter(([x, j]) => j !== k && x !== sp[k]).map(([x, j]) => ['$' + ce(x) + '$', ce(x) + ' is the ' + roles[j] + ': it ' + defs[j] + '. The ' + roles[k] + ' ' + defs[k] + '.', 'bl_roles', 'concept']),
    ['Find the H⁺ that moves from one reactant to the other.', 'The acid donates H⁺, the base accepts it. Each becomes its conjugate on the product side.'], [['', ce(ac) + ' gives H⁺ to ' + ce(ba) + '.'], ['', 'The ' + roles[k] + ' is ' + ce(sp[k]) + '.']]);
}});
const ACIDB = {sa: ['HCl', 'HBr', 'HI', 'HNO3', 'H2SO4', 'HClO4'], wa: ['HF', 'HC2H3O2', 'H2CO3', 'H3PO4', 'HCN', 'HNO2'], sb: ['NaOH', 'KOH', 'LiOH', 'Ca(OH)2', 'Ba(OH)2'], wb: ['NH3']};
const ABN = {sa: 'Strong acid', wa: 'Weak acid', sb: 'Strong base', wb: 'Weak base'}, ABW = {sa: 'Strong acids ionize completely in water; the six common ones are HCl, HBr, HI, HNO₃, H₂SO₄ and HClO₄.', wa: 'Weak acids only partly ionize; any acid outside the six strong ones is weak.', sb: 'Group 1 and heavy group 2 hydroxides dissociate completely: strong bases.', wb: 'Ammonia only partly reacts with water to make OH⁻: a weak base.'};
tpl({id: 'ab-strong', s: 'acidbase', d: 1, name: 'Strong or weak', make(R) {
  const k = R.pick(['sa', 'sa', 'wa', 'wa', 'sb', 'wb']), f = R.pick(ACIDB[k]);
  return MCI('How is $' + ce(f) + '$ classified?', ABN[k], Object.keys(ABN).filter(x => x !== k).map(x => [ABN[x], ABW[k], 'acid_strength', 'concept']),
    ['Strong acids and bases break apart completely in water; weak ones only partly.', 'Memorize the six strong acids; group 1 hydroxides are strong bases.'], [['', ABW[k]]]);
}});
const ABPROP = [['Which property belongs to acids?', 'They turn blue litmus red', [['They feel slippery', 'Slippery feel is a property of bases.'], ['They turn red litmus blue', 'Bases turn red litmus blue.'], ['They taste bitter', 'Bases taste bitter; acids taste sour.']]],
  ['An Arrhenius base is a substance that…', 'Produces OH⁻ ions in water', [['Produces H⁺ ions in water', 'That is an Arrhenius acid.'], ['Donates H⁺ ions', 'That is a Brønsted–Lowry acid.'], ['Accepts electrons', 'That is the Lewis definition, not Arrhenius.']]],
  ['Water can act as an acid or a base. This makes water…', 'Amphoteric', [['Neutral only', 'Water is neutral, but the question is about its two possible roles.'], ['A strong acid', 'Water barely ionizes.'], ['A salt', 'A salt forms from an acid and a base.']]],
  ['Phenolphthalein turns pink in…', 'A basic solution', [['An acidic solution', 'Phenolphthalein is colorless in acid.'], ['Pure water', 'It is colorless at pH 7.'], ['Any solution with ions', 'It responds to pH, not to ions in general.']]],
  ['What forms when an acid reacts with an active metal like zinc?', 'Hydrogen gas and a salt', [['Water and carbon dioxide', 'That forms when an acid reacts with a carbonate.'], ['Oxygen gas', 'The metal releases hydrogen from the acid.'], ['Nothing', 'Active metals react with acids.']]]];
tpl({id: 'ab-props', s: 'acidbase', d: 1, name: 'Properties and definitions', make(R) { const [q, a, w] = R.pick(ABPROP); return MCI(q, a, w.map(x => [x[0], x[1], 'acid_base_props', 'concept']), ['Acids: sour, turn blue litmus red, make H⁺. Bases: bitter, slippery, turn red litmus blue, make OH⁻.', 'Brønsted–Lowry: acids donate H⁺, bases accept it.'], [['', a + '.']]); }});

// ===== Unit 9 · pH and pOH
const pH = h => -Math.log10(h);
const hval = R => { const m = R.r(1.1, 9.9, 1), e = R.i(2, 12); return {v: m * Math.pow(10, -e), t: m.toFixed(1) + '\\times10^{-' + e + '}'}; };
tpl({id: 'ph-from-h', s: 'ph', d: 1, name: 'pH from [H⁺]', make(R) {
  const H = R.f() < 0.25 ? (e => ({v: Math.pow(10, -e), t: '1\\times10^{-' + e + '}'}))(R.i(1, 13)) : hval(R), p = pH(H.v);
  return one('What is the pH of a solution with $[\\text{H}^+]=' + H.t + '$ M?', NUM('a', 'pH', p, {abs: 0.02}),
    [TR('a', -p, 'pH = −log[H⁺]: the minus sign makes it positive.', 'ph_sign', 'slip'), TR('a', 14 - p, 'That is the pOH. pH = −log[H⁺].', 'ph_poh_swap'), TR('a', -Math.log(H.v), 'Use log base 10, not the natural log (ln).', 'ph_ln')],
    ['$\\text{pH}=-\\log[\\text{H}^+]$', 'On a calculator: −log(' + niceN(+H.v.toPrecision(2)) + ').'], [['\\text{pH}=-\\log(' + H.t + ')=' + p.toFixed(2), p < 7 ? 'Below 7: acidic.' : p > 7 ? 'Above 7: basic.' : 'Neutral.']]);
}});
tpl({id: 'ph-to-h', s: 'ph', d: 2, name: '[H⁺] from pH', make(R) {
  const p = R.r(1.2, 12.8, 2), H = Math.pow(10, -p);
  return one('A solution has a pH of $' + p.toFixed(2) + '$. What is $[\\text{H}^+]$?', NUM('a', '[H⁺]', H, {sf: 2, unit: 'M', tol: 0.03}),
    [TR('a', Math.pow(10, p), 'Use a negative exponent: [H⁺] = 10^(−pH).', 'ph_sign', 'slip'), TR('a', Math.pow(10, -(14 - p)), 'That is [OH⁻]. [H⁺] = 10^(−pH).', 'ph_poh_swap')],
    ['$[\\text{H}^+]=10^{-\\text{pH}}$', 'Calculator: 10^(−' + p.toFixed(2) + ').'], [['[\\text{H}^+]=10^{-' + p.toFixed(2) + '}=' + nT(H, 2) + TX(' M'), '']]);
}});
tpl({id: 'ph-poh', s: 'ph', d: 1, name: 'pH and pOH', make(R) {
  if (R.f() < 0.5) { const po = R.r(1.5, 12.5, 2), p = 14 - po;
    return one('A solution has a pOH of $' + po.toFixed(2) + '$. What is its pH?', NUM('a', 'pH', p, {abs: 0.02}), [TR('a', po, 'pH and pOH add to 14: subtract from 14.', 'ph_poh_swap'), TR('a', 14 + po, 'pH + pOH = 14, so pH = 14 − pOH.', 'ph_poh_added')],
      ['$\\text{pH}+\\text{pOH}=14$', '$\\text{pH}=14-' + po.toFixed(2) + '$'], [['14-' + po.toFixed(2) + '=' + p.toFixed(2), '']]); }
  const O = hval(R), po = pH(O.v), p = 14 - po;
  return one('A solution has $[\\text{OH}^-]=' + O.t + '$ M. What is its pH?', NUM('a', 'pH', p, {abs: 0.02}), [TR('a', po, 'That is the pOH. pH = 14 − pOH.', 'ph_poh_swap'), TR('a', -p, 'Check the signs: pOH = −log[OH⁻], pH = 14 − pOH.', 'ph_sign', 'slip')],
    ['Find pOH = −log[OH⁻], then pH = 14 − pOH.', '$\\text{pOH}=-\\log(' + O.t + ')$'], [['\\text{pOH}=-\\log(' + O.t + ')=' + po.toFixed(2), ''], ['\\text{pH}=14-' + po.toFixed(2) + '=' + p.toFixed(2), '']]);
}});
const SAB = [['HCl', 'a', 1], ['HNO3', 'a', 1], ['HBr', 'a', 1], ['NaOH', 'b', 1], ['KOH', 'b', 1], ['Ca(OH)2', 'b', 2], ['Ba(OH)2', 'b', 2]];
tpl({id: 'ph-strong', s: 'ph', d: 2, name: 'pH of a strong acid or base', make(R) {
  const [f, t, k] = R.pick(SAB), c = (m => m * Math.pow(10, -R.i(1, 3)))(R.r(1.1, 9.9, 1)), ion = c * k, traps = [];
  const ans = t === 'a' ? pH(ion) : 14 - pH(ion);
  if (t === 'b') { traps.push(TR('a', pH(ion), 'That is the pOH. For a base, pH = 14 − pOH.', 'ph_poh_swap')); traps.push(TR('a', pH(c), 'A base gives OH⁻, not H⁺: find pOH first.', 'base_as_acid', 'concept')); if (k > 1) traps.push(TR('a', 14 - pH(c), ce(f) + ' releases 2 OH⁻ per formula unit: [OH⁻] = 2 × ' + niceN(+c.toPrecision(2)) + ' M.', 'ion_subscript')); }
  else traps.push(TR('a', 14 - pH(ion), 'An acid gives H⁺: pH = −log[H⁺] directly.', 'ph_poh_swap'));
  return one('What is the pH of $' + nT(c, 2) + '$ M $' + ce(f) + '$? (It dissociates completely.)', NUM('a', 'pH', ans, {abs: 0.02}), traps,
    [t === 'a' ? 'A strong acid gives [H⁺] equal to its concentration.' : 'A strong base gives [OH⁻] = ' + (k > 1 ? k + ' × ' : '') + 'its concentration.', t === 'a' ? 'pH = −log[H⁺].' : 'pOH = −log[OH⁻], then pH = 14 − pOH.'],
    t === 'a' ? [['[\\text{H}^+]=' + nT(c, 2) + TX(' M'), 'Complete dissociation.'], ['\\text{pH}=-\\log(' + nT(c, 2) + ')=' + ans.toFixed(2), '']]
      : [['[\\text{OH}^-]=' + (k > 1 ? k + '\\times' : '') + nT(c, 2) + '=' + nT(ion, 2) + TX(' M'), k > 1 ? 'Two OH⁻ per formula unit.' : 'Complete dissociation.'], ['\\text{pOH}=-\\log(' + nT(ion, 2) + ')=' + pH(ion).toFixed(2), ''], ['\\text{pH}=14-' + pH(ion).toFixed(2) + '=' + ans.toFixed(2), '']]);
}});
tpl({id: 'ph-class', s: 'ph', d: 1, name: 'Acidic, basic or neutral', make(R) {
  const k = R.i(0, 2), p = k === 0 ? R.r(0.5, 6.4, 1) : k === 1 ? 7.0 : R.r(7.6, 13.5, 1), byH = R.f() < 0.4 && k !== 1, nm = ['Acidic', 'Neutral', 'Basic'];
  const desc = byH ? '$[\\text{H}^+]=1\\times10^{-' + Math.round(p) + '}$ M' : 'a pH of $' + p.toFixed(1) + '$', pv = byH ? Math.round(p) : p, kk = pv < 7 ? 0 : pv > 7 ? 2 : 1;
  return MCI('A solution has ' + desc + '. Is it acidic, neutral or basic?', nm[kk], [0, 1, 2].filter(x => x !== kk).map(x => [nm[x], 'pH below 7 is acidic, 7 is neutral, above 7 is basic. This one is ' + niceN(pv) + '.', 'ph_scale', 'concept']),
    ['pH 7 is neutral (pure water).', byH ? 'pH = the exponent without its minus sign: ' + Math.round(p) + '.' : 'Below 7 acidic, above 7 basic.'], [['', 'pH = ' + niceN(pv) + '.'], ['', nm[kk] + '.']]);
}});

// ===== Unit 9 · Neutralization and titration
const TITR = [['HCl', 1, 'NaOH', 1], ['HNO3', 1, 'KOH', 1], ['H2SO4', 2, 'NaOH', 1], ['HCl', 1, 'Ca(OH)2', 2], ['H3PO4', 3, 'NaOH', 1], ['H2SO4', 2, 'KOH', 1], ['HCl', 1, 'Ba(OH)2', 2], ['HBr', 1, 'LiOH', 1]];
const TFRAME = (h, o) => ({q: 'How do moles of H⁺ and OH⁻ compare at the equivalence point?', opts: [(h > 1 ? h : '') + 'M_aV_a=' + (o > 1 ? o : '') + 'M_bV_b', 'M_aV_a=M_bV_b'.replace(/^/, h === o ? '2' : ''), 'M_aM_b=V_aV_b']});
tpl({id: 'ti-calc', s: 'titrate', d: 2, name: 'Titration', wk: true, make(R) {
  const [a, h, b, o] = R.pick(TITR), Va = gv(R, 10, 40), Mb = gv(R, 0.1, 0.9), Vb = gv(R, 10, 45), findA = R.f() < 0.6, traps = [];
  if (findA) { const Ma = o * Mb.v * Vb.v / (h * Va.v);
    if (h !== o) traps.push(TR('a', Mb.v * Vb.v / Va.v, 'Account for H⁺ and OH⁻ per formula: ' + ce(a) + ' gives ' + h + ' H⁺, ' + ce(b) + ' gives ' + o + ' OH⁻.', 'titration_ratio'));
    traps.push(TR('a', h * Va.v / (o * Mb.v * Vb.v), 'Solve for Mₐ: it is moles of acid ÷ volume of acid.', 'titration_inverted'));
    return Object.assign(one('$' + Va.s + '$ mL of $' + ce(a) + '$ is neutralized by $' + Vb.s + '$ mL of $' + Mb.s + '$ M $' + ce(b) + '$. What is the molarity of the $' + ce(a) + '$?', NUM('a', 'Acid molarity', Ma, {sf: 3, unit: 'M'}), traps,
      ['At the equivalence point, moles of H⁺ = moles of OH⁻.', ce(a) + ' gives ' + h + ' H⁺; ' + ce(b) + ' gives ' + o + ' OH⁻. So ' + (h > 1 ? h : '') + 'MₐVₐ = ' + (o > 1 ? o : '') + 'M_bV_b.'],
      [[(o > 1 ? o : '') + '(' + Mb.s + ')(' + Vb.s + ')=' + nT(o * Mb.v * Vb.v, 4) + TX(' mmol OH⁻'), 'Moles of OH⁻ added (mL × M = mmol).'], ['M_a=' + F(nT(o * Mb.v * Vb.v, 4), (h > 1 ? h + '\\times' : '') + Va.s) + '=' + nT(Ma, 3) + TX(' M'), 'Equal moles of H⁺.']]), {frame: TFRAME(h, o)}); }
  const Ma = gv(R, 0.1, 0.9), Vneed = h * Ma.v * Va.v / (o * Mb.v);
  if (h !== o) traps.push(TR('a', Ma.v * Va.v / Mb.v, 'Account for H⁺ and OH⁻ per formula: ' + ce(a) + ' gives ' + h + ' H⁺, ' + ce(b) + ' gives ' + o + ' OH⁻.', 'titration_ratio'));
  traps.push(TR('a', o * Mb.v / (h * Ma.v * Va.v), 'Volume of base = moles of base needed ÷ its molarity.', 'titration_inverted'));
  return Object.assign(one('What volume of $' + Mb.s + '$ M $' + ce(b) + '$ is needed to neutralize $' + Va.s + '$ mL of $' + Ma.s + '$ M $' + ce(a) + '$?', NUM('a', 'Volume of base', Vneed, {sf: 3, unit: 'mL'}), traps,
    ['Moles of H⁺ from the acid must equal moles of OH⁻ from the base.', ce(a) + ' gives ' + h + ' H⁺; ' + ce(b) + ' gives ' + o + ' OH⁻.'],
    [[(h > 1 ? h : '') + '(' + Ma.s + ')(' + Va.s + ')=' + nT(h * Ma.v * Va.v, 4) + TX(' mmol H⁺'), 'Moles of H⁺ to neutralize.'], ['V_b=' + F(nT(h * Ma.v * Va.v, 4), (o > 1 ? o + '\\times' : '') + Mb.s) + '=' + nT(Vneed, 3) + TX(' mL'), '']]), {frame: TFRAME(h, o)});
}});
const NEUT = [['HCl', 'NaOH'], ['HNO3', 'KOH'], ['HBr', 'LiOH'], ['HCl', 'KOH'], ['H2SO4', 'NaOH'], ['HCl', 'Ca(OH)2'], ['HNO3', 'NaOH'], ['H2SO4', 'KOH'], ['HI', 'NaOH']];
const ACIDAN = {HCl: ['Cl', -1], HNO3: ['NO3', -1], HBr: ['Br', -1], H2SO4: ['SO4', -2], HI: ['I', -1]}, BASECA = {NaOH: ['Na', 1], KOH: ['K', 1], LiOH: ['Li', 1], 'Ca(OH)2': ['Ca', 2]};
tpl({id: 'ti-salt', s: 'titrate', d: 1, name: 'Products of neutralization', make(R) {
  const [a, b] = R.pick(NEUT), [an, aq] = ACIDAN[a], [ca, cq] = BASECA[b], salt = ionFormula(ca, cq, an, aq), w1 = ca + an, w2 = salt;
  const wr = [['$' + ce(salt + ' + H2') + '$', 'Neutralization makes water: H⁺ + OH⁻ → H₂O, not hydrogen gas.', 'neutralization_products', 'concept'], ['$' + ce('H2O') + '$ only', 'The leftover ions form a salt as well as water.', 'neutralization_products', 'concept']];
  if (w1 !== salt) wr.push(['$' + ce(w1 + ' + H2O') + '$', 'Balance the salt\'s charges: ' + ce(ca + chgCe(cq)) + ' and ' + ce(an + chgCe(aq)) + ' make ' + ce(salt) + '.', 'charges_not_balanced', 'procedure']);
  else wr.push(['$' + ce(ca + 'H + ' + an + 'OH') + '$', 'H⁺ joins OH⁻ (making water) and the metal joins the anion (making the salt).', 'neutralization_products', 'concept']);
  return MCI('What are the products of $' + ce(a + ' + ' + b) + '$?', '$' + ce(salt + ' + H2O') + '$', wr,
    ['Acid + base → salt + water.', 'The salt pairs the base\'s metal ion with the acid\'s anion.'], [['', 'H⁺ + OH⁻ → H₂O.'], ['', ce(ca + chgCe(cq)) + ' + ' + ce(an + chgCe(aq)) + ' → ' + ce(salt) + '.']]);
}});

// ===== Unit 10 · Specific heat and calorimetry
const SPH = [['water', 4.18], ['aluminum', 0.897], ['copper', 0.385], ['iron', 0.449], ['lead', 0.129], ['silver', 0.235], ['gold', 0.129], ['glass', 0.840]];
const QFRAME = {q: 'Which equation fits?', opts: ['q=mc\\Delta T', 'q=m\\Delta H_{\\text{fus}}', 'PV=nRT']};
tpl({id: 'he-q', s: 'heat', d: 1, name: 'q = mcΔT', wk: true, make(R) {
  const [nm, c] = R.pick(SPH), m = gv(R, 10, 450), T1 = R.i(10, 30), T2 = T1 + R.i(10, 70), dT = T2 - T1, q = m.v * c * dT;
  return Object.assign(one('How much heat (in joules) is needed to raise the temperature of $' + m.s + '$ g of ' + nm + ' from $' + T1 + '$ °C to $' + T2 + '$ °C? ($c=' + c + '$ J/(g·°C))', NUM('a', 'Heat', q, {sf: 3, unit: 'J'}),
    [TR('a', m.v * c * T2, 'Use the CHANGE in temperature: ΔT = ' + T2 + ' − ' + T1 + ' = ' + dT + ' °C.', 'used_final_temp'), TR('a', c * dT, 'Multiply by the mass too: q = mcΔT.', 'mass_missing')],
    ['$q=mc\\Delta T$', '$\\Delta T=' + T2 + '-' + T1 + '=' + dT + '$ °C'], [['q=(' + m.s + ')(' + c + ')(' + dT + ')', ''], ['=' + nT(q, 3) + TX(' J'), '= ' + nT(q / 1000, 3) + ' kJ']]), {frame: QFRAME});
}});
tpl({id: 'he-solve', s: 'heat', d: 2, name: 'Solve for c, m or ΔT', make(R) {
  const [nm, c] = R.pick(SPH.slice(1)), m = gv(R, 10, 250), dT = R.i(8, 60), q = +(m.v * c * dT).toPrecision(3), k = R.i(0, 2);
  if (k === 0) return MCI('A $' + m.s + '$ g metal sample absorbs $' + nT(q, 3) + '$ J and warms by $' + dT + '$ °C. Which metal is it? (Al 0.897, Cu 0.385, Fe 0.449, Pb 0.129, Ag 0.235 J/(g·°C))', nm[0].toUpperCase() + nm.slice(1),
    SPH.slice(1, 6).filter(x => x[0] !== nm && Math.abs(x[1] - c) > 0.01).slice(0, 3).map(x => [x[0][0].toUpperCase() + x[0].slice(1), x[0][0].toUpperCase() + x[0].slice(1) + ' has c = ' + x[1] + ', but this sample\'s c is ' + nT(q / (m.v * dT), 3) + ' J/(g·°C).', 'specific_heat_match', 'procedure']),
    ['Solve $q=mc\\Delta T$ for c.', '$c=' + F('q', 'm\\Delta T') + '$'], [['c=' + F(nT(q, 3), '(' + m.s + ')(' + dT + ')') + '=' + nT(q / (m.v * dT), 3), ''], ['', 'That matches ' + nm + '.']]);
  if (k === 1) { const T1 = R.i(15, 30), Tf = T1 + q / (m.v * c);
    return one('$' + m.s + '$ g of ' + nm + ' at $' + T1 + '$ °C absorbs $' + nT(q, 3) + '$ J of heat. What is its final temperature? ($c=' + c + '$ J/(g·°C))', NUM('a', 'Final temperature', Tf, {unit: '°C', abs: 0.15}),
      [TR('a', q / (m.v * c), 'That is the temperature CHANGE. Add it to the starting ' + T1 + ' °C.', 'change_not_final'), TR('a', T1 - q / (m.v * c), 'Absorbing heat makes it warmer: add ΔT.', 'sign_direction')],
      ['$\\Delta T=' + F('q', 'mc') + '$', 'Final = start + ΔT.'], [['\\Delta T=' + F(nT(q, 3), '(' + m.s + ')(' + c + ')') + '=' + nT(q / (m.v * c), 3) + TX(' °C'), ''], [T1 + '+' + nT(q / (m.v * c), 3) + '=' + nT(Tf, 3) + TX(' °C'), '']]); }
  return one('How many grams of ' + nm + ' absorb $' + nT(q, 3) + '$ J when warmed by $' + dT + '$ °C? ($c=' + c + '$ J/(g·°C))', NUM('a', 'Mass', q / (c * dT), {sf: 3, unit: 'g'}),
    [TR('a', c * dT / q, 'Solve q = mcΔT for m: m = q ÷ (cΔT).', 'rearranged_wrong'), TR('a', q / c, 'Divide by ΔT as well.', 'rearranged_wrong')],
    ['$m=' + F('q', 'c\\Delta T') + '$', ''], [['m=' + F(nT(q, 3), '(' + c + ')(' + dT + ')') + '=' + nT(q / (c * dT), 3) + TX(' g'), '']]);
}});
tpl({id: 'he-cal', s: 'heat', d: 3, name: 'Calorimetry', make(R) {
  const [nm, c] = R.pick(SPH.slice(1, 6)), mm = gv(R, 20, 150), Tm = R.i(80, 100), mw = gv(R, 50, 250), Tw = R.i(18, 25);
  const Tf = (mm.v * c * Tm + mw.v * 4.18 * Tw) / (mm.v * c + mw.v * 4.18), Tfr = +Tf.toFixed(1), cfound = mw.v * 4.18 * (Tfr - Tw) / (mm.v * (Tm - Tfr));
  return one('A $' + mm.s + '$ g piece of metal at $' + Tm + '$ °C is dropped into $' + mw.s + '$ g of water at $' + Tw + '$ °C. The final temperature is $' + Tfr.toFixed(1) + '$ °C. What is the specific heat of the metal? ($c_{\\text{water}}=4.18$ J/(g·°C))', NUM('a', 'Specific heat', cfound, {sf: 3, unit: 'J/(g·°C)', tol: 0.02}),
    [TR('a', mw.v * 4.18 * (Tfr - Tw) / (mm.v * Tm), 'Use the metal\'s temperature CHANGE: ' + Tm + ' − ' + Tfr.toFixed(1) + '.', 'used_final_temp'), TR('a', mm.v * (Tm - Tfr) / (mw.v * 4.18 * (Tfr - Tw)), 'Heat lost by the metal = heat gained by the water; solve for c of the METAL.', 'rearranged_wrong')],
    ['Heat lost by the metal = heat gained by the water.', '$m_mc_m(T_m-T_f)=m_wc_w(T_f-T_w)$'],
    [['q_w=(' + mw.s + ')(4.18)(' + Tfr.toFixed(1) + '-' + Tw + ')=' + nT(mw.v * 4.18 * (Tfr - Tw), 3) + TX(' J'), 'Heat gained by the water.'], ['c_m=' + F(nT(mw.v * 4.18 * (Tfr - Tw), 3), '(' + mm.s + ')(' + Tm + '-' + Tfr.toFixed(1) + ')') + '=' + nT(cfound, 3), 'The metal lost that much heat.']]);
}});
const ENDO = [['ice melting', 'endo'], ['water evaporating', 'endo'], ['an instant cold pack', 'endo'], ['photosynthesis', 'endo'], ['cooking an egg', 'endo'], ['dry ice subliming', 'endo'], ['wood burning', 'exo'], ['water freezing', 'exo'], ['steam condensing', 'exo'], ['a hand warmer heating up', 'exo'], ['cellular respiration', 'exo'], ['fireworks exploding', 'exo']];
tpl({id: 'he-endo', s: 'heat', d: 1, name: 'Endothermic or exothermic', make(R) {
  const [p, k] = R.pick(ENDO);
  return MCI('Is ' + p + ' endothermic or exothermic?', k === 'endo' ? 'Endothermic' : 'Exothermic', [[k === 'endo' ? 'Exothermic' : 'Endothermic', k === 'endo' ? 'It ABSORBS heat from the surroundings (they feel colder): endothermic, ΔH > 0.' : 'It RELEASES heat to the surroundings (they feel warmer): exothermic, ΔH < 0.', 'endo_exo', 'concept']],
    ['Does the process take in heat or give it off?', 'Melting, boiling and subliming absorb heat; freezing, condensing and burning release it.'], [['', k === 'endo' ? 'It absorbs energy.' : 'It releases energy.'], ['', k === 'endo' ? 'Endothermic.' : 'Exothermic.']]);
}});

// ===== Unit 10 · Enthalpy and phase changes
const THERMO = [[['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2], -890], [['H2', 'O2'], ['H2O'], [2, 1, 2], -572], [['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4], -2220], [['N2', 'H2'], ['NH3'], [1, 3, 2], -92], [['CaCO3'], ['CaO', 'CO2'], [1, 1, 1], 178], [['Mg', 'O2'], ['MgO'], [2, 1, 2], -1204], [['C6H12O6', 'O2'], ['CO2', 'H2O'], [1, 6, 6, 6], -2803]];
tpl({id: 'en-thermo', s: 'enthalpy', d: 2, name: 'Thermochemical equations', make(R) {
  const E = R.pick(THERMO), sp = E[0].concat(E[1]), a = R.i(0, E[0].length - 1), M = molarMass(sp[a]), g = gv(R, 5, 95), q = Math.abs(E[3]) * (g.v / M) / E[2][a], word = E[3] < 0 ? 'released' : 'absorbed', traps = [];
  if (E[2][a] > 1) traps.push(TR('a', Math.abs(E[3]) * g.v / M, 'ΔH is for the equation as written: ' + E[2][a] + ' mol of ' + sp[a] + '. Divide by ' + E[2][a] + '.', 'thermo_coefficient'));
  traps.push(TR('a', Math.abs(E[3]) * g.v, 'Convert grams to moles first.', 'grams_as_moles', 'concept'));
  return one('$' + ce(eqBal(E)) + '$, $\\Delta H=' + E[3] + '$ kJ. How much heat is ' + word + ' when $' + g.s + '$ g of $' + ce(sp[a]) + '$ reacts?' + withMasses(sp[a]), NUM('a', 'Heat ' + word, q, {sf: 3, unit: 'kJ'}), traps,
    ['ΔH = ' + E[3] + ' kJ for ' + E[2][a] + ' mol of ' + ce(sp[a]) + ' (the coefficient).', 'Grams → moles → × (' + Math.abs(E[3]) + ' kJ / ' + E[2][a] + ' mol).'],
    [[F(g.s, m2(M)) + '=' + nT(g.v / M, 3) + TX(' mol'), 'Moles.'], [nT(g.v / M, 3) + '\\times' + F(Math.abs(E[3]) + '\\text{ kJ}', E[2][a] + '\\text{ mol}') + '=' + nT(q, 3) + TX(' kJ'), E[3] < 0 ? 'Negative ΔH: heat is released.' : 'Positive ΔH: heat is absorbed.']]);
}});
const PFRAME = {q: 'Which equation fits?', opts: ['q=m\\Delta H', 'q=mc\\Delta T', 'q=nRT']};
tpl({id: 'en-phase', s: 'enthalpy', d: 2, name: 'Heat of fusion and vaporization', wk: true, make(R) {
  const melt = R.f() < 0.5, m = gv(R, 10, 450), H = melt ? 334 : 2260, other = melt ? 2260 : 334, q = m.v * H;
  return Object.assign(one('How much heat (in joules) is needed to ' + (melt ? 'melt' : 'boil away') + ' $' + m.s + '$ g of ' + (melt ? 'ice at 0 °C' : 'water at 100 °C') + '? ($\\Delta H_{\\text{fus}}=334$ J/g, $\\Delta H_{\\text{vap}}=2260$ J/g)', NUM('a', 'Heat', q, {sf: 3, unit: 'J'}),
    [TR('a', m.v * other, melt ? 'Melting uses the heat of FUSION (334 J/g).' : 'Boiling uses the heat of VAPORIZATION (2260 J/g).', 'wrong_phase_constant'), TR('a', H / m.v, 'Multiply: q = m × ΔH.', 'rearranged_wrong')],
    ['During a phase change the temperature stays constant, so use $q=m\\Delta H$.', melt ? 'Melting: ΔH_fus.' : 'Boiling: ΔH_vap.'], [['q=(' + m.s + ')(' + H + ')=' + nT(q, 3) + TX(' J'), 'No temperature change during a phase change.']]), {frame: PFRAME});
}});
const CURVE = [['On a heating curve, what is happening during a flat (horizontal) section?', 'A phase change, with the temperature staying constant', [['The substance is cooling', 'Heat is being added the whole time on a heating curve.'], ['The temperature rises fastest', 'Flat means the temperature isn\'t changing.'], ['No energy is being absorbed', 'Energy is still absorbed; it goes into breaking attractions, not raising temperature.']]],
  ['During melting, the added energy…', 'Breaks attractions between particles', [['Raises the kinetic energy (temperature)', 'Temperature stays constant during melting.'], ['Is lost to the surroundings', 'It is absorbed by the substance.'], ['Breaks covalent bonds inside molecules', 'Melting separates molecules; the molecules themselves stay intact.']]],
  ['Why does the boiling plateau last longer than the melting plateau for water?', 'Vaporizing takes much more energy per gram than melting', [['Water boils at a higher temperature', 'The plateau\'s length depends on energy needed, not the temperature.'], ['Ice has a higher specific heat', 'Specific heat sets the slopes, not the plateaus.'], ['Boiling is exothermic', 'Boiling absorbs heat.']]],
  ['On a heating curve, a sloped section shows…', 'One phase warming up (temperature rising)', [['Two phases at a constant temperature', 'That is a flat section.'], ['A chemical reaction', 'Heating curves show physical changes.'], ['Energy being released', 'Heat is being added.']]]];
tpl({id: 'en-curve', s: 'enthalpy', d: 1, name: 'Heating curves', make(R) { const [q, a, w] = R.pick(CURVE); return MCI(q, a, w.map(x => [x[0], x[1], 'heating_curve', 'concept']), ['Sloped parts: one phase heating up (q = mcΔT). Flat parts: phase change at constant temperature (q = mΔH).', 'During a flat part, energy breaks attractions instead of raising temperature.'], [['', a + '.']]); }});
tpl({id: 'en-total', s: 'enthalpy', d: 3, name: 'Ice to warm water', make(R) {
  const m = gv(R, 10, 95), Ti = -R.i(5, 25), Tf = R.i(15, 60), q1 = m.v * 2.09 * (0 - Ti), q2 = m.v * 334, q3 = m.v * 4.18 * Tf, q = q1 + q2 + q3;
  return one('How much heat (in joules) turns $' + m.s + '$ g of ice at $' + Ti + '$ °C into liquid water at $' + Tf + '$ °C? ($c_{\\text{ice}}=2.09$, $c_{\\text{water}}=4.18$ J/(g·°C); $\\Delta H_{\\text{fus}}=334$ J/g)', NUM('a', 'Total heat', q, {sf: 3, unit: 'J'}),
    [TR('a', q1 + q3, 'Include melting: q = m × 334 J/g at 0 °C.', 'phase_change_skipped', 'concept'), TR('a', q2 + q3, 'First warm the ice from ' + Ti + ' °C to 0 °C.', 'step_skipped'), TR('a', m.v * 4.18 * (Tf - Ti), 'Ice and water have different specific heats, and melting needs heat too: add three steps.', 'one_step_only', 'concept')],
    ['Three steps: warm the ice to 0 °C, melt it, then warm the water.', '$q_1=mc_{\\text{ice}}\\Delta T,\\;q_2=m\\Delta H_{\\text{fus}},\\;q_3=mc_{\\text{water}}\\Delta T$'],
    [['q_1=(' + m.s + ')(2.09)(' + (-Ti) + ')=' + nT(q1, 3) + TX(' J'), 'Ice warms to 0 °C.'], ['q_2=(' + m.s + ')(334)=' + nT(q2, 3) + TX(' J'), 'Ice melts.'], ['q_3=(' + m.s + ')(4.18)(' + Tf + ')=' + nT(q3, 3) + TX(' J'), 'Water warms.'], ['q=' + nT(q, 3) + TX(' J'), 'Add them.']]);
}});

// ===== Unit 10 · Nuclear chemistry
const NUCS = [['U', 238, 'a'], ['Ra', 226, 'a'], ['Po', 210, 'a'], ['Rn', 222, 'a'], ['Th', 232, 'a'], ['Am', 241, 'a'], ['C', 14, 'b'], ['H', 3, 'b'], ['Sr', 90, 'b'], ['I', 131, 'b'], ['Co', 60, 'b'], ['Cs', 137, 'b'], ['P', 32, 'b'], ['Na', 22, 'p'], ['F', 18, 'p'], ['C', 11, 'p'], ['O', 15, 'p']];
const PART_N = {a: ['^{4}_{2}He', 'Alpha particle', -4, -2], b: ['^{0}_{-1}e', 'Beta particle', 0, 1], p: ['^{0}_{1}e', 'Positron', 0, -1]};
const daughter = (sy, A, t) => { const Z = EL[sy].z + PART_N[t][3]; return {A: A + PART_N[t][2], Z, s: ELZ(Z).s}; };
tpl({id: 'nu-type', s: 'nuclear', d: 1, name: 'Type of decay', make(R) {
  const [sy, A, t] = R.pick(NUCS), d = daughter(sy, A, t), Z = EL[sy].z, eq = '^{' + A + '}_{' + Z + '}' + sy + ' -> ^{' + d.A + '}_{' + d.Z + '}' + d.s + ' + ?';
  const why = {a: 'The mass number dropped by 4 and the atomic number by 2: an alpha particle, ⁴₂He.', b: 'The mass number stayed the same and the atomic number rose by 1: a neutron became a proton and emitted a beta particle, ⁰₋₁e.', p: 'The mass number stayed the same and the atomic number fell by 1: a positron, ⁰₊₁e, was emitted.'};
  return MCI('What particle is emitted? $' + ce(eq) + '$', PART_N[t][1], ['a', 'b', 'p'].filter(x => x !== t).map(x => [PART_N[x][1], why[t], 'decay_type', 'concept']).concat([['Gamma ray', 'Gamma rays carry no mass or charge, so they can\'t change the mass or atomic number. ' + why[t], 'decay_type', 'concept']]),
    ['Compare the mass numbers (top) and atomic numbers (bottom) on both sides.', 'Alpha: A − 4, Z − 2. Beta: Z + 1. Positron: Z − 1. Gamma: no change.'], [['', 'Mass number: ' + A + ' → ' + d.A + '; atomic number: ' + Z + ' → ' + d.Z + '.'], ['', why[t]]]);
}});
tpl({id: 'nu-missing', s: 'nuclear', d: 2, name: 'Complete a nuclear equation', make(R) {
  const [sy, A, t] = R.pick(NUCS), d = daughter(sy, A, t), Z = EL[sy].z, eq = '^{' + A + '}_{' + Z + '}' + sy + ' -> ' + PART_N[t][0] + ' + ?', traps = [];
  if (t === 'a') { traps.push(TR('A', A + 4, 'The particle leaves, so the mass number goes DOWN by 4.', 'nuclear_direction')); traps.push(TR('Z', Z + 2, 'The particle carries off 2 protons: the atomic number goes DOWN by 2.', 'nuclear_direction')); }
  if (t === 'b') traps.push(TR('Z', Z - 1, 'Emitting ⁰₋₁e makes the atomic number go UP: ' + Z + ' = Z + (−1), so Z = ' + (Z + 1) + '.', 'nuclear_direction'));
  if (t === 'p') traps.push(TR('Z', Z + 1, 'Emitting ⁰₊₁e makes the atomic number go DOWN: Z = ' + (Z - 1) + '.', 'nuclear_direction'));
  traps.push(TR('s', sy, 'A new atomic number means a new element: look up element ' + d.Z + '.', 'same_element', 'concept'));
  return {q: 'Complete the nuclear equation: $' + ce(eq) + '$. Give the mass number, atomic number and symbol of the missing nucleus.', fs: [INT('A', 'Mass number', d.A), INT('Z', 'Atomic number', d.Z), SYM('s', 'Element symbol', d.s)], traps,
    h: ['Mass numbers must add up the same on both sides, and so must atomic numbers.', 'Top: ' + A + ' = ' + PART_N[t][0].match(/\{(\d+)\}/)[1] + ' + A. Bottom: ' + Z + ' = ' + PART_N[t][0].match(/_\{(-?\d+)\}/)[1] + ' + Z.'],
    x: [['A=' + A + '-' + PART_N[t][0].match(/\{(\d+)\}/)[1] + '=' + d.A, 'Mass numbers balance.'], ['Z=' + Z + '-(' + PART_N[t][0].match(/_\{(-?\d+)\}/)[1] + ')=' + d.Z, 'Atomic numbers balance.'], [ce('^{' + d.A + '}_{' + d.Z + '}' + d.s), 'Element ' + d.Z + ' is ' + EL[d.s].n.toLowerCase() + '.']]};
}});
const HALF = [['iodine-131', 8.0, 'days'], ['phosphorus-32', 14.3, 'days'], ['radon-222', 3.8, 'days'], ['cobalt-60', 5.27, 'years'], ['strontium-90', 28.8, 'years'], ['carbon-14', 5730, 'years'], ['technetium-99m', 6.0, 'hours'], ['an isotope', 12.0, 'minutes']];
tpl({id: 'nu-half', s: 'nuclear', d: 1, name: 'Half-life', make(R) {
  const [iso, th, u] = R.pick(HALF), n = R.i(1, 5), m0 = R.pick([80.0, 64.0, 100.0, 50.0, 120.0, 40.0, 200.0]), t = n * th, left = m0 / Math.pow(2, n), find = R.f() < 0.65;
  if (find) return one('The half-life of ' + iso + ' is $' + niceN(th) + '$ ' + u + '. How much of a $' + m0.toFixed(1) + '$ g sample remains after $' + niceN(+t.toFixed(2)) + '$ ' + u + '?', NUM('a', 'Mass left', left, {unit: 'g', tol: 0.003}),
    [n > 1 ? TR('a', m0 / (2 * n), 'Halving repeats: divide by 2 each half-life (by $2^{' + n + '}$ in all), not by 2 × ' + n + '.', 'half_life_linear', 'concept') : null, TR('a', m0 - left, 'That is how much DECAYED. The question asks what remains.', 'decayed_not_left'), TR('a', m0 / Math.pow(2, n + 1), 'Count the half-lives again: ' + niceN(+t.toFixed(2)) + ' ÷ ' + niceN(th) + ' = ' + n + '.', 'half_life_count', 'slip'), n > 1 ? TR('a', m0 / Math.pow(2, n - 1), 'Count the half-lives again: ' + niceN(+t.toFixed(2)) + ' ÷ ' + niceN(th) + ' = ' + n + '.', 'half_life_count', 'slip') : null].filter(Boolean),
    ['Count half-lives: ' + niceN(+t.toFixed(2)) + ' ÷ ' + niceN(th) + ' = ' + n + '.', 'Halve the mass ' + n + ' time' + (n > 1 ? 's' : '') + '.'],
    [['n=' + F(niceN(+t.toFixed(2)), niceN(th)) + '=' + n, 'Number of half-lives.'], [m0.toFixed(1) + '\\times\\left(' + F(1, 2) + '\\right)^{' + n + '}=' + niceN(left) + TX(' g'), 'Halve ' + n + ' time' + (n > 1 ? 's' : '') + '.']]);
  return one('A $' + m0.toFixed(1) + '$ g sample of ' + iso + ' decays to $' + niceN(left, 6) + '$ g. Its half-life is $' + niceN(th) + '$ ' + u + '. How much time has passed?', NUM('a', 'Time', t, {unit: u, tol: 0.003}),
    [TR('a', n, 'That is the number of half-lives. Multiply by the half-life, ' + niceN(th) + ' ' + u + '.', 'half_lives_not_time'), n > 1 ? TR('a', th * m0 / left / 2, 'Count how many times you halve ' + m0.toFixed(1) + ' to reach ' + niceN(left) + ': that is the number of half-lives.', 'half_life_linear', 'concept') : null].filter(Boolean),
    ['Halve the starting mass until you reach ' + niceN(left) + ' g, and count the halvings.', 'Time = number of half-lives × half-life.'],
    [['', m0.toFixed(1) + ' → ' + Array.from({length: n}, (_, k) => niceN(m0 / Math.pow(2, k + 1))).join(' → ') + ' g: ' + n + ' half-li' + (n > 1 ? 'ves' : 'fe') + '.'], [n + '\\times' + niceN(th) + '=' + niceN(+t.toFixed(2)) + TX(' ' + u), '']]);
}});
const NPROP = [['Which radiation is stopped by a sheet of paper?', 'Alpha particles', [['Beta particles', 'Beta particles need a thin sheet of aluminum to stop them.'], ['Gamma rays', 'Gamma rays need thick lead or concrete.'], ['All of them', 'Only alpha particles are that weak at penetrating.']]],
  ['Which radiation has no charge and no mass?', 'Gamma rays', [['Alpha particles', 'Alpha particles are helium nuclei: +2 charge, mass 4.'], ['Beta particles', 'Beta particles are electrons: −1 charge.'], ['Positrons', 'Positrons have a +1 charge.']]],
  ['What happens in nuclear fission?', 'A heavy nucleus splits into smaller nuclei, releasing energy', [['Light nuclei join together', 'That is fusion.'], ['Electrons are shared between atoms', 'That is covalent bonding, a chemical change.'], ['A nucleus emits only gamma rays', 'Gamma emission doesn\'t split the nucleus.']]],
  ['What powers the Sun?', 'Nuclear fusion of hydrogen into helium', [['Nuclear fission of uranium', 'Fission powers nuclear power plants on Earth.'], ['Burning (combustion) of hydrogen', 'There is no oxygen fuel source for that; it is nuclear fusion.'], ['Radioactive alpha decay', 'Decay releases far too little energy.']]],
  ['Carbon-14 is used to…', 'Estimate the age of once-living things', [['Treat thyroid disease', 'That is iodine-131.'], ['Fuel nuclear reactors', 'Reactors use uranium-235.'], ['Kill cancer cells with gamma rays', 'That is cobalt-60.']]],
  ['Which is the most penetrating type of radiation?', 'Gamma rays', [['Alpha particles', 'Alpha particles are the least penetrating.'], ['Beta particles', 'Beta particles are stopped by aluminum.'], ['They are all equal', 'They differ a lot: alpha < beta < gamma.']]]];
tpl({id: 'nu-props', s: 'nuclear', d: 1, name: 'Radiation and nuclear energy', make(R) { const [q, a, w] = R.pick(NPROP); return MCI(q, a, w.map(x => [x[0], x[1], 'nuclear_facts', 'concept']), ['Alpha: +2, stopped by paper. Beta: −1, stopped by aluminum. Gamma: no charge, needs lead.', 'Fission splits heavy nuclei; fusion joins light ones.'], [['', a + '.']]); }});
