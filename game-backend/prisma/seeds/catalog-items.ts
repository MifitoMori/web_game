export type SeedCatalogItem = {
  slug: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'skin' | 'title';
  price: number;
  currency: 'credits';
};

export const catalogItems: SeedCatalogItem[] = [
  {
    slug: 'hitman-skin',
    name: 'Хитман',
    type: 'skin',
    description: 'Строгий агент в классическом костюме.',
    rarity: 'common',
    price: 0,
    currency: 'credits',
  },
  {
    slug: 'soldier-skin',
    name: 'Солдат',
    type: 'skin',
    description: 'Боевой оперативник с армейской экипировкой.',
    rarity: 'epic',
    price: 5000,
    currency: 'credits',
  },
  {
    slug: 'robot-skin',
    name: 'Робот',
    type: 'skin',
    description: 'Механический боец с прочным корпусом.',
    rarity: 'legendary',
    price: 150,
    currency: 'credits',
  },
  {
    slug: 'survivor-skin',
    name: 'Выживший',
    type: 'skin',
    description: 'Закаленный выживший для долгих перестрелок.',
    rarity: 'epic',
    price: 8000,
    currency: 'credits',
  },
  {
    slug: 'man-blue-skin',
    name: 'Синий стрелок',
    type: 'skin',
    description: 'Боец в синей форме с легким снаряжением.',
    rarity: 'rare',
    price: 2500,
    currency: 'credits',
  },
  {
    slug: 'man-brown-skin',
    name: 'Бурый стрелок',
    type: 'skin',
    description: 'Боец в коричневой форме для полевых условий.',
    rarity: 'rare',
    price: 2500,
    currency: 'credits',
  },
  {
    slug: 'man-old-skin',
    name: 'Ветеран',
    type: 'skin',
    description: 'Опытный стрелок, который видел не один бой.',
    rarity: 'epic',
    price: 6000,
    currency: 'credits',
  },
  {
    slug: 'woman-green-skin',
    name: 'Зеленый разведчик',
    type: 'skin',
    description: 'Маневренный разведчик в зеленой экипировке.',
    rarity: 'rare',
    price: 3000,
    currency: 'credits',
  },
  {
    slug: 'zombie-skin',
    name: 'Зомби',
    type: 'skin',
    description: 'Необычный образ для самых дерзких матчей.',
    rarity: 'legendary',
    price: 10000,
    currency: 'credits',
  },
  {
    slug: 'newcomer-title',
    name: '«Новичок»',
    type: 'title',
    description: 'Базовый титул.',
    rarity: 'common',
    price: 0,
    currency: 'credits',
  },
  {
    slug: 'conqueror-title',
    name: '«Покоритель»',
    type: 'title',
    description: 'Показывает титул в лобби.',
    rarity: 'rare',
    price: 3000,
    currency: 'credits',
  },
  {
    slug: 'legend-title',
    name: '«Легенда»',
    type: 'title',
    description: 'Титул для настоящих легенд.',
    rarity: 'legendary',
    price: 500,
    currency: 'credits',
  },
];
