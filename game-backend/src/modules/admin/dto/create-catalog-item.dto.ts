import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
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
  @IsIn(['skin', 'title'])
  type: string;

  @IsNumber()
  @Min(0)
  price: number;
  
  @IsString()
  @IsNotEmpty()
  @IsIn(['credits'])
  currency: string;
}
