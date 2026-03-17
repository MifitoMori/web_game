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
import { IconMail, IconLock, IconBrandGoogle, IconBrandGithub } from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';
import classes from './AuthPage.module.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Неверный email'),
      password: (value) => (value.length >= 6 ? null : 'Пароль должен быть не менее 6 символов'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
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
        Добро пожаловать!
      </Text>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            leftSection={<IconMail size={16} />}
            {...form.getInputProps('email')}
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
        <Text size="sm" fw={500} ta="center">Демо-доступ:</Text>
        <Text size="xs" c="dimmed" ta="center">demo@example.com / demo123</Text>
      </Box>
    </Box>
  );
};

export default LoginPage;