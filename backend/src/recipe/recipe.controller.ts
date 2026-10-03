import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { RecipeService } from './recipe.service.js';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  findAll(@Query('mealType') mealType?: string) {
    return this.recipeService.findAll(mealType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipeService.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.recipeService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipeService.remove(Number(id));
  }
}
