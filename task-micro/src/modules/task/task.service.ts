import { ListDataDto } from '../../dtos/list-data.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { DataSource, Like, Repository } from 'typeorm';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { CompleteTaskDto } from 'src/modules/task/dtos/complete-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { TaskStatusManagerService, TaskStatus } from './services/task-status-manager.service';
import { TaskProofService } from '../task-proof/task-proof.service';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskProof)
    private readonly taskProofRepository: Repository<TaskProof>,
    private readonly taskStatusManager: TaskStatusManagerService,
    @Inject(forwardRef(() => TaskProofService))
    private readonly taskProofService: TaskProofService,
    private readonly dataSource: DataSource,
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
      activeOnly = true,
    } = payload;

    const [tasks, total] = await this.taskRepository.findAndCount({
      where: {
        ...(tripLocationId && { tripLocationId }),
        ...(title && { title: Like(`%${title}%`) }),
        ...(status && { status }),
        ...(deadline && { deadline }),
        ...(completedAt && { completedAt }),
        ...(canceledAt && { canceledAt }),
        ...(activeOnly && { deletedAt: null }),
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

  async findByTripLocation(tripLocationId: string): Promise<Task[]> {
    try {
      const tasks = await this.taskRepository.find({
        where: {
          tripLocationId,
          deletedAt: null, // Only return active tasks
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return tasks;
    } catch (error) {
      this.logger.error(`Failed to find tasks for trip location ${tripLocationId}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve tasks',
      });
    }
  }

  async update(id: string, payload: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Check if task can be modified
    if (!this.taskStatusManager.canModifyTask(task)) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Cannot modify task in ${task.status} status`,
      });
    }

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
      // Soft delete using BaseModel method
      task.softDelete();
      await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Failed to delete task with id ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete task',
      });
    }
  }

  async restoreTask(id: string): Promise<Task> {
    try {
      // Find the task including soft deleted ones
      const task = await this.taskRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!task) {
        throwRpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Task not found',
        });
      }

      if (!task.isDeleted()) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Task is not deleted',
        });
      }

      // Restore the task using BaseModel method
      task.restore();
      const restoredTask = await this.taskRepository.save(task);

      this.logger.log(`Task ${id} has been restored`);
      return restoredTask;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      this.logger.error(`Failed to restore task with id ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to restore task',
      });
    }
  }

  async completeTask(id: string, payload: CompleteTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get task with lock to prevent concurrent updates
      const task = await queryRunner.manager.findOne(Task, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!task) {
        throwRpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Task not found',
        });
      }

      // Validate status transition
      const validation = this.taskStatusManager.validateStatusTransition(
        task.status as TaskStatus,
        TaskStatus.COMPLETED,
        task,
      );

      if (!validation.isValid) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: validation.reason,
        });
      }

      // Apply status change
      this.taskStatusManager.applyStatusChange(task, TaskStatus.COMPLETED, {
        completedBy: payload.userId,
      });

      // Update note if provided
      if (payload.note) {
        task.note = payload.note;
      }

      // Save the task
      const updatedTask = await queryRunner.manager.save(task);

      // Create completion proof
      const proofData = {
        taskId: task.id,
        type: 'completion' as const,
        mediaUrl: payload.proof.mediaUrl,
        mediaType: payload.proof.mediaType,
        latitude: payload.proof.latitude,
        longitude: payload.proof.longitude,
        timestamp: payload.proof.timestamp,
        uploadedBy: payload.userId,
        locationPoint: {
          x: payload.proof.longitude,
          y: payload.proof.latitude,
        },
      };

      await queryRunner.manager.save(TaskProof, proofData);

      await queryRunner.commitTransaction();

      this.logger.log(`Task ${id} completed by user ${payload.userId}`);
      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error.statusCode) {
        throw error; // Re-throw RPC exceptions
      }
      
      this.logger.error(`Failed to complete task ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to complete task',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async cancelTask(id: string, payload: CancelTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get task with lock to prevent concurrent updates
      const task = await queryRunner.manager.findOne(Task, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!task) {
        throwRpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Task not found',
        });
      }

      // Validate status transition
      const validation = this.taskStatusManager.validateStatusTransition(
        task.status as TaskStatus,
        TaskStatus.CANCELED,
        task,
      );

      if (!validation.isValid) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: validation.reason,
        });
      }

      // Apply status change with cancel reason
      this.taskStatusManager.applyStatusChange(task, TaskStatus.CANCELED, {
        cancelReason: payload.cancelReason,
        canceledBy: payload.userId,
      });

      // Save the task
      const updatedTask = await queryRunner.manager.save(task);

      // Create cancellation proof
      const proofData = {
        taskId: task.id,
        type: 'cancellation' as const,
        mediaUrl: payload.proof.mediaUrl,
        mediaType: payload.proof.mediaType,
        latitude: payload.proof.latitude,
        longitude: payload.proof.longitude,
        timestamp: payload.proof.timestamp,
        uploadedBy: payload.userId,
        locationPoint: {
          x: payload.proof.longitude,
          y: payload.proof.latitude,
        },
      };

      await queryRunner.manager.save(TaskProof, proofData);

      await queryRunner.commitTransaction();

      this.logger.log(`Task ${id} canceled by user ${payload.userId} with reason: ${payload.cancelReason}`);
      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error.statusCode) {
        throw error; // Re-throw RPC exceptions
      }
      
      this.logger.error(`Failed to cancel task ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to cancel task',
      });
    } finally {
      await queryRunner.release();
    }
  }
}
