import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { GPSLog } from 'src/models/gps-log.model';
import { CheckInOut } from 'src/models/check-in-out.model';
import { GPSExport } from 'src/models/gps-export.model';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GPSLog, CheckInOut, GPSExport]),
    ClientModule,
  ],
  providers: [GpsService],
  controllers: [GpsController],
  exports: [GpsService],
})
export class GpsModule {}
