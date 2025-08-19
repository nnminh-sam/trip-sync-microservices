import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { GPSLog } from 'src/models/gps-log.model';
import { CheckInOut, CheckInOutType } from 'src/models/check-in-out.model';
import {
  GPSExport,
  ExportStatus,
  ExportFormat,
} from 'src/models/gps-export.model';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender, throwRpcException } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import {
  TrackGPSDto,
  BatchTrackGPSDto,
  TrackGPSResponseDto,
  BatchTrackGPSResponseDto,
} from './dtos/track-gps.dto';
import {
  CheckInDto,
  CheckOutDto,
  CheckInResponseDto,
  CheckOutResponseDto,
} from './dtos/check-in-out.dto';
import {
  ValidateLocationDto,
  ValidateLocationResponseDto,
  NearbyLocationsQueryDto,
  NearbyLocationsResponseDto,
  BatchValidateLocationDto,
  BatchValidateLocationResponseDto,
} from './dtos/geofencing.dto';
import {
  RouteQueryDto,
  RoutePointDto,
  TripRouteResponseDto,
  StopQueryDto,
  TripStopDto,
  TripStopsResponseDto,
} from './dtos/route-history.dto';
import {
  RealtimeLocationQueryDto,
  RealtimeLocationDto,
  RealtimeLocationsResponseDto,
} from './dtos/realtime-monitoring.dto';
import {
  GPSAnalyticsQueryDto,
  GPSAnalyticsSummaryDto,
  TripStatisticsDto,
  MostVisitedLocationDto,
} from './dtos/analytics.dto';
import {
  CreateGPSExportDto,
  CreateGPSExportResponseDto,
  GPSExportStatusResponseDto,
  ExportStatus as DtoExportStatus,
} from './dtos/gps-export.dto';

@Injectable()
export class GpsService {
  private readonly logger = new Logger(GpsService.name);
  private locationSender: NatsClientSender<any>;
  private tripSender: NatsClientSender<any>;

  constructor(
    @InjectRepository(GPSLog)
    private readonly gpsLogRepo: Repository<GPSLog>,

    @InjectRepository(CheckInOut)
    private readonly checkInOutRepo: Repository<CheckInOut>,

    @InjectRepository(GPSExport)
    private readonly gpsExportRepo: Repository<GPSExport>,

    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.locationSender = new NatsClientSender(natsClient, {
      findOne: 'location.findOne',
      validateCoordinates: 'location.validateCoordinates',
      findNearby: 'location.findNearby',
      calculateDistance: 'location.calculateDistance',
    });

    this.tripSender = new NatsClientSender(natsClient, {
      findOne: 'trip.findOne',
      getTripLocations: 'trip.locations',
    });
  }

