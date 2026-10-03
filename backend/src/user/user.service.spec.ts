import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from './user.service.js';

describe('UserService.updateOnboarding', () => {
  it('adds the regular walking activity factor to TDEE', async () => {
    const update = vi.fn(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(data),
    );
    const prisma = {
      user: { update },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    const result = await service.updateOnboarding(1, {
      age: 22,
      gender: 'male',
      height: 172,
      weight: 50,
      goal: 'gain_weight',
      lifestyle: 'moderate',
      walksRegularly: true,
    });

    expect(update.mock.calls[0][0].data.tdee).toBe(2352);
    expect(update.mock.calls[0][0].data.dailyCalories).toBe(2852);
    expect(result).toMatchObject({ tdee: 2352, dailyCalories: 2852 });
  });
});

describe('UserService.findMe', () => {
  it('updates stale nutrition stats for an existing user who walks regularly', async () => {
    const profile = {
      id: 1,
      age: 22,
      gender: 'male',
      height: 172,
      weight: 50,
      goal: 'gain_weight',
      lifestyle: 'moderate',
      walksRegularly: true,
      tdee: 2279,
      dailyCalories: 2779,
    };
    const update = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(profile),
        update,
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    const result = await service.findMe(1);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ tdee: 2352, dailyCalories: 2852 }),
    });
    expect(result).toMatchObject({ tdee: 2352, dailyCalories: 2852 });
  });
});

describe('UserService daily check-in', () => {
  it('creates and returns an empty log for today', async () => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const create = vi.fn().mockResolvedValue({
      date,
      waterGlasses: 0,
      walkedMinutes: 0,
      points: 0,
      mealsEaten: '[]',
    });
    const prisma = {
      healthLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        create,
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.getTodayCheckIn(7)).resolves.toMatchObject({
      date: date.toISOString(),
      waterGlasses: 0,
      walkedMinutes: 0,
      eatenMealIds: [],
    });
    expect(create).toHaveBeenCalledWith({
      data: { userId: 7, date },
    });
  });

  it('increments water and walking and records a planned meal as eaten', async () => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const existingLog = {
      id: 12,
      date,
      waterGlasses: 1,
      walkedMinutes: 0,
      points: 0,
      mealsEaten: '[]',
    };
    const updatedLog = {
      ...existingLog,
      waterGlasses: 2,
      walkedMinutes: 10,
      points: 1,
      mealsEaten: '[42]',
    };
    const update = vi.fn().mockResolvedValue(updatedLog);
    const findPlannedMeal = vi.fn().mockResolvedValue({ id: 42 });
    const prisma = {
      healthLog: {
        findFirst: vi.fn().mockResolvedValue(existingLog),
        update,
      },
      weekPlanMeal: {
        findFirst: findPlannedMeal,
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.updateTodayCheckIn(7, {
      waterDelta: 1,
      walkedMinutesDelta: 10,
      mealId: 42,
      eaten: true,
      localDate: date.toISOString().slice(0, 10),
    })).resolves.toMatchObject({
      waterGlasses: 2,
      walkedMinutes: 10,
      eatenMealIds: [42],
      points: 1,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        waterGlasses: { increment: 1 },
        walkedMinutes: { increment: 10 },
        mealsEaten: '[42]',
        points: 1,
      },
    });
    expect(findPlannedMeal).toHaveBeenCalledWith({
      where: {
        id: 42,
        dayOfWeek: (date.getUTCDay() + 6) % 7,
        weekPlan: { userId: 7 },
      },
      select: { id: true },
    });
  });

  it('sets the water count to the selected drop amount', async () => {
    const date = new Date('2026-10-03T00:00:00.000Z');
    const log = {
      id: 21,
      date,
      waterGlasses: 7,
      walkedMinutes: 0,
      points: 0,
      mealsEaten: '[]',
    };
    const update = vi.fn().mockResolvedValue({ ...log, waterGlasses: 3 });
    const prisma = {
      healthLog: {
        findFirst: vi.fn().mockResolvedValue(log),
        update,
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.updateTodayCheckIn(7, {
      localDate: '2026-10-03',
      waterGlasses: 3,
    })).resolves.toMatchObject({ waterGlasses: 3 });
    expect(update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: { waterGlasses: 3 },
    });
  });

  it('uses the requested local Saturday for check-in weekday and date range', async () => {
    const localSaturday = '2026-10-03';
    const saturdayStart = new Date(`${localSaturday}T00:00:00.000Z`);
    const create = vi.fn().mockResolvedValue({
      date: saturdayStart,
      waterGlasses: 0,
      walkedMinutes: 0,
      points: 0,
      mealsEaten: '[]',
    });
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = {
      healthLog: { findFirst, create },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.getTodayCheckIn(7, localSaturday)).resolves.toMatchObject({
      date: `${localSaturday}T00:00:00.000Z`,
      dayOfWeek: 5,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 7,
        date: {
          gte: saturdayStart,
          lt: new Date('2026-10-04T00:00:00.000Z'),
        },
      },
      orderBy: { date: 'asc' },
    });
  });
});