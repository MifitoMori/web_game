import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { ProfileData, InventoryItem, Loadout } from '@types/profile';
import type { ShopItem } from '@types/shop';
import { mockProfileData } from '@mocks/profileData';
import { shopItems } from '@mocks/shopData';

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Добавляем отдельные состояния для баланса, чтобы показывать сразу
  const [credits, setCredits] = useState<number>(0);
  const [gems, setGems] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isProfileReady, setIsProfileReady] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Имитация загрузки
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Устанавливаем данные
        setProfileData(mockProfileData);
        setCredits(mockProfileData.profile.credits);
        setGems(mockProfileData.profile.gems || 0);
        setInventory(mockProfileData.inventory);
        setIsProfileReady(true);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const equipItem = async (item: InventoryItem) => {
    if (!profileData) return false;

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
      
      // Обновляем отдельное состояние инвентаря
      setInventory(updatedInventory);

      notifications.show({
        title: 'Предмет экипирован',
        message: `${item.name} теперь в вашем снаряжении`,
        color: 'green',
      });
      
      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось экипировать предмет',
        color: 'red',
      });
      return false;
    }
  };

  const unequipItem = async (itemType: string) => {
    if (!profileData) return false;

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
      
      setInventory(updatedInventory);

      notifications.show({
        title: 'Предмет снят',
        message: 'Предмет убран из снаряжения',
        color: 'blue',
      });
      
      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось снять предмет',
        color: 'red',
      });
      return false;
    }
  };

  const purchaseItem = async (shopItem: ShopItem): Promise<boolean> => {
    if (!profileData) return false;

    // Проверяем, есть ли уже такой предмет
    const alreadyOwned = inventory.some(i => i.name === shopItem.name);
    if (alreadyOwned) {
      notifications.show({
        title: 'Уже есть',
        message: 'Этот предмет уже у вас есть',
        color: 'yellow',
      });
      return false;
    }

    // Проверяем баланс
    if (shopItem.currency === 'credits' && credits < shopItem.price) {
      notifications.show({
        title: 'Недостаточно средств',
        message: `Вам не хватает ${shopItem.price - credits} кредитов`,
        color: 'red',
      });
      return false;
    }
    
    if (shopItem.currency === 'gems' && gems < shopItem.price) {
      notifications.show({
        title: 'Недостаточно средств',
        message: `Вам не хватает ${shopItem.price - gems} гемов`,
        color: 'red',
      });
      return false;
    }

    try {
      // Создаем новый предмет для инвентаря
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: shopItem.name,
        type: shopItem.type,
        description: shopItem.description,
        rarity: shopItem.rarity,
        equipped: false,
        unlocked: true,
      };

      // Обновляем баланс
      const newCredits = shopItem.currency === 'credits' 
        ? credits - shopItem.price 
        : credits;
      
      const newGems = shopItem.currency === 'gems' 
        ? gems - shopItem.price 
        : gems;

      // Обновляем отдельные состояния
      setCredits(newCredits);
      setGems(newGems);
      setInventory([...inventory, newItem]);

      // Обновляем profileData для согласованности
      setProfileData({
        ...profileData,
        profile: {
          ...profileData.profile,
          credits: newCredits,
          gems: newGems,
        },
        inventory: [...profileData.inventory, newItem],
      });

      notifications.show({
        title: 'Покупка совершена!',
        message: `${shopItem.name} добавлен в инвентарь`,
        color: 'green',
      });
      
      return true;
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось совершить покупку',
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
    gems,
    inventory,
    equipItem,
    unequipItem,
    purchaseItem,
  };
};