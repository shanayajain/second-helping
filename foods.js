/* =====================================================================
   Second Helping — built-in food database
   ---------------------------------------------------------------------
   Every number here is an ESTIMATE for a typical hostel/home portion.
   Edit freely — the app reads this file on every load.

   Fields
     id      unique key (lowercase, no spaces). Don't change ids you have
             already logged, or old entries lose their link.
     name    what you see in the app
     unit    pc | slice | cup | bowl | plate | tbsp | tsp | g | ml
             (1 cup = 240 ml, 1 bowl = 200 ml, 1 glass = 250 ml)
     kcal    calories per ONE unit (per 1 g or 1 ml for g/ml foods)
     p       protein per unit in grams (optional, shown only as info)
     where   'mess' (served in the mess) | 'room' (keep in your room)
             | 'both'
     role    staple (planner scales these up/down) | side | extra
             | topup (only added to fill a gap, e.g. ghee)
     por     [min, typical, max, step] portion range in the food's unit
     alias   other words you might type
     each    grams per piece, so "5 almonds" works (g foods only)
     egg / nonveg   true if the food should be hidden by the
             Eggless / Vegetarian preferences
   ===================================================================== */
window.FOOD_DB = [
  // ---------- Breads & mess staples ----------
  { id: 'roti', name: 'Roti', unit: 'pc', kcal: 100, p: 3, where: 'mess', role: 'staple', por: [1, 2, 4, 1], alias: ['chapati', 'chapatti', 'phulka', 'rotli', 'fulka'] },
  { id: 'paratha', name: 'Paratha', unit: 'pc', kcal: 190, p: 4, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['plain paratha', 'parantha', 'laccha paratha'] },
  { id: 'aloo_paratha', name: 'Aloo paratha', unit: 'pc', kcal: 260, p: 6, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['stuffed paratha', 'gobi paratha', 'mooli paratha', 'paneer paratha'] },
  { id: 'thepla', name: 'Thepla', unit: 'pc', kcal: 120, p: 3, where: 'both', role: 'staple', por: [2, 3, 5, 1], alias: ['methi thepla'] },
  { id: 'puri', name: 'Puri', unit: 'pc', kcal: 100, p: 2, where: 'mess', role: 'staple', por: [2, 4, 6, 1], alias: ['poori'] },
  { id: 'bhakri', name: 'Bhakri', unit: 'pc', kcal: 150, p: 4, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: [] },
  { id: 'naan', name: 'Naan', unit: 'pc', kcal: 260, p: 8, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: ['butter naan', 'kulcha'] },
  { id: 'pav', name: 'Pav', unit: 'pc', kcal: 120, p: 4, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['bun', 'ladi pav'] },
  { id: 'bread', name: 'Bread', unit: 'slice', kcal: 75, p: 2.5, where: 'both', role: 'staple', por: [2, 2, 4, 1], alias: ['toast', 'bread slice', 'brown bread', 'white bread'] },

  // ---------- Rice ----------
  { id: 'rice', name: 'Rice', unit: 'cup', kcal: 205, p: 4, where: 'mess', role: 'staple', por: [0.5, 1.5, 2.5, 0.5], alias: ['chawal', 'plain rice', 'steamed rice', 'cooked rice', 'bhaat'] },
  { id: 'jeera_rice', name: 'Jeera rice', unit: 'cup', kcal: 240, p: 4, where: 'mess', role: 'staple', por: [0.5, 1.5, 2.5, 0.5], alias: ['fried rice'] },
  { id: 'pulao', name: 'Veg pulao', unit: 'cup', kcal: 260, p: 5, where: 'mess', role: 'staple', por: [0.5, 1.5, 2.5, 0.5], alias: ['pulav', 'veg pulav'] },
  { id: 'biryani', name: 'Veg biryani', unit: 'cup', kcal: 290, p: 6, where: 'mess', role: 'staple', por: [1, 1.5, 2.5, 0.5], alias: ['biriyani'] },
  { id: 'khichdi', name: 'Khichdi', unit: 'cup', kcal: 230, p: 8, where: 'mess', role: 'staple', por: [1, 1.5, 2.5, 0.5], alias: ['khichri', 'khichadi'] },

  // ---------- Breakfast items ----------
  { id: 'poha', name: 'Poha', unit: 'plate', kcal: 270, p: 5, where: 'mess', role: 'staple', por: [1, 1, 2, 0.5], alias: ['pauva', 'kanda poha'] },
  { id: 'upma', name: 'Upma', unit: 'plate', kcal: 250, p: 6, where: 'mess', role: 'staple', por: [1, 1, 2, 0.5], alias: ['rava upma'] },
  { id: 'idli', name: 'Idli', unit: 'pc', kcal: 60, p: 2, where: 'mess', role: 'staple', por: [2, 3, 5, 1], alias: ['idly'] },
  { id: 'dosa', name: 'Plain dosa', unit: 'pc', kcal: 170, p: 4, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: ['dosa', 'dosai'] },
  { id: 'masala_dosa', name: 'Masala dosa', unit: 'pc', kcal: 330, p: 7, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: [] },
  { id: 'uttapam', name: 'Uttapam', unit: 'pc', kcal: 220, p: 6, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: ['uthappam'] },
  { id: 'medu_vada', name: 'Medu vada', unit: 'pc', kcal: 130, p: 4, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['vada', 'wada'] },
  { id: 'dal_chilla', name: 'Dal chilla', unit: 'pc', kcal: 150, p: 7, where: 'mess', role: 'staple', por: [1, 2, 3, 1], alias: ['chilla', 'cheela', 'moong chilla', 'besan chilla', 'moong dal chilla'] },
  { id: 'dhokla', name: 'Dhokla', unit: 'pc', kcal: 40, p: 2, where: 'both', role: 'staple', por: [3, 5, 8, 1], alias: ['khaman', 'khaman dhokla'] },
  { id: 'handvo', name: 'Handvo', unit: 'pc', kcal: 160, p: 5, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: [] },
  { id: 'sandwich', name: 'Veg sandwich', unit: 'pc', kcal: 250, p: 7, where: 'mess', role: 'staple', por: [1, 1, 2, 1], alias: ['sandwich', 'grilled sandwich'] },
  { id: 'samosa', name: 'Samosa', unit: 'pc', kcal: 250, p: 4, where: 'mess', role: 'extra', por: [1, 1, 2, 1], alias: [] },

  // ---------- Dal, curries, sabzi (cup = 240 ml katori-and-a-half) ----------
  { id: 'dal', name: 'Dal', unit: 'cup', kcal: 180, p: 9, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['daal', 'dal tadka', 'dal fry', 'toor dal', 'yellow dal', 'moong dal', 'arhar dal', 'masoor dal'] },
  { id: 'dal_makhani', name: 'Dal makhani', unit: 'cup', kcal: 330, p: 12, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['maa ki dal'] },
  { id: 'rajma', name: 'Rajma', unit: 'cup', kcal: 240, p: 13, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['kidney beans', 'rajmah'] },
  { id: 'chole', name: 'Chole', unit: 'cup', kcal: 270, p: 12, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['chana', 'chana masala', 'chhole', 'chickpeas'] },
  { id: 'sambar', name: 'Sambar', unit: 'cup', kcal: 140, p: 6, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['sambhar'] },
  { id: 'kadhi', name: 'Kadhi', unit: 'cup', kcal: 160, p: 5, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['kadhi pakora', 'gujarati kadhi', 'kadi'] },
  { id: 'sabzi', name: 'Sabzi (mixed veg)', unit: 'cup', kcal: 150, p: 4, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: ['sabji', 'subzi', 'mix veg', 'mixed veg', 'veg curry', 'vegetable', 'shaak'] },
  { id: 'aloo_sabzi', name: 'Aloo sabzi', unit: 'cup', kcal: 200, p: 3, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: ['aloo', 'potato', 'aloo matar', 'jeera aloo', 'bataka nu shaak'] },
  { id: 'aloo_gobi', name: 'Aloo gobi', unit: 'cup', kcal: 170, p: 4, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: ['gobi', 'cauliflower'] },
  { id: 'bhindi', name: 'Bhindi', unit: 'cup', kcal: 150, p: 3, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: ['okra', 'bhindi masala'] },
  { id: 'undhiyu', name: 'Undhiyu', unit: 'cup', kcal: 250, p: 5, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: [] },
  { id: 'pav_bhaji', name: 'Pav bhaji (bhaji)', unit: 'cup', kcal: 220, p: 5, where: 'mess', role: 'side', por: [1, 1, 1.5, 0.5], alias: ['bhaji'] },
  { id: 'paneer_curry', name: 'Paneer curry', unit: 'cup', kcal: 320, p: 14, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['paneer butter masala', 'shahi paneer', 'kadai paneer', 'matar paneer', 'paneer sabzi'] },
  { id: 'palak_paneer', name: 'Palak paneer', unit: 'cup', kcal: 270, p: 12, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: [] },
  { id: 'soya_curry', name: 'Soya chunk curry', unit: 'cup', kcal: 220, p: 16, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['soya', 'nutrela', 'soya chunks'] },
  { id: 'egg_curry', name: 'Egg curry', unit: 'cup', kcal: 260, p: 13, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['anda curry'], egg: true },
  { id: 'chicken_curry', name: 'Chicken curry', unit: 'cup', kcal: 300, p: 25, where: 'mess', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['chicken'], nonveg: true },

  // ---------- Dairy ----------
  { id: 'curd', name: 'Curd', unit: 'bowl', kcal: 120, p: 6, where: 'both', role: 'side', por: [0.5, 1, 1.5, 0.5], alias: ['dahi', 'yogurt', 'yoghurt'] },
  { id: 'raita', name: 'Raita', unit: 'bowl', kcal: 110, p: 5, where: 'mess', role: 'side', por: [0.5, 1, 1, 0.5], alias: [] },
  { id: 'milk', name: 'Milk (full-fat)', unit: 'ml', kcal: 0.64, p: 0.033, where: 'both', role: 'side', por: [200, 250, 400, 50], alias: ['milk', 'doodh', 'full fat milk', 'whole milk', 'full cream milk'] },
  { id: 'toned_milk', name: 'Milk (toned)', unit: 'ml', kcal: 0.58, p: 0.031, where: 'room', role: 'side', por: [200, 250, 400, 50], alias: ['toned milk'] },
  { id: 'lassi', name: 'Lassi (sweet)', unit: 'ml', kcal: 0.85, p: 0.03, where: 'both', role: 'side', por: [200, 250, 400, 50], alias: ['sweet lassi', 'mango lassi'] },
  { id: 'flavoured_milk', name: 'Flavoured milk', unit: 'ml', kcal: 0.8, p: 0.03, where: 'room', role: 'side', por: [200, 200, 400, 100], alias: ['kool', 'milkshake', 'chocolate milk'] },
  { id: 'buttermilk', name: 'Chaas', unit: 'ml', kcal: 0.2, p: 0.01, where: 'both', role: 'extra', por: [200, 250, 400, 50], alias: ['buttermilk', 'chhaas', 'mattha'] },
  { id: 'greek_yogurt', name: 'Greek yogurt', unit: 'g', kcal: 0.95, p: 0.09, where: 'room', role: 'side', por: [100, 150, 200, 50], alias: ['greek yoghurt', 'hung curd'] },
  { id: 'paneer', name: 'Paneer (raw)', unit: 'g', kcal: 2.65, p: 0.18, where: 'room', role: 'side', por: [50, 50, 100, 25], alias: ['cottage cheese'] },
  { id: 'cheese_slice', name: 'Cheese slice', unit: 'pc', kcal: 60, p: 4, where: 'room', role: 'extra', por: [1, 1, 2, 1], alias: ['cheese'] },
  { id: 'tea', name: 'Tea (milk & sugar)', unit: 'cup', kcal: 90, p: 2, where: 'both', role: 'extra', por: [1, 1, 1, 1], alias: ['chai'] },
  { id: 'coffee', name: 'Coffee (milk & sugar)', unit: 'cup', kcal: 110, p: 3, where: 'both', role: 'extra', por: [1, 1, 1, 1], alias: ['cold coffee'] },

  // ---------- Eggs (hidden when Eggless is on) ----------
  { id: 'boiled_egg', name: 'Egg (boiled)', unit: 'pc', kcal: 75, p: 6, where: 'both', role: 'side', por: [1, 2, 3, 1], alias: ['egg', 'eggs', 'anda'], egg: true },
  { id: 'omelette', name: 'Omelette', unit: 'pc', kcal: 150, p: 10, where: 'mess', role: 'side', por: [1, 1, 2, 1], alias: ['omelet', 'bread omelette'], egg: true },

  // ---------- Small extras ----------
  { id: 'salad', name: 'Salad', unit: 'cup', kcal: 30, p: 1, where: 'mess', role: 'extra', por: [1, 1, 1, 1], alias: ['kachumber'] },
  { id: 'papad', name: 'Papad', unit: 'pc', kcal: 50, p: 2, where: 'mess', role: 'extra', por: [1, 1, 2, 1], alias: ['papadum'] },
  { id: 'chutney', name: 'Chutney', unit: 'tbsp', kcal: 30, p: 0.5, where: 'mess', role: 'extra', por: [1, 2, 3, 1], alias: ['coconut chutney', 'green chutney'] },
  { id: 'pickle', name: 'Pickle', unit: 'tbsp', kcal: 40, p: 0, where: 'both', role: 'extra', por: [1, 1, 1, 1], alias: ['achar', 'achaar'] },
  { id: 'sweet', name: 'Sweet (gulab jamun etc.)', unit: 'pc', kcal: 150, p: 2, where: 'mess', role: 'extra', por: [1, 1, 2, 1], alias: ['gulab jamun', 'mithai', 'dessert', 'jalebi', 'rasgulla', 'laddu'] },
  { id: 'kheer', name: 'Kheer', unit: 'cup', kcal: 280, p: 7, where: 'mess', role: 'extra', por: [0.5, 0.5, 1, 0.5], alias: ['payasam', 'rice pudding'] },
  { id: 'halwa', name: 'Halwa', unit: 'cup', kcal: 380, p: 5, where: 'mess', role: 'extra', por: [0.5, 0.5, 1, 0.5], alias: ['sheera', 'suji halwa'] },

  // ---------- Room foods: fruit ----------
  { id: 'banana', name: 'Banana', unit: 'pc', kcal: 105, p: 1.3, where: 'room', role: 'side', por: [1, 1, 2, 1], alias: ['kela'] },
  { id: 'apple', name: 'Apple', unit: 'pc', kcal: 95, p: 0.5, where: 'room', role: 'side', por: [1, 1, 1, 1], alias: ['seb'] },
  { id: 'orange', name: 'Orange', unit: 'pc', kcal: 60, p: 1, where: 'room', role: 'side', por: [1, 1, 2, 1], alias: ['santra'] },
  { id: 'chikoo', name: 'Chikoo', unit: 'pc', kcal: 70, p: 0.5, where: 'room', role: 'side', por: [1, 1, 2, 1], alias: ['sapota', 'chiku'] },
  { id: 'guava', name: 'Guava', unit: 'pc', kcal: 70, p: 2.5, where: 'room', role: 'side', por: [1, 1, 1, 1], alias: ['amrood', 'peru'] },

  // ---------- Room foods: dry fruits & nuts ----------
  { id: 'dates', name: 'Dates', unit: 'pc', kcal: 23, p: 0.2, where: 'room', role: 'side', por: [2, 3, 6, 1], alias: ['khajur', 'khajoor'] },
  { id: 'raisins', name: 'Raisins', unit: 'g', kcal: 3.0, p: 0.03, where: 'room', role: 'side', por: [15, 20, 40, 5], alias: ['kishmish'], each: 0.5 },
  { id: 'mixed_nuts', name: 'Mixed nuts', unit: 'g', kcal: 6.0, p: 0.2, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['nuts', 'dry fruits', 'trail mix'], each: 1.5 },
  { id: 'almonds', name: 'Almonds', unit: 'g', kcal: 5.8, p: 0.21, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['badam'], each: 1.2 },
  { id: 'cashews', name: 'Cashews', unit: 'g', kcal: 5.5, p: 0.18, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['kaju'], each: 1.5 },
  { id: 'walnuts', name: 'Walnuts', unit: 'g', kcal: 6.5, p: 0.15, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['akhrot'], each: 2.5 },
  { id: 'peanuts', name: 'Peanuts (roasted)', unit: 'g', kcal: 5.7, p: 0.25, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['moongfali', 'groundnuts', 'singdana'], each: 0.7 },
  { id: 'pistachios', name: 'Pistachios', unit: 'g', kcal: 5.6, p: 0.2, where: 'room', role: 'side', por: [20, 30, 50, 5], alias: ['pista'], each: 0.7 },
  { id: 'peanut_butter', name: 'Peanut butter', unit: 'tbsp', kcal: 95, p: 4, where: 'room', role: 'side', por: [1, 2, 3, 0.5], alias: ['pb'] },
  { id: 'chikki', name: 'Chikki', unit: 'pc', kcal: 120, p: 3, where: 'room', role: 'side', por: [1, 1, 2, 1], alias: ['peanut chikki', 'gud chikki'] },
  { id: 'makhana', name: 'Makhana (roasted)', unit: 'g', kcal: 4.0, p: 0.1, where: 'room', role: 'side', por: [20, 25, 40, 5], alias: ['fox nuts', 'phool makhana'] },

  // ---------- Room foods: packaged ----------
  { id: 'granola', name: 'Granola', unit: 'g', kcal: 4.6, p: 0.1, where: 'room', role: 'side', por: [30, 40, 60, 10], alias: [] },
  { id: 'muesli', name: 'Muesli', unit: 'g', kcal: 3.8, p: 0.1, where: 'room', role: 'side', por: [30, 40, 60, 10], alias: [] },
  { id: 'cornflakes', name: 'Cornflakes', unit: 'g', kcal: 3.8, p: 0.07, where: 'room', role: 'side', por: [30, 30, 50, 10], alias: ['cereal', 'corn flakes'] },
  { id: 'biscuits', name: 'Biscuits', unit: 'pc', kcal: 30, p: 0.4, where: 'room', role: 'side', por: [3, 4, 6, 1], alias: ['biscuit', 'parle g', 'marie', 'crackers', 'cookies'] },
  { id: 'digestive', name: 'Digestive biscuits', unit: 'pc', kcal: 70, p: 1, where: 'room', role: 'side', por: [2, 2, 4, 1], alias: ['digestive'] },
  { id: 'rusk', name: 'Rusk', unit: 'pc', kcal: 45, p: 1, where: 'room', role: 'side', por: [2, 3, 5, 1], alias: ['toast rusk'] },
  { id: 'namkeen', name: 'Namkeen', unit: 'g', kcal: 5.5, p: 0.12, where: 'room', role: 'side', por: [20, 30, 50, 10], alias: ['bhujia', 'sev', 'mixture', 'chivda', 'chevdo'] },
  { id: 'chocolate', name: 'Chocolate', unit: 'g', kcal: 5.4, p: 0.07, where: 'room', role: 'extra', por: [20, 25, 40, 5], alias: ['dairy milk'] },
  { id: 'khakhra', name: 'Khakhra', unit: 'pc', kcal: 60, p: 2, where: 'room', role: 'side', por: [2, 3, 4, 1], alias: [] },

  // ---------- Toppings (the planner only uses these to fill a gap) ----------
  { id: 'ghee', name: 'Ghee', unit: 'tsp', kcal: 45, p: 0, where: 'both', role: 'topup', por: [1, 1, 2, 1], alias: ['desi ghee'] },
  { id: 'butter', name: 'Butter', unit: 'tbsp', kcal: 100, p: 0, where: 'room', role: 'topup', por: [0.5, 0.5, 1, 0.5], alias: ['amul butter'] },
  { id: 'honey', name: 'Honey', unit: 'tbsp', kcal: 64, p: 0, where: 'room', role: 'topup', por: [1, 1, 1, 1], alias: ['shahad'] },
  { id: 'jam', name: 'Jam', unit: 'tbsp', kcal: 55, p: 0, where: 'room', role: 'topup', por: [1, 1, 2, 1], alias: [] },
];

