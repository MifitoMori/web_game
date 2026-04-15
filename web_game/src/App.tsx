import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
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

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <Notifications />
      <ModalsProvider>
        <BrowserRouter>
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
