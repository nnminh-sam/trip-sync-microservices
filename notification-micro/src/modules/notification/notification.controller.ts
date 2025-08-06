import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { NotificationMessagePattern } from './notification-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { FilterNotificationDto } from './dtos/filter-notification.dto';
import { UpdateNotificationDto } from './dtos/update-notification.dto';
import { throwRpcException } from 'src/utils';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NotificationMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterNotificationDto>) {
    return await this.notificationService.findAll(payload.request.body);
  }

  @MessagePattern(NotificationMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateNotificationDto>) {
    return await this.notificationService.create(payload.request.body);
  }

  @MessagePattern(NotificationMessagePattern.UPDATE)
  async update(@Payload() payload: MessagePayloadDto<UpdateNotificationDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required notification ID',
      });
    }
    return await this.notificationService.update(id, payload.request.body);
  }

  @MessagePattern(NotificationMessagePattern.DELETE)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Notification ID is required',
      });
    }

    return await this.notificationService.remove(id); 
  }
}
