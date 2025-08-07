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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { ValidateCoordinatesDto } from './dtos/validate-coordinates.dto';
import { DistanceQueryDto } from './dtos/distance-query.dto';
import { Location } from 'src/models';
import { NearbyLocationQueryDto } from 'src/modules/location/dtos';

@ApiTags('Location')
@Controller('locations')
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ==================== CRUD Operations ====================

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Location created successfully',
    model: Location,
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return await this.locationService.create(claims, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations with filtering' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of locations',
    model: Location,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filterDto: FilterLocationDto,
  ) {
    return await this.locationService.findAll(claims, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location details',
    model: Location,
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location updated successfully',
    model: Location,
  })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return await this.locationService.update(claims, id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location (soft delete)' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location deleted successfully',
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.delete(claims, id);
  }

  // ==================== Check-in/Check-out Operations ====================

  @Post('validate-coordinates')
  @ApiOperation({
    summary: 'Validate if coordinates are within location radius',
  })
  @ApiBody({ type: ValidateCoordinatesDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Validation result',
  })
  async validateCoordinates(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() validateDto: ValidateCoordinatesDto,
  ) {
    return await this.locationService.validateCoordinates(claims, validateDto);
  }

  @Post('validate-batch')
  @ApiOperation({ summary: 'Validate multiple locations in batch' })
  @ApiBody({
    description: 'Array of locations to validate',
    type: [ValidateCoordinatesDto],
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Batch validation results',
  })
  async validateBatch(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() locations: ValidateCoordinatesDto[],
  ) {
    return await this.locationService.validateBatch(claims, locations);
  }

  // ==================== GPS and Distance Operations ====================

  @Post('find-nearby')
  @ApiOperation({ summary: 'Find nearby locations' })
  @ApiBody({ type: NearbyLocationQueryDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of nearby locations',
    isArray: true,
  })
  async findNearby(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() nearbyDto: NearbyLocationQueryDto,
  ) {
    return await this.locationService.findNearby(claims, nearbyDto);
  }

  @Post('find-within-radius')
  @ApiOperation({ summary: 'Find locations within specific radius' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', example: 10.7769 },
        longitude: { type: 'number', example: 106.7009 },
        radius: {
          type: 'number',
          example: 1000,
          description: 'Radius in meters',
        },
        includeInactive: { type: 'boolean', default: false },
      },
      required: ['latitude', 'longitude', 'radius'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of locations within radius',
    isArray: true,
  })
  async findWithinRadius(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body()
    body: {
      latitude: number;
      longitude: number;
      radius: number;
      includeInactive?: boolean;
    },
  ) {
    return await this.locationService.findWithinRadius(
      claims,
      body.latitude,
      body.longitude,
      body.radius,
      body.includeInactive,
    );
  }

  @Post('calculate-distance')
  @ApiOperation({ summary: 'Calculate distance between two coordinates' })
  @ApiBody({ type: DistanceQueryDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Distance calculation result',
  })
  async calculateDistance(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() distanceDto: DistanceQueryDto,
  ) {
    return await this.locationService.calculateDistance(claims, distanceDto);
  }

  @Post('distance-from-location')
  @ApiOperation({ summary: 'Get distance from coordinates to a location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        locationId: { type: 'string', format: 'uuid' },
        latitude: { type: 'number', example: 10.7769 },
        longitude: { type: 'number', example: 106.7009 },
      },
      required: ['locationId', 'latitude', 'longitude'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Distance from location',
  })
  async getDistanceFromLocation(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() body: { locationId: string; latitude: number; longitude: number },
  ) {
    return await this.locationService.getDistanceFromLocation(
      claims,
      body.locationId,
      body.latitude,
      body.longitude,
    );
  }

  // ==================== Area and Boundary Operations ====================

  @Post('find-in-area')
  @ApiOperation({ summary: 'Find locations within geographical bounds' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bounds: {
          type: 'object',
          properties: {
            minLat: { type: 'number', example: 10.7 },
            minLng: { type: 'number', example: 106.6 },
            maxLat: { type: 'number', example: 10.8 },
            maxLng: { type: 'number', example: 106.8 },
          },
          required: ['minLat', 'minLng', 'maxLat', 'maxLng'],
        },
        type: {
          type: 'string',
          enum: ['office', 'client', 'warehouse', 'field', 'other'],
        },
      },
      required: ['bounds'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Locations within area',
  })
  async findInArea(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body()
    body: {
      bounds: {
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
      };
      type?: string;
    },
  ) {
    return await this.locationService.findInArea(
      claims,
      body.bounds,
      body.type,
    );
  }

  @Post('find-nearest')
  @ApiOperation({ summary: 'Find nearest locations to coordinates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', example: 10.7769 },
        longitude: { type: 'number', example: 106.7009 },
        limit: { type: 'number', example: 5, default: 5 },
      },
      required: ['latitude', 'longitude'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Nearest locations',
    isArray: true,
  })
  async findNearest(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() body: { latitude: number; longitude: number; limit?: number },
  ) {
    return await this.locationService.findNearest(
      claims,
      body.latitude,
      body.longitude,
      body.limit || 5,
    );
  }

  @Post('check-boundary')
  @ApiOperation({ summary: 'Check if point is within location boundary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        locationId: { type: 'string', format: 'uuid' },
        latitude: { type: 'number', example: 10.7769 },
        longitude: { type: 'number', example: 106.7009 },
      },
      required: ['locationId', 'latitude', 'longitude'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Boundary check result',
  })
  async isPointInBoundary(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() body: { locationId: string; latitude: number; longitude: number },
  ) {
    return await this.locationService.isPointInBoundary(
      claims,
      body.locationId,
      body.latitude,
      body.longitude,
    );
  }

  @Post('get-boundaries')
  @ApiOperation({ summary: 'Get boundaries for locations' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        locationIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Optional array of location IDs',
        },
      },
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location boundaries',
    isArray: true,
  })
  async getBoundaries(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() body: { locationIds?: string[] },
  ) {
    return await this.locationService.getBoundaries(claims, body.locationIds);
  }

  // ==================== Batch Operations ====================

  @Post('find-by-ids')
  @ApiOperation({ summary: 'Find multiple locations by IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of requested locations',
    isArray: true,
  })
  async findByIds(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() body: { ids: string[] },
  ) {
    return await this.locationService.findByIds(claims, body.ids);
  }

  // ==================== Health Check ====================

  @Get('health/status')
  @ApiOperation({ summary: 'Check location service health' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Service health status',
  })
  async health() {
    return await this.locationService.health();
  }
}
