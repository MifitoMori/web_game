import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Divider,
  Group,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBrandGoogle, IconBrandGithub, IconLock, IconMail } from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';

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
      notifications.show({
        title: 'Успешно!',
        message: 'Вы вошли в систему',
        color: 'green',
      });
      navigate('/lobby');
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Неверный email или пароль',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Box ta="center" mb="md">
          <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconLock size={24} />
          </ThemeIcon>
          <Title order={2} mt="md">
            Добро пожаловать!
          </Title>
          <Text c="dimmed" size="sm">
            Войдите в свой аккаунт чтобы продолжить
          </Text>
        </Box>

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

            <Button type="submit" loading={loading}>
              Войти
            </Button>
          </Stack>
        </form>

        <Divider label="или" labelPosition="center" my="lg" />

        <Group grow>
          <Button variant="default"  leftSection={<IconBrandGoogle size={16} />}>
            Google
          </Button>
          <Button variant="default"  leftSection={<IconBrandGithub size={16} />}>
            GitHub
          </Button>
        </Group>

        <Box ta="center" mt="md">
          <Text size="sm" c="dimmed">
            Демо доступ: demo@example.com / demo123
          </Text>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;