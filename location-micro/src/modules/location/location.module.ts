import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location } from 'src/models/location.model';
import { LocationRepository } from 'src/modules/location/location.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: 600, // 10 minutes default
      }),
    }),
  ],
  providers: [LocationService, LocationRepository],
  controllers: [LocationController],
  exports: [LocationService, LocationRepository],
})
export class LocationModule {}
