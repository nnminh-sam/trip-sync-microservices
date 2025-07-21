import { UpdateUserDto } from './dtos/update-user.dto';
import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { RoleService } from 'src/modules/role/role.service';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UserMessagePattern } from 'src/modules/user/user-message.pattern';
import { UserService } from 'src/modules/user/user.service';
import { throwRpcException } from 'src/utils';

@Controller('user')
export class UserController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  @MessagePattern(UserMessagePattern.findById)
  async findById(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required User ID',
      });
    }
    return await this.userService.findById(id);
  }

  @MessagePattern(UserMessagePattern.findAll)
  async findAll(@Payload() payload: MessagePayloadDto<FilterUserDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin'],
        permission: {
          action: 'read',
          resource: 'user',
        },
      },
    });
    return await this.userService.find(payload.request.body);
  }

  @MessagePattern(UserMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateUserDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin'],
        permission: {
          action: 'create',
          resource: 'user',
        },
      },
    });
    return await this.userService.create(payload.request.body);
  }

  @MessagePattern(UserMessagePattern.update)
  async update(
    @Payload()
    payload: MessagePayloadDto<UpdateUserDto>,
  ) {
    return await this.userService.update(
      payload.claims.sub,
      payload.request.body,
    );
  }
}
