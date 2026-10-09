import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recipes = [
  // ───────────────────── Breakfast (7) ─────────────────────
  { name: 'Moroccan Mint Tea & Msemen', description: 'Traditional flatbread with honey', calories: 320, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['flour', 'semolina', 'butter', 'honey', 'mint tea']), prepTimeMinutes: 20 },
  { name: 'Harcha with Cheese', description: 'Semolina griddle bread with cheese', calories: 280, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['semolina', 'butter', 'cheese']), prepTimeMinutes: 15 },
  { name: 'Oatmeal with Fruits', description: 'Oats with banana and almonds', calories: 350, isMoroccan: false, mealType: 'breakfast', ingredients: JSON.stringify(['oats', 'milk', 'banana', 'almonds']), prepTimeMinutes: 10 },
  { name: 'Eggs with Khobz', description: 'Fried eggs with traditional bread', calories: 300, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['eggs', 'khobz bread', 'olive oil']), prepTimeMinutes: 10 },
  { name: 'Beghrir with Honey', description: 'Moroccan semolina pancakes with honey', calories: 290, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['flour', 'semolina', 'eggs', 'milk', 'honey']), prepTimeMinutes: 20 },
  { name: 'Avocado Toast with Egg', description: 'Whole wheat toast with avocado and poached egg', calories: 340, isMoroccan: false, mealType: 'breakfast', ingredients: JSON.stringify(['bread', 'avocado', 'eggs', 'olive oil']), prepTimeMinutes: 12 },
  { name: 'Labneh with Cucumber', description: 'Strained yogurt with fresh vegetables', calories: 220, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['yogurt', 'cucumber', 'olive oil', 'bread']), prepTimeMinutes: 8 },

  // ───────────────────── Lunch (9) ─────────────────────
  { name: 'Chicken Tagine with Olives', description: 'Slow-cooked chicken with preserved lemon', calories: 450, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['chicken', 'olives', 'preserved lemon', 'onion', 'spices']), prepTimeMinutes: 60 },
  { name: 'Couscous with Vegetables', description: 'Steamed couscous with seven vegetables', calories: 500, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['couscous', 'carrot', 'zucchini', 'chickpeas', 'pumpkin']), prepTimeMinutes: 45 },
  { name: 'Grilled Fish with Rice', description: 'Simple grilled fish, healthy option', calories: 400, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['fish', 'rice', 'lemon', 'garlic']), prepTimeMinutes: 30 },
  { name: 'Lentil Soup (Harira-style)', description: 'Protein-rich lentil soup', calories: 380, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['lentils', 'tomato', 'onion', 'spices']), prepTimeMinutes: 40 },
  { name: 'Grilled Chicken Salad', description: 'Lean protein with fresh vegetables', calories: 350, isMoroccan: false, mealType: 'lunch', ingredients: JSON.stringify(['chicken breast', 'lettuce', 'tomato', 'cucumber']), prepTimeMinutes: 20 },
  { name: 'Chicken Shawarma Bowl', description: 'Spiced chicken over rice with garlic sauce', calories: 480, isMoroccan: false, mealType: 'lunch', ingredients: JSON.stringify(['chicken breast', 'rice', 'yogurt', 'garlic', 'spices']), prepTimeMinutes: 35 },
  { name: 'Tuna Salad with Chickpeas', description: 'Protein-packed tuna and chickpea salad', calories: 380, isMoroccan: false, mealType: 'lunch', ingredients: JSON.stringify(['fish', 'chickpeas', 'tomato', 'cucumber', 'olive oil']), prepTimeMinutes: 15 },
  { name: 'Beef Kefta with Rice', description: 'Moroccan spiced ground beef meatballs', calories: 460, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['beef', 'onion', 'spices', 'rice', 'tomato']), prepTimeMinutes: 30 },
  { name: 'Rfissa with Lentils', description: 'Shredded chicken over torn msemen with lentils', calories: 520, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['chicken', 'flour', 'lentils', 'onion', 'spices']), prepTimeMinutes: 90 },

  // ───────────────────── Dinner (9) ─────────────────────
  { name: 'Harira Soup', description: 'Traditional Moroccan tomato and lentil soup', calories: 300, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['tomato', 'lentils', 'chickpeas', 'vermicelli']), prepTimeMinutes: 45 },
  { name: 'Vegetable Tagine', description: 'Light vegetarian tagine', calories: 280, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['carrot', 'potato', 'zucchini', 'spices']), prepTimeMinutes: 40 },
  { name: 'Grilled Chicken Breast', description: 'Simple lean protein dinner', calories: 320, isMoroccan: false, mealType: 'dinner', ingredients: JSON.stringify(['chicken breast', 'herbs', 'olive oil']), prepTimeMinutes: 25 },
  { name: 'Zaalouk with Bread', description: 'Smoky eggplant salad', calories: 250, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['eggplant', 'tomato', 'garlic', 'bread']), prepTimeMinutes: 30 },
  { name: 'Baked Sardines with Vegetables', description: 'Oven-baked sardines with chermoula and vegetables', calories: 350, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['fish', 'potato', 'tomato', 'garlic', 'olive oil']), prepTimeMinutes: 35 },
  { name: 'Stuffed Bell Peppers', description: 'Bell peppers stuffed with rice and ground meat', calories: 340, isMoroccan: false, mealType: 'dinner', ingredients: JSON.stringify(['bell pepper', 'rice', 'beef', 'onion', 'tomato']), prepTimeMinutes: 45 },
  { name: 'Moroccan Meatball Tagine', description: 'Kefta meatballs in tomato sauce with eggs', calories: 400, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['beef', 'tomato', 'onion', 'eggs', 'spices']), prepTimeMinutes: 40 },
  { name: 'Baked Chicken with Potatoes', description: 'Oven-roasted chicken with herbs and potato wedges', calories: 380, isMoroccan: false, mealType: 'dinner', ingredients: JSON.stringify(['chicken breast', 'potato', 'olive oil', 'herbs', 'garlic']), prepTimeMinutes: 50 },
  { name: 'Vegetable Couscous Bowl', description: 'Warm couscous with roasted seasonal vegetables', calories: 320, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['couscous', 'zucchini', 'carrot', 'chickpeas', 'olive oil']), prepTimeMinutes: 30 },

  // ───────────────────── Snack (6) ─────────────────────
  { name: 'Mixed Nuts & Dates', description: 'Energy-rich traditional snack', calories: 180, isMoroccan: true, mealType: 'snack', ingredients: JSON.stringify(['almonds', 'dates', 'walnuts']), prepTimeMinutes: 2 },
  { name: 'Fresh Orange Juice', description: 'Vitamin C boost', calories: 110, isMoroccan: true, mealType: 'snack', ingredients: JSON.stringify(['oranges']), prepTimeMinutes: 5 },
  { name: 'Greek Yogurt with Honey', description: 'Protein-rich snack', calories: 150, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['yogurt', 'honey']), prepTimeMinutes: 2 },
  { name: 'Apple with Peanut Butter', description: 'Balanced snack', calories: 200, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['apple', 'peanut butter']), prepTimeMinutes: 3 },
  { name: 'Carrot Sticks with Hummus', description: 'Fresh carrots with chickpea hummus', calories: 160, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['carrot', 'chickpeas', 'olive oil', 'garlic']), prepTimeMinutes: 5 },
  { name: 'Banana with Almond Butter', description: 'Fresh banana with almond butter', calories: 220, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['banana', 'almonds']), prepTimeMinutes: 2 },
];

async function main() {
  for (const recipe of recipes) {
    // ─── Skip if recipe with same name already exists ───
    const existing = await prisma.recipe.findFirst({
      where: { name: recipe.name },
    });
    if (existing) {
      console.log(`  skip: ${recipe.name} (already exists)`);
      continue;
    }

    const ingredientAmounts: Record<string, [number, string]> = {
      // ... keep your existing map ...
    };
    const names: string[] = JSON.parse(recipe.ingredients);
    const ingredients = names.map((name) => {
      const [qty, unit] = ingredientAmounts[name.toLowerCase()] ?? [25, 'g'];
      return { name, qty, unit };
    });
    const proteinGrams = Math.round(recipe.calories * 0.25 / 4);

    await prisma.recipe.create({
      data: {
        ...recipe,
        ingredients: JSON.stringify(ingredients),
        proteinGrams,
        carbGrams: Math.round(recipe.calories * 0.5 / 4),
        fatGrams: Math.round(recipe.calories * 0.25 / 9),
        tags: JSON.stringify([
          ...(recipe.isMoroccan ? ['moroccan', 'budget_friendly'] : []),
          ...(proteinGrams >= 20 ? ['high_protein'] : []),
        ]),
      },
    });
  }
  console.log(`Seed done.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });