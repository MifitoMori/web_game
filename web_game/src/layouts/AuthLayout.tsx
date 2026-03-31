import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Paper, Box, Text, Group, ThemeIcon } from '@mantine/core';
import classes from './AuthLayout.module.css';
import { 
  IconDeviceGamepad2, 
  IconFriends, 
  IconCrown, 
  IconChartLine
} from '@tabler/icons-react';
import authBgImage from '@assets/images/auth-bg3.jpg';

const AuthLayout: React.FC = () => {
  return (
    <div className={classes.wrapper}>
      {/* Левая часть с брендингом */}
      <div 
        className={classes.brandSection}
        style={{ '--bg-image': `url(${authBgImage})` } as React.CSSProperties}
      >
        <div className={classes.brandContent}>
          <ThemeIcon 
            size={80} 
            radius="md" 
            variant="gradient" 
            gradient={{ from: 'blue', to: 'cyan' }}
            className={classes.logo}
          >
            <IconDeviceGamepad2 size={48}/>
          </ThemeIcon>
          
          <Text className={classes.title} size="xl" fw={900}>
            Game Portal
          </Text>
          
          <Text className={classes.description} size="lg">
            Добро пожаловать в увлекательный 2Д шутер!
          </Text>
          
          <Group className={classes.features}>
            <Box className={classes.feature}>
              <IconFriends size={48} stroke={1.3} className={classes.featureIcon} />
              <Text size="sm" className={classes.featureText}>Играй с друзьями</Text>
            </Box>
            <Box className={classes.feature}>
              <IconCrown size={48} stroke={1.3} className={classes.featureIcon} />
              <Text size="sm" className={classes.featureText}>Соревнуйся</Text>
            </Box>
            <Box className={classes.feature}>
              <IconChartLine size={48} stroke={1.3} className={classes.featureIcon} />
              <Text size="sm" className={classes.featureText}>Повышай уровень</Text>
            </Box>
          </Group>
        </div>
      </div>

      {/* Правая часть с формами */}
      <div className={classes.formSection}>
        <Container size={620} className={classes.formContainer}>
          <Paper radius="lg" p="xl" withBorder className={classes.formPaper}>
            <Outlet />
          </Paper>
          
          <Text c="dimmed" size="xs" ta="center" mt="md">
            © 2026 Game Portal. Все права защищены.
          </Text>
        </Container>
      </div>
    </div>
  );
};

export default AuthLayout;