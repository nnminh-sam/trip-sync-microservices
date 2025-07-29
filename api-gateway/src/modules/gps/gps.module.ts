import { Module } from '@nestjs/common';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';

@Module({
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule {}