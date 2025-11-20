import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvSchema>);
  const natsServer = configService.get<string>('NATS_SERVER');
  const port = configService.get<number>('APP_PORT') || 3000;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsServer],
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);

  console.log(`User microservice HTTP server is running at port ${port}`);
  console.log(`User microservice is listening on NATS: ${natsServer}`);
}
bootstrap();
