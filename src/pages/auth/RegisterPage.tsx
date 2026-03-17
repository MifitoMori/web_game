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
  Group,
  Box,
  Progress,
  Popover,
  Checkbox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconLock, IconUser, IconCheck, IconCalendar } from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';
import classes from './AuthPage.module.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      terms: false,
    },
    
    validateInputOnChange: true,
    validateInputOnBlur: true,

    validate: {
      // Имя
      firstName: (value) => {
        if (!value) return 'Имя обязательно';
        if (value.length < 2) return 'Минимум 2 символа';
        if (value.length > 30) return 'Максимум 30 символов';
        if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Только буквы, пробелы и дефисы';
        return null;
      },
      
      // Фамилия
      lastName: (value) => {
        if (!value) return 'Фамилия обязательна';
        if (value.length < 2) return 'Минимум 2 символа';
        if (value.length > 40) return 'Максимум 40 символов';
        if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Только буквы, пробелы и дефисы';
        
        // Проверка на двойную фамилию
        if (value.includes(' ') || value.includes('-')) {
          const parts = value.split(/[\s-]+/);
          if (parts.length > 2) return 'Слишком много частей в фамилии';
          if (parts.some(part => part.length < 2)) return 'Каждая часть фамилии минимум 2 символа';
        }
        return null;
      },
      
      // Имя пользователя
      username: (value) => {
        if (!value) return 'Имя пользователя обязательно';
        if (value.length < 3) return 'Минимум 3 символа';
        if (value.length > 20) return 'Максимум 20 символов';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Только латинские буквы, цифры и подчеркивание';
        if (/^\d/.test(value)) return 'Не может начинаться с цифры';
        if (value.includes('__')) return 'Не может содержать двойное подчеркивание';
        return null;
      },
      
      // Email
      email: (value) => {
        if (!value) return 'Email обязателен';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          return 'Неверный формат email';
        }
        const [localPart, domain] = value.split('@');
        if (localPart.length > 64) return 'Локальная часть email слишком длинная';
        if (domain.length > 255) return 'Домен слишком длинный';
        if (domain.startsWith('.') || domain.endsWith('.')) return 'Домен не может начинаться или заканчиваться точкой';
        if (domain.includes('..')) return 'Домен не может содержать двойную точку';
        return null;
      },
      
      // Пароль
      password: (value) => {
        if (!value) return 'Пароль обязателен';
        if (value.length < 6) return 'Минимум 6 символов';
        if (value.length > 50) return 'Максимум 50 символов';
        
        const checks = {
          length: value.length >= 6,
          hasNumber: /\d/.test(value),
          hasLetter: /[a-zA-Z]/.test(value),
          hasUpper: /[A-Z]/.test(value),
          hasLower: /[a-z]/.test(value),
          hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        };
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        
        if (passedChecks < 3) {
          return 'Слишком простой пароль. Используйте комбинацию букв, цифр и спецсимволов';
        }
        
        return null;
      },
      
      // Подтверждение пароля
      confirmPassword: (value, values) => {
        if (!value) return 'Подтвердите пароль';
        if (value !== values.password) return 'Пароли не совпадают';
        return null;
      },
      
      // Возраст
      age: (value) => {
        if (!value) return 'Укажите возраст';
        if (!/^\d+$/.test(value)) return 'Должны быть только цифры';
        
        const ageNum = parseInt(value, 10);
        if (isNaN(ageNum)) return 'Некорректный возраст';
        if (ageNum < 13) return 'Вам должно быть не менее 13 лет';
        if (ageNum < 18) return 'Для регистрации требуется согласие родителей (13-17 лет)';
        if (ageNum > 120) return 'Некорректный возраст';
        
        return null;
      },
      
      // Согласие с условиями
      terms: (value) => {
        return value ? null : 'Необходимо согласие с условиями';
      },
    },
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    const checks = {
      length: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    return Object.values(checks).filter(Boolean).length;
  };

  const password = form.values.password;
  const passwordStrength = getPasswordStrength(password);
  const strengthColor = 
    passwordStrength <= 2 ? 'red' :
    passwordStrength <= 4 ? 'yellow' : 'green';

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        age: parseInt(values.age, 10),
      });
      navigate('/lobby');
    } catch (error) {
      // Ошибка уже обработана в хуке
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
            leftSection={<IconUser size={16} />}
            withAsterisk
            {...form.getInputProps('firstName')}
          />

          <TextInput
            label="Фамилия"
            leftSection={<IconUser size={16} />}
            withAsterisk
            description="Для двойных фамилий используйте дефис или пробел"
            {...form.getInputProps('lastName')}
          />

          <TextInput
            label="Login"
            leftSection={<IconUser size={16} />}
            withAsterisk
            description="Только латинские буквы, цифры и _"
            {...form.getInputProps('username')}
          />

          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            withAsterisk
            {...form.getInputProps('email')}
          />

          <Popover 
            opened={popoverOpened} 
            position="top" 
            width="target"
            trapFocus={false}
          >
            <Popover.Target>
              <div
                onFocusCapture={() => setPopoverOpened(true)}
                onBlurCapture={() => setPopoverOpened(false)}
              >
                <PasswordInput
                  label="Пароль"
                  placeholder="Придумайте пароль"
                  leftSection={<IconLock size={16} />}
                  withAsterisk
                  {...form.getInputProps('password')}
                />
              </div>
            </Popover.Target>

            {password && (
            <Progress 
              value={(passwordStrength / 6) * 100} 
              color={strengthColor}
              size="sm"
              mb="xs"
            />
          )}
          </Popover>

          <PasswordInput
            label="Подтверждение пароля"
            placeholder="Повторите пароль"
            leftSection={<IconLock size={16} />}
            withAsterisk
            {...form.getInputProps('confirmPassword')}
          />

          <TextInput
            label="Возраст"
            leftSection={<IconCalendar size={16} />}
            withAsterisk
            onKeyPress={(event) => {
              if (!/[0-9]/.test(event.key)) {
                event.preventDefault();
              }
            }}
            {...form.getInputProps('age')}
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