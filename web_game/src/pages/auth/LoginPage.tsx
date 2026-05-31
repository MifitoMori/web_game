import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconLock,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      login: '',
      password: '',
    },
    validate: {
      login: (value) =>
        value.trim().length >= 6 ? null : 'Логин должен быть не менее 6 символов',
      password: (value) =>
        value.length >= 8 ? null : 'Пароль должен быть не менее 8 символов',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    try {
      await login(values.login, values.password);
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
        Добро пожаловать!
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Login"
            placeholder="your_login"
            name="username"
            leftSection={<IconUser size={16} />}
            autoComplete="username"
            {...form.getInputProps('login')}
          />

          <PasswordInput
            required
            label="Пароль"
            placeholder="Ваш пароль"
            name="password"
            leftSection={<IconLock size={16} />}
            autoComplete="current-password"
            {...form.getInputProps('password')}
          />

          <Button type="submit" loading={loading} fullWidth>
            Войти
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm" mt="md">
        Нет аккаунта?{' '}
        <Anchor component={Link} to="/register" fw={700}>
          Зарегистрироваться
        </Anchor>
      </Text>
    </Box>
  );
};

export default LoginPage;
