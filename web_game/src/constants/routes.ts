export const ROUTES = {
  LOGIN: '/login',
  LOBBY: '/lobby',
  PROFILE: '/profile',
  SHOP: '/shop',
  LEADERBOARD: '/leaderboard',
  GAME: '/game',
  ADMIN: '/admin',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const PUBLIC_ROUTES = [ROUTES.LOGIN];
export const PROTECTED_ROUTES = [
  ROUTES.LOBBY,
  ROUTES.PROFILE,
  ROUTES.SHOP,
  ROUTES.LEADERBOARD,
  ROUTES.GAME,
  ROUTES.ADMIN,
];
