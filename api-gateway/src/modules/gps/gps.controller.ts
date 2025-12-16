import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { GpsService } from './gps.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { TrackGPSDto, BatchTrackGPSDto } from './dtos/track-gps.dto';
import { CheckInDto, CheckOutDto } from './dtos/check-in-out.dto';
import {
  RouteQueryDto,
  StopQueryDto,
  TripRouteResponseDto,
  TripStopsResponseDto,
} from './dtos/route-history.dto';
import {
  GPSAnalyticsQueryDto,
  GPSAnalyticsSummaryDto,
  TripStatisticsDto,
} from './dtos/analytics.dto';
import {
  CreateGPSExportDto,
  CreateGPSExportResponseDto,
  GPSExportStatusResponseDto,
} from './dtos/gps-export.dto';
import {
  RealtimeLocationQueryDto,
  RealtimeLocationsResponseDto,
} from './dtos/realtime-monitoring.dto';
import { PublicRequest } from 'src/common/decorators/public-request.decorator';

@ApiTags('GPS')
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  // GPS Tracking
  @Post('track')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track GPS location for a trip' })
  @ApiResponseConstruction({
    status: 201,
    description: 'GPS location tracked successfully',
  })
  @ApiBody({ type: TrackGPSDto })
  async trackGPS(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: TrackGPSDto,
  ) {
    return await this.gpsService.trackGPS(claims, dto);
  }

  @Post('track/batch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch track GPS locations for a trip' })
  @ApiResponseConstruction({
    status: 201,
    description: 'GPS locations tracked successfully',
  })
  @ApiBody({ type: BatchTrackGPSDto })
  async batchTrackGPS(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: BatchTrackGPSDto,
  ) {
    return await this.gpsService.batchTrackGPS(claims, dto);
  }

  @Get('trips/:tripId/route')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trip route history' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip route retrieved successfully',
    model: TripRouteResponseDto,
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  async getTripRoute(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('tripId') tripId: string,
    @Query() query: RouteQueryDto,
  ) {
    return await this.gpsService.getTripRoute(claims, tripId, query);
  }

  // Check-in/Check-out
  @Post('check-in')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in at a trip location' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Checked in successfully',
  })
  @ApiBody({ type: CheckInDto })
  async checkIn(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CheckInDto,
  ) {
    return await this.gpsService.checkIn(claims, dto);
  }

  @Post('check-out')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check out from a trip location' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Checked out successfully',
  })
  @ApiBody({ type: CheckOutDto })
  async checkOut(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CheckOutDto,
  ) {
    return await this.gpsService.checkOut(claims, dto);
  }

  // Route Analysis
  @Get('trips/:tripId/stops')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect stops in a trip' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Stops detected successfully',
    model: TripStopsResponseDto,
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  async detectStops(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('tripId') tripId: string,
    @Query() query: StopQueryDto,
  ) {
    return await this.gpsService.detectStops(claims, tripId, query);
  }

  @Get('trips/:tripId/statistics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trip GPS statistics' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip statistics retrieved successfully',
    model: TripStatisticsDto,
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  async getTripStatistics(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('tripId') tripId: string,
  ) {
    return await this.gpsService.getTripStatistics(claims, tripId);
  }

  // Analytics
  @Get('analytics/summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get GPS analytics summary' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Analytics summary retrieved successfully',
    model: GPSAnalyticsSummaryDto,
  })
  async getAnalyticsSummary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() query: GPSAnalyticsQueryDto,
  ) {
    return await this.gpsService.getAnalyticsSummary(claims, query);
  }

  // Real-time Monitoring
  @Get('realtime/locations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time locations' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Real-time locations retrieved successfully',
    model: RealtimeLocationsResponseDto,
  })
  async getRealtimeLocations(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() query: RealtimeLocationQueryDto,
  ) {
    return await this.gpsService.getRealtimeLocations(claims, query);
  }

  // Export
  @Post('export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create GPS data export' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Export job created successfully',
    model: CreateGPSExportResponseDto,
  })
  @ApiBody({ type: CreateGPSExportDto })
  async createExport(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CreateGPSExportDto,
  ) {
    return await this.gpsService.createExport(claims, dto);
  }

  @Get('export/:exportId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get export job status' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Export status retrieved successfully',
    model: GPSExportStatusResponseDto,
  })
  @ApiParam({ name: 'exportId', description: 'Export job ID' })
  async getExportStatus(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('exportId') exportId: string,
  ) {
    return await this.gpsService.getExportStatus(claims, exportId);
  }

  // GPS Logs
  @Get('logs')
  // @PublicRequest()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query GPS logs for a trip' })
  @ApiResponseConstruction({
    status: 200,
    description: 'GPS logs retrieved successfully',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'tripId',
    required: true,
    description: 'Trip ID',
  })
  @ApiQuery({
    name: 'beginDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return (default: 100, max: 1000)',
  })
  async queryGpsLogs(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query('userId') userId: string,
    @Query('tripId') tripId: string,
    @Query('beginDate') beginDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.gpsService.queryGpsLogs(
      claims,
      userId,
      tripId,
      beginDate,
      endDate,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  // Health Check
  @Get('health')
  @ApiOperation({ summary: 'GPS service health check' })
  @ApiResponseConstruction({
    status: 200,
    description: 'GPS service is healthy',
  })
  async health() {
    return await this.gpsService.health();
  }
}
