import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TripModule } from './modules/trip/trip.module';
import { validationSchema } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ClientModule,
    TripModule,
  ],
})
export class AppModule {}
