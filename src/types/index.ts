export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level?: number;
  experience?: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: 'ru' | 'en' | 'es';
  difficulty: 'easy' | 'medium' | 'hard';
}

export type GameMode = 'quick' | 'friends' | 'tournament';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  protected?: boolean;
  layout?: 'auth' | 'main' | 'game';
}