// web_game/src/layouts/GameLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const GameLayout: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Outlet />
    </div>
  );
};

export default GameLayout;