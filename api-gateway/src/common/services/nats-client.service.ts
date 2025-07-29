// src/common/services/nats-client.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NatsClientService {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  async send<T = any>(pattern: string, data: any): Promise<T> {
    return await firstValueFrom(this.client.send<T>(pattern, data));
  }

  emit<T = any>(pattern: string, data: any): void {
    this.client.emit<T>(pattern, data).subscribe();
  }
}
