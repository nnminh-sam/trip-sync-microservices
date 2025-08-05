import { HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocationDto } from 'src/modules/location/dtos/create-location.dto';
import { FilterLocationDto } from 'src/modules/location/dtos/filter-location.dto';
import { UpdateLocationDto } from 'src/modules/location/dtos/update-location.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { ILike, Repository, In } from 'typeorm';
import { Location } from 'src/models/location.model';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { LocationRepository } from './location.repository';
import {
  ValidationResult,
  DistanceResult,
  LocationBoundary,
  GeoBounds,
  LocationType,
} from 'src/types/location.types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger(LocationService.name);
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @Inject(LocationRepository)
    private readonly customLocationRepository: LocationRepository,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(payload: CreateLocationDto) {
    try {
      const location = this.locationRepository.create(payload);

      // Set spatial data
      if (location.latitude && location.longitude) {
        location.geom = {
          x: location.longitude,
          y: location.latitude,
        };
      }

      const createdLocation = await this.locationRepository.save(location);

      // Clear relevant caches
      await this.clearLocationCaches();

      return createdLocation;
    } catch (error: any) {
      this.logger.error('Cannot create location:', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async findAll(payload: FilterLocationDto) {
    const {
      page,
      size,
      order,
      sortBy,
      name,
      latitude,
      longitude,
      location,
      createdBy,
    } = payload;

    const [locations, total] = await this.locationRepository.findAndCount({
      where: {
        ...(name && { name: ILike(`%${name}%`) }),
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        ...(location && { location: ILike(`%${location}%`) }),
        ...(createdBy && { createdBy }),
        isActive: true, // Only return active locations by default
      },
      ...paginateAndOrder({
        page,
        size,
        order,
        sortBy,
      }),
    });

    return ListDataDto.build<Location>({
      data: locations,
      total,
      page,
      size,
    });
  }

  async findOne(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
    });

    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found',
      });
    }

    return location;
  }

  async update(id: string, payload: UpdateLocationDto) {
    const existingLocation = await this.findOne(id);

    Object.assign(existingLocation, payload);

    // Update spatial data if coordinates changed
    if (payload.latitude !== undefined || payload.longitude !== undefined) {
      existingLocation.geom = {
        x: existingLocation.longitude,
        y: existingLocation.latitude,
      };
    }
    try {
      const updatedLocation =
        await this.locationRepository.save(existingLocation);

      // Clear caches
      await this.clearLocationCaches(id);

      return updatedLocation;
    } catch (error: any) {
      this.logger.error('Cannot update location:', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async delete(id: string) {
    const existingLocation = await this.findOne(id);
    try {
      // Soft delete by setting isActive to false
      existingLocation.isActive = false;
      await this.locationRepository.save(existingLocation);

      // Clear caches
      await this.clearLocationCaches(id);

      return { success: true, message: 'Location deactivated successfully' };
    } catch (error: any) {
      this.logger.error('Cannot delete location:', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  // New spatial validation methods
  async validateCoordinatesInRadius(
    latitude: number,
    longitude: number,
    locationId: string,
  ): Promise<ValidationResult> {
    const location = await this.findOne(locationId);

    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found',
      });
    }

    const distance = await this.customLocationRepository.calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );

    const isValid = distance <= location.offsetRadious;

    return {
      isValid,
      distance,
      maxRadius: location.offsetRadious,
      locationName: location.name,
      message: isValid
        ? 'Coordinates are within location radius'
        : `Coordinates are ${Math.round(distance - location.offsetRadious)}m outside location radius`,
    };
  }

  async findLocationsWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType,
  ): Promise<Location[]> {
    return this.customLocationRepository.findLocationsWithinRadius(
      latitude,
      longitude,
      radiusMeters,
      type,
    );
  }

  async findNearbyLocationsCached(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: LocationType,
  ): Promise<Location[]> {
    const cacheKey = `nearby:${latitude}:${longitude}:${radiusMeters}:${type || 'all'}`;
    const cached = await this.cacheManager.get<Location[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for nearby locations`);
      return cached;
    }

    const locations = await this.findLocationsWithinRadius(
      latitude,
      longitude,
      radiusMeters,
      type,
    );

    await this.cacheManager.set(cacheKey, locations, 300); // 5 minutes TTL
    return locations;
  }

  // Batch operations
  async findLocationsByIds(
    ids: string[],
    includeInactive = false,
  ): Promise<Location[]> {
    const where: any = { id: In(ids) };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.locationRepository.find({ where });
  }

  async getLocationBoundaries(
    locationIds: string[],
  ): Promise<LocationBoundary[]> {
    const locations = await this.findLocationsByIds(locationIds);

    return locations.map((location) => ({
      id: location.id,
      name: location.name,
      center: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      radius: location.offsetRadious,
      boundary: location.boundary,
      type: location.type,
    }));
  }

  // Distance calculations
  async calculateDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<number> {
    return this.customLocationRepository.calculateDistance(
      fromLat,
      fromLng,
      toLat,
      toLng,
    );
  }

  async getDistanceFromLocation(
    latitude: number,
    longitude: number,
    locationId: string,
  ): Promise<DistanceResult> {
    const location = await this.findOne(locationId);

    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found',
      });
    }

    const distance = await this.calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );

    return {
      locationId,
      locationName: location.name,
      distance,
      unit: 'meters',
      isWithinRadius: distance <= location.offsetRadious,
    };
  }

  // Cached operations
  async findOneCached(id: string): Promise<Location> {
    const cacheKey = `location:${id}`;
    const cached = await this.cacheManager.get<Location>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for location ${id}`);
      return cached;
    }

    const location = await this.findOne(id);

    if (location) {
      await this.cacheManager.set(cacheKey, location, 3600); // 1 hour TTL
    }

    return location;
  }

  // Advanced spatial queries
  async findLocationsInArea(
    bounds: GeoBounds,
    options: { page: number; size: number; type?: LocationType },
  ): Promise<{ data: Location[]; total: number }> {
    const locations =
      await this.customLocationRepository.findLocationsInBoundingBox(
        bounds.minLat,
        bounds.minLng,
        bounds.maxLat,
        bounds.maxLng,
        options.type,
      );

    // Apply pagination
    const start = (options.page - 1) * options.size;
    const end = start + options.size;
    const paginatedData = locations.slice(start, end);

    return {
      data: paginatedData,
      total: locations.length,
    };
  }

  async findNearestLocations(
    latitude: number,
    longitude: number,
    limit: number = 10,
    maxDistance?: number,
  ): Promise<Location[]> {
    return this.customLocationRepository.findNearestLocations(
      latitude,
      longitude,
      limit,
      maxDistance,
    );
  }

  async isPointInLocationBoundary(
    latitude: number,
    longitude: number,
    locationId: string,
  ): Promise<boolean> {
    return this.customLocationRepository.isPointInLocationBoundary(
      latitude,
      longitude,
      locationId,
    );
  }

  // Cache management
  private async clearLocationCaches(locationId?: string) {
    if (locationId) {
      await this.cacheManager.del(`location:${locationId}`);
    }

    // Clear all nearby caches (simple implementation)
    // Note: Direct access to cache keys is not available in newer versions
    // This is a simplified approach that clears specific patterns
    try {
      // Since we can't enumerate keys directly, we'll need to manage cache invalidation differently
      // For now, we'll just log the warning and rely on TTL for cache expiration
      this.logger.debug('Cache invalidation triggered - relying on TTL for nearby cache expiration');
    } catch (error) {
      this.logger.warn('Unable to clear nearby caches:', error);
    }
  }

  // Health check
  async getHealthStatus() {
    return this.customLocationRepository.getHealthStatus();
  }
}
