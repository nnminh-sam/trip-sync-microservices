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
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ResponseWrapperInterceptor } from 'src/common/interceptors/response-wrapper.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `[${timestamp}] ${level}: ${message}`;
            }),
          ),
        }),

        // File rotation transport
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: winston.format.json(),
        }),

        // Separate error logs
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: winston.format.json(),
        }),
      ],
    }),
  });
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
      whitelist: false,
      forbidNonWhitelisted: false,
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

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new RpcExceptionFilter());

  // Enable CORS for all origins
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  const logger = new Logger(name);
  await app.listen(port, () => {
    logger.log(`NestJS app: ${name}`);
    logger.log(`Server is running on port ${port}`);
  });
}
bootstrap();
