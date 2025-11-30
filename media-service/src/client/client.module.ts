import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { NATSClient } from './clients';

@Module({
  imports: [ClientsModule.registerAsync([NATSClient])],
  exports: [ClientsModule],
})
export class ClientModule {}
