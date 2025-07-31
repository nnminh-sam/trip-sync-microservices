import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { NatsClientSender } from 'src/utils';
import { CreateLocationDto } from './dtos/create-location.dto';
import { FindLocationsDto } from './dtos/find-locations.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { LocationMessagePattern } from './location-message.pattern';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger(LocationService.name);
  private readonly sender: NatsClientSender<typeof LocationMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(this.natsClient, LocationMessagePattern);
  }

  async create(claims: TokenClaimsDto, createLocationDto: CreateLocationDto) {
    this.logger.log(
      `create called with payload: ${JSON.stringify(createLocationDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: createLocationDto },
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

  async find(claims: TokenClaimsDto, findLocationsDto: FindLocationsDto) {
    this.logger.log(
      `find called with payload: ${JSON.stringify(findLocationsDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findAll',
        payload: { claims, request: { body: findLocationsDto } },
      });
      this.logger.log(
        `find success with payload: ${JSON.stringify(findLocationsDto)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `find failed with payload: ${JSON.stringify(findLocationsDto)}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`findOne called with id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findOne',
        payload: { claims, request: { path: { id } } },
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
        payload: { claims, request: { path: { id }, body: updateLocationDto } },
      });
      this.logger.log(`update success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`update failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async remove(claims: TokenClaimsDto, id: string) {
    this.logger.log(`remove called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'delete',
        payload: { claims, request: { path: { id } } },
      });
      this.logger.log(`remove success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`remove failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }
}
