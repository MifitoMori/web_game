export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  stack?: string;
  url?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableServerLogging: boolean;
  serverEndpoint?: string;
  maxBatchSize: number;
  flushInterval: number;
}