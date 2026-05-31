import React from 'react';
import { Badge, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCrown, IconCube } from '@tabler/icons-react';
import type { Loadout } from '@app-types/profile';
import classes from './ProfileLoadout.module.css';

interface ProfileLoadoutProps {
  loadout: Loadout;
}

const getRarityLabel = (rarity: string) => {
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

const getRarityColor = (rarity: string) => {
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

const ProfileLoadout: React.FC<ProfileLoadoutProps> = ({ loadout }) => {
  const loadoutItems = [
    { type: 'skin', label: 'Скин', icon: IconCube, item: loadout.skin },
    { type: 'title', label: 'Титул', icon: IconCrown, item: loadout.title },
  ];

  return (
    <Paper className={classes.loadoutContainer} radius="md" withBorder p="md">
      <Title order={3} mb="md">
        Текущее снаряжение
      </Title>

      <Stack gap="sm">
        {loadoutItems.map(({ type, label, icon: Icon, item }) => (
          <Group key={type} justify="space-between" className={classes.loadoutItem}>
            <Group>
              <ThemeIcon variant="light" size="md">
                <Icon size={18} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {label}:
              </Text>
            </Group>

            {item ? (
              <Group gap="xs">
                <Text size="sm">{item.name}</Text>
                <Badge size="xs" variant="light" color={getRarityColor(item.rarity)}>
                  {getRarityLabel(item.rarity)}
                </Badge>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Не выбрано
              </Text>
            )}
          </Group>
        ))}
      </Stack>
    </Paper>
  );
};

export default ProfileLoadout;
