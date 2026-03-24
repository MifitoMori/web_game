import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Avatar,
  Badge,
  Button,
  Stack,
  Grid,
  Divider,
  ThemeIcon,
  Progress,
  Skeleton,
  Box,
  ActionIcon
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconCoin, 
  IconTrophy, 
  IconStar,
  IconCrown,
  IconCalendar,
  IconMail,
  IconUser
} from '@tabler/icons-react';
import { useProfile } from '@hooks/useProfile';
import ProfileStats from './components/ProfileStats';
import ProfileInventory from './components/ProfileInventory';
import ProfileLoadout from './components/ProfileLoadout';
import classes from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
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
          <Button onClick={() => navigate('/lobby')} mt="md">Вернуться в лобби</Button>
        </Paper>
      </Container>
    );
  }

  const { profile, stats, inventory, loadout } = profileData;
  const levelProgress = (profile.experience / profile.nextLevelExp) * 100;

  return (
    <Container size="xl" py="xl" className={classes.profileContainer}>
      {/* Кнопка назад */}
      <Group mb="lg">
        <ActionIcon variant="subtle" onClick={() => navigate('/lobby')} size="lg">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Text>Вернуться в лобби</Text>
      </Group>

      <Grid gutter="md">
        {/* Левая колонка - информация о пользователе */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper className={classes.userInfo} radius="md" withBorder p="lg">
            <Group justify="center" mb="md">
              <Avatar
                src={profile.avatar}
                size={120}
                radius="xl"
                className={classes.avatar}
              >
                {profile.username[0]?.toUpperCase()}
              </Avatar>
            </Group>

            <Title order={2} ta="center">{profile.username}</Title>
            <Text ta="center" c="dimmed" size="sm">{profile.firstName} {profile.lastName}</Text>

            <Group justify="center" mt="md" gap="xs">
              <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                {profile.rank}
              </Badge>
              <Badge size="lg" variant="light" color="grape">
                LVL {profile.level}
              </Badge>
            </Group>

            <Divider my="md" />

            <Stack gap="sm">
              <Group>
                <ThemeIcon variant="light" size="sm">
                  <IconTrophy size={16} />
                </ThemeIcon>
                <Text size="sm">Рейтинг: {profile.rank}</Text>
              </Group>
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
                <Text size="sm">Опыт: {profile.experience}/{profile.nextLevelExp}</Text>
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
                <Text size="sm" fw={500}>Уровень {profile.level}</Text>
                <Text size="sm" c="dimmed">
                  {profile.experience}/{profile.nextLevelExp} XP
                </Text>
              </Group>
              <Progress value={levelProgress} size="md" color="blue" striped animated />
            </div>
          </Paper>
        </Grid.Col>

        {/* Правая колонка - статистика, инвентарь, лоадаут */}
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