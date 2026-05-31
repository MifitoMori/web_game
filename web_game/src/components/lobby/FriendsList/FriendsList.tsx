import React, { useEffect, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconPlayerPlay,
  IconSearch,
  IconTrophy,
  IconUserMinus,
  IconUserPlus,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import type {
  Friend,
  FriendRequest,
  FriendSearchResult,
  Player,
  PublicFriendProfile,
} from '@app-types/lobby';
import classes from './FriendsList.module.css';

interface FriendsListProps {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isLoading?: boolean;
  isRequestsLoading?: boolean;
  onSearchUsers: (query: string) => Promise<FriendSearchResult[]>;
  onGetFriendProfile: (userId: string) => Promise<PublicFriendProfile | null>;
  onSendRequest: (userId: string) => Promise<boolean>;
  onAcceptRequest: (requestId: number) => Promise<boolean>;
  onDeclineRequest: (requestId: number) => Promise<boolean>;
  onCancelRequest: (requestId: number) => Promise<boolean>;
  onRemoveFriend: (friendId: string) => Promise<boolean>;
  onInviteFriend: (friendId: string) => void;
}

type PlayerRowProps = {
  player: Player;
  rightSection?: React.ReactNode;
  canOpenProfile?: boolean;
  onOpenProfile?: () => void;
};

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  rightSection,
  canOpenProfile = false,
  onOpenProfile,
}) => (
  <Paper
    className={`${classes.friendItem} ${canOpenProfile ? classes.openableFriendItem : ''}`}
    withBorder
    p="xs"
    onClick={canOpenProfile ? onOpenProfile : undefined}
  >
    <Group justify="space-between" align="center" wrap="nowrap">
      <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Avatar src={player.avatar} size={40} radius="xl" />
        <div className={classes.friendIdentity}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {player.nickname}
              </Text>
              {player.title && (
                <Badge
                  className={classes.friendTitle}
                  size="xs"
                  variant="light"
                  color="grape"
                >
                  {player.title}
                </Badge>
              )}
            </Stack>
            <Group className={classes.friendMetaGroup} gap="xs" align="center" wrap="nowrap">
              <Badge className={classes.friendMetaBadge} variant="light">
                LVL {player.level}
              </Badge>
              {rightSection && (
                <div
                  className={classes.friendMetaAction}
                  onClick={(event) => event.stopPropagation()}
                >
                  {rightSection}
                </div>
              )}
            </Group>
          </Group>
        </div>
      </Group>
    </Group>
  </Paper>
);

