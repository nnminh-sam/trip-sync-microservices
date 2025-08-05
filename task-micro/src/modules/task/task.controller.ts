import { Controller, HttpStatus } from '@nestjs/common';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { CompleteTaskDto } from 'src/modules/task/dtos/complete-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { TaskMessagePattern } from 'src/modules/task/task-message.pattern';
import { TaskService } from 'src/modules/task/task.service';
import { throwRpcException } from 'src/utils';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(TaskMessagePattern.findAll)
  async find(@Payload() payload: MessagePayloadDto<FilterTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.find(payload.request.body);
  }

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

  @MessagePattern(TaskMessagePattern.delete)
  async delete(@Payload() payload: MessagePayloadDto) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.delete(id);
  }

  @MessagePattern(TaskMessagePattern.complete)
  async complete(@Payload() payload: MessagePayloadDto<CompleteTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.completeTask(id, payload.request.body);
  }

  @MessagePattern(TaskMessagePattern.cancel)
  async cancel(@Payload() payload: MessagePayloadDto<CancelTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.cancelTask(id, payload.request.body);
  }
}
