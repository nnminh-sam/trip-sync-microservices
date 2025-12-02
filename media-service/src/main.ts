import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Connect NATS microservice
  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [configService.get<string>('NATS_SERVER')],
    },
  });

  // Start both HTTP and NATS listeners
  await app.startAllMicroservices();

  const port = configService.get<number>('APP_PORT', 3002);
  await app.listen(port);

  console.log(`Media Service running on port ${port}`);
  console.log(`NATS Server: ${configService.get('NATS_SERVER')}`);
}

bootstrap();
