import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionMessagePattern } from 'src/modules/permission/permission-message.pattern';
import { BulkCreatePermissionDto } from './dtos/bulk-create-permission.dto';
import { RoleService } from 'src/modules/role/role.service';
import { FilterPermissionDto } from 'src/modules/permission/dtos/filter-permission.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { throwRpcException } from 'src/utils';

@Controller()
export class PermissionController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  @MessagePattern(PermissionMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreatePermissionDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'create',
          resource: 'permission',
        },
      },
    });
    return await this.permissionService.create(payload.request.body);
  }

  @MessagePattern(PermissionMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterPermissionDto>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'permission',
        },
      },
    });
    return await this.permissionService.findAll(payload.request.body);
  }

  @MessagePattern(PermissionMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'permission',
        },
      },
    });
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Permission ID',
      });
    }
    return await this.permissionService.findOne(id);
  }

  @MessagePattern(PermissionMessagePattern.UPDATE)
  async update(
    @Payload()
    payload: MessagePayloadDto<UpdatePermissionDto>,
  ) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'update',
          resource: 'permission',
        },
      },
    });
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Permission ID',
      });
    }
    return await this.permissionService.update(id, payload.request.body);
  }

  @MessagePattern(PermissionMessagePattern.REMOVE)
  async remove(@Payload() payload: MessagePayloadDto<string>) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'delete',
          resource: 'permission',
        },
      },
    });
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Permission ID',
      });
    }
    return await this.permissionService.remove(id);
  }

  @MessagePattern(PermissionMessagePattern.BULK_CREATE)
  async bulkCreate(
    @Payload() payload: MessagePayloadDto<BulkCreatePermissionDto>,
  ) {
    await this.roleService.authorizeClaims({
      claims: payload.claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'create',
          resource: 'permission',
        },
      },
    });
    return await this.permissionService.bulkCreate(payload.request.body);
  }
}