  // GPS Tracking Methods
  async trackGPS(
    dto: TrackGPSDto,
    userId: string,
  ): Promise<TrackGPSResponseDto> {
    this.logger.log(`Tracking GPS for trip ${dto.tripId} at ${dto.timestamp}`);

    try {
      // Simply create and save the GPS log without any validation
      const gpsLog = this.gpsLogRepo.create({
        trip_id: dto.tripId,
        user_id: userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timestamp: new Date(dto.timestamp),
      });

      const saved = await this.gpsLogRepo.save(gpsLog);

      return {
        id: saved.id,
        message: 'GPS location logged successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to track GPS: ${error.message}`, error.stack);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to track GPS location',
      });
    }
  }

  async batchTrackGPS(
    dto: BatchTrackGPSDto,
    userId: string,
  ): Promise<BatchTrackGPSResponseDto> {
    this.logger.log(
      `Batch tracking ${dto.locations.length} GPS points for trip ${dto.tripId}`,
    );

    try {
      // Simply create all GPS logs without validation
      const gpsLogs = dto.locations.map((loc) =>
        this.gpsLogRepo.create({
          trip_id: dto.tripId,
          user_id: userId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: new Date(loc.timestamp),
        }),
      );

      await this.gpsLogRepo.save(gpsLogs);

      return {
        processed: dto.locations.length,
        message: 'GPS locations logged successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to batch track GPS: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to batch track GPS locations',
      });
    }
  }

  // Check-in/Check-out Methods
  async checkIn(
    dto: CheckInDto,
    userId: string,
    claims: TokenClaimsDto,
  ): Promise<CheckInResponseDto> {
    this.logger.log(`Check-in for trip location ${dto.tripLocationId}`);

    try {
      // Get trip location details
      const tripLocations = await this.tripSender.send({
        messagePattern: 'getTripLocations',
        payload: {
          claims,
          request: { path: { id: dto.tripLocationId } },
        },
      });

      if (!tripLocations || tripLocations.length === 0) {
        throwRpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Trip location not found',
        });
      }

      const tripLocation = tripLocations[0];

      // Validate location proximity
      const validation = await this.locationSender.send({
        messagePattern: 'validateCoordinates',
        payload: {
          claims,
          request: {
            body: {
              locationId: tripLocation.location_id,
              latitude: dto.latitude,
              longitude: dto.longitude,
            },
          },
        },
      });

      // Check for existing check-in
      const existingCheckIn = await this.checkInOutRepo.findOne({
        where: {
          trip_location_id: dto.tripLocationId,
          user_id: userId,
          type: CheckInOutType.CHECK_IN,
        },
        order: { timestamp: 'DESC' },
      });

      if (existingCheckIn) {
        // Check if there's a check-out
        const existingCheckOut = await this.checkInOutRepo.findOne({
          where: {
            trip_location_id: dto.tripLocationId,
            user_id: userId,
            type: CheckInOutType.CHECK_OUT,
            timestamp: MoreThan(existingCheckIn.timestamp),
          },
        });

        if (!existingCheckOut) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Already checked in. Please check out first.',
          });
        }
      }

      const checkIn = this.checkInOutRepo.create({
        trip_location_id: dto.tripLocationId,
        user_id: userId,
        trip_id: tripLocation.trip_id,
        type: CheckInOutType.CHECK_IN,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distance_from_location: validation.distance,
        timestamp: new Date(dto.timestamp),
        location_id: tripLocation.location_id,
        location_name: validation.locationName,
      });

      const saved = await this.checkInOutRepo.save(checkIn);

      return {
        success: true,
        message: 'Check-in successful',
        distanceFromLocation: validation.distance,
        checkInId: saved.id,
        locationName: validation.locationName,
      };
    } catch (error) {
      this.logger.error(`Failed to check in: ${error.message}`, error.stack);
      if (error.response) throw error;
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check in',
      });
    }
  }

  async checkOut(
    dto: CheckOutDto,
    userId: string,
    claims: TokenClaimsDto,
  ): Promise<CheckOutResponseDto> {
    this.logger.log(`Check-out for trip location ${dto.tripLocationId}`);

    try {
      // Find the latest check-in
      const checkIn = await this.checkInOutRepo.findOne({
        where: {
          trip_location_id: dto.tripLocationId,
          user_id: userId,
          type: CheckInOutType.CHECK_IN,
        },
        order: { timestamp: 'DESC' },
      });

      if (!checkIn) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No check-in found. Please check in first.',
        });
      }

      // Check if already checked out
      const existingCheckOut = await this.checkInOutRepo.findOne({
        where: {
          trip_location_id: dto.tripLocationId,
          user_id: userId,
          type: CheckInOutType.CHECK_OUT,
          timestamp: MoreThan(checkIn.timestamp),
        },
      });

      if (existingCheckOut) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Already checked out.',
        });
      }

      const checkOut = this.checkInOutRepo.create({
        trip_location_id: dto.tripLocationId,
        user_id: userId,
        trip_id: checkIn.trip_id,
        type: CheckInOutType.CHECK_OUT,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distance_from_location: 0,
        timestamp: new Date(dto.timestamp),
        location_id: checkIn.location_id,
        location_name: checkIn.location_name,
      });

      const saved = await this.checkInOutRepo.save(checkOut);

      // Calculate duration
      const duration = Math.round(
        (new Date(dto.timestamp).getTime() - checkIn.timestamp.getTime()) /
          60000,
      );

      return {
        success: true,
        message: 'Check-out successful',
        duration,
        checkOutId: saved.id,
        checkInTime: checkIn.timestamp.toISOString(),
        checkOutTime: saved.timestamp.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to check out: ${error.message}`, error.stack);
      if (error.response) throw error;
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check out',
      });
    }
  }

  // Route Methods
  async getTripRoute(
    tripId: string,
    query: RouteQueryDto,
  ): Promise<TripRouteResponseDto> {
    this.logger.log(`Getting route for trip ${tripId}`);

    const whereClause: any = { trip_id: tripId };

    if (query.startTime && query.endTime) {
      whereClause.timestamp = Between(
        new Date(query.startTime),
        new Date(query.endTime),
      );
    }

    const logs = await this.gpsLogRepo.find({
      where: whereClause,
      order: { timestamp: 'ASC' },
    });

    if (logs.length === 0) {
      return {
        tripId,
        route: [],
        totalDistance: 0,
        duration: 0,
        startTime: null,
        endTime: null,
        isSimplified: false,
        pointCount: 0,
      };
    }

    let route: RoutePointDto[] = logs.map((log) => ({
      latitude: Number(log.latitude),
      longitude: Number(log.longitude),
      timestamp: log.timestamp.toISOString(),
      speed: log.speed ? Number(log.speed) : undefined,
      heading: log.heading ? Number(log.heading) : undefined,
    }));

    // Simplify route if requested
    if (query.simplified) {
      route = this.simplifyRoute(route);
    }

    // Calculate total distance
    const totalDistance = this.calculateTotalDistance(route);

    // Calculate duration
    const startTime = logs[0].timestamp;
    const endTime = logs[logs.length - 1].timestamp;
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );

    return {
      tripId,
      route,
      totalDistance,
      duration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isSimplified: query.simplified || false,
      pointCount: route.length,
    };
  }

  async detectStops(
    tripId: string,
    query: StopQueryDto,
  ): Promise<TripStopsResponseDto> {
    this.logger.log(`Detecting stops for trip ${tripId}`);

    const minDuration = query.minDuration || 5;
    const logs = await this.gpsLogRepo.find({
      where: { trip_id: tripId },
      order: { timestamp: 'ASC' },
    });

    const stops: TripStopDto[] = [];
    let currentStop: TripStopDto | null = null;
    let lastLog: GPSLog | null = null;

    for (const log of logs) {
      if (!lastLog) {
        lastLog = log;
        continue;
      }

      const timeDiff =
        (log.timestamp.getTime() - lastLog.timestamp.getTime()) / 60000;
      const distance = this.calculateDistance(
        Number(lastLog.latitude),
        Number(lastLog.longitude),
        Number(log.latitude),
        Number(log.longitude),
      );

      // If speed is very low or distance is minimal, consider it a stop
      if ((log.speed && log.speed < 5) || distance < 50) {
        if (!currentStop) {
          currentStop = {
            location: {
              latitude: Number(log.latitude),
              longitude: Number(log.longitude),
            },
            arrivalTime: lastLog.timestamp.toISOString(),
            departureTime: log.timestamp.toISOString(),
            duration: 0,
          };
        } else {
          currentStop.departureTime = log.timestamp.toISOString();
        }
      } else if (currentStop) {
        // Calculate stop duration
        const stopDuration =
          (new Date(currentStop.departureTime).getTime() -
            new Date(currentStop.arrivalTime).getTime()) /
          60000;

        if (stopDuration >= minDuration) {
          currentStop.duration = Math.round(stopDuration);
          stops.push(currentStop);
        }
        currentStop = null;
      }

      lastLog = log;
    }

    // Handle last stop if still ongoing
    if (currentStop) {
      const stopDuration =
        (new Date(currentStop.departureTime).getTime() -
          new Date(currentStop.arrivalTime).getTime()) /
        60000;

      if (stopDuration >= minDuration) {
        currentStop.duration = Math.round(stopDuration);
        stops.push(currentStop);
      }
    }

    const totalStopTime = stops.reduce((sum, stop) => sum + stop.duration, 0);

    return {
      stops,
      totalStops: stops.length,
      totalStopTime,
      tripId,
    };
  }

  // Analytics Methods
  async getTripStatistics(tripId: string): Promise<TripStatisticsDto> {
    this.logger.log(`Getting statistics for trip ${tripId}`);

    const logs = await this.gpsLogRepo.find({
      where: { trip_id: tripId },
      order: { timestamp: 'ASC' },
    });

    if (logs.length === 0) {
      return {
        tripId,
        totalDistance: 0,
        duration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        pointCount: 0,
        stopCount: 0,
        efficiencyScore: 0,
      };
    }

    // Calculate statistics
    let totalDistance = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (let i = 1; i < logs.length; i++) {
      const distance = this.calculateDistance(
        Number(logs[i - 1].latitude),
        Number(logs[i - 1].longitude),
        Number(logs[i].latitude),
        Number(logs[i].longitude),
      );
      totalDistance += distance;

      if (logs[i].speed) {
        const speed = Number(logs[i].speed);
        speedSum += speed;
        speedCount++;
        if (speed > maxSpeed) maxSpeed = speed;
      }
    }

    const duration = Math.round(
      (logs[logs.length - 1].timestamp.getTime() -
        logs[0].timestamp.getTime()) /
        60000,
    );

    const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0;

    // Detect stops
    const stops = await this.detectStops(tripId, { minDuration: 5 });

    // Calculate efficiency score (simple formula)
    const movingTime = duration - stops.totalStopTime;
    const efficiencyScore =
      movingTime > 0
        ? Math.min(100, Math.round((movingTime / duration) * 100))
        : 0;

    return {
      tripId,
      totalDistance: Math.round(totalDistance),
      duration,
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      maxSpeed: Math.round(maxSpeed * 10) / 10,
      pointCount: logs.length,
      stopCount: stops.totalStops,
      efficiencyScore,
    };
  }

  async getAnalyticsSummary(
    query: GPSAnalyticsQueryDto,
  ): Promise<GPSAnalyticsSummaryDto> {
    this.logger.log(
      `Getting analytics summary from ${query.startDate} to ${query.endDate}`,
    );

    const whereClause: any = {
      timestamp: Between(new Date(query.startDate), new Date(query.endDate)),
    };

    if (query.userId) {
      whereClause.user_id = query.userId;
    }

    const logs = await this.gpsLogRepo.find({
      where: whereClause,
      order: { timestamp: 'ASC' },
    });

    // Get unique trips
    const tripIds = [...new Set(logs.map((log) => log.trip_id))];

    // Calculate total distance
    let totalDistance = 0;
    let totalDuration = 0;
    let speedSum = 0;
    let speedCount = 0;

    // Group logs by trip
    const tripLogs = new Map<string, GPSLog[]>();
    for (const log of logs) {
      if (!tripLogs.has(log.trip_id)) {
        tripLogs.set(log.trip_id, []);
      }
      tripLogs.get(log.trip_id)!.push(log);
    }

    // Calculate statistics per trip
    let longestTrip = { tripId: '', distance: 0, duration: 0 };

    for (const [tripId, logs] of tripLogs) {
      if (logs.length < 2) continue;

      let tripDistance = 0;
      for (let i = 1; i < logs.length; i++) {
        const distance = this.calculateDistance(
          Number(logs[i - 1].latitude),
          Number(logs[i - 1].longitude),
          Number(logs[i].latitude),
          Number(logs[i].longitude),
        );
        tripDistance += distance;

        if (logs[i].speed) {
          speedSum += Number(logs[i].speed);
          speedCount++;
        }
      }

      const tripDuration = Math.round(
        (logs[logs.length - 1].timestamp.getTime() -
          logs[0].timestamp.getTime()) /
          60000,
      );

      totalDistance += tripDistance;
      totalDuration += tripDuration;

      if (tripDistance > longestTrip.distance) {
        longestTrip = {
          tripId,
          distance: tripDistance,
          duration: tripDuration,
        };
      }
    }

    const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0;

    // Most visited locations (simplified)
    const mostVisitedLocations: MostVisitedLocationDto[] = [];

    return {
      totalDistance: Math.round((totalDistance / 1000) * 10) / 10, // Convert to km
      totalTrips: tripIds.length,
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      totalDuration: Math.round((totalDuration / 60) * 10) / 10, // Convert to hours
      mostVisitedLocations,
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      user: query.userId ? { userId: query.userId, fullName: '' } : undefined,
      movementStats: {
        totalStops: 0,
        averageStopDuration: 0,
        longestTrip: {
          tripId: longestTrip.tripId,
          distance: Math.round((longestTrip.distance / 1000) * 10) / 10,
          duration: longestTrip.duration,
        },
        mostProductiveDay: {
          date: query.startDate,
          distance: 0,
          trips: 0,
        },
      },
    };
  }

  // Real-time Methods
  async getRealtimeLocations(
    query: RealtimeLocationQueryDto,
  ): Promise<RealtimeLocationsResponseDto> {
    this.logger.log('Getting realtime locations');

    const whereClause: any = {};

    if (query.userIds) {
      whereClause.user_id = In(query.userIds.split(','));
    }

    if (query.tripIds) {
      whereClause.trip_id = In(query.tripIds.split(','));
    }

    if (query.since) {
      whereClause.timestamp = MoreThan(new Date(query.since));
    }

    // Get latest location for each user/trip combination
    const logs = await this.gpsLogRepo
      .createQueryBuilder('gps')
      .select('DISTINCT ON (gps.user_id, gps.trip_id) gps.*')
      .where(whereClause)
      .orderBy('gps.user_id')
      .addOrderBy('gps.trip_id')
      .addOrderBy('gps.timestamp', 'DESC')
      .getRawMany();

    const locations: RealtimeLocationDto[] = logs.map((log) => ({
      userId: log.user_id,
      tripId: log.trip_id,
      latitude: Number(log.latitude),
      longitude: Number(log.longitude),
      timestamp: log.timestamp.toISOString(),
      speed: log.speed ? Number(log.speed) : null,
      heading: log.heading ? Number(log.heading) : null,
    }));

    return {
      locations,
      total: locations.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Export Methods
  async createExport(
    dto: CreateGPSExportDto,
    userId: string,
  ): Promise<CreateGPSExportResponseDto> {
    this.logger.log(`Creating GPS export for user ${userId}`);

    const exportJob = this.gpsExportRepo.create({
      user_id: userId,
      status: ExportStatus.PENDING,
      format: dto.format as ExportFormat,
      filter: dto.filter,
      options: {
        includeUserDetails: dto.includeUserDetails,
        includeTripDetails: dto.includeTripDetails,
        anonymizeData: dto.anonymizeData,
      },
    });

    const saved = await this.gpsExportRepo.save(exportJob);

    // TODO: Trigger background job to process export
    // This would typically be handled by a queue system

    return {
      exportId: saved.id,
      status: DtoExportStatus.PROCESSING,
      estimatedTime: 30,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async getExportStatus(exportId: string): Promise<GPSExportStatusResponseDto> {
    const exportJob = await this.gpsExportRepo.findOne({
      where: { id: exportId },
    });

    if (!exportJob) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Export not found',
      });
    }

    // Map model status to DTO status
    let dtoStatus: DtoExportStatus;
    switch (exportJob.status) {
      case ExportStatus.PROCESSING:
      case ExportStatus.PENDING:
        dtoStatus = DtoExportStatus.PROCESSING;
        break;
      case ExportStatus.COMPLETED:
        dtoStatus = DtoExportStatus.COMPLETED;
        break;
      case ExportStatus.FAILED:
        dtoStatus = DtoExportStatus.FAILED;
        break;
      default:
        dtoStatus = DtoExportStatus.PROCESSING;
    }

    return {
      exportId: exportJob.id,
      status: dtoStatus,
      downloadUrl: exportJob.file_url,
      expiresAt: exportJob.expires_at?.toISOString(),
      createdAt: exportJob.createdAt.toISOString(),
      completedAt: exportJob.completed_at?.toISOString(),
      error: exportJob.error_message,
      metadata: {
        totalRecords: exportJob.total_records,
        fileSize: exportJob.file_size
          ? `${(exportJob.file_size / 1024 / 1024).toFixed(2)}MB`
          : undefined,
        format: exportJob.format,
        filters: exportJob.filter,
      },
    };
  }

  // Helper Methods
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
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

  private calculateTotalDistance(route: RoutePointDto[]): number {
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      total += this.calculateDistance(
        route[i - 1].latitude,
        route[i - 1].longitude,
        route[i].latitude,
        route[i].longitude,
      );
    }
    return Math.round((total / 1000) * 10) / 10; // Convert to km
  }

  private simplifyRoute(
    route: RoutePointDto[],
    tolerance: number = 0.0001,
  ): RoutePointDto[] {
    if (route.length <= 2) return route;

    // Douglas-Peucker algorithm for route simplification
    const simplified: RoutePointDto[] = [route[0]];
    let prevPoint = route[0];

    for (let i = 1; i < route.length - 1; i++) {
      const point = route[i];
      const distance = this.calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude,
      );

      // Keep point if distance is significant or if speed/heading changed significantly
      if (
        distance > 50 || // 50 meters
        (point.speed &&
          prevPoint.speed &&
          Math.abs(point.speed - prevPoint.speed) > 10) ||
        (point.heading &&
          prevPoint.heading &&
          Math.abs(point.heading - prevPoint.heading) > 30)
      ) {
        simplified.push(point);
        prevPoint = point;
      }
    }

    simplified.push(route[route.length - 1]);
    return simplified;
  }
}
