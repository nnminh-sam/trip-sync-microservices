import { Controller, HttpStatus } from '@nestjs/common';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { ResolveTaskCancelationDto } from 'src/modules/task/dtos/resolve-task-cancelation.dto';
import { TaskMessagePattern } from 'src/modules/task/task-message.pattern';
import { throwRpcException } from 'src/utils';
import { TaskService } from './task.service';

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(TaskMessagePattern.findOne)
  async findOne(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.findOne(id);
  }

  @MessagePattern(TaskMessagePattern.create)
  async create(@Payload() payload: MessagePayloadDto<CreateTaskDto>) {
    return await this.taskService.create(payload.request.body);
  }

  @MessagePattern(TaskMessagePattern.update)
  async update(@Payload() payload: MessagePayloadDto<UpdateTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.update(id, payload.request.body);
  }

  @MessagePattern(TaskMessagePattern.requestCancel)
  async requestCancel(@Payload() payload: MessagePayloadDto<CancelTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Task ID',
      });
    }

    const dto = payload.request.body;

    return this.taskService.requestCancel(id, dto, payload.claims.sub);
  }

  @MessagePattern(TaskMessagePattern.resolveCancel)
  async resolveCancel(
    @Payload() payload: MessagePayloadDto<ResolveTaskCancelationDto>,
  ) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Cancelation ID',
      });
    }

    const dto = payload.request.body;

    return this.taskService.resolveCancel(id, dto, payload.claims.sub);
  }

  @MessagePattern(TaskMessagePattern.getCancelations)
  async getCancelationRequests(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required Task ID',
      });
    }

    return await this.taskService.getCancelationRequests(id);
  }
}
