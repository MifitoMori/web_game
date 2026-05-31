import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Group,
  Modal,
  PasswordInput,
  Progress,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLock, IconPhoto, IconUser } from '@tabler/icons-react';
import type { UserProfile } from '@app-types/profile';
import {
  apiFetch,
  getApiUrl,
  refreshCurrentUser,
} from '@services/api';

type SettingsModalProps = {
  opened: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdated: () => Promise<unknown>;
};

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  } catch {
    // Fall back to status text.
  }

  return response.statusText || 'Не удалось сохранить настройки';
};

const getPasswordChecks = (password: string) => ({
  hasLower: /[a-z]/.test(password),
  hasUpper: /[A-Z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: /[^\p{L}\d\s]/u.test(password),
  hasMinLength: password.length >= 8,
});

const getPasswordStrength = (password: string) =>
  Object.values(getPasswordChecks(password)).filter(Boolean).length;

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  opened,
  onClose,
  profile,
  onUpdated,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    initialValues: {
      login: profile.username,
      avatarUrl: profile.avatar ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validateInputOnChange: true,
    validate: {
      login: (value) => {
        const login = value.trim();

        if (!login) return 'Login обязателен';
        if (login.length < 6) return 'Минимум 6 символов';
        if (login.length > 50) return 'Максимум 50 символов';

        return null;
      },
      avatarUrl: (value) => {
        const avatarUrl = value.trim();

        if (!avatarUrl) return null;
        if (!isValidUrl(avatarUrl)) return 'Укажите корректный http/https URL';
        if (avatarUrl.length > 2048) return 'URL слишком длинный';

        return null;
      },
      currentPassword: (value, values) =>
        values.newPassword && !value ? 'Введите текущий пароль' : null,
      newPassword: (value) => {
        if (!value) return null;
        if (value.length < 8) return 'Минимум 8 символов';
        if (value.length > 50) return 'Максимум 50 символов';
        if (!/[a-z]/.test(value)) return 'Добавьте строчную букву';
        if (!/[A-Z]/.test(value)) return 'Добавьте заглавную букву';
        if (!/\d/.test(value)) return 'Добавьте цифру';
        if (!/[^\p{L}\d\s]/u.test(value)) return 'Добавьте спецсимвол';

        return null;
      },
      confirmPassword: (value, values) => {
        if (!values.newPassword) return null;
        if (!value) return 'Повторите новый пароль';
        if (value !== values.newPassword) return 'Пароли не совпадают';

        return null;
      },
    },
  });

  useEffect(() => {
    if (!opened) {
      return;
    }

    form.setValues({
      login: profile.username,
      avatarUrl: profile.avatar ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    form.resetDirty();
  }, [opened, profile.avatar, profile.username]);

  const passwordStrength = getPasswordStrength(form.values.newPassword);
  const passwordStrengthColor =
    passwordStrength <= 2 ? 'red' : passwordStrength <= 4 ? 'yellow' : 'green';

  const previewAvatar = useMemo(() => {
    const avatarUrl = form.values.avatarUrl.trim();
    return avatarUrl && isValidUrl(avatarUrl) ? avatarUrl : null;
  }, [form.values.avatarUrl]);

  const handleSubmit = async (values: typeof form.values) => {
    const login = values.login.trim();
    const avatarUrl = values.avatarUrl.trim();
    const payload: {
      login?: string;
      avatarUrl?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    if (login !== profile.username) {
      payload.login = login;
    }

    if (avatarUrl !== (profile.avatar ?? '')) {
      payload.avatarUrl = avatarUrl;
    }

    if (values.newPassword) {
      payload.currentPassword = values.currentPassword;
      payload.newPassword = values.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiFetch(getApiUrl('/api/profile/settings'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await refreshCurrentUser();
      await onUpdated();

      notifications.show({
        title: 'Настройки сохранены',
        message: 'Профиль обновлён',
        color: 'green',
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось сохранить настройки',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Настройки" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group align="center">
            <Avatar src={previewAvatar} size={72} radius="xl">
              {profile.username[0]?.toUpperCase()}
            </Avatar>
          </Group>

          <TextInput
            label="Ник"
            name="username"
            leftSection={<IconUser size={16} />}
            autoComplete="username"
            {...form.getInputProps('login')}
          />

          <TextInput
            label="URL иконки"
            name="photo"
            leftSection={<IconPhoto size={16} />}
            placeholder="https://example.com/avatar.png"
            autoComplete="photo"
            {...form.getInputProps('avatarUrl')}
          />

          <PasswordInput
            label="Текущий пароль"
            name="current-password"
            leftSection={<IconLock size={16} />}
            autoComplete="current-password"
            {...form.getInputProps('currentPassword')}
          />

          <PasswordInput
            label="Новый пароль"
            name="new-password"
            leftSection={<IconLock size={16} />}
            autoComplete="new-password"
            {...form.getInputProps('newPassword')}
          />

          {form.values.newPassword && (
            <Progress
              value={(passwordStrength / 5) * 100}
              color={passwordStrengthColor}
              size="sm"
            />
          )}

          <PasswordInput
            label="Повторите новый пароль"
            name="confirm-password"
            leftSection={<IconLock size={16} />}
            autoComplete="new-password"
            {...form.getInputProps('confirmPassword')}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="light" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default SettingsModal;
