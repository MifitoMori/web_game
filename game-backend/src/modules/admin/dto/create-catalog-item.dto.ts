import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  description: string;
  
  @IsString()
  @IsNotEmpty()
  rarity: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['skin', 'trail', 'title'])
  type: string;

  @IsNumber()
  @IsPositive()
  price: number;
  
  @IsString()
  @IsNotEmpty()
  currency: string;
}
