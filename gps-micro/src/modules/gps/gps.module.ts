import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { GPSLogRepository } from './gps-log.repository';
import { GPSLog } from '../../models/gps.model';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GPSLog]),
    AuditLogModule,
  ],
  providers: [GpsService, GPSLogRepository],
  controllers: [GpsController],
  exports: [GpsService],
})
export class GpsModule {}
