import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  avatar?: string;
  level?: number;
  experience?: number;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  age?: number;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверка токена в localStorage
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
          // Здесь должен быть запрос к API для проверки токена
          // Пока используем мок-данные
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
  setIsLoading(true);
  try {
      // Здесь должен быть запрос к API
      // Мок-логин для демо
      if (email === 'demo@example.com' && password === 'demo123') {
      const mockUser = {
          id: '1',
          username: 'PlayerOne',
          email: email,
          level: 42,
          experience: 8750,
      };
    
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      notifications.show({
          title: 'Успешно!',
          message: 'Вы вошли в систему',
          color: 'green',
      });
      } else {
      throw new Error('Неверный email или пароль');
      }
    } catch (error) {
        notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось войти',
        color: 'red',
        });
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // Здесь должен быть запрос к API
      // Мок-регистрация для демо
      if (data.email && data.password && data.username) {
        const mockUser = {
          id: Date.now().toString(),
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          level: 1,
          experience: 0,
        };
        
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        notifications.show({
          title: 'Добро пожаловать!',
          message: 'Регистрация прошла успешно',
          color: 'green',
        });
      } else {
        throw new Error('Заполните все поля');
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
        color: 'red',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    notifications.show({
      title: 'До свидания!',
      message: 'Вы вышли из системы',
      color: 'blue',
    });
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };
};