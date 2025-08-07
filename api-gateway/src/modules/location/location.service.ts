import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateLocationDto } from './dtos/create-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { ValidateCoordinatesDto } from './dtos/validate-coordinates.dto';
import { NearbyLocationQueryDto } from './dtos/nearby-location-query.dto';
import { DistanceQueryDto } from './dtos/distance-query.dto';
import { LocationMessagePattern } from './location-message.pattern';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger(LocationService.name);
  private readonly sender: NatsClientSender<typeof LocationMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, LocationMessagePattern);
  }

  // ==================== CRUD Operations ====================

  async create(claims: TokenClaimsDto, createLocationDto: CreateLocationDto) {
    this.logger.log(
      `create called with payload: ${JSON.stringify(createLocationDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: {
            body: {
              ...createLocationDto,
              createdBy: claims.sub, // Add creator ID from claims
            },
          },
        },
      });
      this.logger.log(`create success for location: ${createLocationDto.name}`);
      return result;
    } catch (error) {
      this.logger.error(
        `create failed for location: ${createLocationDto.name}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filterLocationDto: FilterLocationDto) {
    this.logger.log(
      `findAll called with filters: ${JSON.stringify(filterLocationDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findAll',
        payload: {
          claims,
          request: { body: filterLocationDto },
        },
      });
      this.logger.log('findAll success');
      return result;
    } catch (error) {
      this.logger.error('findAll failed', error.stack || error);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`findOne called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findOne',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`findOne success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`findOne failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async update(
    claims: TokenClaimsDto,
    id: string,
    updateLocationDto: UpdateLocationDto,
  ) {
    this.logger.log(`update called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'update',
        payload: {
          claims,
          request: {
            path: { id },
            body: updateLocationDto,
          },
        },
      });
      this.logger.log(`update success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`update failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async delete(claims: TokenClaimsDto, id: string) {
    this.logger.log(`delete called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'delete',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`delete success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`delete failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  // ==================== Check-in/Check-out Operations ====================

  async validateCoordinates(
    claims: TokenClaimsDto,
    validateDto: ValidateCoordinatesDto,
  ) {
    this.logger.log(
      `validateCoordinates called for location: ${validateDto.locationId}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'validateCoordinates',
        payload: {
          claims,
          request: { body: validateDto },
        },
      });
      this.logger.log(
        `validateCoordinates success for location: ${validateDto.locationId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `validateCoordinates failed for location: ${validateDto.locationId}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async validateBatch(
    claims: TokenClaimsDto,
    locations: Array<ValidateCoordinatesDto>,
  ) {
    this.logger.log(`validateBatch called for ${locations.length} locations`);
    try {
      const result = await this.sender.send({
        messagePattern: 'validateBatch',
        payload: {
          claims,
          request: { body: { locations } },
        },
      });
      this.logger.log(
        `validateBatch success for ${locations.length} locations`,
      );
      return result;
    } catch (error) {
      this.logger.error('validateBatch failed', error.stack || error);
      throw error;
    }
  }

  // ==================== GPS and Distance Operations ====================

  async findNearby(claims: TokenClaimsDto, nearbyDto: NearbyLocationQueryDto) {
    this.logger.log(
      `findNearby called for coordinates: ${nearbyDto.latitude}, ${nearbyDto.longitude}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findNearby',
        payload: {
          claims,
          request: { body: nearbyDto },
        },
      });
      this.logger.log('findNearby success');
      return result;
    } catch (error) {
      this.logger.error('findNearby failed', error.stack || error);
      throw error;
    }
  }

  async findWithinRadius(
    claims: TokenClaimsDto,
    latitude: number,
    longitude: number,
    radius: number,
    includeInactive?: boolean,
  ) {
    this.logger.log(
      `findWithinRadius called: ${latitude}, ${longitude}, radius: ${radius}m`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findWithinRadius',
        payload: {
          claims,
          request: {
            body: { latitude, longitude, radius, includeInactive },
          },
        },
      });
      this.logger.log('findWithinRadius success');
      return result;
    } catch (error) {
      this.logger.error('findWithinRadius failed', error.stack || error);
      throw error;
    }
  }

  async calculateDistance(
    claims: TokenClaimsDto,
    distanceDto: DistanceQueryDto,
  ) {
    this.logger.log(`calculateDistance called`);
    try {
      const result = await this.sender.send({
        messagePattern: 'calculateDistance',
        payload: {
          claims,
          request: { body: distanceDto },
        },
      });
      this.logger.log('calculateDistance success');
      return result;
    } catch (error) {
      this.logger.error('calculateDistance failed', error.stack || error);
      throw error;
    }
  }

  async getDistanceFromLocation(
    claims: TokenClaimsDto,
    locationId: string,
    latitude: number,
    longitude: number,
  ) {
    this.logger.log(
      `getDistanceFromLocation called for location: ${locationId}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'getDistanceFromLocation',
        payload: {
          claims,
          request: { body: { locationId, latitude, longitude } },
        },
      });
      this.logger.log(
        `getDistanceFromLocation success for location: ${locationId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `getDistanceFromLocation failed for location: ${locationId}`,
        error.stack || error,
      );
      throw error;
    }
  }

  // ==================== Area and Boundary Operations ====================

  async findInArea(
    claims: TokenClaimsDto,
    bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number },
    type?: string,
  ) {
    this.logger.log(`findInArea called for bounds: ${JSON.stringify(bounds)}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findInArea',
        payload: {
          claims,
          request: { body: { bounds, type } },
        },
      });
      this.logger.log('findInArea success');
      return result;
    } catch (error) {
      this.logger.error('findInArea failed', error.stack || error);
      throw error;
    }
  }

  async findNearest(
    claims: TokenClaimsDto,
    latitude: number,
    longitude: number,
    limit: number = 5,
  ) {
    this.logger.log(
      `findNearest called for coordinates: ${latitude}, ${longitude}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findNearest',
        payload: {
          claims,
          request: { body: { latitude, longitude, limit } },
        },
      });
      this.logger.log('findNearest success');
      return result;
    } catch (error) {
      this.logger.error('findNearest failed', error.stack || error);
      throw error;
    }
  }

  async isPointInBoundary(
    claims: TokenClaimsDto,
    locationId: string,
    latitude: number,
    longitude: number,
  ) {
    this.logger.log(`isPointInBoundary called for location: ${locationId}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'isPointInBoundary',
        payload: {
          claims,
          request: { body: { locationId, latitude, longitude } },
        },
      });
      this.logger.log(`isPointInBoundary success for location: ${locationId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `isPointInBoundary failed for location: ${locationId}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async getBoundaries(claims: TokenClaimsDto, locationIds?: string[]) {
    this.logger.log(
      `getBoundaries called for ${locationIds?.length || 'all'} locations`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'getBoundaries',
        payload: {
          claims,
          request: { body: { locationIds } },
        },
      });
      this.logger.log('getBoundaries success');
      return result;
    } catch (error) {
      this.logger.error('getBoundaries failed', error.stack || error);
      throw error;
    }
  }

  // ==================== Batch Operations ====================

  async findByIds(claims: TokenClaimsDto, ids: string[]) {
    this.logger.log(`findByIds called for ${ids.length} locations`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findByIds',
        payload: {
          claims,
          request: { body: { ids } },
        },
      });
      this.logger.log(`findByIds success for ${ids.length} locations`);
      return result;
    } catch (error) {
      this.logger.error('findByIds failed', error.stack || error);
      throw error;
    }
  }

  // ==================== Health Check ====================

  async health() {
    this.logger.log('health check called');
    try {
      const result = await this.sender.send({
        messagePattern: 'health',
        payload: {},
      });
      this.logger.log('health check success');
      return result;
    } catch (error) {
      this.logger.error('health check failed', error.stack || error);
      throw error;
    }
  }
}
