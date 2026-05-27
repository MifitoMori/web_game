import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Stack, NavLink as MantineNavLink } from '@mantine/core';
import { 
  IconHome, 
  IconUser, 
  IconShoppingCart, 
  IconTrophy, 
  IconSettings, 
  IconPlayerPlay 
} from '@tabler/icons-react';

const navItems = [
  { path: '/lobby', label: 'Лобби', icon: IconHome },
  { path: '/profile', label: 'Профиль', icon: IconUser },
  { path: '/shop', label: 'Магазин', icon: IconShoppingCart },
  { path: '/leaderboard', label: 'Таблица лидеров', icon: IconTrophy },
  { path: '/settings', label: 'Настройки', icon: IconSettings },
  { path: '/game', label: 'Игра', icon: IconPlayerPlay },
];

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <Box component="nav" p="xs">
      <Stack gap="xs">
        {navItems.map((item) => (
          <MantineNavLink
            key={item.path}
            component={NavLink}
            to={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            variant="light"
            active={location.pathname === item.path}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default Navigation;
