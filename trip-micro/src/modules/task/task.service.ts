import { throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/models/task.model';
import { EntityManager, Repository } from 'typeorm';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(payload: CreateTaskDto, manager?: EntityManager): Promise<Task> {
    const repo = manager ? manager.getRepository(Task) : this.taskRepository;

    const existingTask = await repo.existsBy({
      title: payload.title,
    });
    if (existingTask) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Duplicated task title',
      });
    }
    if (!payload.description) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Missing task's description",
      });
    }

    try {
      const task: Task = repo.create({
        ...payload,
        createdAt: new Date(),
      });
      return await repo.save(task);
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

    // // * Check if task can be modified
    // if (!this.taskStatusManager.canModifyTask(task)) {
    //   throwRpcException({
    //     statusCode: HttpStatus.BAD_REQUEST,
    //     message: `Cannot modify task in ${task.status} status`,
    //   });
    // }

    // // * Apply task status transitsion update
    // const transitsionedTask = this.taskStatusManager.applyStatusChange(
    //   task,
    //   payload.status as TaskStatusEnum,
    //   { ...payload } as Record<TaskAttribute, any>,
    // );

    try {
      const updatedTask = await this.taskRepository.save({
        ...task,
        ...payload,
        // ...transitsionedTask,
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
}
