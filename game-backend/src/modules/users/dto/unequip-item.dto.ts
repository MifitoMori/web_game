import { IsIn, IsString } from 'class-validator';

export class UnequipItemDto {
  @IsString()
  @IsIn(['skin', 'trail', 'title'])
  type: 'skin' | 'trail' | 'title';
}
