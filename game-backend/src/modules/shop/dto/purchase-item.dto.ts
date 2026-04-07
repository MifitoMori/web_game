import { IsString, MaxLength, MinLength } from 'class-validator';

export class PurchaseItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  slug: string;
}
