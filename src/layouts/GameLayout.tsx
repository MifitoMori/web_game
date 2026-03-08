import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const GameLayout: React.FC = () => {
  return (
    <div className="game-layout">
      <div className="game-header">
        <Link to="/lobby" className="back-button">
          ← Выйти в лобби
        </Link>
        <div className="game-info">
          <span>Игровой процесс</span>
        </div>
      </div>
      <main className="game-content">
        <Outlet />
      </main>
    </div>
  );
};

export default GameLayout;