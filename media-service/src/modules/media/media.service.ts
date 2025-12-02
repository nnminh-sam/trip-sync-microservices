import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../models';
import { CreateMediaDto, UpdateMediaDto, FilterMediaDto } from './dtos';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async findById(id: string): Promise<Media> {
    return await this.mediaRepository.findOne({
      where: { id },
    });
  }

  async findAll(filter: FilterMediaDto): Promise<{ data: Media[]; total: number }> {
    const query = this.mediaRepository.createQueryBuilder('media');

    if (filter.taskId) {
      query.where('media.taskId = :taskId', { taskId: filter.taskId });
    }

    if (filter.uploaderId) {
      query.andWhere('media.uploaderId = :uploaderId', { uploaderId: filter.uploaderId });
    }

    if (filter.status) {
      query.andWhere('media.status = :status', { status: filter.status });
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const skip = (page - 1) * pageSize;
    query.skip(skip).take(pageSize);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async findByTaskId(taskId: string): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { taskId },
    });
  }

  async create(uploaderId: string, createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create({
      ...createMediaDto,
      uploaderId,
      status: 'uploaded',
      signatureVerified: false,
    });

    return await this.mediaRepository.save(media);
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    await this.mediaRepository.update(id, updateMediaDto);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.mediaRepository.softDelete(id);
    return result.affected > 0;
  }
}
