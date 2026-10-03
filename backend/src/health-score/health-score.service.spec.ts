import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthScoreService } from './health-score.service.js';

describe('HealthScoreService', () => {
  it('calculates the daily score and persists a snapshot for the local date', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ bmi: 22, waterMl: 2000 }) },
      healthLog: {
        findFirst: vi.fn().mockResolvedValue({ waterGlasses: 4, mealsEaten: '[4,5]' }),
      },
      healthScore: { upsert },
    } as unknown as PrismaService;
    const service = new HealthScoreService(prisma);

    const score = await service.getTodayScore(11, '2026-10-03');

    expect(score).toMatchObject({
      date: '2026-10-03T00:00:00.000Z',
      score: 70,
      breakdown: { bmi: 40, water: 15, meals: 15 },
      waterMlDrunk: 1000,
      waterMlTarget: 2000,
      mealsCompleted: 2,
      mealsTarget: 4,
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { userId_date: { userId: 11, date: new Date('2026-10-03T00:00:00.000Z') } },
      create: {
        userId: 11,
        date: new Date('2026-10-03T00:00:00.000Z'),
        score: 70,
        bmiPoints: 40,
        waterPoints: 15,
        mealsPoints: 15,
      },
      update: { score: 70, bmiPoints: 40, waterPoints: 15, mealsPoints: 15 },
    });
  });

  it('returns the caller’s own persisted score snapshots in date order', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        date: new Date('2026-10-01T00:00:00.000Z'),
        score: 54,
        bmiPoints: 0,
        waterPoints: 24,
        mealsPoints: 30,
      },
    ]);
    const prisma = { healthScore: { findMany } } as unknown as PrismaService;
    const service = new HealthScoreService(prisma);

    await expect(service.getHistory(11)).resolves.toEqual([
      {
        date: '2026-10-01T00:00:00.000Z',
        score: 54,
        bmiPoints: 0,
        waterPoints: 24,
        mealsPoints: 30,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 11, date: { gte: expect.any(Date) } },
      orderBy: { date: 'asc' },
    }));
  });
});
