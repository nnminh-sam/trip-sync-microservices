import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { LocationClient } from './location.client';

@Module({
  imports: [ClientsModule.registerAsync([NATSClient])],
  providers: [LocationClient],
  exports: [ClientsModule, LocationClient],
})
export class ClientModule {}
