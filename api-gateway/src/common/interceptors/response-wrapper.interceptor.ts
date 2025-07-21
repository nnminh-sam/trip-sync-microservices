import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/dtos/api-response.dto';

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl: path } = request;
    const timestamp = new Date().toISOString();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((response) => {
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'pagination' in response
        ) {
          const { data, pagination, ...metadata } = response;
          return {
            timestamp,
            method,
            path,
            statusCode,
            data,
            pagination,
            metadata: Object.keys(metadata).length ? metadata : undefined,
          } as ApiResponseDto;
        }

        return {
          data: response,
          path,
          method,
          timestamp,
        } as ApiResponseDto;
      }),
    );
  }
}
