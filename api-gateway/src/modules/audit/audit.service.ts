import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { AuditLogMessagePattern } from 'src/modules/audit/audit-message.pattern';
import { CreateAuditLogDto } from 'src/modules/audit/dtos/create-audit-log.dto';
import { FilterAuditLogDto } from 'src/modules/audit/dtos/filter-audit-log.dto';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class AuditService {
  private readonly logger: Logger = new Logger(AuditService.name);
  private readonly sender: NatsClientSender<typeof AuditLogMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, AuditLogMessagePattern);
  }

  async create(claims: TokenClaimsDto, createAuditLogDto: CreateAuditLogDto) {
    this.logger.log(`Creating audit log: ${JSON.stringify(createAuditLogDto)}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: { claims, request: { body: createAuditLogDto } },
      });
      this.logger.log(`Audit log created successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findById(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Finding audit log by ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findById',
        payload: { claims, request: { path: { id } } },
      });
      this.logger.log(`Audit log found with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to find audit log by ID ${id}: ${error.message}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filterDto: FilterAuditLogDto) {
    this.logger.log(
      `Finding all audit logs with filter: ${JSON.stringify(filterDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findAll',
        payload: { claims, request: { body: filterDto } },
      });
      this.logger.log(`Audit logs found successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs: ${error.message}`,
        error.stack || error,
      );
      throw error;
    }
  }
}
