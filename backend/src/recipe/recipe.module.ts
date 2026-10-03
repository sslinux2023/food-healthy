import { Module } from '@nestjs/common';
import { RecipeController } from './recipe.controller.js';
import { RecipeService } from './recipe.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [RecipeController],
  providers: [RecipeService, PrismaService],
})
export class RecipeModule {}
