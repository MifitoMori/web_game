import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Tabs,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBolt,
  IconCategory,
  IconCheck,
  IconCoin,
  IconCrown,
  IconCube,
  IconDiamond,
  IconShoppingCart,
  IconSparkles,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { ShopCatalogItem, ShopCategory, ShopItem } from '@types/shop';
import classes from './Shop.module.css';

interface ShopProps {
  credits: number;
  gems: number;
  onPurchase: (item: ShopItem) => Promise<boolean>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const categoryNames: Record<ShopCatalogItem['type'], string> = {
  skin: 'Скины',
  trail: 'Следы',
  effect: 'Эффекты',
  title: 'Титулы',
};

const categoryOrder: ShopCatalogItem['type'][] = ['skin', 'trail', 'effect', 'title'];

const Shop: React.FC<ShopProps> = ({ credits, gems, onPurchase }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedItem, setSelectedItem] = useState<ShopCatalogItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [catalogItems, setCatalogItems] = useState<ShopCatalogItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const shopCategories = useMemo<ShopCategory<ShopCatalogItem>[]>(
    () =>
      categoryOrder.map((type) => ({
        id: `${type}s`,
        name: categoryNames[type],
        items: catalogItems.filter((item) => item.type === type),
      })),
    [catalogItems]
  );

