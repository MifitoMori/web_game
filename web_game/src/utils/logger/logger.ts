import type { LogEntry, LogLevel, LoggerConfig } from './types';
import ServerTransport from './serverTransport';

class Logger {
  private config: LoggerConfig;
  private serverTransport: ServerTransport | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? 'debug' : 'info',
      enableConsole: true,
      enableServerLogging: import.meta.env.PROD,
      serverEndpoint: '/api/logs/client',
      maxBatchSize: 10,
      flushInterval: 5000,
      ...config,
    };

    if (this.config.enableServerLogging && this.config.serverEndpoint) {
      this.serverTransport = new ServerTransport(
        this.config.serverEndpoint,
        this.config.level,
        this.config.maxBatchSize,
        this.config.flushInterval,
      );
    }

    // Перехват глобальных ошибок
    this.setupGlobalErrorHandlers();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    error?: Error,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data: data instanceof Error ? { message: data.message, stack: data.stack } : data,
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const context = entry.context ? ` [${entry.context}]` : '';

    switch (entry.level) {
      case 'debug':
        console.debug(prefix + context, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(prefix + context, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix + context, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix + context, entry.message, entry.data || '', entry.stack || '');
        break;
    }
  }

  private logToServer(entry: LogEntry): void {
    if (this.serverTransport && entry.level !== 'debug') {
      this.serverTransport.send(entry);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Перехват необработанных ошибок
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
      });
    });

    // Перехват rejected промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  // Публичные методы
  debug(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.formatMessage('debug', message, context, data);
    this.logToConsole(entry);
  }

  info(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    const entry = this.formatMessage('info', message, context, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  warn(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.formatMessage('warn', message, context, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  error(message: string, error?: Error | unknown, context?: string): void {
    if (!this.shouldLog('error')) return;

    let errorObj: Error | undefined;
    let data: unknown;

    if (error instanceof Error) {
      errorObj = error;
      data = { message: error.message, stack: error.stack };
    } else {
      data = error;
    }

    const entry = this.formatMessage('error', message, context, data, errorObj);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  // Создание логгера для конкретного контекста
  child(context: string): LoggerChild {
    return new LoggerChild(this, context);
  }

  // Принудительная отправка логов на сервер
  flush(): void {
    this.serverTransport?.destroy();
  }
}

// Дочерний логгер для контекстов
class LoggerChild {
  constructor(private parent: Logger, private context: string) {}

  debug(message: string, data?: unknown): void {
    this.parent.debug(message, this.context, data);
  }

  info(message: string, data?: unknown): void {
    this.parent.info(message, this.context, data);
  }

  warn(message: string, data?: unknown): void {
    this.parent.warn(message, this.context, data);
  }

  error(message: string, error?: Error | unknown): void {
    this.parent.error(message, error, this.context);
  }
}

// Создаём единственный экземпляр логгера
export const logger = new Logger();

// Для использования в тестах
export const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);