import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { LoggerService } from '../logger/logger.service';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(private logger: LoggerService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url, ip } = request;
      const userAgent = request.get('user-agent') || '';
      const startTime = Date.now();
  
      this.logger.http(
        `→ ${method} ${url} - ${ip} - ${userAgent}`,
        'Request',
      );
  
      return next.handle().pipe(
        tap({
          next: (data) => {
            const duration = Date.now() - startTime;
            this.logger.http(
              `← ${method} ${url} - ${duration}ms`,
              'Response',
            );
          },
          error: (error) => {
            const duration = Date.now() - startTime;
            this.logger.error(
              `✗ ${method} ${url} - ${duration}ms - ${error.message}`,
              error.stack,
              'HTTP',
            );
          },
        }),
      );
    }
  }