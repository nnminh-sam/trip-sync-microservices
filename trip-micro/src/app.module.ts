import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TripModule } from './modules/trip/trip.module';
import { validationSchema } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ClientModule } from './client/client.module';
import { LocationModule } from './modules/location/location.module';
import { TaskModule } from './modules/task/task.module';
import gcsConfig from './config/gcs.config';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [gcsConfig],
    }),
    ClientModule,
    TripModule,
    LocationModule,
    TaskModule,
  ],
})
export class AppModule {}
