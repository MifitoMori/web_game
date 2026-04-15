import { useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';

export type AdminRole = 'USER' | 'ADMIN';

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
  updateUserRole: (userId: number, role: AdminRole) => Promise<void>;
  createCatalogItem: (payload: AdminCatalogPayload) => Promise<void>;
  updateCatalogItem: (id: number, payload: Partial<AdminCatalogPayload>) => Promise<void>;
  deleteCatalogItem: (id: number) => Promise<AdminCatalogItem>;
};

const ACCESS_TOKEN_KEY = 'token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  return {
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
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

export const useAdmin = (): UseAdminReturn => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<AdminCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchJson = useCallback(async <T,>(path: string, init?: RequestInit) => {
    const response = await fetch(getApiUrl(path), {
      ...init,
      headers: {
        ...getAuthHeaders(),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    return (await response.json()) as T;
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [nextUsers, nextCatalogItems] = await Promise.all([
        fetchJson<AdminUserListItem[]>('/api/admin/users'),
        fetchJson<AdminCatalogItem[]>('/api/admin/catalog'),
      ]);

      setUsers(nextUsers);
      setCatalogItems(nextCatalogItems);
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось загрузить админ-панель',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const updateUserRole = async (userId: number, role: AdminRole) => {
    setIsSaving(true);

    try {
      await fetchJson(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });

      notifications.show({
        title: 'Роль обновлена',
        message: 'Изменения для пользователя сохранены',
        color: 'green',
      });

      await refreshData();
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

      notifications.show({
        title: 'Товар добавлен',
        message: `В каталог добавлен "${createdItem.name}"`,
        color: 'green',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateCatalogItem = async (id: number, payload: Partial<AdminCatalogPayload>) => {
    setIsSaving(true);

    try {
      const updatedItem = await fetchJson<AdminCatalogItem>(`/api/admin/catalog/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setCatalogItems((current) =>
        current.map((item) => (item.id === id ? updatedItem : item)),
      );

      notifications.show({
        title: 'Товар обновлен',
        message: `Изменения для "${updatedItem.name}" сохранены`,
        color: 'green',
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

      notifications.show({
        title: 'Товар удален',
        message: `Из каталога удален "${deletedItem.name}"`,
        color: 'yellow',
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
    updateUserRole,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  };
};
