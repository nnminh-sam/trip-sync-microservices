import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { AuditLogMessagePattern } from 'src/modules/audit-log/audit-log-message.pattern';
import { CreateAuditLogDto } from 'src/modules/audit-log/dtos/create-audit-log.dto';
import { NatsClientSender, throwRpcException } from 'src/utils';

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

  async log(claims: TokenClaimsDto, payload: CreateAuditLogDto) {
    this.logger.log(`Logging with payload: ${JSON.stringify(payload)}`);
    try {
      return await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: payload },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create audit log',
      });
    }
  }
}
