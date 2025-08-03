import { UpdateUserDto } from './dtos/update-user.dto';
import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/dtos/create-audit-log.dto';
import { RoleService } from 'src/modules/role/role.service';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UserMessagePattern } from 'src/modules/user/user-message.pattern';
import { UserService } from 'src/modules/user/user.service';
import { throwRpcException } from 'src/utils';

@Controller('user')
export class UserController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  @MessagePattern(UserMessagePattern.findById)
  async findById(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    if (!claims) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required user claims',
      });
    }
    const user = await this.userService.findById(claims.sub);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.READ,
      entity: 'user',
      entityId: user.id,
      description: `Read user with ID: ${user.id}`,
    });
    return user;
  }

  @MessagePattern(UserMessagePattern.findAll)
  async findAll(@Payload() payload: MessagePayloadDto<FilterUserDto>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims,
      required: {
        roles: ['system admin'],
        permission: {
          action: 'read',
          resource: 'user',
        },
      },
    });
    const result = await this.userService.find(payload.request.body);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.READ,
      entity: 'user',
      description: `Read users`,
    });
    return result;
  }

  @MessagePattern(UserMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateUserDto>) {
    const { claims } = payload;
    try {
      await this.roleService.authorizeClaims({
        claims,
        required: {
          roles: ['system admin'],
          permission: {
            action: 'create',
            resource: 'user',
          },
        },
      });
      const result = await this.userService.create(payload.request.body);
      this.auditLogService.log(claims, {
        userId: claims.sub,
        action: AuditAction.CREATE,
        entity: 'user',
        entityId: result.id,
        description: `Created new user with ID: ${result.id}`,
      });
      return result;
    } catch (error) {
      console.error('Error in user controller create:', error);
      throw error;
    }
  }

  @MessagePattern(UserMessagePattern.update)
  async update(
    @Payload()
    payload: MessagePayloadDto<UpdateUserDto>,
  ) {
    const { claims } = payload;
    const result = await this.userService.update(
      payload.claims.sub,
      payload.request.body,
    );
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: result.id,
      description: `Updated user with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(UserMessagePattern.delete)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
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
    const result = await this.userService.delete(payload.request.path.id);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.DELETE,
      entity: 'user',
      entityId: result.id,
      description: `Deleted user with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(UserMessagePattern.deactivate)
  async deactivate(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin'],
        permission: {
          action: 'update',
          resource: 'user',
        },
      },
    });
    const result = await this.userService.deactivate(payload.request.path.id);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: result.id,
      description: `Deactivated user with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(UserMessagePattern.activate)
  async activate(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin'],
        permission: {
          action: 'update',
          resource: 'user',
        },
      },
    });
    const result = await this.userService.activate(payload.request.path.id);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: result.id,
      description: `Activated user with ID: ${result.id}`,
    });
    return result;
  }
}
