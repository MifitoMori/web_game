import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { ProfileData, InventoryItem, Loadout } from '@types/profile';
import { mockProfileData } from '@mocks/profileData';

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProfileData(mockProfileData);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const equipItem = async (item: InventoryItem) => {
    if (!profileData) return;

    try {
      const updatedInventory = profileData.inventory.map(i => {
        if (i.id === item.id) {
          return { ...i, equipped: true };
        }
        if (i.type === item.type && i.equipped) {
          return { ...i, equipped: false };
        }
        return i;
      });

      const updatedLoadout: Loadout = {
        ...profileData.loadout,
        [item.type]: { ...item, equipped: true }
      };

      setProfileData({
        ...profileData,
        inventory: updatedInventory,
        loadout: updatedLoadout
      });

      notifications.show({
        title: 'Предмет экипирован',
        message: `${item.name} теперь в вашем снаряжении`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось экипировать предмет',
        color: 'red',
      });
    }
  };

  const unequipItem = async (itemType: string) => {
    if (!profileData) return;

    try {
      const updatedInventory = profileData.inventory.map(i => {
        if (i.type === itemType && i.equipped) {
          return { ...i, equipped: false };
        }
        return i;
      });

      const updatedLoadout: Loadout = {
        ...profileData.loadout,
        [itemType]: undefined
      };

      setProfileData({
        ...profileData,
        inventory: updatedInventory,
        loadout: updatedLoadout
      });

      notifications.show({
        title: 'Предмет снят',
        message: 'Предмет убран из снаряжения',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось снять предмет',
        color: 'red',
      });
    }
  };

  return {
    profileData,
    isLoading,
    equipItem,
    unequipItem,
  };
};