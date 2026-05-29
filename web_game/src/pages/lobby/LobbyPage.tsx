import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Grid,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  Loader,
  Center,
} from '@mantine/core';
import { IconPlayerPlay, IconUsers, IconSearch, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import FriendsList from '@components/lobby/FriendsList/FriendsList';
import PlayerStatus from '@components/lobby/PlayerStatus/PlayerStatus';
import Shop from '@components/lobby/Shop/Shop';
import { useAuth } from '@hooks/useAuth';
import { useFriends } from '@hooks/useFriends';
import { useProfile } from '@hooks/useProfile';
import type { PlayerStats } from '@app-types/lobby';
import { io, Socket } from 'socket.io-client';
import classes from './LobbyPage.module.css';

// Сервис для определения IP
class NetworkService {
  private static instance: NetworkService;
  private serverIp: string = 'localhost';

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  async getServerIp(): Promise<string> {
    try {
      const response = await fetch('/api/network/ip', {
        credentials: 'include',
      });
      const data = await response.json();
      this.serverIp = data.ip || 'localhost';
      console.log('Server IP detected:', this.serverIp);
      return this.serverIp;
    } catch (error) {
      console.warn('Failed to detect server IP, using localhost');
      return 'localhost';
    }
  }

  async getWebSocketUrl(): Promise<string> {
    const ip = await this.getServerIp();
    return `http://${ip}:3001/game`;
  }
}

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading: isFriendsLoading,
    isRequestsLoading,
    searchUsers,
    getFriendProfile,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriends();
  const { credits, gems, isProfileReady, profileData, purchaseItem } = useProfile();
  const [gameMode, setGameMode] = useState<'solo' | 'multi'>('solo');
  const [searching, setSearching] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [serverIp, setServerIp] = useState<string>('localhost');

  useEffect(() => {
    const initNetwork = async () => {
      const networkService = NetworkService.getInstance();
      const ip = await networkService.getServerIp();
      setServerIp(ip);
      
      const wsUrl = await networkService.getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      const newSocket = io(wsUrl, {
        transports: ['websocket'],
        autoConnect: false,
        withCredentials: true,
      });
      
      setSocket(newSocket);
    };
    
    initNetwork();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleWaitingForPlayer = () => {
      console.log('Ожидание соперника...');
    };

    const handleMatchFound = (data: any) => {
      console.log('Соперник найден!', data);
      setSearching(false);
      
      notifications.show({
        title: 'Соперник найден!',
        message: `Игра против ${data.opponent.nickname}`,
        color: 'green',
      });
      
      navigate('/game', { 
        state: { 
          isMultiplayer: true,
          roomId: data.roomId,
          opponent: data.opponent,
          playerId: user?.id,
          playerName: profileData?.profile?.username || 'Игрок',
          serverIp: serverIp
        }
      });
    };

    const handleSearchCancelled = () => {
      setSearching(false);
      notifications.show({
        title: 'Поиск отменён',
        message: 'Вы отменили поиск соперника',
        color: 'yellow',
      });
    };

    const handleSearchTimeout = () => {
      setSearching(false);
      notifications.show({
        title: 'Поиск не удался',
        message: 'Не удалось найти соперника. Попробуйте позже.',
        color: 'red',
      });
    };

    const handleAuthError = () => {
      setSearching(false);
      notifications.show({
        title: 'Ошибка авторизации',
        message: 'Войдите в аккаунт заново',
        color: 'red',
      });
    };

    socket.on('waitingForPlayer', handleWaitingForPlayer);
    socket.on('matchFound', handleMatchFound);
    socket.on('searchCancelled', handleSearchCancelled);
    socket.on('searchTimeout', handleSearchTimeout);
    socket.on('authError', handleAuthError);
    socket.on('connect_error', handleAuthError);

    return () => {
      socket.off('waitingForPlayer', handleWaitingForPlayer);
      socket.off('matchFound', handleMatchFound);
      socket.off('searchCancelled', handleSearchCancelled);
      socket.off('searchTimeout', handleSearchTimeout);
      socket.off('authError', handleAuthError);
      socket.off('connect_error', handleAuthError);
    };
  }, [socket, navigate, user, profileData, serverIp]);

  const startSearching = () => {
    if (!socket) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось подключиться к серверу',
        color: 'red',
      });
      return;
    }
    
    setSearching(true);
    
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('findMatch', {});
  };

  const cancelSearch = () => {
    if (socket && socket.connected) {
      socket.emit('cancelSearch');
    }
    setSearching(false);
  };

  const handleSoloGame = () => {
    navigate('/game', { 
      state: { 
        isMultiplayer: false,
        serverIp: serverIp
      } 
    });
  };

  const handlePlay = () => {
    if (gameMode === 'solo') {
      handleSoloGame();
    } else {
      startSearching();
    }
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
          <FriendsList
            friends={friends}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            isLoading={isFriendsLoading}
            isRequestsLoading={isRequestsLoading}
            onSearchUsers={searchUsers}
            onGetFriendProfile={getFriendProfile}
            onSendRequest={sendRequest}
            onAcceptRequest={acceptRequest}
            onDeclineRequest={declineRequest}
            onCancelRequest={cancelRequest}
            onRemoveFriend={removeFriend}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default LobbyPage;
