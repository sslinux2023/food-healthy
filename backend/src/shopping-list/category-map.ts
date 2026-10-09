/**
 * Maps ingredient names to shopping categories.
 * Used to group items by supermarket aisle.
 */
export const INGREDIENT_CATEGORY: Record<string, string> = {
  // 🥕 Vegetables
  carrot: 'vegetables',
  zucchini: 'vegetables',
  tomato: 'vegetables',
  onion: 'vegetables',
  garlic: 'vegetables',
  eggplant: 'vegetables',
  potato: 'vegetables',
  pumpkin: 'vegetables',
  lettuce: 'vegetables',
  cucumber: 'vegetables',
  vegetables: 'vegetables',

  // 🥩 Proteins
  chicken: 'proteins',
  'chicken breast': 'proteins',
  fish: 'proteins',
  eggs: 'proteins',
  lentils: 'proteins',
  chickpeas: 'proteins',
  meat: 'proteins',

  // 🥛 Dairy
  milk: 'dairy',
  cheese: 'dairy',
  yogurt: 'dairy',
  butter: 'dairy',

  // 🍚 Pantry (grains, bread, pasta)
  flour: 'pantry',
  semolina: 'pantry',
  oats: 'pantry',
  couscous: 'pantry',
  rice: 'pantry',
  bread: 'pantry',
  'khobz bread': 'pantry',
  vermicelli: 'pantry',

  // 🍎 Fruits & Nuts
  banana: 'fruits',
  apple: 'fruits',
  oranges: 'fruits',
  almonds: 'fruits',
  walnuts: 'fruits',
  dates: 'fruits',

  // 🧂 Spices & Condiments
  honey: 'spices',
  'olive oil': 'spices',
  spices: 'spices',
  'mint tea': 'spices',
  olives: 'spices',
  'preserved lemon': 'spices',
  'peanut butter': 'spices',
  herbs: 'spices',
  salt: 'spices',
  pepper: 'spices',

  // 📦 Other (fallback)
};

export const CATEGORY_ORDER = [
  'vegetables',
  'proteins',
  'dairy',
  'fruits',
  'pantry',
  'spices',
  'other',
];

export const CATEGORY_LABELS: Record<string, { en: string; ar: string; emoji: string }> = {
  vegetables: { en: 'Vegetables', ar: 'خضروات', emoji: '🥕' },
  proteins: { en: 'Proteins', ar: 'بروتينات', emoji: '🥩' },
  dairy: { en: 'Dairy', ar: 'منتجات الحليب', emoji: '🥛' },
  fruits: { en: 'Fruits & Nuts', ar: 'فواكه ومكسرات', emoji: '🍎' },
  pantry: { en: 'Pantry', ar: 'مؤونة', emoji: '🍚' },
  spices: { en: 'Spices & Oils', ar: 'بهارات وزيوت', emoji: '🧂' },
  other: { en: 'Other', ar: 'أخرى', emoji: '📦' },
};

/**
 * Estimates cost per unit in centimes MAD.
 * Based on typical Moroccan souk/market prices (2025).
 */
export const INGREDIENT_COST_PER_UNIT: Record<string, number> = {
  // Vegetables (per gram in centimes)
  carrot: 1,        // ~10 MAD/kg
  zucchini: 1,      // ~10 MAD/kg
  tomato: 1,        // ~8 MAD/kg
  onion: 1,         // ~7 MAD/kg
  garlic: 4,        // ~40 MAD/kg
  eggplant: 1,      // ~10 MAD/kg
  potato: 1,        // ~7 MAD/kg
  pumpkin: 1,       // ~8 MAD/kg
  lettuce: 2,       // ~15 MAD/kg
  cucumber: 1,      // ~10 MAD/kg

  // Proteins
  chicken: 6,       // ~60 MAD/kg
  'chicken breast': 8, // ~80 MAD/kg
  fish: 7,          // ~70 MAD/kg
  eggs: 150,        // ~1.5 MAD per egg (per piece)
  lentils: 2,       // ~18 MAD/kg
  chickpeas: 2,     // ~20 MAD/kg

  // Dairy
  milk: 1,          // ~8 MAD/L = 0.8 centimes/ml → round to 1
  cheese: 8,        // ~80 MAD/kg
  yogurt: 1,        // ~10 MAD/125g → 8 centimes per gram → round
  butter: 10,       // ~100 MAD/kg

  // Pantry
  flour: 1,         // ~8 MAD/kg
  semolina: 1,      // ~8 MAD/kg
  oats: 2,          // ~20 MAD/kg
  couscous: 1,      // ~10 MAD/kg
  rice: 2,          // ~18 MAD/kg
  bread: 1,         // ~5 MAD per 300g → 1.6 centimes per gram
  'khobz bread': 1,
  vermicelli: 1,

  // Fruits & Nuts
  banana: 150,      // ~1.5 MAD per piece
  apple: 200,       // ~2 MAD per piece
  oranges: 150,     // ~1.5 MAD per piece
  almonds: 10,      // ~100 MAD/kg
  walnuts: 15,      // ~150 MAD/kg
  dates: 500,       // ~5 MAD per piece

  // Spices & Oils
  honey: 10,        // ~100 MAD/kg
  'olive oil': 8,   // ~80 MAD/L
  spices: 20,       // ~200 MAD/kg
  'mint tea': 1,    // ~10 MAD/L
  olives: 4,        // ~40 MAD/kg
  'preserved lemon': 3,
  'peanut butter': 6,
  herbs: 3,
};

/**
 * Estimate total cost of an item (quantity × costPerUnit).
 * Returns centimes.
 */
export function estimateCost(
  name: string,
  quantity: number,
  unit: string,
): number {
  const normalized = name.toLowerCase().trim();
  let costPerUnit = INGREDIENT_COST_PER_UNIT[normalized];

  // Fallback: try word-by-word match
  if (costPerUnit === undefined) {
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (INGREDIENT_COST_PER_UNIT[word] !== undefined) {
        costPerUnit = INGREDIENT_COST_PER_UNIT[word];
        break;
      }
    }
  }

  // Default fallback: 1 centime per gram/ml, or 100 per piece
  if (costPerUnit === undefined) {
    costPerUnit = unit === 'piece' ? 100 : 1;
  }

  return Math.round(costPerUnit * quantity);
}

/**
 * Get category for an ingredient. Falls back to "other".
 */
export function getCategory(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (INGREDIENT_CATEGORY[normalized]) return INGREDIENT_CATEGORY[normalized];

  // Word-by-word match
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (INGREDIENT_CATEGORY[word]) return INGREDIENT_CATEGORY[word];
  }

  return 'other';
}
