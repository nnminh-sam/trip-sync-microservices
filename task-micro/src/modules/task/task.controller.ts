import { Controller, HttpStatus } from '@nestjs/common';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
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
  async update(@Payload() payload: MessagePayloadDto<CreateTaskDto>) {
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
  async delete(@Payload() payload: MessagePayloadDto<CreateTaskDto>) {
    const { id } = payload.request.path;
    if (!id) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required task ID',
      });
    }
    return await this.taskService.delete(id);
  }
}
