import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '@layouts/AuthLayout';
import MainLayout from '@layouts/MainLayout';
import GameLayout from '@layouts/GameLayout';
import ProtectedRoute from '@components/common/ProtectedRoute/ProtectedRoute';

// Страницы авторизации
import LoginPage from '@pages/auth/LoginPage';

// Основные страницы
import LobbyPage from '@pages/lobby/LobbyPage';
import ProfilePage from '@pages/profile/ProfilePage';
import ShopPage from '@pages/shop/ShopPage';
import LeaderboardPage from '@pages/leaderboard/LeaderboardPage';
import SettingsPage from '@pages/settings/SettingsPage';
import GamePage from '@pages/game/GamePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты (без авторизации) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Защищенные маршруты (требуется авторизация) */}
        <Route element={<ProtectedRoute />}>
          {/* Основной макет с навигацией */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/lobby" replace />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Специальный макет для игры */}
          <Route element={<GameLayout />}>
            <Route path="/game" element={<GamePage />} />
          </Route>
        </Route>

        {/* 404 - Страница не найдена */}
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;