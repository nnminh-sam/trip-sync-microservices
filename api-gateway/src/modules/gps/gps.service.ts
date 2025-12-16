import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { GPSMessagePattern } from './gps-message.pattern';
import { NatsClientSender } from 'src/utils';
import {
  TrackGPSDto,
  BatchTrackGPSDto,
} from './dtos/track-gps.dto';
import {
  CheckInDto,
  CheckOutDto,
} from './dtos/check-in-out.dto';
import {
  RouteQueryDto,
  StopQueryDto,
} from './dtos/route-history.dto';
import {
  GPSAnalyticsQueryDto,
} from './dtos/analytics.dto';
import {
  CreateGPSExportDto,
} from './dtos/gps-export.dto';
import {
  RealtimeLocationQueryDto,
} from './dtos/realtime-monitoring.dto';

@Injectable()
export class GpsService {
  private readonly logger: Logger = new Logger(GpsService.name);
  private readonly sender: NatsClientSender<typeof GPSMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, GPSMessagePattern);
  }

  // GPS Tracking
  async trackGPS(claims: TokenClaimsDto, dto: TrackGPSDto) {
    this.logger.log(`Tracking GPS for trip ${dto.tripId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'trackGPS',
        payload: {
          claims,
          request: { body: dto },
        },
      });
      this.logger.log(`GPS tracking success for trip ${dto.tripId}`);
      return result;
    } catch (error) {
      this.logger.error(`GPS tracking failed for trip ${dto.tripId}`, error.stack);
      throw error;
    }
  }

  async batchTrackGPS(claims: TokenClaimsDto, dto: BatchTrackGPSDto) {
    this.logger.log(`Batch tracking ${dto.locations.length} GPS points for trip ${dto.tripId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'batchTrackGPS',
        payload: {
          claims,
          request: { body: dto },
        },
      });
      this.logger.log(`Batch GPS tracking success for trip ${dto.tripId}`);
      return result;
    } catch (error) {
      this.logger.error(`Batch GPS tracking failed for trip ${dto.tripId}`, error.stack);
      throw error;
    }
  }

  async getTripRoute(claims: TokenClaimsDto, tripId: string, query: RouteQueryDto) {
    this.logger.log(`Getting route for trip ${tripId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'getTripRoute',
        payload: {
          claims,
          request: {
            path: { id: tripId },
            body: query,
          },
        },
      });
      this.logger.log(`Route retrieved for trip ${tripId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get route for trip ${tripId}`, error.stack);
      throw error;
    }
  }

  // Check-in/Check-out
  async checkIn(claims: TokenClaimsDto, dto: CheckInDto) {
    this.logger.log(`Check-in at trip location ${dto.tripLocationId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'checkIn',
        payload: {
          claims,
          request: { body: dto },
        },
      });
      this.logger.log(`Check-in success at trip location ${dto.tripLocationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Check-in failed at trip location ${dto.tripLocationId}`, error.stack);
      throw error;
    }
  }

  async checkOut(claims: TokenClaimsDto, dto: CheckOutDto) {
    this.logger.log(`Check-out from trip location ${dto.tripLocationId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'checkOut',
        payload: {
          claims,
          request: { body: dto },
        },
      });
      this.logger.log(`Check-out success from trip location ${dto.tripLocationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Check-out failed from trip location ${dto.tripLocationId}`, error.stack);
      throw error;
    }
  }

  // Route Analysis
  async detectStops(claims: TokenClaimsDto, tripId: string, query: StopQueryDto) {
    this.logger.log(`Detecting stops for trip ${tripId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'detectStops',
        payload: {
          claims,
          request: {
            path: { id: tripId },
            body: query,
          },
        },
      });
      this.logger.log(`Stops detected for trip ${tripId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to detect stops for trip ${tripId}`, error.stack);
      throw error;
    }
  }

  async getTripStatistics(claims: TokenClaimsDto, tripId: string) {
    this.logger.log(`Getting statistics for trip ${tripId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'getTripStatistics',
        payload: {
          claims,
          request: {
            path: { id: tripId },
          },
        },
      });
      this.logger.log(`Statistics retrieved for trip ${tripId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get statistics for trip ${tripId}`, error.stack);
      throw error;
    }
  }

  // Analytics
  async getAnalyticsSummary(claims: TokenClaimsDto, query: GPSAnalyticsQueryDto) {
    this.logger.log(`Getting analytics summary from ${query.startDate} to ${query.endDate}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'getAnalyticsSummary',
        payload: {
          claims,
          request: { body: query },
        },
      });
      this.logger.log('Analytics summary retrieved successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to get analytics summary', error.stack);
      throw error;
    }
  }

  // Real-time
  async getRealtimeLocations(claims: TokenClaimsDto, query: RealtimeLocationQueryDto) {
    this.logger.log('Getting realtime locations');
    try {
      const result = await this.sender.send({
        messagePattern: 'getRealtimeLocations',
        payload: {
          claims,
          request: { body: query },
        },
      });
      this.logger.log('Realtime locations retrieved successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to get realtime locations', error.stack);
      throw error;
    }
  }

  // Export
  async createExport(claims: TokenClaimsDto, dto: CreateGPSExportDto) {
    this.logger.log(`Creating GPS export in ${dto.format} format`);
    try {
      const result = await this.sender.send({
        messagePattern: 'createExport',
        payload: {
          claims,
          request: { body: dto },
        },
      });
      this.logger.log(`GPS export created successfully`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create GPS export', error.stack);
      throw error;
    }
  }

  async getExportStatus(claims: TokenClaimsDto, exportId: string) {
    this.logger.log(`Getting export status for ${exportId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'getExportStatus',
        payload: {
          claims,
          request: {
            path: { id: exportId },
          },
        },
      });
      this.logger.log(`Export status retrieved for ${exportId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get export status for ${exportId}`, error.stack);
      throw error;
    }
  }

  // GPS Logs
  async queryGpsLogs(
    claims: TokenClaimsDto,
    userId: string,
    tripId: string,
    beginDate?: string,
    endDate?: string,
    limit?: number,
  ) {
    this.logger.log(
      `Querying GPS logs for userId=${userId}, tripId=${tripId}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'queryGpsLogs',
        payload: {
          claims,
          request: {
            body: {
              userId,
              tripId,
              beginDate,
              endDate,
              limit: limit || 100,
            },
          },
        },
      });
      this.logger.log(
        `GPS logs retrieved for userId=${userId}, tripId=${tripId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to query GPS logs for userId=${userId}, tripId=${tripId}`,
        error.stack,
      );
      throw error;
    }
  }

  // Health
  async health() {
    try {
      const result = await this.sender.send({
        messagePattern: 'health',
        payload: {
          request: {},
        },
      });
      return result;
    } catch (error) {
      this.logger.error('GPS service health check failed', error.stack);
      throw error;
    }
  }
}