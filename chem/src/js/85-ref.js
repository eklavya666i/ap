// ---------- Reference: the periodic table (tap an element), common ions, acids and bases, the equation sheet and constants.
// Opens as its own screen from Learn, or over a question from the table button, so a question is never lost.
const CATNAME = {alkali: 'Alkali metal', alkaline: 'Alkaline earth metal', transition: 'Transition metal', post: 'Post-transition metal', metalloid: 'Metalloid', nonmetal: 'Nonmetal', halogen: 'Halogen', noble: 'Noble gas', lanthanide: 'Lanthanide', actinide: 'Actinide'};
const REFTABS = [['pt', '<span class="lg">Periodic table</span><span class="sm">Table</span>'], ['ions', 'Ions'], ['eq', 'Equations'], ['k', 'Constants']];
let refTab = 'pt', refSel = 26;
const UNSTABLE = e => e.z === 43 || e.z === 61 || e.z >= 84;   // no stable isotope
const massTxt = e => UNSTABLE(e) && Number.isInteger(e.m) ? '(' + e.m + ')' : e.m.toFixed(2);
const PTPOS = (() => {   // grid row and column for every element; the f-block sits in two rows under the table
  const pos = {}, col = {6: 4, 7: 4};
  PT.forEach(e => { pos[e.z] = e.g ? [e.p, e.g] : [e.p + 3, col[e.p]++]; });
  return pos;
})();
function ptGrid() {
  return '<div class="ptwrap"><div class="pt" role="grid" aria-label="Periodic table">' + PT.map(e => { const [r, c] = PTPOS[e.z]; return '<button class="el c-' + e.c + (refSel === e.z ? ' sel' : '') + '" data-a="el" data-z="' + e.z + '" style="grid-row:' + r + ';grid-column:' + c + '" aria-label="' + esc(e.n) + ', atomic number ' + e.z + '"><span class="z">' + e.z + '</span><b>' + e.s + '</b><span class="ms">' + massTxt(e) + '</span></button>'; }).join('')
    + '<div class="ptkey" style="grid-row:1 / span 3;grid-column:3 / span 10">' + Object.keys(CATNAME).map(c => '<span><i class="c-' + c + '"></i>' + CATNAME[c] + '</span>').join('') + '</div></div></div>';
}
function elInfo(z) {
  const e = ELZ(z); if (!e) return '';
  return '<div class="elinfo"><div class="elbig c-' + e.c + '"><span class="z">' + e.z + '</span><b>' + e.s + '</b><span class="ms">' + massTxt(e) + '</span></div><div><h3>' + esc(e.n) + '</h3><p class="meta">' + CATNAME[e.c] + (e.g ? ' · group ' + e.g : '') + ' · period ' + e.p + '</p><p>Atomic mass <b>' + massTxt(e) + '</b>' + (e.en ? ' · electronegativity <b>' + e.en + '</b>' : '') + '</p><p class="cfgl">' + cfgHTML(e.cfg) + '</p></div></div>';
}
const ionRow = (f, name) => '<div class="irow"><span class="if">' + ceHTML(f) + '</span><span>' + esc(name) + '</span></div>';
function ionsHTML() {
  const poly = Object.keys(POLY).map(f => ionRow(f + chgCe(POLY[f][1]), POLY[f][0])).join('');
  const multi = Object.keys(CATV).map(m => CATV[m][1].map(q => ionRow(m + chgCe(q), CATV[m][0] + '(' + ROMAN[q] + ')')).join('')).join('');
  const mono = IONS_MG.slice().sort((a, b) => EL[a[0]].z - EL[b[0]].z).map(([s, q]) => ionRow(s + chgCe(q), q > 0 ? EL[s].n.toLowerCase() : (ANM[s] ? ANM[s][0] : EL[s].n.toLowerCase().replace(/(ine|ygen|ogen|orus|ur|ium|on)$/, '') + 'ide'))).join('');
  const acids = ACIDB.sa.map(f => ionRow(f, (ACIDS.find(a => a[0] === f) || [0, ''])[1] || 'strong acid')).join(''), bases = ACIDB.sb.map(f => ionRow(f, 'strong base')).join('');
  return '<div class="grid2"><section class="card"><h3>Polyatomic ions</h3>' + poly + '</section><div><section class="card"><h3>Metals with more than one charge</h3>' + multi + '<p class="meta">The Roman numeral in the name is the charge.</p></section><section class="card"><h3>Main-group ions</h3>' + mono + '</section></div></div>'
    + '<div class="grid2"><section class="card"><h3>The six strong acids</h3>' + acids + '<p class="meta">Every other acid here is weak.</p></section><section class="card"><h3>Strong bases</h3>' + bases + '<p class="meta">Group 1 and heavier group 2 hydroxides. ' + ceHTML('NH3') + ' is a weak base.</p></section></div>';
}
const eqHTML = () => D.units.map(u => '<section class="card keys eqs"><h3 style="grid-column:1/-1">Unit ' + u.n + ' · ' + esc(u.t) + '</h3>' + u.ks.map(k => LES[k].keys.map(x => '<div class="kl">' + esc(x[0]) + '</div><div class="mb"><span class="m">' + tex(x[1]) + '</span></div>').join('')).join('') + '</section>').join('');
const CONSTS = [['Avogadro\'s number', '6.02\\times10^{23}\\text{ particles/mol}'], ['Ideal gas constant', 'R=0.0821\\text{ L·atm/(mol·K)}'], ['Molar volume at STP', '22.4\\text{ L/mol}'], ['STP', '0\\text{ °C (273 K) and 1 atm}'],
  ['Pressure', '1\\text{ atm}=101.3\\text{ kPa}=760\\text{ mmHg}=14.7\\text{ psi}'], ['Kelvin', 'K=°C+273'], ['Speed of light', 'c=3.00\\times10^{8}\\text{ m/s}'], ['Planck\'s constant', 'h=6.626\\times10^{-34}\\text{ J·s}'],
  ['Specific heat of water', '4.18\\text{ J/(g·°C)}'], ['Water: fusion, vaporization', '\\Delta H_{\\text{fus}}=334\\text{ J/g},\\;\\Delta H_{\\text{vap}}=2260\\text{ J/g}'], ['Water: freezing, boiling constants', 'K_f=1.86,\\;K_b=0.512\\text{ °C/m}'],
  ['Water at 25 °C', '\\text{pH}+\\text{pOH}=14'], ['Energy', '1\\text{ kJ}=1000\\text{ J},\\;1\\text{ cal}=4.184\\text{ J}']];
