import { IsEmail, IsString, IsOptional, IsNumber, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

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