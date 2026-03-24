export interface UserProfile {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    level: number;
    experience: number;
    nextLevelExp: number;
    credits: number;
    rank: string;
    joinDate: Date;
  }
  
  export interface GameStats {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    longestWinStreak: number;
    totalScore: number;
    averageScore: number;
  }
  
  export interface InventoryItem {
    id: string;
    name: string;
    type: 'skin' | 'trail' | 'effect' | 'title';
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    equipped: boolean;
    unlocked: boolean;
  }
  
  export interface Loadout {
    skin?: InventoryItem;
    trail?: InventoryItem;
    effect?: InventoryItem;
    title?: InventoryItem;
  }
  
  export interface ProfileData {
    profile: UserProfile;
    stats: GameStats;
    inventory: InventoryItem[];
    loadout: Loadout;
  }