import React, { useState } from 'react';
import { Badge, Button, Grid, Group, Paper, Tabs, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconCategory,
  IconCrown,
  IconCube,
} from '@tabler/icons-react';
import type { InventoryItem } from '@app-types/profile';
import classes from './ProfileInventory.module.css';

interface ProfileInventoryProps {
  inventory: InventoryItem[];
  onEquip: (item: InventoryItem) => void;
}

const ProfileInventory: React.FC<ProfileInventoryProps> = ({
  inventory,
  onEquip,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('all');

  const getRarityColor = (rarity: InventoryItem['rarity']) => {
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

  const getRarityLabel = (rarity: InventoryItem['rarity']) => {
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

  const getTypeIcon = (type: InventoryItem['type']) => {
    switch (type) {
      case 'skin':
        return <IconCube size={16} />;
      case 'title':
        return <IconCrown size={16} />;
      default:
        return <IconCategory size={16} />;
    }
  };

  const filteredInventory =
    activeTab === 'all' ? inventory : inventory.filter((item) => item.type === activeTab);

  return (
    <Paper className={classes.inventoryContainer} radius="md" withBorder p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Инвентарь</Title>
        <Badge size="lg" variant="filled" color="blue">
          {inventory.length}
        </Badge>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List grow>
          <Tabs.Tab value="all" leftSection={<IconCategory size={16} />}>
            Все
          </Tabs.Tab>
          <Tabs.Tab value="skin" leftSection={<IconCube size={16} />}>
            Скины
          </Tabs.Tab>
          <Tabs.Tab value="title" leftSection={<IconCrown size={16} />}>
            Титулы
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Text size="sm" c="dimmed" mb="xs">
        Доступные предметы
      </Text>

      <Grid gutter="sm" mb="lg">
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <Grid.Col key={item.id} span={6}>
              <Paper className={classes.inventoryItem} withBorder p="sm">
                <div className={classes.inventoryItemContent}>
                  <Group gap="sm" wrap="nowrap" className={classes.inventoryItemInfo}>
                    <ThemeIcon color={getRarityColor(item.rarity)} variant="light" size="lg">
                      {getTypeIcon(item.type)}
                    </ThemeIcon>
                    <div className={classes.inventoryItemText}>
                      <Text size="sm" fw={500}>
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed" className={classes.inventoryDescription}>
                        {item.description}
                      </Text>
                      <Badge
                        size="xs"
                        color={getRarityColor(item.rarity)}
                        variant="light"
                        mt={4}
                      >
                        {getRarityLabel(item.rarity)}
                      </Badge>
                    </div>
                  </Group>
                  <div className={classes.inventoryItemAction}>
                    {item.equipped ? (
                      <Badge size="lg" color="green" variant="filled">
                        Надето
                      </Badge>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => onEquip(item)}
                      >
                        Надеть
                      </Button>
                    )}
                  </div>
                </div>
              </Paper>
            </Grid.Col>
          ))
        ) : (
          <Text c="dimmed" ta="center" py="md">
            В этой категории пока нет предметов
          </Text>
        )}
      </Grid>
    </Paper>
  );
};

export default ProfileInventory;
