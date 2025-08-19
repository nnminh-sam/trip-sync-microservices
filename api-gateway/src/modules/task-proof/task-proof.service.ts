import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateTaskProofDto } from 'src/modules/task-proof/dtos/create-task-proof.dto';
import { BulkCreateTaskProofDto } from 'src/modules/task-proof/dtos/bulk-create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task-proof/dtos/filter-task-proof.dto';
import { TaskProofMessagePattern } from 'src/modules/task-proof/task-proof-message.pattern';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class TaskProofService {
  private readonly logger: Logger = new Logger(TaskProofService.name);
  private readonly sender: NatsClientSender<typeof TaskProofMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, TaskProofMessagePattern);
  }

  async create(
    claims: TokenClaimsDto,
    taskId: string,
    createTaskProofDto: CreateTaskProofDto,
  ) {
    this.logger.log(
      `create called for task ${taskId} with payload: ${JSON.stringify(createTaskProofDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: {
            path: { taskId },
            body: createTaskProofDto,
          },
        },
      });
      this.logger.log(`create success for task ${taskId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `create failed for task ${taskId}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findByTask(
    claims: TokenClaimsDto,
    taskId: string,
    filterTaskProofDto: FilterTaskProofDto,
  ) {
    this.logger.log(
      `findByTask called for task ${taskId} with payload: ${JSON.stringify(filterTaskProofDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findByTask',
        payload: {
          claims,
          request: {
            path: { taskId },
            body: filterTaskProofDto,
          },
        },
      });
      this.logger.log(
        `findByTask success for task ${taskId} with payload: ${JSON.stringify(filterTaskProofDto)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `findByTask failed for task ${taskId}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async findOne(claims: TokenClaimsDto, id: string) {
    this.logger.log(`findOne called with id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'findOne',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      this.logger.log(`findOne success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `findOne failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async delete(claims: TokenClaimsDto, id: string) {
    this.logger.log(`delete called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'delete',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      this.logger.log(`delete success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`delete failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async createBulk(
    claims: TokenClaimsDto,
    bulkCreateTaskProofDto: BulkCreateTaskProofDto,
  ) {
    this.logger.log(
      `createBulk called with payload: ${JSON.stringify(bulkCreateTaskProofDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'createBulk',
        payload: {
          claims,
          request: {
            body: bulkCreateTaskProofDto,
          },
        },
      });
      this.logger.log(
        `createBulk success for task ${bulkCreateTaskProofDto.taskId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `createBulk failed for task ${bulkCreateTaskProofDto.taskId}`,
        error.stack || error,
      );
      throw error;
    }
  }
}
