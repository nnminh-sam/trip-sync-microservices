import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Create the application with CORS enabled for WebSocket
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*', // Configure this based on your frontend URLs in production
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  
  const configService = app.get(ConfigService<EnvSchema>);
  const natsServer = configService.get<string>('NATS_SERVER');

  // Connect NATS microservice
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsServer],
    },
  });
  
  // Start all microservices
  await app.startAllMicroservices();
  
  // Start the HTTP server with WebSocket support on port 3003
  const port = configService.get<number>('PORT') || 3003;
  await app.listen(port);
  
  logger.log(`Notification microservice is running on port ${port}`);
  logger.log(`WebSocket server is available at ws://localhost:${port}/notifications`);
}
bootstrap();
