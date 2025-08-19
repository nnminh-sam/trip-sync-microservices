import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsProviderAsyncOptions, Transport } from '@nestjs/microservices';
import { EnvSchema } from 'src/config';

export const NATSClient: ClientsProviderAsyncOptions = {
  name: 'NATS_SERVICE',
  useFactory: (configService: ConfigService<EnvSchema>) => {
    const logger: Logger = new Logger('NATSClient');
    const natsServer = configService.get('NATS_SERVER');
    logger.log(`Connecting to NATS server at: ${natsServer}`);
    return {
      transport: Transport.NATS,
      options: {
        servers: [natsServer],
        timeout: 30000, // 30 seconds timeout
        maxPayload: 50 * 1024 * 1024, // 50MB max payload
      },
    };
  },
  inject: [ConfigService],
};
