import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleMessagePattern } from 'src/modules/role/role-message.pattern';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { FilterRoleDto } from 'src/modules/role/dtos/filter-role.dto';
import { throwRpcException } from 'src/utils';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/dtos/create-audit-log.dto';

@Controller()
export class RoleController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly roleService: RoleService,
  ) {}

  @MessagePattern(RoleMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreateRoleDto>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'create',
          resource: 'role',
        },
      },
    });
    const result = await this.roleService.create(payload.request.body);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.CREATE,
      entity: 'role',
      entityId: result.id,
      description: `Created role with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(RoleMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterRoleDto>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    const result = await this.roleService.findAll(payload.request.body);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.READ,
      entity: 'role',
      description: `Read roles`,
    });
    return result;
  }

  @MessagePattern(RoleMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }
    const result = await this.roleService.findOne(id);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.READ,
      entity: 'role',
      entityId: result.id,
      description: `Read role with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(RoleMessagePattern.FIND_BY_NAME)
  async findByName(@Payload() payload: MessagePayloadDto<string>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'role',
        },
      },
    });
    const { name } = payload.request.path;
    if (!name) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role Name',
      });
    }

    const result = await this.roleService.findByName(name);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.READ,
      entity: 'role',
      entityId: result.id,
      description: `Read role with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(RoleMessagePattern.UPDATE)
  async update(@Payload() payload: MessagePayloadDto<UpdateRoleDto>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'update',
          resource: 'role',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }

    const result = await this.roleService.update(id, payload.request.body);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.UPDATE,
      entity: 'role',
      entityId: result.id,
      description: `Updated role with ID: ${result.id}`,
    });
    return result;
  }

  @MessagePattern(RoleMessagePattern.REMOVE)
  async remove(@Payload() payload: MessagePayloadDto<string>) {
    const { claims } = payload;
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'delete',
          resource: 'role',
        },
      },
    });

    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Role ID',
      });
    }
    const result = await this.roleService.remove(id);
    this.auditLogService.log(claims, {
      userId: claims.sub,
      action: AuditAction.CREATE,
      entity: 'role',
      entityId: id,
      description: `Deleted role with ID: ${id}`,
    });
    return result;
  }
}
