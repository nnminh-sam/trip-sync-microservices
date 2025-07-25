import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { LocationMessagePattern } from './location-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { throwRpcException } from 'src/utils';

@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @MessagePattern(LocationMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateLocationDto>) {
    await this.locationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'create',
          resource: 'location',
        },
      },
    });

    return await this.locationService.create(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterLocationDto>) {
    await this.locationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager','employee'],
        permission: {
          action: 'read',
          resource: 'location',
        },
      },
    });

    return await this.locationService.findAll(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    await this.locationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'location',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Location ID',
      });
    }

    return await this.locationService.findOne(id);
  }


  @MessagePattern(LocationMessagePattern.UPDATE)
  async update(@Payload() payload: MessagePayloadDto<UpdateLocationDto>) {
    await this.locationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'update',
          resource: 'location',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Location ID',
      });
    }

    return await this.locationService.update(id, payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.DELETE)
  async remove(@Payload() payload: MessagePayloadDto) {
    await this.locationService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'delete',
          resource: 'location',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Location ID',
      });
    }

    return await this.locationService.remove(id);
  }
}
