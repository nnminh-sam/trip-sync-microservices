import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { EvaluationMessagePattern } from './evaluation-message.pattern';
import { CreateEvaluationDto } from './dtos/create-evaluation.dto';
import { FilterEvaluationDto } from './dtos/filter-evaluation.dto';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  private readonly sender: NatsClientSender<any>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, {
      CREATE: EvaluationMessagePattern.CREATE,
      FIND_ALL: EvaluationMessagePattern.FIND_ALL,
      FIND_ONE: EvaluationMessagePattern.FIND_ONE,
    });
  }

  async create(claims: TokenClaimsDto, dto: CreateEvaluationDto) {
    this.logger.log('Sending create evaluation request');
    try {
      const result = await this.sender.send({
        messagePattern: 'CREATE',
        payload: {
          claims,
          request: {
            body: dto,
          },
        },
      });

      this.logger.log('Evaluation created successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to create evaluation', error.stack);
      throw error;
    }
  }

  async findAll(claims: TokenClaimsDto, filter: FilterEvaluationDto) {
    this.logger.log('Sending find all evaluations request');
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ALL',
        payload: {
          claims,
          request: {
            body: filter,
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch evaluations', error.stack);
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`Sending find evaluation by ID: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'FIND_ONE',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch evaluation ${id}`, error.stack);
      throw error;
    }
  }
}
