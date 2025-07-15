import { RpcException } from '@nestjs/microservices';
import { RpcExceptionDto } from 'src/dtos/rpc-response.dto';

export function throwRpcException(payload: RpcExceptionDto) {
  throw new RpcException(payload);
}
