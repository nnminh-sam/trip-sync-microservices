# Location Service Enhancement Implementation Guide

## Overview
This guide provides detailed step-by-step instructions to implement location service enhancements for GPS tracking integration in the Trip Sync application. The implementation follows a phased approach to ensure system stability while adding spatial capabilities.

## Prerequisites
- MySQL 5.7+ or MySQL 8.0+ with spatial support
- Redis server for caching
- Node.js 18+ and NestJS framework
- TypeORM with MySQL spatial support

## Implementation Steps

### Step 1: Database Setup and Migration

#### 1.1 Verify MySQL Spatial Support
```sql
-- Connect to your MySQL database
mysql -u root -p tripsync_location

-- Check MySQL version and spatial support
SELECT VERSION();

-- For MySQL 5.7+, spatial functions are built-in
-- For MySQL 8.0+, additional spatial functions are available
SHOW VARIABLES LIKE '%version%';
```

#### 1.2 Create Migration File
```bash
cd location-micro
npm run typeorm migration:create -- -n AddSpatialSupportToLocation
```

#### 1.3 Implement Migration
```typescript
// migrations/[timestamp]-AddSpatialSupportToLocation.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpatialSupportToLocation[timestamp] implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add spatial column with SRID 4326 (WGS84)
    await queryRunner.query(`
      ALTER TABLE location 
      ADD COLUMN geom POINT NOT NULL SRID 4326
    `);

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE location
      ADD COLUMN type VARCHAR(50) DEFAULT 'office',
      ADD COLUMN is_active BOOLEAN DEFAULT true,
      ADD COLUMN boundary POLYGON SRID 4326,
      ADD COLUMN metadata JSON,
      ADD COLUMN address VARCHAR(255),
      ADD COLUMN city VARCHAR(100),
      ADD COLUMN country VARCHAR(100),
      ADD COLUMN timezone VARCHAR(50)
    `);

    // Update existing records with spatial data
    await queryRunner.query(`
      UPDATE location 
      SET geom = ST_SRID(POINT(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Create spatial indexes
    await queryRunner.query(`
      CREATE SPATIAL INDEX idx_location_geom ON location(geom);
    `);

    // Create regular indexes
    await queryRunner.query(`
      CREATE INDEX idx_location_type_active ON location(type, is_active);
      CREATE INDEX idx_location_created_by_active ON location(created_by, is_active);
    `);

    // For MySQL 5.7+, create virtual column for JSON indexing
    await queryRunner.query(`
      ALTER TABLE location 
      ADD COLUMN metadata_contact_person VARCHAR(255) 
      GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.contactPerson'))) VIRTUAL;
      
      CREATE INDEX idx_location_metadata_contact ON location(metadata_contact_person);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX idx_location_metadata_contact ON location;
      DROP INDEX idx_location_created_by_active ON location;
      DROP INDEX idx_location_type_active ON location;
      DROP INDEX idx_location_geom ON location;
    `);

    // Drop virtual column
    await queryRunner.query(`
      ALTER TABLE location DROP COLUMN metadata_contact_person;
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE location
      DROP COLUMN timezone,
      DROP COLUMN country,
      DROP COLUMN city,
      DROP COLUMN address,
      DROP COLUMN metadata,
      DROP COLUMN boundary,
      DROP COLUMN is_active,
      DROP COLUMN type,
      DROP COLUMN geom
    `);
  }
}
```

### Step 2: Entity Model Updates

#### 2.1 Update Location Entity
```typescript
// location-micro/src/models/location.model.ts
import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from '../common/base.model';

export enum LocationType {
  OFFICE = 'office',
  CLIENT = 'client',
  WAREHOUSE = 'warehouse',
  FIELD = 'field',
  OTHER = 'other'
}

@Entity('location')
@Index('idx_location_geom', { spatial: true })
@Index('idx_location_type_active', ['type', 'isActive'])
@Index('idx_location_created_by_active', ['createdBy', 'isActive'])
export class Location extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'float', name: 'offset_radious', default: 100 })
  offsetRadious: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'point', 
    srid: 4326,
    nullable: true,
    transformer: {
      to: (value: { x: number; y: number }) => {
        if (value) {
          return `POINT(${value.x} ${value.y})`;
        }
        return null;
      },
      from: (value: any) => {
        if (value) {
          // MySQL returns geometry as buffer, need to parse
          return value;
        }
        return null;
      }
    }
  })
  geom: { x: number; y: number } | null;

  @Column({ 
    type: 'enum',
    enum: LocationType,
    default: LocationType.OFFICE 
  })
  type: LocationType;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ 
    type: 'polygon', 
    srid: 4326,
    nullable: true 
  })
  boundary: any;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  // Virtual column for JSON indexing (defined in migration)
  metadataContactPerson?: string;
}
```

### Step 3: Create DTOs and Types

#### 3.1 Create Type Definitions
```typescript
// location-micro/src/types/location.types.ts
export interface DistanceResult {
  locationId: string;
  locationName: string;
  distance: number;
  unit: 'meters' | 'kilometers';
  isWithinRadius: boolean;
}

export interface LocationMetadata {
  workingHours?: {
    start: string;
    end: string;
    timezone?: string;
  };
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  facilities?: string[];
  capacity?: number;
  accessInstructions?: string;
  parkingAvailable?: boolean;
  publicTransport?: string[];
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  distance: number;
  maxRadius: number;
  locationName: string;
  message?: string;
}

export interface GeoBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface LocationBoundary {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  boundary?: any; // GeoJSON polygon
  type: LocationType;
}
```

#### 3.2 Create DTOs
```typescript
// location-micro/src/dtos/validation-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  distance: number;

  @ApiProperty()
  maxRadius: number;

  @ApiProperty()
  locationName: string;

  @ApiProperty({ required: false })
  message?: string;
}

// location-micro/src/dtos/nearby-location-query.dto.ts
import { IsNumber, IsEnum, IsOptional, Min, Max, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from '../models/location.model';

export class NearbyLocationQueryDto {
  @ApiProperty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({ minimum: 1, maximum: 50000 })
  @IsNumber()
  @Min(1)
  @Max(50000)
  radiusMeters: number;

  @ApiProperty({ enum: LocationType, required: false })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;
}

// location-micro/src/dtos/location-boundary.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from '../models/location.model';

export class LocationBoundaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  center: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty()
  radius: number;

  @ApiProperty({ required: false })
  boundary?: any;

  @ApiProperty({ enum: LocationType })
  type: LocationType;
}

// location-micro/src/dtos/batch-location-query.dto.ts
import { IsArray, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchLocationQueryDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}

// location-micro/src/dtos/validate-coordinates.dto.ts
import { IsNumber, IsUUID, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCoordinatesDto {
  @ApiProperty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty()
  @IsUUID()
  locationId: string;
}

// location-micro/src/dtos/distance-query.dto.ts
import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DistanceQueryDto {
  @ApiProperty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsLongitude()
  longitude: number;
}
```

### Step 4: Service Implementation

#### 4.1 Update Location Service
```typescript
// location-micro/src/services/location.service.ts
import { Injectable, HttpStatus, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Location, LocationType } from '../models/location.model';
import { throwRpcException } from '../utils/exception.util';
import { 
  ValidationResult, 
  DistanceResult, 
  LocationBoundary,
  GeoBounds 
} from '../types/location.types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // Existing methods...

  // New spatial validation methods
  async validateCoordinatesInRadius(
    latitude: number,
    longitude: number,
    locationId: string
  ): Promise<ValidationResult> {
    const location = await this.findOne(locationId);
    
    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found'
      });
    }

    // MySQL ST_Distance_Sphere returns distance in meters
    const result = await this.locationRepository.query(`
      SELECT ST_Distance_Sphere(
        POINT(?, ?),
        POINT(?, ?)
      ) as distance
    `, [longitude, latitude, location.longitude, location.latitude]);

    const distance = result[0].distance;
    const isValid = distance <= location.offsetRadious;

    return {
      isValid,
      distance,
      maxRadius: location.offsetRadious,
      locationName: location.name,
      message: isValid 
        ? 'Coordinates are within location radius' 
        : `Coordinates are ${Math.round(distance - location.offsetRadious)}m outside location radius`
    };
  }

  async findLocationsWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType
  ): Promise<Location[]> {
    // For MySQL 5.7+, use ST_Distance_Sphere
    // For MySQL 8.0+, can also use ST_Distance with geography
    let query = `
      SELECT l.*, 
        ST_Distance_Sphere(
          l.geom,
          POINT(?, ?)
        ) as distance
      FROM location l
      WHERE ST_Distance_Sphere(
        l.geom,
        POINT(?, ?)
      ) <= ?
      AND l.is_active = true
    `;

    const params: any[] = [
      longitude, latitude,  // for SELECT distance
      longitude, latitude,  // for WHERE clause
      radiusMeters
    ];

    if (type) {
      query += ' AND l.type = ?';
      params.push(type);
    }

    query += ' ORDER BY distance';

    return this.locationRepository.query(query, params);
  }

  // Batch operations
  async findLocationsByIds(ids: string[], includeInactive = false): Promise<Location[]> {
    const where: any = { id: In(ids) };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.locationRepository.find({ where });
  }

  async getLocationBoundaries(locationIds: string[]): Promise<LocationBoundary[]> {
    const locations = await this.findLocationsByIds(locationIds);
    
    return locations.map(location => ({
      id: location.id,
      name: location.name,
      center: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      radius: location.offsetRadious,
      boundary: location.boundary,
      type: location.type
    }));
  }

  // Distance calculations
  async calculateDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<number> {
    const result = await this.locationRepository.query(`
      SELECT ST_Distance_Sphere(
        POINT(?, ?),
        POINT(?, ?)
      ) as distance
    `, [fromLng, fromLat, toLng, toLat]);
    
    return result[0].distance;
  }

  async getDistanceFromLocation(
    latitude: number,
    longitude: number,
    locationId: string
  ): Promise<DistanceResult> {
    const location = await this.findOne(locationId);
    
    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found'
      });
    }

    const distance = await this.calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    return {
      locationId,
      locationName: location.name,
      distance,
      unit: 'meters',
      isWithinRadius: distance <= location.offsetRadious
    };
  }

  // Cached operations
  async findOneCached(id: string): Promise<Location> {
    const cacheKey = `location:${id}`;
    const cached = await this.cacheManager.get<Location>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit for location ${id}`);
      return cached;
    }
    
    const location = await this.findOne(id);
    
    if (location) {
      await this.cacheManager.set(cacheKey, location, 3600); // 1 hour TTL
    }
    
    return location;
  }

  async findNearbyLocationsCached(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType
  ): Promise<Location[]> {
    const cacheKey = `nearby:${latitude}:${longitude}:${radiusMeters}:${type || 'all'}`;
    const cached = await this.cacheManager.get<Location[]>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit for nearby locations`);
      return cached;
    }
    
    const locations = await this.findLocationsWithinRadius(
      latitude,
      longitude,
      radiusMeters,
      type
    );
    
    await this.cacheManager.set(cacheKey, locations, 300); // 5 minutes TTL
    return locations;
  }

  // Override create to add spatial data
  async create(createLocationDto: any): Promise<Location> {
    const location = this.locationRepository.create(createLocationDto);
    
    // Set spatial data
    if (location.latitude && location.longitude) {
      location.geom = {
        x: location.longitude,
        y: location.latitude
      };
    }
    
    const saved = await this.locationRepository.save(location);
    
    // Clear relevant caches
    await this.clearLocationCaches();
    
    return saved;
  }

  // Override update to handle spatial data
  async update(id: string, updateLocationDto: any): Promise<Location> {
    const location = await this.findOne(id);
    
    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found'
      });
    }

    Object.assign(location, updateLocationDto);
    
    // Update spatial data if coordinates changed
    if (updateLocationDto.latitude !== undefined || updateLocationDto.longitude !== undefined) {
      location.geom = {
        x: location.longitude,
        y: location.latitude
      };
    }
    
    const updated = await this.locationRepository.save(location);
    
    // Clear caches
    await this.clearLocationCaches(id);
    
    return updated;
  }

  // Cache management
  private async clearLocationCaches(locationId?: string) {
    if (locationId) {
      await this.cacheManager.del(`location:${locationId}`);
    }
    
    // Clear all nearby caches (simple implementation)
    const keys = await this.cacheManager.store.keys();
    const nearbyKeys = keys.filter(key => key.startsWith('nearby:'));
    
    for (const key of nearbyKeys) {
      await this.cacheManager.del(key);
    }
  }

  // Advanced spatial queries
  async findLocationsInArea(
    bounds: GeoBounds,
    options: { page: number; size: number; type?: LocationType }
  ): Promise<{ data: Location[]; total: number }> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .where(`ST_Contains(
        ST_MakeEnvelope(
          POINT(:minLng, :minLat),
          POINT(:maxLng, :maxLat)
        ),
        location.geom
      )`)
      .andWhere('location.is_active = :isActive')
      .setParameters({
        minLng: bounds.minLng,
        minLat: bounds.minLat,
        maxLng: bounds.maxLng,
        maxLat: bounds.maxLat,
        isActive: true
      });

    if (options.type) {
      query.andWhere('location.type = :type', { type: options.type });
    }

    query
      .orderBy('location.name', 'ASC')
      .skip((options.page - 1) * options.size)
      .take(options.size);
    
    const [data, total] = await query.getManyAndCount();
    
    return { data, total };
  }

  // MySQL-specific optimized queries
  async findNearestLocations(
    latitude: number,
    longitude: number,
    limit: number = 10,
    maxDistance?: number
  ): Promise<Location[]> {
    let query = `
      SELECT *, 
        ST_Distance_Sphere(geom, POINT(?, ?)) as distance
      FROM location
      WHERE is_active = true
    `;

    const params: any[] = [longitude, latitude];

    if (maxDistance) {
      query += ` AND ST_Distance_Sphere(geom, POINT(?, ?)) <= ?`;
      params.push(longitude, latitude, maxDistance);
    }

    query += ` ORDER BY distance LIMIT ?`;
    params.push(limit);

    return this.locationRepository.query(query, params);
  }

  // Helper method for checking if point is within polygon boundary
  async isPointInLocationBoundary(
    latitude: number,
    longitude: number,
    locationId: string
  ): Promise<boolean> {
    const result = await this.locationRepository.query(`
      SELECT ST_Contains(
        boundary,
        POINT(?, ?)
      ) as is_within
      FROM location
      WHERE id = ?
      AND boundary IS NOT NULL
    `, [longitude, latitude, locationId]);

    return result.length > 0 && result[0].is_within === 1;
  }
}
```

### Step 5: Controller Updates

#### 5.1 Update Location Controller
```typescript
// location-micro/src/controllers/location.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationService } from '../services/location.service';
import {
  CreateLocationDto,
  UpdateLocationDto,
  FindLocationsDto,
  ValidateCoordinatesDto,
  NearbyLocationQueryDto,
  BatchLocationQueryDto,
  DistanceQueryDto,
  LocationBoundaryDto,
  ValidationResultDto
} from '../dtos';
import { DistanceResult } from '../types/location.types';

@ApiTags('locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Existing endpoints...

  // New spatial endpoints
  @Get('validate-coordinates')
  @ApiOperation({ summary: 'Validate if coordinates are within location radius' })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateCoordinates(
    @Query() query: ValidateCoordinatesDto
  ): Promise<ValidationResultDto> {
    return this.locationService.validateCoordinatesInRadius(
      query.latitude,
      query.longitude,
      query.locationId
    );
  }

  @MessagePattern('location.validateCoordinates')
  async handleValidateCoordinates(@Payload() data: ValidateCoordinatesDto) {
    return this.validateCoordinates(data);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find locations near given coordinates' })
  @ApiResponse({ status: 200, type: [Location] })
  async findNearbyLocations(
    @Query() query: NearbyLocationQueryDto
  ): Promise<Location[]> {
    return this.locationService.findNearbyLocationsCached(
      query.latitude,
      query.longitude,
      query.radiusMeters,
      query.type
    );
  }

  @MessagePattern('location.findNearby')
  async handleFindNearbyLocations(@Payload() data: NearbyLocationQueryDto) {
    return this.findNearbyLocations(data);
  }

  @Post('batch/boundaries')
  @ApiOperation({ summary: 'Get boundaries for multiple locations' })
  @ApiResponse({ status: 200, type: [LocationBoundaryDto] })
  async getLocationBoundaries(
    @Body() query: BatchLocationQueryDto
  ): Promise<LocationBoundaryDto[]> {
    return this.locationService.getLocationBoundaries(query.locationIds);
  }

  @MessagePattern('location.getBoundaries')
  async handleGetLocationBoundaries(@Payload() data: BatchLocationQueryDto) {
    return this.getLocationBoundaries(data);
  }

  @Get(':id/distance')
  @ApiOperation({ summary: 'Calculate distance from coordinates to location' })
  @ApiResponse({ status: 200, type: DistanceResult })
  async getDistanceFromLocation(
    @Param('id') id: string,
    @Query() query: DistanceQueryDto
  ): Promise<DistanceResult> {
    return this.locationService.getDistanceFromLocation(
      query.latitude,
      query.longitude,
      id
    );
  }

  @MessagePattern('location.getDistance')
  async handleGetDistanceFromLocation(@Payload() data: { locationId: string } & DistanceQueryDto) {
    return this.getDistanceFromLocation(data.locationId, data);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Find multiple locations by IDs' })
  @ApiResponse({ status: 200, type: [Location] })
  async findLocationsByIds(
    @Body() query: BatchLocationQueryDto
  ): Promise<Location[]> {
    return this.locationService.findLocationsByIds(
      query.locationIds,
      query.includeInactive
    );
  }

  @MessagePattern('location.findByIds')
  async handleFindLocationsByIds(@Payload() data: BatchLocationQueryDto) {
    return this.findLocationsByIds(data);
  }
}
```

### Step 6: Module Configuration

#### 6.1 Update Location Module
```typescript
// location-micro/src/location.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Location } from './models/location.model';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';

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
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
```

### Step 7: Testing Implementation

#### 7.1 Unit Tests for Spatial Methods
```typescript
// location-micro/src/services/__tests__/location.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LocationService } from '../location.service';
import { Location } from '../../models/location.model';

describe('LocationService - Spatial Methods', () => {
  let service: LocationService;
  let mockRepository: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockRepository = {
      query: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      store: {
        keys: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(Location),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  describe('validateCoordinatesInRadius', () => {
    it('should validate coordinates within radius', async () => {
      const mockLocation = {
        id: '123',
        name: 'Test Office',
        latitude: 10.7769,
        longitude: 106.7009,
        offsetRadious: 100,
      };

      mockRepository.findOne.mockResolvedValue(mockLocation);
      mockRepository.query.mockResolvedValue([{ distance: 50 }]);

      const result = await service.validateCoordinatesInRadius(
        10.7770,
        106.7010,
        '123'
      );

      expect(result.isValid).toBe(true);
      expect(result.distance).toBe(50);
      expect(result.locationName).toBe('Test Office');
    });

    it('should invalidate coordinates outside radius', async () => {
      const mockLocation = {
        id: '123',
        name: 'Test Office',
        latitude: 10.7769,
        longitude: 106.7009,
        offsetRadious: 100,
      };

      mockRepository.findOne.mockResolvedValue(mockLocation);
      mockRepository.query.mockResolvedValue([{ distance: 150 }]);

      const result = await service.validateCoordinatesInRadius(
        10.7780,
        106.7020,
        '123'
      );

      expect(result.isValid).toBe(false);
      expect(result.distance).toBe(150);
      expect(result.message).toContain('50m outside location radius');
    });
  });

  describe('findLocationsWithinRadius', () => {
    it('should find locations within specified radius', async () => {
      const mockLocations = [
        { id: '1', name: 'Location 1', distance: 50 },
        { id: '2', name: 'Location 2', distance: 80 },
      ];

      mockRepository.query.mockResolvedValue(mockLocations);

      const result = await service.findLocationsWithinRadius(
        10.7769,
        106.7009,
        100
      );

      expect(result).toHaveLength(2);
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        [106.7009, 10.7769, 100]
      );
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', async () => {
      mockRepository.query.mockResolvedValue([{ distance: 1000 }]);

      const result = await service.calculateDistance(
        10.7769,
        106.7009,
        10.7869,
        106.7109
      );

      expect(result).toBe(1000);
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_Distance'),
        [106.7009, 10.7769, 106.7109, 10.7869]
      );
    });
  });
});
```

#### 7.2 Integration Tests
```typescript
// location-micro/src/controllers/__tests__/location.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LocationModule } from '../../location.module';

describe('Location Controller - Spatial Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LocationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /locations/validate-coordinates', () => {
    it('should validate coordinates within location radius', () => {
      return request(app.getHttpServer())
        .get('/locations/validate-coordinates')
        .query({
          latitude: 10.7769,
          longitude: 106.7009,
          locationId: 'test-location-id'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid');
          expect(res.body).toHaveProperty('distance');
          expect(res.body).toHaveProperty('maxRadius');
          expect(res.body).toHaveProperty('locationName');
        });
    });
  });

  describe('GET /locations/nearby', () => {
    it('should find nearby locations', () => {
      return request(app.getHttpServer())
        .get('/locations/nearby')
        .query({
          latitude: 10.7769,
          longitude: 106.7009,
          radiusMeters: 1000
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /locations/batch/boundaries', () => {
    it('should get boundaries for multiple locations', () => {
      return request(app.getHttpServer())
        .post('/locations/batch/boundaries')
        .send({
          locationIds: ['id1', 'id2', 'id3']
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('center');
            expect(res.body[0]).toHaveProperty('radius');
          }
        });
    });
  });
});
```

### Step 8: API Documentation

#### 8.1 Swagger Documentation
```typescript
// Add to main.ts or swagger configuration
const config = new DocumentBuilder()
  .setTitle('Location Service API')
  .setDescription('Location service with spatial capabilities for GPS tracking')
  .setVersion('2.0')
  .addTag('locations', 'Location management with spatial operations')
  .build();
```

### Step 9: Performance Monitoring

#### 9.1 Add Performance Logging
```typescript
// location-micro/src/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next
      .handle()
      .pipe(
        tap(() => {
          const responseTime = Date.now() - now;
          if (responseTime > 100) {
            this.logger.warn(`Slow request: ${method} ${url} - ${responseTime}ms`);
          } else {
            this.logger.log(`${method} ${url} - ${responseTime}ms`);
          }
        }),
      );
  }
}
```

### Step 10: Deployment Checklist

#### 10.1 Pre-deployment Tasks
1. **Database Preparation**
   - Ensure PostGIS is installed on production database
   - Run migration scripts in staging environment first
   - Backup existing location data

2. **Configuration Updates**
   - Update environment variables for Redis connection
   - Configure spatial query timeout limits
   - Set appropriate cache TTL values

3. **Testing**
   - Run full test suite
   - Perform load testing on spatial queries
   - Validate cache hit rates

4. **Monitoring Setup**
   - Configure alerts for slow spatial queries
   - Set up dashboards for cache performance
   - Monitor database connection pool usage

#### 10.2 Deployment Steps
```bash
# 1. Deploy database migrations
npm run typeorm migration:run

# 2. Build and deploy service
npm run build
npm run start:prod

# 3. Verify spatial functionality
curl -X GET "http://localhost:3000/locations/validate-coordinates?latitude=10.7769&longitude=106.7009&locationId=test-id"

# 4. Monitor logs
tail -f logs/location-service.log
```

### Step 11: Post-deployment Verification

#### 11.1 Health Checks
```typescript
// location-micro/src/health/spatial.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../models/location.model';

@Injectable()
export class SpatialHealthIndicator extends HealthIndicator {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test MySQL spatial functionality
      const spatialTest = await this.locationRepository.query(
        'SELECT ST_Distance_Sphere(POINT(0, 0), POINT(1, 1)) as test_distance'
      );

      if (!spatialTest || spatialTest[0]?.test_distance === undefined) {
        throw new HealthCheckError('MySQL spatial check failed', {
          spatial: 'not available'
        });
      }

      // Get MySQL version
      const versionResult = await this.locationRepository.query(
        'SELECT VERSION() as version'
      );

      return this.getStatus(key, true, {
        mysql_version: versionResult[0].version,
        spatial_support: true,
        test_distance: spatialTest[0].test_distance
      });
    } catch (error) {
      throw new HealthCheckError('Spatial database check failed', error);
    }
  }
}
```

## Best Practices and Recommendations

### 1. Spatial Query Optimization
- Always use spatial indexes for geometry columns
- Limit search radius to reasonable values (< 50km)
- Use bounding box queries before precise distance calculations
- Cache frequently accessed location data

### 2. Data Integrity
- Validate coordinates before saving (-90 to 90 for latitude, -180 to 180 for longitude)
- Ensure SRID consistency (always use 4326 for GPS coordinates)
- Handle edge cases (poles, date line crossing)

### 3. Security Considerations
- Rate limit spatial queries to prevent abuse
- Validate user permissions for location access
- Sanitize GeoJSON inputs to prevent injection
- Log access to sensitive location data

### 4. Monitoring and Maintenance
- Track spatial query performance metrics
- Monitor cache hit rates and adjust TTL accordingly
- Regular index maintenance for optimal performance
- Alert on unusual GPS coordinate patterns

## Troubleshooting Guide

### Common Issues and Solutions

1. **MySQL Spatial Functions Not Available**
   ```sql
   -- Check MySQL version (needs 5.7+)
   SELECT VERSION();
   
   -- Test spatial function availability
   SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1));
   
   -- For older MySQL versions, consider upgrading or using alternative calculations
   ```

2. **Slow Spatial Queries**
   - Check if spatial indexes exist:
   ```sql
   SHOW INDEX FROM location WHERE Key_name LIKE '%geom%';
   ```
   - Use EXPLAIN to analyze query plans
   - Consider using bounding box pre-filters for large datasets
   - For MySQL 8.0+, use ST_Distance instead of ST_Distance_Sphere for better performance

3. **Cache Misses**
   - Verify Redis connection
   - Check cache key format
   - Monitor cache eviction rates
   - Ensure proper serialization of spatial data

4. **Invalid Geometry Errors**
   - Validate coordinate order (longitude, latitude)
   - Check for null or invalid coordinates
   - Ensure SRID 4326 is properly set
   - MySQL specific: Use ST_IsValid() to check geometry validity

5. **TypeORM MySQL Spatial Issues**
   - Ensure proper TypeORM MySQL driver configuration
   - May need custom transformers for geometry types
   - Check TypeORM version compatibility with MySQL spatial features

## Conclusion

This implementation guide provides a comprehensive approach to enhancing the location service with spatial capabilities. Follow the steps sequentially, test thoroughly at each phase, and monitor performance in production. The spatial features will enable accurate GPS tracking and geofencing for the Trip Sync application.