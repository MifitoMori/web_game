export interface Player {
  id: string;
  nickname: string;
  level: number;
  avatar?: string;
}

export interface Friend extends Player {
  friendshipDate: Date;
  lastPlayed?: Date;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  experience: number;
  nextLevelExp: number;
}