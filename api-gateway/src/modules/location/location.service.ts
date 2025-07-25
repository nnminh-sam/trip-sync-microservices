import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { LocationMessagePattern } from './location-message.pattern';

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

  async create(claims: TokenClaimsDto, createLocationDto: CreateLocationDto) {
    this.logger.log(`Creating location with name: ${createLocationDto.name}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: { body: createLocationDto },
        },
      });
      this.logger.log(`Location created successfully: ${createLocationDto.name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create location: ${createLocationDto.name}`, error.stack);
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filterDto: FilterLocationDto) {
    this.logger.log('Fetching all locations');
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ALL',
        payload: {
          claims,
          request: { body: filterDto },
        },
      });
      this.logger.log(`Found ${Array.isArray(result) ? result.length : 0} locations`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch locations', error.stack);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Finding location by ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Location found: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to find location: ${id}`, error.stack);
      throw error;
    }
  }

  async update(claims: TokenClaimsDto, id: string, updateDto: UpdateLocationDto) {
    this.logger.log(`Updating location: ${id}`, {
      updateData: updateDto,
    });
    try {
      const result = await this.sender.send({
        messagePattern: 'UPDATE',
        payload: {
          claims,
          request: {
            path: { id },
            body: updateDto,
          },
        },
      });
      this.logger.log(`Location updated: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update location: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Removing location: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'DELETE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Location removed: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to remove location: ${id}`, error.stack);
      throw error;
    }
  }
}
