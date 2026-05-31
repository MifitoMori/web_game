import { IsIn } from 'class-validator';

export class RecordSoloMatchResultDto {
  @IsIn(['victory', 'defeat'])
  result: 'victory' | 'defeat';
}
