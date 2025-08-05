import { ListDataDto } from '../../dtos/list-data.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/models/task.model';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { Like, Repository } from 'typeorm';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async find(payload: FilterTaskDto) {
    const {
      page,
      size,
      order,
      sortBy,
      tripLocationId,
      title,
      status,
      deadline,
      completedAt,
      canceledAt,
    } = payload;

    const [tasks, total] = await this.taskRepository.findAndCount({
      where: {
        ...(tripLocationId && { tripLocationId }),
        ...(title && { title: Like(`%${title}%`) }),
        ...(status && { status }),
        ...(deadline && { deadline }),
        ...(completedAt && { completedAt }),
        ...(canceledAt && { canceledAt }),
      },
      ...paginateAndOrder({
        page,
        size,
        order,
        sortBy,
      }),
    });

    return ListDataDto.build<Task>({
      data: tasks,
      page,
      size,
      total,
    });
  }

  async create(payload: CreateTaskDto) {
    const existingTask = await this.taskRepository.existsBy({
      title: payload.title,
    });
    if (existingTask) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Duplicated task title',
      });
    }

    try {
      const task = this.taskRepository.create({
        ...payload,
        createdAt: new Date(),
      });
      const savedTask = await this.taskRepository.save(task);
      return savedTask;
    } catch (error: any) {
      this.logger.error('Cannot create new task', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Task not found',
      });
    }

    return task;
  }

  async update(id: string, payload: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    try {
      const updatedTask = await this.taskRepository.save({
        ...task,
        ...payload,
        updatedAt: new Date(),
      });

      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to update task with id ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update task',
      });
    }
  }

  async delete(id: string): Promise<void> {
    const task = await this.findOne(id);

    try {
      await this.taskRepository.remove(task);
    } catch (error) {
      this.logger.error(`Failed to delete task with id ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete task',
      });
    }
  }
}
