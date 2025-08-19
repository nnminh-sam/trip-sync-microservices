import { Module } from '@nestjs/common';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}