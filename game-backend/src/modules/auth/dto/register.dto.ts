import {
  IsDateString,
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsAdult } from '../../../common/validators/is-adult.validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  @Matches(/^[\p{L}]+$/u, {
    message: 'Имя должно содержать только буквы',
  })
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(15)
  @Matches(/^[\p{L}]+(?:-[\p{L}]+)?$/u, {
    message: 'Фамилия должна содержать только буквы и может включать один дефис',
  })
  secondName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  login: string;

  @IsString()
  @IsIn(['male', 'female'], {
    message: 'Пол должен быть Мужской или Женский',
  })
  gender: 'male' | 'female';

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\p{L}\d\s]).+$/u, {
    message:
      'Пароль должен содержать строчные и заглавные буквы, цифры и специальные символы',
  })
  password: string;

  @IsDateString({}, { message: 'Некорректный формат даты рождения' })
  @IsAdult({ message: 'Регистрация доступна только совершеннолетним пользователям' })
  birthDate: string;
}