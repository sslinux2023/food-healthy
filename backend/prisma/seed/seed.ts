import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recipes = [
  // Breakfast
  { name: 'Moroccan Mint Tea & Msemen', description: 'Traditional flatbread with honey', calories: 320, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['flour', 'semolina', 'butter', 'honey', 'mint tea']), prepTimeMinutes: 20 },
  { name: 'Harcha with Cheese', description: 'Semolina griddle bread with cheese', calories: 280, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['semolina', 'butter', 'cheese']), prepTimeMinutes: 15 },
  { name: 'Oatmeal with Fruits', description: 'Oats with banana and almonds', calories: 350, isMoroccan: false, mealType: 'breakfast', ingredients: JSON.stringify(['oats', 'milk', 'banana', 'almonds']), prepTimeMinutes: 10 },
  { name: 'Eggs with Khobz', description: 'Fried eggs with traditional bread', calories: 300, isMoroccan: true, mealType: 'breakfast', ingredients: JSON.stringify(['eggs', 'khobz bread', 'olive oil']), prepTimeMinutes: 10 },
  // Lunch
  { name: 'Chicken Tagine with Olives', description: 'Slow-cooked chicken with preserved lemon', calories: 450, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['chicken', 'olives', 'preserved lemon', 'onion', 'spices']), prepTimeMinutes: 60 },
  { name: 'Couscous with Vegetables', description: 'Steamed couscous with seven vegetables', calories: 500, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['couscous', 'carrot', 'zucchini', 'chickpeas', 'pumpkin']), prepTimeMinutes: 45 },
  { name: 'Grilled Fish with Rice', description: 'Simple grilled fish, healthy option', calories: 400, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['fish', 'rice', 'lemon', 'garlic']), prepTimeMinutes: 30 },
  { name: 'Lentil Soup (Harira-style)', description: 'Protein-rich lentil soup', calories: 380, isMoroccan: true, mealType: 'lunch', ingredients: JSON.stringify(['lentils', 'tomato', 'onion', 'spices']), prepTimeMinutes: 40 },
  { name: 'Grilled Chicken Salad', description: 'Lean protein with fresh vegetables', calories: 350, isMoroccan: false, mealType: 'lunch', ingredients: JSON.stringify(['chicken breast', 'lettuce', 'tomato', 'cucumber']), prepTimeMinutes: 20 },
  // Dinner
  { name: 'Harira Soup', description: 'Traditional Moroccan tomato and lentil soup', calories: 300, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['tomato', 'lentils', 'chickpeas', 'vermicelli']), prepTimeMinutes: 45 },
  { name: 'Vegetable Tagine', description: 'Light vegetarian tagine', calories: 280, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['carrot', 'potato', 'zucchini', 'spices']), prepTimeMinutes: 40 },
  { name: 'Grilled Chicken Breast', description: 'Simple lean protein dinner', calories: 320, isMoroccan: false, mealType: 'dinner', ingredients: JSON.stringify(['chicken breast', 'herbs', 'olive oil']), prepTimeMinutes: 25 },
  { name: 'Zaalouk with Bread', description: 'Smoky eggplant salad', calories: 250, isMoroccan: true, mealType: 'dinner', ingredients: JSON.stringify(['eggplant', 'tomato', 'garlic', 'bread']), prepTimeMinutes: 30 },
  // Snacks
  { name: 'Mixed Nuts & Dates', description: 'Energy-rich traditional snack', calories: 180, isMoroccan: true, mealType: 'snack', ingredients: JSON.stringify(['almonds', 'dates', 'walnuts']), prepTimeMinutes: 2 },
  { name: 'Fresh Orange Juice', description: 'Vitamin C boost', calories: 110, isMoroccan: true, mealType: 'snack', ingredients: JSON.stringify(['oranges']), prepTimeMinutes: 5 },
  { name: 'Greek Yogurt with Honey', description: 'Protein-rich snack', calories: 150, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['yogurt', 'honey']), prepTimeMinutes: 2 },
  { name: 'Apple with Peanut Butter', description: 'Balanced snack', calories: 200, isMoroccan: false, mealType: 'snack', ingredients: JSON.stringify(['apple', 'peanut butter']), prepTimeMinutes: 3 },
];

async function main() {
  for (const recipe of recipes) {
    await prisma.recipe.create({ data: recipe });
  }
  console.log(`Seeded ${recipes.length} recipes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
