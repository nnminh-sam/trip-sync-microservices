import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';

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
        timeout(5000),
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );
  }
}
