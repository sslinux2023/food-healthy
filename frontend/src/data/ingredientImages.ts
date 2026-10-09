// Map ingredient names (lowercase, partial match) to image URLs or emoji fallbacks.
// If you later add real images, replace the `image` field with a path like "/images/oats.png".

export type IngredientVisual = {
  image?: string;   // optional real image URL
  emoji: string;    // fallback emoji
  bg: string;       // fallback background color (B&W theme)
};

export const ingredientVisuals: Record<string, IngredientVisual> = {
  oats:        { emoji: "🌾", bg: "#F5F5F5" },
  milk:        { emoji: "🥛", bg: "#FAFAFA" },
  banana:      { emoji: "🍌", bg: "#F5F5F5" },
  bananas:     { emoji: "🍌", bg: "#F5F5F5" },
  almonds:     { emoji: "🌰", bg: "#FAFAFA" },
  "olive oil": { emoji: "🫒", bg: "#F5F5F5" },
  flour:       { emoji: "🌾", bg: "#FAFAFA" },
  semolina:    { emoji: "🌾", bg: "#F5F5F5" },
  butter:      { emoji: "🧈", bg: "#FAFAFA" },
  honey:       { emoji: "🍯", bg: "#F5F5F5" },
  "mint tea":  { emoji: "🍵", bg: "#FAFAFA" },
  egg:         { emoji: "🥚", bg: "#F5F5F5" },
  eggs:        { emoji: "🥚", bg: "#F5F5F5" },
  "khobz bread": { emoji: "🍞", bg: "#FAFAFA" },
  bread:       { emoji: "🍞", bg: "#FAFAFA" },
  cheese:      { emoji: "🧀", bg: "#F5F5F5" },
  chicken:     { emoji: "🍗", bg: "#FAFAFA" },
  "chicken breast": { emoji: "🍗", bg: "#F5F5F5" },
  olives:      { emoji: "🫒", bg: "#FAFAFA" },
  "preserved lemon": { emoji: "🍋", bg: "#F5F5F5" },
  onion:       { emoji: "🧅", bg: "#FAFAFA" },
  spices:      { emoji: "🧂", bg: "#F5F5F5" },
  fish:        { emoji: "🐟", bg: "#FAFAFA" },
  rice:        { emoji: "🍚", bg: "#F5F5F5" },
  lemon:       { emoji: "🍋", bg: "#FAFAFA" },
  garlic:      { emoji: "🧄", bg: "#F5F5F5" },
  potato:      { emoji: "🥔", bg: "#FAFAFA" },
  zucchini:    { emoji: "🥒", bg: "#F5F5F5" },
  eggplant:    { emoji: "🍆", bg: "#FAFAFA" },
  apple:       { emoji: "🍎", bg: "#F5F5F5" },
  "peanut butter": { emoji: "🥜", bg: "#FAFAFA" },
  dates:       { emoji: "🌴", bg: "#F5F5F5" },
  walnuts:     { emoji: "🌰", bg: "#FAFAFA" },
  yogurt:      { emoji: "🥣", bg: "#F5F5F5" },
  oranges:     { emoji: "🍊", bg: "#FAFAFA" },
  bayd:        { emoji: "🥚", bg: "#F5F5F5" },
  hrtna:       { emoji: "🥫", bg: "#FAFAFA" },
  sfa:         { emoji: "🥣", bg: "#F5F5F5" },
};

export function getIngredientVisual(name: string): IngredientVisual {
  const key = name.toLowerCase().trim();
  // exact match first
  if (ingredientVisuals[key]) return ingredientVisuals[key];
  // partial match
  const found = Object.keys(ingredientVisuals).find((k) => key.includes(k));
  if (found) return ingredientVisuals[found];
  // default
  return { emoji: "🛒", bg: "#F5F5F5" };
}

