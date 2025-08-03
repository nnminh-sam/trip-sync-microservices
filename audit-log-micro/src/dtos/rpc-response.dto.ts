import { HttpStatus } from '@nestjs/common';

export class RpcExceptionDto {
  status?: 'success' | 'error' = 'error';
  statusCode: HttpStatus;
  message: string;
  details?: object | string;
}
