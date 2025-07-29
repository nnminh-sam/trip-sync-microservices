import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateExportDto } from './dtos/create-export.dto';
import { ExportMessagePattern } from './export-message.pattern';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly sender: NatsClientSender<typeof ExportMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, ExportMessagePattern);
  }

  async createExportRequest(
    claims: TokenClaimsDto,
    payload: CreateExportDto,
  ) {
    this.logger.log(`Creating export request with type ${payload.type}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: {
            body: payload,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to create export request', error.stack);
      throw error;
    }
  }

  async getExportById(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Fetching export log with id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: {
            param: { id },
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get export log', error.stack);
      throw error;
    }
  }
}
