export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  level: number;
  experience: number;
  nextLevelExp: number;
  credits: number;
  joinDate: Date;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface InventoryItem {
  id: string;
  slug?: string;
  name: string;
  type: 'skin' | 'title';
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  equipped: boolean;
  unlocked: boolean;
}

export interface Loadout {
  skin?: InventoryItem;
  title?: InventoryItem;
}

export interface ProfileData {
  profile: UserProfile;
  stats: GameStats;
  inventory: InventoryItem[];
  loadout: Loadout;
}
