import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MediaService } from './media.service';
import { MediaMessagePattern } from './media-message.pattern';
import { MessagePayloadDto } from '../../dtos/message-payload.dto';
import { CreateMediaDto, UpdateMediaDto, FilterMediaDto } from './dtos';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @MessagePattern(MediaMessagePattern.findById)
  async findById(@Payload() payload: MessagePayloadDto) {
    const { path } = payload.request || {};
    return await this.mediaService.findById(path?.id);
  }

  @MessagePattern(MediaMessagePattern.findAll)
  async findAll(@Payload() payload: MessagePayloadDto<FilterMediaDto>) {
    const filter = payload.request?.body || new FilterMediaDto();
    return await this.mediaService.findAll(filter);
  }

  @MessagePattern(MediaMessagePattern.findByTaskId)
  async findByTaskId(@Payload() payload: MessagePayloadDto) {
    const { path } = payload.request || {};
    return await this.mediaService.findByTaskId(path?.taskId);
  }

  @MessagePattern(MediaMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateMediaDto>) {
    const { claims, request } = payload;
    return await this.mediaService.create(claims?.sub, request?.body);
  }

  @MessagePattern(MediaMessagePattern.update)
  async update(@Payload() payload: MessagePayloadDto<UpdateMediaDto>) {
    const { path, body } = payload.request || {};
    return await this.mediaService.update(path?.id, body);
  }

  @MessagePattern(MediaMessagePattern.delete)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { path } = payload.request || {};
    return await this.mediaService.delete(path?.id);
  }

  @MessagePattern(MediaMessagePattern.verifySignature)
  async verifySignature(@Payload() payload: MessagePayloadDto<{ mediaId: string; signature: string }>) {
    const { body } = payload.request || {};
    // TODO: Implement GPG signature verification using openpgp.js
    // For now, just return the media record
    const media = await this.mediaService.findById(body?.mediaId);
    return { verified: false, media };
  }
}
