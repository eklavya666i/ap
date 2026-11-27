// ---------- Voice: the iPad's built-in voices through the Web Speech API, one sentence at a time.
// Pause is stop-and-remember, because pause()/resume() are unreliable in iPad Safari.
// Formulas and configurations are read by ceSay/cfgSay; they are set aside first so the unit and symbol rules can't touch them
function withCE(t, fn) {
  const keep = [];
  t = String(t).replace(/\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, x) => { keep.push(ceSay(x).replace(/\+/g, ' plus ')); return ' §' + (keep.length - 1) + '§ '; }).replace(/\\cfg\{([^{}]*)\}/g, (m, x) => { keep.push(cfgSay(x)); return ' §' + (keep.length - 1) + '§ '; });
  return fn(t).replace(/§(\d+)§/g, (m, k) => keep[+k]).replace(/\s+/g, ' ');
}
const sayMath = s => withCE(s, t => {
  t = t.replace(/\\Delta\s*/g, ' delta ').replace(/\\lambda/g, ' lambda ').replace(/\\nu/g, ' nu ').replace(/\\mu/g, ' mu ').replace(/\\log/g, ' log ').replace(/\\circ/g, ' degrees ');
  for (let k = 0; k < 6; k++) t = t.replace(/\\f\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' $1, over $2, ').replace(/\\f(\w)(\w)/g, ' $1 over $2 ').replace(/\\sqrt\{([^{}]*)\}/g, ' root $1 ').replace(/\\text\{([^{}]*)\}/g, ' $1 ').replace(/\^\{([^{}]*)\}/g, ' to the $1 ');
  t = t.replace(/\^2/g, ' squared ').replace(/\^3/g, ' cubed ').replace(/\^(\w)/g, ' to the $1 ').replace(/\\ne/g, ' is not ').replace(/\\pm/g, ' plus or minus ').replace(/\\cdot|\\times/g, ' times ').replace(/\\div/g, ' divided by ').replace(/\\Rightarrow/g, ', so ').replace(/\\approx/g, ' about ').replace(/\\to/g, ' to ').replace(/\\left|\\right/g, '').replace(/\\%/g, ' percent').replace(/\\[a-zA-Z]+/g, ' ').replace(/\\./g, ' ');
  return unitSay(t.replace(/-/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' equals ').replace(/[(){}\[\]]/g, ' ').replace(/_\{?(\w+)\}?/g, ' $1 ').replace(/\s+/g, ' '));
});
const SUBD = '₀₁₂₃₄₅₆₇₈₉', SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function unitSay(t) {
  return String(t).replace(/[₀-₉]/g, c => SUBD.indexOf(c)).replace(/[⁰¹²³⁴-⁹]/g, c => SUPD.indexOf(c)).replace(/⁺/g, ' plus').replace(/⁻/g, ' minus').replace(/→/g, ' yields ').replace(/⇌/g, ' is in equilibrium with ')
    .replace(/g\/mol/g, 'grams per mole').replace(/J\/\(g·°C\)/g, 'joules per gram degree Celsius').replace(/°C/g, ' degrees Celsius').replace(/\bkJ\b/g, 'kilojoules').replace(/\bmL\b/g, 'milliliters').replace(/\batm\b/g, 'atmospheres').replace(/\bkPa\b/g, 'kilopascals').replace(/\bmmHg\b/g, 'millimeters of mercury').replace(/\bmol\b/g, 'moles').replace(/\bamu\b/g, 'A M U').replace(/\bnm\b/g, 'nanometers').replace(/(\d) ?K\b/g, '$1 kelvin');
}
const sayText = s => String(s).split('$').map((p, k) => k % 2 ? sayMath(p) : withCE(p, t => unitSay(t.replace(/<[^>]+>/g, '').replace(/≠/g, ' is not ')))).join('');
const Voice = (() => {
  const ok = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  const PREF = [/premium/i, /enhanced/i, /samantha/i, /\bava\b/i, /allison/i, /susan/i, /karen/i, /daniel/i];
  let list = [], queue = [], at = 0, playing = false, onStep = null, onDone = null, token = 0, watch = null;
  const load = () => (list = ok ? speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)) : []);
  if (ok) { load(); try { speechSynthesis.onvoiceschanged = load; } catch (e) {} }
  function chosen() {
    const mine = list.find(v => v.voiceURI === S.set.voice.uri); if (mine) return mine;
    for (const p of PREF) { const v = list.find(x => p.test(x.name) && /en[-_]US/i.test(x.lang)) || list.find(x => p.test(x.name)); if (v) return v; }
    return list.find(v => /en[-_]US/i.test(v.lang)) || list[0] || null;
  }
  const chunks = text => (String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(Boolean).flatMap(s => { const o = []; while (s.length > 220) { const c = s.lastIndexOf(',', 200), cut = c > 60 ? c + 1 : 200; o.push(s.slice(0, cut)); s = s.slice(cut).trim(); } if (s) o.push(s); return o; });
  function speakAt(i, my) {
    if (!playing || my !== token) return;
    if (i >= queue.length) { playing = false; at = 0; queue = []; onStep && onStep(-1); onDone && onDone(); return; }
    at = i; const q = queue[i]; onStep && onStep(q.i);
    const u = new SpeechSynthesisUtterance(q.said), v = chosen(); if (v) u.voice = v; u.lang = (v && v.lang) || 'en-US'; u.rate = S.set.voice.rate || 1;
    let done = false; const next = () => { if (done) return; done = true; clearTimeout(watch); setTimeout(() => speakAt(i + 1, my), 120); };
    u.onend = next; u.onerror = next;
    clearTimeout(watch); watch = setTimeout(next, (q.said.length * 90 + 2500) / (S.set.voice.rate || 1));
    try { speechSynthesis.speak(u); } catch (e) { next(); }
  }
  function stop() { token++; playing = false; clearTimeout(watch); try { speechSynthesis.cancel(); } catch (e) {} }
  function play(items, step, done) {
    if (!ok || !list.length && !load().length) { if (!ok) return false; }
    stop(); queue = []; items.forEach(it => chunks(sayText(it.say)).forEach(c => queue.push({said: c, i: it.i})));
    if (!queue.length) return false;
    onStep = step; onDone = done; playing = true; token++; at = 0; speakAt(0, token); return true;
  }
  function pause() { const a = at; stop(); at = a; }
  function resume() { if (!queue.length) return false; playing = true; token++; speakAt(at, token); return true; }
  function jump(stepIdx) { const k = queue.findIndex(q => q.i === stepIdx); if (k < 0) return false; stop(); playing = true; token++; speakAt(k, token); return true; }
  const say = texts => { if (!play(texts.map((t, i) => ({say: t, i})), null, null)) toast('This device has no speech voice.'); };
  return {ok, play, stop, pause, resume, jump, say, voices: () => (load(), list), chosen, isPlaying: () => playing, hasQueue: () => queue.length > 0};
})();
