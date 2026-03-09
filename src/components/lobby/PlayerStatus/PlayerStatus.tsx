import React from 'react';
import { Paper, Group, Avatar, Text, Badge, Progress, Stack, Button} from '@mantine/core';
import { IconCrown, IconSword, IconShield, IconTrophy, IconSettings, IconUsers} from '@tabler/icons-react';
import type { Player, PlayerStats } from '@types/lobby';
import { useNavigate } from 'react-router-dom';
import classes from './PlayerStatus.module.css';

interface PlayerStatusProps {
  player: Player;
  stats: PlayerStats;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ player, stats }) => {
  const levelProgress = (stats.experience / stats.nextLevelExp) * 100;
const navigate = useNavigate()
  
  return (
    <Paper className={classes.playerCard} radius="md" withBorder>
      <Group wrap="nowrap" align="flex-start">
        {/* Аватар с уровнем */}
        <div className={classes.avatarWrapper}>
          <Avatar
            src={player.avatar}
            size={80}
            radius="md"
            className={classes.avatar}
          />
          <Badge 
            className={classes.levelBadge}
            variant="filled"
            color="blue"
            size="lg"
          >
            LVL {player.level}
          </Badge>
        </div>

        {/* Информация об игроке */}
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700}>
                {player.nickname}
              </Text>
            </div>
            
            {/* Статистика в компактном виде */}
            <Group gap="xs">
              <Group gap={4}>
                <IconTrophy size={16} color="gold" />
                <Text size="sm">{stats.wins}</Text>
              </Group>
              <Group gap={4}>
                <IconSword size={16} color="red" />
                <Text size="sm">{stats.losses}</Text>
              </Group>
              <Group gap={4}>
                <IconShield size={16} color="blue" />
                <Text size="sm">{stats.draws}</Text>
              </Group>
            </Group>
          </Group>

          {/* Прогресс уровня */}
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" c="dimmed">Опыт до следующего уровня</Text>
              <Text size="sm" fw={500}>
                {stats.experience}/{stats.nextLevelExp}
              </Text>
            </Group>
            <Progress 
              value={levelProgress} 
              size="sm"
              color="blue"
              striped
              animated
            />
          </div>

          {/* Кнопки действий */}
          <Group grow mt="xs">
            <Button 
                  variant="light" 
                  leftSection={<IconSettings size={20} />}
                  fullWidth
                  onClick={() => navigate('/settings')}
                >
                  Настройки
            </Button>
            <Button 
              variant="light"
              leftSection={<IconUsers size={20} />}
            >
              Пригласить друзей
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
};

export default PlayerStatus;