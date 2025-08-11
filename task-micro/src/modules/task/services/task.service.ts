import { ListDataDto } from '../../../dtos/list-data.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskAttribute } from 'src/models/task.model';
import { TaskProof } from 'src/models/task-proof.model';
import { FilterTaskDto } from 'src/modules/task/dtos/filter-task.dto';
import { DataSource, Like, Repository } from 'typeorm';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { CompleteTaskDto } from 'src/modules/task/dtos/complete-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { TaskStatusManagerService } from './task-status-manager.service';
import { TaskStatusEnum } from 'src/models/task-status.enum';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly taskStatusManager: TaskStatusManagerService,

    private readonly dataSource: DataSource,
  ) {}

  async find(payload: FilterTaskDto) {
    this.logger.log('Filtering task with payload: ' + JSON.stringify(payload));

    const {
      page,
      size,
      order,
      sortBy,
      tripLocationId,
      tripId,
      title,
      status,
      deadline,
      startedAt,
      completedAt,
      approvedAt,
      approvedBy,
      rejectedAt,
      rejectedBy,
      canceledAt,
      activeOnly,
    } = payload;

    if (tripId) {
      // TODO: Fetch from trip service list of locations to get TripLocationIds then filter tasks using fetched TripLocationIds
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where: {
        ...(tripLocationId && { tripLocationId }),
        ...(title && { title: Like(`%${title}%`) }),
        ...(status && { status }),
        ...(deadline && { deadline }),
        ...(startedAt && { startedAt }),
        ...(completedAt && { completedAt }),
        ...(approvedAt && { approvedAt }),
        ...(approvedBy && { approvedBy }),
        ...(rejectedAt && { rejectedAt }),
        ...(rejectedBy && { rejectedBy }),
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

    // TODO: Check if the trip location id is exist

    try {
      const task: Task = this.taskRepository.create({
        ...payload,
        status: TaskStatusEnum.PENDING,
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

    // * Check if task can be modified
    if (!this.taskStatusManager.canModifyTask(task)) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Cannot modify task in ${task.status} status`,
      });
    }

    // * Apply task status transitsion update
    const transitsionedTask = this.taskStatusManager.applyStatusChange(
      task,
      payload.status as TaskStatusEnum,
      { ...payload } as Record<TaskAttribute, any>,
    );

    try {
      const updatedTask = await this.taskRepository.save({
        ...task,
        ...payload,
        ...transitsionedTask,
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
      // * Get task with lock to prevent concurrent updates
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

      // * Validate status transition
      const validation = this.taskStatusManager.validateStatusTransition(
        task.status as TaskStatusEnum,
        TaskStatusEnum.SUBMITTED,
        task,
      );
      if (!validation.isValid) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: validation.reason,
        });
      }

      // * Apply status change
      this.taskStatusManager.applyStatusChange(task, TaskStatusEnum.SUBMITTED);

      // * Update note if provided
      if (payload.note) {
        task.note = payload.note;
      }

      // * Save the task
      const updatedTask = await queryRunner.manager.save(task);

      // * Create completion proof
      const proofData = {
        taskId: task.id,
        type: TaskProofTypeEnum.COMPLETION,
        name: payload.proof.name,
        mediaUrl: payload.proof.mediaUrl,
        mediaType: payload.proof.mediaType,
        latitude: payload.proof.latitude,
        longitude: payload.proof.longitude,
        timestamp: new Date(),
        uploadedBy: payload.assigneeId,
      } as TaskProof;

      await queryRunner.manager.save(TaskProof, proofData);

      await queryRunner.commitTransaction();

      this.logger.log(`Task ${id} completed by user ${payload.assigneeId}`);
      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.statusCode) {
        throw error;
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

  async approveTask(id: string, approverId: string): Promise<Task> {
    const task = await this.findOne(id);

    // * Validate status transition
    const validation = this.taskStatusManager.validateStatusTransition(
      task.status as TaskStatusEnum,
      TaskStatusEnum.APPROVED,
      task,
    );
    if (!validation.isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.reason,
      });
    }

    // * Apply status change
    const additionalData = {
      approvedBy: approverId,
    } as Record<TaskAttribute, any>;
    this.taskStatusManager.applyStatusChange(
      task,
      TaskStatusEnum.APPROVED,
      additionalData,
    );

    try {
      const updatedTask = await this.taskRepository.save(task);
      this.logger.log(`Task ${id} approved by user ${approverId}`);
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to approve task ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to approve task',
      });
    }
  }

  async rejectTask(
    id: string,
    rejectorId: string,
    reason: string,
  ): Promise<Task> {
    const task = await this.findOne(id);
    console.log('🚀 ~ TaskService ~ rejectTask ~ task:', task);

    // Validate status transition
    const validation = this.taskStatusManager.validateStatusTransition(
      task.status as TaskStatusEnum,
      TaskStatusEnum.REJECTED,
      task,
    );
    if (!validation.isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.reason,
      });
    }

    // * Apply status change
    const additionalData = {
      rejectedBy: rejectorId,
      rejectionReason: reason,
    } as Record<TaskAttribute, any>;
    this.taskStatusManager.applyStatusChange(
      task,
      TaskStatusEnum.REJECTED,
      additionalData,
    );

    try {
      const updatedTask = await this.taskRepository.save(task);
      this.logger.log(
        `Task ${id} rejected by user ${rejectorId} with reason: ${reason}`,
      );
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to reject task ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to reject task',
      });
    }
  }

  async startTask(id: string): Promise<Task> {
    const task = await this.findOne(id);

    // Validate status transition
    const validation = this.taskStatusManager.validateStatusTransition(
      task.status as TaskStatusEnum,
      TaskStatusEnum.IN_PROGRESS,
      task,
    );

    if (!validation.isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.reason,
      });
    }

    // Apply status change
    this.taskStatusManager.applyStatusChange(task, TaskStatusEnum.IN_PROGRESS);

    try {
      const updatedTask = await this.taskRepository.save(task);
      this.logger.log(`Task ${id} started`);
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to start task ${id}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to start task',
      });
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
        task.status as TaskStatusEnum,
        TaskStatusEnum.CANCELED,
        task,
      );

      if (!validation.isValid) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: validation.reason,
        });
      }

      // Apply status change with cancel reason
      this.taskStatusManager.applyStatusChange(task, TaskStatusEnum.CANCELED, {
        cancelReason: payload.cancelReason,
        canceledBy: payload.cancelerId,
      });

      // Save the task
      const updatedTask = await queryRunner.manager.save(task);

      // Create cancellation proof
      const proofData = {
        taskId: task.id,
        type: TaskProofTypeEnum.CANCELLATION,
        name: payload.proof.name,
        mediaUrl: payload.proof.mediaUrl,
        mediaType: payload.proof.mediaType,
        latitude: payload.proof.latitude,
        longitude: payload.proof.longitude,
        timestamp: new Date(),
        uploadedBy: payload.cancelerId,
      };

      await queryRunner.manager.save(TaskProof, proofData);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Task ${id} canceled by user ${payload.cancelerId} with reason: ${payload.cancelReason}`,
      );
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
