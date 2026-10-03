import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface RecipeLite {
  id: number;
  name: string;
  calories: number | null;
  ingredients: string;
}

@Injectable()
export class WeekPlanService {
  constructor(private prisma: PrismaService) {}

  private isDisliked(recipe: RecipeLite, dislikes: string[]) {
    const searchableText = `${recipe.name} ${recipe.ingredients}`.toLowerCase();
    return dislikes.some((dislike) => searchableText.includes(dislike));
  }

  private pickClosest(
    recipes: RecipeLite[],
    target: number,
    dislikes: string[],
    recentlyUsedIds: number[],
  ) {
    const validRecipes = recipes.filter((r): r is RecipeLite & { calories: number } => r.calories !== null);
    const pool = validRecipes.filter((recipe) => !this.isDisliked(recipe, dislikes));
    if (pool.length === 0) {
      throw new BadRequestException('No recipes available for this meal type after applying food dislikes');
    }

    const notRecentlyUsed = pool.filter((recipe) => !recentlyUsedIds.includes(recipe.id));
    const finalPool = notRecentlyUsed.length > 0 ? notRecentlyUsed : pool;

    return finalPool.reduce((best, r) =>
      Math.abs(r.calories - target) < Math.abs(best.calories - target) ? r : best,
    );
  }

  async generate(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.onboardingCompleted) throw new NotFoundException('Complete onboarding first');

    const dailyTarget = user.dailyCalories ?? 2000;
    const dislikes = (user.foodDislikes ?? '')
      .split(',')
      .map((dislike) => dislike.trim().toLowerCase())
      .filter(Boolean);

    const slotTargets = {
      breakfast: dailyTarget * 0.25,
      lunch: dailyTarget * 0.35,
      dinner: dailyTarget * 0.30,
      snack: dailyTarget * 0.10,
    };

    const breakfasts = await this.prisma.recipe.findMany({ where: { mealType: 'breakfast', calories: { not: null } } });
    const lunches = await this.prisma.recipe.findMany({ where: { mealType: 'lunch', calories: { not: null } } });
    const dinners = await this.prisma.recipe.findMany({ where: { mealType: 'dinner', calories: { not: null } } });
    const snacks = await this.prisma.recipe.findMany({ where: { mealType: 'snack', calories: { not: null } } });

    const recipePools = { breakfast: breakfasts, lunch: lunches, dinner: dinners, snack: snacks };
    for (const [mealType, recipes] of Object.entries(recipePools)) {
      if (!recipes.some((recipe) => recipe.calories !== null && !this.isDisliked(recipe, dislikes))) {
        throw new BadRequestException(
          `No ${mealType} recipes available after applying food dislikes`,
        );
      }
    }

    await this.prisma.weekPlanMeal.deleteMany({ where: { weekPlan: { userId } } });
    await this.prisma.weekPlan.deleteMany({ where: { userId } });

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const weekPlan = await this.prisma.weekPlan.create({
      data: { userId, weekStart },
    });

    const mealsToCreate: {
      weekPlanId: number;
      recipeId: number;
      dayOfWeek: number;
      mealType: string;
      servings: number;
    }[] = [];

    const recentlyUsedByMealType: Record<string, number[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    for (let day = 0; day < 7; day++) {
      const breakfast = this.pickClosest(
        breakfasts,
        slotTargets.breakfast,
        dislikes,
        recentlyUsedByMealType.breakfast,
      );
      const lunch = this.pickClosest(
        lunches,
        slotTargets.lunch,
        dislikes,
        recentlyUsedByMealType.lunch,
      );
      const dinner = this.pickClosest(
        dinners,
        slotTargets.dinner,
        dislikes,
        recentlyUsedByMealType.dinner,
      );
      const snack = this.pickClosest(
        snacks,
        slotTargets.snack,
        dislikes,
        recentlyUsedByMealType.snack,
      );

      for (const [mealType, recipe] of Object.entries({ breakfast, lunch, dinner, snack })) {
        const recentlyUsedIds = recentlyUsedByMealType[mealType];
        recentlyUsedIds.push(recipe.id);
        if (recentlyUsedIds.length > 2) recentlyUsedIds.shift();
      }

      mealsToCreate.push(
        {
          weekPlanId: weekPlan.id,
          recipeId: breakfast.id,
          dayOfWeek: day,
          mealType: 'breakfast',
          servings: Number((slotTargets.breakfast / breakfast.calories).toFixed(3)),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: lunch.id,
          dayOfWeek: day,
          mealType: 'lunch',
          servings: Number((slotTargets.lunch / lunch.calories).toFixed(3)),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: dinner.id,
          dayOfWeek: day,
          mealType: 'dinner',
          servings: Number((slotTargets.dinner / dinner.calories).toFixed(3)),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: snack.id,
          dayOfWeek: day,
          mealType: 'snack',
          servings: Number((slotTargets.snack / snack.calories).toFixed(3)),
        },
      );
    }

    await this.prisma.weekPlanMeal.createMany({ data: mealsToCreate });

    return this.findCurrentPlan(userId);
  }

  async getCurrent(userId: number) {
    const [user, weekPlan] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { dailyCalories: true, foodDislikes: true },
      }),
      this.findCurrentPlan(userId),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!weekPlan) return weekPlan;

    const dailyTarget = user.dailyCalories ?? 2000;
    const dislikes = (user.foodDislikes ?? '')
      .split(',')
      .map((dislike) => dislike.trim().toLowerCase())
      .filter(Boolean);
    const dailyTotals = new Map<number, number>();
    const recentlyUsedByMealType: Record<string, number[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    let planViolatesPreferences = false;

    for (const meal of weekPlan.meals) {
      const calories = meal.recipe.calories ?? 0;
      dailyTotals.set(
        meal.dayOfWeek,
        (dailyTotals.get(meal.dayOfWeek) ?? 0) + calories * meal.servings,
      );

      if (this.isDisliked(meal.recipe, dislikes)) planViolatesPreferences = true;

      const recentlyUsedIds = recentlyUsedByMealType[meal.mealType] ?? [];
      if (recentlyUsedIds.includes(meal.recipeId)) planViolatesPreferences = true;
      recentlyUsedIds.push(meal.recipeId);
      if (recentlyUsedIds.length > 2) recentlyUsedIds.shift();
      recentlyUsedByMealType[meal.mealType] = recentlyUsedIds;
    }

    const tolerance = Math.max(dailyTarget * 0.01, 5);
    const planNeedsRefresh =
      dailyTotals.size !== 7 ||
      weekPlan.meals.length !== 28 ||
      planViolatesPreferences ||
      Array.from(dailyTotals.values()).some(
        (total) => Math.abs(total - dailyTarget) > tolerance,
      );

    if (planNeedsRefresh) return this.generate(userId);
    return weekPlan;
  }

  private async findCurrentPlan(userId: number) {
    const weekPlan = await this.prisma.weekPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { meals: { include: { recipe: true }, orderBy: { dayOfWeek: 'asc' } } },
    });
    return weekPlan;
  }
}
