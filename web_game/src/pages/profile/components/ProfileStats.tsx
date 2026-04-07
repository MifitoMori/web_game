import React from 'react';
import { Grid, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconFlame,
  IconScoreboard,
  IconShield,
  IconSword,
  IconTrendingUp,
  IconTrophy,
} from '@tabler/icons-react';
import type { GameStats } from '@types/profile';
import classes from './ProfileStats.module.css';

interface ProfileStatsProps {
  stats: GameStats;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const statCards = [
    { title: 'Всего игр', value: stats.totalGames, icon: IconScoreboard, color: 'blue' },
    { title: 'Победы', value: stats.wins, icon: IconTrophy, color: 'green' },
    { title: 'Поражения', value: stats.losses, icon: IconSword, color: 'red' },
    { title: 'Ничьи', value: stats.draws, icon: IconShield, color: 'yellow' },
    { title: 'Win Rate', value: `${stats.winRate}%`, icon: IconTrendingUp, color: 'cyan' },
    { title: 'Макс. стрик', value: stats.longestWinStreak, icon: IconFlame, color: 'orange' },
  ];

  return (
    <Paper className={classes.statsContainer} radius="md" withBorder p="md">
      <Title order={3} mb="md">
        Статистика
      </Title>
      <Grid>
        {statCards.map((stat) => (
          <Grid.Col key={stat.title} span={{ base: 6, sm: 4, md: 3 }}>
            <Paper className={classes.statCard} withBorder p="xs">
              <Group>
                <ThemeIcon color={stat.color} variant="light" size="lg">
                  <stat.icon size={20} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    {stat.title}
                  </Text>
                  <Text size="lg" fw={700}>
                    {stat.value}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
};

export default ProfileStats;
