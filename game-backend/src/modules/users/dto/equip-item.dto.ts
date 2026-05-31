import { IsInt, Min } from 'class-validator';

export class EquipItemDto {
  @IsInt()
  @Min(1)
  inventoryItemId: number;
}
