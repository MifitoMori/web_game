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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconLock,
  IconBrandGoogle,
  IconBrandGithub,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';
import classes from './AuthPage.module.css';

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
            leftSection={<IconUser size={16} />}
            {...form.getInputProps('login')}
          />

          <PasswordInput
            required
            label="Пароль"
            placeholder="Ваш пароль"
            leftSection={<IconLock size={16} />}
            {...form.getInputProps('password')}
          />

          <Button type="submit" loading={loading} fullWidth>
            Войти
          </Button>
        </Stack>
      </form>

      <Divider label="или" labelPosition="center" my="lg" />

      <Group grow>
        <Button variant="default" leftSection={<IconBrandGoogle size={16} />}>
          Google
        </Button>
        <Button variant="default" leftSection={<IconBrandGithub size={16} />}>
          GitHub
        </Button>
      </Group>

      <Text ta="center" size="sm" mt="md">
        Нет аккаунта?{' '}
        <Anchor component={Link} to="/register" fw={700}>
          Зарегистрироваться
        </Anchor>
      </Text>

      <Box className={classes.demoHint} mt="xl" p="md">
        <Text size="sm" fw={500} ta="center">
          Авторизация через backend
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          Используйте существующий login и пароль
        </Text>
      </Box>
    </Box>
  );
};

export default LoginPage;
