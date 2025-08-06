import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { LocationType } from 'src/types/location.types';
import { Location } from 'src/models/location.model';

@Injectable()
export class LocationRepository
  extends Repository<Location>
  implements OnModuleInit
{
  private readonly logger = new Logger(LocationRepository.name);
  private spatialSupported = false;
  private haversineSupported = true; // Fallback always available

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super(Location, dataSource.createEntityManager());
  }

  async onModuleInit() {
    await this.initializeSpatialSupport();
    await this.ensureSpatialIndexes();
  }

  /**
   * Initialize spatial support by checking MySQL capabilities
   */
  private async initializeSpatialSupport(): Promise<void> {
    try {
      // Check MySQL version
      const [version] = await this.query(`SELECT VERSION() as version`);
      this.logger.log(`MySQL Version: ${version.version}`);

      // Test spatial functions
      const spatialTest = await this.query(
        `SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1)) as test_distance`,
      );

      if (spatialTest && spatialTest[0].test_distance !== undefined) {
        this.spatialSupported = true;
        this.logger.log('✓ MySQL spatial support verified');
      }
    } catch (error) {
      this.logger.error('Spatial support initialization failed', error);
      this.logger.warn(
        'Falling back to Haversine formula for distance calculations',
      );
      this.spatialSupported = false;
    }
  }

  /**
   * Ensure spatial indexes exist for optimal performance
   */
  private async ensureSpatialIndexes(): Promise<void> {
    try {
      // Check if spatial column exists
      const columns = await this.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND COLUMN_NAME = 'geom'
      `);

      if (columns.length === 0) {
        this.logger.warn(
          'Spatial column "geom" not found. Run migrations to add it.',
        );
        return;
      }

      // Check if spatial index exists
      const indexes = await this.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND INDEX_NAME = 'idx_location_geom'
      `);

      if (indexes.length === 0) {
        this.logger.log('Creating spatial index...');
        await this.query(
          `CREATE SPATIAL INDEX idx_location_geom ON location(geom)`,
        );
        this.logger.log('✓ Spatial index created');
      } else {
        this.logger.log('✓ Spatial index already exists');
      }

      // Check other indexes
      await this.ensureCompositeIndexes();
    } catch (error) {
      this.logger.error('Failed to ensure spatial indexes', error);
      this.logger.warn(
        'Application started without spatial indexes. Performance may be degraded.',
      );
    }
  }

  /**
   * Ensure composite indexes exist
   */
  private async ensureCompositeIndexes(): Promise<void> {
    const indexesToCheck = [
      { name: 'idx_location_type_active', columns: ['type', 'is_active'] },
      {
        name: 'idx_location_created_by_active',
        columns: ['created_by', 'is_active'],
      },
    ];

    for (const index of indexesToCheck) {
      const exists = await this.query(
        `
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'location'
        AND INDEX_NAME = ?
      `,
        [index.name],
      );

      if (exists[0].count === 0) {
        this.logger.log(`Creating index ${index.name}...`);
        const columnList = index.columns.join(', ');
        await this.query(
          `CREATE INDEX ${index.name} ON location(${columnList})`,
        );
      }
    }
  }

  /**
   * Check if spatial operations are supported
   */
  isSpatialSupported(): boolean {
    return this.spatialSupported;
  }

  /**
   * Find locations within radius using spatial or fallback methods
   */
  async findLocationsWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType,
  ): Promise<Location[]> {
    if (this.spatialSupported) {
      return this.findLocationsWithinRadiusSpatial(
        latitude,
        longitude,
        radiusMeters,
        type,
      );
    } else {
      return this.findLocationsWithinRadiusHaversine(
        latitude,
        longitude,
        radiusMeters,
        type,
      );
    }
  }

  /**
   * Find locations using MySQL spatial functions
   */
  private async findLocationsWithinRadiusSpatial(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType,
  ): Promise<Location[]> {
    let query = `
      SELECT l.*, 
        ST_Distance_Sphere(l.geom, POINT(?, ?)) as distance
      FROM location l
      WHERE ST_Distance_Sphere(l.geom, POINT(?, ?)) <= ?
      AND l.is_active = true
    `;

    const params: any[] = [
      longitude,
      latitude, // for SELECT distance
      longitude,
      latitude, // for WHERE clause
      radiusMeters,
    ];

    if (type) {
      query += ' AND l.type = ?';
      params.push(type);
    }

    query += ' ORDER BY distance';

    return this.query(query, params);
  }

  /**
   * Find locations using Haversine formula (fallback)
   */
  private async findLocationsWithinRadiusHaversine(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType,
  ): Promise<Location[]> {
    // Convert radius to approximate degrees (rough estimation)
    // 1 degree ≈ 111km at equator
    const radiusDegrees = radiusMeters / 111000;

    // First, get locations within a bounding box (optimization)
    let query = `
      SELECT *,
        (6371000 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        )) as distance
      FROM location
      WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND is_active = true
    `;

    const params: any[] = [
      latitude,
      longitude,
      latitude,
      latitude - radiusDegrees,
      latitude + radiusDegrees,
      longitude - radiusDegrees,
      longitude + radiusDegrees,
    ];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' HAVING distance <= ? ORDER BY distance';
    params.push(radiusMeters);

    return this.query(query, params);
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<number> {
    if (this.spatialSupported) {
      const result = await this.query(
        `
        SELECT ST_Distance_Sphere(POINT(?, ?), POINT(?, ?)) as distance
      `,
        [fromLng, fromLat, toLng, toLat],
      );
      return result[0].distance;
    } else {
      return this.calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
    }
  }

  /**
   * Calculate Haversine distance (fallback)
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Find nearest locations with limit
   */
  async findNearestLocations(
    latitude: number,
    longitude: number,
    limit: number = 10,
    maxDistance?: number,
  ): Promise<Location[]> {
    if (this.spatialSupported) {
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

      return this.query(query, params);
    } else {
      // Fallback to Haversine
      const radiusForSearch = maxDistance || 50000; // Default 50km if not specified
      const locations = await this.findLocationsWithinRadiusHaversine(
        latitude,
        longitude,
        radiusForSearch,
      );
      return locations.slice(0, limit);
    }
  }

  /**
   * Check if point is within location boundary
   */
  async isPointInLocationBoundary(
    latitude: number,
    longitude: number,
    locationId: string,
  ): Promise<boolean> {
    if (!this.spatialSupported) {
      this.logger.warn('Boundary check requires spatial support');
      return false;
    }

    const result = await this.query(
      `
      SELECT ST_Contains(boundary, POINT(?, ?)) as is_within
      FROM location
      WHERE id = ?
      AND boundary IS NOT NULL
    `,
      [longitude, latitude, locationId],
    );

    return result.length > 0 && result[0].is_within === 1;
  }

  /**
   * Get locations with boundaries in area
   */
  async findLocationsInBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    type?: LocationType,
  ): Promise<Location[]> {
    if (this.spatialSupported) {
      let query = `
        SELECT *
        FROM location
        WHERE ST_Contains(
          ST_MakeEnvelope(POINT(?, ?), POINT(?, ?)),
          geom
        )
        AND is_active = true
      `;

      const params: any[] = [minLng, minLat, maxLng, maxLat];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      return this.query(query, params);
    } else {
      // Simple bounding box query without spatial functions
      let query = `
        SELECT *
        FROM location
        WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        AND is_active = true
      `;

      const params: any[] = [minLat, maxLat, minLng, maxLng];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      return this.query(query, params);
    }
  }

  /**
   * Save location with automatic geom update
   */
  async saveLocation(location: Location): Promise<Location> {
    // Update geom if coordinates changed
    if (location.latitude && location.longitude) {
      location.geom = {
        x: location.longitude,
        y: location.latitude,
      };
    }
    return this.save(location);
  }

  /**
   * Find active locations by IDs
   */
  async findActiveLocationsByIds(ids: string[]): Promise<Location[]> {
    return this.find({
      where: {
        id: In(ids),
        deletedAt: null,
      },
    });
  }

  /**
   * Get repository health status
   */
  async getHealthStatus(): Promise<{
    spatial: boolean;
    fallback: boolean;
    indexes: number;
    totalLocations: number;
  }> {
    const [locationCount] = await this.query(
      'SELECT COUNT(*) as count FROM location',
    );
    const [indexCount] = await this.query(`
      SELECT COUNT(DISTINCT INDEX_NAME) as count
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'location'
    `);

    return {
      spatial: this.spatialSupported,
      fallback: this.haversineSupported,
      indexes: indexCount.count,
      totalLocations: locationCount.count,
    };
  }
}
