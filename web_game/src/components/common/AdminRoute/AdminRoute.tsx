import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { useAuth } from '@hooks/useAuth';

const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <Center h="100vh">
        <Stack gap="xs" align="center">
          <Text fw={700}>Доступ запрещен</Text>
          <Text c="dimmed">Эта страница доступна только администраторам.</Text>
        </Stack>
      </Center>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
