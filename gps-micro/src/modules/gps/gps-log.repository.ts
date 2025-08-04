import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, QueryFailedError } from 'typeorm';
import { GPSLog } from '../../models/gps.model';
import { throwRpcException } from '../../utils';

@Injectable()
export class GPSLogRepository extends Repository<GPSLog> {
  private readonly logger = new Logger(GPSLogRepository.name);

  constructor(private dataSource: DataSource) {
    super(GPSLog, dataSource.createEntityManager());
  }

  /**
   * Find GPS logs within a certain radius of a point
   * @param latitude Center point latitude
   * @param longitude Center point longitude
   * @param radiusInMeters Search radius in meters
   * @param tripId Optional trip ID filter
   */
  async findWithinRadius(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
    tripId?: string,
  ): Promise<GPSLog[]> {
    // Validate input parameters
    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throwRpcException({
        message: 'Invalid GPS coordinates provided',
        statusCode: HttpStatus.BAD_REQUEST,
        details:
          'Latitude must be between -90 and 90, longitude between -180 and 180',
      });
    }

    if (!radiusInMeters || radiusInMeters <= 0 || radiusInMeters > 50000) {
      throwRpcException({
        message: 'Invalid radius provided',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Radius must be between 1 and 50000 meters',
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Finding GPS logs within ${radiusInMeters}m of (${latitude}, ${longitude})${tripId ? ` for trip ${tripId}` : ''}`,
    );

    try {
      const query = this.createQueryBuilder('gps').where(
        `ST_Distance_Sphere(gps.locationPoint, ST_GeomFromText('POINT(${longitude} ${latitude})', 4326)) <= :radius`,
        { radius: radiusInMeters },
      );

      if (tripId) {
        query.andWhere('gps.tripId = :tripId', { tripId });
      }

      const results = await query.orderBy('gps.timestamp', 'DESC').getMany();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Found ${results.length} GPS logs within radius in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding GPS logs within radius: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message:
            'Database query failed while searching GPS logs within radius',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to find GPS logs within radius',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Find GPS logs within a bounding box
   * @param bounds Bounding box coordinates
   * @param tripId Optional trip ID filter
   */
  async findWithinBounds(
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    },
    tripId?: string,
  ): Promise<GPSLog[]> {
    // Validate bounds
    if (
      !bounds ||
      bounds.minLat == null ||
      bounds.maxLat == null ||
      bounds.minLng == null ||
      bounds.maxLng == null ||
      bounds.minLat < -90 ||
      bounds.maxLat > 90 ||
      bounds.minLng < -180 ||
      bounds.maxLng > 180 ||
      bounds.minLat >= bounds.maxLat ||
      bounds.minLng >= bounds.maxLng
    ) {
      throwRpcException({
        message: 'Invalid bounding box coordinates',
        statusCode: HttpStatus.BAD_REQUEST,
        details:
          'Bounds must be valid GPS coordinates with min values less than max values',
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Finding GPS logs within bounds: [${bounds.minLat},${bounds.minLng}] to [${bounds.maxLat},${bounds.maxLng}]${tripId ? ` for trip ${tripId}` : ''}`,
    );

    try {
      const polygon = `POLYGON((
        ${bounds.minLng} ${bounds.minLat},
        ${bounds.maxLng} ${bounds.minLat},
        ${bounds.maxLng} ${bounds.maxLat},
        ${bounds.minLng} ${bounds.maxLat},
        ${bounds.minLng} ${bounds.minLat}
      ))`;

      const query = this.createQueryBuilder('gps').where(
        `ST_Contains(ST_GeomFromText(:polygon, 4326), gps.locationPoint)`,
        { polygon },
      );

      if (tripId) {
        query.andWhere('gps.tripId = :tripId', { tripId });
      }

      const results = await query.orderBy('gps.timestamp', 'DESC').getMany();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Found ${results.length} GPS logs within bounds in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding GPS logs within bounds: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message:
            'Database query failed while searching GPS logs within bounds',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to find GPS logs within bounds',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get the latest GPS position for a user
   * @param userId User ID
   */
  async getLatestPosition(userId: string): Promise<GPSLog | null> {
    if (!userId) {
      throwRpcException({
        message: 'User ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const startTime = Date.now();
    this.logger.debug(`Getting latest position for user ${userId}`);

    try {
      const result = await this.createQueryBuilder('gps')
        .where('gps.userId = :userId', { userId })
        .orderBy('gps.timestamp', 'DESC')
        .limit(1)
        .getOne();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Retrieved latest position for user ${userId} in ${duration}ms`,
      );

      if (!result) {
        this.logger.warn(`No GPS position found for user ${userId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting latest position for user ${userId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: `Database query failed while getting latest position for user ${userId}`,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get latest GPS position',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get GPS trail for a trip within a time range
   * @param tripId Trip ID
   * @param startTime Start timestamp
   * @param endTime End timestamp
   */
  async getTripTrail(
    tripId: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<GPSLog[]> {
    if (!tripId) {
      throwRpcException({
        message: 'Trip ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (startTime && endTime && startTime > endTime) {
      throwRpcException({
        message: 'Invalid time range',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Start time must be before end time',
      });
    }

    const queryStartTime = Date.now();
    this.logger.debug(
      `Getting GPS trail for trip ${tripId}${startTime ? ` from ${startTime.toISOString()}` : ''}${endTime ? ` to ${endTime.toISOString()}` : ''}`,
    );

    try {
      const query = this.createQueryBuilder('gps').where(
        'gps.tripId = :tripId',
        { tripId },
      );

      if (startTime) {
        query.andWhere('gps.timestamp >= :startTime', { startTime });
      }

      if (endTime) {
        query.andWhere('gps.timestamp <= :endTime', { endTime });
      }

      const results = await query.orderBy('gps.timestamp', 'ASC').getMany();

      const duration = Date.now() - queryStartTime;
      this.logger.debug(
        `Retrieved ${results.length} GPS points for trip ${tripId} in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error getting trip trail for ${tripId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: `Database query failed while getting trail for trip ${tripId}`,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get trip GPS trail',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Calculate distance traveled for a trip
   * @param tripId Trip ID
   */
  async calculateTripDistance(tripId: string): Promise<number> {
    if (!tripId) {
      throwRpcException({
        message: 'Trip ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const startTime = Date.now();
    this.logger.debug(`Calculating total distance for trip ${tripId}`);

    try {
      const result = await this.query(
        `
        SELECT SUM(
          ST_Distance_Sphere(
            lag_point,
            locationPoint
          )
        ) as totalDistance
        FROM (
          SELECT 
            locationPoint,
            LAG(locationPoint) OVER (ORDER BY timestamp) as lag_point
          FROM gps_logs
          WHERE tripId = ?
          AND deletedAt IS NULL
        ) as trail
        WHERE lag_point IS NOT NULL
      `,
        [tripId],
      );

      const distance = result[0]?.totalDistance || 0;
      const duration = Date.now() - startTime;

      this.logger.debug(
        `Calculated distance for trip ${tripId}: ${distance.toFixed(2)}m in ${duration}ms`,
      );

      return distance;
    } catch (error) {
      this.logger.error(
        `Error calculating trip distance for ${tripId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: `Database query failed while calculating distance for trip ${tripId}`,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      if (error.message?.includes('ST_Distance_Sphere')) {
        throwRpcException({
          message: 'Spatial function error in distance calculation',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details:
            'The database spatial extensions may not be properly configured',
        });
      }

      throwRpcException({
        message: 'Failed to calculate trip distance',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Find nearby GPS logs from different users
   * @param latitude Center latitude
   * @param longitude Center longitude
   * @param radiusInMeters Radius in meters
   * @param excludeUserId User ID to exclude
   */
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
    excludeUserId?: string,
  ): Promise<GPSLog[]> {
    // Validate coordinates
    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throwRpcException({
        message: 'Invalid GPS coordinates provided',
        statusCode: HttpStatus.BAD_REQUEST,
        details:
          'Latitude must be between -90 and 90, longitude between -180 and 180',
      });
    }

    if (!radiusInMeters || radiusInMeters <= 0 || radiusInMeters > 50000) {
      throwRpcException({
        message: 'Invalid radius provided',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Radius must be between 1 and 50000 meters',
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Finding users within ${radiusInMeters}m of (${latitude}, ${longitude})${excludeUserId ? ` excluding user ${excludeUserId}` : ''}`,
    );

    try {
      const query = this.createQueryBuilder('gps')
        .select([
          'gps.userId',
          'gps.latitude',
          'gps.longitude',
          'gps.timestamp',
          'ST_Distance_Sphere(gps.locationPoint, ST_GeomFromText(:point, 4326)) as distance',
        ])
        .where(
          `ST_Distance_Sphere(gps.locationPoint, ST_GeomFromText(:point, 4326)) <= :radius`,
          {
            point: `POINT(${longitude} ${latitude})`,
            radius: radiusInMeters,
          },
        )
        .andWhere('gps.timestamp >= :timeLimit', {
          timeLimit: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        });

      if (excludeUserId) {
        query.andWhere('gps.userId != :excludeUserId', { excludeUserId });
      }

      const results = await query
        .distinctOn(['gps.userId'])
        .orderBy('gps.userId')
        .addOrderBy('gps.timestamp', 'DESC')
        .getRawMany();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Found ${results.length} nearby users in ${duration}ms`,
      );

      if (results.length > 0) {
        this.logger.verbose(
          `Nearby users: ${results.map((r) => `${r.gps_userId} (${r.distance.toFixed(2)}m)`).join(', ')}`,
        );
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding nearby users: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while finding nearby users',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      if (error.message?.includes('distinctOn')) {
        throwRpcException({
          message: 'Database does not support DISTINCT ON clause',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details:
            'The distinctOn feature may not be supported by your database',
        });
      }

      throwRpcException({
        message: 'Failed to find nearby users',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Create a new GPS log entry
   * @param data GPS log data
   */
  async createGPSLog(data: Partial<GPSLog>): Promise<GPSLog> {
    const startTime = Date.now();
    this.logger.debug(`Creating GPS log for trip ${data.tripId}`);

    try {
      const gpsLog = this.create(data);
      const saved = await this.save(gpsLog);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Created GPS log ${saved.id} in ${duration}ms`,
      );

      return saved;
    } catch (error) {
      this.logger.error(
        `Error creating GPS log: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database error while creating GPS log',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to create GPS log',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Create multiple GPS log entries in a batch
   * @param data Array of GPS log data
   */
  async createBatchGPSLogs(data: Partial<GPSLog>[]): Promise<GPSLog[]> {
    if (!data || data.length === 0) {
      throwRpcException({
        message: 'No GPS logs provided for batch insert',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (data.length > 1000) {
      throwRpcException({
        message: 'Batch size exceeds maximum limit',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Maximum 1000 GPS logs can be inserted at once',
      });
    }

    const startTime = Date.now();
    this.logger.debug(`Creating batch of ${data.length} GPS logs`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const gpsLogs = data.map(log => this.create(log));
      const saved = await queryRunner.manager.save(GPSLog, gpsLogs);

      await queryRunner.commitTransaction();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Created ${saved.length} GPS logs in ${duration}ms`,
      );

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      this.logger.error(
        `Error creating batch GPS logs: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database error during batch GPS log creation',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to create batch GPS logs',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get the latest GPS positions for multiple users
   * @param userIds Array of user IDs
   */
  async getLatestPositionsForUsers(userIds: string[]): Promise<GPSLog[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const startTime = Date.now();
    this.logger.debug(`Getting latest positions for ${userIds.length} users`);

    try {
      // Use a subquery to get the latest timestamp for each user
      const subQuery = this.createQueryBuilder('latest')
        .select('latest.userId', 'userId')
        .addSelect('MAX(latest.timestamp)', 'maxTimestamp')
        .where('latest.userId IN (:...userIds)', { userIds })
        .groupBy('latest.userId');

      const results = await this.createQueryBuilder('gps')
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latestGps',
          'gps.userId = latestGps.userId AND gps.timestamp = latestGps.maxTimestamp'
        )
        .setParameters(subQuery.getParameters())
        .getMany();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Retrieved ${results.length} latest positions in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error getting latest positions for users: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while getting latest positions',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get latest positions for users',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Detect stops during a trip based on GPS data
   * @param tripId Trip ID
   * @param minDurationMinutes Minimum stop duration in minutes
   */
  async detectTripStops(
    tripId: string,
    minDurationMinutes: number = 5,
  ): Promise<any[]> {
    if (!tripId) {
      throwRpcException({
        message: 'Trip ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Detecting stops for trip ${tripId} with minimum duration ${minDurationMinutes} minutes`,
    );

    try {
      // This is a simplified stop detection algorithm
      // In production, you might want to use more sophisticated clustering algorithms
      const query = `
        WITH gps_with_next AS (
          SELECT 
            latitude,
            longitude,
            timestamp,
            LEAD(timestamp) OVER (ORDER BY timestamp) as next_timestamp,
            LEAD(latitude) OVER (ORDER BY timestamp) as next_latitude,
            LEAD(longitude) OVER (ORDER BY timestamp) as next_longitude
          FROM gps_logs
          WHERE tripId = ?
          AND deletedAt IS NULL
          ORDER BY timestamp
        ),
        potential_stops AS (
          SELECT 
            latitude,
            longitude,
            timestamp as arrival_time,
            next_timestamp as departure_time,
            TIMESTAMPDIFF(MINUTE, timestamp, next_timestamp) as duration_minutes,
            ST_Distance_Sphere(
              POINT(longitude, latitude),
              POINT(next_longitude, next_latitude)
            ) as distance_to_next
          FROM gps_with_next
          WHERE next_timestamp IS NOT NULL
        )
        SELECT 
          latitude,
          longitude,
          arrival_time,
          departure_time,
          duration_minutes
        FROM potential_stops
        WHERE duration_minutes >= ?
        AND distance_to_next < 50  -- Less than 50 meters movement
        ORDER BY arrival_time;
      `;

      const results = await this.query(query, [tripId, minDurationMinutes]);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Detected ${results.length} stops for trip ${tripId} in ${duration}ms`,
      );

      return results.map(stop => ({
        location: {
          latitude: parseFloat(stop.latitude),
          longitude: parseFloat(stop.longitude),
        },
        arrivalTime: stop.arrival_time,
        departureTime: stop.departure_time,
        duration: stop.duration_minutes,
      }));
    } catch (error) {
      this.logger.error(
        `Error detecting stops for trip ${tripId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while detecting stops',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to detect trip stops',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get GPS logs for a specific time window
   * @param startTime Start of time window
   * @param endTime End of time window
   * @param userIds Optional user IDs to filter
   * @param tripIds Optional trip IDs to filter
   */
  async getGPSLogsInTimeWindow(
    startTime: Date,
    endTime: Date,
    userIds?: string[],
    tripIds?: string[],
  ): Promise<GPSLog[]> {
    if (!startTime || !endTime) {
      throwRpcException({
        message: 'Start time and end time are required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (startTime > endTime) {
      throwRpcException({
        message: 'Invalid time range',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Start time must be before end time',
      });
    }

    const queryStartTime = Date.now();
    this.logger.debug(
      `Getting GPS logs between ${startTime.toISOString()} and ${endTime.toISOString()}`,
    );

    try {
      const query = this.createQueryBuilder('gps')
        .where('gps.timestamp BETWEEN :startTime AND :endTime', {
          startTime,
          endTime,
        });

      if (userIds && userIds.length > 0) {
        query.andWhere('gps.userId IN (:...userIds)', { userIds });
      }

      if (tripIds && tripIds.length > 0) {
        query.andWhere('gps.tripId IN (:...tripIds)', { tripIds });
      }

      const results = await query
        .orderBy('gps.timestamp', 'DESC')
        .getMany();

      const duration = Date.now() - queryStartTime;
      this.logger.debug(
        `Retrieved ${results.length} GPS logs in time window in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error getting GPS logs in time window: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while getting GPS logs in time window',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get GPS logs in time window',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Calculate trip statistics
   * @param tripId Trip ID
   */
  async calculateTripStatistics(tripId: string): Promise<{
    totalDistance: number;
    duration: number;
    averageSpeed: number;
    maxSpeed: number;
    pointCount: number;
  }> {
    if (!tripId) {
      throwRpcException({
        message: 'Trip ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const startTime = Date.now();
    this.logger.debug(`Calculating statistics for trip ${tripId}`);

    try {
      // Get basic statistics
      const basicStats = await this.createQueryBuilder('gps')
        .select('COUNT(*)', 'pointCount')
        .addSelect('MIN(timestamp)', 'startTime')
        .addSelect('MAX(timestamp)', 'endTime')
        .where('gps.tripId = :tripId', { tripId })
        .getRawOne();

      // Calculate distance
      const distance = await this.calculateTripDistance(tripId);

      // Calculate speeds if we have the fields
      const speedStats = await this.createQueryBuilder('gps')
        .select('AVG(speed)', 'avgSpeed')
        .addSelect('MAX(speed)', 'maxSpeed')
        .where('gps.tripId = :tripId', { tripId })
        .andWhere('gps.speed IS NOT NULL')
        .getRawOne();

      const durationMs = basicStats.endTime - basicStats.startTime;
      const durationHours = durationMs / (1000 * 60 * 60);
      const averageSpeed = speedStats?.avgSpeed || (distance / 1000) / durationHours;

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Calculated statistics for trip ${tripId} in ${duration}ms`,
      );

      return {
        totalDistance: distance,
        duration: Math.round(durationMs / (1000 * 60)), // in minutes
        averageSpeed: averageSpeed || 0,
        maxSpeed: speedStats?.maxSpeed || 0,
        pointCount: parseInt(basicStats.pointCount) || 0,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating trip statistics: ${error.message}`,
        error.stack,
      );

      throwRpcException({
        message: 'Failed to calculate trip statistics',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Validate if coordinates are within a location's radius
   * @param locationId Location ID
   * @param latitude Current latitude
   * @param longitude Current longitude
   * @param locationData Location data with center and radius
   */
  async validateLocationRadius(
    locationId: string,
    latitude: number,
    longitude: number,
    locationData: {
      latitude: number;
      longitude: number;
      offsetRadius: number;
      name: string;
    },
  ): Promise<{
    isWithinRadius: boolean;
    distance: number;
    locationName: string;
  }> {
    if (!locationId) {
      throwRpcException({
        message: 'Location ID is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    // Validate coordinates
    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throwRpcException({
        message: 'Invalid GPS coordinates provided',
        statusCode: HttpStatus.BAD_REQUEST,
        details:
          'Latitude must be between -90 and 90, longitude between -180 and 180',
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Validating if (${latitude}, ${longitude}) is within radius of location ${locationId}`,
    );

    try {
      // Calculate distance using Haversine formula
      const query = `
        SELECT 
          ST_Distance_Sphere(
            POINT(?, ?),
            POINT(?, ?)
          ) as distance
      `;

      const result = await this.query(query, [
        longitude,
        latitude,
        locationData.longitude,
        locationData.latitude,
      ]);

      const distance = result[0]?.distance || 0;
      const isWithinRadius = distance <= locationData.offsetRadius;

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Location validation completed in ${duration}ms. Distance: ${distance.toFixed(2)}m, Within radius: ${isWithinRadius}`,
      );

      return {
        isWithinRadius,
        distance,
        locationName: locationData.name,
      };
    } catch (error) {
      this.logger.error(
        `Error validating location radius: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while validating location',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to validate location radius',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get GPS logs updated since a specific timestamp
   * @param since Timestamp to get updates since
   * @param userIds Optional user IDs filter
   * @param tripIds Optional trip IDs filter
   */
  async getGPSLogsSince(
    since: Date,
    userIds?: string[],
    tripIds?: string[],
  ): Promise<GPSLog[]> {
    if (!since) {
      throwRpcException({
        message: 'Since timestamp is required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Getting GPS logs since ${since.toISOString()}`,
    );

    try {
      const query = this.createQueryBuilder('gps')
        .where('gps.timestamp > :since', { since });

      if (userIds && userIds.length > 0) {
        query.andWhere('gps.userId IN (:...userIds)', { userIds });
      }

      if (tripIds && tripIds.length > 0) {
        query.andWhere('gps.tripId IN (:...tripIds)', { tripIds });
      }

      const results = await query
        .orderBy('gps.timestamp', 'DESC')
        .getMany();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Retrieved ${results.length} GPS logs since timestamp in ${duration}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error getting GPS logs since timestamp: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while getting GPS logs since timestamp',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get GPS logs since timestamp',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get aggregated GPS data for analytics
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @param userId Optional specific user filter
   */
  async getGPSAnalytics(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<{
    totalDistance: number;
    totalTrips: number;
    averageSpeed: number;
    totalDuration: number;
    mostVisitedLocations: any[];
  }> {
    if (!startDate || !endDate) {
      throwRpcException({
        message: 'Start date and end date are required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (startDate > endDate) {
      throwRpcException({
        message: 'Invalid date range',
        statusCode: HttpStatus.BAD_REQUEST,
        details: 'Start date must be before end date',
      });
    }

    const startTime = Date.now();
    this.logger.debug(
      `Getting GPS analytics from ${startDate.toISOString()} to ${endDate.toISOString()}${userId ? ` for user ${userId}` : ''}`,
    );

    try {
      // Build base query conditions
      let whereClause = 'WHERE g.timestamp BETWEEN ? AND ?';
      const params: any[] = [startDate, endDate];

      if (userId) {
        whereClause += ' AND g.userId = ?';
        params.push(userId);
      }

      // Get total distance across all trips
      const distanceQuery = `
        SELECT 
          SUM(distance) as totalDistance,
          COUNT(DISTINCT tripId) as totalTrips,
          AVG(avgSpeed) as overallAvgSpeed,
          SUM(duration) as totalDuration
        FROM (
          SELECT 
            g.tripId,
            SUM(
              ST_Distance_Sphere(
                LAG(g.locationPoint) OVER (PARTITION BY g.tripId ORDER BY g.timestamp),
                g.locationPoint
              )
            ) as distance,
            AVG(g.speed) as avgSpeed,
            TIMESTAMPDIFF(MINUTE, MIN(g.timestamp), MAX(g.timestamp)) as duration
          FROM gps_logs g
          ${whereClause}
          AND g.deletedAt IS NULL
          GROUP BY g.tripId
        ) as trip_stats
      `;

      const statsResult = await this.query(distanceQuery, params);
      
      // Get most visited locations (simplified - you'd need location service integration)
      const locationsQuery = `
        WITH location_clusters AS (
          SELECT 
            ROUND(latitude, 3) as lat_cluster,
            ROUND(longitude, 3) as lng_cluster,
            COUNT(*) as visit_count
          FROM gps_logs g
          ${whereClause}
          AND g.deletedAt IS NULL
          GROUP BY ROUND(latitude, 3), ROUND(longitude, 3)
          ORDER BY visit_count DESC
          LIMIT 5
        )
        SELECT * FROM location_clusters
      `;

      const locationsResult = await this.query(locationsQuery, params);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Retrieved GPS analytics in ${duration}ms`,
      );

      const stats = statsResult[0] || {};
      
      return {
        totalDistance: (stats.totalDistance || 0) / 1000, // Convert to km
        totalTrips: parseInt(stats.totalTrips) || 0,
        averageSpeed: stats.overallAvgSpeed || 0,
        totalDuration: Math.round((stats.totalDuration || 0) / 60), // Convert to hours
        mostVisitedLocations: locationsResult.map(loc => ({
          latitude: parseFloat(loc.lat_cluster),
          longitude: parseFloat(loc.lng_cluster),
          visitCount: parseInt(loc.visit_count),
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting GPS analytics: ${error.message}`,
        error.stack,
      );

      if (error instanceof QueryFailedError) {
        throwRpcException({
          message: 'Database query failed while getting GPS analytics',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          details: error.message,
        });
      }

      throwRpcException({
        message: 'Failed to get GPS analytics',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Simplify GPS route using Douglas-Peucker algorithm
   * @param points Array of GPS points
   * @param tolerance Simplification tolerance in meters
   */
  simplifyRoute(
    points: { latitude: number; longitude: number; timestamp: Date }[],
    tolerance: number = 10,
  ): { latitude: number; longitude: number; timestamp: Date }[] {
    if (points.length <= 2) {
      return points;
    }

    // Helper function to calculate perpendicular distance
    const perpendicularDistance = (
      point: { latitude: number; longitude: number },
      lineStart: { latitude: number; longitude: number },
      lineEnd: { latitude: number; longitude: number },
    ): number => {
      const x0 = point.longitude;
      const y0 = point.latitude;
      const x1 = lineStart.longitude;
      const y1 = lineStart.latitude;
      const x2 = lineEnd.longitude;
      const y2 = lineEnd.latitude;

      const A = x0 - x1;
      const B = y0 - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;

      if (lenSq !== 0) {
        param = dot / lenSq;
      }

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = x0 - xx;
      const dy = y0 - yy;

      // Convert to meters (approximate)
      return Math.sqrt(dx * dx + dy * dy) * 111000;
    };

    // Douglas-Peucker algorithm implementation
    const douglasPeucker = (
      points: { latitude: number; longitude: number; timestamp: Date }[],
      epsilon: number,
    ): { latitude: number; longitude: number; timestamp: Date }[] => {
      let maxDistance = 0;
      let maxIndex = 0;

      // Find the point with the maximum distance
      for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(
          points[i],
          points[0],
          points[points.length - 1],
        );

        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }

      // If max distance is greater than epsilon, recursively simplify
      if (maxDistance > epsilon) {
        const leftPart = douglasPeucker(
          points.slice(0, maxIndex + 1),
          epsilon,
        );
        const rightPart = douglasPeucker(
          points.slice(maxIndex),
          epsilon,
        );

        return [...leftPart.slice(0, -1), ...rightPart];
      } else {
        return [points[0], points[points.length - 1]];
      }
    };

    const simplified = douglasPeucker(points, tolerance);
    
    this.logger.debug(
      `Route simplified from ${points.length} to ${simplified.length} points`,
    );

    return simplified;
  }

  /**
   * Check for duplicate GPS logs based on timestamp and trip
   * @param tripId Trip ID
   * @param timestamps Array of timestamps to check
   */
  async checkDuplicateTimestamps(
    tripId: string,
    timestamps: Date[],
  ): Promise<Date[]> {
    if (!tripId || !timestamps || timestamps.length === 0) {
      return [];
    }

    const startTime = Date.now();
    this.logger.debug(
      `Checking ${timestamps.length} timestamps for duplicates in trip ${tripId}`,
    );

    try {
      const existingLogs = await this.createQueryBuilder('gps')
        .select('gps.timestamp')
        .where('gps.tripId = :tripId', { tripId })
        .andWhere('gps.timestamp IN (:...timestamps)', { timestamps })
        .getMany();

      const existingTimestamps = new Set(
        existingLogs.map(log => log.timestamp.toISOString()),
      );

      const duplicates = timestamps.filter(ts =>
        existingTimestamps.has(ts.toISOString()),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Found ${duplicates.length} duplicate timestamps in ${duration}ms`,
      );

      return duplicates;
    } catch (error) {
      this.logger.error(
        `Error checking duplicate timestamps: ${error.message}`,
        error.stack,
      );

      // Don't throw exception for duplicate check - return empty array
      return [];
    }
  }
}
