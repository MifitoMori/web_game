const DEFAULT_ALLOWED_ORIGINS =
  'http://localhost:3000,http://localhost:5173,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:8080';

type CorsCallback = (error: Error | null, allow?: boolean) => void;

export const getAllowedOrigins = () =>
  (process.env.CORS_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isPrivateIpv4 = (host: string) =>
  host.startsWith('10.') ||
  host.startsWith('192.168.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

export const isDevLanOrigin = (origin: string) => {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DEV_ALLOW_LAN_ORIGINS === 'false'
  ) {
    return false;
  }

  try {
    const url = new URL(origin);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    return isPrivateIpv4(url.hostname);
  } catch {
    return false;
  }
};

export const createCorsOriginDelegate = () => {
  const allowedOrigins = getAllowedOrigins();

  return (origin: string | undefined, callback: CorsCallback) => {
    if (!origin || allowedOrigins.includes(origin) || isDevLanOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin ${origin} is not allowed`));
  };
};
