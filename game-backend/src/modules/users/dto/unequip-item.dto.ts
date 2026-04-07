import { IsIn, IsString } from 'class-validator';

export class UnequipItemDto {
  @IsString()
  @IsIn(['skin', 'trail', 'effect', 'title'])
  type: 'skin' | 'trail' | 'effect' | 'title';
}
