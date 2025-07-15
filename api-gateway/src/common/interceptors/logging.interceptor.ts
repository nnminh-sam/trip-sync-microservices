import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { ip?: string }>();

    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const { method, originalUrl: url, params, body } = request as any;

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `IP: ${ip} | Agent: ${userAgent} | ${method} ${url} | Params: ${JSON.stringify(
            params,
          )} | Body: ${JSON.stringify(body)} | ResponseTime: ${responseTime}ms`,
        );
      }),
      catchError((err) => {
        const responseTime = Date.now() - now;
        this.logger.error(
          `IP: ${ip} | Agent: ${userAgent} | ${method} ${url} | Params: ${JSON.stringify(
            params,
          )} | Body: ${JSON.stringify(body)} | ResponseTime: ${responseTime}ms | ERROR: ${err?.message || err}`,
        );
        return throwError(() => err);
      }),
    );
  }
}
