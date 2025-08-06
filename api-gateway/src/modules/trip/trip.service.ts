import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TripMessagePattern } from './trip-message.pattern';
import { CreateTripDto } from './dtos/create-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);
  private readonly sender: NatsClientSender<typeof TripMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, TripMessagePattern);
  }

  async create(claims: TokenClaimsDto, dto: CreateTripDto) {
    this.logger.log('Sending create trip request');
    try {
      const dtoWithCreator = {
        ...dto,
        created_by: claims.sub,
      };

      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: {
            body: dtoWithCreator,
          },
        },
      });

      this.logger.log('Trip created successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to create trip', error.stack);
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filter: FilterTripDto) {
    this.logger.log('Sending find all trips request');
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ALL',
        payload: {
          claims,
          request: {
            body: filter,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch trips', error.stack);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Sending find trip by ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch trip ${id}`, error.stack);
      throw error;
    }
  }

  async update(claims: TokenClaimsDto, id: string, dto: UpdateTripDto) {
    this.logger.log(`Sending update trip ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'UPDATE',
        payload: {
          claims,
          request: {
            path: { id },
            body: dto,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to update trip ${id}`, error.stack);
      throw error;
    }
  }

  async remove(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Sending remove trip ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'DELETE',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete trip ${id}`, error.stack);
      throw error;
    }
  }

  async approveTrip(id: string, claims: TokenClaimsDto, dto: ApproveTripDto) {
    this.logger.log(`Sending approve trip request for trip_id: ${id}`);
    const result = await this.sender.send({
      messagePattern: 'APPROVE',
      payload: {
        claims,
        request: {
          path: { id },
          body: dto,
        },
      },
    });

    return result;
  }
  async getLocations(claims: TokenClaimsDto, tripId: string) {
    this.logger.log(`Sending request to get locations for trip: ${tripId}`);
    return this.sender.send({
      messagePattern: 'LOCATIONS',
      payload: {
        claims,
        request: {
          path: { id: tripId },
        },
      },
    });
  }
  async getApprovals(claims: TokenClaimsDto, tripId: string) {
    return this.sender.send({
      messagePattern: 'APPROVALS',
      payload: {
        claims,
        request: {
          path: { id: tripId },
        },
      },
    });
  }
}
