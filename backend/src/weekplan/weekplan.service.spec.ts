import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { WeekPlanService } from './weekplan.service.js';

describe('WeekPlanService', () => {
  it("scales meal portions so every day matches the user's calorie target", async () => {
    const recipes = [
      { id: 1, name: 'Oatmeal', mealType: 'breakfast', calories: 350, ingredients: 'oats' },
      { id: 2, name: 'Eggs', mealType: 'breakfast', calories: 320, ingredients: 'eggs' },
      { id: 9, name: 'Msemen', mealType: 'breakfast', calories: 330, ingredients: 'flour' },
      { id: 14, name: 'Harcha', mealType: 'breakfast', calories: 310, ingredients: 'semolina' },
      { id: 3, name: 'Couscous', mealType: 'lunch', calories: 500, ingredients: 'couscous' },
      { id: 4, name: 'Chicken Salad', mealType: 'lunch', calories: 450, ingredients: 'chicken' },
      { id: 10, name: 'Fish and Rice', mealType: 'lunch', calories: 480, ingredients: 'fish rice' },
      { id: 16, name: 'Lentil Lunch', mealType: 'lunch', calories: 460, ingredients: 'lentils' },
      { id: 5, name: 'Chicken Tagine', mealType: 'dinner', calories: 320, ingredients: 'chicken' },
      { id: 6, name: 'Lentils', mealType: 'dinner', calories: 300, ingredients: 'lentils' },
      { id: 11, name: 'Vegetable Soup', mealType: 'dinner', calories: 310, ingredients: 'vegetables' },
      { id: 13, name: 'Baked Fish', mealType: 'dinner', calories: 315, ingredients: 'fish' },
      { id: 17, name: 'Lentil Dinner', mealType: 'dinner', calories: 305, ingredients: 'lentils' },
      { id: 7, name: 'Dates', mealType: 'snack', calories: 200, ingredients: 'dates' },
      { id: 8, name: 'Yogurt', mealType: 'snack', calories: 180, ingredients: 'yogurt' },
      { id: 12, name: 'Orange', mealType: 'snack', calories: 150, ingredients: 'orange' },
      { id: 18, name: 'Nuts', mealType: 'snack', calories: 170, ingredients: 'nuts' },
    ];
    const planMeals: Array<{
      weekPlanId: number;
      recipeId: number;
      dayOfWeek: number;
      mealType: string;
      servings: number;
    }> = [];

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 42,
          onboardingCompleted: true,
          dailyCalories: 2016,
          foodDislikes: 'tagine',
        }),
      },
      recipe: {
        findMany: vi.fn(({ where }: { where: { mealType: string } }) =>
          Promise.resolve(recipes.filter((recipe) => recipe.mealType === where.mealType)),
        ),
      },
      weekPlanMeal: {
        deleteMany: vi.fn(),
        createMany: vi.fn(({ data }: { data: typeof planMeals }) => {
          planMeals.push(...data);
          return Promise.resolve({ count: data.length });
        }),
      },
      weekPlan: {
        deleteMany: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 10 }),
        findFirst: vi.fn(() =>
          Promise.resolve({
            id: 10,
            meals: planMeals.map((meal) => ({
              ...meal,
              recipe: recipes.find((recipe) => recipe.id === meal.recipeId),
            })),
          }),
        ),
      },
    } as unknown as PrismaService;

    const service = new WeekPlanService(prisma);
    const plan = await service.generate(42);

    expect(plan?.meals).toHaveLength(28);
    expect(plan?.meals.some((meal) => meal.recipe.name.toLowerCase().includes('tagine'))).toBe(false);

    for (let day = 0; day < 7; day += 1) {
      const dailyCalories = plan!.meals
        .filter((meal) => meal.dayOfWeek === day)
        .reduce((total, meal) => total + meal.recipe.calories! * meal.servings, 0);

      expect(dailyCalories).toBeCloseTo(2016, 0);
    }

    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const recipeUseCounts = new Map<number, number>();
      const mealsForType = Array.from({ length: 7 }, (_, day) =>
        plan!.meals.find((meal) => meal.dayOfWeek === day && meal.mealType === mealType),
      );
      for (const meal of mealsForType) {
        if (!meal) continue;
        recipeUseCounts.set(meal.recipeId, (recipeUseCounts.get(meal.recipeId) ?? 0) + 1);
        expect(meal.reason.length).toBeGreaterThan(0);
      }
      expect(Math.max(...recipeUseCounts.values())).toBeLessThanOrEqual(2);
      for (let day = 2; day < mealsForType.length; day += 1) {
        expect(mealsForType[day]?.recipeId).not.toBe(mealsForType[day - 1]?.recipeId);
        expect(mealsForType[day]?.recipeId).not.toBe(mealsForType[day - 2]?.recipeId);
      }
    }
  });

  it('regenerates a saved plan containing a newly disliked recipe', async () => {
    const recipes = [
      { id: 1, name: 'Oatmeal', mealType: 'breakfast', calories: 350, ingredients: 'oats' },
      { id: 6, name: 'Eggs', mealType: 'breakfast', calories: 320, ingredients: 'eggs' },
      { id: 7, name: 'Msemen', mealType: 'breakfast', calories: 330, ingredients: 'flour' },
      { id: 8, name: 'Harcha', mealType: 'breakfast', calories: 310, ingredients: 'semolina' },
      { id: 2, name: 'Couscous', mealType: 'lunch', calories: 500, ingredients: 'couscous' },
      { id: 9, name: 'Fish rice', mealType: 'lunch', calories: 480, ingredients: 'fish' },
      { id: 10, name: 'Chicken salad', mealType: 'lunch', calories: 450, ingredients: 'chicken' },
      { id: 11, name: 'Lentil lunch', mealType: 'lunch', calories: 460, ingredients: 'lentils' },
      { id: 3, name: 'Chicken Tagine', mealType: 'dinner', calories: 320, ingredients: 'chicken' },
      { id: 4, name: 'Vegetable Soup', mealType: 'dinner', calories: 300, ingredients: 'vegetables' },
      { id: 12, name: 'Baked Fish', mealType: 'dinner', calories: 315, ingredients: 'fish' },
      { id: 13, name: 'Lentil Dinner', mealType: 'dinner', calories: 305, ingredients: 'lentils' },
      { id: 18, name: 'Roasted Vegetables', mealType: 'dinner', calories: 290, ingredients: 'vegetables' },
      { id: 5, name: 'Dates', mealType: 'snack', calories: 200, ingredients: 'dates' },
      { id: 15, name: 'Yogurt', mealType: 'snack', calories: 180, ingredients: 'yogurt' },
      { id: 16, name: 'Orange', mealType: 'snack', calories: 150, ingredients: 'orange' },
      { id: 17, name: 'Nuts', mealType: 'snack', calories: 170, ingredients: 'nuts' },
    ];
    const createdMeals: Array<{
      weekPlanId: number;
      recipeId: number;
      dayOfWeek: number;
      mealType: string;
      servings: number;
    }> = [];
    const deleteManyMeals = vi.fn();
    const findFirst = vi.fn()
      .mockResolvedValueOnce({
        id: 1,
        meals: [
          {
            recipeId: 3,
            dayOfWeek: 0,
            mealType: 'dinner',
            servings: 1,
            recipe: recipes[2],
          },
        ],
      })
      .mockImplementationOnce(() =>
        Promise.resolve({
          id: 2,
          meals: createdMeals.map((meal) => ({
            ...meal,
            recipe: recipes.find((recipe) => recipe.id === meal.recipeId),
          })),
        }),
      );

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 42,
          onboardingCompleted: true,
          dailyCalories: 2000,
          foodDislikes: 'tagine',
        }),
      },
      recipe: {
        findMany: vi.fn(({ where }: { where: { mealType: string } }) =>
          Promise.resolve(recipes.filter((recipe) => recipe.mealType === where.mealType)),
        ),
      },
      weekPlanMeal: {
        deleteMany: deleteManyMeals,
        createMany: vi.fn(({ data }: { data: typeof createdMeals }) => {
          createdMeals.push(...data);
          return Promise.resolve({ count: data.length });
        }),
      },
      weekPlan: {
        deleteMany: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 2 }),
        findFirst,
      },
    } as unknown as PrismaService;

    const service = new WeekPlanService(prisma);
    const plan = await service.getCurrent(42);

    expect(deleteManyMeals).toHaveBeenCalledOnce();
    expect(plan?.meals.some((meal) => meal.recipe.name.toLowerCase().includes('tagine'))).toBe(false);
  });
});