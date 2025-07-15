import { EnvSchema } from 'src/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { RpcExceptionFilter } from 'src/common/filters/rpc-exception.filter';
import { ResponseWrapperInterceptor } from 'src/common/interceptors/response-wrapper.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvSchema>);
  const name = configService.get<string>('APP_NAME');
  const port = configService.get<number>('APP_PORT');
  const apiPrefix = configService.get<string>('API_PREFIX');

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API documentation for the Trip Sync Gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`api-document`, app, document);

  app.setGlobalPrefix(apiPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseWrapperInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        throw new BadRequestException({
          message: 'Validation failed',
          details: errors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
            value: err.value,
          })),
        });
      },
    }),
  );

  app.useGlobalFilters(new RpcExceptionFilter());

  const logger = new Logger(name);
  await app.listen(port, () => {
    logger.log(`NestJS app: ${name}`);
    logger.log(`Server is running on port ${port}`);
  });
}
bootstrap();
