import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportLog } from 'src/models/export-logs.model';

@Module({
  imports: [TypeOrmModule.forFeature([ExportLog])],
  controllers: [ExportController],
  providers: [ExportService]
})
export class ExportModule {}