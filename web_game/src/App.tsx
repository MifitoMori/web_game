import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import {
  API_ACCESS_REVOKED_EVENT,
  clearAuthTokens,
  notifyAuthUserUpdated,
  refreshCurrentUser,
  type ApiAccessRevokedDetail,
} from '@services/api';
import AuthLayout from '@layouts/AuthLayout';
import MainLayout from '@layouts/MainLayout';
import GameLayout from '@layouts/GameLayout';
import ProtectedRoute from '@components/common/ProtectedRoute/ProtectedRoute';
import AdminRoute from '@components/common/AdminRoute/AdminRoute';

// Регистрация
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';

//Основные страницы
import LobbyPage from '@pages/lobby/LobbyPage';
import ProfilePage from '@pages/profile/ProfilePage';
import ShopPage from '@pages/shop/ShopPage';
import LeaderboardPage from '@pages/leaderboard/LeaderboardPage';
import SettingsPage from '@pages/settings/SettingsPage';
import GamePage from '@pages/game/GamePage';
import AdminPage from '@pages/admin/AdminPage';

// Стили
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const clearSession = () => {
  clearAuthTokens();
};

const ApiAccessRevokedHandler = () => {
  const navigate = useNavigate();
  const isHandlingAccessRevoked = useRef(false);

  useEffect(() => {
    const handleAccessRevoked = (event: Event) => {
      if (isHandlingAccessRevoked.current) {
        return;
      }

      isHandlingAccessRevoked.current = true;
      const { status } = (event as CustomEvent<ApiAccessRevokedDetail>).detail;

      if (status === 401) {
        clearSession();
        notifyAuthUserUpdated(null);

        notifications.show({
          title: 'Сессия истекла',
          message: 'Войдите в аккаунт заново',
          color: 'red',
        });

        navigate('/login', { replace: true });

        window.setTimeout(() => {
          isHandlingAccessRevoked.current = false;
        }, 1000);

        return;
      }

      void refreshCurrentUser()
        .then((currentUser) => {
          if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
            notifications.show({
              title: 'Права обновлены',
              message: 'Ваши текущие права изменились, интерфейс обновлен',
              color: 'yellow',
            });
            return;
          }

          notifications.show({
            title: 'Доступ отозван',
            message: 'У вас больше нет прав для работы с админ-панелью',
            color: 'red',
          });

          navigate('/lobby', { replace: true });
        })
        .catch(() => {
          notifications.show({
            title: 'Доступ отозван',
            message: 'Не удалось подтвердить текущие права',
            color: 'red',
          });

          navigate('/lobby', { replace: true });
        })
        .finally(() => {
          window.setTimeout(() => {
            isHandlingAccessRevoked.current = false;
          }, 1000);
        });
    };

    window.addEventListener(API_ACCESS_REVOKED_EVENT, handleAccessRevoked);

    return () => window.removeEventListener(API_ACCESS_REVOKED_EVENT, handleAccessRevoked);
  }, [navigate]);

  return null;
};

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <Notifications />
      <ModalsProvider>
        <BrowserRouter>
          <ApiAccessRevokedHandler />
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/lobby" replace />} />
                <Route path="/lobby" element={<LobbyPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route element={<GameLayout />}>
                <Route path="/game" element={<GamePage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
