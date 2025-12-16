import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsLog } from 'src/models/gps-log.model';
import { GpsLogService } from 'src/modules/gps-log/gps-log.service';
import { GpsLogController } from './gps-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GpsLog])],
  controllers: [GpsLogController],
  providers: [GpsLogService],
  exports: [GpsLogService],
})
export class GpsLogModule {}
