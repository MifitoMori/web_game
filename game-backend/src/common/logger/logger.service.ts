import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { winstonLogger } from './winston.logger';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  constructor() {
    // Убираем параметр из конструктора
    this.context = 'Application';
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    winstonLogger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    winstonLogger.error(message, { trace, context: context || this.context });
  }

  warn(message: string, context?: string) {
    winstonLogger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    winstonLogger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    winstonLogger.verbose(message, { context: context || this.context });
  }

  http(message: string, context?: string) {
    winstonLogger.http(message, { context: context || this.context });
  }

  // Метод для создания дочернего логгера с контекстом
  child(context: string): LoggerService {
    const childLogger = new LoggerService();
    childLogger.setContext(context);
    return childLogger;
  }
}