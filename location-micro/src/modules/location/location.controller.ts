import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { 
  CreateLocationDto,
  UpdateLocationDto,
  FilterLocationDto,
  ValidateCoordinatesDto,
  BatchLocationQueryDto,
  NearbyLocationQueryDto,
  DistanceQueryDto,
} from 'src/modules/location/dtos';
import { LocationMessagePattern } from 'src/modules/location/location-message.pattern';
import { LocationService } from 'src/modules/location/location.service';
import { LocationType } from 'src/types/location.types';
import { throwRpcException } from 'src/utils';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ==================== CRUD Operations ====================
  
  @MessagePattern(LocationMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateLocationDto>) {
    return await this.locationService.create(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.findAll)
  async findAll(@Payload() payload: MessagePayloadDto<FilterLocationDto>) {
    return await this.locationService.findAll(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.findOne)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;

    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID is required',
      });
    }

    return await this.locationService.findOne(id);
  }

  @MessagePattern(LocationMessagePattern.update)
  async update(@Payload() payload: MessagePayloadDto<UpdateLocationDto>) {
    const { id } = payload.request.path;

    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID is required',
      });
    }
    return await this.locationService.update(id, payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.delete)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;

    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID is required',
      });
    }
    return await this.locationService.delete(id);
  }

  // ==================== Check-in/Check-out Operations ====================
  
  @MessagePattern(LocationMessagePattern.validateCoordinates)
  async validateCoordinates(@Payload() payload: MessagePayloadDto<ValidateCoordinatesDto>) {
    const { locationId, latitude, longitude } = payload.request.body;
    
    if (!locationId || latitude === undefined || longitude === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID, latitude, and longitude are required',
      });
    }

    return await this.locationService.validateCoordinatesInRadius(
      latitude,
      longitude,
      locationId,
    );
  }

  @MessagePattern(LocationMessagePattern.validateBatch)
  async validateBatch(@Payload() payload: MessagePayloadDto<BatchLocationQueryDto>) {
    const { locations } = payload.request.body;
    
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Locations array is required and must not be empty',
      });
    }

    const results = await Promise.all(
      locations.map(async (loc) => {
        try {
          const result = await this.locationService.validateCoordinatesInRadius(
            loc.latitude,
            loc.longitude,
            loc.locationId,
          );
          return { locationId: loc.locationId, ...result };
        } catch (error) {
          return {
            locationId: loc.locationId,
            isValid: false,
            error: error.message,
          };
        }
      }),
    );

    return { results };
  }

  // ==================== GPS and Distance Operations ====================
  
  @MessagePattern(LocationMessagePattern.findNearby)
  async findNearby(@Payload() payload: MessagePayloadDto<NearbyLocationQueryDto>) {
    const { latitude, longitude, radius, type } = payload.request.body;
    
    if (latitude === undefined || longitude === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Latitude and longitude are required',
      });
    }

    return await this.locationService.findNearbyLocationsCached(
      latitude,
      longitude,
      radius || 1000,
      type,
    );
  }

  @MessagePattern(LocationMessagePattern.findWithinRadius)
  async findWithinRadius(@Payload() payload: MessagePayloadDto<NearbyLocationQueryDto>) {
    const { latitude, longitude, radius, includeInactive } = payload.request.body;
    
    if (latitude === undefined || longitude === undefined || !radius) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Latitude, longitude, and radius are required',
      });
    }

    return await this.locationService.findLocationsWithinRadius(
      latitude,
      longitude,
      radius,
      includeInactive ? undefined : undefined, // type parameter, not includeInactive
    );
  }

  @MessagePattern(LocationMessagePattern.calculateDistance)
  async calculateDistance(@Payload() payload: MessagePayloadDto<DistanceQueryDto>) {
    const { fromLat, fromLng, toLat, toLng } = payload.request.body;
    
    if (fromLat === undefined || fromLng === undefined || 
        toLat === undefined || toLng === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'All coordinates (fromLat, fromLng, toLat, toLng) are required',
      });
    }

    return await this.locationService.calculateDistance(
      fromLat,
      fromLng,
      toLat,
      toLng,
    );
  }

  @MessagePattern(LocationMessagePattern.getDistanceFromLocation)
  async getDistanceFromLocation(@Payload() payload: MessagePayloadDto<{ locationId: string; latitude: number; longitude: number }>) {
    const { locationId, latitude, longitude } = payload.request.body;
    
    if (!locationId || latitude === undefined || longitude === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID, latitude, and longitude are required',
      });
    }

    return await this.locationService.getDistanceFromLocation(
      latitude,
      longitude,
      locationId,
    );
  }

  // ==================== Area and Boundary Operations ====================
  
  @MessagePattern(LocationMessagePattern.findInArea)
  async findInArea(@Payload() payload: MessagePayloadDto<{ bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }; type?: LocationType }>) {
    const { bounds, type } = payload.request.body;
    
    if (!bounds || !bounds.minLat || !bounds.minLng || !bounds.maxLat || !bounds.maxLng) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bounds with minLat, minLng, maxLat, and maxLng are required',
      });
    }

    return await this.locationService.findLocationsInArea(bounds, { page: 1, size: 100, type });
  }

  @MessagePattern(LocationMessagePattern.findNearest)
  async findNearest(@Payload() payload: MessagePayloadDto<{ latitude: number; longitude: number; limit?: number; type?: LocationType }>) {
    const { latitude, longitude, limit = 5 } = payload.request.body;
    
    if (latitude === undefined || longitude === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Latitude and longitude are required',
      });
    }

    return await this.locationService.findNearestLocations(
      latitude,
      longitude,
      limit,
      undefined, // maxDistance parameter
    );
  }

  @MessagePattern(LocationMessagePattern.isPointInBoundary)
  async isPointInBoundary(@Payload() payload: MessagePayloadDto<{ locationId: string; latitude: number; longitude: number }>) {
    const { locationId, latitude, longitude } = payload.request.body;
    
    if (!locationId || latitude === undefined || longitude === undefined) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Location ID, latitude, and longitude are required',
      });
    }

    return await this.locationService.isPointInLocationBoundary(
      latitude,
      longitude,
      locationId,
    );
  }

  @MessagePattern(LocationMessagePattern.getBoundaries)
  async getBoundaries(@Payload() payload: MessagePayloadDto<{ locationIds?: string[]; type?: LocationType }>) {
    const { locationIds } = payload.request.body || {};
    
    return await this.locationService.getLocationBoundaries(locationIds || []);
  }

  // ==================== Batch Operations ====================
  
  @MessagePattern(LocationMessagePattern.findByIds)
  async findByIds(@Payload() payload: MessagePayloadDto<{ ids: string[] }>) {
    const { ids } = payload.request.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'IDs array is required and must not be empty',
      });
    }

    return await this.locationService.findLocationsByIds(ids);
  }

  // ==================== Health Check ====================
  
  @MessagePattern(LocationMessagePattern.health)
  async health() {
    return await this.locationService.getHealthStatus();
  }
}