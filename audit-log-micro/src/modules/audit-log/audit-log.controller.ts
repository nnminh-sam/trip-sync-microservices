import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { AuditLogMessagePattern } from './audit-log-message.pattern';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dtos/create-audit-log.dto';
import { FilterAuditLogDto } from './dtos/filter-audit-log.dto';
import { throwRpcException } from 'src/utils';
import { AuthService } from 'src/modules/auth/auth.service';

@Controller()
export class AuditLogController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @MessagePattern(AuditLogMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateAuditLogDto>) {
    const createAuditLogDto = payload.request.body;
    if (!createAuditLogDto) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Request body is required',
      });
    }

    return await this.auditLogService.create(createAuditLogDto);
  }

  @MessagePattern(AuditLogMessagePattern.findById)
  async findById(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    await this.authService.authorize({
      claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'log',
        },
      },
    });

    const { id } = payload.request.path;

    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Audit log ID is required',
      });
    }

    return await this.auditLogService.findById(id);
  }

  @MessagePattern(AuditLogMessagePattern.findAll)
  async findAll(@Payload() payload: MessagePayloadDto<FilterAuditLogDto>) {
    const { claims } = payload;
    await this.authService.authorize({
      claims,
      required: {
        roles: ['system admin', 'manager'],
        permission: {
          action: 'read',
          resource: 'log',
        },
      },
    });

    return await this.auditLogService.findAll(payload.request.body);
  }
}
