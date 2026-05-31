import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAdult',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          const birthDate = new Date(value);

          if (Number.isNaN(birthDate.getTime())) {
            return false;
          }

          const today = new Date();

          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();

          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }

          return age >= 18;
        },

        defaultMessage(args: ValidationArguments) {
          return 'Пользователь должен быть совершеннолетним';
        },
      },
    });
  };
}