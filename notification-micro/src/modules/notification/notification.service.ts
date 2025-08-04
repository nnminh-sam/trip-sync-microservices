import { ListDataDto } from './../../../../user-micro/src/dtos/list-data.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Notification } from 'src/models/notification.model';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { UpdateNotificationDto } from './dtos/update-notification.dto';
import { FilterNotificationDto } from './dtos/filter-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async findAll(payload: FilterNotificationDto) {
    const {
      page,
      size,
      order,
      sortBy,
      user_id,
      type,
      priority,
      is_read,
    } = payload;

    const [data, total] = await this.notificationRepo.findAndCount({
      where: {
        ...(user_id && { user_id: user_id }),
        ...(type && { type }),
        ...(is_read !== undefined && { is_read }),
        ...(priority && { priority }),
      },
      ...paginateAndOrder({ page, size, order, sortBy }),
    });

    return ListDataDto.build<Notification>({
      data,
      page,
      size,
      total,
    });
  }

  async create(payload: CreateNotificationDto): Promise<Notification> {
    try {
      const entity = this.notificationRepo.create({
        ...payload,
        createdAt: new Date(),
        is_read: false,
      });

      return await this.notificationRepo.save(entity);
    } catch (error) {
      this.logger.error('Cannot create notification', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create notification',
      });
    }
  }

  async findOne(id: string): Promise<Notification> {
    const noti = await this.notificationRepo.findOne({ where: { id } });

    if (!noti) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Notification not found',
      });
    }

    return noti;
  }

    async update(id: string, payload: UpdateNotificationDto): Promise<Notification> {
    const noti = await this.findOne(id);

    try {
      const updated = await this.notificationRepo.save({
        ...noti,
        ...payload,
        is_read: payload.is_read ?? noti.is_read, // default giữ nguyên
        updatedAt: new Date(),
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update notification with id ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update notification',
      });
    }
  }



  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const notification = await this.findOne(id);
    await this.notificationRepo.remove(notification);
    this.logger.log(`Location removed with id: ${id}`);
    return { success: true, id };
  }

}
