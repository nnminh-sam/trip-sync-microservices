import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, Like } from 'typeorm';
import { AuditLog } from 'src/models/audit-log.model';
import { CreateAuditLogDto } from './dtos/create-audit-log.dto';
import { FilterAuditLogDto } from './dtos/filter-audit-log.dto';
import { throwRpcException } from 'src/utils';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    this.logger.log(
      `Creating audit log for action: ${createAuditLogDto.action}, entity: ${createAuditLogDto.entity}`,
    );

    try {
      const auditLog = this.auditLogRepository.create(createAuditLogDto);
      const savedAuditLog = await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created successfully with ID: ${savedAuditLog.id}`,
      );
      return savedAuditLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );

      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create audit log',
      });
    }
  }

  async findById(id: string): Promise<AuditLog> {
    this.logger.log(`Finding audit log by ID: ${id}`);

    try {
      const auditLog = await this.auditLogRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!auditLog) {
        this.logger.warn(`Audit log not found with ID: ${id}`);
        throwRpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Audit log with ID ${id} not found`,
        });
      }

      this.logger.log(`Audit log found with ID: ${id}`);
      return auditLog;
    } catch (error) {
      this.logger.error(
        `Failed to find audit log by ID ${id}: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Failed to find audit log with ID ${id}`,
      });
    }
  }

  async findAll(
    filterDto: FilterAuditLogDto,
  ): Promise<{ data: AuditLog[]; total: number }> {
    this.logger.log(
      `Finding audit logs with filter: ${JSON.stringify(filterDto)}`,
    );

    try {
      const {
        userId,
        action,
        entity,
        entityId,
        ipAddress,
        fromDate,
        toDate,
        search,
        page = 1,
        size = 20,
        sortBy = 'createdAt',
        order = 'desc',
      } = filterDto;

      const queryOptions: FindManyOptions<AuditLog> = {
        where: {},
        relations: ['user'],
        skip: (page - 1) * size,
        take: size,
        order: {
          [sortBy]: order.toUpperCase() as 'ASC' | 'DESC',
        },
      };

      if (userId) {
        queryOptions.where['userId'] = userId;
        this.logger.log(`Filtering by userId: ${userId}`);
      }

      if (action) {
        queryOptions.where['action'] = action;
        this.logger.log(`Filtering by action: ${action}`);
      }

      if (entity) {
        queryOptions.where['entity'] = entity;
        this.logger.log(`Filtering by entity: ${entity}`);
      }

      if (entityId) {
        queryOptions.where['entityId'] = entityId;
        this.logger.log(`Filtering by entityId: ${entityId}`);
      }

      if (ipAddress) {
        queryOptions.where['ipAddress'] = ipAddress;
        this.logger.log(`Filtering by ipAddress: ${ipAddress}`);
      }

      if (search) {
        queryOptions.where['description'] = Like(`%${search}%`);
        this.logger.log(`Searching in description: ${search}`);
      }

      if (fromDate && toDate) {
        queryOptions.where['createdAt'] = Between(
          new Date(fromDate),
          new Date(toDate),
        );
        this.logger.log(`Filtering by date range: ${fromDate} to ${toDate}`);
      } else if (fromDate) {
        queryOptions.where['createdAt'] = Between(
          new Date(fromDate),
          new Date(),
        );
        this.logger.log(`Filtering from date: ${fromDate} to now`);
      }

      const [data, total] =
        await this.auditLogRepository.findAndCount(queryOptions);

      this.logger.log(
        `Found ${data.length} audit logs (page ${page}, size ${size}, total ${total})`,
      );
      return { data, total };
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to find audit logs',
      });
    }
  }
}
