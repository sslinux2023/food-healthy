import { IsBoolean, IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateCheckInDto {
  @IsOptional()
  @IsDateString({ strict: true })
  localDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  waterDelta?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  waterGlasses?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  walkedMinutesDelta?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  mealId?: number;

  @IsOptional()
  @IsBoolean()
  eaten?: boolean;
}
