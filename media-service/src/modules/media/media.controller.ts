import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MediaService } from './media.service';
import { MediaUploadService, MediaUploadRequest } from './services';
import { MediaMessagePattern } from './media-message.pattern';
import { MessagePayloadDto } from '../../dtos/message-payload.dto';
import { CreateMediaDto, UpdateMediaDto, FilterMediaDto } from './dtos';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

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
  async create(
    @Payload()
    payload: MessagePayloadDto<{
      fileBuffer: Buffer;
      filename: string;
      signature: string;
      taskId?: string;
      description?: string;
    }>,
  ) {
    const { claims, request } = payload;
    const { fileBuffer, filename, signature, taskId, description } =
      request?.body || {};

    const uploadRequest: MediaUploadRequest = {
      uploaderId: claims?.sub,
      signature,
      taskId,
      description,
    };

    const result = await this.mediaUploadService.uploadMedia(
      fileBuffer,
      filename,
      signature,
      uploadRequest,
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload media');
    }

    return result.media;
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
  async verifySignature(
    @Payload()
    payload: MessagePayloadDto<{
      fileBuffer: Buffer;
      signature: string;
    }>,
  ) {
    const { claims, request } = payload;
    const { fileBuffer, signature } = request?.body || {};

    const validation = await this.mediaUploadService.validateMediaUpload(
      fileBuffer,
      signature,
      claims?.sub,
    );

    return {
      isValid: validation.isValid,
      signer: validation.signerKeyId,
      error: validation.error,
    };
  }
}
