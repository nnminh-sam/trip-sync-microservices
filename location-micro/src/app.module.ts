// src/app.module.ts
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from './client/client.module';
import { DatabaseModule } from './database/database.module';
import { LocationModule } from './modules/location/location.module';
import { LocationService } from './modules/location/location.service';
import { validationSchema } from 'src/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    LocationModule,
  ],
})
export class AppModule {}
