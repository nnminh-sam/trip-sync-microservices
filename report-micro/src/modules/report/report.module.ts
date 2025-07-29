import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ExportLog } from 'src/models/export-logs.model';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExportLog]), ClientModule],
  controllers: [ReportController],
  providers: [ReportService]
})
export class ReportModule {}