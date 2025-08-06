import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportLog } from 'src/models/export-logs.model';
import { NatsClientService } from 'src/common/services/nats-client.service';
import { NATSClient } from 'src/client/clients';
import { ClientsModule } from '@nestjs/microservices';
import { ReportModule } from '../report/report.module';
@Module({
    imports: [
    TypeOrmModule.forFeature([ExportLog]),
    ClientsModule.registerAsync([NATSClient]),
    ReportModule,
  ],
  controllers: [ExportController],
  providers: [ExportService, NatsClientService],
  exports: [ClientsModule], 
})
export class ExportModule {}