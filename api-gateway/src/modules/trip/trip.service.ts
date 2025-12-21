import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TripMessagePattern } from './trip-message.pattern';
import { CreateTripDto } from './dtos/create-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { CancelTripDto } from './dtos/cancel-trip.dto';
import { ResolveCancelationDto } from './dtos/resolve-cancelation.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CheckInAtLocationDto } from './dtos/check-in-at-location.dto';
import { CheckOutAtLocationDto } from './dtos/check-out-at-location.dto';

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

  async checkInAtLocation(claims: TokenClaimsDto, dto: CheckInAtLocationDto) {
    this.logger.log(
      `Sending check-in request for trip_location_id: ${dto.tripLocationId}`,
    );

    const result = await this.sender.send({
      messagePattern: 'CHECK_IN',
      payload: {
        claims,
        request: {
          body: dto,
        },
      },
    });
    return result;
  }

  async checkOutAtLocation(claims: TokenClaimsDto, dto: CheckOutAtLocationDto) {
    this.logger.log(
      `Sending check-out request for trip_location_id: ${dto.tripLocationId}`,
    );

    const result = await this.sender.send({
      messagePattern: 'CHECK_OUT',
      payload: {
        claims,
        request: {
          body: dto,
        },
      },
    });
    return result;
  }

  async requestCancel(
    claims: TokenClaimsDto,
    tripId: string,
    dto: CancelTripDto,
  ) {
    this.logger.log(
      `Sending request cancel trip for trip_id: ${tripId}`,
    );

    const result = await this.sender.send({
      messagePattern: 'REQUEST_CANCEL',
      payload: {
        claims,
        request: {
          path: { id: tripId },
          body: dto,
        },
      },
    });
    return result;
  }

  async resolveCancel(
    claims: TokenClaimsDto,
    cancelationId: string,
    dto: ResolveCancelationDto,
  ) {
    this.logger.log(
      `Sending resolve cancel request for cancelation_id: ${cancelationId}`,
    );

    const result = await this.sender.send({
      messagePattern: 'RESOLVE_CANCEL',
      payload: {
        claims,
        request: {
          path: { id: cancelationId },
          body: dto,
        },
      },
    });
    return result;
  }
}
