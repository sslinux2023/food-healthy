import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';

@Injectable()
export class RecipeService {
  constructor(private prisma: PrismaService) {}

  findAll(mealType?: string) {
    return this.prisma.recipe.findMany({
      where: mealType ? { mealType } : undefined,
    });
  }

  findOne(id: number) {
    return this.prisma.recipe.findUnique({ where: { id } });
  }

  create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({ data: dto });
  }

  remove(id: number) {
    return this.prisma.recipe.delete({ where: { id } });
  }
}
