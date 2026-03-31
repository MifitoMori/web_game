import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Grid,
  Modal,
  Tabs,
  ThemeIcon,
  Divider,
  ScrollArea,
  Box,
  Tooltip,
  Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCoin,
  IconDiamond,
  IconShoppingCart,
  IconCheck,
  IconCrown,
  IconSparkles,
  IconBolt,
  IconCube,
  IconCategory,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { ShopItem } from '@types/shop';
import type { InventoryItem } from '@types/profile';
import { shopCategories } from '@mocks/shopData';
import classes from './Shop.module.css';

interface ShopProps {
  credits: number;
  gems: number;
  inventory: InventoryItem[];
  onPurchase: (item: ShopItem) => Promise<boolean>;
}

const Shop: React.FC<ShopProps> = ({ credits, gems, inventory, onPurchase }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'gray';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'yellow';
      default: return 'gray';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Обычный';
      case 'rare': return 'Редкий';
      case 'epic': return 'Эпический';
      case 'legendary': return 'Легендарный';
      default: return rarity;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skin': return <IconCube size={20} />;
      case 'trail': return <IconSparkles size={20} />;
      case 'effect': return <IconBolt size={20} />;
      case 'title': return <IconCrown size={20} />;
      default: return <IconCategory size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'skin': return 'Скин';
      case 'trail': return 'След';
      case 'effect': return 'Эффект';
      case 'title': return 'Титул';
      default: return type;
    }
  };

  const isItemOwned = (item: ShopItem) => {
    return inventory.some(i => i.name === item.name && i.unlocked);
  };

  const canAfford = (item: ShopItem) => {
    if (item.currency === 'credits') {
      return credits >= item.price;
    } else {
      return gems >= item.price;
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    setSelectedItem(item);
    open();
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;
    
    setPurchasing(true);
    try {
      const success = await onPurchase(selectedItem);
      if (success) {
        notifications.show({
          title: 'Покупка совершена!',
          message: `Вы приобрели ${selectedItem.name}`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }
      close();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось совершить покупку',
        color: 'red',
      });
    } finally {
      setPurchasing(false);
      setSelectedItem(null);
    }
  };

  return (
    <>
      {/* Кнопка открытия магазина */}
      <Paper 
        className={classes.shopTrigger}
        withBorder 
        p="md"
        onClick={open}
      >
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
              <IconShoppingCart size={20} />
            </ThemeIcon>
            <div>
              <Text fw={500}>Магазин</Text>
              <Text size="xs" c="dimmed">Новые предметы каждую неделю</Text>
            </div>
          </Group>
          <Badge variant="light" color="orange">New</Badge>
        </Group>
      </Paper>

      {/* Модальное окно магазина */}
      <Modal
        opened={opened}
        onClose={close}
        title="Магазин"
        size="xl"
        classNames={{ content: classes.shopModal }}
      >
        {/* Баланс */}
        <Group className={classes.balanceBar} mb="md">
          <Paper className={classes.balanceItem} withBorder p="xs">
            <Group gap="xs">
              <IconCoin size={20} color="gold" />
              <Text fw={700}>{credits.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">кредитов</Text>
            </Group>
          </Paper>
          <Paper className={classes.balanceItem} withBorder p="xs">
            <Group gap="xs">
              <IconDiamond size={20} color="cyan" />
              <Text fw={700}>{gems.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">гемов</Text>
            </Group>
          </Paper>
        </Group>

        <Tabs defaultValue="skins" variant="pills" mb="md">
          <Tabs.List grow>
            {shopCategories.map(category => (
              <Tabs.Tab 
                key={category.id} 
                value={category.id}
                leftSection={getTypeIcon(category.items[0]?.type || '')}
              >
                {category.name}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {shopCategories.map(category => (
            <Tabs.Panel key={category.id} value={category.id} pt="md">
              <ScrollArea h={500}>
                <Grid gutter="md">
                  {category.items.map((item) => {
                    const owned = isItemOwned(item);
                    const affordable = canAfford(item);
                    
                    return (
                      <Grid.Col key={item.id} span={12}>
                        <Paper 
                          className={`${classes.shopItem} ${owned ? classes.owned : ''}`}
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
                                <Text size="xs" c="dimmed">{item.description}</Text>
                              </div>
                            </Group>
                            
                            {owned ? (
                              <Badge color="green" variant="filled" size="lg">
                                Приобретено
                              </Badge>
                            ) : (
                              <Tooltip label={!affordable ? 'Недостаточно средств' : ''}>
                                <Button
                                  variant={affordable ? 'gradient' : 'light'}
                                  gradient={{ from: 'orange', to: 'red' }}
                                  leftSection={item.currency === 'credits' ? 
                                    <IconCoin size={16} /> : 
                                    <IconDiamond size={16} />
                                  }
                                  onClick={() => handlePurchase(item)}
                                  disabled={!affordable}
                                >
                                  {item.price} {item.currency === 'credits' ? 'кредитов' : 'гемов'}
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
      </Modal>

      {/* Модальное окно подтверждения покупки */}
      <Modal
        opened={!!selectedItem && !purchasing}
        onClose={() => setSelectedItem(null)}
        title="Подтверждение покупки"
        size="sm"
      >
        {selectedItem && (
          <Stack>
            <Group>
              <ThemeIcon size="lg" color={getRarityColor(selectedItem.rarity)} variant="light">
                {getTypeIcon(selectedItem.type)}
              </ThemeIcon>
              <div>
                <Text fw={500}>{selectedItem.name}</Text>
                <Text size="xs" c="dimmed">{selectedItem.description}</Text>
              </div>
            </Group>
            
            <Divider />
            
            <Group justify="space-between">
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
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default Shop;