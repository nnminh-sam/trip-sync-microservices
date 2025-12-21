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
}
