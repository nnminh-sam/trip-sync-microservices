import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EnvSchema } from 'src/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvSchema>);
  const natsServer = configService.get<string>('NATS_SERVER');

  // Enable CORS for HTTP server
  app.enableCors();

  // Global validation pipe for HTTP endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Setup Swagger for HTTP endpoints
  const config = new DocumentBuilder()
    .setTitle('Trip Service API')
    .setDescription('Unified Trip, Location, and Task Service API')
    .setVersion('1.0')
    .addTag('Trips')
    .addTag('Locations')
    .addTag('Tasks')
    .addTag('File Upload')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Connect NATS microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsServer],
      maxPayload: 50 * 1024 * 1024, // 50MB max payload
    },
  });

  // Start both HTTP server and microservice
  await app.startAllMicroservices();

  // Start HTTP server
  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);

  console.log(`Trip microservice is listening on NATS: ${natsServer}`);
  console.log(`Trip HTTP server is running on port ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`,
  );
}
bootstrap();
