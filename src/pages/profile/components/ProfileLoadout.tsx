import React from 'react';
import { Paper, Title, Text, Group, Badge, ThemeIcon, Stack, Divider } from '@mantine/core';
import { 
  IconCube, 
  IconSparkles, 
  IconBolt, 
  IconCrown,
  IconArmchair
} from '@tabler/icons-react';
import type { Loadout } from '@types/profile';
import classes from './ProfileLoadout.module.css';

interface ProfileLoadoutProps {
  loadout: Loadout;
}

const ProfileLoadout: React.FC<ProfileLoadoutProps> = ({ loadout }) => {
  const loadoutItems = [
    { type: 'skin', label: 'Скин', icon: IconCube, item: loadout.skin },
    { type: 'trail', label: 'След', icon: IconSparkles, item: loadout.trail },
    { type: 'effect', label: 'Эффект', icon: IconBolt, item: loadout.effect },
    { type: 'title', label: 'Титул', icon: IconCrown, item: loadout.title },
  ];

  return (
    <Paper className={classes.loadoutContainer} radius="md" withBorder p="md">
      <Title order={3} mb="md">Текущее снаряжение</Title>
      
      <Stack gap="sm">
        {loadoutItems.map(({ type, label, icon: Icon, item }) => (
          <Group key={type} justify="space-between" className={classes.loadoutItem}>
            <Group>
              <ThemeIcon variant="light" size="md">
                <Icon size={18} />
              </ThemeIcon>
              <Text size="sm" fw={500}>{label}:</Text>
            </Group>
            
            {item ? (
              <Group gap="xs">
                <Text size="sm">{item.name}</Text>
                <Badge 
                  size="xs" 
                  variant="light"
                  color={item.rarity === 'common' ? 'gray' :
                         item.rarity === 'rare' ? 'blue' :
                         item.rarity === 'epic' ? 'purple' : 'yellow'}
                >
                  {item.rarity === 'common' ? 'Обычный' :
                   item.rarity === 'rare' ? 'Редкий' :
                   item.rarity === 'epic' ? 'Эпический' : 'Легендарный'}
                </Badge>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">Не выбрано</Text>
            )}
          </Group>
        ))}
      </Stack>

      <Divider my="md" />

      <div className={classes.preview}>
        <Text size="sm" c="dimmed" ta="center">
          {loadout.title?.name || 'Без титула'} | Скин: {loadout.skin?.name || 'Стандартный'} | 
          След: {loadout.trail?.name || 'Обычный'} | Эффект: {loadout.effect?.name || 'Нет'}
        </Text>
      </div>
    </Paper>
  );
};

export default ProfileLoadout;