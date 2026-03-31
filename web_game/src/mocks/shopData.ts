import type { ShopItem, ShopCategory } from '@types/shop';

export const shopItems: ShopItem[] = [
  // Скины
  {
    id: 'shop_1',
    name: 'Классика',
    type: 'skin',
    description: 'Стандартный скин',
    rarity: 'common',
    price: 0,
    currency: 'credits',
  },
  {
    id: 'shop_2',
    name: 'Золотой скин',
    type: 'skin',
    description: 'Золотой скин для настоящих чемпионов',
    rarity: 'epic',
    price: 5000,
    currency: 'credits',
  },
  {
    id: 'shop_3',
    name: 'Неоновый скин',
    type: 'skin',
    description: 'Светящаяся неоновый скин',
    rarity: 'legendary',
    price: 150,
    currency: 'gems',
  },
  {
    id: 'shop_4',
    name: 'Ледяной скин',
    type: 'skin',
    description: 'Скин изо льда с морозным следом',
    rarity: 'epic',
    price: 8000,
    currency: 'credits',
  },
  
  // Следы
  {
    id: 'shop_5',
    name: 'Неоновый след',
    type: 'trail',
    description: 'Яркий неоновый след за персонажом',
    rarity: 'rare',
    price: 2500,
    currency: 'credits',
  },
  {
    id: 'shop_6',
    name: 'Искрящийся след',
    type: 'trail',
    description: 'Искры летят за персонажом',
    rarity: 'epic',
    price: 75,
    currency: 'gems',
  },
  {
    id: 'shop_7',
    name: 'Радужный след',
    type: 'trail',
    description: 'След переливающийся всеми цветами радуги',
    rarity: 'legendary',
    price: 200,
    currency: 'gems',
  },
  
  // Эффекты
  {
    id: 'shop_8',
    name: 'Эффект победы',
    type: 'effect',
    description: 'Взрыв конфетти при победе',
    rarity: 'legendary',
    price: 300,
    currency: 'gems',
  },
  {
    id: 'shop_9',
    name: 'Эффект поражения',
    type: 'effect',
    description: 'Эффект дыма при поражении',
    rarity: 'rare',
    price: 1500,
    currency: 'credits',
  },
  
  // Титулы
  {
    id: 'shop_10',
    name: 'Титул "Покоритель"',
    type: 'title',
    description: 'Показывает титул в лобби',
    rarity: 'rare',
    price: 3000,
    currency: 'credits',
  },
  {
    id: 'shop_11',
    name: 'Титул "Легенда"',
    type: 'title',
    description: 'Титул для настоящих легенд',
    rarity: 'legendary',
    price: 500,
    currency: 'gems',
  },
];

export const shopCategories: ShopCategory[] = [
  {
    id: 'skins',
    name: 'Скины',
    items: shopItems.filter(item => item.type === 'skin'),
  },
  {
    id: 'trails',
    name: 'Следы',
    items: shopItems.filter(item => item.type === 'trail'),
  },
  {
    id: 'effects',
    name: 'Эффекты',
    items: shopItems.filter(item => item.type === 'effect'),
  },
  {
    id: 'titles',
    name: 'Титулы',
    items: shopItems.filter(item => item.type === 'title'),
  },
];