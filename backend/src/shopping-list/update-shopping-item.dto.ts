import { IsBoolean } from 'class-validator';

export class UpdateShoppingItemDto {
  @IsBoolean()
  isChecked!: boolean;
}
