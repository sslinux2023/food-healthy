import { IsIn, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateShoppingItemDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100000)
  qty!: number;

  @IsString()
  @IsIn(['g', 'kg', 'piece', 'liter'])
  unit!: string;
}
