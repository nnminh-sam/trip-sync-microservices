import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { UserMessagePattern } from 'src/modules/user/user-message.pattern';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);
  private readonly sender: NatsClientSender<typeof UserMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, UserMessagePattern);
  }

  async findById(claims: TokenClaimsDto) {
    this.logger.log(`findById called with id: ${claims.sub}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findById',
        payload: {
          claims,
        },
      });
      this.logger.log(`findById success for id: ${claims.sub}`);
      return result;
    } catch (error) {
      this.logger.error(
        `findById failed for id: ${claims.sub}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async find(claims: TokenClaimsDto, filterUserDto: FilterUserDto) {
    this.logger.log(
      `find called with payload: ${JSON.stringify(filterUserDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findAll',
        payload: { claims, request: { body: filterUserDto } },
      });
      this.logger.log(
        `find success with payload: ${JSON.stringify(filterUserDto)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `find failed with payload: ${JSON.stringify(filterUserDto)}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async create(claims: TokenClaimsDto, createUserDto: CreateUserDto) {
    this.logger.log(
      `create called with payload: ${JSON.stringify(createUserDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: createUserDto },
        },
      });
      this.logger.log(`create success for user: ${createUserDto.email || ''}`);
      return result;
    } catch (error) {
      this.logger.error(
        `create failed for user: ${createUserDto.email || ''}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async update(claims: TokenClaimsDto, updateUserDto: UpdateUserDto) {
    this.logger.log(`update called for id: ${claims.sub}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'update',
        payload: {
          claims,
          request: {
            path: { id: claims.sub },
            body: updateUserDto,
          },
        },
      });
      this.logger.log(`update success for id: ${claims.sub}`);
      return result;
    } catch (error) {
      this.logger.error(
        `update failed for id: ${claims.sub}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async delete(claims: TokenClaimsDto, id: string) {
    this.logger.log(`delete called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'delete',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`delete success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`delete failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async deactivate(claims: TokenClaimsDto, id: string) {
    this.logger.log(`deactivate called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'deactivate',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`deactivate success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `deactivate failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async activate(claims: TokenClaimsDto, id: string) {
    this.logger.log(`activate called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'activate',
        payload: {
          claims,
          request: { path: { id } },
        },
      });
      this.logger.log(`activate success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`activate failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }
}
