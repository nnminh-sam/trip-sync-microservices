import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();

    const error: any = exception.getError();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Unknown Server Error';
    let details: object = null;

    if (error?.statusCode) {
      statusCode = error.statusCode;
    }
    if (error?.message) {
      message = error.message;
    }
    if (error?.details) {
      details = error.details;
    }

    const path: string = request.path;
    const timestamp = new Date().toISOString();

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
