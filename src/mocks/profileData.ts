import type { ProfileData, InventoryItem, GameStats, UserProfile } from '@types/profile';

// Предметы инвентаря
export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Классический скин',
    type: 'skin',
    description: 'Стандартный скин персонажа',
    rarity: 'common',
    equipped: true,
    unlocked: true,
  },
  {
    id: '2',
    name: 'Золотой игрок',
    type: 'skin',
    description: 'Золотой скин для настоящих чемпионов',
    rarity: 'epic',
    equipped: false,
    unlocked: true,
  },
  {
    id: '3',
    name: 'Неоновый след',
    type: 'trail',
    description: 'Яркий неоновый след за персонажем',
    rarity: 'rare',
    equipped: false,
    unlocked: true,
  },
  {
    id: '4',
    name: 'Искрящийся след',
    type: 'trail',
    description: 'Искры летят за персонажем',
    rarity: 'epic',
    equipped: false,
    unlocked: false,
  },
  {
    id: '5',
    name: 'Эффект победы',
    type: 'effect',
    description: 'Взрыв конфетти при победе',
    rarity: 'legendary',
    equipped: false,
    unlocked: false,
  },
  {
    id: '6',
    name: 'Титул "Покоритель"',
    type: 'title',
    description: 'Показывает титул в лобби',
    rarity: 'rare',
    equipped: true,
    unlocked: true,
  },
];

// Статистика
export const mockStats: GameStats = {
  totalGames: 225,
  wins: 127,
  losses: 83,
  draws: 15,
  winRate: 56.4,
  longestWinStreak: 12,
  totalScore: 15420,
  averageScore: 68.5,
};

// Профиль пользователя
export const mockProfile: UserProfile = {
  id: '1',
  username: 'PlayerOne',
  email: 'player@example.com',
  firstName: 'Иван',
  lastName: 'Иванов',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PlayerOne',
  level: 42,
  experience: 8750,
  nextLevelExp: 10000,
  credits: 12500,
  rank: 'Золотой',
  joinDate: new Date('2024-01-15'),
};

// Полные данные профиля
export const mockProfileData: ProfileData = {
  profile: mockProfile,
  stats: mockStats,
  inventory: mockInventory,
  loadout: {
    skin: mockInventory.find(item => item.id === '1' && item.equipped),
    trail: mockInventory.find(item => item.id === '3' && item.equipped),
    effect: mockInventory.find(item => item.id === '5' && item.equipped),
    title: mockInventory.find(item => item.id === '6' && item.equipped),
  },
};