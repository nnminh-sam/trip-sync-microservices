# MySQL Spatial Setup on Application Startup

## Overview
This guide shows different approaches to ensure MySQL spatial support is properly initialized when the application starts.

## Approach 1: Using TypeORM Migrations (Recommended)

### 1.1 Configure TypeORM for Auto-Migration
```typescript
// location-micro/src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: true, // Run migrations automatically on startup
  synchronize: false, // Don't use in production
  logging: configService.get('NODE_ENV') === 'development',
});
```

### 1.2 Create Initial Setup Migration
```typescript
// location-micro/src/migrations/1234567890-InitialSpatialSetup.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSpatialSetup1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check MySQL version
    const [version] = await queryRunner.query(`SELECT VERSION() as version`);
    console.log(`MySQL Version: ${version.version}`);
    
    // Test spatial support
    try {
      await queryRunner.query(`SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1)) as test`);
      console.log('MySQL spatial functions are available');
    } catch (error) {
      throw new Error('MySQL spatial functions not available. Please ensure MySQL 5.7+ is installed.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nothing to rollback for spatial check
  }
}
```

## Approach 2: Using Application Bootstrap Hook

### 2.1 Create Database Initializer Service
```typescript
// location-micro/src/services/database-initializer.service.ts
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitializerService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    await this.checkSpatialSupport();
    await this.ensureSpatialIndexes();
  }

  private async checkSpatialSupport(): Promise<void> {
    try {
      // Check MySQL version
      const versionResult = await this.dataSource.query(`SELECT VERSION() as version`);
      this.logger.log(`MySQL Version: ${versionResult[0].version}`);

      // Verify spatial functions
      const spatialTest = await this.dataSource.query(
        `SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1)) as test_distance`
      );
      
      if (spatialTest && spatialTest[0].test_distance !== undefined) {
        this.logger.log('✓ MySQL spatial support verified');
      }
    } catch (error) {
      this.logger.error('MySQL spatial support check failed', error);
      throw new Error('MySQL spatial functions are required but not available');
    }
  }

  private async ensureSpatialIndexes(): Promise<void> {
    try {
      // Check if spatial column exists
      const columns = await this.dataSource.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND COLUMN_NAME = 'geom'
      `);

      if (columns.length === 0) {
        this.logger.warn('Spatial column "geom" not found. Run migrations to add it.');
        return;
      }

      // Check if spatial index exists
      const indexes = await this.dataSource.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND INDEX_NAME = 'idx_location_geom'
      `);

      if (indexes.length === 0) {
        this.logger.log('Creating spatial index...');
        await this.dataSource.query(`
          CREATE SPATIAL INDEX idx_location_geom ON location(geom)
        `);
        this.logger.log('✓ Spatial index created');
      } else {
        this.logger.log('✓ Spatial index already exists');
      }
    } catch (error) {
      this.logger.error('Failed to ensure spatial indexes', error);
      // Don't throw - allow app to start but log the warning
      this.logger.warn('Application started without spatial indexes. Performance may be degraded.');
    }
  }
}
```

### 2.2 Register in Module
```typescript
// location-micro/src/location.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseInitializerService } from './services/database-initializer.service';
import { Location } from './models/location.model';
// ... other imports

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    // ... other imports
  ],
  providers: [
    DatabaseInitializerService, // Add this
    LocationService,
    // ... other providers
  ],
  // ... rest of module
})
export class LocationModule {}
```

## Approach 3: Using Custom Repository with Initialization

### 3.1 Create Custom Repository
```typescript
// location-micro/src/repositories/location.repository.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Location } from '../models/location.model';

@Injectable()
export class LocationRepository extends Repository<Location> implements OnModuleInit {
  private readonly logger = new Logger(LocationRepository.name);
  private spatialSupported = false;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super(Location, dataSource.createEntityManager());
  }

  async onModuleInit() {
    await this.initializeSpatialSupport();
  }

  private async initializeSpatialSupport(): Promise<void> {
    try {
      // Quick spatial function test
      await this.query(`SELECT ST_AsText(POINT(1, 1))`);
      this.spatialSupported = true;
      this.logger.log('✓ Spatial support initialized');
    } catch (error) {
      this.logger.error('Spatial support initialization failed', error);
      this.spatialSupported = false;
    }
  }

  isSpatialSupported(): boolean {
    return this.spatialSupported;
  }

  // Override query method to check spatial support
  async query(query: string, parameters?: any[]): Promise<any> {
    if (!this.spatialSupported && query.includes('ST_')) {
      throw new Error('Spatial operations not supported in current MySQL setup');
    }
    return super.query(query, parameters);
  }
}
```

