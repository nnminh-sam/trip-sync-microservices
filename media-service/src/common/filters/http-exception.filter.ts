import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Catches all HTTP exceptions and returns a consistent error response format.
 * Handles authorization errors, validation errors, and other HTTP exceptions.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message || 'Internal Server Error'
        : exceptionResponse;

    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // Log errors based on status code
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, {
        statusCode: status,
        message,
        error: exception,
      });
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${status}`, {
        message,
      });
    }

    response.status(status).json(errorResponse);
  }
}
