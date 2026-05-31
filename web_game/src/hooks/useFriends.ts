import { useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  Friend,
  FriendRequest,
  FriendSearchResult,
  PublicFriendProfile,
} from '@app-types/lobby';
import { apiFetch, getApiUrl } from '@services/api';

type BackendPlayer = {
  id: string;
  nickname: string;
  title?: string;
  level: number;
  avatar?: string;
};

type BackendFriendSearchResult = BackendPlayer & {
  relationshipStatus: FriendSearchResult['relationshipStatus'];
  requestId?: number;
};

type BackendFriend = BackendPlayer & {
  friendshipDate: string;
};

type BackendFriendRequest = {
  id: number;
  createdAt: string;
  user: BackendPlayer;
};

type BackendFriendRequestsResponse = {
  incoming: BackendFriendRequest[];
  outgoing: BackendFriendRequest[];
};

type BackendPublicFriendProfile = {
  user: {
    id: number;
    login: string;
    firstName: string;
    secondName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  profile: PublicFriendProfile['profile'];
};

type UseFriendsReturn = {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isLoading: boolean;
  isRequestsLoading: boolean;
  refreshFriends: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  searchUsers: (query: string) => Promise<FriendSearchResult[]>;
  getFriendProfile: (userId: string | number) => Promise<PublicFriendProfile | null>;
  sendRequest: (userId: string | number) => Promise<boolean>;
  acceptRequest: (requestId: number) => Promise<boolean>;
  declineRequest: (requestId: number) => Promise<boolean>;
  cancelRequest: (requestId: number) => Promise<boolean>;
  removeFriend: (userId: string | number) => Promise<boolean>;
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
    
  }

  return response.statusText || 'Request failed';
};

const mapFriend = (friend: BackendFriend): Friend => ({
  id: friend.id,
  nickname: friend.nickname,
  title: friend.title,
  level: friend.level,
  avatar: friend.avatar,
  friendshipDate: new Date(friend.friendshipDate),
});

const mapFriendRequest = (request: BackendFriendRequest): FriendRequest => ({
  id: request.id,
  createdAt: new Date(request.createdAt),
  user: request.user,
});

const mapPublicFriendProfile = (
  payload: BackendPublicFriendProfile,
): PublicFriendProfile => ({
  user: {
    ...payload.user,
    createdAt: new Date(payload.user.createdAt),
  },
  profile: payload.profile,
});

export const useFriends = (): UseFriendsReturn => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);

  const refreshFriends = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiFetch(getApiUrl('/api/friends'));

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const payload = (await response.json()) as BackendFriend[];
      setFriends(payload.map(mapFriend));
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось загрузить список друзей',
        color: 'red',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    setIsRequestsLoading(true);

    try {
      const response = await apiFetch(getApiUrl('/api/friends/requests'));

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const payload = (await response.json()) as BackendFriendRequestsResponse;
      setIncomingRequests(payload.incoming.map(mapFriendRequest));
      setOutgoingRequests(payload.outgoing.map(mapFriendRequest));
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось загрузить заявки в друзья',
        color: 'red',
      });
      throw error;
    } finally {
      setIsRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFriends().catch(() => undefined);
    void refreshRequests().catch(() => undefined);
  }, [refreshFriends, refreshRequests]);

  const searchUsers = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const response = await apiFetch(
      getApiUrl(`/api/friends/search?query=${encodeURIComponent(normalizedQuery)}`),
    );

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    return (await response.json()) as BackendFriendSearchResult[];
  }, []);

  const getFriendProfile = useCallback(async (userId: string | number) => {
    try {
      const response = await apiFetch(getApiUrl(`/api/users/${userId}/profile`));

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      return mapPublicFriendProfile(
        (await response.json()) as BackendPublicFriendProfile,
      );
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось загрузить профиль друга',
        color: 'red',
      });

      return null;
    }
  }, []);

  const sendRequest = useCallback(
    async (userId: string | number) => {
      try {
        const response = await apiFetch(getApiUrl('/api/friends/requests'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: Number(userId) }),
        });

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        await refreshRequests();

        notifications.show({
          title: 'Заявка отправлена',
          message: 'Пользователь получил приглашение в друзья',
          color: 'green',
        });

        return true;
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message:
            error instanceof Error ? error.message : 'Не удалось отправить заявку',
          color: 'red',
        });

        return false;
      }
    },
    [refreshRequests],
  );

  const acceptRequest = useCallback(
    async (requestId: number) => {
      try {
        const response = await apiFetch(
          getApiUrl(`/api/friends/requests/${requestId}/accept`),
          {
            method: 'POST',
          },
        );

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        await Promise.all([refreshFriends(), refreshRequests()]);

        notifications.show({
          title: 'Заявка принята',
          message: 'Пользователь добавлен в друзья',
          color: 'green',
        });

        return true;
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message:
            error instanceof Error ? error.message : 'Не удалось принять заявку',
          color: 'red',
        });

        return false;
      }
    },
    [refreshFriends, refreshRequests],
  );

  const declineRequest = useCallback(
    async (requestId: number) => {
      try {
        const response = await apiFetch(
          getApiUrl(`/api/friends/requests/${requestId}/decline`),
          {
            method: 'POST',
          },
        );

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        await refreshRequests();

        return true;
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message:
            error instanceof Error ? error.message : 'Не удалось отклонить заявку',
          color: 'red',
        });

        return false;
      }
    },
    [refreshRequests],
  );

  const cancelRequest = useCallback(
    async (requestId: number) => {
      try {
        const response = await apiFetch(
          getApiUrl(`/api/friends/requests/${requestId}`),
          {
            method: 'DELETE',
          },
        );

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        await refreshRequests();

        return true;
      } catch (error) {
        notifications.show({
          title: 'РћС€РёР±РєР°',
          message:
            error instanceof Error ? error.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ Р·Р°СЏРІРєСѓ',
          color: 'red',
        });

        return false;
      }
    },
    [refreshRequests],
  );

  const removeFriend = useCallback(
    async (userId: string | number) => {
      try {
        const response = await apiFetch(getApiUrl(`/api/friends/${userId}`), {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        await refreshFriends();

        notifications.show({
          title: 'Друг удален',
          message: 'Пользователь удален из списка друзей',
          color: 'blue',
        });

        return true;
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message:
            error instanceof Error ? error.message : 'Не удалось удалить друга',
          color: 'red',
        });

        return false;
      }
    },
    [refreshFriends],
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading,
    isRequestsLoading,
    refreshFriends,
    refreshRequests,
    searchUsers,
    getFriendProfile,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  };
};