function constHTML() {
  const pre = Object.keys(PFX).filter(k => k).map(k => [PFX[k][1] + ' (' + k + ')', '10^{' + PFX[k][0] + '}']).sort((a, b) => +b[1].slice(4, -1) - +a[1].slice(4, -1));
  return '<section class="card keys">' + CONSTS.map(x => '<div class="kl">' + esc(x[0]) + '</div><div class="mb"><span class="m">' + tex(x[1]) + '</span></div>').join('') + '</section><section class="card keys"><h3 style="grid-column:1/-1">Metric prefixes</h3>' + pre.map(x => '<div class="kl">' + esc(x[0]) + '</div><div class="mb"><span class="m">' + tex(x[1]) + '</span></div>').join('') + '</section>';
}
function refBody() { return '<div class="seg reftabs" role="group">' + REFTABS.map(([k, t]) => '<button data-a="reftab" data-t="' + k + '" aria-pressed="' + (refTab === k) + '">' + t + '</button>').join('') + '</div>' + (refTab === 'pt' ? '<div id="elinfo">' + elInfo(refSel) + '</div>' + ptGrid() + '<p class="meta">Tap an element for its details. A mass in parentheses is the mass number of the most stable isotope.</p>' : refTab === 'ions' ? ionsHTML() : refTab === 'eq' ? eqHTML() : constHTML()); }
function vRef() {
  top('Reference', '', ['learn', 'Learn']); setTab('learn');
  if (!S.explore.ref) { S.explore.ref = 1; save(); checkBadges(); }
  main.innerHTML = '<div class="wrap" id="refbox">' + refBody() + '</div>';
}
function refModal() {
  if (!S.explore.ref) { S.explore.ref = 1; save(); checkBadges(); }
  modal.innerHTML = '<div class="modal refm" role="dialog" aria-modal="true" aria-label="Reference"><div class="card"><div class="row2" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">Reference</h3><button class="btn sm" data-a="mcancel">' + ic('x') + 'Close</button></div><div id="refbox">' + refBody() + '</div></div></div>';
}
const refRedraw = () => { const b = $('#refbox'); if (b) b.innerHTML = refBody(); };
Object.assign(ACT, {
  reftab: t => { refTab = t.dataset.t; refRedraw(); },
  el: t => { refSel = +t.dataset.z; const i = $('#elinfo'); if (i) i.innerHTML = elInfo(refSel); $$('.pt .el').forEach(b => b.classList.toggle('sel', +b.dataset.z === refSel)); },
  ptable: () => { refTab = 'pt'; refModal(); }
});
