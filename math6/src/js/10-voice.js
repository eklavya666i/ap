// ---------- Voice: the iPad's built-in voices through the Web Speech API.
// One sentence at a time; pause is stop-and-remember, because pause() and resume() are unreliable in iPad Safari.
const Voice = (() => {
  const ok = typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
  const PREF = [/premium/i, /enhanced/i, /samantha/i, /\bava\b/i, /allison/i, /susan/i, /karen/i, /daniel/i];
  let list = [], queue = [], at = 0, playing = false, onStep = null, onDone = null, resumeLater = false, token = 0;
  const load = () => (list = ok ? speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)) : []);
  if (ok) { load(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", load); else speechSynthesis.onvoiceschanged = load; }
  function chosen() {
    const mine = list.find(v => v.voiceURI === S.set.voice.uri);
    if (mine) return mine;
    for (const re of PREF) { const v = list.find(v => re.test(v.name) && /^en[-_]US/i.test(v.lang)); if (v) return v; }
    return list.find(v => /^en[-_]US/i.test(v.lang)) || list[0] || null;
  }
  // Sentences, with any long one cut at commas, so no single utterance runs long enough to stall.
  function chunks(text) {
    const out = [];
    for (const s of String(text).match(/[^.!?]+[.!?]*/g) || []) {
      let t = s.trim();
      while (t.length > 180) { const i = t.lastIndexOf(",", 180); if (i < 40) break; out.push(t.slice(0, i + 1)); t = t.slice(i + 1).trim(); }
      if (t) out.push(t);
    }
    return out;
  }
  function sayAt(i, my) {
    if (!playing || my !== token) return;
    if (i >= queue.length) { playing = false; queue = []; const d = onDone; onDone = null; onStep && onStep(-1); d && d(); return; }
    at = i;
    const u = new SpeechSynthesisUtterance(queue[i].said), v = chosen();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
    u.rate = S.set.voice.rate || 1;
    let done = false;
    const next = () => { if (done) return; done = true; clearInterval(watch); if (playing && at === i && my === token) sayAt(i + 1, my); };
    u.onend = next; u.onerror = next;
    onStep && onStep(queue[i].line);
    speechSynthesis.speak(u);
    // Some voices never send "end". If the voice has gone quiet, move on anyway.
    const started = Date.now();
    const watch = setInterval(() => {
      if (done || !playing || at !== i || my !== token) { clearInterval(watch); return; }
      if (Date.now() - started > 600 && !speechSynthesis.speaking && !speechSynthesis.pending) next();
    }, 400);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) { playing = false; resumeLater = true; token++; speechSynthesis.cancel(); onStep && onStep(-2); }
  });
  return {
    ok, voices: () => load(), chosen,
    // lines are in screen notation; each goes through M6.speak(). cb(line) runs as each line starts, cb(-1) at the end.
    play(lines, cb, done) {
      if (!ok) { if (done) setTimeout(done, 0); return false; }
      token++; speechSynthesis.cancel();
      queue = []; lines.forEach((l, line) => chunks(M6.speak(l)).forEach(said => queue.push({said, line})));
      onStep = cb || null; onDone = done || null; playing = true; resumeLater = false; sayAt(0, token); return true;
    },
    pause() { if (!playing) return; playing = false; token++; speechSynthesis.cancel(); },
    resume() { if (!queue.length || playing) return; playing = true; resumeLater = false; token++; sayAt(at, token); },
    stop() { playing = false; resumeLater = false; queue = []; onDone = null; token++; if (ok) speechSynthesis.cancel(); },
    get playing() { return playing; }, get paused() { return !playing && queue.length > 0; }, get waiting() { return resumeLater; }
  };
})();
// Read a piece of the screen aloud (question, hint, solution). Text is in screen notation or HTML.
function readAloud(html) { if (!Voice.play([plain(html)])) toast("This iPad has no speech voice"); }

// Strings the voice must read correctly (the speech test in the spec's device checklist)
const SPEECH_TEST = ["2:3", "2/3", "2 3/4", "−8", "5 − 8", "3x", "x/4", "2³", "(3, −4)", "12.6", "$4.25", "30%",
  "|−5|", "x ≥ 3", "30 ft³", "2(3 + 4)", "2/3 ÷ 3/4 = 8/9", "−8 < −3", "0.45", "3 + 4 × 2²"];
