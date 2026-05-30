import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  AUTH_USER_UPDATED_EVENT,
  apiFetch,
  clearAuthTokens,
  getApiUrl,
  type AuthUserUpdatedDetail,
} from '@services/api';

type BackendProfile = {
  id: number;
  totalGames: number;
  wins: number;
  losses: number;
  rating: number;
  credits: number;
  gems: number;
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
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  updatedAt: string;
  profile?: BackendProfile;
};

type AuthResponse = {
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
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
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
  role: user.role
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
    
  }

  return response.statusText || 'Request failed';
};

const saveSession = (authData: AuthResponse) => {
  const normalizedUser = mapUser(authData.user);

  clearAuthTokens();

  return normalizedUser;
};

const clearSession = () => {
  clearAuthTokens();
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiFetch(getApiUrl('/api/me'), {
          skipAuthRevokedEvent: true,
        });

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response));
        }

        const backendUser = (await response.json()) as BackendUser;
        const normalizedUser = mapUser(backendUser);

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

  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const { user: nextUser } = (event as CustomEvent<AuthUserUpdatedDetail>).detail;
      setUser(nextUser as User | null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);

    return () => window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
  }, []);

  const login = async (loginValue: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        credentials: 'include',
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
        credentials: 'include',
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
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
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
