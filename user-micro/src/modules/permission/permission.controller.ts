import { Controller, HttpStatus, Logger } from '@nestjs/common';
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
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/dtos/create-audit-log.dto';

@Controller()
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  @MessagePattern(PermissionMessagePattern.CREATE)
  async create(@Payload() payload: MessagePayloadDto<CreatePermissionDto>) {
    const { claims } = payload;
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
    const result = await this.permissionService.create(payload.request.body);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.CREATE,
        entity: 'permission',
        entityId: result.id,
        description: `Created new permission with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for create: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(PermissionMessagePattern.FIND_ALL)
  async findAll(@Payload() payload: MessagePayloadDto<FilterPermissionDto>) {
    const { claims } = payload;
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
    const result = await this.permissionService.findAll(payload.request.body);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.READ,
        entity: 'permission',
        description: `Read permissions`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for findAll: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(PermissionMessagePattern.FIND_ONE)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
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
    const result = await this.permissionService.findOne(id);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.READ,
        entity: 'permission',
        entityId: result.id,
        description: `Read permission with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for findOne: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(PermissionMessagePattern.UPDATE)
  async update(
    @Payload()
    payload: MessagePayloadDto<UpdatePermissionDto>,
  ) {
    const { claims } = payload;
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
    const result = await this.permissionService.update(id, payload.request.body);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'permission',
        entityId: result.id,
        description: `Updated permission with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for update: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(PermissionMessagePattern.REMOVE)
  async remove(@Payload() payload: MessagePayloadDto<string>) {
    const { claims } = payload;
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
    const result = await this.permissionService.remove(id);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.DELETE,
        entity: 'permission',
        entityId: id,
        description: `Deleted permission with ID: ${id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for remove: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(PermissionMessagePattern.BULK_CREATE)
  async bulkCreate(
    @Payload() payload: MessagePayloadDto<BulkCreatePermissionDto>,
  ) {
    const { claims } = payload;
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
    const result = await this.permissionService.bulkCreate(payload.request.body);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.CREATE,
        entity: 'permission',
        description: `Bulk created ${result.length} permissions`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for bulkCreate: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }
}
