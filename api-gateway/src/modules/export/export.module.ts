import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { NatsClientService } from 'src/common/services/nats-client.service';
import { NATSClient } from 'src/client/clients';
import { ClientsModule } from '@nestjs/microservices';

@Module({
   imports: [
    ClientsModule.registerAsync([NATSClient]),
  ],
  controllers: [ExportController],
  providers: [ExportService, NatsClientService],
})
export class ExportModule {}