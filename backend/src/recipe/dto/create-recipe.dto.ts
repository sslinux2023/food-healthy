import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  prepTimeMinutes?: number;

  @IsNumber()
  calories: number;

  @IsOptional()
  @IsNumber()
  proteinGrams?: number;

  @IsOptional()
  @IsNumber()
  carbGrams?: number;

  @IsOptional()
  @IsNumber()
  fatGrams?: number;

  @IsOptional()
  @IsNumber()
  servingGrams?: number;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsBoolean()
  isMoroccan?: boolean;

  @IsIn(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType: string;

  @IsString()
  ingredients: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
