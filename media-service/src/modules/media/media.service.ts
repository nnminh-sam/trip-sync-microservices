import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../models';
import { CreateMediaDto, UpdateMediaDto, FilterMediaDto } from './dtos';
import { MediaStatusEnum } from 'src/models/enums/media-status.enum';

class NotReadyError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class MediaService {
  private readonly logger: Logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async findById(id: string): Promise<Media> {
    for (let counter = 1; counter <= 3; counter++) {
      try {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
          throw new NotFoundException('Attachment not found');
        }
        if (media.status === MediaStatusEnum.NOT_READY) {
          throw new NotReadyError('Attachment is not ready to use');
        }
      } catch (error) {
        if (!(error instanceof NotReadyError) || counter > 3) {
          if (error instanceof NotFoundException) {
            this.logger.error('Attachment not found');
          }
          this.logger.error(
            `Cannot find attachment. Error: ${JSON.stringify(error)}`,
          );
          throw error;
        }
        this.logger.warn(`Attachment is not ready! Retry count: ${counter}`);
      }
    }

    return await this.mediaRepository.findOne({
      where: { id },
    });
  }

  async create(
    uploaderId: string,
    createMediaDto: CreateMediaDto,
  ): Promise<Media> {
    const media = this.mediaRepository.create({
      ...createMediaDto,
      uploaderId,
    });

    return await this.mediaRepository.save(media);
  }
}
