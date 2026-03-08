import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Game Portal</h1>
        </div>
        <main className="auth-content">
          <Outlet />
        </main>
        <footer className="auth-footer">
          <p>© 2026 Game Portal. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;