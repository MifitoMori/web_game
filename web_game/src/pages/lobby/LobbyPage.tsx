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

const ACTIVE_MATCH_STORAGE_KEY = 'activeMultiplayerMatch';

type ActiveMatchState = {
  isMultiplayer?: boolean;
  roomId?: string;
  opponent?: unknown;
  playerId?: number;
  playerName?: string;
  serverIp?: string;
};

const readActiveMatchState = (): ActiveMatchState | null => {
  try {
    const rawState = sessionStorage.getItem(ACTIVE_MATCH_STORAGE_KEY);
    const state = rawState ? JSON.parse(rawState) : null;

    return state?.isMultiplayer && state?.roomId ? state : null;
  } catch {
    sessionStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    return null;
  }
};

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
    // Подключаемся к тому же хосту, на котором открыта страница,
    // чтобы cookie с токеном совпадала с адресом сокета.
    this.serverIp = window.location.hostname || 'localhost';
    return this.serverIp;
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
  const [activeMatchState, setActiveMatchState] = useState<ActiveMatchState | null>(
    () => readActiveMatchState(),
  );

  useEffect(() => {
    let newSocket: Socket | null = null;

    const initNetwork = async () => {
      const networkService = NetworkService.getInstance();
      const ip = await networkService.getServerIp();
      setServerIp(ip);
      
      const wsUrl = await networkService.getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      newSocket = io(wsUrl, {
        transports: ['websocket'],
        autoConnect: false,
        withCredentials: true,
      });
      
      setSocket(newSocket);
    };
    
    initNetwork();
    
    return () => {
      newSocket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleWaitingForPlayer = () => {
      console.log('Ожидание соперника...');
    };

    const handleMatchFound = (data: any) => {
      console.log('\u0421\u043e\u043f\u0435\u0440\u043d\u0438\u043a \u043d\u0430\u0439\u0434\u0435\u043d!', data);
      setSearching(false);
      const matchState = {
        isMultiplayer: true,
        roomId: data.roomId,
        opponent: data.opponent,
        playerId: user?.id,
        playerName: profileData?.profile?.username || '\u0418\u0433\u0440\u043e\u043a',
        serverIp: serverIp,
      };

      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(matchState));
      setActiveMatchState(matchState);
      
      notifications.show({
        title: '\u0421\u043e\u043f\u0435\u0440\u043d\u0438\u043a \u043d\u0430\u0439\u0434\u0435\u043d!',
        message: `\u0418\u0433\u0440\u0430 \u043f\u0440\u043e\u0442\u0438\u0432 ${data.opponent.nickname}`,
        color: 'green',
      });
      
      navigate('/game', {
        state: matchState,
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

    const handleMatchmakingRejected = (data: { code?: string; message?: string }) => {
      setSearching(false);
      notifications.show({
        title:
          data?.code === 'ALREADY_IN_MATCH'
            ? 'Матч уже запущен'
            : 'Поиск уже запущен',
        message:
          data?.message ||
          'Нельзя запускать поиск матча из нескольких вкладок одновременно',
        color: 'yellow',
      });
    };

    const handleGameInviteReceived = (data: {
      inviteId: string;
      inviter: { id: number; nickname: string };
      expiresAt: number;
    }) => {
      notifications.show({
        id: data.inviteId,
        title: 'Приглашение в игру',
        message: (
          <Stack gap="xs">
            <Text size="sm">{data.inviter.nickname} приглашает вас в матч</Text>
            <Group gap="xs">
              <Button
                size="xs"
                color="green"
                onClick={() => {
                  socket.emit('acceptGameInvite', { inviteId: data.inviteId });
                  notifications.hide(data.inviteId);
                }}
              >
                Принять
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => {
                  socket.emit('declineGameInvite', { inviteId: data.inviteId });
                  notifications.hide(data.inviteId);
                }}
              >
                Отклонить
              </Button>
            </Group>
          </Stack>
        ),
        color: 'green',
        autoClose: Math.max(data.expiresAt - Date.now(), 5000),
      });
    };

    const handleGameInviteSent = (data: { friendNickname?: string }) => {
      notifications.show({
        title: 'Приглашение отправлено',
        message: data.friendNickname
          ? `${data.friendNickname} получит уведомление в лобби`
          : 'Друг получит уведомление в лобби',
        color: 'green',
      });
    };

    const handleGameInviteRejected = (data: { message?: string }) => {
      notifications.show({
        title: 'Приглашение недоступно',
        message: data?.message || 'Не удалось обработать приглашение',
        color: 'yellow',
      });
    };

    const handleGameInviteDeclined = (data: { friendNickname?: string }) => {
      notifications.show({
        title: 'Приглашение отклонено',
        message: data.friendNickname
          ? `${data.friendNickname} отклонил приглашение`
          : 'Друг отклонил приглашение',
        color: 'yellow',
      });
    };

    const handleGameInviteExpired = (data: { inviteId?: string }) => {
      if (data?.inviteId) {
        notifications.hide(data.inviteId);
      }
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
    socket.on('matchmakingRejected', handleMatchmakingRejected);
    socket.on('gameInviteReceived', handleGameInviteReceived);
    socket.on('gameInviteSent', handleGameInviteSent);
    socket.on('gameInviteRejected', handleGameInviteRejected);
    socket.on('gameInviteDeclined', handleGameInviteDeclined);
    socket.on('gameInviteExpired', handleGameInviteExpired);
    socket.on('authError', handleAuthError);
    socket.on('connect_error', handleAuthError);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('waitingForPlayer', handleWaitingForPlayer);
      socket.off('matchFound', handleMatchFound);
      socket.off('searchCancelled', handleSearchCancelled);
      socket.off('searchTimeout', handleSearchTimeout);
      socket.off('matchmakingRejected', handleMatchmakingRejected);
      socket.off('gameInviteReceived', handleGameInviteReceived);
      socket.off('gameInviteSent', handleGameInviteSent);
      socket.off('gameInviteRejected', handleGameInviteRejected);
      socket.off('gameInviteDeclined', handleGameInviteDeclined);
      socket.off('gameInviteExpired', handleGameInviteExpired);
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

    // Если сокет уже аутентифицирован — ищем матч сразу.
    if (socket.connected) {
      socket.emit('findMatch', {});
      return;
    }

    // Иначе findMatch отправляем только после authSuccess от сервера.
    // Сервер выставляет userId в конце handleConnection (проверка JWT + запрос в БД),
    // а это асинхронно. Если отправить findMatch сразу после connect(),
    // сообщение обгоняет установку userId, и сервер рвёт сокет с authError.
    socket.once('authSuccess', () => {
      socket.emit('findMatch', {});
    });
    socket.connect();
  };

  const cancelSearch = () => {
    if (socket && socket.connected) {
      socket.emit('cancelSearch');
    }
    setSearching(false);
  };

  const clearActiveMatchState = () => {
    sessionStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    setActiveMatchState(null);
  };

  const refreshActiveMatchState = () => {
    const storedMatchState = readActiveMatchState();
    setActiveMatchState(storedMatchState);
    return storedMatchState;
  };

  const checkActiveMatchExists = (matchState: ActiveMatchState) => {
    if (!socket || !matchState.roomId) {
      notifications.show({
        title: 'Не удалось проверить матч',
        message: 'Нет подключения к серверу',
        color: 'red',
      });
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (exists: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        socket.off('activeMatchStatus', handleStatus);
        socket.off('authSuccess', emitCheck);
        socket.off('connect_error', handleConnectError);
        window.clearTimeout(timeoutId);
        resolve(exists);
      };

      const handleStatus = (data: { roomId?: string; exists?: boolean; message?: string }) => {
        if (data?.roomId !== matchState.roomId) {
          return;
        }

        if (!data.exists) {
          clearActiveMatchState();
          notifications.show({
            title: 'Матч уже завершён',
            message: data.message || 'Комната больше недоступна, можно начать новый поиск',
            color: 'yellow',
          });
          finish(false);
          return;
        }

        finish(true);
      };

      const handleConnectError = () => {
        notifications.show({
          title: 'Не удалось проверить матч',
          message: 'Проверьте подключение к серверу',
          color: 'red',
        });
        finish(false);
      };

      const emitCheck = () => {
        socket.emit('checkActiveMatch', { roomId: matchState.roomId });
      };

      const timeoutId = window.setTimeout(() => {
        notifications.show({
          title: 'Не удалось проверить матч',
          message: 'Сервер не ответил вовремя',
          color: 'yellow',
        });
        finish(false);
      }, 4000);

      socket.on('activeMatchStatus', handleStatus);
      socket.once('authSuccess', emitCheck);
      socket.once('connect_error', handleConnectError);

      if (socket.connected) {
        emitCheck();
      } else {
        socket.connect();
      }
    });
  };

  const handleSelectMultiplayer = () => {
    setGameMode('multi');

    const storedMatchState = refreshActiveMatchState();

    if (storedMatchState?.roomId && socket) {
      void checkActiveMatchExists(storedMatchState);
    }
  };

  const handleInviteFriend = (friendId: string) => {
    if (!socket) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось подключиться к серверу',
        color: 'red',
      });
      return;
    }

    const payload = { friendId: Number(friendId) };

    if (socket.connected) {
      socket.emit('inviteFriendToGame', payload);
      return;
    }

    socket.once('authSuccess', () => {
      socket.emit('inviteFriendToGame', payload);
    });
    socket.connect();
  };

  const handleSoloGame = () => {
    navigate('/game', { 
      state: { 
        isMultiplayer: false,
        serverIp: serverIp
      } 
    });
  };

  const handlePlay = async () => {
    if (gameMode === 'solo') {
      handleSoloGame();
      return;
    }

    const storedMatchState = activeMatchState ?? refreshActiveMatchState();

    if (storedMatchState?.roomId) {
      const exists = await checkActiveMatchExists(storedMatchState);

      if (!exists) {
        return;
      }

      setActiveMatchState(storedMatchState);
      navigate('/game', {
        state: storedMatchState,
      });
      return;
    }

    startSearching();
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
        totalGames: profileData.stats.totalGames,
        experience: profileData.profile.experience,
        nextLevelExp: profileData.profile.nextLevelExp,
      }
    : null;
  const shouldReturnToActiveMatch = gameMode === 'multi' && !!activeMatchState?.roomId;

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
                variant={gameMode === 'solo' ? 'filled' : 'default'}
                color="blue"
                size="lg"
                onClick={() => setGameMode('solo')}
                leftSection={<IconPlayerPlay size={24} />}
              >
                Игра с компьютером
              </Button>
              <Button
                variant={gameMode === 'multi' ? 'filled' : 'default'}
                color="blue"
                size="lg"
                onClick={handleSelectMultiplayer}
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
              {gameMode === 'solo'
                ? '\u041d\u0430\u0447\u0430\u0442\u044c \u0438\u0433\u0440\u0443'
                : shouldReturnToActiveMatch
                  ? '\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u0432 \u043c\u0430\u0442\u0447'
                  : '\u041d\u0430\u0439\u0442\u0438 \u0438\u0433\u0440\u0443'}
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
            onInviteFriend={handleInviteFriend}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default LobbyPage;
