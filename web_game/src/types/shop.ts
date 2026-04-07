import type { InventoryItem } from './profile';

export interface ShopItem {
  id: string | number;
  name: string;
  type: 'skin' | 'trail' | 'effect' | 'title';
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'gems' | 'credits';
  image?: string;
  preview?: string;
}

export interface ShopCatalogItem extends ShopItem {
  slug: string;
  owned: boolean;
  equipped: boolean;
}

export interface ShopPurchaseResponse {
  success: boolean;
  item: ShopCatalogItem;
  inventoryItem: {
    id: number;
    isEquipped: boolean;
    receivedAt: string;
  };
  balances: {
    credits: number;
    gems: number;
  };
}

export interface ShopCategory<TItem = ShopItem> {
  id: string;
  name: string;
  items: TItem[];
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: InventoryItem;
  newBalance?: number;
}
