import type { InventoryItem } from './profile';

export interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'trail' | 'effect' | 'title';
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'gems' | 'credits';
  image?: string;
  preview?: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  items: ShopItem[];
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: InventoryItem;
  newBalance?: number;
}