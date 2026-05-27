export interface Player {
  id: string;
  nickname: string;
  level: number;
  avatar?: string;
}

export type FriendRelationshipStatus = 'NONE' | 'FRIEND' | 'OUTGOING' | 'INCOMING';

export interface FriendSearchResult extends Player {
  relationshipStatus: FriendRelationshipStatus;
  requestId?: number;
}

export interface Friend extends Player {
  friendshipDate: Date;
}

export interface FriendRequest {
  id: number;
  createdAt: Date;
  user: Player;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  experience: number;
  nextLevelExp: number;
}

export interface PublicFriendProfile {
  user: {
    id: number;
    login: string;
    firstName: string;
    secondName: string;
    avatarUrl: string | null;
    createdAt: Date;
  };
  profile: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    maxStreak: number;
    rating: number;
    level: number;
  };
}
