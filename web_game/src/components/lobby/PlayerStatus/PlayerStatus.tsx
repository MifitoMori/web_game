import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { IconSword, IconTrophy } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { Player, PlayerStats } from '@app-types/lobby';
import classes from './PlayerStatus.module.css';

interface PlayerStatusProps {
  player: Player;
  stats: PlayerStats;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ player, stats }) => {
  const navigate = useNavigate();
  const levelProgress = (stats.experience / stats.nextLevelExp) * 100;

  return (
    <Box
      onClick={() => navigate('/profile')}
      style={{ cursor: 'pointer' }}
      bg="light-dark"
    >
      <Paper className={classes.playerCard} radius="md" withBorder>
        <Group wrap="nowrap" align="flex-start">
          <div className={classes.avatarWrapper}>
            <Avatar src={player.avatar} size={80} radius="md" className={classes.avatar} />
            <Badge className={classes.levelBadge} variant="filled" color="blue" size="lg">
              LVL {player.level}
            </Badge>
          </div>

          <Stack gap="xs" style={{ flex: 1 }}>
            <Group justify="space-between">
              
                <Group gap="xs">
                  <Text size="xl" fw={700}>
                    {player.nickname}
                  </Text>
                  {player.title && (
                    <Badge variant="light" color="grape" size="sm">
                      {player.title}
                    </Badge>
                  )}
                </Group>
              

              <Group gap="xs">
                <Group gap={4}>
                  <IconTrophy size={16} color="gold" />
                  <Text size="sm">{stats.wins}</Text>
                </Group>
                <Group gap={4}>
                  <IconSword size={16} color="red" />
                  <Text size="sm">{stats.losses}</Text>
                </Group>
              </Group>
            </Group>

            <div>
              <Group justify="space-between" mb={4}>
                <Text size="sm" c="dimmed">
                  Опыт до следующего уровня
                </Text>
                <Text size="sm" fw={500}>
                  {stats.experience}/{stats.nextLevelExp}
                </Text>
              </Group>
              <Progress value={levelProgress} size="sm" color="blue" striped animated />
            </div>
          </Stack>
        </Group>
      </Paper>
    </Box>
  );
};

export default PlayerStatus;
