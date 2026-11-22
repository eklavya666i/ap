// ---------- Voice: the iPad's built-in voices through the Web Speech API.
// Safari's rules on iPad, and what this player does about each:
//  1. A page can speak only after speech has started during a tap. The first tap anywhere speaks an empty, silent
//     utterance, which unlocks speech for the rest of the visit, so lessons can start talking on their own.
//  2. Speaking straight after cancel() can be dropped, so after a real cancel the next sentence waits a moment.
//  3. Voice quality: Apple's Premium voices sound most natural, then Enhanced, then the standard ones. The player
//     picks the best installed English voice (or the student's own pick) and never uses the novelty and "Eloquence"
//     voices, which sound robotic or cartoonish. Some voices never make a sound in Safari: a sentence that hasn't
//     started within a few seconds is retried with the next best voice, which is remembered on this iPad, and if
//     nothing starts, the player stops and says so instead of running silently.
//  4. pause() and resume() are unreliable, so pause is stop-and-remember.
//  5. A muted iPad can silence web audio; Safari 17 lets a page ask to play anyway (navigator.audioSession).
const Voice = (() => {
  const ok = typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
  const START_MS = 3500;            // a sentence that hasn't started by then didn't start
  let list = [], queue = [], at = 0, playing = false, onStep = null, onDone = null, resumeLater = false, token = 0;
  const tried = [];                                                    // voices that failed while saying the current sentence
  let unlocked = false, lastCancel = 0, watcher = null;
  const bad = new Set((S.set.voice.skip || []));                       // voices that didn't start in Safari on this iPad
  const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|princess|deranged|hysterical|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
  const NATURAL = /samantha|alex|ava|allison|susan|tom|evan|nathan|zoe|joelle|noelle|nicky|aaron|google us english/i;
  const quality = v => { const id = v.name + " " + v.voiceURI; return /premium/i.test(id) ? 3 : /enhanced/i.test(id) ? 2 : 1; };
  const score = v => quality(v) * 100 + (/^en[-_]US/i.test(v.lang) ? 20 : 0) + (NATURAL.test(v.name) ? 5 : 0);
  // English voices, best first, without the novelty voices
  const ranked = () => list.filter(v => !NOVELTY.test(v.name)).sort((a, b) => score(b) - score(a));
  const stat = {state: ok ? "untested" : "none", voice: "", error: "", started: 0};
  const note = (k, v) => { Object.assign(stat, k); if (watcher) try { watcher(stat); } catch (e) {} };
  const load = () => (list = ok ? speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)) : []);
  if (ok) { load(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", load); else speechSynthesis.onvoiceschanged = load; }
  function playback() { try { if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback"; } catch (e) {} }
  function unlock() {
    if (unlocked || !ok) return;
    unlocked = true; playback();
    try { const u = new SpeechSynthesisUtterance(""); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  }
  if (ok) ["touchend", "click", "keydown"].forEach(t => document.addEventListener(t, unlock, {capture: true, passive: true}));
  // The student's pick if it works, else the best installed voice that works; null means the iPad's default voice.
  function chosen() {
    if (!list.length) load();
    const uri = S.set.voice.uri;
    if (uri && !bad.has(uri)) { const v = list.find(v => v.voiceURI === uri); if (v) return v; }
    return ranked().find(v => !bad.has(v.voiceURI)) || null;
  }
  const keepSkips = () => { S.set.voice.skip = [...bad]; save(); };
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
  function sayAt(i, my, plain) {
    if (!playing || my !== token) return;
    if (i >= queue.length) { playing = false; queue = []; const d = onDone; onDone = null; onStep && onStep(-1); d && d(); return; }
    const gap = Date.now() - lastCancel;
    if (gap < 150) { setTimeout(() => sayAt(i, my, plain), 160 - gap); return; }   // rule 2
    at = i;
    const v = plain === true ? null : chosen(), u = new SpeechSynthesisUtterance(queue[i].said), t0 = Date.now();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
    u.rate = S.set.voice.rate || 1;
    let started = false, over = false, quiet = 0, skipped = false;
    const live = () => !over && playing && at === i && my === token;
    const begin = () => {
      if (started) return; started = true;
      if (tried.length) { keepSkips(); tried.length = 0; }            // a voice failed and this one works: remember the failure
      note({state: "spoke", voice: v ? v.name : "the iPad's default English voice", quality: v ? quality(v) : 1, error: "", started: stat.started + 1});
    };
    const finish = () => { if (!live()) return; over = true; clearInterval(watch); tried.length = 0; setTimeout(() => sayAt(i + 1, my, plain === true), 0); };
    const fail = why => {
      if (!live()) return; over = true; clearInterval(watch);
      speechSynthesis.cancel(); lastCancel = Date.now();               // clear anything stuck in the engine
      // rule 3: try the next best voice once, then the default voice; two silent voices in a row point at the engine
      if (v) { bad.add(v.voiceURI); tried.push(v.voiceURI); const nv = tried.length < 2 ? chosen() : null; return sayAt(i, my, nv ? "fallback" : true); }
      tried.forEach(u => bad.delete(u)); tried.length = 0;             // nothing starts at all: not the voices' fault
      playing = false; note({state: "blocked", error: why});
      onStep && onStep(-3);                                            // the player shows "the voice didn't start"
    };
    u.onstart = begin;
    u.onend = () => { if (!started && Date.now() - t0 < Math.min(1500, 25 * u.text.length)) return fail("ended without speaking"); begin(); finish(); };
    u.onerror = e => { const why = (e && e.error) || "error"; if (started && (why === "interrupted" || why === "canceled")) finish(); else fail(why); };
    onStep && onStep(queue[i].line);
    speechSynthesis.speak(u);
    const watch = setInterval(() => {
      if (!live()) { clearInterval(watch); return; }
      if (!started && speechSynthesis.speaking) begin();               // some engines speak without a start event
      if (!started) {                                                 // never started: dropped, blocked or a silent voice
        const t = Date.now() - t0;
        if (t > START_MS || (t > 1500 && !speechSynthesis.speaking && !speechSynthesis.pending)) fail("didn't start");
        return;
      }
      quiet = !speechSynthesis.speaking && !speechSynthesis.pending ? quiet + 1 : 0;
      if (quiet >= 3) finish();                                        // some voices never send "end"
    }, 400);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) { playing = false; resumeLater = true; token++; speechSynthesis.cancel(); lastCancel = Date.now(); onStep && onStep(-2); }
  });
  // stop first, then cancel, so the "interrupted" event from our own cancel isn't mistaken for a failed voice
  function halt() { const was = playing; playing = false; token++; if (was) { speechSynthesis.cancel(); lastCancel = Date.now(); } }
  return {
    ok, voices: () => (load(), ranked()), chosen, quality,
    hasPremium: () => (load(), ranked().some(v => quality(v) === 3 && !bad.has(v.voiceURI))),
    get status() { return stat; }, set watch(fn) { watcher = fn; },
    // lines are in screen notation; each goes through M6.speak(). cb(line) runs as each line starts,
    // cb(-1) at the end, cb(-2) when the iPad hides the page, cb(-3) when the voice didn't start.
    play(lines, cb, done) {
      if (!ok) { if (done) setTimeout(done, 0); return false; }
      unlock(); playback(); halt();
      queue = []; lines.forEach((l, line) => chunks(M6.speak(l)).forEach(said => queue.push({said, line})));
      onStep = cb || null; onDone = done || null; playing = true; resumeLater = false; sayAt(0, token); return true;
    },
    pause() { if (playing) halt(); },
    resume() { if (!queue.length || playing) return; playback(); playing = true; resumeLater = false; token++; sayAt(at, token); },
    stop() { halt(); resumeLater = false; queue = []; onDone = null; },
    forget() {},
    retry(uri) { if (bad.delete(uri)) keepSkips(); },                  // the student picked this voice: give it another chance
    get playing() { return playing; }, get paused() { return !playing && queue.length > 0; }, get waiting() { return resumeLater; }
  };
})();
// Read a piece of the screen aloud (question, hint, solution). Text is in screen notation or HTML.
function readAloud(html) { if (!Voice.play([plain(html)])) toast("This iPad has no speech voice"); }

// Strings the voice must read correctly (the speech test in the spec's device checklist)
const SPEECH_TEST = ["2:3", "2/3", "2 3/4", "−8", "5 − 8", "3x", "x/4", "2³", "(3, −4)", "12.6", "$4.25", "30%",
  "|−5|", "x ≥ 3", "30 ft³", "2(3 + 4)", "2/3 ÷ 3/4 = 8/9", "−8 < −3", "0.45", "3 + 4 × 2²"];
