import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

interface PaginationMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

interface ResponseWrapper<T = any> {
  data: T;
  path: string;
  method: string;
  timestamp: string;
  metadata?: Record<string, any>;
  pagination?: PaginationMeta;
}

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl: path } = request;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((response) => {
        // If response has both data and pagination, treat as paginated
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'pagination' in response
        ) {
          const { data, pagination, ...metadata } = response;
          return {
            data,
            path,
            method,
            timestamp,
            metadata: Object.keys(metadata).length ? metadata : undefined,
            pagination,
          } as ResponseWrapper;
        }
        // Non-paginated response
        return {
          data: response,
          path,
          method,
          timestamp,
        } as ResponseWrapper;
      }),
    );
  }
}
