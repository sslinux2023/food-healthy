import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShoppingListService } from './shopping-list.service.js';

describe('ShoppingListService', () => {
  it('aggregates duplicate ingredients and scales portions by family size', async () => {
    const existingItem = {
      id: 8,
      userId: 3,
      weekPlanId: 9,
      name: 'tomato',
      quantity: 0.5,
      unit: 'g',
      isChecked: true,
      isDismissed: false,
    };
    const update = vi.fn().mockResolvedValue({ ...existingItem, quantity: 600 });
    const create = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 10, ...data, isChecked: false, isDismissed: false }),
    );
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ familyMembersCount: 3 }) },
      weekPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: 9,
          meals: [
            {
              mealType: 'lunch',
              dayOfWeek: 0,
              servings: 0.5,
              recipe: { name: 'Tomato soup', ingredients: '[{"name":"tomato","qty":200,"unit":"g"},{"name":"onion","qty":100,"unit":"g"}]' },
            },
            {
              mealType: 'dinner',
              dayOfWeek: 1,
              servings: 0.5,
              recipe: { name: 'Tomato tagine', ingredients: '[{"name":"tomato","qty":200,"unit":"g"},{"name":"pepper","qty":50,"unit":"g"}]' },
            },
          ],
        }),
      },
      shoppingItem: {
        findMany: vi.fn().mockResolvedValue([existingItem]),
        update,
        create,
      },
    } as unknown as PrismaService;
    const service = new ShoppingListService(prisma);

    const result = await service.getList(3);
    const tomato = result.items.find((item) => item.name === 'tomato');

    expect(tomato).toMatchObject({
      id: 8,
      quantity: 600,
      unit: 'g',
      isChecked: true,
      sources: [
        { mealType: 'lunch', recipeName: 'Tomato soup', dayOfWeek: 0 },
        { mealType: 'dinner', recipeName: 'Tomato tagine', dayOfWeek: 1 },
      ],
    });
    expect(update).toHaveBeenCalledWith({ where: { id: 8 }, data: { quantity: 600 } });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 3,
        weekPlanId: 9,
        name: 'onion',
        quantity: 150,
        unit: 'g',
        source: 'plan',
      },
    });
  });

  it('dismisses checked items when clearing purchased items', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = { shoppingItem: { updateMany } } as unknown as PrismaService;
    const service = new ShoppingListService(prisma);

    await expect(service.clearChecked(3)).resolves.toEqual({ cleared: 2 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 3, isChecked: true },
      data: { isDismissed: true },
    });
  });

  it('adds a manual item even when the user has no weekly plan', async () => {
    const created = {
      id: 21,
      name: 'rice',
      quantity: 1000,
      unit: 'g',
      isChecked: false,
      source: 'manual',
    };
    const create = vi.fn().mockResolvedValue(created);
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 3 }) },
      shoppingItem: { create },
    } as unknown as PrismaService;
    const service = new ShoppingListService(prisma);

    await expect(service.addManualItem(3, { name: ' rice ', qty: 1, unit: 'kg' }))
      .resolves.toMatchObject({ id: 21, name: 'rice', quantity: 1, unit: 'kg', source: 'manual' });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 3,
        weekPlanId: null,
        name: 'rice',
        quantity: 1000,
        unit: 'g',
        source: 'manual',
      },
    });
  });
});
