import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS if needed
  app.enableCors();

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Media Service API')
    .setDescription(
      'Media Service for Trip Sync - Handles file uploads and GPG signature verification',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('media', 'Media file operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

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
  console.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
