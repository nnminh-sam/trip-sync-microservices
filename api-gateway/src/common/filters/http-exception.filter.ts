import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const path: string = request.path;
    const timestamp = new Date().toISOString();

    let message: string;
    let details: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || exception.message;
      details = (exceptionResponse as any).details || null;
    } else {
      message = exception.message;
    }

    this.logger.error(
      `HTTP Exception: ${statusCode} - ${message} - Path: ${path}`,
    );

    return response.status(statusCode).json({
      timestamp,
      path,
      status: 'error',
      statusCode,
      message,
      ...(details !== null && { details }),
    });
  }
}
