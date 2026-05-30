import type { LogEntry, LogLevel } from './types';

class ServerTransport {
  private queue: LogEntry[] = [];
  private timer: number | null = null;
  private isSending = false;

  constructor(
    private endpoint: string,
    private minLevel: LogLevel,
    private maxBatchSize: number = 10,
    private flushInterval: number = 5000,
  ) {
    this.startFlushTimer();
  }

  private shouldSend(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  send(entry: LogEntry): void {
    if (!this.shouldSend(entry.level)) {
      return;
    }

    this.queue.push(entry);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.isSending || this.queue.length === 0) {
      return;
    }

    this.isSending = true;
    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: batch }),
        keepalive: true, // Отправка даже при закрытии страницы
      });
    } catch (error) {
      // Возвращаем в очередь при ошибке
      this.queue = [...batch, ...this.queue];
      console.error('Failed to send logs to server', error);
    } finally {
      this.isSending = false;
    }
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Отправляем оставшиеся логи при уничтожении
    this.flush();
  }
}

export default ServerTransport;