/* Room foods that start "in stock" on first launch (from your plan). */
window.DEFAULT_STOCK = ['peanut_butter', 'mixed_nuts', 'almonds', 'cashews', 'walnuts', 'dates', 'raisins', 'bread', 'granola', 'biscuits', 'banana', 'apple', 'milk', 'lassi', 'curd'];

/* Sample hostel mess menu. Replace it on the Mess tab. */
window.DEFAULT_MESS = {
  mon: { breakfast: ['poha', 'paratha', 'curd'], lunch: ['rice', 'dal', 'roti', 'sabzi'], dinner: ['rice', 'roti', 'rajma', 'sabzi'] },
  tue: { breakfast: ['idli', 'sambar', 'chutney'], lunch: ['rice', 'dal', 'roti', 'aloo_gobi', 'curd'], dinner: ['roti', 'rice', 'chole', 'salad'] },
  wed: { breakfast: ['aloo_paratha', 'curd'], lunch: ['rice', 'kadhi', 'roti', 'bhindi'], dinner: ['roti', 'rice', 'dal_makhani', 'sabzi'] },
  thu: { breakfast: ['upma', 'bread', 'tea'], lunch: ['rice', 'dal', 'roti', 'sabzi', 'curd'], dinner: ['khichdi', 'kadhi', 'roti', 'papad'] },
  fri: { breakfast: ['masala_dosa', 'sambar'], lunch: ['rice', 'rajma', 'roti', 'sabzi'], dinner: ['roti', 'rice', 'paneer_curry', 'dal'] },
  sat: { breakfast: ['dal_chilla', 'bread', 'tea'], lunch: ['pulao', 'raita', 'roti', 'dal'], dinner: ['roti', 'rice', 'chole', 'sabzi'] },
  sun: { breakfast: ['puri', 'aloo_sabzi'], lunch: ['rice', 'dal', 'roti', 'sabzi', 'sweet'], dinner: ['biryani', 'raita', 'roti'] },
};
