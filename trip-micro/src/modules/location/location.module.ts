import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
