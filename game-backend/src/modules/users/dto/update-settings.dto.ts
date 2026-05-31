import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  login?: string;

  @ValidateIf((dto: UpdateSettingsDto) => dto.avatarUrl !== undefined && dto.avatarUrl !== '')
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  avatarUrl?: string;

  @ValidateIf((dto: UpdateSettingsDto) => !!dto.newPassword)
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\p{L}\d\s]).+$/u, {
    message:
      'Пароль должен содержать строчные и заглавные буквы, цифры и специальные символы',
  })
  newPassword?: string;
}
