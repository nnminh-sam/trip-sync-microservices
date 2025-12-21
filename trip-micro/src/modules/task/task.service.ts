import { throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/models/task.model';
import { Cancelation } from 'src/models/cancelation.model';
import { EntityManager, Repository } from 'typeorm';
import { CreateTaskDto } from 'src/modules/task/dtos/create-task.dto';
import { UpdateTaskDto } from 'src/modules/task/dtos/update-task.dto';
import { CancelTaskDto } from 'src/modules/task/dtos/cancel-task.dto';
import { ResolveTaskCancelationDto } from 'src/modules/task/dtos/resolve-task-cancelation.dto';
import { CancelationTargetEntity } from 'src/models/enums/TargetEntity.enum';
import { CancelationDecision } from 'src/models/enums/CancelationDecision.enum';
import { TaskStatusEnum } from 'src/models/task-status.enum';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Cancelation)
    private readonly cancelationRepo: Repository<Cancelation>,
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

  async findOne(id: string): Promise<any> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Task not found',
      });
    }

    // Fetch associated cancellation requests
    const cancelationRequests = await this.cancelationRepo.find({
      where: {
        targetEntity: CancelationTargetEntity.TASK,
        targetId: id,
      },
      order: { createdAt: 'DESC' },
    });

    // attach cancelation requests to task object
    return {
      ...task,
      cancelationRequests,
    };
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

  private async cancelEntity(payload: {
    decision: CancelationDecision;
    targetEntity: CancelationTargetEntity;
    targetId: string;
    reason: string;
    attachmentId: string;
    createdBy: string;
    resolvedBy: string;
    resolvedAt: Date;
  }): Promise<Cancelation> {
    const cancelation = this.cancelationRepo.create({
      targetEntity: payload.targetEntity,
      targetId: payload.targetId,
      decision: payload.decision,
      reason: payload.reason,
      attachmentId: payload.attachmentId,
      createdBy: payload.createdBy,
      resolvedBy: payload.resolvedBy,
      resolvedAt: payload.resolvedAt,
    });
    return await this.cancelationRepo.save(cancelation);
  }

  async requestCancel(
    taskId: string,
    dto: CancelTaskDto,
    userId: string,
  ): Promise<Cancelation> {
    const task = await this.findOne(taskId);

    const cancelation = await this.cancelEntity({
      decision: null,
      targetEntity: CancelationTargetEntity.TASK,
      targetId: task.id,
      reason: dto.reason,
      attachmentId: dto.attachmentId,
      createdBy: userId,
      resolvedBy: null,
      resolvedAt: null,
    });

    this.logger.log(`Task cancellation request created for task: ${task.id}`);

    return cancelation;
  }

  async resolveCancel(
    cancelationId: string,
    dto: ResolveTaskCancelationDto,
    userId: string,
  ): Promise<Task> {
    const cancelation = await this.cancelationRepo.findOne({
      where: { id: cancelationId },
    });

    if (!cancelation) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Cancelation request not found',
      });
    }

    if (cancelation.decision !== null) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'This cancellation request has already been resolved',
      });
    }

    const task = await this.findOne(cancelation.targetId);

    cancelation.decision = dto.decision;
    cancelation.resolvedBy = userId;
    cancelation.resolvedAt = new Date();
    if (dto.note) {
      cancelation.resolveNote = dto.note;
    }
    await this.cancelationRepo.save(cancelation);

    let updatedTask = task;

    if (dto.decision === CancelationDecision.APPROVE) {
      // Mark task as canceled when cancellation is approved
      updatedTask = await this.taskRepository.save({
        ...task,
        status: TaskStatusEnum.CANCELED,
        updatedAt: new Date(),
      });

      this.logger.log(`Task cancellation approved for task: ${task.id}`);
    } else if (dto.decision === CancelationDecision.REJECT) {
      this.logger.log(`Task cancellation rejected for task: ${task.id}`);
    }

    return updatedTask;
  }

  async getCancelationRequests(taskId: string): Promise<Cancelation[]> {
    const task = await this.findOne(taskId);

    const cancelations = await this.cancelationRepo.find({
      where: {
        targetEntity: CancelationTargetEntity.TASK,
        targetId: taskId,
      },
      order: { createdAt: 'DESC' },
    });

    this.logger.log(
      `Retrieved ${cancelations.length} cancellation requests for task: ${taskId}`,
    );

    return cancelations;
  }
}
