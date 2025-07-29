import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  providers: [LocationService],
  controllers: [LocationController],
})
export class LocationModule {}
