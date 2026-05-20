export const API_ACCESS_REVOKED_EVENT = 'api-access-revoked';
export const AUTH_USER_UPDATED_EVENT = 'auth-user-updated';

export type ApiAccessRevokedDetail = {
  status: 401 | 403;
};

export type AuthUserUpdatedDetail = {
  user: unknown | null;
};

type BackendUser = {
  id: number;
  login: string;
  email: string;
  firstName: string;
  secondName: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  profile?: {
    level: number;
    experience: number;
    credits: number;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const mapUser = (user: BackendUser) => ({
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
  role: user.role,
});

export const notifyAuthUserUpdated = (user: ReturnType<typeof mapUser> | null) => {
  window.dispatchEvent(
    new CustomEvent<AuthUserUpdatedDetail>(AUTH_USER_UPDATED_EVENT, {
      detail: { user },
    }),
  );
};

export const refreshCurrentUser = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  const response = await fetch(getApiUrl('/api/me'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const backendUser = (await response.json()) as BackendUser;
  const normalizedUser = mapUser(backendUser);

  localStorage.setItem('user', JSON.stringify(normalizedUser));
  notifyAuthUserUpdated(normalizedUser);

  return normalizedUser;
};

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(
      new CustomEvent<ApiAccessRevokedDetail>(API_ACCESS_REVOKED_EVENT, {
        detail: { status: response.status },
      }),
    );
  }

  return response;
};
