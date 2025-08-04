import { Module } from '@nestjs/common';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';

@Module({
  providers: [GpsService],
  controllers: [GpsController]
})
export class GpsModule {}
