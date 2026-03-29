import React, { useState } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Badge, 
  Button, 
  Grid, 
  Stack,
  Tabs,
  ThemeIcon,
  Box
} from '@mantine/core';
import { 
  IconArmchair,
  IconSparkles,
  IconBolt,
  IconCrown,
  IconStar,
  IconCategory,
  IconCube
} from '@tabler/icons-react';
import type { InventoryItem } from '@types/profile';
import classes from './ProfileInventory.module.css';

interface ProfileInventoryProps {
  inventory: InventoryItem[];
  onEquip: (item: InventoryItem) => void;
  onUnequip: (itemType: string) => void;
}

const ProfileInventory: React.FC<ProfileInventoryProps> = ({ 
  inventory, 
  onEquip, 
  onUnequip 
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('all');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'gray';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'yellow';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skin': return <IconCube size={16} />;
      case 'trail': return <IconSparkles size={16} />;
      case 'effect': return <IconBolt size={16} />;
      case 'title': return <IconCrown size={16} />;
      default: return <IconCategory size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'skin': return 'Скины';
      case 'trail': return 'Следы';
      case 'effect': return 'Эффекты';
      case 'title': return 'Титулы';
      default: return 'Все';
    }
  };

  const filteredInventory = activeTab === 'all' 
    ? inventory 
    : inventory.filter(item => item.type === activeTab);

  const availableItems = filteredInventory.filter(item => item.unlocked);
  return (
    <Paper className={classes.inventoryContainer} radius="md" withBorder p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Инвентарь</Title>
        <Badge size="lg" variant="filled" color="blue">
          {inventory.filter(i => i.unlocked).length} / {inventory.length}
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
          <Tabs.Tab value="trail" leftSection={<IconSparkles size={16} />}>
            Следы
          </Tabs.Tab>
          <Tabs.Tab value="effect" leftSection={<IconBolt size={16} />}>
            Эффекты
          </Tabs.Tab>
          <Tabs.Tab value="title" leftSection={<IconCrown size={16} />}>
            Титулы
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <div className={classes.itemsGrid}>
        <Text size="sm" c="dimmed" mb="xs">Доступные предметы</Text>
        <Grid gutter="sm" mb="lg">
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <Grid.Col key={item.id} span={6}>
                <Paper className={classes.inventoryItem} withBorder p="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon 
                        color={getRarityColor(item.rarity)} 
                        variant="light" 
                        size="lg"
                      >
                        {getTypeIcon(item.type)}
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>{item.name}</Text>
                        <Text size="xs" c="dimmed">{item.description}</Text>
                        <Badge 
                          size="xs" 
                          color={getRarityColor(item.rarity)} 
                          variant="light"
                          mt={4}
                        >
                          {item.rarity === 'common' ? 'Обычный' :
                           item.rarity === 'rare' ? 'Редкий' :
                           item.rarity === 'epic' ? 'Эпический' : 'Легендарный'}
                        </Badge>
                      </div>
                    </Group>
                    <Button
                      size="xs"
                      variant={item.equipped ? 'filled' : 'light'}
                      color={item.equipped ? 'green' : 'blue'}
                      onClick={() => item.equipped ? onUnequip(item.type) : onEquip(item)}
                    >
                      {item.equipped ? 'Надето' : 'Надеть'}
                    </Button>
                  </Group>
                </Paper>
              </Grid.Col>
            ))
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Нет доступных предметов в этой категории
            </Text>
          )}
        </Grid>
      </div>
    </Paper>
  );
};

export default ProfileInventory;