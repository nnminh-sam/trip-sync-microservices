import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TripService } from './trip.service';
import { CreateTripDto } from './dtos/create-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { TripMessagePattern } from './trip-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { throwRpcException } from 'src/utils';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { CheckInAtLocationDto } from './dtos/check-in-at-location.dto';

@Controller()
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @MessagePattern(TripMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateTripDto>) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'create',
          resource: 'trip',
        },
      },
    });

    return await this.tripService.create(
      payload.claims.sub,
      payload.request.body,
    );
  }

  @MessagePattern(TripMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterTripDto>) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'read',
          resource: 'trip',
        },
      },
    });

    return await this.tripService.findAll(payload.request.body);
  }

  @MessagePattern(TripMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'read',
          resource: 'trip',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Trip ID',
      });
    }

    return await this.tripService.findOne(id);
  }

  @MessagePattern(TripMessagePattern.UPDATE)
  async update(@Payload() payload: MessagePayloadDto<UpdateTripDto>) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager', 'employee'],
        permission: {
          action: 'update',
          resource: 'trip',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Trip ID',
      });
    }

    return await this.tripService.update(id, payload.request.body);
  }

  @MessagePattern(TripMessagePattern.DELETE)
  async remove(@Payload() payload: MessagePayloadDto) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'delete',
          resource: 'trip',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Trip ID',
      });
    }

    return await this.tripService.remove(id);
  }

  @MessagePattern(TripMessagePattern.APPROVE)
  async approve(@Payload() payload: MessagePayloadDto<ApproveTripDto>) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['manager', 'system admin'],
        permission: {
          action: 'approve',
          resource: 'trip',
        },
      },
    });

    const { id } = payload.request.path;
    const dto = payload.request.body;

    return this.tripService.approve(id, dto);
  }

  @MessagePattern(TripMessagePattern.LOCATIONS)
  async getTripLocations(@Payload() payload: MessagePayloadDto) {
    await this.tripService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['manager', 'system admin', 'employee'],
        permission: {
          action: 'read',
          resource: 'trip',
        },
      },
    });

    const { id } = payload.request.path;
    return this.tripService.getTripLocations(id);
  }

  @MessagePattern(TripMessagePattern.CHECK_IN)
  async checkInAtLocation(
    @Payload() payload: MessagePayloadDto<CheckInAtLocationDto>,
  ) {
    const assigneeId: string = payload.claims.sub;
    const dto: CheckInAtLocationDto = payload.request.body;
    return await this.tripService.checkIn(assigneeId, dto);
  }

  @MessagePattern(TripMessagePattern.CHECK_OUT)
  async checkOutAtLocation() {}
}
