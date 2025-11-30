import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ClientsProviderAsyncOptions } from '@nestjs/microservices';

export const NATSClient: ClientsProviderAsyncOptions = {
  name: 'NATS_SERVICE',
  useFactory: (configService: ConfigService) => ({
    transport: Transport.NATS,
    options: {
      servers: [configService.get<string>('NATS_SERVER')],
      timeout: 30000, // 30 second timeout per RPC call
      maxPayload: 50 * 1024 * 1024, // 50MB max payload
    },
  }),
  inject: [ConfigService],
};
