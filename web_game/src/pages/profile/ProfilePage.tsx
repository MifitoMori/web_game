import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCalendar,
  IconCoin,
  IconLogout,
  IconMail,
  IconStar,
  IconSettings,
} from '@tabler/icons-react';
import { useAuth } from '@hooks/useAuth';
import { useProfile } from '@hooks/useProfile';
import ProfileInventory from './components/ProfileInventory';
import ProfileLoadout from './components/ProfileLoadout';
import ProfileStats from './components/ProfileStats';
import classes from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profileData, isLoading, equipItem, unequipItem } = useProfile();

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Stack>
          <Skeleton height={200} radius="md" />
          <Skeleton height={300} radius="md" />
          <Skeleton height={400} radius="md" />
        </Stack>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container size="xl" py="xl">
        <Paper p="xl" ta="center">
          <Text>Не удалось загрузить профиль</Text>
          <Button onClick={() => navigate('/lobby')} mt="md">
            Вернуться в лобби
          </Button>
        </Paper>
      </Container>
    );
  }

  const { profile, stats, inventory, loadout } = profileData;
  const levelProgress = Math.min((profile.experience / profile.nextLevelExp) * 100, 100);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Container size="xl" py="xl" className={classes.profileContainer}>
      <Group mb="lg">
        <ActionIcon variant="subtle" onClick={() => navigate('/lobby')} size="lg">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Text>Вернуться в лобби</Text>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper className={classes.userInfo} radius="md" withBorder p="lg">
            <Group justify="center" mb="md">
              <Avatar src={profile.avatar} size={120} radius="xl" className={classes.avatar}>
                {profile.username[0]?.toUpperCase()}
              </Avatar>
            </Group>

            <Title order={2} ta="center">
              {profile.username}
            </Title>
            <Text ta="center" c="dimmed" size="sm">
              {profile.firstName} {profile.lastName}
            </Text>

            <Group justify="center" mt="md" gap="xs">
              <Badge size="lg" variant="light" color="grape">
                LVL {profile.level}
              </Badge>
            </Group>

            <Divider my="md" />

            <Stack gap="sm">
              <Group>
                <ThemeIcon variant="light" size="sm" color="yellow">
                  <IconCoin size={16} />
                </ThemeIcon>
                <Text size="sm">Кредиты: {profile.credits.toLocaleString()}</Text>
              </Group>
              <Group>
                <ThemeIcon variant="light" size="sm" color="green">
                  <IconStar size={16} />
                </ThemeIcon>
                <Text size="sm">
                  Опыт: {profile.experience}/{profile.nextLevelExp}
                </Text>
              </Group>
              <Group>
                <ThemeIcon variant="light" size="sm" color="blue">
                  <IconCalendar size={16} />
                </ThemeIcon>
                <Text size="sm">В игре с: {profile.joinDate.toLocaleDateString('ru-RU')}</Text>
              </Group>
              <Group>
                <ThemeIcon variant="light" size="sm" color="gray">
                  <IconMail size={16} />
                </ThemeIcon>
                <Text size="sm">{profile.email}</Text>
              </Group>
            </Stack>

            <Divider my="md" />

            <div>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={500}>
                  Уровень {profile.level}
                </Text>
                <Text size="sm" c="dimmed">
                  {profile.experience}/{profile.nextLevelExp} XP
                </Text>
              </Group>
              <Progress value={levelProgress} size="md" color="blue" striped animated />
            </div>

            <Button
              variant="light"
              leftSection={<IconSettings size={20} />}
              fullWidth
              mt="xs"
              onClick={() => navigate('/settings')}
            >
              Настройки
            </Button>

            <Button
              mt="md"
              fullWidth
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={() => void handleLogout()}
            >
              Выйти
            </Button>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <ProfileStats stats={stats} />
            <ProfileLoadout loadout={loadout} />
            <ProfileInventory
              inventory={inventory}
              onEquip={equipItem}
              onUnequip={unequipItem}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
