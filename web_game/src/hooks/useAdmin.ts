import { createElement, useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  apiFetch,
  AUTH_USER_UPDATED_EVENT,
  getApiUrl,
  refreshCurrentUser,
  type AuthUserUpdatedDetail,
} from '@services/api';
import { logger } from '../utils/logger';

const adminLogger = logger.child('useAdmin');

export type AdminRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminUserListItem = {
  id: number;
  firstName: string;
  secondName: string;
  login: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type AdminCatalogItem = {
  id: number;
  slug: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  price: number;
  currency: string;
};

export type CatalogFormValues = {
  slug: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  price: number;
  currency: string;
};

type AdminCatalogPayload = CatalogFormValues;

type UseAdminReturn = {
  users: AdminUserListItem[];
  catalogItems: AdminCatalogItem[];
  isLoading: boolean;
  isSaving: boolean;
  refreshData: () => Promise<void>;
  refreshAdminPanel: () => Promise<void>;
  updateUserRole: (userId: number, role: AdminRole) => Promise<void>;
  createCatalogItem: (payload: AdminCatalogPayload) => Promise<void>;
  updateCatalogItem: (id: number, payload: Partial<AdminCatalogPayload>) => Promise<void>;
  deleteCatalogItem: (id: number) => Promise<AdminCatalogItem>;
};

type UndoNotificationParams = {
  title: string;
  message: string;
  color: string;
  onUndo?: () => Promise<void>;
};

type AdminAuthUser = {
  id: number;
  firstName?: string;
  secondName?: string;
  login: string;
  email: string;
  role: AdminRole;
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

const toCatalogPayload = (item: AdminCatalogItem): AdminCatalogPayload => ({
  slug: item.slug,
  name: item.name,
  description: item.description,
  rarity: item.rarity,
  type: item.type,
  price: item.price,
  currency: item.currency,
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isAdminAuthUser = (user: unknown): user is AdminAuthUser => {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const candidate = user as Partial<AdminAuthUser>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.login === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'USER' ||
      candidate.role === 'ADMIN' ||
      candidate.role === 'SUPER_ADMIN')
  );
};

const mergeAuthUserIntoAdminList = (
  users: AdminUserListItem[],
  currentUser: AdminAuthUser,
) =>
  users.map((user) =>
    user.id === currentUser.id
      ? {
          ...user,
          firstName: currentUser.firstName ?? user.firstName,
          secondName: currentUser.secondName ?? user.secondName,
          login: currentUser.login,
          email: currentUser.email,
          role: currentUser.role,
        }
      : user,
  );

export const useAdmin = (currentUserRole?: AdminRole): UseAdminReturn => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<AdminCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchJson = useCallback(async <T,>(path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await apiFetch(getApiUrl(path), {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    return (await response.json()) as T;
  }, []);

  const syncCurrentUser = useCallback(async () => {
    const currentUser = await refreshCurrentUser();

    if (!currentUser) {
      return;
    }

    setUsers((current) =>
      isAdminAuthUser(currentUser) ? mergeAuthUserIntoAdminList(current, currentUser) : current,
    );
  }, []);

  const showUndoNotification = useCallback(
    (params: UndoNotificationParams) => {
      const id = `admin-undo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (!params.onUndo) {
        notifications.show({
          id,
          title: params.title,
          color: params.color,
          autoClose: 10000,
          withCloseButton: true,
          message: createElement(
            'div',
            { style: { display: 'grid', gap: 6 } },
            createElement('div', { style: { fontSize: 14 } }, params.message),
          ),
        });

        return;
      }

      const onUndo = params.onUndo;

      notifications.show({
        id,
        title: params.title,
        color: params.color,
        autoClose: 10000,
        withCloseButton: true,
        message: createElement(
          'div',
          { style: { display: 'grid', gap: 6 } },
          createElement('div', { style: { fontSize: 14 } }, params.message),
          createElement(
            'button',
            {
              type: 'button',
              style: {
                width: 'fit-content',
                border: '1px solid var(--mantine-color-blue-4)',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--mantine-color-blue-3)',
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 8px',
              },
              onClick: () => {
                notifications.hide(id);
                void onUndo().catch((error) => {
                  notifications.show({
                    title: 'Не удалось отменить действие',
                    message: getErrorMessage(error, 'Попробуйте обновить страницу и повторить действие'),
                    color: 'red',
                  });
                });
              },
            },
            'Отменить',
          ),
        ),
      });
    },
    [],
  );

  const refreshData = useCallback(async () => {
    adminLogger.debug('Обновление данных админ-панели');
    setIsLoading(true);

    try {
      const [nextUsers, nextCatalogItems] = await Promise.all([
        fetchJson<AdminUserListItem[]>('/api/admin/users'),
        fetchJson<AdminCatalogItem[]>('/api/admin/catalog'),
      ]);

      setUsers(nextUsers);
      setCatalogItems(nextCatalogItems);
      adminLogger.debug(`Загружено ${nextUsers.length} пользователей и ${nextCatalogItems.length} товаров`);
    } catch (error) {
      adminLogger.error('Ошибка загрузки админ-панели', error as Error);
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось загрузить админ-панель',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const { user: nextUser } = (event as CustomEvent<AuthUserUpdatedDetail>).detail;

      if (!isAdminAuthUser(nextUser)) {
        return;
      }

      setUsers((current) => mergeAuthUserIntoAdminList(current, nextUser));
    };

    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);

    return () => window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
  }, []);

  const refreshAdminPanel = useCallback(async () => {
    await Promise.all([refreshData(), syncCurrentUser()]);
  }, [refreshData, syncCurrentUser]);

  const updateUserRole = async (userId: number, role: AdminRole) => {
    adminLogger.debug(`Изменение роли пользователя ${userId} на ${role}`);
    const previousUser = users.find((user) => user.id === userId);

    setIsSaving(true);

    try {
      const updatedUser = await fetchJson<AdminUserListItem>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });

      setUsers((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
      await syncCurrentUser();

      adminLogger.debug(`Роль пользователя ${userId} изменена с ${previousUser?.role} на ${role}`);

      const canUndoRoleChange = currentUserRole === 'SUPER_ADMIN';

      showUndoNotification({
        title: canUndoRoleChange ? 'Роль обновлена' : 'Изменение применено',
        message: canUndoRoleChange
          ? `Роль пользователя ${previousUser?.login ?? `#${userId}`} изменена`
          : 'Для его отмены обратитесь к супер-админу',
        color: 'green',
        onUndo: canUndoRoleChange ? async () => {
          if (!previousUser) {
            return;
          }

          setIsSaving(true);

          try {
            const restoredUser = await fetchJson<AdminUserListItem>(`/api/admin/users/${userId}`, {
              method: 'PATCH',
              body: JSON.stringify({ role: previousUser.role }),
            });

            setUsers((current) =>
              current.map((user) => (user.id === restoredUser.id ? restoredUser : user)),
            );
            await syncCurrentUser();

            notifications.show({
              title: 'Изменение отменено',
              message: `Роль пользователя ${previousUser.login} восстановлена`,
              color: 'blue',
            });
          } finally {
            setIsSaving(false);
          }
        } : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const createCatalogItem = async (payload: AdminCatalogPayload) => {
    setIsSaving(true);

    try {
      const createdItem = await fetchJson<AdminCatalogItem>('/api/admin/catalog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCatalogItems((current) => [...current, createdItem].sort((a, b) => a.id - b.id));
      await syncCurrentUser();

      showUndoNotification({
        title: 'Товар добавлен',
        message: `В каталог добавлен "${createdItem.name}"`,
        color: 'green',
        onUndo: async () => {
          setIsSaving(true);

          try {
            await fetchJson(`/api/admin/catalog/${createdItem.id}`, {
              method: 'DELETE',
            });

            setCatalogItems((current) => current.filter((item) => item.id !== createdItem.id));
            await syncCurrentUser();

            notifications.show({
              title: 'Добавление отменено',
              message: `Товар "${createdItem.name}" удален из каталога`,
              color: 'blue',
            });
          } finally {
            setIsSaving(false);
          }
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateCatalogItem = async (id: number, payload: Partial<AdminCatalogPayload>) => {
    const previousItem = catalogItems.find((item) => item.id === id);

    setIsSaving(true);

    try {
      const updatedItem = await fetchJson<AdminCatalogItem>(`/api/admin/catalog/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setCatalogItems((current) => current.map((item) => (item.id === id ? updatedItem : item)));
      await syncCurrentUser();

      showUndoNotification({
        title: 'Товар обновлен',
        message: `Изменения для "${updatedItem.name}" сохранены`,
        color: 'green',
        onUndo: async () => {
          if (!previousItem) {
            return;
          }

          setIsSaving(true);

          try {
            const restoredItem = await fetchJson<AdminCatalogItem>(`/api/admin/catalog/${id}`, {
              method: 'PATCH',
              body: JSON.stringify(toCatalogPayload(previousItem)),
            });

            setCatalogItems((current) =>
              current.map((item) => (item.id === id ? restoredItem : item)),
            );
            await syncCurrentUser();

            notifications.show({
              title: 'Изменение отменено',
              message: `Данные товара "${restoredItem.name}" восстановлены`,
              color: 'blue',
            });
          } finally {
            setIsSaving(false);
          }
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCatalogItem = async (id: number) => {
    setIsSaving(true);

    try {
      const deletedItem = await fetchJson<AdminCatalogItem>(`/api/admin/catalog/${id}`, {
        method: 'DELETE',
      });

      setCatalogItems((current) => current.filter((item) => item.id !== id));
      await syncCurrentUser();

      showUndoNotification({
        title: 'Товар удален',
        message: `Из каталога удален "${deletedItem.name}"`,
        color: 'yellow',
        onUndo: async () => {
          setIsSaving(true);

          try {
            const restoredItem = await fetchJson<AdminCatalogItem>('/api/admin/catalog', {
              method: 'POST',
              body: JSON.stringify(toCatalogPayload(deletedItem)),
            });

            setCatalogItems((current) => [...current, restoredItem].sort((a, b) => a.id - b.id));
            await syncCurrentUser();

            notifications.show({
              title: 'Удаление отменено',
              message: `Товар "${restoredItem.name}" восстановлен`,
              color: 'blue',
            });
          } finally {
            setIsSaving(false);
          }
        },
      });

      return deletedItem;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    users,
    catalogItems,
    isLoading,
    isSaving,
    refreshData,
    refreshAdminPanel,
    updateUserRole,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  };
};
