import {
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';

export class NatsClientSender<TPatterns extends Record<string, string>> {
  private readonly logger: Logger = new Logger('NATS Client Sender');
  constructor(
    private readonly _client: ClientProxy,
    private readonly patterns: TPatterns,
  ) {}

  async send<T>({
    messagePattern,
    payload,
  }: {
    messagePattern: keyof TPatterns;
    payload: MessagePayloadDto<T>;
  }): Promise<any> {
    const patternValue = this.patterns[messagePattern];
    return await firstValueFrom(
      this._client.send(patternValue, payload).pipe(
        timeout(5000),
        catchError((error) => {
          this.logger.error(
            `Error occurred while sending message with pattern ${patternValue}: ${error.message}`,
          );
          this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
          this.logger.debug(`Error object: ${JSON.stringify(error)}`);
          throw new RpcException(error);
        }),
      ),
    );
  }
}
interface CatchOptions {
  rpcMessage?: string; // Custom message when RPC fails
  defaultMessage?: string; // Custom message for unexpected errors
  rethrow?: boolean; // If true, let the error bubble up
}

export function CatchErrors(options: CatchOptions = {}) {
  const logger = new Logger('CatchErrorsDecorator');

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        if (error instanceof RpcException) {
          logger.error(`RPC Exception in ${propertyKey}: ${error.message}`);
          if (options.rethrow) throw error;
          throw new InternalServerErrorException(
            options.rpcMessage || 'User service unavailable',
          );
        }

        logger.error(`Unexpected error in ${propertyKey}:`, error);

        if (options.rethrow) throw error;

        throw new BadRequestException(
          options.defaultMessage || error.message || 'Operation failed',
        );
      }
    };

    return descriptor;
  };
}
