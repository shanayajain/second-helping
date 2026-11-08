// Run: node tests/engine.test.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['foods.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx);
const E = ctx.Engine; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const st = E.defaultState();
const P = (t) => { const r = E.parse(st, t).matches[0]; return r ? `${r.food.id} ${r.qty} ${r.kcal}` : 'none'; };
const cases = [['1 dal chilla','dal_chilla 1 150'],['2 rotis','roti 2 200'],['1 cup rice','rice 1 205'],['250 ml milk','milk 250 160'],['30 g almonds','almonds 30 174'],
 ['1.5 cups rice','rice 1.5 308'],['rice 1.5 cup','rice 1.5 308'],['300ml milk','milk 300 192'],['half cup dal','dal 0.5 90'],['banana','banana 1 105'],['2 tbsp pb','peanut_butter 2 190'],
 ['a glass of milk','milk 250 160'],['1 bowl curd','curd 1 120'],['aloo paratha','aloo_paratha 2 520'],['3 idlis','idli 3 180'],['5 almonds','almonds 6 35'],['chapati','roti 2 200'],['1 glass lassi','lassi 250 213']];
for (const [t, want] of cases) ok(P(t) === want, `parse "${t}" -> ${P(t)} (want ${want})`);
// planner
const k = '2026-11-08';
let p = E.planDay(st, k, 9 * 60 + 36);
console.log(JSON.stringify(p.plan.map(m => [m.slot, m.source, m.kcal, m.items.map(i => `${i.q} ${i.id}`).join(', ')])));
ok(Math.abs(p.planned - p.remaining) < 160, `fresh plan ${p.planned} ≈ remaining ${p.remaining}`);
E.ensureDay(st, k).log.push({ id: 'a', f: 'dal_chilla', q: 1, kpu: 150, m: 'breakfast' });
p = E.planDay(st, k, 9 * 60 + 40);
ok(p.remaining === 2250, 'remaining after chilla = 2250');
ok(!p.plan.some(m => m.slot === 'breakfast'), 'breakfast no longer planned');
console.log(p.planned, JSON.stringify(p.plan.map(m => [m.slot, m.kcal])));
st.days[k].log.push({ id: 'b', f: 'rice', q: 3.4, kpu: 205, m: 'lunch' });
p = E.planDay(st, k, 14 * 60);
ok(p.remaining === 2250 - 697, 'remaining after lunch'); console.log(p.planned, JSON.stringify(p.plan.map(m => [m.slot, m.kcal])));
st.days[k].replace = { dinner: true };
p = E.planDay(st, k, 14 * 60); const din = p.plan.find(m => m.slot === 'dinner');
ok(din && din.source === 'room', 'dinner replaced with room food'); console.log(JSON.stringify(din.items.map(i => `${i.q} ${i.id}=${i.kcal}`)));
// late evening, big remaining
p = E.planDay(st, k, 23 * 60); ok(p.plan.length === 1 && p.plan[0].slot === 'late', 'late-night only late snack'); console.log(p.plan[0].kcal, p.overflow);
// eat now
const st2 = E.defaultState(); const en = E.eatNow(st2, k, 11 * 60); console.log(en.kind, en.now && en.now.name, en.next && en.next.name);
const en2 = E.eatNow(st2, k, 14 * 60 + 10 - 60*4); console.log(en2.kind, en2.now && en2.now.name);
// week
const w = E.weekPlan(st2, k); w.days.forEach(d => ok(Math.abs(d.planned - 2400) < 200, `week ${d.date} ${d.planned}`));
console.log(JSON.stringify(w.shop.map(s => `${s.name} ${s.q}${s.unit}`)));
// empty stock
const st3 = E.defaultState(); st3.stock = {}; p = E.planDay(st3, k, 8*60); ok(p.plan.length >= 3, 'empty stock still plans mess');
// forecast
const f = E.forecast(st2, k); console.log(JSON.stringify(f));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
