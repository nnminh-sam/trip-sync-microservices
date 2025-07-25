import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from 'src/models/trip.model';
import { TripLocation } from 'src/models/trip-location.model';
import { TripApproval } from 'src/models/trip-approval.model';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripLocation, TripApproval]),
    ClientModule,
  ],
  controllers: [TripController],
  providers: [TripService],
})
export class TripModule {}
