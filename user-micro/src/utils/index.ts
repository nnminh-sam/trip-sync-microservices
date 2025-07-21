import { RpcException } from '@nestjs/microservices';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { RpcExceptionDto } from 'src/dtos/rpc-response.dto';

export function throwRpcException(payload: RpcExceptionDto) {
  throw new RpcException(payload);
}

export function paginateAndOrder(filter: BaseRequestFilterDto) {
  const { page, size, order, sortBy } = filter;

  const skip: number = (page - 1) * size;
  return {
    skip,
    take: size,
    order: {
      [sortBy]: order.toLowerCase() === 'asc' ? 1 : -1,
    },
  };
}