## Approach 4: Environment-Based Initialization

### 4.1 Create Startup Script
```typescript
// location-micro/src/scripts/check-spatial-support.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function checkSpatialSupport() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await dataSource.initialize();
    
    // Check version
    const [version] = await dataSource.query(`SELECT VERSION() as version`);
    console.log(`MySQL Version: ${version.version}`);
    
    // Check spatial support
    await dataSource.query(`SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1))`);
    console.log('✓ MySQL spatial support confirmed');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ MySQL spatial support check failed:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

checkSpatialSupport();
```

### 4.2 Add to Package.json
```json
{
  "scripts": {
    "prestart": "ts-node src/scripts/check-spatial-support.ts",
    "start": "nest start",
    "start:dev": "npm run prestart && nest start --watch",
    "start:prod": "node dist/main"
  }
}
```

## Approach 5: Health Check Integration

### 5.1 Create Spatial Health Indicator
```typescript
// location-micro/src/health/spatial-ready.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SpatialReadyIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async isReady(key: string = 'spatial'): Promise<HealthIndicatorResult> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          ST_Distance_Sphere(POINT(0,0), POINT(1,1)) as distance_check,
          COUNT(*) as spatial_index_count
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND INDEX_TYPE = 'SPATIAL'
      `);

      const isHealthy = result[0].distance_check !== null && result[0].spatial_index_count > 0;

      if (isHealthy) {
        return this.getStatus(key, true, {
          spatial_functions: 'available',
          spatial_indexes: result[0].spatial_index_count,
        });
      }

      throw new HealthCheckError('Spatial not ready', {
        spatial_functions: result[0].distance_check !== null,
        spatial_indexes: result[0].spatial_index_count,
      });
    } catch (error) {
      throw new HealthCheckError('Spatial check failed', error);
    }
  }
}
```

### 5.2 Add to Health Module
```typescript
// location-micro/src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SpatialReadyIndicator } from './spatial-ready.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [SpatialReadyIndicator],
})
export class HealthModule {}
```

## Best Practices and Recommendations

### 1. Production Deployment
For production environments, use migrations (Approach 1):
```typescript
// Production configuration
{
  migrationsRun: true,
  migrationsTransactionMode: 'each', // Run each migration in separate transaction
}
```

### 2. Development Environment
For development, combine approaches:
```typescript
// Development setup
if (process.env.NODE_ENV === 'development') {
  app.get(DatabaseInitializerService).checkSpatialSupport();
}
```

### 3. Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: tripsync_location
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  location-service:
    build: ./location-micro
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
```

### 4. Error Handling
```typescript
// Graceful degradation for spatial features
class LocationService {
  async validateCoordinatesInRadius(
    latitude: number,
    longitude: number,
    locationId: string
  ): Promise<ValidationResult> {
    try {
      // Try spatial query
      return await this.spatialValidation(latitude, longitude, locationId);
    } catch (error) {
      if (error.message.includes('spatial')) {
        // Fallback to Haversine formula
        return await this.haversineValidation(latitude, longitude, locationId);
      }
      throw error;
    }
  }

  private async haversineValidation(
    lat1: number,
    lon1: number,
    locationId: string
  ): Promise<ValidationResult> {
    const location = await this.findOne(locationId);
    const distance = this.calculateHaversineDistance(
      lat1, lon1, 
      location.latitude, 
      location.longitude
    );
    
    return {
      isValid: distance <= location.offsetRadious,
      distance,
      maxRadius: location.offsetRadious,
      locationName: location.name,
    };
  }

  private calculateHaversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}
```

## Conclusion

Choose the approach based on your needs:
- **Migrations**: Best for production, version controlled
- **Bootstrap Hook**: Good for runtime checks and warnings
- **Health Checks**: Ideal for monitoring and orchestration
- **Combined Approach**: Use migrations + health checks for robust setup

The key is to ensure spatial support is verified before the application starts accepting requests that depend on spatial functionality.