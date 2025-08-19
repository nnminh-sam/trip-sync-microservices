import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginDto } from 'src/modules/auth/dtos/login.dto';
import { AuthMessagePattern } from 'src/modules/auth/auth-message.pattern';
import { AuthorizeClaimsPayloadDto } from 'src/modules/role/dtos/authorize-claims-payload.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/dtos/create-audit-log.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly authService: AuthService,
  ) {}

  @MessagePattern(AuthMessagePattern.login)
  async login(@Payload() payload: MessagePayloadDto<LoginDto>) {
    const { body } = payload.request;
    return await this.authService.login(body);
  }

  @MessagePattern(AuthMessagePattern.updatePassword)
  async updatePassword(@Payload() payload: MessagePayloadDto) {
    const { claims } = payload;
    const result = await this.authService.updatePassword(claims.sub);
    try {
      this.auditLogService.log(claims, {
        userId: claims.sub,
        action: AuditAction.UPDATE,
        entity: 'user',
        description: `Updated password for user with ID: ${claims.sub}`,
      });
    } catch (error) {
      console.error('Audit log service call failed:', error);
    }
    return result;
  }

  @MessagePattern(AuthMessagePattern.authorizeClaims)
  async authorizeClaims(
    @Payload() payload: MessagePayloadDto<AuthorizeClaimsPayloadDto>,
  ) {
    await this.authService.authorizeClaims(payload.request.body);
    return { message: 'ok' };
  }
}
