# Second Helping

A phone-first weight-gain meal planner for hostel life. Log what you ate, see what's left, and get the rest of the day re-planned from your mess menu and the food in your room.

No server, no account, no build step. It's plain HTML/CSS/JS. Your data is saved in the phone's browser (localStorage).

```
second-helping/
├── index.html            app shell + bottom navigation
├── styles.css            all styling (light + dark)
├── foods.js              ← food database, default room stock, sample mess menu
├── engine.js             parsing, calorie maths, planner, forecasts (no UI)
├── app.js                screens and buttons
├── manifest.webmanifest  makes it installable
├── sw.js                 offline cache
├── icons/                home-screen icons
└── tests/engine.test.js  node tests for parser + planner
```

---

## 1. Run it on your laptop

You need Python 3 (already on macOS/Linux; on Windows install from python.org).

```bash
cd second-helping
python3 -m http.server 8000
```

Open http://localhost:8000 on the laptop.

Run the tests (optional, needs Node.js): `node tests/engine.test.js`

## 2. Open it on your iPhone

**Quick test on the same Wi-Fi:**

1. Find your laptop's IP: macOS `ipconfig getifaddr en0`, Windows `ipconfig` (IPv4 Address).
2. Start the server as above, then on the iPhone open Safari → `http://<that-IP>:8000`.

This works only while the laptop is on, and offline mode doesn't work over plain http. For daily use, host it (free, 5 minutes):

**Recommended: GitHub Pages (free, permanent https link)**

1. Create a free account at github.com → **New repository** → name it `second-helping`, Public → Create.
2. On the repo page click **uploading an existing file**, drag in *everything inside* the `second-helping` folder (including the `icons` folder), → **Commit changes**.
3. Repo **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. After ~1 minute your app is at `https://<your-username>.github.io/second-helping/`.

**Alternative: Netlify** — sign up free at netlify.com, go to *Add new site → Deploy manually*, drag the folder in. You get an https link.

## 3. Add it to your home screen

1. Open the https link in **Safari** (not Chrome — iOS only installs from Safari).
2. Tap the **Share** button (square with an arrow).
3. Scroll down → **Add to Home Screen** → Add.
4. Open it from the new icon. It runs full-screen like an app and works offline.

Note: the home-screen app keeps its own storage, separate from Safari. Start logging from the icon, not from a Safari tab. Settings (gear on Today) → **Backup & restore → Copy backup** lets you save everything into Notes now and then, and restore it on a new phone.

## 4. Change the food database

Everyday changes need no code:

- **Fix a calorie number:** tap the item in your log → change *kcal per …* → tick *Use this kcal from now on*. Or Foods → All foods → tap the food.
- **Add a food:** type it in the log bar → *Add "…" with my own calories*, or Foods → All foods → **New**.
- **Room stock:** Foods → My room → switches. Off = never suggested.

To change the built-in list itself, edit `foods.js`. Each line looks like:

```js
{ id: 'dal_chilla', name: 'Dal chilla', unit: 'pc', kcal: 150, p: 7, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['chilla', 'cheela'] },
```

| field | meaning |
|---|---|
| `id` | unique key; don't rename ids you've already logged |
| `unit` | `pc`, `slice`, `cup` (240 ml), `bowl` (200 ml), `plate`, `tbsp`, `tsp`, `g`, `ml` |
| `kcal` | calories per ONE unit (per 1 g / 1 ml for `g`/`ml` foods) |
| `where` | `mess`, `room` or `both` |
| `role` | `staple` (planner scales it), `side`, `extra`, `topup` (ghee etc., only fills gaps) |
| `por` | `[min, typical, max, step]` portion range the planner may use |
| `alias` | other words you might type |
| `egg` / `nonveg` | hidden when Eggless / Vegetarian is on |

The same file holds `DEFAULT_STOCK` (what starts "in stock") and `DEFAULT_MESS` (the sample menu). Those defaults only apply on first launch; after that your own data is used. After editing a hosted copy, bump `VERSION` in `sw.js` (e.g. `sh-v2`) so phones fetch the new files.

Meal times and each meal's share of the day live at the top of `engine.js` (`SLOTS`).

## 5. How the calorie maths works

**Logging.** `"2 rotis"`, `"1.5 cups rice"`, `"250ml milk"`, `"30 g almonds"`, `"half cup dal"`, `"a glass of lassi"`, `"5 almonds"` are split into number + unit + food name. The name is matched against food names and aliases. The unit is converted to the food's own unit (cup = 240 ml, bowl = 200 ml, glass = 250 ml, tbsp = 15 ml, handful = 30 g). With no number you get the typical portion. Calories = quantity × kcal per unit. The kcal per unit is saved with each entry, so later edits to the database don't rewrite your history.

**The four numbers on Today.**
- **Target** — your daily goal (Settings, default 2,400).
- **Eaten** — sum of everything logged today.
- **Remaining** — target − eaten.
- **Suggested** — what the plan for the rest of the day adds up to.

**Re-planning** (runs on every change, and every minute):
1. Meals you've logged, skipped, or whose time has passed (+30 min) drop out.
2. Remaining calories are split over the meals still to come by their normal share (breakfast 21%, mid-morning 13%, lunch 27%, evening 16%, dinner 23%).
3. **Mess first:** each remaining mess meal is built from that day's menu. Rice/roti/paratha-type staples are scaled within sensible portions toward the meal's share; sides (dal, sabzi, curd) stay at a normal portion. Disliked/blocked foods are left out. If you've kept ghee and a meal is short, a teaspoon or two is added.
4. **Room food fills the rest:** whatever the mess doesn't cover goes to the snack slots (and any mess meal you replaced), using only foods switched on in your room — peanut-butter bread, milk, nuts, banana, dates, lassi and so on — then quantities are nudged up or down to fit. Prioritised foods are picked first; only one drink per snack.
5. If calories are still left after dinner, a late snack appears (capped at ~700 kcal).

**What should I eat now?** looks at the clock: if a planned meal is due, that's the answer; if the next meal is more than 75 minutes away and plenty is left, it suggests a small snack to bridge the gap; otherwise it shows the next meal so you can eat it early.

**Forecast.** Uses ~7,700 kcal ≈ 1 kg.
- Until you have 3+ weigh-ins spanning a week: projected weight = current + (average intake − maintenance) ÷ 7,700 × days left. Maintenance starts at an assumed 1,650 kcal (change it in Settings).
- After that, your actual weight trend (straight-line fit over the last 21 days) takes over, and maintenance is re-estimated from your own intake and trend.
- Required intake = maintenance + (kg to go × 7,700) ÷ days left.

All of these are estimates. Early gains include water and food in the gut, and real bodies don't move in straight lines.
