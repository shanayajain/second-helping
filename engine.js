/* =====================================================================
   Second Helping — engine (pure logic, no DOM)
   Parsing, calorie maths, the adaptive day planner, the weekly plan,
   and progress analytics. app.js draws the screens from these.
   ===================================================================== */
(function (G) {
  'use strict';

  // ---------- Meal slots (times in minutes after midnight) ----------
  // w = share of the day's calories this slot normally gets.
  const SLOTS = [
    { id: 'breakfast', name: 'Breakfast', start: 420, end: 630, w: 0.21, mess: true },
    { id: 'mid', name: 'Mid-morning', start: 630, end: 750, w: 0.13 },
    { id: 'lunch', name: 'Lunch', start: 750, end: 900, w: 0.27, mess: true },
    { id: 'evening', name: 'Evening snack', start: 960, end: 1140, w: 0.16 },
    { id: 'dinner', name: 'Dinner', start: 1170, end: 1320, w: 0.23, mess: true },
    { id: 'late', name: 'Late snack', start: 1320, end: 1440, w: 0 },
  ];
  const SLOT = Object.fromEntries(SLOTS.map((s) => [s.id, s]));
  const GRACE = 30; // minutes after a slot ends before it counts as missed
  const LATE_CAP = 700; // most we plan for one late snack
  const KCAL_PER_KG = 7700;

  // Typical mess meal used when no menu is entered for that slot.
  const GENERIC_MESS = {
    breakfast: ['paratha', 'curd'],
    lunch: ['rice', 'dal', 'roti', 'sabzi', 'curd'],
    dinner: ['roti', 'rice', 'dal', 'sabzi'],
  };

  const NUTS = ['mixed_nuts', 'almonds', 'cashews', 'walnuts', 'peanuts', 'pistachios'];

  // Room-food building blocks: [foodId, typical, min, max, step]. s = base priority.
  const COMBOS = [
    { id: 'pbbread', s: 10, meal: 6, items: [['bread', 2, 2, 4, 1], ['peanut_butter', 2, 1, 3, 0.5]] },
    { id: 'milk', s: 9, d: 1, items: [['milk', 250, 200, 400, 50]] },
    { id: 'nuts', s: 9, items: [['@nuts', 30, 20, 50, 5]] },
    { id: 'banana', s: 9, items: [['banana', 1, 1, 2, 1]] },
    { id: 'dates', s: 7, items: [['dates', 3, 2, 6, 1]] },
    { id: 'lassi', s: 7, d: 1, items: [['lassi', 250, 200, 400, 50]] },
    { id: 'granola', s: 7, d: 1, meal: 3, items: [['granola', 40, 30, 60, 10], ['milk', 200, 150, 300, 50]] },
    { id: 'pbbanana', s: 6, items: [['banana', 1, 1, 1, 1], ['peanut_butter', 1, 1, 2, 0.5]] },
    { id: 'chikki', s: 6, items: [['chikki', 1, 1, 2, 1]] },
    { id: 'egg', s: 5, meal: 3, items: [['boiled_egg', 2, 1, 3, 1]] },
    { id: 'curd', s: 5, items: [['curd', 1, 1, 1.5, 0.5]] },
    { id: 'greek', s: 5, items: [['greek_yogurt', 150, 100, 200, 50]] },
    { id: 'raisins', s: 5, items: [['raisins', 20, 15, 40, 5]] },
    { id: 'flavmilk', s: 5, d: 1, items: [['flavoured_milk', 200, 200, 400, 100]] },
    { id: 'muesli', s: 5, d: 1, meal: 3, items: [['muesli', 40, 30, 60, 10], ['milk', 200, 150, 300, 50]] },
    { id: 'cornflakes', s: 5, d: 1, meal: 3, items: [['cornflakes', 30, 30, 50, 10], ['milk', 200, 150, 300, 50]] },
    { id: 'thepla', s: 5, meal: 6, items: [['thepla', 2, 2, 4, 1]] },
    { id: 'cheese', s: 4, meal: 4, items: [['bread', 2, 2, 2, 1], ['cheese_slice', 1, 1, 2, 1]] },
    { id: 'paneer', s: 4, meal: 2, items: [['paneer', 50, 50, 100, 25]] },
    { id: 'digestive', s: 4, items: [['digestive', 2, 2, 4, 1]] },
    { id: 'biscuits', s: 4, items: [['biscuits', 4, 3, 6, 1]] },
    { id: 'rusk', s: 4, items: [['rusk', 3, 2, 5, 1]] },
    { id: 'khakhra', s: 4, items: [['khakhra', 2, 2, 4, 1]] },
    { id: 'makhana', s: 3, items: [['makhana', 25, 20, 40, 5]] },
    { id: 'namkeen', s: 3, items: [['namkeen', 30, 20, 50, 10]] },
    { id: 'apple', s: 3, items: [['apple', 1, 1, 1, 1]] },
    { id: 'chikoo', s: 3, items: [['chikoo', 1, 1, 2, 1]] },
    { id: 'guava', s: 2, items: [['guava', 1, 1, 1, 1]] },
    { id: 'orange', s: 2, items: [['orange', 1, 1, 2, 1]] },
    { id: 'chocolate', s: 2, items: [['chocolate', 25, 20, 40, 5]] },
    { id: 'toned', s: 6, d: 1, items: [['toned_milk', 250, 200, 400, 50]] },
  ];

  // ---------- Units ----------
  const VOL = { ml: 1, l: 1000, cup: 240, bowl: 200, katori: 150, glass: 250, tbsp: 15, tsp: 5 };
  const MASS = { g: 1, kg: 1000 };
  const UNIT_WORDS = {
    cup: 'cup', cups: 'cup', bowl: 'bowl', bowls: 'bowl', katori: 'katori', katoris: 'katori',
    glass: 'glass', glasses: 'glass', ml: 'ml', l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
    g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g', gr: 'g', kg: 'kg',
    tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', spoon: 'tbsp', spoons: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', slice: 'slice', slices: 'slice',
    pc: 'pc', pcs: 'pc', piece: 'pc', pieces: 'pc', plate: 'plate', plates: 'plate',
    handful: 'handful', handfuls: 'handful', serving: 'serving', servings: 'serving', scoop: 'serving', scoops: 'serving',
  };
  const NUM_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, quarter: 0.25 };
  const UNIT_STEP = { pc: 1, slice: 1, cup: 0.5, bowl: 0.5, plate: 0.5, ml: 50, g: 5, tbsp: 0.5, tsp: 1 };

  // ---------- Small helpers ----------
  const round = (n, d = 0) => { const m = 10 ** d; return Math.round(n * m) / m; };
  const sum = (a, f = (x) => x) => a.reduce((t, x) => t + (f(x) || 0), 0);
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- Dates (local time, keys like 2026-11-08) ----------
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000); // b - a
  const WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const weekdayOf = (k) => WD[parseKey(k).getDay()];

  // ---------- State ----------
  function defaultState() {
    const stock = {};
    (G.DEFAULT_STOCK || []).forEach((id) => { stock[id] = true; });
    return {
      v: 1,
      settings: {
        target: 2400, startWeight: 41.2, goalWeight: 46.2,
        startDate: '2026-11-08', goalDate: '2026-12-12', maintenance: 1650,
      },
      prefs: { veg: true, eggless: true, prioritize: [], dislike: [], noAccess: [], never: [] },
      overrides: {}, // foodId -> kcal per unit
      custom: [], // user foods, same shape as FOOD_DB
      roomList: (G.DEFAULT_STOCK || []).concat(['peanuts', 'chikki', 'rusk', 'khakhra', 'cornflakes', 'flavoured_milk', 'greek_yogurt', 'chikoo', 'orange', 'thepla', 'ghee']),
      stock,
      mess: JSON.parse(JSON.stringify(G.DEFAULT_MESS || {})),
      messSample: true,
      days: { '2026-11-08': { target: 2400, weight: 41.2, log: [] } },
      weekSeed: 0,
    };
  }
  function migrate(s) {
    const d = defaultState();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign({}, d, s);
    out.settings = Object.assign({}, d.settings, s.settings || {});
    out.prefs = Object.assign({}, d.prefs, s.prefs || {});
    ['prioritize', 'dislike', 'noAccess', 'never'].forEach((k) => { if (!Array.isArray(out.prefs[k])) out.prefs[k] = []; });
    out.days = s.days || {};
    out.mess = s.mess || d.mess;
    return out;
  }

  // ---------- Food lookups ----------
  function allFoods(st) { return (G.FOOD_DB || []).concat(st.custom || []); }
  function food(st, id) {
    if (!id) return null;
    const c = (st.custom || []).find((f) => f.id === id);
    if (c) return c;
    return (G.FOOD_DB || []).find((f) => f.id === id) || null;
  }
  function kcalOf(st, f) {
    if (!f) return 0;
    const o = st.overrides && st.overrides[f.id];
    return o != null ? o : f.kcal;
  }
  function porOf(f) {
    if (f && f.por) return f.por;
    const step = UNIT_STEP[f && f.unit] || 1;
    if (f && f.unit === 'ml') return [100, 250, 500, 50];
    if (f && f.unit === 'g') return [10, 30, 100, 5];
    return [step, 1, 4 * Math.max(1, step), step];
  }
  const stepOf = (f) => (f && f.por ? f.por[3] : UNIT_STEP[f && f.unit] || 1);

  function allowed(st, f) {
    if (!f) return false;
    const p = st.prefs;
    if (p.veg && f.nonveg) return false;
    if (p.eggless && f.egg) return false;
    if (p.dislike.includes(f.id) || p.noAccess.includes(f.id) || p.never.includes(f.id)) return false;
    return true;
  }
  function isRoomFood(f) { return f && (f.where === 'room' || f.where === 'both' || f.room); }
  function roomList(st) {
    if (Array.isArray(st.roomList)) return st.roomList.filter((id) => food(st, id));
    return allFoods(st).filter(isRoomFood).map((f) => f.id);
  }
  function usable(st, id) {
    const f = food(st, id);
    return !!(f && st.stock[id] && allowed(st, f));
  }

  // ---------- Formatting ----------
  const FRAC = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  function fmtQty(q) {
    const whole = Math.floor(q + 1e-9);
    const frac = round(q - whole, 2);
    if (FRAC[frac]) return (whole ? whole : '') + FRAC[frac];
    return String(round(q, 2));
  }
  const UNIT_NAME = { cup: ['cup', 'cups'], bowl: ['bowl', 'bowls'], plate: ['plate', 'plates'], slice: ['slice', 'slices'], tbsp: ['tbsp', 'tbsp'], tsp: ['tsp', 'tsp'], ml: ['ml', 'ml'], g: ['g', 'g'], glass: ['glass', 'glasses'] };
  function qtyText(q, unit) {
    if (unit === 'pc' || !unit) return `${fmtQty(q)} ×`;
    const n = UNIT_NAME[unit] || [unit, unit];
    return `${fmtQty(q)} ${q > 1 ? n[1] : n[0]}`;
  }
  function itemText(f, q) { return `${qtyText(q, f.unit)} ${f.name}`; }

  // ---------- Parsing "2 rotis", "1.5 cups rice", "250ml milk" ----------
  function normWord(w) {
    if (w.length > 3 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }
  function norm(t) {
    return String(t).toLowerCase().replace(/[^a-z0-9.\s/-]/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean).map(normWord).join(' ');
  }
  function toNum(s) {
    if (s == null || s === '') return null;
    if (NUM_WORDS[s] != null) return NUM_WORDS[s];
    if (s.includes('/')) { const [a, b] = s.split('/').map(Number); return b ? a / b : null; }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
  const UNIT_ALT = Object.keys(UNIT_WORDS).sort((a, b) => b.length - a.length).join('|');
  const NUM_ALT = '(\\d+(?:\\.\\d+)?|\\d+\\/\\d+|\\.\\d+|(?:' + Object.keys(NUM_WORDS).join('|') + ')(?=\\s))';
  const RE_FRONT = new RegExp('^' + NUM_ALT + '?\\s*(?:x\\s+|×\\s*)?(?:(' + UNIT_ALT + ')(?![a-z])\\.?\\s*)?(?:of\\s+)?(.+)$');
  const RE_BACK = new RegExp('^(.+?)\\s+' + NUM_ALT.replace('(?=\\s)', '(?=\\s|$)') + '\\s*(?:(' + UNIT_ALT + ')(?![a-z])\\.?)?\\s*$');

  function splitQty(text) {
    let t = String(text).toLowerCase().trim().replace(/½/g, '.5').replace(/¼/g, '.25').replace(/¾/g, '.75');
    t = t.replace(/(\d)\s*and\s*a\s*half/, (m, d) => String(Number(d) + 0.5));
    let m = t.match(RE_BACK);
    if (m && !/^\d/.test(t)) return { name: m[1].trim(), num: toNum(m[2]), unit: m[3] ? UNIT_WORDS[m[3]] : null };
    m = t.match(RE_FRONT);
    if (m) return { name: (m[3] || '').trim(), num: toNum(m[1]), unit: m[2] ? UNIT_WORDS[m[2]] : null };
    return { name: t, num: null, unit: null };
  }

  function scoreFood(qn, f) {
    if (!qn) return 0;
    const qTokens = qn.split(' ');
    let best = 0;
    const names = [f.name].concat(f.alias || []);
    names.forEach((raw, i) => {
      const s = norm(raw);
      if (!s) return;
      const pen = i === 0 ? 0 : 3;
      let sc = 0;
      if (s === qn) sc = 100;
      else if (s.startsWith(qn)) sc = 86 - Math.min(20, s.length - qn.length);
      else {
        const sTok = s.split(' ');
        if (qTokens.every((q) => sTok.some((w) => w.startsWith(q)))) sc = 74;
        else if (s.includes(qn)) sc = 62;
        else if (qn.includes(s) && s.length >= 3) sc = 58;
        else {
          const hits = qTokens.filter((q) => q.length > 2 && sTok.some((w) => w.startsWith(q) || q.startsWith(w))).length;
          sc = hits ? (hits / Math.max(qTokens.length, sTok.length)) * 50 : 0;
        }
      }
      best = Math.max(best, sc - pen);
    });
    return best;
  }

  // Convert a typed quantity into the food's own unit.
  function toFoodUnit(f, num, unit) {
    const por = porOf(f);
    if (num == null && !unit) return por[1];
    const n = num == null ? 1 : num;
    if (!unit || unit === f.unit) {
      if (!unit && (f.unit === 'g' || f.unit === 'ml') && n <= 12) return f.each ? round(n * f.each, 1) : n * por[1];
      return n;
    }
    if (unit === 'handful') return f.unit === 'g' ? n * 30 : n * por[1];
    const dens = f.dens || 1;
    if (VOL[unit] && VOL[f.unit]) return round((n * VOL[unit]) / VOL[f.unit], 2);
    if (MASS[unit] && MASS[f.unit]) return round((n * MASS[unit]) / MASS[f.unit], 2);
    if (VOL[unit] && f.unit === 'g') return round(n * VOL[unit] * dens, 1);
    if (MASS[unit] && VOL[f.unit]) return round((n * MASS[unit]) / dens / VOL[f.unit], 2);
    if (unit === 'glass' && f.unit !== 'ml') return n * por[1];
    return n * por[1]; // pc / plate / serving of a cup food → that many typical portions
  }

  // Returns ranked matches: [{food, qty, kcal, score}]
  function parse(st, text, limit = 6) {
    const sp = splitQty(text);
    const qn = norm(sp.name);
    if (!qn) return { parts: sp, matches: [] };
    const list = allFoods(st)
      .map((f) => ({ f, sc: scoreFood(qn, f) + (st.custom.includes(f) ? 1 : 0) }))
      .filter((x) => x.sc >= 25)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, limit)
      .map(({ f, sc }) => {
        const qty = Math.max(0, toFoodUnit(f, sp.num, sp.unit));
        return { food: f, qty, kcal: Math.round(qty * kcalOf(st, f)), score: sc };
      });
    return { parts: sp, matches: list };
  }

  // ---------- Day data ----------
  function getDay(st, key) { return st.days[key] || { log: [] }; }
  function ensureDay(st, key) {
    if (!st.days[key]) st.days[key] = { target: st.settings.target, log: [] };
    if (st.days[key].target == null) st.days[key].target = st.settings.target;
    if (!st.days[key].log) st.days[key].log = [];
    return st.days[key];
  }
  function dayTarget(st, key) { const d = st.days[key]; return d && d.target != null ? d.target : st.settings.target; }
  const entryKcal = (e) => Math.round(e.q * e.kpu);
  function consumed(st, key) { return sum(getDay(st, key).log || [], entryKcal); }

  // ---------- Meal builders ----------
  function makeItem(st, id, typ, min, max, step, extra) {
    const f = food(st, id);
    return Object.assign({ id, q: typ, min, max, step, kpu: kcalOf(st, f), name: f.name, unit: f.unit }, extra || {});
  }
  const itemsKcal = (items) => sum(items, (i) => i.q * i.kpu);

  function finalize(items) {
    return items.map((i) => ({ id: i.id, q: round(i.q, 2), kcal: Math.round(i.q * i.kpu), name: i.name, unit: i.unit, room: !!i.room, kpu: i.kpu }));
  }

  // Mess meal: start from normal portions, scale staples toward the budget.
  function buildMess(st, slotId, dateKey, budget, tight) {
    let ids = ((st.mess || {})[weekdayOf(dateKey)] || {})[slotId] || [];
    let generic = false;
    if (!ids.length) { ids = GENERIC_MESS[slotId] || []; generic = true; }
    const items = [];
    const skipped = [];
    ids.forEach((id) => {
      const f = food(st, id);
      if (!f) return;
      if (!allowed(st, f)) { skipped.push(f.name); return; }
      const [min, typ, max, step] = porOf(f);
      items.push(makeItem(st, id, typ, min, max, step, { role: f.role || 'side' }));
    });
    const staples = items.filter((i) => i.role === 'staple');
    let total = itemsKcal(items);
    // scale up staples, round-robin, smallest fill ratio first
    let guard = 0;
    while (total < budget - 40 && guard++ < 40) {
      const c = staples.filter((i) => i.q + i.step <= i.max + 1e-9 && i.step * i.kpu <= budget - total + 60)
        .sort((a, b) => (a.q - a.min) / (a.max - a.min || 1) - (b.q - b.min) / (b.max - b.min || 1))[0];
      if (!c) break;
      c.q += c.step; total += c.step * c.kpu;
    }
    guard = 0;
    // keep normal portions unless the day is nearly done; eating a bit over is fine
    while (total > budget + 80 && guard++ < 40) {
      const c = staples.filter((i) => i.q - i.step >= (tight ? i.min : porOf(food(st, i.id))[1]) - 1e-9)
        .sort((a, b) => (b.q - b.min) - (a.q - a.min))[0];
      if (!c) break;
      c.q -= c.step; total -= c.step * c.kpu;
    }
    // ghee on rice/dal/roti if still short
    const gheeable = items.some((i) => ['rice', 'dal', 'roti', 'khichdi', 'paratha', 'bhakri', 'jeera_rice', 'pulao'].includes(i.id));
    if (total < budget - 90 && gheeable && usable(st, 'ghee')) {
      const n = Math.min(2, Math.max(1, Math.round((budget - total) / 45)));
      items.push(makeItem(st, 'ghee', n, 1, 2, 1, { room: true, role: 'topup' }));
      total += n * kcalOf(st, food(st, 'ghee'));
    }
    return { items: finalize(items), kcal: Math.round(total), skipped, generic };
  }

  function roomCandidates(st, seed) {
    const combos = COMBOS.slice();
    // user's custom room foods become their own options
    (st.custom || []).filter(isRoomFood).forEach((f) => {
      const [min, typ, max, step] = porOf(f);
      combos.push({ id: 'c:' + f.id, s: 6, items: [[f.id, typ, min, max, step]] });
    });
    const covered = new Set();
    combos.forEach((c) => c.items.forEach(([id]) => covered.add(id)));
    NUTS.forEach((n) => covered.add(n));
    // any other stocked room food that isn't a topping
    roomList(st).forEach((id) => {
      const f = food(st, id);
      if (!f || covered.has(id) || f.role === 'topup' || f.role === 'extra') return;
      const [min, typ, max, step] = porOf(f);
      combos.push({ id: 'x:' + id, s: 4, items: [[id, typ, min, max, step]] });
    });
    const out = [];
    combos.forEach((c) => {
      const items = [];
      for (const [fid, typ, min, max, step] of c.items) {
        let id = fid;
        if (fid === '@nuts') {
          const nuts = NUTS.filter((n) => usable(st, n));
          const pri = nuts.filter((n) => st.prefs.prioritize.includes(n));
          const pool = pri.length ? pri : nuts;
          if (!pool.length) return;
          id = pool[hash(seed + 'nuts') % pool.length];
        }
        if (!usable(st, id)) return;
        items.push(makeItem(st, id, typ, min, max, step, { room: true }));
      }
      out.push({ id: c.id, s: c.s, d: !!c.d, meal: c.meal || 0, items });
    });
    return out;
  }

  // Room meal/snack: greedy pick of combos, then fine-tune quantities.
  function buildRoom(st, budget, ctx) {
    const seed = ctx.seed || '';
    const used = ctx.used || new Set();
    const maxCombos = ctx.maxCombos || 3;
    const cands = roomCandidates(st, seed).map((c) => {
      const pri = c.items.some((i) => st.prefs.prioritize.includes(i.id)) ? 7 : 0;
      return Object.assign(c, { score: c.s + (ctx.meal ? c.meal : 0) + (hash(seed + c.id) % 5) + pri - (used.has(c.id) ? 8 : 0), k: itemsKcal(c.items) });
    }).sort((a, b) => b.score - a.score);
    if (!cands.length) return { items: [], kcal: 0, combos: [], empty: true };

    let chosen = [];
    if (budget < 150) {
      const one = cands.slice().sort((a, b) => Math.abs(a.k - budget) - Math.abs(b.k - budget) - (b.score - a.score) * 4)[0];
      chosen = [one];
    } else {
      const usedFoods = new Set();
      let total = 0;
      let drink = false;
      for (const c of cands) {
        if (chosen.length >= maxCombos) break;
        if (c.items.some((i) => usedFoods.has(i.id))) continue;
        if (c.d && drink) continue;
        const minK = sum(c.items, (i) => i.min * i.kpu);
        if (total + minK > budget + 50) continue;
        chosen.push(c); c.items.forEach((i) => usedFoods.add(i.id)); total += c.k; if (c.d) drink = true;
        if (budget - total < 70) break;
      }
      if (!chosen.length) chosen = [cands[0]];
    }
    const items = [].concat(...chosen.map((c) => c.items));
    let total = itemsKcal(items);
    // shrink first if over
    let guard = 0;
    while (total > budget + 60 && guard++ < 50) {
      const c = items.filter((i) => i.q - i.step >= i.min - 1e-9).sort((a, b) => b.step * b.kpu - a.step * a.kpu)[0];
      if (!c) break;
      c.q -= c.step; total -= c.step * c.kpu;
    }
    // then grow toward the budget, densest foods first
    guard = 0;
    while (total < budget - 30 && guard++ < 60) {
      const c = items.filter((i) => i.q + i.step <= i.max + 1e-9 && i.step * i.kpu <= budget - total + 30)
        .sort((a, b) => (a.q - a.min) / (a.max - a.min || 1) - (b.q - b.min) / (b.max - b.min || 1) || b.kpu - a.kpu)[0];
      if (!c) break;
      c.q += c.step; total += c.step * c.kpu;
    }
    chosen.forEach((c) => used.add(c.id));
    return { items: finalize(items), kcal: Math.round(total), combos: chosen.map((c) => c.id) };
  }

  // ---------- The planner ----------
  // nowMin: minutes since midnight for today; null = plan the whole day fresh.
  function planDay(st, dateKey, nowMin, opt) {
    opt = opt || {};
    const day = opt.fresh ? { log: [] } : getDay(st, dateKey);
    const target = opt.target || dayTarget(st, dateKey);
    const log = day.log || [];
    const eaten = sum(log, entryKcal);
    const remaining = target - eaten;
    const variant = day.variant || {};
    const seedBase = dateKey + ':' + (st.weekSeed || 0);

    const slots = SLOTS.filter((s) => s.id !== 'late' || log.some((e) => e.m === 'late')).map((s) => {
      const has = log.some((e) => e.m === s.id) || (day.done && day.done[s.id]);
      const skipped = day.skip && day.skip[s.id];
      const passed = nowMin != null && nowMin > s.end + GRACE;
      const status = has ? 'eaten' : skipped ? 'skipped' : passed ? 'missed' : 'pending';
      return { id: s.id, name: s.name, start: s.start, end: s.end, mess: !!s.mess, status, eatenKcal: sum(log.filter((e) => e.m === s.id), entryKcal) };
    });

    const plan = [];
    const used = new Set();
    let left = Math.max(0, remaining);
    let overflow = 0;
    if (remaining > 60) {
      const pending = slots.filter((s) => s.status === 'pending' && s.id !== 'late');
      const W = sum(pending, (p) => SLOT[p.id].w) || 1;
      const isMess = (s) => SLOT[s.id].mess && !(day.replace && day.replace[s.id]);
      const messSlots = pending.filter(isMess);
      const roomSlots = pending.filter((s) => !isMess(s));
      // Pass 1: mess meals are the main source, sized to their normal share of the day.
      const buildAllMess = (extra) => messSlots.map((s) => {
        const budget = (left * SLOT[s.id].w) / W + (extra * SLOT[s.id].w) / (sum(messSlots, (p) => SLOT[p.id].w) || 1);
        return Object.assign(buildMess(st, s.id, dateKey, budget, true), { source: 'mess', budget: Math.round(budget), s });
      });
      let messMeals = buildAllMess(0);
      let messTotal = sum(messMeals, (m) => m.kcal);
      // Pass 2: snacks / replacements fill whatever the mess doesn't cover.
      let roomLeft = Math.max(0, left - messTotal);
      const roomMeals = roomSlots.map((s, i) => {
        const def = SLOT[s.id];
        const wsum = sum(roomSlots.slice(i), (p) => SLOT[p.id].w);
        const budget = i === roomSlots.length - 1 ? roomLeft : (roomLeft * def.w) / wsum;
        const seed = seedBase + s.id + ':' + (variant[s.id] || 0);
        if (budget < 60 && !def.mess) return null;
        const meal = Object.assign(buildRoom(st, budget, { seed, used, maxCombos: def.mess ? 4 : 3, meal: def.mess }), { source: 'room', replaced: !!def.mess, budget: Math.round(budget), s });
        roomLeft = Math.max(0, roomLeft - meal.kcal);
        return meal;
      }).filter(Boolean);
      // Pass 3: if room food can't cover the rest (nothing in stock), take bigger mess portions.
      const gap = left - messTotal - sum(roomMeals, (m) => m.kcal);
      if (gap > 100 && messMeals.length) { messMeals = buildAllMess(gap); messTotal = sum(messMeals, (m) => m.kcal); }
      messMeals.concat(roomMeals).sort((a, b) => a.s.start - b.s.start).forEach((m) => {
        const s = m.s; delete m.s;
        plan.push(Object.assign({ slot: s.id, name: s.name, start: s.start, end: s.end }, m));
      });
      left = Math.max(0, left - messTotal - sum(roomMeals, (m) => m.kcal));
      const lateDone = slots.some((s) => s.id === 'late' && s.status !== 'pending');
      if (left > 120 && !lateDone && !(day.skip && day.skip.late)) {
        const b = Math.min(left, LATE_CAP);
        const meal = buildRoom(st, b, { seed: seedBase + 'late:' + (variant.late || 0), used, maxCombos: 3 });
        if (meal.items.length) {
          plan.push(Object.assign({ slot: 'late', name: SLOT.late.name, start: SLOT.late.start, end: SLOT.late.end, source: 'room', budget: Math.round(b) }, meal));
          left = Math.max(0, left - meal.kcal);
        }
      }
      overflow = Math.round(left);
    }
    const planned = sum(plan, (p) => p.kcal);
    return {
      date: dateKey, target, eaten: Math.round(eaten), remaining: Math.round(remaining),
      planned: Math.round(planned), messKcal: Math.round(sum(plan.filter((p) => p.source === 'mess'), (p) => sum(p.items.filter((i) => !i.room), (i) => i.kcal))),
      roomKcal: Math.round(sum(plan, (p) => sum(p.items.filter((i) => i.room || p.source === 'room'), (i) => i.kcal))),
      slots, plan, overflow,
    };
  }

  // A "usual" portion for a slot (used for "I ate it, log usual").
  function usualMeal(st, dateKey, slotId) {
    const def = SLOT[slotId];
    const budget = dayTarget(st, dateKey) * (def.w || 0.15);
    return def.mess ? buildMess(st, slotId, dateKey, budget) : buildRoom(st, budget, { seed: dateKey + slotId + 'usual' });
  }

  // ---------- "What should I eat now?" ----------
  function eatNow(st, dateKey, nowMin) {
    const p = planDay(st, dateKey, nowMin);
    const res = { remaining: p.remaining, target: p.target, eaten: p.eaten, plan: p };
    if (p.remaining <= 60) return Object.assign(res, { kind: 'done' });
    const current = p.plan.find((m) => m.start <= nowMin + 20 && nowMin <= m.end + GRACE);
    const later = p.plan.filter((m) => m !== current && m.start > nowMin);
    if (current) return Object.assign(res, { kind: 'now', now: current, next: later[0] || null });
    const next = later[0];
    if (!next) {
      const any = p.plan[0];
      return any ? Object.assign(res, { kind: 'now', now: any, next: null }) : Object.assign(res, { kind: 'empty' });
    }
    const wait = next.start - nowMin;
    if (wait > 75 && p.remaining > 500) {
      const bridge = buildRoom(st, Math.min(300, p.remaining - p.planned + 250), { seed: dateKey + 'bridge' + Math.floor(nowMin / 60) + (st.weekSeed || 0), maxCombos: 2 });
      if (bridge.items.length) return Object.assign(res, { kind: 'bridge', now: Object.assign({ slot: 'bridge', name: 'Small snack now', source: 'room' }, bridge), next, wait });
    }
    return Object.assign(res, { kind: 'wait', next, wait });
  }

  // ---------- Weekly plan + shopping list ----------
  function weekPlan(st, startKey) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(startKey, i);
      days.push(planDay(st, k, null, { fresh: true, target: st.settings.target }));
    }
    const shop = {};
    days.forEach((d) => d.plan.forEach((m) => m.items.forEach((it) => {
      if (!(m.source === 'room' || it.room)) return;
      shop[it.id] = shop[it.id] || { id: it.id, name: it.name, unit: it.unit, q: 0 };
      shop[it.id].q += it.q;
    })));
    return { days, shop: Object.values(shop).sort((a, b) => b.q * (kcalOf(st, food(st, b.id)) || 0) - a.q * (kcalOf(st, food(st, a.id)) || 0)) };
  }

  // ---------- Analytics ----------
  function dayStats(st, key) {
    const d = getDay(st, key);
    const target = dayTarget(st, key);
    const log = d.log || [];
    const c = sum(log, entryKcal);
    const meals = new Set(log.map((e) => e.m)).size;
    return { date: key, target, consumed: Math.round(c), pct: target ? c / target : 0, hit: c >= target * 0.95, meals, items: log.length, weight: d.weight != null ? d.weight : null, logged: log.length > 0 };
  }
  function weights(st) {
    return Object.keys(st.days).filter((k) => st.days[k].weight != null).sort().map((k) => ({ date: k, kg: st.days[k].weight }));
  }
  function linreg(pts) { // pts: [{x,y}]
    const n = pts.length;
    if (n < 2) return null;
    const mx = sum(pts, (p) => p.x) / n, my = sum(pts, (p) => p.y) / n;
    let num = 0, den = 0;
    pts.forEach((p) => { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; });
    if (!den) return null;
    const slope = num / den;
    return { slope, intercept: my - slope * mx };
  }
  function avgIntake(st, fromKey, toKey) {
    const days = [];
    for (let k = fromKey; k <= toKey; k = addDays(k, 1)) { const s = dayStats(st, k); if (s.logged) days.push(s.consumed); }
    return days.length ? { avg: sum(days) / days.length, n: days.length } : { avg: null, n: 0 };
  }

  function forecast(st, todayKey) {
    const S = st.settings;
    const ws = weights(st);
    const last = ws[ws.length - 1];
    const current = last ? last.kg : S.startWeight;
    const daysLeft = Math.max(0, diffDays(todayKey, S.goalDate));
    const toGo = round(S.goalWeight - current, 2);
    // observed trend: last 21 days of weigh-ins
    const recent = ws.filter((w) => diffDays(w.date, todayKey) <= 21);
    const span = recent.length ? diffDays(recent[0].date, recent[recent.length - 1].date) : 0;
    let observed = null;
    if (recent.length >= 3 && span >= 7) {
      const r = linreg(recent.map((w) => ({ x: diffDays(S.startDate, w.date), y: w.kg })));
      if (r) observed = r.slope; // kg/day
    }
    let maint = S.maintenance;
    let maintSource = 'setting';
    if (observed != null) {
      const ai = avgIntake(st, recent[0].date, recent[recent.length - 1].date);
      if (ai.n >= 5) {
        maint = Math.min(3500, Math.max(1200, ai.avg - observed * KCAL_PER_KG));
        maintSource = 'data';
      }
    }
    const a7 = avgIntake(st, addDays(todayKey, -6), todayKey);
    const intake = a7.n >= 3 ? a7.avg : S.target;
    const modelRate = (intake - maint) / KCAL_PER_KG;
    const rate = observed != null ? observed : modelRate;
    const projected = current + rate * daysLeft;
    const required = daysLeft > 0 ? maint + (toGo * KCAL_PER_KG) / daysLeft : null;
    const requiredRate = daysLeft > 0 ? toGo / daysLeft : null;
    const scen = [S.target - 200, S.target, S.target + 200].map((k) => ({ kcal: k, weight: round(current + ((k - maint) / KCAL_PER_KG) * daysLeft, 1) }));
    return {
      current, start: S.startWeight, goal: S.goalWeight, toGo, daysLeft, gained: round(current - S.startWeight, 2),
      observed, modelRate, rate, rateSource: observed != null ? 'observed' : 'model', intake, intakeSource: a7.n >= 3 ? 'avg' : 'target',
      maint: Math.round(maint), maintSource, projected: round(projected, 1), required: required && Math.round(required), requiredRate, scenarios: scen,
      progress: S.goalWeight !== S.startWeight ? Math.max(0, Math.min(1, (current - S.startWeight) / (S.goalWeight - S.startWeight))) : 0,
    };
  }

  function insights(st, todayKey) {
    const out = [];
    const last7 = [];
    for (let i = 6; i >= 0; i--) last7.push(dayStats(st, addDays(todayKey, -i)));
    const logged = last7.filter((d) => d.logged && d.date !== todayKey);
    const pool = logged.length ? logged : last7.filter((d) => d.logged);
    if (pool.length) {
      const avg = Math.round(sum(pool, (d) => d.consumed) / pool.length);
      const tgt = st.settings.target;
      out.push({ tone: avg >= tgt * 0.95 ? 'good' : 'warn', text: `You've averaged ${avg.toLocaleString('en-IN')} kcal/day over ${pool.length} logged day${pool.length > 1 ? 's' : ''}.` });
      const hits = pool.filter((d) => d.hit).length;
      out.push({ tone: hits >= pool.length * 0.7 ? 'good' : 'warn', text: `You hit your target on ${hits} of ${pool.length} day${pool.length > 1 ? 's' : ''}.` });
      if (avg < tgt - 150) out.push({ tone: 'tip', text: `About ${Math.round(tgt - avg).toLocaleString('en-IN')} kcal short per day. One banana + 2 tbsp peanut butter + 300 ml milk (~480) closes most of that.` });
    } else {
      out.push({ tone: 'tip', text: 'Log today’s meals and weigh in each morning. Trends appear after a few days.' });
    }
    const ws = weights(st);
    if (ws.length >= 2) {
      const lastW = ws[ws.length - 1];
      const prev = ws.filter((w) => diffDays(w.date, lastW.date) >= 6);
      const ref = prev.length ? prev[prev.length - 1] : ws[0];
      const ch = round(lastW.kg - ref.kg, 1);
      const days = diffDays(ref.date, lastW.date);
      out.push({ tone: ch > 0 ? 'good' : 'warn', text: `Weight ${ch >= 0 ? 'up' : 'down'} ${Math.abs(ch)} kg over the last ${days} day${days > 1 ? 's' : ''}.` });
    }
    const f = forecast(st, todayKey);
    if (f.rateSource === 'observed' && f.requiredRate != null) {
      out.push({ tone: f.observed >= f.requiredRate ? 'good' : 'warn', text: f.observed >= f.requiredRate ? 'You’re gaining at or above the pace your goal needs.' : `You’re gaining slower than your goal pace (${round(f.observed * 7, 2)} vs ${round(f.requiredRate * 7, 2)} kg/week).` });
    }
    return out;
  }

  G.Engine = {
    SLOTS, SLOT, KCAL_PER_KG, defaultState, migrate, allFoods, food, kcalOf, porOf, stepOf, allowed, usable, roomList, isRoomFood,
    fmtQty, qtyText, itemText, parse, splitQty, toFoodUnit, getDay, ensureDay, dayTarget, entryKcal, consumed,
    planDay, usualMeal, eatNow, weekPlan, buildRoom, buildMess, dayStats, weights, forecast, insights, avgIntake,
    keyOf, parseKey, addDays, diffDays, weekdayOf, round, sum, hash,
  };
})(typeof window !== 'undefined' ? window : globalThis);
