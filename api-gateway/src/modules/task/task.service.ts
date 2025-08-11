import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from 'src/client/clients';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { ApproveTaskDto } from 'src/modules/task/dtos/approve-task.dto';
import { RejectTaskDto } from 'src/modules/task/dtos/reject-task.dto';
import { CompleteTaskDto } from 'src/modules/task/dtos/complete-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { TaskMessagePattern } from 'src/modules/task/task-message.pattern';
import { NatsClientSender } from 'src/utils';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);
  private readonly sender: NatsClientSender<typeof TaskMessagePattern>;

  constructor(
    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.sender = new NatsClientSender(natsClient, TaskMessagePattern);
  }

  async findAll(claims: TokenClaimsDto, filterTaskDto: FilterTaskDto) {
    this.logger.log(
      `findAll called with payload: ${JSON.stringify(filterTaskDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'findAll',
        payload: { 
          claims, 
          request: { 
            path: { id: claims.sub },
            body: filterTaskDto 
          } 
        },
      });
      this.logger.log(
        `findAll success with payload: ${JSON.stringify(filterTaskDto)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `findAll failed with payload: ${JSON.stringify(filterTaskDto)}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async create(claims: TokenClaimsDto, createTaskDto: CreateTaskDto) {
    this.logger.log(
      `create called with payload: ${JSON.stringify(createTaskDto)}`,
    );
    try {
      const result = await this.sender.send({
        messagePattern: 'create',
        payload: {
          claims,
          request: { body: createTaskDto },
        },
      });
      this.logger.log(`create success for task: ${createTaskDto.title || ''}`);
      return result;
    } catch (error) {
      this.logger.error(
        `create failed for task: ${createTaskDto.title || ''}`,
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
          request: { path: { id } },
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

  async update(claims: TokenClaimsDto, id: string, updateTaskDto: UpdateTaskDto) {
    this.logger.log(`update called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'update',
        payload: {
          claims,
          request: {
            path: { id },
            body: updateTaskDto,
          },
        },
      });
      this.logger.log(`update success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `update failed for id: ${id}`,
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
          request: { path: { id } },
        },
      });
      this.logger.log(`delete success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`delete failed for id: ${id}`, error.stack || error);
      throw error;
    }
  }

  async approve(claims: TokenClaimsDto, id: string, approveTaskDto: ApproveTaskDto) {
    this.logger.log(`approve called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'approve',
        payload: {
          claims,
          request: {
            path: { id },
            body: approveTaskDto,
          },
        },
      });
      this.logger.log(`approve success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `approve failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async reject(claims: TokenClaimsDto, id: string, rejectTaskDto: RejectTaskDto) {
    this.logger.log(`reject called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'reject',
        payload: {
          claims,
          request: {
            path: { id },
            body: rejectTaskDto,
          },
        },
      });
      this.logger.log(`reject success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `reject failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async start(claims: TokenClaimsDto, id: string) {
    this.logger.log(`start called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'start',
        payload: {
          claims,
          request: {
            path: { id },
          },
        },
      });
      this.logger.log(`start success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `start failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async complete(claims: TokenClaimsDto, id: string, completeTaskDto: CompleteTaskDto) {
    this.logger.log(`complete called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'complete',
        payload: {
          claims,
          request: {
            path: { id },
            body: completeTaskDto,
          },
        },
      });
      this.logger.log(`complete success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `complete failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  async cancel(claims: TokenClaimsDto, id: string, cancelTaskDto: CancelTaskDto) {
    this.logger.log(`cancel called for id: ${id}`);
    try {
      const result = await this.sender.send({
        messagePattern: 'cancel',
        payload: {
          claims,
          request: {
            path: { id },
            body: cancelTaskDto,
          },
        },
      });
      this.logger.log(`cancel success for id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `cancel failed for id: ${id}`,
        error.stack || error,
      );
      throw error;
    }
  }
}