const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  incomingRequests,
  outgoingRequests,
  isLoading = false,
  isRequestsLoading = false,
  onSearchUsers,
  onGetFriendProfile,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  onInviteFriend,
}) => {
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [activeFriendsTab, setActiveFriendsTab] = useState<string | null>('search');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [hoveredActionsFriendId, setHoveredActionsFriendId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [publicProfile, setPublicProfile] = useState<PublicFriendProfile | null>(null);

  const handleSearchUsers = async () => {
    const query = userSearchQuery.trim();

    if (!query) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);

    try {
      const results = await onSearchUsers(query);
      setUserSearchResults(results);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  useEffect(() => {
    if (!isFindModalOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearchUsers();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [isFindModalOpen, userSearchQuery]);

  const refreshSearchResults = async () => {
    if (isFindModalOpen) {
      await handleSearchUsers();
    }
  };

  const openFriendsModal = (tab: 'search' | 'incoming' | 'outgoing' = 'search') => {
    setActiveFriendsTab(tab);
    setIsFindModalOpen(true);
  };

  const handleOpenFriendProfile = async (friendId: string) => {
    setIsProfileModalOpen(true);
    setIsProfileLoading(true);
    setPublicProfile(null);

    try {
      const profile = await onGetFriendProfile(friendId);
      setPublicProfile(profile);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (activeUserId) {
      return;
    }

    setActiveUserId(userId);

    try {
      const isSent = await onSendRequest(userId);

      if (isSent) {
        await refreshSearchResults();
      }
    } finally {
      setActiveUserId(null);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (activeRequestId) {
      return;
    }

    setActiveRequestId(requestId);

    try {
      const isAccepted = await onAcceptRequest(requestId);

      if (isAccepted) {
        await refreshSearchResults();
      }
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    if (activeRequestId) {
      return;
    }

    setActiveRequestId(requestId);

    try {
      const isDeclined = await onDeclineRequest(requestId);

      if (isDeclined) {
        await refreshSearchResults();
      }
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (activeRequestId) {
      return;
    }

    setActiveRequestId(requestId);

    try {
      const isCancelled = await onCancelRequest(requestId);

      if (isCancelled) {
        await refreshSearchResults();
      }
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (removingFriendId) {
      return;
    }

    setRemovingFriendId(friendId);

    try {
      await onRemoveFriend(friendId);
    } finally {
      setRemovingFriendId(null);
    }
  };

  const renderPendingIncomingActions = (requestId: number) => (
    <Group gap={4} wrap="nowrap">
      <Tooltip label="Принять">
        <ActionIcon
          variant="light"
          color="green"
          loading={activeRequestId === requestId}
          onClick={() => void handleAcceptRequest(requestId)}
        >
          <IconCheck size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Отклонить">
        <ActionIcon
          variant="light"
          color="red"
          disabled={activeRequestId === requestId}
          onClick={() => void handleDeclineRequest(requestId)}
        >
          <IconX size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );

  const renderPendingOutgoingActions = (requestId: number) => (
    <Group gap={6} wrap="nowrap">
      <Badge variant="light" leftSection={<IconClock size={12} />}>
        Ожидает
      </Badge>
      <Button
        size="xs"
        variant="subtle"
        color="red"
        loading={activeRequestId === requestId}
        onClick={() => void handleCancelRequest(requestId)}
      >
        Отменить
      </Button>
    </Group>
  );

  const renderSearchAction = (player: FriendSearchResult) => {
    if (player.relationshipStatus === 'FRIEND') {
      return (
        <Badge className={classes.friendMetaBadge} variant="light">
          В друзьях
        </Badge>
      );
    }

    if (player.relationshipStatus === 'OUTGOING' && player.requestId) {
      return renderPendingOutgoingActions(player.requestId);
    }

    if (player.relationshipStatus === 'INCOMING' && player.requestId) {
      return renderPendingIncomingActions(player.requestId);
    }

    return (
      <Button
        size="xs"
        variant="light"
        leftSection={<IconUserPlus size={14} />}
        loading={activeUserId === player.id}
        onClick={() => void handleSendRequest(player.id)}
      >
        Добавить
      </Button>
    );
  };

  return (
    <>
      <Paper className={classes.friendsList} radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconUsers size={24} />
            <Title order={3}>Друзья</Title>
          </Group>
          <Badge size="lg" variant="filled" color="blue">
            {friends.length} всего
          </Badge>
        </Group>

        {incomingRequests.length > 0 && (
          <Badge
            mb="sm"
            variant="light"
            color="green"
            style={{ cursor: 'pointer' }}
            onClick={() => openFriendsModal('incoming')}
          >
            {incomingRequests.length} новых заявок
          </Badge>
        )}

        <ScrollArea className={classes.scrollArea} type="always">
          <Stack gap="xs">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Paper key={index} className={classes.friendItem} withBorder p="xs">
                  <Group wrap="nowrap">
                    <Skeleton circle height={40} />
                    <div style={{ flex: 1 }}>
                      <Skeleton height={12} radius="md" />
                      <Skeleton height={10} mt={8} width="45%" radius="md" />
                    </div>
                  </Group>
                </Paper>
              ))}

            {!isLoading &&
              friends.map((friend) => (
                <Paper
                  key={friend.id}
                  className={`${classes.friendItem} ${
                    hoveredActionsFriendId === friend.id ? '' : classes.openableFriendItem
                  }`}
                  withBorder
                  p="xs"
                  onClick={() => void handleOpenFriendProfile(friend.id)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar src={friend.avatar} size={40} radius="xl" />

                      <div className={classes.friendIdentity}>
                        <Group justify="space-between" wrap="nowrap">
                          <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {friend.nickname}
                            </Text>
                            {friend.title && (
                              <Badge
                                className={classes.friendTitle}
                                size="xs"
                                variant="light"
                                color="grape"
                              >
                                {friend.title}
                              </Badge>
                            )}
                          </Stack>
                          <Badge size="xs" variant="light">
                            LVL {friend.level}
                          </Badge>
                        </Group>
                      </div>
                    </Group>

                    <Group
                      gap={4}
                      wrap="nowrap"
                      onClick={(event) => event.stopPropagation()}
                      onMouseEnter={() => setHoveredActionsFriendId(friend.id)}
                      onMouseLeave={() => setHoveredActionsFriendId(null)}
                    >
                      <Tooltip label="Пригласить в игру">
                        <ActionIcon
                          variant="light"
                          color="green"
                          size="md"
                          onClick={() => onInviteFriend(friend.id)}
                        >
                          <IconPlayerPlay size={18} />
                        </ActionIcon>
                      </Tooltip>

                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="md">
                            <IconDotsVertical size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            color="red"
                            leftSection={<IconUserMinus size={14} />}
                            disabled={removingFriendId === friend.id}
                            onClick={() => void handleRemoveFriend(friend.id)}
                          >
                            Удалить из друзей
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Paper>
              ))}

            {!isLoading && friends.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Друзья не найдены
              </Text>
            )}
          </Stack>
        </ScrollArea>

        <Button
          fullWidth
          variant="light"
          leftSection={<IconUserPlus size={20} />}
          mt="md"
          onClick={() => openFriendsModal('search')}
        >
          Найти друзей
        </Button>
      </Paper>

      <Modal
        opened={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
        title="Друзья"
        size="lg"
        centered
      >
        <Tabs value={activeFriendsTab} onChange={setActiveFriendsTab} keepMounted={false}>
          <Tabs.List grow mb="md">
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              Поиск
            </Tabs.Tab>
            <Tabs.Tab value="incoming" leftSection={<IconUserPlus size={16} />}>
              Входящие
              {incomingRequests.length > 0 && (
                <Badge size="xs" ml={6} variant="filled">
                  {incomingRequests.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab value="outgoing" leftSection={<IconClock size={16} />}>
              Исходящие
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search">
            <Stack gap="sm">
              <TextInput
                label="Игрок"
                placeholder="Введите логин или имя"
                leftSection={<IconSearch size={16} />}
                value={userSearchQuery}
                onChange={(event) => setUserSearchQuery(event.currentTarget.value)}
              />

              <ScrollArea h={300} type="auto">
                <Stack gap="xs">
                  {isSearchingUsers &&
                    Array.from({ length: 3 }).map((_, index) => (
                      <Paper key={index} className={classes.friendItem} withBorder p="xs">
                        <Group wrap="nowrap">
                          <Skeleton circle height={40} />
                          <Skeleton height={12} radius="md" style={{ flex: 1 }} />
                        </Group>
                      </Paper>
                    ))}

                  {!isSearchingUsers &&
                    userSearchResults.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        rightSection={renderSearchAction(player)}
                        canOpenProfile={player.relationshipStatus === 'FRIEND'}
                        onOpenProfile={() => void handleOpenFriendProfile(player.id)}
                      />
                    ))}

                  {!isSearchingUsers &&
                    userSearchQuery.trim() &&
                    userSearchResults.length === 0 && (
                      <Text c="dimmed" ta="center" py="xl">
                        Игроки не найдены
                      </Text>
                    )}
                </Stack>
              </ScrollArea>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="incoming">
            <ScrollArea h={360} type="auto">
              <Stack gap="xs">
                {isRequestsLoading &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <Paper key={index} className={classes.friendItem} withBorder p="xs">
                      <Group wrap="nowrap">
                        <Skeleton circle height={40} />
                        <Skeleton height={12} radius="md" style={{ flex: 1 }} />
                      </Group>
                    </Paper>
                  ))}

                {!isRequestsLoading &&
                  incomingRequests.map((request) => (
                    <PlayerRow
                      key={request.id}
                      player={request.user}
                      rightSection={renderPendingIncomingActions(request.id)}
                    />
                  ))}

                {!isRequestsLoading && incomingRequests.length === 0 && (
                  <Text c="dimmed" ta="center" py="xl">
                    Входящих заявок нет
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="outgoing">
            <ScrollArea h={360} type="auto">
              <Stack gap="xs">
                {isRequestsLoading &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <Paper key={index} className={classes.friendItem} withBorder p="xs">
                      <Group wrap="nowrap">
                        <Skeleton circle height={40} />
                        <Skeleton height={12} radius="md" style={{ flex: 1 }} />
                      </Group>
                    </Paper>
                  ))}

                {!isRequestsLoading &&
                  outgoingRequests.map((request) => (
                    <PlayerRow
                      key={request.id}
                      player={request.user}
                      rightSection={renderPendingOutgoingActions(request.id)}
                    />
                  ))}

                {!isRequestsLoading && outgoingRequests.length === 0 && (
                  <Text c="dimmed" ta="center" py="xl">
                    Исходящих заявок нет
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      <Modal
        opened={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Профиль друга"
        size="md"
        centered
      >
        {isProfileLoading && (
          <Stack>
            <Skeleton height={72} radius="md" />
            <Skeleton height={140} radius="md" />
          </Stack>
        )}

        {!isProfileLoading && !publicProfile && (
          <Text c="dimmed" ta="center" py="xl">
            Не удалось загрузить профиль друга
          </Text>
        )}

        {!isProfileLoading && publicProfile && (
          <Stack gap="md">
            <Group wrap="nowrap">
              <Avatar src={publicProfile.user.avatarUrl} size={72} radius="xl">
                {publicProfile.user.login[0]?.toUpperCase()}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Group gap="xs" wrap="nowrap">
                  <Title order={3}>{publicProfile.user.login}</Title>
                  {publicProfile.profile.title && (
                    <Badge size="sm" variant="light" color="grape">
                      {publicProfile.profile.title}
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" size="sm">
                  {publicProfile.user.firstName} {publicProfile.user.secondName}
                </Text>
                <Badge mt={6} size="sm" variant="light" color="grape">
                  LVL {publicProfile.profile.level}
                </Badge>
              </div>
            </Group>

            <Divider />

            <Stack gap="xs">
              <Group>
                <IconTrophy size={18} />
                <Text size="sm">Победы: {publicProfile.profile.wins}</Text>
              </Group>
              <Group>
                <IconX size={18} />
                <Text size="sm">Поражения: {publicProfile.profile.losses}</Text>
              </Group>
              <Group>
                <IconPlayerPlay size={18} />
                <Text size="sm">Всего игр: {publicProfile.profile.totalGames}</Text>
              </Group>
              <Group>
                <IconCalendar size={18} />
                <Text size="sm">
                  В игре с: {publicProfile.user.createdAt.toLocaleDateString('ru-RU')}
                </Text>
              </Group>
            </Stack>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default FriendsList;
