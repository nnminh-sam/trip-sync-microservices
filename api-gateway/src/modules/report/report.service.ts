import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterReportDto } from './dtos/filter-report.dto';
import { ReportMessagePattern } from './report-message.pattern';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly sender: NatsClientSender<typeof ReportMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, ReportMessagePattern);
  }

  async getTripSummary(claims: TokenClaimsDto, filter: FilterReportDto) {
    this.logger.log('Sending find all trips request');
    try {
      const result = await this.sender.send({
        messagePattern: 'TRIP_SUMMARY',
        payload: {
          claims,
          request: {
            body: filter,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch trips', error.stack);
      throw error;
    }
  }
  async getTaskCompletion(claims: TokenClaimsDto, filter: FilterReportDto) {
    this.logger.log('Sending find all tasks request');
    try {
      const result = await this.sender.send({
        messagePattern: 'TASK_COMPLETION',
        payload: {
          claims,
          request: {
            body: filter,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch trips', error.stack);
      throw error;
    }
  }
}