  useEffect(() => {
    if (!opened || catalogLoaded || isCatalogLoading) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const loadCatalog = async () => {
      setIsCatalogLoading(true);

      try {
        const response = await fetch(getApiUrl('/api/shop/catalog'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить каталог магазина');
        }

        const items = (await response.json()) as ShopCatalogItem[];
        setCatalogItems(items);
        setCatalogLoaded(true);
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message:
            error instanceof Error ? error.message : 'Не удалось загрузить каталог магазина',
          color: 'red',
        });
      } finally {
        setIsCatalogLoading(false);
      }
    };

    void loadCatalog();
  }, [catalogLoaded, isCatalogLoading, opened]);

  const getRarityColor = (rarity: ShopCatalogItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'gray';
      case 'rare':
        return 'blue';
      case 'epic':
        return 'purple';
      case 'legendary':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getRarityLabel = (rarity: ShopCatalogItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'Обычный';
      case 'rare':
        return 'Редкий';
      case 'epic':
        return 'Эпический';
      case 'legendary':
        return 'Легендарный';
      default:
        return rarity;
    }
  };

  const getTypeIcon = (type: ShopCatalogItem['type']) => {
    switch (type) {
      case 'skin':
        return <IconCube size={20} />;
      case 'trail':
        return <IconSparkles size={20} />;
      case 'effect':
        return <IconBolt size={20} />;
      case 'title':
        return <IconCrown size={20} />;
      default:
        return <IconCategory size={20} />;
    }
  };

  const getTypeLabel = (type: ShopCatalogItem['type']) => {
    switch (type) {
      case 'skin':
        return 'Скин';
      case 'trail':
        return 'След';
      case 'effect':
        return 'Эффект';
      case 'title':
        return 'Титул';
      default:
        return type;
    }
  };

  const canAfford = (item: ShopItem) =>
    item.currency === 'credits' ? credits >= item.price : gems >= item.price;

  const handlePurchase = (item: ShopCatalogItem) => {
    setSelectedItem(item);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) {
      return;
    }

    setPurchasing(true);

    try {
      const success = await onPurchase(selectedItem);

      if (success) {
        setCatalogItems((currentItems) =>
          currentItems.map((item) =>
            item.id === selectedItem.id ? { ...item, owned: true } : item
          )
        );

        notifications.show({
          title: 'Покупка совершена!',
          message: `Вы приобрели ${selectedItem.name}`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      setSelectedItem(null);
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось совершить покупку',
        color: 'red',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      <Paper className={classes.shopTrigger} withBorder p="md" onClick={open}>
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
              <IconShoppingCart size={20} />
            </ThemeIcon>
            <div>
              <Text fw={500}>Магазин</Text>
              <Text size="xs" c="dimmed">
                Каталог предметов и косметики
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="orange">
            New
          </Badge>
        </Group>
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title="Магазин"
        size="xl"
        classNames={{ content: classes.shopModal }}
      >
        <Group className={classes.balanceBar} mb="md">
          <Paper className={classes.balanceItem} withBorder p="xs">
            <Group gap="xs">
              <IconCoin size={20} color="gold" />
              <Text fw={700}>{credits.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">
                кредитов
              </Text>
            </Group>
          </Paper>
          <Paper className={classes.balanceItem} withBorder p="xs">
            <Group gap="xs">
              <IconDiamond size={20} color="cyan" />
              <Text fw={700}>{gems.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">
                гемов
              </Text>
            </Group>
          </Paper>
        </Group>

        {isCatalogLoading ? (
          <Center h={320}>
            <Loader size="lg" />
          </Center>
        ) : (
          <Tabs defaultValue={shopCategories[0]?.id} variant="pills" mb="md">
            <Tabs.List grow>
              {shopCategories.map((category) => (
                <Tabs.Tab
                  key={category.id}
                  value={category.id}
                  leftSection={getTypeIcon(category.items[0]?.type ?? 'skin')}
                >
                  {category.name}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {shopCategories.map((category) => (
              <Tabs.Panel key={category.id} value={category.id} pt="md">
                <ScrollArea h={500}>
                  <Grid gutter="md">
                    {category.items.map((item) => {
                      const affordable = canAfford(item);

                      return (
                        <Grid.Col key={item.id} span={12}>
                          <Paper
                            className={`${classes.shopItem} ${item.owned ? classes.owned : ''}`}
                            withBorder
                            p="md"
                          >
                            <Group justify="space-between" wrap="nowrap">
                              <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                                <ThemeIcon
                                  size="lg"
                                  color={getRarityColor(item.rarity)}
                                  variant="light"
                                >
                                  {getTypeIcon(item.type)}
                                </ThemeIcon>

                                <div style={{ flex: 1 }}>
                                  <Group gap="xs" wrap="nowrap">
                                    <Text fw={500}>{item.name}</Text>
                                    <Badge
                                      size="xs"
                                      color={getRarityColor(item.rarity)}
                                      variant="light"
                                    >
                                      {getRarityLabel(item.rarity)}
                                    </Badge>
                                    <Badge size="xs" variant="outline">
                                      {getTypeLabel(item.type)}
                                    </Badge>
                                  </Group>
                                  <Text size="xs" c="dimmed">
                                    {item.description}
                                  </Text>
                                </div>
                              </Group>

                              {item.owned ? (
                                <Badge
                                  color={item.equipped ? 'blue' : 'green'}
                                  variant="filled"
                                  size="lg"
                                >
                                  {item.equipped ? 'Надето' : 'Приобретено'}
                                </Badge>
                              ) : (
                                <Tooltip label={!affordable ? 'Недостаточно средств' : ''}>
                                  <Button
                                    variant={affordable ? 'gradient' : 'light'}
                                    gradient={{ from: 'orange', to: 'red' }}
                                    leftSection={
                                      item.currency === 'credits' ? (
                                        <IconCoin size={16} />
                                      ) : (
                                        <IconDiamond size={16} />
                                      )
                                    }
                                    onClick={() => handlePurchase(item)}
                                    disabled={!affordable}
                                  >
                                    {item.price}{' '}
                                    {item.currency === 'credits' ? 'кредитов' : 'гемов'}
                                  </Button>
                                </Tooltip>
                              )}
                            </Group>
                          </Paper>
                        </Grid.Col>
                      );
                    })}
                  </Grid>
                </ScrollArea>
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </Modal>

      <Modal
        opened={!!selectedItem && !purchasing}
        onClose={() => setSelectedItem(null)}
        title="Подтверждение покупки"
        size="sm"
      >
        {selectedItem && (
          <>
            <Group>
              <ThemeIcon size="lg" color={getRarityColor(selectedItem.rarity)} variant="light">
                {getTypeIcon(selectedItem.type)}
              </ThemeIcon>
              <div>
                <Text fw={500}>{selectedItem.name}</Text>
                <Text size="xs" c="dimmed">
                  {selectedItem.description}
                </Text>
              </div>
            </Group>

            <Divider my="md" />

            <Group justify="space-between" mb="sm">
              <Text size="sm">Цена:</Text>
              <Group gap="xs">
                {selectedItem.currency === 'credits' ? (
                  <IconCoin size={16} color="gold" />
                ) : (
                  <IconDiamond size={16} color="cyan" />
                )}
                <Text fw={700}>{selectedItem.price.toLocaleString()}</Text>
                <Text size="xs" c="dimmed">
                  {selectedItem.currency === 'credits' ? 'кредитов' : 'гемов'}
                </Text>
              </Group>
            </Group>

            <Group justify="space-between">
              <Text size="sm">Ваш баланс:</Text>
              <Group gap="xs">
                {selectedItem.currency === 'credits' ? (
                  <IconCoin size={16} color="gold" />
                ) : (
                  <IconDiamond size={16} color="cyan" />
                )}
                <Text fw={700}>
                  {selectedItem.currency === 'credits'
                    ? credits.toLocaleString()
                    : gems.toLocaleString()}
                </Text>
              </Group>
            </Group>

            <Group grow mt="md">
              <Button variant="light" onClick={() => setSelectedItem(null)}>
                Отмена
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'orange', to: 'red' }}
                onClick={confirmPurchase}
              >
                Купить
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  );
};

export default Shop;
