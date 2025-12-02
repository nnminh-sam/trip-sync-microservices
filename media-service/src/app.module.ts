import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { validationSchema, configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { MediaModule } from './modules/media/media.module';
import { AuthModule } from './auth/auth.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
