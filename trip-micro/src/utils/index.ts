import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { RpcExceptionDto } from 'src/dtos/rpc-response.dto';

export function throwRpcException(payload: RpcExceptionDto) {
  throw new RpcException(payload);
}

export function paginateAndOrder(filter: BaseRequestFilterDto) {
  const { page = 1, size = 10, order = 'ASC', sortBy = 'id' } = filter;

  const skip: number = (page - 1) * size;
  return {
    skip,
    take: size,
    order: {
      [sortBy]: order.toLowerCase() === 'asc' ? 1 : -1,
    },
  };
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

export const PointTransformer = {
  to: (value: { x: number; y: number } | string | null) => {
    if (!value) return 'POINT(0 0)';

    // CASE 1: Value is a String "POINT(Lng Lat)"
    if (typeof value === 'string') {
      // Extract the numbers using Regex
      const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      
      if (match) {
        const x = match[1]; // Longitude
        const y = match[2]; // Latitude
        // SWAP -> Return POINT(Lat Lng)
        return `POINT(${y} ${x})`;
      }
      // If regex fails, return as is (risky) or default
      return value; 
    }

    // CASE 2: Value is an Object { x: Lng, y: Lat }
    if ('x' in value && 'y' in value) {
      // SWAP -> Return POINT(Lat Lng)
      return `POINT(${value.y} ${value.x})`; 
    }

    return 'POINT(0 0)';
  },

  from: (value: string): { x: number, y: number } | null => {
    // MySQL returns "POINT(Lat Lng)"
    if (!value) return null;
    
    const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      // match[1] is Latitude (Y)
      // match[2] is Longitude (X)
      
      // We return { x: Lng, y: Lat } to keep App consistent
      return { 
        x: parseFloat(match[2]), 
        y: parseFloat(match[1]) 
      };
    }
    return null;
  }
};