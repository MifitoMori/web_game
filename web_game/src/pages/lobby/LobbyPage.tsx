import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLock, IconPlayerPlay, IconUsers, IconSearch, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import FriendsList from '@components/lobby/FriendsList/FriendsList';
import PlayerStatus from '@components/lobby/PlayerStatus/PlayerStatus';
import Shop from '@components/lobby/Shop/Shop';
import { useAuth } from '@hooks/useAuth';
import { useProfile } from '@hooks/useProfile';
import type { Friend, PlayerStats } from '@app-types/lobby';
import classes from './LobbyPage.module.css';

const mockFriends: Friend[] = [
  {
    id: '1',
    nickname: 'GameMaster',
    level: 42,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GameMaster',
    friendshipDate: new Date('2024-01-15'),
    lastPlayed: new Date(),
  },
  {
    id: '2',
    nickname: 'ProGamer',
    level: 38,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',
    friendshipDate: new Date('2024-02-20'),
  },
  {
    id: '3',
    nickname: 'NoobSlayer',
    level: 56,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoobSlayer',
    friendshipDate: new Date('2023-12-10'),
  },
  {
    id: '4',
    nickname: 'CasualPlayer',
    level: 12,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CasualPlayer',
    friendshipDate: new Date('2024-03-01'),
  },
  {
    id: '5',
    nickname: 'SpeedRunner',
    level: 89,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SpeedRunner',
    friendshipDate: new Date('2024-01-05'),
  },
];

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, gems, isProfileReady, profileData, purchaseItem } = useProfile();
  const [gameMode, setGameMode] = useState<'solo' | 'multi'>('solo');
  const [searching, setSearching] = useState(false);

  const handlePlay = () => {
    if (gameMode === 'solo') {
      navigate('/game');
      return;
    }

    // Режим мультиплеера - начинаем поиск
    startSearching();
  };

  const startSearching = () => {
    setSearching(true);
    
  };

  const cancelSearch = () => {
    setSearching(false);
  };

  const player = profileData
    ? {
        id: profileData.profile.id,
        nickname: profileData.profile.username,
        level: profileData.profile.level,
        avatar: profileData.profile.avatar ?? undefined,
      }
    : null;

  const playerStats: PlayerStats | null = profileData
    ? {
        wins: profileData.stats.wins,
        losses: profileData.stats.losses,
        draws: profileData.stats.draws,
        totalGames: profileData.stats.totalGames,
        experience: profileData.profile.experience,
        nextLevelExp: profileData.profile.nextLevelExp,
      }
    : null;

  return (
    <Container size="xl" py="md" className={classes.lobbyContainer}>
      {/* Модальное окно поиска игрока */}
      <Modal
        opened={searching}
        onClose={cancelSearch}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        size="md"
        centered
        padding="xl"
      >
        <Center style={{ flexDirection: 'column', gap: '30px', minHeight: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Loader size="xl" variant="dots" />
            <IconSearch 
              size={30} 
              style={{ 
                position: 'absolute', 
                top: '43%', 
                left: '47%', 
                transform: 'translate(-50%, -50%)',
                opacity: 0.5
              }} 
            />
          </div>
          
          <Stack align="center" gap="xs">
            <Title order={3} ta="center">Поиск соперника</Title>
            <Text size="sm" c="dimmed" ta="center">
              Ищём доступного игрока...
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Это может занять некоторое время
            </Text>
          </Stack>
          
          <Button 
            variant="light" 
            color="red" 
            onClick={cancelSearch}
            leftSection={<IconX size={18} />}
          >
            Отменить поиск
          </Button>
        </Center>
      </Modal>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            {player && playerStats ? (
              <PlayerStatus player={player} stats={playerStats} />
            ) : (
              <Paper withBorder p="md">
                <Skeleton height={120} radius="md" />
                <Skeleton height={20} mt="sm" radius="md" />
              </Paper>
            )}

            {!isProfileReady ? (
              <Paper withBorder p="md">
                <Skeleton height={40} radius="md" />
                <Skeleton height={20} mt="sm" radius="md" />
              </Paper>
            ) : (
              <Shop credits={credits} gems={gems} onPurchase={purchaseItem} />
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper className={classes.gameModes} withBorder p="md">
            <Title order={2} ta="center" mb="lg">
              Выберите режим игры
            </Title>

            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Button
                variant="light"
                color="orange"
                mb="md"
                fullWidth
                onClick={() => navigate('/admin')}
              >
                Открыть админ-панель
              </Button>
            )}

            <Group justify="center" mb="xl">
              <Button
                variant={gameMode === 'solo' ? 'filled' : 'light'}
                size="lg"
                onClick={() => setGameMode('solo')}
                leftSection={<IconPlayerPlay size={24} />}
              >
                Игра с компьютером
              </Button>
              <Button
                variant={gameMode === 'multi' ? 'filled' : 'light'}
                size="lg"
                onClick={() => setGameMode('multi')}
                leftSection={<IconUsers size={24} />}
              >
                Игра с человеком
              </Button>
            </Group>

            <Button
              size="xl"
              fullWidth
              mt="xl"
              variant="gradient"
              gradient={{ from: 'teal', to: 'lime' }}
              leftSection={<IconPlayerPlay size={28} />}
              onClick={handlePlay}
              disabled={searching}
            >
              {gameMode === 'solo' ? 'Начать игру' : 'Найти игру'}
            </Button>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <FriendsList friends={mockFriends} />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default LobbyPage;