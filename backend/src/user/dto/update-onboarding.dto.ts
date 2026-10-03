import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  lifestyle?: string;

  @IsOptional()
  @IsBoolean()
  walksRegularly?: boolean;

  @IsOptional()
  @IsNumber()
  weeklyBudget?: number;

  @IsOptional()
  @IsString()
  foodPreferences?: string;

  @IsOptional()
  @IsString()
  foodDislikes?: string;

  @IsOptional()
  @IsNumber()
  familyMembersCount?: number;
}
