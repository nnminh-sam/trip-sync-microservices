import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from 'src/models/trip.model';
import { TripLocation } from 'src/models/trip-location.model';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { LocationModule } from 'src/modules/location/location.module';
import { TaskModule } from '../task/task.module';
import { ClientModule } from 'src/client/client.module';
import { TripProgress } from 'src/models/trip-progress.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripLocation, TripProgress]),
    LocationModule,
    TaskModule,
    ClientModule,
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
