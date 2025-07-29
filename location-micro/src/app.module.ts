import { Module } from '@nestjs/common';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [LocationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
