import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location } from 'src/models/location.model';
import { LocationRepository } from 'src/modules/location/location.repository';
import { EnvSchema } from 'src/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvSchema>) => {
        console.log(
          `Connected to Redis service at ${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
        );
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          ttl: 600,
        };
      },
    }),
  ],
  providers: [LocationService, LocationRepository],
  controllers: [LocationController],
  exports: [LocationService, LocationRepository],
})
export class LocationModule {}
