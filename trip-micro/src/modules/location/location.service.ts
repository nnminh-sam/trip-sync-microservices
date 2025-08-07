import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import {
  CreateLocationDto,
  FilterLocationDto,
  UpdateLocationDto,
  ValidateCoordinatesDto,
  BatchLocationQueryDto,
  NearbyLocationQueryDto,
  DistanceQueryDto,
} from 'src/modules/location/dtos';
import { LocationMessagePattern } from 'src/modules/location/location-message.pattern';
import { NatsClientSender, throwRpcException } from 'src/utils';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly sender: NatsClientSender<typeof LocationMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, LocationMessagePattern);
  }

  async createLocation(claims: TokenClaimsDto, payload: CreateLocationDto) {
    try {
      return await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create location: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create location',
      });
    }
  }

  async findAllLocations(claims: TokenClaimsDto, payload: FilterLocationDto) {
    try {
      return await this.sender.send({
        messagePattern: 'findAll',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find locations: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find locations',
      });
    }
  }

  async findOneLocation(claims: TokenClaimsDto, id: string) {
    try {
      return await this.sender.send({
        messagePattern: 'findOne',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find location: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find location',
      });
    }
  }

  async updateLocation(
    claims: TokenClaimsDto,
    id: string,
    payload: UpdateLocationDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'update',
        payload: {
          claims,
          request: {
            path: { id },
            body: payload,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update location: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update location',
      });
    }
  }

  async deleteLocation(claims: TokenClaimsDto, id: string) {
    try {
      return await this.sender.send({
        messagePattern: 'delete',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete location: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete location',
      });
    }
  }

  async validateCoordinates(
    claims: TokenClaimsDto,
    payload: ValidateCoordinatesDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'validateCoordinates',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to validate coordinates: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to validate coordinates',
      });
    }
  }

  async validateBatchLocations(
    claims: TokenClaimsDto,
    payload: BatchLocationQueryDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'validateBatch',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to validate batch locations: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to validate batch locations',
      });
    }
  }

  async findNearbyLocations(
    claims: TokenClaimsDto,
    payload: NearbyLocationQueryDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'findNearby',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find nearby locations: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find nearby locations',
      });
    }
  }

  async findLocationsWithinRadius(
    claims: TokenClaimsDto,
    payload: NearbyLocationQueryDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'findWithinRadius',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find locations within radius: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find locations within radius',
      });
    }
  }

  async calculateDistance(claims: TokenClaimsDto, payload: DistanceQueryDto) {
    try {
      return await this.sender.send({
        messagePattern: 'calculateDistance',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to calculate distance: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to calculate distance',
      });
    }
  }

  async getDistanceFromLocation(
    claims: TokenClaimsDto,
    payload: ValidateCoordinatesDto,
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'getDistanceFromLocation',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get distance from location: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get distance from location',
      });
    }
  }

  async findLocationsInArea(
    claims: TokenClaimsDto,
    payload: {
      bounds: {
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
      };
      type?: string;
    },
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'findInArea',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find locations in area: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find locations in area',
      });
    }
  }

  async findNearestLocations(
    claims: TokenClaimsDto,
    payload: { latitude: number; longitude: number; limit?: number },
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'findNearest',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find nearest locations: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find nearest locations',
      });
    }
  }

  async isPointInLocationBoundary(
    claims: TokenClaimsDto,
    payload: { locationId: string; latitude: number; longitude: number },
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'isPointInBoundary',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to check point in boundary: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check point in boundary',
      });
    }
  }

  async getLocationBoundaries(
    claims: TokenClaimsDto,
    payload: { locationIds?: string[] },
  ) {
    try {
      return await this.sender.send({
        messagePattern: 'getBoundaries',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get location boundaries: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get location boundaries',
      });
    }
  }

  async findLocationsByIds(claims: TokenClaimsDto, payload: { ids: string[] }) {
    try {
      return await this.sender.send({
        messagePattern: 'findByIds',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find locations by ids: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find locations by ids',
      });
    }
  }

  async checkHealth() {
    try {
      return await this.sender.send({
        messagePattern: 'health',
        payload: {
          request: {},
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to check location service health: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check location service health',
      });
    }
  }
}
