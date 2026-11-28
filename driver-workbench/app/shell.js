/* Pin High shell (design package §1): the breadcrumb at the top of every view, the player card in the rail, and the
   current tab kept in view when the rail becomes a sideways-scrolling bar on iPad and phone. */
(function () {
  'use strict';
  if (!window.WB || !window.dash) return;
  const NAMES = {command: 'Command center', progress: 'Progress and forecast', driver: 'Driver lab', flight: 'Ball flight', swing: 'Swing and strike', bag: 'Bag', partials: 'Partial shots', drills: 'Drill studio', rounds: 'Round journal', calib: 'Calibration lab', data: 'Data hub', all: 'Every view'};
  const RANGE = {all: 'All weeks', 2: 'Last 2 weeks', 4: 'Last 4 weeks', 12: 'Last 12 weeks', 26: 'Last 26 weeks'};
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const chev = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ic sm'); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-chev'); s.append(u); return s; };
  WB.viewName = (v) => NAMES[v || WB.view()] || 'Pin High';
  /* On iPad and phone the rail is a sideways bar: keep the current view's tab in sight. */
  const showTab = () => { const b = document.querySelector('.ph-nav [aria-current=page]'); if (b && b.scrollIntoView && window.matchMedia && window.matchMedia('(max-width: 1100px)').matches) b.scrollIntoView({block: 'nearest', inline: 'center'}); };

  let lastView = null;
  dash.draw('crumb', (box) => {
    if (WB.view() !== lastView) { lastView = WB.view(); setTimeout(showTab, 30); }
    box.replaceChildren();
    const g = WB.golfer(), p = dash.params();
    const parts = [g ? g.name : 'No golfer', RANGE[p.range] || RANGE.all, p.cview === 'sea' ? 'Carry at sea level' : 'Carry as hit'];
    const c = typeof WB.pickedClub === 'function' ? WB.pickedClub() : null;
    if (c) parts.push(c.name);
    parts.forEach((t) => { box.append(el('span', '', t), chev()); });
    box.append(el('b', '', WB.viewName()));
  });

  dash.draw('playercard', (box) => {
    box.replaceChildren();
    const g = WB.golfer();
    if (!g) return;
    const who = el('div', 'ph-who');
    who.append(el('span', 'ph-av', String(g.name || '?').trim().charAt(0).toUpperCase() || '?'), el('span', '', g.name));
    box.append(who);
    const d = dash.data('imports_all');
    if (d.status === 'ok') {
      const dates = d.data.map((i) => i.date).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x || '')).sort();
      const last = dates[dates.length - 1];
      box.append(el('div', 'ph-psub', d.data.length ? `${d.data.length} session${d.data.length === 1 ? '' : 's'}${last ? ' · last ' + new Date(last + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : ''}` : 'No sessions yet'));
    }
  });

  document.querySelectorAll('.ph-nav [data-goto]').forEach((b) => b.addEventListener('click', () => setTimeout(showTab, 30)));
  setTimeout(showTab, 300);
})();
