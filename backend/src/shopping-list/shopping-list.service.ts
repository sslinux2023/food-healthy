import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShoppingItemDto } from './create-shopping-item.dto.js';

export interface IngredientSource {
  mealType: string;
  recipeName: string;
  dayOfWeek: number;
}

interface IngredientEntry {
  name: string;
  qty: number;
  unit: string;
}

interface AggregatedIngredient {
  quantity: number;
  unit: string;
  sources: IngredientSource[];
}

@Injectable()
export class ShoppingListService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeUnit(unit: string) {
    const normalized = unit.trim().toLocaleLowerCase();
    if (['kg', 'كيلوغرام', 'كيلو'].includes(normalized)) return { quantityFactor: 1000, unit: 'g' };
    if (['g', 'gram', 'grams', 'غ', 'غرام'].includes(normalized)) return { quantityFactor: 1, unit: 'g' };
    if (['l', 'liter', 'litre', 'لتر'].includes(normalized)) return { quantityFactor: 1000, unit: 'ml' };
    if (['ml', 'milliliter', 'millilitre', 'مل'].includes(normalized)) return { quantityFactor: 1, unit: 'ml' };
    if (['piece', 'pieces', 'حبة', 'حبات', 'قطعة', 'قطع'].includes(normalized)) {
      return { quantityFactor: 1, unit: 'piece' };
    }
    return { quantityFactor: 1, unit: normalized || 'piece' };
  }

  private parseIngredients(value: string): IngredientEntry[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value.split(',').map((name) => name.trim()).filter(Boolean);
    }

    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): IngredientEntry[] => {
      if (typeof entry === 'string' && entry.trim()) {
        return [{ name: entry.trim(), qty: 1, unit: 'piece' }];
      }
      if (typeof entry !== 'object' || entry === null) return [];
      const ingredient = entry as Partial<IngredientEntry>;
      if (typeof ingredient.name !== 'string' || !ingredient.name.trim()) return [];
      if (typeof ingredient.qty !== 'number' || !Number.isFinite(ingredient.qty) || ingredient.qty <= 0) return [];
      if (typeof ingredient.unit !== 'string' || !ingredient.unit.trim()) return [];
      return [{ name: ingredient.name.trim(), qty: ingredient.qty, unit: ingredient.unit.trim() }];
    });
  }

  private displayQuantity(quantity: number, unit: string) {
    if (unit === 'g' && quantity >= 1000) return { quantity: quantity / 1000, unit: 'kg' };
    if (unit === 'ml' && quantity >= 1000) return { quantity: quantity / 1000, unit: 'liter' };
    return { quantity, unit };
  }

  private round(quantity: number) {
    return Math.round(quantity * 10) / 10;
  }

  private toResponseItem(item: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    isChecked: boolean;
    source?: string;
  }, sources: IngredientSource[] = []) {
    const display = this.displayQuantity(item.quantity, item.unit);
    return {
      id: item.id,
      name: item.name,
      quantity: this.round(display.quantity),
      unit: display.unit,
      isChecked: item.isChecked,
      source: item.source ?? 'plan',
      sources,
    };
  }

  async getList(userId: number) {
    const [user, weekPlan, manualItems] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { familyMembersCount: true },
      }),
      this.prisma.weekPlan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { meals: { include: { recipe: true } } },
      }),
      this.prisma.shoppingItem.findMany({
        where: { userId, source: 'manual', isDismissed: false },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    const familySize = Math.max(user.familyMembersCount ?? 1, 1);
    const aggregated = new Map<string, AggregatedIngredient>();

    for (const meal of weekPlan?.meals ?? []) {
      for (const ingredient of this.parseIngredients(meal.recipe.ingredients)) {
        const name = ingredient.name.trim().toLocaleLowerCase();
        const normalizedUnit = this.normalizeUnit(ingredient.unit);
        const key = `${name}|${normalizedUnit.unit}`;
        const current = aggregated.get(key) ?? { quantity: 0, unit: normalizedUnit.unit, sources: [] };
        current.quantity += ingredient.qty * normalizedUnit.quantityFactor * meal.servings * familySize;
        current.sources.push({
          mealType: meal.mealType,
          recipeName: meal.recipe.name,
          dayOfWeek: meal.dayOfWeek,
        });
        aggregated.set(key, current);
      }
    }

    const generatedItems = weekPlan
      ? await this.prisma.shoppingItem.findMany({
          where: { userId, weekPlanId: weekPlan.id, source: 'plan' },
        })
      : [];
    const generatedByKey = new Map(generatedItems.map((item) => [`${item.name}|${item.unit}`, item]));
    const generatedResponse = weekPlan
      ? await Promise.all([...aggregated.entries()].map(async ([key, ingredient]) => {
          const existing = generatedByKey.get(key);
          const quantity = this.round(ingredient.quantity);
          const item = existing
            ? await this.prisma.shoppingItem.update({
                where: { id: existing.id },
                data: { quantity },
              })
            : await this.prisma.shoppingItem.create({
                data: {
                  userId,
                  weekPlanId: weekPlan.id,
                  name: key.split('|')[0],
                  quantity,
                  unit: ingredient.unit,
                  source: 'plan',
                },
              });
          return item.isDismissed ? null : this.toResponseItem(item, ingredient.sources);
        }))
      : [];

    return {
      weekPlanId: weekPlan?.id ?? null,
      familyMembersCount: familySize,
      items: [
        ...generatedResponse.filter((item) => item !== null),
        ...manualItems.map((item) => this.toResponseItem(item)),
      ],
    };
  }

  async addManualItem(userId: number, dto: CreateShoppingItemDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const normalized = this.normalizeUnit(dto.unit);
    const item = await this.prisma.shoppingItem.create({
      data: {
        userId,
        weekPlanId: null,
        name: dto.name.trim(),
        quantity: this.round(dto.qty * normalized.quantityFactor),
        unit: normalized.unit,
        source: 'manual',
      },
    });
    return this.toResponseItem(item);
  }

  async setChecked(userId: number, itemId: number, isChecked: boolean) {
    const result = await this.prisma.shoppingItem.updateMany({
      where: { id: itemId, userId },
      data: { isChecked },
    });
    if (result.count === 0) throw new NotFoundException('Shopping item not found');

    return this.prisma.shoppingItem.findFirst({
      where: { id: itemId, userId },
      select: { id: true, isChecked: true },
    });
  }

  async clearChecked(userId: number) {
    const result = await this.prisma.shoppingItem.updateMany({
      where: { userId, isChecked: true },
      data: { isDismissed: true },
    });
    return { cleared: result.count };
  }
}
