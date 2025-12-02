import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UpdateUserDto } from 'src/modules/user/dtos/update-user.dto';
import { UserMessagePattern } from 'src/modules/user/user-message.pattern';
import { CatchErrors, NatsClientSender } from 'src/utils';

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

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'User not found',
  })
  async findById(claims: TokenClaimsDto) {
    this.logger.log(`Finding user with ID: ${claims.sub}`);
    const result = await this.sender.send({
      messagePattern: 'findById',
      payload: {
        claims,
      },
    });
    this.logger.log(`Found user with ID: ${claims.sub}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
  })
  async find(claims: TokenClaimsDto, filterUserDto: FilterUserDto) {
    this.logger.log(
      `find called with payload: ${JSON.stringify(filterUserDto)}`,
    );
    const result = await this.sender.send({
      messagePattern: 'findAll',
      payload: { claims, request: { body: filterUserDto } },
    });
    this.logger.log(
      `find success with payload: ${JSON.stringify(filterUserDto)}`,
    );
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Create user failed',
  })
  async create(claims: TokenClaimsDto, createUserDto: CreateUserDto) {
    this.logger.log(
      `create called with payload: ${JSON.stringify(createUserDto)}`,
    );
    const result = await this.sender.send({
      messagePattern: 'create',
      payload: {
        claims,
        request: { body: createUserDto },
      },
    });
    this.logger.log(`create success for user: ${createUserDto.email || ''}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Create user failed',
  })
  async update(claims: TokenClaimsDto, updateUserDto: UpdateUserDto) {
    this.logger.log(`update called for id: ${claims.sub}`);
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
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Delete user failed',
  })
  async delete(claims: TokenClaimsDto, id: string) {
    this.logger.log(`delete called for id: ${id}`);
    const result = await this.sender.send({
      messagePattern: 'delete',
      payload: {
        claims,
        request: { path: { id } },
      },
    });
    this.logger.log(`delete success for id: ${id}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Deactivate user failed',
  })
  async deactivate(claims: TokenClaimsDto, id: string) {
    this.logger.log(`deactivate called for id: ${id}`);
    const result = await this.sender.send({
      messagePattern: 'deactivate',
      payload: {
        claims,
        request: { path: { id } },
      },
    });
    this.logger.log(`deactivate success for id: ${id}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Activate user failed',
  })
  async activate(claims: TokenClaimsDto, id: string) {
    this.logger.log(`activate called for id: ${id}`);
    const result = await this.sender.send({
      messagePattern: 'activate',
      payload: {
        claims,
        request: { path: { id } },
      },
    });
    this.logger.log(`activate success for id: ${id}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Update public key failed',
  })
  async updatePublicKey(claims: TokenClaimsDto, publicKey: string) {
    this.logger.log(`updatePublicKey called for user id: ${claims.sub}`);
    const result = await this.sender.send({
      messagePattern: 'updatePublicKey',
      payload: {
        claims,
        request: { body: { publicKey } },
      },
    });
    this.logger.log(`updatePublicKey success for user id: ${claims.sub}`);
    return result;
  }

  @CatchErrors({
    rpcMessage: 'User service unavailable',
    defaultMessage: 'Retrieve public key failed',
  })
  async getPublicKey(claims: TokenClaimsDto) {
    this.logger.log(`getPublicKey called for user id: ${claims.sub}`);
    const result = await this.sender.send({
      messagePattern: 'findPublicKey',
      payload: {
        claims,
      },
    });
    this.logger.log(`getPublicKey success for user id: ${claims.sub}`);
    return result;
  }
}
