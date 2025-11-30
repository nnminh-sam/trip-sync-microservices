import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validationSchema, configuration } from './config/configuration';
import { ClientModule } from './client/client.module';
import { DatabaseModule } from './database/database.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
    }),
    ClientModule,
    DatabaseModule,
    MediaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
