import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { GameStats, InventoryItem, Loadout, ProfileData, UserProfile } from '@app-types/profile';
import type { ShopItem, ShopPurchaseResponse } from '@app-types/shop';
import { apiFetch, getApiUrl } from '@services/api';

type BackendProfile = {
  totalGames: number;
  wins: number;
  losses: number;
  credits: number;
  experience: number;
  level: number;
};

type BackendInventoryItem = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'skin' | 'trail' | 'title';
  equipped: boolean;
  unlocked: boolean;
};

type BackendProfileResponse = {
  user: {
    id: number;
    login: string;
    email: string;
    firstName: string;
    secondName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  profile: BackendProfile;
  inventory: BackendInventoryItem[];
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
    // Ignore JSON parse errors and fall back to the status text.
  }

  return response.statusText || 'Request failed';
};

const getNextLevelExp = (level: number) => Math.max(level * 250, 250);

const buildStats = (profile: BackendProfile): GameStats => {
  const winRate = profile.totalGames > 0 ? (profile.wins / profile.totalGames) * 100 : 0;

  return {
    totalGames: profile.totalGames,
    wins: profile.wins,
    losses: profile.losses,
    winRate: Number(winRate.toFixed(1)),
  };
};

const buildLoadout = (inventory: InventoryItem[]): Loadout => ({
  skin: inventory.find((item) => item.type === 'skin' && item.equipped),
  trail: inventory.find((item) => item.type === 'trail' && item.equipped),
  title: inventory.find((item) => item.type === 'title' && item.equipped),
});

const mapProfileData = (payload: BackendProfileResponse): ProfileData => {
  const inventory: InventoryItem[] = payload.inventory.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    rarity: item.rarity,
    type: item.type,
    equipped: item.equipped,
    unlocked: item.unlocked,
  }));

  const userProfile: UserProfile = {
    id: payload.user.id.toString(),
    username: payload.user.login,
    email: payload.user.email,
    firstName: payload.user.firstName,
    lastName: payload.user.secondName,
    avatar: payload.user.avatarUrl,
    level: payload.profile.level,
    experience: payload.profile.experience,
    nextLevelExp: getNextLevelExp(payload.profile.level + 1),
    credits: payload.profile.credits,
    joinDate: new Date(payload.user.createdAt),
  };

  return {
    profile: userProfile,
    stats: buildStats(payload.profile),
    inventory,
    loadout: buildLoadout(inventory),
  };
};

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isProfileReady, setIsProfileReady] = useState(false);

  const loadProfile = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const response = await apiFetch(getApiUrl('/api/profile'));

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const backendProfile = (await response.json()) as BackendProfileResponse;
      const mappedProfile = mapProfileData(backendProfile);

      setProfileData(mappedProfile);
      setCredits(mappedProfile.profile.credits);
      setInventory(mappedProfile.inventory);
      setIsProfileReady(true);

      return mappedProfile;
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfileData(null);
      setIsProfileReady(false);
      throw error;
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const equipItem = async (item: InventoryItem) => {
    try {
      const response = await apiFetch(getApiUrl('/api/profile/equip'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventoryItemId: Number(item.id) }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await loadProfile(false);

      notifications.show({
        title: 'Предмет экипирован',
        message: `${item.name} теперь в вашем снаряжении`,
        color: 'green',
      });

      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось экипировать предмет',
        color: 'red',
      });

      return false;
    }
  };

  const unequipItem = async (itemType: string) => {
    try {
      const response = await apiFetch(getApiUrl('/api/profile/unequip'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: itemType }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await loadProfile(false);

      notifications.show({
        title: 'Предмет снят',
        message: 'Предмет убран из снаряжения',
        color: 'blue',
      });

      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось снять предмет',
        color: 'red',
      });

      return false;
    }
  };

  const purchaseItem = async (shopItem: ShopItem): Promise<boolean> => {
    try {
      const slug = 'slug' in shopItem && typeof shopItem.slug === 'string' ? shopItem.slug : null;

      if (!slug) {
        throw new Error('Не удалось определить предмет для покупки');
      }

      const response = await apiFetch(getApiUrl('/api/shop/purchase'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const purchaseResult = (await response.json()) as ShopPurchaseResponse;

      await loadProfile(false);

      setCredits(purchaseResult.balances.credits);

      notifications.show({
        title: 'Покупка совершена!',
        message: `${purchaseResult.item.name} добавлен в инвентарь`,
        color: 'green',
      });

      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось совершить покупку',
        color: 'red',
      });

      return false;
    }
  };

  return {
    profileData,
    isLoading,
    isProfileReady,
    credits,
    inventory,
    loadProfile,
    equipItem,
    unequipItem,
    purchaseItem,
  };
};
