import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TripClient } from './trip.client';
import { TaskClient } from './task.client';

@Module({
  imports: [ClientsModule.registerAsync([NATSClient])],
  providers: [TripClient, TaskClient],
  exports: [ClientsModule, TripClient, TaskClient],
})
export class ClientModule {}
