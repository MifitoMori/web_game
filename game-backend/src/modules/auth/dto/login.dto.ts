import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  login: string;

  @IsString()
  @MinLength(8)
  password: string;
}