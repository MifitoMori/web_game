import { useCallback } from 'react';
import { logger } from '../utils/logger';

export const useLogger = (context: string) => {
  const debug = useCallback(
    (message: string, data?: unknown) => {
      logger.debug(message, context, data);
    },
    [context],
  );

  const info = useCallback(
    (message: string, data?: unknown) => {
      logger.info(message, context, data);
    },
    [context],
  );

  const warn = useCallback(
    (message: string, data?: unknown) => {
      logger.warn(message, context, data);
    },
    [context],
  );

  const error = useCallback(
    (message: string, err?: Error | unknown) => {
      logger.error(message, err, context);
    },
    [context],
  );

  return { debug, info, warn, error };
};

export default useLogger;