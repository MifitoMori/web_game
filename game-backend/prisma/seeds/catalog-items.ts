export type SeedCatalogItem = {
  slug: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'skin' | 'trail' | 'title';
  price: number;
  currency: 'credits' | 'gems';
};

export const catalogItems: SeedCatalogItem[] = [
  {
    slug: 'classic-skin',
    name: 'Классика',
    type: 'skin',
    description: 'Стандартный скин.',
    rarity: 'common',
    price: 0,
    currency: 'credits',
  },
  {
    slug: 'golden-skin',
    name: 'Золотой скин',
    type: 'skin',
    description: 'Золотой скин для настоящих чемпионов.',
    rarity: 'epic',
    price: 5000,
    currency: 'credits',
  },
  {
    slug: 'neon-skin',
    name: 'Неоновый скин',
    type: 'skin',
    description: 'Светящийся неоновый скин.',
    rarity: 'legendary',
    price: 150,
    currency: 'gems',
  },
  {
    slug: 'ice-skin',
    name: 'Ледяной скин',
    type: 'skin',
    description: 'Скин изо льда с морозным следом.',
    rarity: 'epic',
    price: 8000,
    currency: 'credits',
  },
  {
    slug: 'neon-trail',
    name: 'Неоновый след',
    type: 'trail',
    description: 'Яркий неоновый след за персонажем.',
    rarity: 'rare',
    price: 2500,
    currency: 'credits',
  },
  {
    slug: 'spark-trail',
    name: 'Искрящийся след',
    type: 'trail',
    description: 'За персонажем остаётся россыпь искр.',
    rarity: 'epic',
    price: 75,
    currency: 'gems',
  },
  {
    slug: 'rainbow-trail',
    name: 'Радужный след',
    type: 'trail',
    description: 'Переливающийся след всеми цветами радуги.',
    rarity: 'legendary',
    price: 200,
    currency: 'gems',
  },
  {
    slug: 'conqueror-title',
    name: 'Титул «Покоритель»',
    type: 'title',
    description: 'Показывает титул в лобби.',
    rarity: 'rare',
    price: 3000,
    currency: 'credits',
  },
  {
    slug: 'legend-title',
    name: 'Титул «Легенда»',
    type: 'title',
    description: 'Титул для настоящих легенд.',
    rarity: 'legendary',
    price: 500,
    currency: 'gems',
  },
];
