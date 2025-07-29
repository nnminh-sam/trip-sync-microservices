import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateLocationDto } from 'src/modules/location/dtos/create-location.dto';
import { FilterLocationDto } from 'src/modules/location/dtos/filter-location.dto';
import { UpdateLocationDto } from 'src/modules/location/dtos/update-location.dto';
import { LocationMessagePattern } from 'src/modules/location/location-message.pattern';
import { LocationService } from 'src/modules/location/location.service';
import { throwRpcException } from 'src/utils';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @MessagePattern(LocationMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateLocationDto>) {
    return await this.locationService.create(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.findAll)
  async find(@Payload() payload: MessagePayloadDto<FilterLocationDto>) {
    return await this.locationService.findAll(payload.request.body);
  }

  @MessagePattern(LocationMessagePattern.findOne)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;

    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Id is required',
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
        message: 'Id is required',
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
        message: 'Id is required',
      });
    }
    return await this.locationService.delete(id);
  }
}
