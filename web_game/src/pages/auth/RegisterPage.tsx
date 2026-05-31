import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Divider,
  Box,
  Progress,
  Popover,
  Checkbox,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconLock, IconUser, IconCalendar } from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: '',
      secondName: '',
      login: '',
      email: '',
      gender: '',
      password: '',
      confirmPassword: '',
      birthDate: '',
      terms: false,
    },
    validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: {
      firstName: (value) => {
        if (!value) return 'Имя обязательно';
        if (value.length < 2) return 'Минимум 2 символа';
        if (value.length > 15) return 'Максимум 15 символов';
        if (!/^[\p{L}]+$/u.test(value)) return 'Только буквы';

        return null;
      },
      secondName: (value) => {
        if (!value) return 'Фамилия обязательна';
        if (value.length < 2) return 'Минимум 2 символа';
        if (value.length > 15) return 'Максимум 15 символов';
        if (!/^[\p{L}]+(?:-[\p{L}]+)?$/u.test(value)) {
          return 'Только буквы и один дефис';
        }

        return null;
      },
      login: (value) => {
        if (!value) return 'Login обязателен';
        if (value.length < 6) return 'Минимум 6 символов';
        if (value.length > 50) return 'Максимум 50 символов';

        return null;
      },
      email: (value) => {
        if (!value) return 'Email обязателен';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          return 'Неверный формат email';
        }

        return null;
      },
      gender: (value) => {
        if (!value) return 'Выберите пол';
        if (value !== 'male' && value !== 'female') return 'Некорректное значение';

        return null;
      },
      password: (value) => {
        if (!value) return 'Пароль обязателен';
        if (value.length < 8) return 'Минимум 8 символов';
        if (value.length > 50) return 'Максимум 50 символов';
        if (!/[a-z]/.test(value)) return 'Добавьте строчную букву';
        if (!/[A-Z]/.test(value)) return 'Добавьте заглавную букву';
        if (!/\d/.test(value)) return 'Добавьте цифру';
        if (!/[^\p{L}\d\s]/u.test(value)) return 'Добавьте спецсимвол';

        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Подтвердите пароль';
        if (value !== values.password) return 'Пароли не совпадают';

        return null;
      },
      birthDate: (value) => {
        if (!value) return 'Укажите дату рождения';

        const birthDate = new Date(value);

        if (Number.isNaN(birthDate.getTime())) {
          return 'Некорректная дата';
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age -= 1;
        }

        if (age < 18) return 'Регистрация доступна только совершеннолетним';

        return null;
      },
      terms: (value) => (value ? null : 'Необходимо согласие с условиями'),
    },
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;

    const checks = {
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^\p{L}\d\s]/u.test(password),
      hasMinLength: password.length >= 8,
    };

    return Object.values(checks).filter(Boolean).length;
  };

  const password = form.values.password;
  const passwordStrength = getPasswordStrength(password);
  const strengthColor =
    passwordStrength <= 2 ? 'red' : passwordStrength <= 4 ? 'yellow' : 'green';

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    try {
      await register({
        firstName: values.firstName,
        secondName: values.secondName,
        login: values.login,
        email: values.email,
        gender: values.gender as 'male' | 'female',
        password: values.password,
        birthDate: values.birthDate,
      });
      navigate('/lobby');
    } catch {
      // Ошибка уже обработана в хуке.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text size="xl" fw={700} ta="center" mb="lg">
        Создать аккаунт
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Имя"
            name="given-name"
            leftSection={<IconUser size={16} />}
            withAsterisk
            autoComplete="given-name"
            {...form.getInputProps('firstName')}
          />

          <TextInput
            label="Фамилия"
            name="family-name"
            leftSection={<IconUser size={16} />}
            withAsterisk
            description="Разрешён один дефис"
            autoComplete="family-name"
            {...form.getInputProps('secondName')}
          />

          <TextInput
            label="Логин"
            name="username"
            leftSection={<IconUser size={16} />}
            withAsterisk
            description="Минимум 6 символов"
            autoComplete="username"
            {...form.getInputProps('login')}
          />

          <TextInput
            label="Email"
            type="email"
            name="email"
            leftSection={<IconMail size={16} />}
            withAsterisk
            autoComplete="email"
            {...form.getInputProps('email')}
          />

          <Select
            label="Пол"
            withAsterisk
            data={[
              { value: 'male', label: 'Мужской' },
              { value: 'female', label: 'Женский' },
            ]}
            {...form.getInputProps('gender')}
          />

          <Popover opened={popoverOpened} position="top" width="target" trapFocus={false}>
            <Popover.Target>
              <div
                onFocusCapture={() => setPopoverOpened(true)}
                onBlurCapture={() => setPopoverOpened(false)}
              >
                <PasswordInput
                  label="Пароль"
                  placeholder="Придумайте пароль"
                  name="new-password"
                  leftSection={<IconLock size={16} />}
                  withAsterisk
                  autoComplete="new-password"
                  {...form.getInputProps('password')}
                />
              </div>
            </Popover.Target>

            {password && (
              <Progress
                value={(passwordStrength / 5) * 100}
                color={strengthColor}
                size="sm"
                mb="xs"
              />
            )}
          </Popover>

          <PasswordInput
            label="Подтверждение пароля"
            placeholder="Повторите пароль"
            name="confirm-password"
            leftSection={<IconLock size={16} />}
            withAsterisk
            autoComplete="new-password"
            {...form.getInputProps('confirmPassword')}
          />

          <TextInput
            label="Дата рождения"
            type="date"
            name="bday"
            leftSection={<IconCalendar size={16} />}
            withAsterisk
            autoComplete="bday"
            {...form.getInputProps('birthDate')}
          />

          <Checkbox
            label="Я соглашаюсь с условиями использования и политикой конфиденциальности"
            {...form.getInputProps('terms', { type: 'checkbox' })}
          />

          <Button type="submit" loading={loading} fullWidth>
            Зарегистрироваться
          </Button>
        </Stack>
      </form>

      <Divider label="или" labelPosition="center" my="lg" />

      <Text ta="center" size="sm">
        Уже есть аккаунт?{' '}
        <Anchor component={Link} to="/login" fw={700}>
          Войти
        </Anchor>
      </Text>
    </Box>
  );
};

export default RegisterPage;
