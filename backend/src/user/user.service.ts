import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto.js';
import { UpdateCheckInDto } from './dto/update-check-in.dto.js';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private calculateNutrition(dto: {
    age?: number | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
    goal?: string | null;
    lifestyle?: string | null;
    walksRegularly?: boolean | null;
  }) {
    const { age, gender, height, weight, goal, lifestyle, walksRegularly } = dto;
    if (!age || !gender || !height || !weight || !lifestyle) return undefined;

    const heightM = height / 100;
    const bmi = Number((weight / heightM ** 2).toFixed(1));
    const idealWeightMin = Number((18.5 * heightM ** 2).toFixed(1));
    const idealWeightMax = Number((24.9 * heightM ** 2).toFixed(1));
    const bmr =
      gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityFactor: Record<string, number> = {
      sedentary: 1.2,
      moderate: 1.55,
      active: 1.725,
    };
    const activityMultiplier =
      (activityFactor[lifestyle] ?? 1.2) + (walksRegularly ? 0.05 : 0);
    const tdee = Math.round(bmr * activityMultiplier);

    const goalAdjust: Record<string, number> = {
      lose_weight: -500,
      maintain: 0,
      gain_weight: 500,
      health: 0,
    };
    const dailyCalories = tdee + (goalAdjust[goal ?? 'health'] ?? 0);

    const proteinFactor: Record<string, number> = {
      lose_weight: 2.0,
      maintain: 1.6,
      gain_weight: 1.8,
      health: 1.4,
    };
    const proteinGrams = Math.round(weight * (proteinFactor[goal ?? 'health'] ?? 1.4));
    const proteinCalories = proteinGrams * 4;
    const fatCalories = dailyCalories * 0.25;
    const fatGrams = Math.round(fatCalories / 9);
    const carbCalories = Math.max(dailyCalories - proteinCalories - fatCalories, 0);
    const carbGrams = Math.round(carbCalories / 4);
    const waterMl = Math.round(
      weight * 33 + (walksRegularly || lifestyle === 'active' ? 350 : 0),
    );

    return {
      bmi,
      tdee,
      dailyCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
      waterMl,
      idealWeightMin,
      idealWeightMax,
    };
  }

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        age: true,
        gender: true,
        height: true,
        weight: true,
        goal: true,
        lifestyle: true,
        weeklyBudget: true,
        createdAt: true,
        onboardingCompleted: true,
      },
    });
  }

  /**
   * Returns the full profile of the currently logged-in user.
   * Used by the frontend AuthContext to know if onboarding is done.
   */
  async findMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        onboardingCompleted: true,
        age: true,
        gender: true,
        height: true,
        weight: true,
        goal: true,
        lifestyle: true,
        walksRegularly: true,
        weeklyBudget: true,
        foodPreferences: true,
        foodDislikes: true,
        familyMembersCount: true,
        bmi: true,
        tdee: true,
        dailyCalories: true,
        proteinGrams: true,
        carbGrams: true,
        fatGrams: true,
        waterMl: true,
        idealWeightMin: true,
        idealWeightMax: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nutrition = this.calculateNutrition(user);
    if (
      nutrition &&
      Object.entries(nutrition).some(([key, value]) => user[key as keyof typeof user] !== value)
    ) {
      await this.prisma.user.update({ where: { id: userId }, data: nutrition });
      return { ...user, ...nutrition };
    }

    return user;
  }

  async updateOnboarding(userId: number, dto: UpdateOnboardingDto) {
    const nutrition = this.calculateNutrition(dto);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        onboardingCompleted: true,
        ...nutrition,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        onboardingCompleted: true,
        age: true,
        gender: true,
        height: true,
        weight: true,
        goal: true,
        lifestyle: true,
        bmi: true,
        tdee: true,
        dailyCalories: true,
        proteinGrams: true,
        carbGrams: true,
        fatGrams: true,
        waterMl: true,
        idealWeightMin: true,
        idealWeightMax: true,
      },
    });
  }

  private getUtcDayRange(localDate?: string) {
    let start: Date;
    if (localDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
        throw new BadRequestException('Date must use YYYY-MM-DD format');
      }
      start = new Date(`${localDate}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== localDate) {
        throw new BadRequestException('Invalid calendar date');
      }
    } else {
      start = new Date();
      start.setUTCHours(0, 0, 0, 0);
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private parseEatenMealIds(value: string): number[] {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => Number.isInteger(id))
        : [];
    } catch {
      return [];
    }
  }

  private formatCheckIn(log: {
    date: Date;
    waterGlasses: number;
    walkedMinutes: number;
    points: number;
    mealsEaten: string;
  }) {
    return {
      date: log.date.toISOString(),
      dayOfWeek: (log.date.getUTCDay() + 6) % 7,
      waterGlasses: log.waterGlasses,
      walkedMinutes: log.walkedMinutes,
      points: log.points,
      eatenMealIds: this.parseEatenMealIds(log.mealsEaten),
    };
  }

  private async findOrCreateTodayCheckIn(userId: number, localDate?: string) {
    const { start, end } = this.getUtcDayRange(localDate);
    const existing = await this.prisma.healthLog.findFirst({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    });
    if (existing) return existing;

    return this.prisma.healthLog.create({
      data: { userId, date: start },
    });
  }

  async getTodayCheckIn(userId: number, localDate?: string) {
    const log = await this.findOrCreateTodayCheckIn(userId, localDate);
    return this.formatCheckIn(log);
  }

  async updateTodayCheckIn(userId: number, dto: UpdateCheckInDto) {
    if (
      dto.waterDelta === undefined &&
      dto.waterGlasses === undefined &&
      dto.walkedMinutesDelta === undefined &&
      dto.mealId === undefined
    ) {
      throw new BadRequestException('Provide a counter increment or meal update');
    }
    if (dto.waterDelta !== undefined && dto.waterGlasses !== undefined) {
      throw new BadRequestException('Provide either a water increment or water amount, not both');
    }
    if ((dto.mealId === undefined) !== (dto.eaten === undefined)) {
      throw new BadRequestException('mealId and eaten must be provided together');
    }

    const log = await this.findOrCreateTodayCheckIn(userId, dto.localDate);
    if (dto.waterDelta && log.waterGlasses + dto.waterDelta > 30) {
      throw new BadRequestException('Daily water log limit reached');
    }
    if (dto.walkedMinutesDelta && log.walkedMinutes + dto.walkedMinutesDelta > 1440) {
      throw new BadRequestException('Daily walking log limit reached');
    }

    let mealsEaten = this.parseEatenMealIds(log.mealsEaten);
    if (dto.mealId !== undefined) {
      const todayIndex = (this.getUtcDayRange(dto.localDate).start.getUTCDay() + 6) % 7;
      const plannedMeal = await this.prisma.weekPlanMeal.findFirst({
        where: {
          id: dto.mealId,
          dayOfWeek: todayIndex,
          weekPlan: { userId },
        },
        select: { id: true },
      });
      if (!plannedMeal) throw new NotFoundException("Today's planned meal not found");

      mealsEaten = dto.eaten
        ? Array.from(new Set([...mealsEaten, dto.mealId]))
        : mealsEaten.filter((id) => id !== dto.mealId);
    }

    const updated = await this.prisma.healthLog.update({
      where: { id: log.id },
      data: {
        ...(dto.waterGlasses !== undefined ? { waterGlasses: dto.waterGlasses } : {}),
        ...(dto.waterDelta ? { waterGlasses: { increment: dto.waterDelta } } : {}),
        ...(dto.walkedMinutesDelta
          ? { walkedMinutes: { increment: dto.walkedMinutesDelta } }
          : {}),
        ...(dto.mealId !== undefined
          ? { mealsEaten: JSON.stringify(mealsEaten), points: mealsEaten.length }
          : {}),
      },
    });

    return this.formatCheckIn(updated);
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        age: true,
        gender: true,
        height: true,
        weight: true,
        goal: true,
        lifestyle: true,
        weeklyBudget: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}