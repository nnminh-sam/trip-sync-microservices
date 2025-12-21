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
import { FirebaseModule } from 'src/modules/firebase/firebase.module';
import { Cancelation } from 'src/models/cancelation.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripLocation, TripProgress, Cancelation]),
    LocationModule,
    TaskModule,
    ClientModule,
    FirebaseModule,
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
