import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

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
