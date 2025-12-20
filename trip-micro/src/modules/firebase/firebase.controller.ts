import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FirebaseService } from './firebase.service';
import { FirebaseMessagePattern } from './firebase-message.pattern';
import { MessagePayloadDto } from '../../dtos/message-payload.dto';
import {
  SendNotificationDto,
  GetDataDto,
  UpdateDataDto,
  DeleteDataDto,
} from './dtos';

@Controller()
export class FirebaseController {
  private readonly logger = new Logger(FirebaseController.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  @MessagePattern(FirebaseMessagePattern.SEND_NOTIFICATION)
  async sendNotification(
    @Payload() payload: MessagePayloadDto<SendNotificationDto>,
  ): Promise<any> {
    this.logger.log('Received send_notification message');
    return await this.firebaseService.sendNotification(payload.request.body);
  }

  @MessagePattern(FirebaseMessagePattern.SEND_DATA)
  async sendData(
    @Payload() payload: MessagePayloadDto<SendNotificationDto>,
  ): Promise<any> {
    this.logger.log('Received send_data message');
    const { path, data } = payload.request.body;
    return await this.firebaseService.sendData(path, data);
  }

  @MessagePattern(FirebaseMessagePattern.GET_DATA)
  async getData(
    @Payload() payload: MessagePayloadDto<GetDataDto>,
  ): Promise<any> {
    this.logger.log('Received get_data message');
    return await this.firebaseService.getData(payload.request.body);
  }

  @MessagePattern(FirebaseMessagePattern.UPDATE_DATA)
  async updateData(
    @Payload() payload: MessagePayloadDto<UpdateDataDto>,
  ): Promise<any> {
    this.logger.log('Received update_data message');
    return await this.firebaseService.updateData(payload.request.body);
  }

  @MessagePattern(FirebaseMessagePattern.DELETE_DATA)
  async deleteData(
    @Payload() payload: MessagePayloadDto<DeleteDataDto>,
  ): Promise<any> {
    this.logger.log('Received delete_data message');
    return await this.firebaseService.deleteData(payload.request.body);
  }
}
