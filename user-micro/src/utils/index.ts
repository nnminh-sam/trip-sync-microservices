import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
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

export function formatDate(dataString: string) {
  const date = new Date(dataString);
  return new Date(date.toISOString().split('T')[0]);
}

export class NatsClientSender<TPatterns extends Record<string, string>> {
  constructor(
    private readonly _client: ClientProxy,
    private readonly patterns: TPatterns,
  ) {}

  async send<K extends keyof TPatterns, T>({
    messagePattern,
    payload,
  }: {
    messagePattern: K;
    payload: MessagePayloadDto<T>;
  }): Promise<any> {
    const patternValue = this.patterns[messagePattern];
    return await firstValueFrom(
      this._client.send(patternValue, payload).pipe(
        timeout(10000),
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );
  }
}
