import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

const { combine, timestamp, printf, colorize, json } = format;

// Формат для консоли (цветной и читаемый)
const consoleFormat = printf(({ level, message, timestamp, context, ...meta }) => {
  const contextStr = context ? ` [${context}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}${contextStr}: ${message}${metaStr}`;
});

// Ротация файлов для ошибок
const errorRotateTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp(), json()),
});

// Ротация файлов для всех логов
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join('logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp(), json()),
});

// Ротация файлов для HTTP запросов
const httpRotateTransport = new DailyRotateFile({
  filename: path.join('logs', 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp(), json()),
});

export const winstonLogger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        consoleFormat,
      ),
    }),
    errorRotateTransport,
    combinedRotateTransport,
    httpRotateTransport,
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join('logs', 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join('logs', 'rejections.log') }),
  ],
});