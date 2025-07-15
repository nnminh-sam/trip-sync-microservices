import { BulkCreatePermissionDto } from './dtos/bulk-create-permission.dto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionMessagePattern } from './permission-message.pattern';
import { NatsClientSender } from 'src/utils';
import { FilterPermissionDto } from 'src/modules/permission/dtos/filter-permission.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly sender: NatsClientSender<typeof PermissionMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, PermissionMessagePattern);
  }

  async create(
    claims: TokenClaimsDto,
    createPermissionDto: CreatePermissionDto,
  ) {
    this.logger.log(
      `Creating permission: ${createPermissionDto.action} on ${createPermissionDto.resource}`,
    );

    try {
      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: { body: createPermissionDto },
        },
      });
      this.logger.log(
        `Permission created successfully: ${createPermissionDto.action} on ${createPermissionDto.resource}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create permission: ${createPermissionDto.action} on ${createPermissionDto.resource}`,
        error.stack,
      );
      throw error;
    }
  }

  async bulkCreate(
    claims: TokenClaimsDto,
    bulkCreatePermissionDto: BulkCreatePermissionDto,
  ) {
    this.logger.log(`Bulk Creating permissions`);

    try {
      const result = await this.sender.send({
        messagePattern: 'BULK_CREATE',
        payload: {
          claims,
          request: { body: bulkCreatePermissionDto },
        },
      });
      this.logger.log(`Bulk Creaions Success`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to Process Bulk Creaion Permissions`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(
    claims: TokenClaimsDto,
    filterPermissionDto: FilterPermissionDto,
  ) {
    this.logger.log('Fetching all permissions');

    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ALL',
        payload: {
          claims,
          request: { body: filterPermissionDto },
        },
      });

      this.logger.log(
        `Found ${Array.isArray(result) ? result.length : 0} permissions`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all permissions', error.stack);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Finding permission by ID: ${id}`);

    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Permission found by ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to find permission by ID: ${id}`, error.stack);
      throw error;
    }
  }

  async update(
    claims: TokenClaimsDto,
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ) {
    this.logger.log(`Updating permission with ID: ${id}`, {
      updateData: updatePermissionDto,
    });

    try {
      const result = await this.sender.send({
        messagePattern: 'UPDATE',
        payload: {
          claims,
          request: {
            path: { id },
            body: updatePermissionDto,
          },
        },
      });
      this.logger.log(`Permission updated successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update permission: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Removing permission with ID: ${id}`);

    try {
      const result = await this.sender.send({
        messagePattern: 'REMOVE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Permission removed successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to remove permission: ${id}`, error.stack);
      throw error;
    }
  }
}
