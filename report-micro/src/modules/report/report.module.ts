import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ExportLog } from 'src/models/export-logs.model';
import { ClientModule } from 'src/client/client.module';
import { MediaHandlerService } from './services/media-handler.service';
import { ExportService } from './services/export.service';
import { LocationTrackingService } from './services/location-tracking.service';
import { ReportAggregationService } from './services/report-aggregation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExportLog]), ClientModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    MediaHandlerService,
    ExportService,
    LocationTrackingService,
    ReportAggregationService
  ],
  exports: [ReportService],
})
export class ReportModule {}