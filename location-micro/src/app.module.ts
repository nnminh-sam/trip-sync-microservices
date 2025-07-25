// src/app.module.ts
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from './client/client.module';
import { DatabaseModule } from './database/database.module';
import { LocationModule } from './modules/location/location.module';
import { LocationService } from './modules/location/location.service';

@Module({
  imports: [
    ClientModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    LocationModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly locationService: LocationService,
  ) {}

  async onApplicationBootstrap() {
    await this.locationService.onStartUp();
  }
}
