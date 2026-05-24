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

type AuthResponse = {
  user?: BackendUser;
};

type ApiFetchInit = RequestInit & {
  skipAuthRefresh?: boolean;
  skipAuthRevokedEvent?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

let refreshSessionPromise: Promise<boolean> | null = null;

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const getRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const isAuthRefreshRequest = (input: RequestInfo | URL) => {
  const url = getRequestUrl(input);

  try {
    return new URL(url, window.location.origin).pathname.endsWith(
      '/api/auth/refresh',
    );
  } catch {
    return url.includes('/api/auth/refresh');
  }
};

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

const saveAuthResponse = (authData: AuthResponse) => {
  clearAuthTokens();

  if (authData.user) {
    const normalizedUser = mapUser(authData.user);
    notifyAuthUserUpdated(normalizedUser);
  }
};

const refreshAuthSession = async () => {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      try {
        const response = await fetch(getApiUrl('/api/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          return false;
        }

        const authData = (await response.json()) as AuthResponse;
        saveAuthResponse(authData);

        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
};

export const refreshCurrentUser = async () => {
  const response = await apiFetch(getApiUrl('/api/me'));

  if (!response.ok) {
    return null;
  }

  const backendUser = (await response.json()) as BackendUser;
  const normalizedUser = mapUser(backendUser);

  notifyAuthUserUpdated(normalizedUser);

  return normalizedUser;
};

const dispatchAuthRevoked = (status: 401 | 403) => {
  window.dispatchEvent(
    new CustomEvent<ApiAccessRevokedDetail>(API_ACCESS_REVOKED_EVENT, {
      detail: { status },
    }),
  );
};

export const apiFetch = async (input: RequestInfo | URL, init?: ApiFetchInit) => {
  const {
    skipAuthRefresh = false,
    skipAuthRevokedEvent = false,
    ...fetchInit
  } = init ?? {};

  const response = await fetch(input, {
    ...fetchInit,
    credentials: fetchInit.credentials ?? 'include',
    headers: fetchInit.headers,
  });

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    !isAuthRefreshRequest(input)
  ) {
    const isSessionRefreshed = await refreshAuthSession();

    if (isSessionRefreshed) {
      return fetch(input, {
        ...fetchInit,
        credentials: fetchInit.credentials ?? 'include',
        headers: fetchInit.headers,
      });
    }
  }

  if (
    (response.status === 401 || response.status === 403) &&
    !skipAuthRevokedEvent
  ) {
    dispatchAuthRevoked(response.status);
  }

  return response;
};
