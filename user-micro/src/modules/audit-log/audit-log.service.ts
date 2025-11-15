import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { AuditLogMessagePattern } from 'src/modules/audit-log/audit-log-message.pattern';
import { CreateAuditLogDto } from 'src/modules/audit-log/dtos/create-audit-log.dto';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class AuditLogService {
  private readonly logger: Logger = new Logger(AuditLogService.name);
  private readonly sender: NatsClientSender<typeof AuditLogMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, AuditLogMessagePattern);
  }

  async log(claims: TokenClaimsDto, payload: CreateAuditLogDto): Promise<void> {
    this.logger.log(
      `Logging audit: action=${payload.action}, entity=${payload.entity}, userId=${payload.userId}`,
    );
    try {
      await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: payload },
        },
      });
      this.logger.debug(
        `Audit log created successfully: action=${payload.action}, entity=${payload.entity}`,
      );
    } catch (error: any) {
      // Never throw - audit logging is non-critical
      this.logger.error(
        `Failed to create audit log: action=${payload.action}, entity=${payload.entity}, userId=${payload.userId}, error=${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      // Silently fail - audit log failures should not affect the main operation
    }
  }
}
