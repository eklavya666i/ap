// ---------- Router, taps and keys, settings inputs, offline copy, boot
const VIEWS = {today: vToday, learn: vLearn, ref: vRef, practice: vPractice, tests: vTests, speed: vSpeed, me: vMe, parent: vParent, mistakes: vMistakes};
let lastH = null;
function route(force) {
  const h = (location.hash || '').slice(1) || 'today';
  if (!force && h === lastH) return;
  lastH = h; stopTick(); stopSpeed(); Voice.stop(); modal.innerHTML = '';
  if (SP && !SP.done) SP = null;
  RUN = null; Q = null; window.scrollTo(0, 0);
  if (h.indexOf('lesson-') === 0 && LES[h.slice(7)]) { vLesson(h.slice(7)); renderStats(); return; }
  (VIEWS[h] || vToday)(); renderStats();
}
function quietHash(h) { lastH = h; if (location.hash !== '#' + h) { try { location.hash = h; } catch (e) {} } stopTick(); stopSpeed(); Voice.stop(); }
function go(h) { quietHash(h); route(true); }
addEventListener('hashchange', () => route());
Object.assign(ACT, {
  tab: t => go(t.dataset.go), nav: t => go(t.dataset.to), back: t => go(t.dataset.to || 'today'),
  mok: () => { modal.innerHTML = ''; const f = MFN; MFN = null; f && f(); }, mcancel: () => { modal.innerHTML = ''; MFN = null; }
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t || t.disabled || !t.dataset.a) return;
  const f = ACT[t.dataset.a]; if (f) { e.preventDefault(); f(t, e); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.set) { S.set[t.dataset.set] = t.checked; save(); if (t.dataset.set === 'speed') renderStats(); return; }
  if (t.id === 'svoice') { S.set.voice.uri = t.value; save(); Voice.say(['This is your new voice.']); return; }
  if (t.id === 'rfile' && t.files && t.files[0]) { restore(t.files[0]); t.value = ''; }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'sname') { S.name = t.value.slice(0, 30); save(); return; }
  if (t.classList && t.classList.contains('fin') && Q && (!Q.done || Q.test)) { Q.f[t.dataset.f] = t.value.slice(0, 60); if (Q.test) Q.done = false; refreshFields(); }
});
document.addEventListener('focusin', e => { const t = e.target; if (t.classList && t.classList.contains('fin') && Q && Q.focus !== t.dataset.f) { Q.focus = t.dataset.f; refreshFields(); } });
addEventListener('keydown', e => {
  if (modal.innerHTML) { if (e.key === 'Escape') ACT.mcancel(); else if (e.key === 'Enter') ACT.mok(); return; }
  const ae = document.activeElement, tag = (ae && ae.tagName) || '';
  if (ae && ae.classList && ae.classList.contains('fin') && e.key === 'Enter') { e.preventDefault(); ae.blur(); ACT.qcheck(); return; }
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (SP && !SP.done && !SP.lock) { const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k.toLowerCase()); if (k.length === 1 && i >= 0) { const b = $$('#sq .ch')[i]; if (b) { e.preventDefault(); b.click(); } } return; }
  if (Q && Q.mode === 'type' && (!Q.done || Q.test) && Q.fstep !== 0 && Q.it.fs) {
    const fd = curField();
    if (k === 'Backspace') { e.preventDefault(); keyIn('⌫'); return; }
    if (k === 'Enter') { e.preventDefault(); ACT.qcheck(); return; }
    if (k === 'Tab') { e.preventDefault(); if (fd && fd.t === 'coef' && Q.cf < fd.sp.length - 1) { Q.cf++; refreshFields(); return; } const fs = Q.it.fs, n = fs.indexOf(fd), nx = fs[(n + 1) % fs.length]; Q.focus = nx.id; Q.cf = 0; refreshFields(); if (!KPT[nx.t]) { const inp = $('.fin[data-f="' + nx.id + '"]'); if (inp) inp.focus(); } return; }
    if (fd && KPT[fd.t] && k.length === 1) { const m = /[0-9.]/.test(k) ? k : k === '-' ? '−' : k === '+' ? '+' : /[eExX*^]/.test(k) ? 'E' : k === ' ' && fd.t === 'coef' ? 'E' : ''; if (m) { e.preventDefault(); keyIn(m); } return; }
  }
  if (Q && Q.mode === 'mc' && (!Q.done || Q.test)) { const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : k.length === 1 ? 'abcd'.indexOf(k.toLowerCase()) : -1; if (i >= 0) { const b = $$('.qcard .choices .ch')[i]; if (b && !b.disabled) { e.preventDefault(); b.click(); } return; } }
  if (k === 'Enter') { const n = $('#nextb') || $('[data-a=wedonext]'); if (n) { e.preventDefault(); n.click(); } }
});
try {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !/claude/i.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => { SWOK = true; const o = $('#offl'); if (o) o.textContent = offText(); }).catch(() => {});
  }
} catch (e) {}
window.__dbg = () => ({Q, SES, S, SP, LV, keyIn, ACT, TPLS, itemFromTpl, sesStart, sesShowQ, fmtSF, niceN, chgTxt, reviewsDue});   // peek used by the automated checks
streakCare();
route(true);
