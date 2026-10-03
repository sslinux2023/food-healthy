import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface RecipeLite {
  id: number;
  name: string;
  calories: number | null;
  ingredients: string;
  tags: string;
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
    usageCounts: Map<number, number>,
    recentlyUsedIds: number[] = [],
  ) {
    const validRecipes = recipes.filter((r): r is RecipeLite & { calories: number } => r.calories !== null);
    const pool = validRecipes.filter((recipe) => !this.isDisliked(recipe, dislikes));
    if (pool.length === 0) {
      throw new BadRequestException('No recipes available for this meal type after applying food dislikes');
    }

    const candidates = pool.filter((recipe) => (usageCounts.get(recipe.id) ?? 0) < 2);
    if (candidates.length === 0) {
      throw new BadRequestException('Not enough distinct recipes to keep weekly repetition below three');
    }
    const notRecent = candidates.filter((recipe) => !recentlyUsedIds.includes(recipe.id));
    const viablePool = notRecent.length > 0 ? notRecent : candidates;
    const unused = viablePool.filter((recipe) => (usageCounts.get(recipe.id) ?? 0) === 0);
    const finalPool = unused.length > 0 ? unused : viablePool;

    return finalPool.reduce((best, r) =>
      Math.abs(r.calories - target) < Math.abs(best.calories - target) ? r : best,
    );
  }

  private getMealReason(recipe: RecipeLite, goal: string | null) {
    let tags: string[] = [];
    try {
      const parsed: unknown = JSON.parse(recipe.tags);
      if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === 'string');
    } catch {
      tags = [];
    }

    if (tags.includes('high_protein')) return 'high protein — supports your nutrition goal';
    if (tags.includes('budget_friendly')) return 'budget-friendly — helps manage your weekly budget';
    if (tags.includes('moroccan')) return 'Moroccan choice — familiar ingredients and flavors';
    if (goal === 'gain_weight') return 'energy-rich portion — supports your gain-weight goal';
    if (goal === 'lose_weight') return 'balanced portion — supports your weight-management goal';
    return 'balanced choice — fits your daily meal plan';
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
      const allowedCount = recipes.filter(
        (recipe) => recipe.calories !== null && !this.isDisliked(recipe, dislikes),
      ).length;
      if (allowedCount < 4) {
        throw new BadRequestException(
          `At least 4 non-disliked ${mealType} recipes are needed to prevent weekly repeats`,
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
      reason: string;
    }[] = [];

    const usageByMealType: Record<string, Map<number, number>> = {
      breakfast: new Map(),
      lunch: new Map(),
      dinner: new Map(),
      snack: new Map(),
    };
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
        usageByMealType.breakfast,
        recentlyUsedByMealType.breakfast,
      );
      const lunch = this.pickClosest(
        lunches,
        slotTargets.lunch,
        dislikes,
        usageByMealType.lunch,
        recentlyUsedByMealType.lunch,
      );
      const dinner = this.pickClosest(
        dinners,
        slotTargets.dinner,
        dislikes,
        usageByMealType.dinner,
        recentlyUsedByMealType.dinner,
      );
      const snack = this.pickClosest(
        snacks,
        slotTargets.snack,
        dislikes,
        usageByMealType.snack,
        recentlyUsedByMealType.snack,
      );

      for (const [mealType, recipe] of Object.entries({ breakfast, lunch, dinner, snack })) {
        const usage = usageByMealType[mealType];
        usage.set(recipe.id, (usage.get(recipe.id) ?? 0) + 1);
        const recent = recentlyUsedByMealType[mealType];
        recent.push(recipe.id);
        if (recent.length > 2) recent.shift();
      }

      mealsToCreate.push(
        {
          weekPlanId: weekPlan.id,
          recipeId: breakfast.id,
          dayOfWeek: day,
          mealType: 'breakfast',
          servings: Number((slotTargets.breakfast / breakfast.calories).toFixed(3)),
          reason: this.getMealReason(breakfast, user.goal),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: lunch.id,
          dayOfWeek: day,
          mealType: 'lunch',
          servings: Number((slotTargets.lunch / lunch.calories).toFixed(3)),
          reason: this.getMealReason(lunch, user.goal),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: dinner.id,
          dayOfWeek: day,
          mealType: 'dinner',
          servings: Number((slotTargets.dinner / dinner.calories).toFixed(3)),
          reason: this.getMealReason(dinner, user.goal),
        },
        {
          weekPlanId: weekPlan.id,
          recipeId: snack.id,
          dayOfWeek: day,
          mealType: 'snack',
          servings: Number((slotTargets.snack / snack.calories).toFixed(3)),
          reason: this.getMealReason(snack, user.goal),
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
    const recipeUseCounts = new Map<number, number>();
    let planViolatesPreferences = false;

    for (const meal of weekPlan.meals) {
      const calories = meal.recipe.calories ?? 0;
      if (!meal.reason) planViolatesPreferences = true;
      dailyTotals.set(
        meal.dayOfWeek,
        (dailyTotals.get(meal.dayOfWeek) ?? 0) + calories * meal.servings,
      );

      if (this.isDisliked(meal.recipe, dislikes)) planViolatesPreferences = true;
      const useCount = (recipeUseCounts.get(meal.recipeId) ?? 0) + 1;
      recipeUseCounts.set(meal.recipeId, useCount);
      if (useCount > 2) planViolatesPreferences = true;

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
