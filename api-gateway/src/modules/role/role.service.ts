import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleMessagePattern } from './role-message.pattern';
import { NatsClientSender } from 'src/utils';
import { FilterRoleDto } from 'src/modules/role/dtos/filter-role.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  private readonly sender: NatsClientSender<typeof RoleMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, RoleMessagePattern);
  }

  async create(claims: TokenClaimsDto, createRoleDto: CreateRoleDto) {
    this.logger.log(`Creating role with name: ${createRoleDto.name}`);

    try {
      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: { body: createRoleDto },
        },
      });
      this.logger.log(`Role created successfully: ${createRoleDto.name}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create role: ${createRoleDto.name}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filterRoleDto: FilterRoleDto) {
    this.logger.log('Fetching all roles');

    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ALL',
        payload: {
          claims,
          request: {
            body: filterRoleDto,
          },
        },
      });
      this.logger.log(
        `Found ${Array.isArray(result) ? result.length : 0} roles`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all roles', error.stack);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Finding role by ID: ${id}`);

    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Role found by ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to find role by ID: ${id}`, error.stack);
      throw error;
    }
  }

  async update(
    claims: TokenClaimsDto,
    id: string,
    updateRoleDto: UpdateRoleDto,
  ) {
    this.logger.log(`Updating role with ID: ${id}`, {
      updateData: updateRoleDto,
    });

    try {
      const result = await this.sender.send({
        messagePattern: 'UPDATE',
        payload: {
          claims,
          request: {
            path: { id },
            body: updateRoleDto,
          },
        },
      });
      this.logger.log(`Role updated successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update role: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Removing role with ID: ${id}`);

    try {
      const result = await this.sender.send({
        messagePattern: 'REMOVE',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`Role removed successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to remove role: ${id}`, error.stack);
      throw error;
    }
  }
}
