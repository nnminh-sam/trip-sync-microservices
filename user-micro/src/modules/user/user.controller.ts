import { UpdateUserDto } from './dtos/update-user.dto';
import { Controller, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/dtos/create-audit-log.dto';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { FilterUserDto } from 'src/modules/user/dtos/filter-user.dto';
import { UserMessagePattern } from 'src/modules/user/user-message.pattern';
import { UserService } from 'src/modules/user/user.service';
import { throwRpcException } from 'src/utils';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';

@Controller('user')
@UseGuards(PermissionGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly auditLogService: AuditLogService,
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
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.READ,
        entity: 'user',
        entityId: user.id,
        description: `Read user with ID: ${user.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for findById: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return user;
  }

  @MessagePattern(UserMessagePattern.findAll)
  @RequirePermission(['system admin'], { action: 'read', resource: 'user' })
  async findAll(@Payload() payload: MessagePayloadDto<FilterUserDto>) {
    const { claims } = payload;
    const result = await this.userService.find(payload.request.body);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.READ,
        entity: 'user',
        description: `Read users`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for findAll: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.create)
  @RequirePermission(['system admin'], { action: 'create', resource: 'user' })
  async create(@Payload() payload: MessagePayloadDto<CreateUserDto>) {
    const { claims } = payload;
    const result = await this.userService.create(
      payload.request.body,
      claims.sub,
    );
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.CREATE,
        entity: 'user',
        entityId: result.id,
        description: `Created new user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for create: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
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
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'user',
        entityId: result.id,
        description: `Updated user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for update: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.delete)
  @RequirePermission(['system admin'], { action: 'delete', resource: 'user' })
  async delete(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    const result = await this.userService.delete(payload.request.path.id);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.DELETE,
        entity: 'user',
        entityId: result.id,
        description: `Deleted user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for delete: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.deactivate)
  @RequirePermission(['system admin'], { action: 'update', resource: 'user' })
  async deactivate(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    const result = await this.userService.deactivate(payload.request.path.id);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'user',
        entityId: result.id,
        description: `Deactivated user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for deactivate: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.activate)
  @RequirePermission(['system admin'], { action: 'update', resource: 'user' })
  async activate(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    const result = await this.userService.activate(payload.request.path.id);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'user',
        entityId: result.id,
        description: `Activated user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for activate: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.updatePublicKey)
  async updatePublicKey(
    @Payload()
    payload: MessagePayloadDto<{ publicKey: string }>,
  ) {
    const { claims } = payload;
    const publicKey = payload.request.body.publicKey;

    const result = await this.userService.updatePublicKey(
      claims.sub,
      publicKey,
    );
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'user',
        entityId: result.id,
        description: `Updated public key for user with ID: ${result.id}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for updatePublicKey: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }

  @MessagePattern(UserMessagePattern.findPublicKey)
  async findPublicKey(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    const result = await this.userService.getPublicKeyById(claims.sub);
    // Fire-and-forget audit log call
    this.auditLogService
      .log(claims, {
        userId: claims.sub,
        action: AuditAction.READ,
        entity: 'user',
        entityId: claims.sub,
        description: `Retrieved public key for user with ID: ${claims.sub}`,
      })
      .catch((error) => {
        this.logger.error(
          `Audit log failed for findPublicKey: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      });
    return result;
  }
}
