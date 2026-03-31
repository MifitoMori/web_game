import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';

type BackendProfile = {
  id: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  maxStreak: number;
  rating: number;
  credits: number;
  experience: number;
  level: number;
};

type BackendUser = {
  id: number;
  login: string;
  email: string;
  firstName: string;
  secondName: string;
  gender: string;
  birthDate: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  profile?: BackendProfile;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
};

interface User {
  id: number;
  login: string;
  email: string;
  firstName?: string;
  secondName?: string;
  username?: string;
  lastName?: string;
  avatar?: string | null;
  level?: number;
  experience?: number;
  credits?: number;
  rank?: string;
  profile?: BackendProfile;
}

interface RegisterData {
  login: string;
  email: string;
  password: string;
  firstName: string;
  secondName: string;
  gender: 'male' | 'female';
  birthDate: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginValue: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const mapUser = (user: BackendUser): User => ({
  id: user.id,
  login: user.login,
  username: user.login,
  email: user.email,
  firstName: user.firstName,
  secondName: user.secondName,
  lastName: user.secondName,
  avatar: user.avatarUrl,
  level: user.profile?.level,
  experience: user.profile?.experience,
  credits: user.profile?.credits,
  profile: user.profile,
});

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text below.
  }

  return response.statusText || 'Request failed';
};

const saveSession = (authData: AuthResponse) => {
  const normalizedUser = mapUser(authData.user);

  localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

  return normalizedUser;
};

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(getApiUrl('/api/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        const backendUser = (await response.json()) as BackendUser;
        const normalizedUser = mapUser(backendUser);

        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } catch (error) {
        console.error('Auth error:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = async (loginValue: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: loginValue,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const authData = (await response.json()) as AuthResponse;
      const normalizedUser = saveSession(authData);

      setUser(normalizedUser);

      notifications.show({
        title: 'Успешно!',
        message: 'Вы вошли в систему',
        color: 'green',
      });
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
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      const authData = (await response.json()) as AuthResponse;
      const normalizedUser = saveSession(authData);

      setUser(normalizedUser);

      notifications.show({
        title: 'Добро пожаловать!',
        message: 'Регистрация прошла успешно',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
        color: 'red',
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSession();
      setUser(null);

      notifications.show({
        title: 'До свидания!',
        message: 'Вы вышли из системы',
        color: 'blue',
      });
    }
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
