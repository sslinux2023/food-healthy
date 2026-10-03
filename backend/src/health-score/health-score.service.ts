import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthScoreService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(date?: string) {
    let start: Date;
    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Date must use YYYY-MM-DD format');
      }
      start = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) {
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

  async getTodayScore(userId: number, localDate?: string) {
    const { start, end } = this.dateRange(localDate);
    const [user, healthLog] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { bmi: true, waterMl: true },
      }),
      this.prisma.healthLog.findFirst({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: { date: 'asc' },
        select: { waterGlasses: true, mealsEaten: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    let eatenMealCount = 0;
    try {
      const mealIds: unknown = JSON.parse(healthLog?.mealsEaten ?? '[]');
      eatenMealCount = Array.isArray(mealIds)
        ? new Set(mealIds.filter((id) => Number.isInteger(id))).size
        : 0;
    } catch {
      eatenMealCount = 0;
    }

    const bmiPoints = user.bmi !== null && user.bmi >= 18.5 && user.bmi <= 24.9 ? 40 : 0;
    const waterMlDrunk = (healthLog?.waterGlasses ?? 0) * 250;
    const waterTarget = user.waterMl ?? 0;
    const waterPoints = waterTarget > 0
      ? Math.min(waterMlDrunk / waterTarget, 1) * 30
      : 0;
    const mealsPoints = Math.min(eatenMealCount / 4, 1) * 30;
    const score = Math.round(bmiPoints + waterPoints + mealsPoints);

    await this.prisma.healthScore.upsert({
      where: { userId_date: { userId, date: start } },
      create: { 
        userId, 
        date: start, 
        score, 
        bmiPoints: Math.round(bmiPoints), 
        waterPoints: Math.round(waterPoints), 
        mealsPoints: Math.round(mealsPoints), 
      }, 
      update: { 
        score, 
        bmiPoints: Math.round(bmiPoints), 
        waterPoints: Math.round(waterPoints), 
        mealsPoints: Math.round(mealsPoints), 
      }, 
    });

    return {
      date: start.toISOString(),
      score,
      breakdown: {
        bmi: Math.round(bmiPoints),
        water: Math.round(waterPoints),
        meals: Math.round(mealsPoints),
      },
      waterMlDrunk,
      waterMlTarget: waterTarget,
      mealsCompleted: eatenMealCount,
      mealsTarget: 4,
    };
  }

  async getHistory(userId: number) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 29);
    const snapshots = await this.prisma.healthScore.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        score: true,
        bmiPoints: true,
        waterPoints: true,
        mealsPoints: true,
      },
    });
    return snapshots.map((snapshot) => ({ ...snapshot, date: snapshot.date.toISOString() }));
  }
}
