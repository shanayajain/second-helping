/* =====================================================================
   Second Helping — UI
   Screens: Today · Week · Mess · Foods · Progress
   All data lives in this browser's localStorage under KEY.
   ===================================================================== */
(function () {
  'use strict';
  const E = window.Engine;
  const KEY = 'second-helping.v1';

  // ---------- state ----------
  let S = load();
  let view = 'today';
  let viewDate = E.keyOf(new Date());
  let logMeal = null; // user-picked meal in the log bar
  let lastMatches = [];
  let weekIdx = 0;
  let messWd = E.weekdayOf(E.keyOf(new Date()));
  let foodsTab = 'room';
  let dbQuery = '';
  let progTab = 'overview';
  let calRange = 14;
  let example = false;
  let sheetCtx = null;
  let toastTimer = null;

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return E.migrate(JSON.parse(raw)); } catch (e) { /* ignore */ }
    return E.defaultState();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Couldn’t save on this device. Export a backup from Settings.'); } }
  function commit() { save(); render(); }

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const todayKey = () => E.keyOf(new Date());
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');
  const uid = () => Math.random().toString(36).slice(2, 10);
  const slotName = (id) => (E.SLOT[id] ? E.SLOT[id].name : 'Snack');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WDN = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
  const WD_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const WD_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  function fmtDate(k, withWd = true) { const d = E.parseKey(k); return `${withWd ? WDN[E.weekdayOf(k)] + ' ' : ''}${d.getDate()} ${MON[d.getMonth()]}`; }
  function fmtTime(m) { const h = Math.floor(m / 60) % 24, mm = m % 60; const h12 = h % 12 || 12; return `${h12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; }
  const qtyLabel = (q, unit) => E.qtyText(q, unit);

  const I = {
    today: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/></svg>',
    week: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    mess: '<svg viewBox="0 0 24 24"><path d="M4 11h16a8 8 0 0 1-16 0zM8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/></svg>',
    foods: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    progress: '<svg viewBox="0 0 24 24"><path d="M4 19h16M6 16l4-5 3 3 5-7"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24"><path d="M16 4h4v4M4 20l16-16M20 16v4h-4M15 15l5 5M4 4l5 5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    scale: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8 9a5 5 0 0 1 8 0l-3 3"/></svg>',
  };

  // ---------- toast ----------
  function toast(msg, undo) {
    const root = $('#toast-root');
    clearTimeout(toastTimer);
    root.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${undo ? '<button data-act="undo">Undo</button>' : ''}</div>`;
    root._undo = undo || null;
    toastTimer = setTimeout(() => { root.innerHTML = ''; root._undo = null; }, undo ? 5000 : 2600);
  }

  // ---------- sheet ----------
  function openSheet(html, ctx) {
    sheetCtx = ctx || null;
    $('#toast-root').innerHTML = '';
    $('#sheet-root').innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="in"><div class="grab"></div>${html}</div></div>`;
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() { $('#sheet-root').innerHTML = ''; sheetCtx = null; document.body.style.overflow = ''; }
  const sheetOpen = () => !!$('#sheet-root').innerHTML;
  const sheetHead = (title, sub) => `<div class="sheet-h"><div><h2>${esc(title)}</h2>${sub ? `<div class="muted small">${sub}</div>` : ''}</div><button class="icon-btn" data-act="closeSheet" aria-label="Close">${I.close}</button></div>`;

  // ---------- logging ----------
  function addEntry(dateKey, f, q, meal, kpu) {
    const day = E.ensureDay(S, dateKey);
    const e = { id: uid(), f: f.id || null, name: f.name, unit: f.unit, q: E.round(q, 2), kpu: kpu != null ? kpu : E.kcalOf(S, f), m: meal, t: Date.now() };
    day.log.push(e);
    return e;
  }
  function logItems(dateKey, items, meal) {
    const ids = items.map((it) => {
      const f = E.food(S, it.id) || { id: it.id, name: it.name, unit: it.unit };
      return addEntry(dateKey, f, it.q, meal, it.kpu).id;
    });
    return () => { const d = E.getDay(S, dateKey); d.log = d.log.filter((e) => !ids.includes(e.id)); };
  }
  function defaultMeal() {
    if (viewDate !== todayKey()) return 'lunch';
    const n = nowMin();
    let best = 'breakfast';
    E.SLOTS.forEach((s) => { if (n >= s.start - 30) best = s.id; });
    return best;
  }
  function frequentFoods() {
    const count = {};
    Object.values(S.days).forEach((d) => (d.log || []).forEach((e) => { if (e.f) count[e.f] = (count[e.f] || 0) + 1; }));
    const ranked = Object.keys(count).sort((a, b) => count[b] - count[a]);
    const defaults = ['roti', 'rice', 'dal', 'banana', 'milk', 'peanut_butter', 'almonds', 'dates', 'curd', 'bread', 'paratha', 'lassi'];
    const out = [];
    ranked.concat(defaults).forEach((id) => { const f = E.food(S, id); if (f && !out.includes(id) && E.allowed(S, f)) out.push(id); });
    return out.slice(0, 10);
  }

  // ---------- shared renderers ----------
  function itemsList(items, source) {
    return `<ul>${items.map((it) => {
      const top = source === 'mess' && it.room;
      return `<li class="${top ? 'top' : ''}"><span><span class="q">${esc(qtyLabel(it.q, it.unit))}</span> ${esc(it.name)}${top ? ' <span class="r">from your room</span>' : ''}</span><span class="r">${fmt(it.kcal)}</span></li>`;
    }).join('')}</ul>`;
  }
  function planCard(m, opts = {}) {
    const src = m.source === 'mess' ? '<span class="badge mess">Mess</span>' : '<span class="badge room">Room</span>';
    const time = m.start != null ? `<span class="time">${fmtTime(m.start)} – ${fmtTime(m.end)}</span>` : '';
    let note = '';
    if (m.generic) note += `<div class="note">No mess menu set for this meal, so this is a typical plate. Add the real menu on the Mess tab.</div>`;
    if (m.skipped && m.skipped.length) note += `<div class="note">Leaving out: ${esc(m.skipped.join(', '))} (your preferences).</div>`;
    if (m.replaced && !opts.readonly) note += `<div class="note">Replacing the mess meal. <button class="btn ghost sm" data-act="useMess" data-slot="${m.slot}">Use mess menu</button></div>`;
    if (m.empty) note += `<div class="note">Nothing usable in your room. Mark what you have on the Foods tab.</div>`;
    const acts = opts.readonly ? '' : `<div class="acts">
      <button class="btn primary sm" data-act="ate" data-slot="${m.slot}">${I.check}Ate this</button>
      <button class="btn sm" data-act="swap" data-slot="${m.slot}">${m.source === 'mess' ? 'Replace' : 'Swap'}</button>
      <button class="btn sm ghost" data-act="skip" data-slot="${m.slot}">Skip</button></div>`;
    return `<article class="pcard ${opts.now ? 'now' : ''}">
      <div class="ph"><h3>${esc(m.name)}${time}</h3>${opts.now ? '<span class="badge now">Now</span>' : src}<span class="kcal">~${fmt(m.kcal)}<small> kcal</small></span></div>
      ${m.items.length ? itemsList(m.items, m.source) : ''}${note}${acts}</article>`;
  }
  function weightOn(k) { const d = S.days[k]; return d && d.weight != null ? d.weight : null; }
  function latestWeight() { const w = E.weights(S); return w.length ? w[w.length - 1] : null; }

  // ---------- TODAY ----------
  function plateSVG(p, slots) {
    const C = 2 * Math.PI * 60;
    const colors = { breakfast: 'var(--leaf)', mid: 'var(--turmeric)', lunch: 'var(--leaf-2)', evening: 'color-mix(in srgb, var(--turmeric) 55%, var(--leaf))', dinner: 'var(--leaf)', late: 'var(--turmeric)' };
    let off = 0;
    const segs = [];
    const over = p.eaten > p.target;
    slots.filter((s) => s.eatenKcal > 0).forEach((s) => {
      const frac = Math.min(1 - off / C, s.eatenKcal / Math.max(p.target, p.eaten));
      const len = Math.max(0, frac * C - 2);
      segs.push(`<circle class="seg" cx="75" cy="75" r="60" fill="none" stroke="${over ? 'var(--turmeric)' : colors[s.id]}" stroke-width="16" stroke-dasharray="${len} ${C}" stroke-dashoffset="${-off}"/>`);
      off += frac * C;
    });
    return `<svg viewBox="0 0 150 150" aria-hidden="true"><circle class="rim" cx="75" cy="75" r="72" fill="none" stroke-width="1.5"/><circle class="track" cx="75" cy="75" r="60" fill="none" stroke-width="16"/>${segs.join('')}</svg>`;
  }

  function vToday() {
    const tk = todayKey();
    const isToday = viewDate === tk;
    const p = E.planDay(S, viewDate, isToday ? nowMin() : 99999);
    const day = E.getDay(S, viewDate);
    const log = day.log || [];
    const diff = E.diffDays(viewDate, tk);
    const eyebrow = isToday ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
    if (!logMeal) logMeal = defaultMeal();
    const left = p.remaining;
    const eatenSlots = p.slots.filter((s) => s.eatenKcal > 0);
    const w = weightOn(viewDate);

    let html = `<header class="topbar">
      <button class="icon-btn" data-act="prevDay" aria-label="Previous day">${I.left}</button>
      <div class="title"><div class="eyebrow">${eyebrow}</div><h1>${fmtDate(viewDate)}</h1></div>
      <button class="icon-btn" data-act="nextDay" aria-label="Next day" ${isToday ? 'disabled' : ''}>${I.right}</button>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${I.gear}</button></header>`;

    html += `<section class="card hero" aria-label="Calories">
      <div class="plate">${plateSVG(p, p.slots)}<div class="center"><b>${fmt(Math.abs(left))}</b><span>${left >= 0 ? 'kcal left' : 'kcal over target'}</span></div></div>
      <div class="stats">
        <div class="stat target"><div class="k">Target</div><div class="v">${fmt(p.target)}</div></div>
        <div class="stat"><div class="k">Eaten</div><div class="v">${fmt(p.eaten)}</div></div>
        <div class="stat left"><div class="k">Remaining</div><div class="v">${fmt(Math.max(0, left))}</div></div>
        <div class="stat plan"><div class="k">${isToday ? 'Suggested' : 'Hit'}</div><div class="v">${isToday ? fmt(p.planned) : Math.round((p.eaten / p.target) * 100) + '<small>%</small>'}</div></div>
      </div>
      <div class="hero-foot">${eatenSlots.length ? `<div class="legend">${eatenSlots.map((s) => `<span>${esc(s.name)} ${fmt(s.eatenKcal)}</span>`).join(' · ')}</div>` : '<span>Nothing logged yet</span>'}
      ${isToday && p.plan.length ? `<span>Plan: mess ~${fmt(p.messKcal)} · room ~${fmt(p.roomKcal)}</span>` : ''}</div>
    </section>`;

    if (isToday) html += `<button class="eat-now" data-act="eatNow">${I.bolt}What should I eat now?</button>`;

    html += `<div class="mini"><span>${I.scale.replace('<svg', '<svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2"')}</span><b>${w != null ? `Weight: <span class="num">${w} kg</span>` : 'Morning weight not logged'}</b><button class="btn sm" data-act="weight" data-date="${viewDate}">${w != null ? 'Edit' : 'Log weight'}</button></div>`;

    // log bar
    const mealOpts = E.SLOTS.map((s) => `<option value="${s.id}" ${s.id === logMeal ? 'selected' : ''}>${s.name}</option>`).join('');
    html += `<section class="logbar" aria-label="Log food">
      <div class="logrow"><input id="q" class="input" type="text" placeholder="Log food — e.g. 2 rotis" autocomplete="off" autocapitalize="off" enterkeyhint="done" data-input="logQ" aria-label="Food and quantity">
      <select id="mealSel" class="select" data-change="logMeal" aria-label="Meal">${mealOpts}</select></div>
      <div id="sugg" class="sugg"></div>
      <div class="chips" aria-label="Quick add">${frequentFoods().map((id) => { const f = E.food(S, id); const q = E.porOf(f)[1]; return `<button class="chip" data-act="quick" data-id="${id}">+ ${esc(qtyLabel(q, f.unit).replace(' ×', ''))} ${esc(f.name.replace(/ \(.*\)/, ''))}</button>`; }).join('')}</div>
    </section>`;

    // eaten
    html += `<div class="sec-h"><h2>Eaten</h2><span class="muted small">${log.length} item${log.length === 1 ? '' : 's'}</span></div><section class="card">`;
    if (!log.length) html += `<div class="empty">Type what you ate above, or tap “Ate this” on a planned meal.</div>`;
    E.SLOTS.forEach((s) => {
      const items = log.filter((e) => e.m === s.id);
      if (!items.length) return;
      html += `<div class="meal-group"><div class="meal-head"><span>${s.name}</span><span class="num">${fmt(E.sum(items, E.entryKcal))} kcal</span></div>`;
      items.forEach((e) => {
        html += `<div class="row"><button class="name" data-act="editEntry" data-id="${e.id}">${esc(e.name)}<small>${esc(qtyLabel(e.q, e.unit))} · tap to edit</small></button>
          <div class="stepper"><button data-act="step" data-id="${e.id}" data-d="-1" aria-label="Less">−</button><span>${esc(E.fmtQty(e.q))}${e.unit === 'pc' ? '' : ' ' + esc(e.unit)}</span><button data-act="step" data-id="${e.id}" data-d="1" aria-label="More">+</button></div>
          <span class="kc">${fmt(E.entryKcal(e))}</span></div>`;
      });
      html += `</div>`;
    });
    html += `</section>`;

    // rest of the day
    if (isToday) {
      html += `<div class="sec-h"><h2>Rest of today</h2><span class="muted small">~${fmt(p.planned)} of ${fmt(Math.max(0, left))} left</span></div>`;
      html += `<section class="plan">`;
      if (left <= 60) html += `<div class="callout">Target reached. Anything more today is a bonus, not a requirement.</div>`;
      const n = nowMin();
      p.plan.forEach((m, i) => { html += planCard(m, { now: i === 0 && m.start <= n + 20 }); });
      if (p.overflow > 150) html += `<div class="callout tip">About ${fmt(p.overflow)} kcal won’t fit comfortably today. Eat what you can; tomorrow’s plan resets.</div>`;
      p.slots.filter((s) => s.status === 'missed' || s.status === 'skipped').forEach((s) => {
        if (s.status === 'skipped') html += `<div class="mini"><b>${s.name} skipped</b><button class="btn sm" data-act="unskip" data-slot="${s.id}">Undo</button></div>`;
        else if (s.id !== 'late') html += `<div class="mini"><b>${s.name}: nothing logged</b><button class="btn sm" data-act="logUsual" data-slot="${s.id}">I ate the usual</button><button class="btn sm ghost" data-act="skip" data-slot="${s.id}">Skipped</button></div>`;
      });
      html += `</section>`;
    }
    html += `<p class="disclaimer">All calories are estimates. Real values depend on recipe and portion size; tap any item to correct it.</p>`;
    return html;
  }

  function renderSuggestions(text) {
    const box = $('#sugg');
    if (!box) return;
    if (!text.trim()) { box.innerHTML = ''; lastMatches = []; return; }
    const r = E.parse(S, text);
    lastMatches = r.matches;
    let h = r.matches.map((m, i) => `<button data-act="addSugg" data-i="${i}"><span><b>${esc(qtyLabel(m.qty, m.food.unit))}</b> ${esc(m.food.name)}${E.allowed(S, m.food) ? '' : ' <span class="tag no">pref</span>'}</span><span class="kc">${fmt(m.kcal)}</span></button>`).join('');
    h += `<button data-act="customFood" data-name="${esc(r.parts.name || text)}"><span>+ Add “${esc(r.parts.name || text)}” with my own calories</span><span class="kc">kcal?</span></button>`;
    box.innerHTML = h;
  }
  function addFromMatch(m) {
    const meal = $('#mealSel') ? $('#mealSel').value : defaultMeal();
    const e = addEntry(viewDate, m.food, m.qty, meal);
    const d = viewDate;
    save();
    lastMatches = [];
    render();
    toast(`Added ${qtyLabel(e.q, e.unit)} ${e.name} · ${fmt(E.entryKcal(e))} kcal`, () => { const day = E.getDay(S, d); day.log = day.log.filter((x) => x.id !== e.id); commit(); });
  }

  // ---------- Eat-now sheet ----------
  function openEatNow() {
    const r = E.eatNow(S, todayKey(), nowMin());
    let h = sheetHead('What should I eat now?');
    h += `<div class="now-hero"><div class="big">${fmt(Math.max(0, r.remaining))}<small>kcal</small></div><div class="muted">left today · target ${fmt(r.target)} · eaten ${fmt(r.eaten)}</div></div>`;
    const block = (m, label) => `<article class="pcard now"><div class="ph"><h3>${esc(label)}${m.source === 'mess' ? '<span class="time">at the mess</span>' : '<span class="time">from your room, no cooking</span>'}</h3><span class="kcal">~${fmt(m.kcal)}<small> kcal</small></span></div>${itemsList(m.items, m.source)}
      <div class="acts" style="grid-template-columns:1fr"><button class="btn primary" data-act="ateNow" data-slot="${m.slot}">${I.check}I ate this</button></div></article>`;
    const later = (m) => m ? `<div class="mini"><b>Then: ${esc(m.name)}${m.source === 'mess' ? ' at the mess' : ''} from ${fmtTime(m.start)}</b><span class="num">~${fmt(m.kcal)}</span></div>` : '';
    if (r.kind === 'done') h += `<div class="callout">You’ve hit today’s target. If you’re hungry, have something you enjoy — it all counts.</div>`;
    else if (r.kind === 'now') { h += block(r.now, `Have now: ${r.now.name}`); h += later(r.next); }
    else if (r.kind === 'bridge') { h += block(r.now, 'Small snack now'); h += later(r.next); h += `<p class="muted small">Your next meal is ${Math.round(r.wait / 60 * 10) / 10} h away. A snack now makes the day easier to finish.</p>`; }
    else if (r.kind === 'wait') { h += `<div class="callout">Nothing urgent. Your next meal is at ${fmtTime(r.next.start)} — or have it now if you’re hungry.</div>`; h += block(r.next, `Next: ${r.next.name}`); r.now = r.next; }
    else h += `<div class="callout tip">Nothing left to plan today. Add room foods on the Foods tab so I can suggest snacks.</div>`;
    sheetCtx = null;
    openSheet(h, { eatNow: r });
  }

  // ---------- Entry editor ----------
  function openEntry(id) {
    const day = E.getDay(S, viewDate);
    const e = day.log.find((x) => x.id === id);
    if (!e) return;
    const f = E.food(S, e.f);
    const unit = e.unit === 'pc' ? 'piece' : e.unit;
    let h = sheetHead(e.name, `${slotName(e.m)} · ${fmtDate(viewDate)}`);
    h += `<div class="bigstep"><button data-act="es" data-d="-1" aria-label="Less">−</button><div class="val"><input id="esQ" type="number" inputmode="decimal" step="any" value="${e.q}" data-input="esCalc" aria-label="Quantity"><small>${esc(unit)}</small></div><button data-act="es" data-d="1" aria-label="More">+</button></div>
      <div class="two"><label class="field"><span>kcal per ${esc(unit)}</span><input id="esK" class="input" type="number" inputmode="decimal" step="any" value="${E.round(e.kpu, 2)}" data-input="esCalc"></label>
      <label class="field"><span>Meal</span><select id="esM" class="input select" style="width:100%">${E.SLOTS.map((s) => `<option value="${s.id}" ${s.id === e.m ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label></div>
      ${f ? `<label class="check"><input type="checkbox" id="esR"> Use this kcal for ${esc(f.name)} from now on</label>` : ''}
      <div class="callout" id="esT">Total ≈ <b>${fmt(E.entryKcal(e))} kcal</b></div>
      <div class="two"><button class="btn danger" data-act="esDel">Delete</button><button class="btn primary" data-act="esSave">Save</button></div>`;
    openSheet(h, { entry: id, step: E.stepOf(f || { unit: e.unit }) });
  }

  // ---------- Custom food ----------
  const UNITS = [['pc', 'piece'], ['plate', 'plate'], ['cup', 'cup (240 ml)'], ['bowl', 'bowl (200 ml)'], ['slice', 'slice'], ['tbsp', 'tbsp'], ['tsp', 'tsp'], ['g', 'gram'], ['ml', 'ml']];
  function openCustom(name, fromLog) {
    let h = sheetHead(fromLog ? 'Log a food' : 'New food', 'Your own calorie estimate');
    h += `<label class="field"><span>Name</span><input id="cfN" class="input" value="${esc(name || '')}" placeholder="e.g. Mess paneer roll"></label>
      <div class="two"><label class="field"><span>Measured per</span><select id="cfU" class="input select" style="width:100%">${UNITS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      <label class="field"><span>kcal per unit</span><input id="cfK" class="input" type="number" inputmode="decimal" placeholder="e.g. 180"></label></div>
      ${fromLog ? `<label class="field"><span>How many did you eat?</span><input id="cfQ" class="input" type="number" inputmode="decimal" value="1"></label>` : ''}
      <label class="check"><input type="checkbox" id="cfR"> I keep this in my room (planner can suggest it)</label>
      ${fromLog ? '<label class="check"><input type="checkbox" id="cfS" checked> Save to my foods for next time</label>' : ''}
      <p class="muted small">Not sure? Check the pack label, or use a similar food’s number. You can change it later.</p>
      <button class="btn primary block" data-act="cfSave">${fromLog ? 'Log it' : 'Save food'}</button>`;
    openSheet(h, { custom: true, fromLog });
  }
  function porForUnit(u) {
    return { pc: [1, 1, 3, 1], plate: [1, 1, 2, 0.5], cup: [0.5, 1, 2, 0.5], bowl: [0.5, 1, 2, 0.5], slice: [1, 2, 4, 1], tbsp: [1, 1, 3, 0.5], tsp: [1, 1, 3, 1], g: [20, 30, 100, 5], ml: [100, 250, 400, 50] }[u] || [1, 1, 3, 1];
  }

  // ---------- Settings ----------
  function openSettings(extra) {
    const s = S.settings;
    let h = sheetHead('Settings');
    h += `<section class="card flat" style="display:grid;gap:12px"><label class="field"><span>Daily calorie target</span></label>
      <div class="bigstep"><button data-act="tgt" data-d="-50" aria-label="Lower">−</button><div class="val"><input id="stT" type="number" inputmode="numeric" value="${s.target}" data-input="stT" aria-label="Daily target"><small>kcal / day</small></div><button data-act="tgt" data-d="50" aria-label="Higher">+</button></div>
      <div class="chips wrap" style="justify-content:center">${[2200, 2400, 2600, 2800].map((v) => `<button class="chip ${v === s.target ? 'on' : ''}" data-act="tgtSet" data-v="${v}">${fmt(v)}</button>`).join('')}</div>
      <p class="muted small" style="margin:0;text-align:center">Applies to today and future days. Past days keep their own target.</p></section>
      <section class="card flat" style="display:grid;gap:12px"><h3>Goal</h3>
      <div class="two"><label class="field"><span>Start weight (kg)</span><input id="stSW" class="input" type="number" inputmode="decimal" step="0.1" value="${s.startWeight}"></label>
      <label class="field"><span>Goal weight (kg)</span><input id="stGW" class="input" type="number" inputmode="decimal" step="0.1" value="${s.goalWeight}"></label>
      <label class="field"><span>Start date</span><input id="stSD" class="input" type="date" value="${s.startDate}"></label>
      <label class="field"><span>Goal date</span><input id="stGD" class="input" type="date" value="${s.goalDate}"></label></div>
      <label class="field"><span>Estimated maintenance (kcal/day)</span><input id="stM" class="input" type="number" inputmode="numeric" value="${s.maintenance}"></label>
      <p class="muted small" style="margin:0">Roughly what keeps your weight steady. Used for forecasts until you have a week of weigh-ins; then the app uses your real trend instead.</p>
      <button class="btn primary" data-act="saveGoal">Save goal</button></section>
      <details class="card flat"><summary>Backup &amp; restore</summary><div style="display:grid;gap:10px;margin-top:12px">
      <p class="muted small" style="margin:0">Your data lives only on this phone. Copy a backup now and then and keep it in Notes.</p>
      <button class="btn" data-act="exportData">Copy backup</button>
      <textarea id="impT" class="input" placeholder="Paste a backup here to restore"></textarea>
      <div class="two"><label class="btn" style="position:relative;overflow:hidden">Choose file<input type="file" accept=".json,application/json,text/plain" data-change="importFile" style="position:absolute;inset:0;opacity:0"></label><button class="btn" data-act="importData">Restore pasted</button></div></div></details>
      <details class="card flat"><summary>About the numbers</summary><div class="muted small" style="display:grid;gap:8px;margin-top:10px">
      <p style="margin:0">Calories are estimates from a built-in table of common Indian and hostel foods. Correct any item and the app remembers it.</p>
      <p style="margin:0">Forecasts assume ~7,700 kcal per kg of body weight. Early gains include water and food weight, so treat them as rough guides.</p>
      <p style="margin:0">Your BMI is well below the usual range, so a check-up with a doctor or dietitian is worthwhile — especially with dizziness, fainting or unusual tiredness, or if you’ve been eating very little for a long time. Raise intake step by step rather than all at once.</p></div></details>
      <button class="btn danger block" data-act="reset">${extra === 'confirm' ? 'Tap again to erase everything' : 'Erase all data'}</button>`;
    openSheet(h, { settings: true, confirmReset: extra === 'confirm' });
  }

  // ---------- Weight ----------
  function openWeight(dateKey) {
    const cur = weightOn(dateKey);
    const lw = latestWeight();
    const v = cur != null ? cur : lw ? lw.kg : S.settings.startWeight;
    let h = sheetHead('Morning weight', `${fmtDate(dateKey)} · after the bathroom, before eating`);
    h += `<div class="bigstep"><button data-act="wstep" data-d="-0.1" aria-label="Less">−</button><div class="val"><input id="wV" type="number" inputmode="decimal" step="0.1" value="${v}" aria-label="Weight in kg"><small>kg</small></div><button data-act="wstep" data-d="0.1" aria-label="More">+</button></div>
      <label class="field"><span>Date</span><input id="wD" class="input" type="date" value="${dateKey}" max="${todayKey()}"></label>
      <div class="two"><button class="btn danger" data-act="wDel" ${cur == null ? 'disabled' : ''}>Remove</button><button class="btn primary" data-act="wSave">Save</button></div>`;
    openSheet(h, { weight: true });
  }

  // ---------- Picker (search foods to add somewhere) ----------
  function openPicker(opts) {
    let h = sheetHead(opts.title, opts.sub || '');
    h += `<input id="pkQ" class="input" placeholder="Search foods" autocomplete="off" data-input="pickQ" aria-label="Search foods"><div id="pkL" class="list"></div>
      <button class="btn block" data-act="pkCustom">+ Food not listed</button><button class="btn primary block" data-act="closeSheet">Done</button>`;
    openSheet(h, Object.assign({ picker: true }, opts));
    renderPicker('');
  }
  function renderPicker(q) {
    const ctx = sheetCtx;
    if (!ctx || !ctx.picker) return;
    let foods;
    if (q.trim()) foods = E.parse(S, q, 30).matches.map((m) => m.food);
    else foods = E.allFoods(S).slice().sort((a, b) => (ctx.prefer && a.where === ctx.prefer ? -1 : 0) - (ctx.prefer && b.where === ctx.prefer ? -1 : 0) || a.name.localeCompare(b.name));
    const sel = ctx.selected ? ctx.selected() : [];
    $('#pkL').innerHTML = foods.slice(0, 60).map((f) => {
      const on = sel.includes(f.id);
      return `<div class="li"><button class="main" data-act="pick" data-id="${f.id}"><b>${esc(f.name)}</b><small>${fmt(E.kcalOf(S, f) * (f.unit === 'g' || f.unit === 'ml' ? 100 : 1))} kcal per ${f.unit === 'g' ? '100 g' : f.unit === 'ml' ? '100 ml' : f.unit === 'pc' ? 'piece' : f.unit}</small></button>${on ? `<span class="tag pri">Added</span>` : `<button class="btn sm" data-act="pick" data-id="${f.id}">Add</button>`}</div>`;
    }).join('') || '<div class="empty">No match. Add it as your own food below.</div>';
  }

  // ---------- Food editor ----------
  function prefOf(id) { const p = S.prefs; return p.prioritize.includes(id) ? 'pri' : p.never.includes(id) ? 'never' : p.dislike.includes(id) ? 'dislike' : p.noAccess.includes(id) ? 'noAccess' : 'normal'; }
  function setPref(id, v) {
    ['prioritize', 'never', 'dislike', 'noAccess'].forEach((k) => { S.prefs[k] = S.prefs[k].filter((x) => x !== id); });
    const map = { pri: 'prioritize', never: 'never', dislike: 'dislike', noAccess: 'noAccess' };
    if (map[v]) S.prefs[map[v]].push(id);
  }
  function openFood(id) {
    const f = E.food(S, id);
    if (!f) return;
    const isCustom = (S.custom || []).includes(f);
    const inRoom = E.roomList(S).includes(id);
    const pr = prefOf(id);
    const per = f.unit === 'pc' ? 'piece' : f.unit;
    let h = sheetHead(f.name, isCustom ? 'Your food' : 'Built-in estimate');
    h += `<label class="field"><span>kcal per ${esc(per)}${f.unit === 'g' || f.unit === 'ml' ? ` (e.g. 100 ${f.unit} = ${fmt(E.kcalOf(S, f) * 100)} kcal)` : ''}</span><input id="fdK" class="input" type="number" inputmode="decimal" step="any" value="${E.kcalOf(S, f)}"></label>
      ${S.overrides[id] != null && !isCustom ? `<p class="muted small" style="margin:0">Built-in value: ${f.kcal} kcal. <button class="btn ghost sm" data-act="fdReset" data-id="${id}">Reset</button></p>` : ''}
      <div class="field"><span>In plans</span><div class="seg-ctl" role="radiogroup">${[['normal', 'Normal'], ['pri', 'Prioritise'], ['never', 'Never suggest']].map(([v, l]) => `<button class="${pr === v || (v === 'never' && (pr === 'dislike' || pr === 'noAccess')) ? 'on' : ''}" data-act="fdPref" data-v="${v}" role="radio" aria-checked="${pr === v}">${l}</button>`).join('')}</div></div>
      <div class="li"><div class="main"><b>Keep in my room</b><small>Shows in your room list with an in-stock switch</small></div><label class="switch"><input type="checkbox" id="fdRoom" ${inRoom ? 'checked' : ''} aria-label="Keep in my room"><span></span></label></div>
      <div class="two">${isCustom ? `<button class="btn danger" data-act="fdDel" data-id="${id}">Delete food</button>` : '<span></span>'}<button class="btn primary" data-act="fdSave" data-id="${id}">Save</button></div>`;
    openSheet(h, { food: id, pref: pr });
  }

  // ---------- WEEK ----------
  function vWeek() {
    const tk = todayKey();
    const wp = E.weekPlan(S, tk);
    const d = wp.days[weekIdx] || wp.days[0];
    let h = `<header class="topbar"><div class="title"><div class="eyebrow">Next 7 days · ${fmt(S.settings.target)} kcal/day</div><h1>Weekly plan</h1></div>
      <button class="icon-btn" data-act="reshuffle" aria-label="New room-food mix">${I.shuffle}</button></header>`;
    h += `<div class="daystrip" role="tablist">${wp.days.map((x, i) => { const dd = E.parseKey(x.date); return `<button class="day ${i === weekIdx ? 'on' : ''}" data-act="weekDay" data-i="${i}" role="tab" aria-selected="${i === weekIdx}"><span class="d">${i === 0 ? 'Today' : WDN[E.weekdayOf(x.date)]}</span><span class="n">${dd.getDate()}</span><span class="k">${fmt(x.planned)}</span></button>`; }).join('')}</div>`;
    h += `<section class="tiles"><div class="tile"><div class="k">Planned</div><div class="v">${fmt(d.planned)}</div></div><div class="tile"><div class="k">From mess</div><div class="v">${fmt(d.messKcal)}</div></div><div class="tile"><div class="k">From room</div><div class="v">${fmt(d.roomKcal)}</div></div></section>`;
    if (weekIdx === 0) h += `<div class="callout tip">This is today’s full-day plan. The Today tab re-plans as you log.</div>`;
    h += `<section class="plan">${d.plan.map((m) => planCard(m, { readonly: true })).join('')}</section>`;
    h += `<details class="card" open><summary>Room food for the week</summary><div class="list" style="margin-top:8px">${wp.shop.map((s) => {
      let q = s.q; let u = s.unit;
      if (u === 'ml' && q >= 1000) { q = E.round(q / 1000, 2); u = 'L'; }
      return `<div class="li"><div class="main"><b>${esc(s.name)}</b></div><span class="num">${u === 'pc' ? Math.ceil(q) : E.fmtQty(E.round(q, 1)) + ' ' + esc(u)}</span></div>`;
    }).join('') || '<div class="empty">No room food needed. Your mess menu covers the plan.</div>'}</div></details>`;
    h += `<p class="disclaimer">Built from your mess menu, what’s in your room and your preferences. Calories are estimates.</p>`;
    return h;
  }

  // ---------- MESS ----------
  function vMess() {
    let h = `<header class="topbar"><div class="title"><div class="eyebrow">Hostel mess</div><h1>Mess menu</h1></div></header>`;
    if (S.messSample) h += `<div class="example-banner"><span>This is a sample menu. Change it to match your mess.</span><button class="btn sm" data-act="messOk">Done</button></div>`;
    h += `<div class="daystrip" role="tablist">${WD_ORDER.map((wd) => `<button class="day ${wd === messWd ? 'on' : ''}" data-act="messDay" data-wd="${wd}" role="tab" aria-selected="${wd === messWd}" style="width:52px"><span class="d">${WDN[wd]}</span><span class="k">${(S.mess[wd] ? ['breakfast', 'lunch', 'dinner'].reduce((t, s) => t + ((S.mess[wd][s] || []).length), 0) : 0)} items</span></button>`).join('')}</div>`;
    h += `<h2 style="font-size:19px">${WD_FULL[messWd]}</h2>`;
    ['breakfast', 'lunch', 'dinner'].forEach((slot) => {
      const ids = ((S.mess[messWd] || {})[slot]) || [];
      const typ = E.sum(ids, (id) => { const f = E.food(S, id); return f ? E.porOf(f)[1] * E.kcalOf(S, f) : 0; });
      h += `<section class="card" style="display:grid;gap:10px"><div class="sec-h" style="margin:0"><h3>${slotName(slot)}</h3><span class="muted small">${ids.length ? `~${fmt(typ)} kcal at normal portions` : 'Not set'}</span></div>
        <div class="chips wrap">${ids.map((id) => { const f = E.food(S, id); return f ? `<button class="chip soft" data-act="messRm" data-slot="${slot}" data-id="${id}" aria-label="Remove ${esc(f.name)}">${esc(f.name)} <span class="x">×</span></button>` : ''; }).join('')}
        <button class="chip" data-act="messAdd" data-slot="${slot}">+ Add</button></div></section>`;
    });
    h += `<div class="two"><button class="btn" data-act="messCopy">Copy ${WDN[messWd]} to…</button><button class="btn ghost" data-act="messClear">Clear ${WDN[messWd]}</button></div>`;
    h += `<p class="disclaimer">The planner uses these as your main meals and sizes portions to your target. Room food fills whatever is left.</p>`;
    return h;
  }

  // ---------- FOODS ----------
  function vFoods() {
    let h = `<header class="topbar"><div class="title"><div class="eyebrow">Room stock & food list</div><h1>Foods</h1></div></header>`;
    h += `<div class="seg-ctl" role="tablist">${[['room', 'My room'], ['db', 'All foods'], ['prefs', 'Preferences']].map(([v, l]) => `<button class="${foodsTab === v ? 'on' : ''}" data-act="foodsTab" data-v="${v}" role="tab" aria-selected="${foodsTab === v}">${l}</button>`).join('')}</div>`;
    if (foodsTab === 'room') {
      const ids = E.roomList(S);
      const inS = ids.filter((id) => S.stock[id]);
      const outS = ids.filter((id) => !S.stock[id]);
      const row = (id) => { const f = E.food(S, id); const ok = E.allowed(S, f); return `<div class="li"><button class="main" data-act="openFood" data-id="${id}"><b>${esc(f.name)} ${ok ? '' : '<span class="tag no">hidden</span>'}</b><small>${fmt(E.kcalOf(S, f) * E.porOf(f)[1])} kcal per ${esc(qtyLabel(E.porOf(f)[1], f.unit).replace(' ×', ''))}${f.unit === 'pc' ? ' pc' : ''}</small></button><label class="switch"><input type="checkbox" data-change="stock" data-id="${id}" ${S.stock[id] ? 'checked' : ''} aria-label="${esc(f.name)} in stock"><span></span></label></div>`; };
      h += `<div class="callout">${inS.length} of ${ids.length} in stock. The planner only suggests what’s switched on.</div>`;
      h += `<section class="card"><h3 style="font-size:16px">In stock</h3><div class="list">${inS.map(row).join('') || '<div class="empty">Nothing in stock</div>'}</div></section>`;
      h += `<section class="card"><h3 style="font-size:16px">Out of stock</h3><div class="list">${outS.map(row).join('') || '<div class="empty">Everything is in stock</div>'}</div></section>`;
      h += `<button class="btn block" data-act="roomAdd">${I.plus}Add something to my room</button>`;
    } else if (foodsTab === 'db') {
      h += `<div class="logrow"><input id="dbQ" class="input" placeholder="Search ${E.allFoods(S).length} foods" value="${esc(dbQuery)}" data-input="dbQ" aria-label="Search foods"><button class="btn primary" data-act="newFood">${I.plus}New</button></div>`;
      h += `<section class="card"><div class="list" id="dbL">${dbList()}</div></section>`;
      h += `<p class="disclaimer">Tap a food to change its calories or how the planner uses it.</p>`;
    } else {
      const p = S.prefs;
      const tog = (k, l, d) => `<div class="li"><div class="main"><b>${l}</b><small>${d}</small></div><label class="switch"><input type="checkbox" data-change="prefTog" data-k="${k}" ${p[k] ? 'checked' : ''} aria-label="${l}"><span></span></label></div>`;
      h += `<section class="card"><div class="list">${tog('veg', 'Vegetarian', 'Hide meat and fish')}${tog('eggless', 'Eggless', 'Hide eggs and egg dishes')}</div></section>`;
      const lists = [['prioritize', 'Prioritise', 'Picked first when they fit'], ['dislike', 'Foods I dislike', 'Never planned, even from the mess menu'], ['noAccess', 'No access', 'Can’t get these right now'], ['never', 'Don’t suggest', 'Keep out of plans for any reason']];
      lists.forEach(([k, l, d]) => {
        h += `<section class="card" style="display:grid;gap:10px"><div><h3 style="font-size:16px">${l}</h3><div class="muted small">${d}</div></div><div class="chips wrap">${p[k].map((id) => { const f = E.food(S, id); return f ? `<button class="chip soft" data-act="prefRm" data-k="${k}" data-id="${id}">${esc(f.name)} <span class="x">×</span></button>` : ''; }).join('')}<button class="chip" data-act="prefAdd" data-k="${k}" data-l="${l}">+ Add</button></div></section>`;
      });
    }
    return h;
  }
  function dbList() {
    const foods = dbQuery.trim() ? E.parse(S, dbQuery, 80).matches.map((m) => m.food) : E.allFoods(S).slice().sort((a, b) => a.name.localeCompare(b.name));
    return foods.map((f) => {
      const tags = [];
      if ((S.custom || []).includes(f)) tags.push('<span class="tag">yours</span>');
      if (S.overrides[f.id] != null) tags.push('<span class="tag">edited</span>');
      const pr = prefOf(f.id);
      if (pr === 'pri') tags.push('<span class="tag pri">priority</span>');
      if (pr !== 'normal' && pr !== 'pri') tags.push('<span class="tag no">off</span>');
      const per = f.unit === 'g' || f.unit === 'ml' ? `100 ${f.unit}` : f.unit === 'pc' ? 'piece' : f.unit;
      return `<div class="li"><button class="main" data-act="openFood" data-id="${f.id}"><b>${esc(f.name)} ${tags.join(' ')}</b><small>${fmt(E.kcalOf(S, f) * (f.unit === 'g' || f.unit === 'ml' ? 100 : 1))} kcal per ${per}</small></button></div>`;
    }).join('') || '<div class="empty">No match</div>';
  }

  // ---------- PROGRESS ----------
  function exampleState() {
    const st = JSON.parse(JSON.stringify(S));
    st.days = {};
    const end = todayKey();
    const n = 18;
    st.settings.startDate = E.addDays(end, -n);
    st.settings.goalDate = E.addDays(end, 34 - n);
    let w = st.settings.startWeight;
    for (let i = n; i >= 0; i--) {
      const k = E.addDays(end, -i);
      const r = E.hash(k) % 1000 / 1000;
      const kcal = Math.round(1800 + r * 750 + (n - i) * 8);
      w += (kcal - 1650) / 7700 + (r - 0.5) * 0.25;
      st.days[k] = { target: st.settings.target, log: [{ id: k, f: null, name: 'Example day', unit: 'pc', q: 1, kpu: i === 0 ? Math.round(kcal * 0.55) : kcal, m: 'lunch' }], weight: i % 2 === 0 ? E.round(w - (r - 0.5) * 0.25, 1) : undefined };
    }
    return st;
  }
  function vProgress() {
    const st = example ? exampleState() : S;
    const tk = todayKey();
    const f = E.forecast(st, tk);
    const loggedDays = Object.keys(S.days).filter((k) => (S.days[k].log || []).length).length;
    let h = `<header class="topbar"><div class="title"><div class="eyebrow">${fmtDate(st.settings.startDate, false)} → ${fmtDate(st.settings.goalDate, false)}</div><h1>Progress</h1></div>
      <button class="icon-btn" data-act="weight" data-date="${tk}" aria-label="Log weight">${I.scale}</button></header>`;
    if (example) h += `<div class="example-banner"><span><b>Example data</b>, not yours. Your charts fill in as you log.</span><button class="btn sm" data-act="exampleOff">Show mine</button></div>`;
    else if (loggedDays < 3) h += `<div class="example-banner"><span>Charts fill in after a few days of logging.</span><button class="btn sm" data-act="exampleOn">Preview</button></div>`;

    // hero
    const pct = f.progress * 100;
    const reqPct = st.settings.goalWeight !== st.settings.startWeight ? Math.max(0, Math.min(100, (E.diffDays(st.settings.startDate, tk) / Math.max(1, E.diffDays(st.settings.startDate, st.settings.goalDate))) * 100)) : 0;
    h += `<section class="card"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap">
      <div><div class="eyebrow">Current weight</div><div class="big">${f.current.toFixed(1)}<small>kg</small></div></div>
      <div style="text-align:right"><div class="delta ${f.gained < 0 ? 'neg' : ''}">${f.gained >= 0 ? '+' : '−'}${Math.abs(f.gained).toFixed(1)} kg</div><div class="muted small">since start</div></div></div>
      <div class="journey" role="img" aria-label="${Math.round(pct)}% of the way to goal"><div class="fill" style="width:${pct}%"></div><div class="ghost" style="left:${reqPct}%" title="Where the schedule says you'd be today"></div><div class="pin" style="left:${pct}%"></div></div>
      <div class="jlabels"><span>${st.settings.startWeight} kg</span><span>${Math.max(0, f.toGo).toFixed(1)} kg to go · ${f.daysLeft} days</span><span>${st.settings.goalWeight} kg</span></div>
      <div class="keys" style="margin-top:8px"><span><i style="background:var(--leaf)"></i>You</span><span><i style="background:var(--turmeric)"></i>Schedule for today</span></div></section>`;

    h += `<div class="seg-ctl" role="tablist">${[['overview', 'Overview'], ['cal', 'Calories'], ['weight', 'Weight'], ['history', 'History']].map(([v, l]) => `<button class="${progTab === v ? 'on' : ''}" data-act="progTab" data-v="${v}" role="tab" aria-selected="${progTab === v}">${l}</button>`).join('')}</div>`;

    if (progTab === 'overview') h += progOverview(st, f, tk);
    else if (progTab === 'cal') h += progCalories(st, tk);
    else if (progTab === 'weight') h += progWeight(st, f, tk);
    else h += progHistory(st, tk);
    h += `<p class="disclaimer">Estimates, not guarantees. Bodies don’t gain weight in straight lines.</p>`;
    return h;
  }
  function last7(st, tk) { const a = []; for (let i = 6; i >= 0; i--) a.push(E.dayStats(st, E.addDays(tk, -i))); return a; }
  function progOverview(st, f, tk) {
    const days = last7(st, tk);
    let logged = days.filter((d) => d.logged);
    if (logged.length > 1) logged = logged.filter((d) => d.date !== tk); // today is still in progress
    const avg = logged.length ? E.sum(logged, (d) => d.consumed) / logged.length : 0;
    const hits = logged.filter((d) => d.hit).length;
    let h = `<section class="tiles"><div class="tile"><div class="k">7-day avg</div><div class="v">${logged.length ? fmt(avg) : '—'}</div><div class="k">kcal/day</div></div>
      <div class="tile"><div class="k">Target hit</div><div class="v">${hits}/${logged.length || 0}</div><div class="k">full days logged</div></div>
      <div class="tile"><div class="k">This week</div><div class="v">${fmt(E.sum(days, (d) => d.consumed))}</div><div class="k">kcal total</div></div></section>`;
    h += `<section class="card"><h3 style="font-size:16px;margin-bottom:4px">Insights</h3>${E.insights(st, tk).map((i) => `<div class="insight ${i.tone}"><i></i><span>${esc(i.text)}</span></div>`).join('')}</section>`;
    // forecast
    const need = f.required;
    const rateTxt = f.rateSource === 'observed' ? `your actual trend (${f.observed >= 0 ? '+' : ''}${E.round(f.observed * 7, 2)} kg/week)` : `${f.intakeSource === 'avg' ? 'your 7-day average intake' : 'your target'} of ${fmt(f.intake)} kcal vs ~${fmt(f.maint)} maintenance`;
    h += `<section class="card" style="display:grid;gap:10px"><h3 style="font-size:16px">Forecast for ${fmtDate(st.settings.goalDate, false)}</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end"><div><div class="big">${f.projected.toFixed(1)}<small>kg</small></div><div class="muted small">estimated, based on ${rateTxt}</div></div></div>
      <div class="callout ${f.projected >= st.settings.goalWeight ? '' : 'tip'}">${f.daysLeft > 0 ? (f.projected >= st.settings.goalWeight ? `On this pace you reach ${st.settings.goalWeight} kg by the goal date.` : `To reach ${st.settings.goalWeight} kg by ${fmtDate(st.settings.goalDate, false)}, the estimated average is <b>${fmt(need)} kcal/day</b>.`) : 'The goal date has passed. Set a new one in Settings.'}</div>
      ${need && need > st.settings.target + 300 && f.projected < st.settings.goalWeight ? `<p class="muted small" style="margin:0">That’s well above your current target. It’s fine for the goal to take longer; if you raise intake, go up 100–200 kcal every few days.</p>` : ''}
      <p class="muted small" style="margin:0">${f.maintSource === 'data' ? `Maintenance estimated from your own data: ~${fmt(f.maint)} kcal.` : `Using an assumed maintenance of ~${fmt(f.maint)} kcal until you have a week of weigh-ins and logs.`}</p></section>`;
    // scenarios
    const mx = Math.max(st.settings.goalWeight, ...f.scenarios.map((s) => s.weight)) ;
    const mn = Math.min(f.current, st.settings.startWeight) - 0.5;
    h += `<section class="card" style="display:grid;gap:12px"><h3 style="font-size:16px">If you average…</h3><div class="scen">${f.scenarios.map((s) => `<div class="s ${s.kcal === st.settings.target ? 'cur' : ''}"><span><b class="num">${fmt(s.kcal)}</b> <span class="muted small">kcal</span></span><span class="bar2"><b style="width:${Math.max(4, ((s.weight - mn) / (mx - mn)) * 100)}%"></b></span><span class="w">${s.weight.toFixed(1)}</span></div>`).join('')}
      <div class="s"><span class="muted small">Goal</span><span class="bar2"><b style="width:${((st.settings.goalWeight - mn) / (mx - mn)) * 100}%;background:var(--turmeric)"></b></span><span class="w">${st.settings.goalWeight.toFixed(1)}</span></div></div>
      <p class="muted small" style="margin:0">Estimated weight on ${fmtDate(st.settings.goalDate, false)}. Simple maths (~7,700 kcal ≈ 1 kg), not a promise.</p></section>`;
    return h;
  }
  function rangeDays(st, tk, n) {
    const start = n ? E.addDays(tk, -(n - 1)) : (Object.keys(st.days).sort()[0] || tk);
    const out = [];
    for (let k = start; k <= tk; k = E.addDays(k, 1)) out.push(E.dayStats(st, k));
    return out;
  }
  function calChart(days, tk) {
    const W = 340, H = 190, L = 34, R = 6, T = 10, B = 22;
    const max = Math.max(3000, ...days.map((d) => Math.max(d.consumed, d.target))) * 1.05;
    const step = max > 4000 ? 1000 : 500;
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const bw = (W - L - R) / days.length;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories per day versus target">`;
    for (let v = 0; v <= max; v += step) s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v >= 1000 ? v / 1000 + 'k' : v}</text>`;
    days.forEach((d, i) => {
      const x = L + i * bw + bw * 0.16, w = bw * 0.68;
      if (d.consumed > 0) s += `<rect class="bar ${d.date === tk ? 'today' : d.hit ? '' : 'miss'}" x="${x}" y="${y(d.consumed)}" width="${w}" height="${y(0) - y(d.consumed)}" rx="${Math.min(4, w / 2)}" style="animation-delay:${i * 25}ms"><title>${fmtDate(d.date)}: ${fmt(d.consumed)} kcal</title></rect>`;
      const every = Math.ceil(days.length / 7);
      if (i % every === 0 || i === days.length - 1) s += `<text x="${L + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${E.parseKey(d.date).getDate()}</text>`;
    });
    // target (step line)
    let tp = '';
    days.forEach((d, i) => { const yy = y(d.target); tp += `${i ? 'L' : 'M'}${L + i * bw} ${yy} L${L + (i + 1) * bw} ${yy} `; });
    s += `<path class="tline" d="${tp}"/>`;
    // 7-day rolling average of logged days
    let ap = '', started = false;
    days.forEach((d, i) => {
      const win = days.slice(Math.max(0, i - 6), i + 1).filter((x) => x.logged && x.date !== tk);
      if (win.length < 2) return;
      const a = E.sum(win, (x) => x.consumed) / win.length;
      ap += `${started ? 'L' : 'M'}${L + i * bw + bw / 2} ${y(a)} `; started = true;
    });
    if (ap) s += `<path class="avg" d="${ap}"/>`;
    return s + '</svg>';
  }
  function progCalories(st, tk) {
    const days = rangeDays(st, tk, calRange);
    let h = `<div class="chips">${[[7, '7 days'], [14, '14 days'], [30, '30 days'], [0, 'All']].map(([v, l]) => `<button class="chip ${calRange === v ? 'on' : ''}" data-act="calRange" data-v="${v}">${l}</button>`).join('')}</div>`;
    h += `<section class="card" style="display:grid;gap:8px"><h3 style="font-size:16px">Calories vs target</h3>${calChart(days, tk)}
      <div class="keys"><span><i style="background:var(--leaf);height:9px;width:9px"></i>Hit target</span><span><i style="background:var(--leaf-2);opacity:.55;height:9px;width:9px"></i>Under</span><span><i style="background:var(--turmeric);height:9px;width:9px"></i>Today so far</span><span><i style="background:var(--ink);opacity:.6"></i>Target</span><span><i style="background:var(--turmeric)"></i>7-day avg</span></div></section>`;
    // weekly totals (Mon–Sun)
    const weeks = {};
    rangeDays(st, tk, 0).forEach((d) => {
      const dt = E.parseKey(d.date); const off = (dt.getDay() + 6) % 7; const wk = E.addDays(d.date, -off);
      weeks[wk] = weeks[wk] || { wk, total: 0, logged: 0, hits: 0, target: 0 };
      weeks[wk].total += d.consumed; weeks[wk].target += d.target;
      if (d.logged) weeks[wk].logged++; if (d.hit) weeks[wk].hits++;
    });
    const rows = Object.values(weeks).sort((a, b) => (a.wk < b.wk ? 1 : -1));
    h += `<section class="card"><h3 style="font-size:16px;margin-bottom:6px">Weekly totals</h3><div class="table-wrap"><table><thead><tr><th>Week of</th><th>Total</th><th>Avg/day</th><th>Hit</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${fmtDate(r.wk, false)}</td><td>${fmt(r.total)}</td><td>${r.logged ? fmt(r.total / r.logged) : '—'}</td><td>${r.hits}/${r.logged}</td></tr>`).join('')}</tbody></table></div></section>`;
    return h;
  }
  function weightChart(st, f, tk) {
    const ws = E.weights(st);
    const S0 = st.settings;
    const W = 340, H = 200, L = 34, R = 34, T = 14, B = 22;
    const start = S0.startDate < (ws[0] ? ws[0].date : S0.startDate) ? S0.startDate : ws[0].date;
    const end = S0.goalDate > tk ? S0.goalDate : tk;
    const span = Math.max(1, E.diffDays(start, end));
    const vals = ws.map((w) => w.kg).concat([S0.startWeight, S0.goalWeight, f.projected]);
    const lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.3);
    const x = (k) => L + (W - L - R) * (E.diffDays(start, k) / span);
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time with goal and forecast">`;
    const stp = hi - lo > 8 ? 2 : 1;
    for (let v = lo; v <= hi; v += stp) s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
    s += `<line class="need" x1="${x(S0.startDate)}" y1="${y(S0.startWeight)}" x2="${x(S0.goalDate)}" y2="${y(S0.goalWeight)}"/>`;
    s += `<line class="goal" x1="${L}" x2="${W - R}" y1="${y(S0.goalWeight)}" y2="${y(S0.goalWeight)}"/><text class="lbl" x="${W - R + 4}" y="${y(S0.goalWeight) + 4}">${S0.goalWeight}</text>`;
    if (ws.length) {
      const pts = ws.map((w) => [x(w.date), y(w.kg)]);
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
      if (pts.length > 1) s += `<path class="warea" d="${d} L${pts[pts.length - 1][0]} ${y(lo)} L${pts[0][0]} ${y(lo)} Z"/><path class="wline" d="${d}"/>`;
      const last = ws[ws.length - 1];
      if (S0.goalDate > last.date) s += `<line class="proj" x1="${x(last.date)}" y1="${y(last.kg)}" x2="${x(S0.goalDate)}" y2="${y(f.projected)}"/><circle class="wdot" cx="${x(S0.goalDate)}" cy="${y(f.projected)}" r="3.5" style="stroke-dasharray:2 2"/><text class="lbl" x="${W - R + 4}" y="${y(f.projected) + 4}">${f.projected.toFixed(1)}</text>`;
      pts.forEach((p, i) => { s += `<circle class="wdot ${i === pts.length - 1 ? 'last' : ''}" cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5 : 3.5}"><title>${fmtDate(ws[i].date)}: ${ws[i].kg} kg</title></circle>`; });
    }
    s += `<text x="${L}" y="${H - 6}">${fmtDate(start, false)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${fmtDate(end, false)}</text>`;
    return s + '</svg>';
  }
  function progWeight(st, f, tk) {
    const ws = E.weights(st);
    let h = `<section class="card" style="display:grid;gap:8px"><h3 style="font-size:16px">Weight over time</h3>${weightChart(st, f, tk)}
      <div class="keys"><span><i style="background:var(--leaf)"></i>Your weigh-ins</span><span><i style="background:var(--leaf);opacity:.6"></i>Forecast</span><span><i style="background:var(--turmeric)"></i>Goal</span><span><i style="background:var(--muted)"></i>Steady path to goal</span></div></section>`;
    if (!example) h += `<button class="btn primary block" data-act="weight" data-date="${tk}">${I.scale}Log today’s weight</button>`;
    h += `<section class="card"><h3 style="font-size:16px;margin-bottom:4px">Weigh-ins</h3><div class="list">${ws.slice().reverse().map((w, i, arr) => {
      const prev = arr[i + 1];
      const ch = prev ? E.round(w.kg - prev.kg, 1) : null;
      return `<div class="li"><button class="main" ${example ? '' : `data-act="weight" data-date="${w.date}"`}><b>${fmtDate(w.date)}</b></button>${ch != null ? `<span class="small ${ch >= 0 ? 'delta' : 'delta neg'}">${ch >= 0 ? '+' : '−'}${Math.abs(ch).toFixed(1)}</span>` : ''}<span class="num" style="font-weight:800;min-width:64px;text-align:right">${w.kg.toFixed(1)} kg</span></div>`;
    }).join('') || '<div class="empty">No weigh-ins yet</div>'}</div></section>`;
    return h;
  }
  function progHistory(st, tk) {
    const days = rangeDays(st, tk, 0).reverse();
    return `<section class="hist">${days.map((d) => {
      const log = (st.days[d.date] || {}).log || [];
      const pct = Math.round(d.pct * 100);
      return `<details class="card"><summary><div style="flex:1;min-width:0" class="hday">
        <div><b>${fmtDate(d.date)}</b> <span class="muted small">${d.weight != null ? '· ' + d.weight + ' kg' : ''}</span></div>
        ${d.logged ? `<span class="hit ${d.hit ? 'y' : 'n'}">${d.hit ? 'Hit' : pct + '%'}</span>` : '<span class="muted small">No log</span>'}
        <div class="bar3"><b class="${d.hit ? '' : 'miss'}" style="width:${Math.min(100, pct)}%"></b></div>
        <div class="muted small">${fmt(d.consumed)} / ${fmt(d.target)} kcal · ${d.target - d.consumed >= 0 ? fmt(d.target - d.consumed) + ' short' : fmt(d.consumed - d.target) + ' over'} · ${d.meals} meal${d.meals === 1 ? '' : 's'}, ${d.items} item${d.items === 1 ? '' : 's'}</div>
        </div></summary>
        <div style="margin-top:8px">${E.SLOTS.map((s) => { const it = log.filter((e) => e.m === s.id); return it.length ? `<div class="meal-group"><div class="meal-head"><span>${s.name}</span><span class="num">${fmt(E.sum(it, E.entryKcal))}</span></div><div class="small">${it.map((e) => esc(qtyLabel(e.q, e.unit) + ' ' + e.name)).join(', ')}</div></div>` : ''; }).join('') || '<div class="muted small">Nothing logged.</div>'}
        ${example ? '' : `<button class="btn sm" style="margin-top:10px" data-act="gotoDay" data-date="${d.date}">Open this day</button>`}</div></details>`;
    }).join('')}</section>`;
  }

  // ---------- render ----------
  const VIEWS = { today: vToday, week: vWeek, mess: vMess, foods: vFoods, progress: vProgress };
  function render() {
    const main = $('#view');
    main.innerHTML = `<div class="view">${VIEWS[view]()}</div>`;
    document.querySelectorAll('.nav a').forEach((a) => { a.classList.toggle('on', a.dataset.v === view); a.setAttribute('aria-current', a.dataset.v === view ? 'page' : 'false'); });
  }
  function go(v) { if (!VIEWS[v]) v = 'today'; if (v !== view) { view = v; window.scrollTo(0, 0); } render(); }

  // ---------- actions ----------
  const day = () => E.ensureDay(S, viewDate);
  const ACT = {
    closeSheet: closeSheet,
    undo: () => { const r = $('#toast-root'); if (r._undo) { r._undo(); r.innerHTML = ''; r._undo = null; } },
    prevDay: () => { viewDate = E.addDays(viewDate, -1); logMeal = null; render(); },
    nextDay: () => { if (viewDate < todayKey()) { viewDate = E.addDays(viewDate, 1); logMeal = null; render(); } },
    gotoDay: (t) => { viewDate = t.dataset.date; logMeal = null; location.hash = 'today'; go('today'); },
    settings: () => openSettings(),
    eatNow: openEatNow,
    weight: (t) => openWeight(t.dataset.date || todayKey()),
    quick: (t) => { const f = E.food(S, t.dataset.id); addFromMatch({ food: f, qty: E.porOf(f)[1] }); },
    addSugg: (t) => { const m = lastMatches[+t.dataset.i]; if (m) addFromMatch(m); },
    customFood: (t) => openCustom(t.dataset.name, true),
    step: (t) => {
      const d = day(); const e = d.log.find((x) => x.id === t.dataset.id); if (!e) return;
      const step = E.stepOf(E.food(S, e.f) || { unit: e.unit });
      const nq = E.round(e.q + step * +t.dataset.d, 2);
      if (nq <= 0) { const idx = d.log.indexOf(e); d.log.splice(idx, 1); commit(); toast(`Removed ${e.name}`, () => { d.log.splice(idx, 0, e); commit(); }); return; }
      e.q = nq; commit();
    },
    editEntry: (t) => openEntry(t.dataset.id),
    es: (t) => { const i = $('#esQ'); const step = sheetCtx.step || 1; i.value = Math.max(step, E.round((+i.value || 0) + step * +t.dataset.d, 2)); INPUT.esCalc(); },
    esSave: () => {
      const d = day(); const e = d.log.find((x) => x.id === sheetCtx.entry); if (!e) return closeSheet();
      const q = +$('#esQ').value, k = +$('#esK').value;
      if (!(q > 0) || !(k >= 0)) { toast('Enter a quantity above 0.'); return; }
      e.q = E.round(q, 2); e.kpu = k; e.m = $('#esM').value;
      if ($('#esR') && $('#esR').checked && e.f) S.overrides[e.f] = k;
      closeSheet(); commit(); toast('Saved');
    },
    esDel: () => { const d = day(); const idx = d.log.findIndex((x) => x.id === sheetCtx.entry); if (idx < 0) return closeSheet(); const [e] = d.log.splice(idx, 1); closeSheet(); commit(); toast(`Deleted ${e.name}`, () => { d.log.splice(idx, 0, e); commit(); }); },
    cfSave: () => {
      const name = $('#cfN').value.trim(); const unit = $('#cfU').value; const k = +$('#cfK').value;
      if (!name) { toast('Give the food a name.'); return; }
      if (!(k > 0)) { toast('Enter calories per unit, e.g. 180.'); return; }
      const room = $('#cfR').checked;
      const keep = !sheetCtx.fromLog || $('#cfS').checked;
      let f = { id: 'c_' + uid(), name, unit, kcal: k, where: room ? 'room' : 'mess', role: room ? 'side' : 'staple', por: porForUnit(unit), alias: [], room };
      if (keep) { S.custom.push(f); if (room) { S.stock[f.id] = true; if (Array.isArray(S.roomList)) S.roomList.push(f.id); } }
      else f = Object.assign({}, f, { id: null });
      const picker = sheetCtx && sheetCtx.returnTo;
      if (sheetCtx.fromLog) {
        const q = +$('#cfQ').value || 1;
        const e = addEntry(viewDate, f, q, $('#mealSel') ? $('#mealSel').value : defaultMeal(), k);
        closeSheet(); commit(); toast(`Added ${e.name} · ${fmt(E.entryKcal(e))} kcal`);
      } else { closeSheet(); commit(); toast(`Saved ${name}`); if (picker) { picker.onPick(f.id); } }
    },
    ate: (t) => {
      const p = E.planDay(S, todayKey(), nowMin()); const m = p.plan.find((x) => x.slot === t.dataset.slot); if (!m) return;
      const undo = logItems(todayKey(), m.items, m.slot);
      commit(); toast(`Logged ${m.name} · ${fmt(m.kcal)} kcal`, () => { undo(); commit(); });
    },
    ateNow: (t) => {
      const r = sheetCtx && sheetCtx.eatNow; if (!r || !r.now) return closeSheet();
      const meal = t.dataset.slot === 'bridge' ? defaultMealFor(nowMin()) : t.dataset.slot;
      const undo = logItems(todayKey(), r.now.items, meal);
      viewDate = todayKey(); closeSheet(); commit(); toast(`Logged ${fmt(r.now.kcal)} kcal`, () => { undo(); commit(); });
    },
    swap: (t) => {
      const d = E.ensureDay(S, todayKey()); const s = t.dataset.slot; const def = E.SLOT[s];
      d.replace = d.replace || {}; d.variant = d.variant || {};
      if (def.mess && !d.replace[s]) { d.replace[s] = true; commit(); toast(`${def.name} replaced with room food`, () => { delete d.replace[s]; commit(); }); return; }
      d.variant[s] = (d.variant[s] || 0) + 1; commit();
    },
    useMess: (t) => { const d = E.ensureDay(S, todayKey()); if (d.replace) delete d.replace[t.dataset.slot]; commit(); },
    skip: (t) => { const d = E.ensureDay(S, todayKey()); const s = t.dataset.slot; d.skip = d.skip || {}; d.skip[s] = true; commit(); toast(`${slotName(s)} skipped. Rest of day re-planned.`, () => { delete d.skip[s]; commit(); }); },
    unskip: (t) => { const d = E.ensureDay(S, todayKey()); if (d.skip) delete d.skip[t.dataset.slot]; commit(); },
    logUsual: (t) => { const s = t.dataset.slot; const m = E.usualMeal(S, todayKey(), s); const undo = logItems(todayKey(), m.items, s); commit(); toast(`Logged usual ${slotName(s).toLowerCase()} · ${fmt(m.kcal)} kcal`, () => { undo(); commit(); }); },
    tgt: (t) => { const i = $('#stT'); i.value = Math.max(1000, Math.min(5000, (+i.value || 0) + +t.dataset.d)); INPUT.stT(); },
    tgtSet: (t) => { $('#stT').value = t.dataset.v; INPUT.stT(); document.querySelectorAll('[data-act="tgtSet"]').forEach((b) => b.classList.toggle('on', b === t)); },
    saveGoal: () => {
      const s = S.settings; const n = (id) => +$(id).value;
      if (n('#stSW') > 20) s.startWeight = E.round(n('#stSW'), 1);
      if (n('#stGW') > 20) s.goalWeight = E.round(n('#stGW'), 1);
      if ($('#stSD').value) s.startDate = $('#stSD').value;
      if ($('#stGD').value) s.goalDate = $('#stGD').value;
      if (n('#stM') > 800) s.maintenance = Math.round(n('#stM'));
      commit(); toast('Goal saved');
    },
    exportData: () => {
      const txt = JSON.stringify(S);
      const ta = $('#impT'); ta.value = txt;
      const done = () => toast('Backup copied. Paste it into Notes.');
      try { navigator.clipboard.writeText(txt).then(done, () => { ta.select(); toast('Backup is in the box below. Select all and copy.'); }); } catch (e) { ta.select(); toast('Backup is in the box below. Select all and copy.'); }
    },
    importData: () => importText($('#impT').value),
    reset: () => {
      if (!(sheetCtx && sheetCtx.confirmReset)) { openSettings('confirm'); return; }
      S = E.defaultState(); viewDate = todayKey(); closeSheet(); commit(); toast('All data erased');
    },
    wstep: (t) => { const i = $('#wV'); i.value = E.round((+i.value || 0) + +t.dataset.d, 1); },
    wSave: () => {
      const v = +$('#wV').value; const k = $('#wD').value || todayKey();
      if (!(v > 20 && v < 250)) { toast('Enter your weight in kg.'); return; }
      E.ensureDay(S, k).weight = E.round(v, 1); closeSheet(); commit(); toast(`Saved ${E.round(v, 1)} kg`);
    },
    wDel: () => { const k = $('#wD').value; if (S.days[k]) delete S.days[k].weight; closeSheet(); commit(); },
    // week
    weekDay: (t) => { weekIdx = +t.dataset.i; render(); },
    reshuffle: () => { S.weekSeed = (S.weekSeed || 0) + 1; commit(); toast('New mix of room foods'); },
    // mess
    messOk: () => { S.messSample = false; commit(); },
    messDay: (t) => { messWd = t.dataset.wd; render(); },
    messRm: (t) => { const arr = S.mess[messWd][t.dataset.slot]; const i = arr.indexOf(t.dataset.id); if (i >= 0) arr.splice(i, 1); S.messSample = false; commit(); },
    messAdd: (t) => {
      const slot = t.dataset.slot; const wd = messWd;
      S.mess[wd] = S.mess[wd] || {}; S.mess[wd][slot] = S.mess[wd][slot] || [];
      openPicker({ title: `${WD_FULL[wd]} ${slotName(slot).toLowerCase()}`, sub: 'Tap everything the mess serves', prefer: 'mess', selected: () => S.mess[wd][slot], onPick: (id) => { const a = S.mess[wd][slot]; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); S.messSample = false; save(); render(); } });
    },
    messCopy: () => {
      openSheet(sheetHead(`Copy ${WD_FULL[messWd]} to`) + `<div class="chips wrap">${WD_ORDER.filter((w) => w !== messWd).map((w) => `<button class="chip" data-act="messCopyTo" data-wd="${w}">${WDN[w]}</button>`).join('')}<button class="chip on" data-act="messCopyTo" data-wd="all">All other days</button></div>`);
    },
    messCopyTo: (t) => {
      const src = JSON.parse(JSON.stringify(S.mess[messWd] || {}));
      const targets = t.dataset.wd === 'all' ? WD_ORDER.filter((w) => w !== messWd) : [t.dataset.wd];
      targets.forEach((w) => { S.mess[w] = JSON.parse(JSON.stringify(src)); });
      S.messSample = false; closeSheet(); commit(); toast(`Copied to ${targets.length} day${targets.length > 1 ? 's' : ''}`);
    },
    messClear: () => { const prev = S.mess[messWd]; S.mess[messWd] = { breakfast: [], lunch: [], dinner: [] }; commit(); toast(`${WD_FULL[messWd]} cleared`, () => { S.mess[messWd] = prev; commit(); }); },
    // foods
    foodsTab: (t) => { foodsTab = t.dataset.v; render(); },
    openFood: (t) => openFood(t.dataset.id),
    newFood: () => openCustom('', false),
    roomAdd: () => openPicker({ title: 'Add to my room', sub: 'Things you keep in your room', prefer: 'room', selected: () => E.roomList(S), onPick: (id) => { const list = E.roomList(S).slice(); const i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else { list.push(id); S.stock[id] = true; } S.roomList = list; save(); render(); } }),
    fdPref: (t) => { sheetCtx.pref = t.dataset.v; document.querySelectorAll('[data-act="fdPref"]').forEach((b) => { b.classList.toggle('on', b === t); b.setAttribute('aria-checked', b === t); }); },
    fdReset: (t) => { delete S.overrides[t.dataset.id]; save(); openFood(t.dataset.id); render(); },
    fdSave: (t) => {
      const id = t.dataset.id; const f = E.food(S, id); const k = +$('#fdK').value;
      if (k >= 0 && k !== E.kcalOf(S, f)) { if ((S.custom || []).includes(f)) f.kcal = k; else if (k === f.kcal) delete S.overrides[id]; else S.overrides[id] = k; }
      const cur = prefOf(id); const want = sheetCtx.pref;
      if (!(want === 'never' && (cur === 'dislike' || cur === 'noAccess'))) setPref(id, want);
      const list = E.roomList(S).slice(); const inRoom = list.includes(id); const wantRoom = $('#fdRoom').checked;
      if (wantRoom !== inRoom) { if (wantRoom) { list.push(id); S.stock[id] = true; } else list.splice(list.indexOf(id), 1); S.roomList = list; }
      closeSheet(); commit(); toast(`Saved ${f.name}`);
    },
    fdDel: (t) => { const id = t.dataset.id; S.custom = S.custom.filter((f) => f.id !== id); if (Array.isArray(S.roomList)) S.roomList = S.roomList.filter((x) => x !== id); delete S.stock[id]; WD_ORDER.forEach((w) => ['breakfast', 'lunch', 'dinner'].forEach((s) => { if (S.mess[w] && S.mess[w][s]) S.mess[w][s] = S.mess[w][s].filter((x) => x !== id); })); closeSheet(); commit(); toast('Food deleted'); },
    prefRm: (t) => { S.prefs[t.dataset.k] = S.prefs[t.dataset.k].filter((x) => x !== t.dataset.id); commit(); },
    prefAdd: (t) => { const k = t.dataset.k; openPicker({ title: t.dataset.l, selected: () => S.prefs[k], onPick: (id) => { const a = S.prefs[k]; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else { ['prioritize', 'dislike', 'noAccess', 'never'].forEach((x) => { if (x !== k) S.prefs[x] = S.prefs[x].filter((y) => y !== id); }); a.push(id); } save(); render(); } }); },
    pick: (t) => { const ctx = sheetCtx; if (!ctx || !ctx.onPick) return; ctx.onPick(t.dataset.id); renderPicker($('#pkQ') ? $('#pkQ').value : ''); },
    pkCustom: () => { const ctx = sheetCtx; const q = $('#pkQ') ? $('#pkQ').value : ''; openCustom(q, false); sheetCtx.returnTo = ctx; },
    // progress
    progTab: (t) => { progTab = t.dataset.v; render(); },
    calRange: (t) => { calRange = +t.dataset.v; render(); },
    exampleOn: () => { example = true; render(); },
    exampleOff: () => { example = false; render(); },
  };
  function defaultMealFor(n) { let best = 'breakfast'; E.SLOTS.forEach((s) => { if (n >= s.start - 30) best = s.id; }); return best; }
  function importText(txt) {
    try {
      const data = JSON.parse(txt);
      if (!data || !data.settings || !data.days) throw new Error('bad');
      S = E.migrate(data); viewDate = todayKey(); closeSheet(); commit(); toast('Backup restored');
    } catch (e) { toast('That doesn’t look like a Second Helping backup.'); }
  }

  const INPUT = {
    logQ: (el) => renderSuggestions(el.value),
    esCalc: () => { const q = +$('#esQ').value || 0, k = +$('#esK').value || 0; $('#esT').innerHTML = `Total ≈ <b>${fmt(q * k)} kcal</b>`; },
    stT: () => {
      const v = Math.round(+$('#stT').value);
      if (!(v >= 1000 && v <= 5000)) return;
      S.settings.target = v;
      const d = S.days[todayKey()]; if (d) d.target = v;
      save(); render();
    },
    pickQ: (el) => renderPicker(el.value),
    dbQ: (el) => { dbQuery = el.value; const l = $('#dbL'); if (l) l.innerHTML = dbList(); },
  };
  const CHANGE = {
    logMeal: (el) => { logMeal = el.value; },
    stock: (el) => { S.stock[el.dataset.id] = el.checked; save(); setTimeout(render, 180); },
    prefTog: (el) => { S.prefs[el.dataset.k] = el.checked; commit(); },
    importFile: (el) => { const file = el.files && el.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => importText(String(r.result)); r.readAsText(file); },
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const fn = ACT[t.dataset.act];
    if (fn) { e.preventDefault(); fn(t, e); }
  });
  document.addEventListener('input', (e) => { const n = e.target.dataset && e.target.dataset.input; if (n && INPUT[n]) INPUT[n](e.target); });
  document.addEventListener('change', (e) => { const n = e.target.dataset && e.target.dataset.change; if (n && CHANGE[n]) CHANGE[n](e.target); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetOpen()) closeSheet();
    if (e.key === 'Enter' && e.target.id === 'q') {
      e.preventDefault();
      const v = e.target.value;
      if (!v.trim()) return;
      const r = E.parse(S, v); lastMatches = r.matches;
      if (r.matches[0] && r.matches[0].score >= 70) addFromMatch(r.matches[0]);
      else renderSuggestions(v);
    }
  });
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  // keep "today" fresh: time-of-day plan + date rollover
  let lastToday = todayKey();
  function tick() {
    const tk = todayKey();
    if (tk !== lastToday) { if (viewDate === lastToday) viewDate = tk; lastToday = tk; logMeal = null; }
    const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (view === 'today' && !sheetOpen() && !typing) render();
  }
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { S = load(); tick(); } });

  // first paint
  S.days[todayKey()] && S.days[todayKey()].target == null && (S.days[todayKey()].target = S.settings.target);
  go(location.hash.slice(1) || 'today');

  // offline support when hosted (ignored where service workers aren't allowed)
  try {
    if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href) && !/claude|anthropic/.test(location.hostname)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch (e) { /* ignore */ }

  window.SecondHelping = { get state() { return S; }, render };
})();
