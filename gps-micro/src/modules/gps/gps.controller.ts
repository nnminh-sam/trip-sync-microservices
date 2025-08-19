import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GpsService } from './gps.service';
import { GPSMessagePattern } from './gps-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import {
  TrackGPSDto,
  BatchTrackGPSDto,
} from './dtos/track-gps.dto';
import {
  CheckInDto,
  CheckOutDto,
} from './dtos/check-in-out.dto';
import {
  ValidateLocationDto,
  NearbyLocationsQueryDto,
  BatchValidateLocationDto,
} from './dtos/geofencing.dto';
import {
  RouteQueryDto,
  StopQueryDto,
} from './dtos/route-history.dto';
import {
  RealtimeLocationQueryDto,
} from './dtos/realtime-monitoring.dto';
import {
  GPSAnalyticsQueryDto,
} from './dtos/analytics.dto';
import {
  CreateGPSExportDto,
} from './dtos/gps-export.dto';

@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  // GPS Tracking
  @MessagePattern(GPSMessagePattern.trackGPS)
  async trackGPS(@Payload() payload: MessagePayloadDto<TrackGPSDto>) {
    const userId = payload.claims.sub;
    return await this.gpsService.trackGPS(payload.request.body, userId);
  }

  @MessagePattern(GPSMessagePattern.batchTrackGPS)
  async batchTrackGPS(@Payload() payload: MessagePayloadDto<BatchTrackGPSDto>) {
    const userId = payload.claims.sub;
    return await this.gpsService.batchTrackGPS(payload.request.body, userId);
  }

  @MessagePattern(GPSMessagePattern.getTripRoute)
  async getTripRoute(@Payload() payload: MessagePayloadDto<RouteQueryDto>) {
    const { id } = payload.request.path;
    return await this.gpsService.getTripRoute(id, payload.request.body || {});
  }

  // Check-in/Check-out
  @MessagePattern(GPSMessagePattern.checkIn)
  async checkIn(@Payload() payload: MessagePayloadDto<CheckInDto>) {
    const userId = payload.claims.sub;
    return await this.gpsService.checkIn(payload.request.body, userId, payload.claims);
  }

  @MessagePattern(GPSMessagePattern.checkOut)
  async checkOut(@Payload() payload: MessagePayloadDto<CheckOutDto>) {
    const userId = payload.claims.sub;
    return await this.gpsService.checkOut(payload.request.body, userId, payload.claims);
  }

  // Route Analysis
  @MessagePattern(GPSMessagePattern.detectStops)
  async detectStops(@Payload() payload: MessagePayloadDto<StopQueryDto>) {
    const { id } = payload.request.path;
    return await this.gpsService.detectStops(id, payload.request.body || {});
  }

  @MessagePattern(GPSMessagePattern.getRouteStatistics)
  async getRouteStatistics(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    return await this.gpsService.getTripStatistics(id);
  }

  // Analytics
  @MessagePattern(GPSMessagePattern.getTripStatistics)
  async getTripStatistics(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    return await this.gpsService.getTripStatistics(id);
  }

  @MessagePattern(GPSMessagePattern.getAnalyticsSummary)
  async getAnalyticsSummary(@Payload() payload: MessagePayloadDto<GPSAnalyticsQueryDto>) {
    return await this.gpsService.getAnalyticsSummary(payload.request.body);
  }

  // Real-time
  @MessagePattern(GPSMessagePattern.getRealtimeLocations)
  async getRealtimeLocations(@Payload() payload: MessagePayloadDto<RealtimeLocationQueryDto>) {
    return await this.gpsService.getRealtimeLocations(payload.request.body || {});
  }

  // Export
  @MessagePattern(GPSMessagePattern.createExport)
  async createExport(@Payload() payload: MessagePayloadDto<CreateGPSExportDto>) {
    const userId = payload.claims.sub;
    return await this.gpsService.createExport(payload.request.body, userId);
  }

  @MessagePattern(GPSMessagePattern.getExportStatus)
  async getExportStatus(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    return await this.gpsService.getExportStatus(id);
  }

  // Health
  @MessagePattern(GPSMessagePattern.health)
  async health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'gps-micro',
    };
  }
}