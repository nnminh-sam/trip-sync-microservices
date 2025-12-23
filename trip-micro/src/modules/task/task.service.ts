import { throwRpcException } from 'src/utils';
import { HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
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
import { FirebaseService } from 'src/modules/firebase/firebase.service';
import { TripLocation } from 'src/models/trip-location.model';
import { Trip } from 'src/models/trip.model';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { TripProgress } from 'src/models/trip-progress.model';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class TaskService {
  private readonly logger: Logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Cancelation)
    private readonly cancelationRepo: Repository<Cancelation>,

    @InjectRepository(TripLocation)
    private readonly tripLocationRepo: Repository<TripLocation>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(TripProgress)
    private readonly tripProgressRepo: Repository<TripProgress>,

    private readonly firebaseService: FirebaseService,
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

  private async fetchAttachmentDetails(attachmentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `http://34.142.235.151/api/v1/media/${attachmentId}`,
        { timeout: 5000 },
      );
      return response.data;
    } catch (error: any) {
      // Gracefully handle 404 - return null instead of throwing
      if (error.response?.status === 404) {
        this.logger.debug(`Attachment not found for ID: ${attachmentId}`);
        return null;
      }
      // Log other errors but don't throw - continue with enrichment
      this.logger.warn(
        `Failed to fetch attachment ${attachmentId}: ${error.message}`,
      );
      return null;
    }
  }

  private async enrichCancelationsWithAttachments(
    cancelations: Cancelation[],
  ): Promise<any[]> {
    return Promise.all(
      cancelations.map(async (cancelation) => {
        const attachment = cancelation.attachmentId
          ? await this.fetchAttachmentDetails(cancelation.attachmentId)
          : null;

        return {
          ...cancelation,
          ...(attachment && { attachment }),
        };
      }),
    );
  }

  private async saveProgress(
    trip: Trip,
    actorId: string,
    status: TripStatusEnum,
    title: string,
    description: string,
  ): Promise<TripProgress> {
    try {
      const progress = this.tripProgressRepo.create({
        trip,
        actorId,
        status,
        title,
        description,
      });
      return await this.tripProgressRepo.save(progress);
    } catch (error) {
      this.logger.error(
        `Failed to save trip progress: ${error.message}`,
        error.stack,
      );
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

    // Enrich cancellation requests with attachment details
    const enrichedCancelationRequests =
      await this.enrichCancelationsWithAttachments(cancelationRequests);

    // attach enriched cancelation requests to task object
    return {
      ...task,
      cancelationRequests: enrichedCancelationRequests,
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

    // Fetch trip information for notifications
    const tripLocation = await this.tripLocationRepo.findOne({
      where: { id: task.tripLocationId },
      relations: ['trip'],
    });

    if (tripLocation && tripLocation.trip) {
      const trip = tripLocation.trip;

      // Save trip progress for cancellation request
      await this.saveProgress(
        trip,
        userId,
        trip.status,
        `Task Cancellation Request for task: ${task.title}`,
        `A cancellation request has been made for task "${task.title}". ${dto.reason ? 'Reason: ' + dto.reason : ''}`,
      );

      const claims: TokenClaimsDto = {
        jit: '',
        iat: Date.now(),
        sub: userId,
        email: '',
        role: '',
      };

      // Send notification to trip manager
      this.firebaseService.sendNotification({
        path: `/noti/${trip.managerId}/${new Date().getTime()}`,
        data: {
          senderId: userId,
          receiverId: trip.managerId,
          title: `Task Cancellation Request: ${task.title} (${trip.title})`,
          message: `A cancellation request has been made for task "${task.title}" in trip "${trip.title}" ${dto.reason ? 'with reason: ' + dto.reason : ''}`,
        },
        claims,
      });

      // Send notification to trip assignee if exists
      if (trip.assigneeId) {
        this.firebaseService.sendNotification({
          path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
          data: {
            senderId: userId,
            receiverId: trip.assigneeId,
            title: `Task Cancellation Request: ${task.title} (${trip.title})`,
            message: `A cancellation request has been made for task "${task.title}" in trip "${trip.title}" ${dto.reason ? 'with reason: ' + dto.reason : ''}`,
          },
          claims,
        });
      }
    }

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

    if (cancelation.createdBy === userId) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'You cannot resolve your own cancellation request',
      });
    }

    const task = await this.findOne(cancelation.targetId);

    // Fetch trip information for notifications
    const tripLocation = await this.tripLocationRepo.findOne({
      where: { id: task.tripLocationId },
      relations: ['trip'],
    });

    cancelation.decision = dto.decision;
    cancelation.resolvedBy = userId;
    cancelation.resolvedAt = new Date();
    if (dto.note) {
      cancelation.resolveNote = dto.note;
    }
    await this.cancelationRepo.save(cancelation);

    let updatedTask = task;

    const claims: TokenClaimsDto = {
      jit: '',
      iat: Date.now(),
      sub: userId,
      email: '',
      role: '',
    };

    if (dto.decision === CancelationDecision.APPROVE) {
      // Mark task as canceled when cancellation is approved
      updatedTask = await this.taskRepository.save({
        ...task,
        status: TaskStatusEnum.CANCELED,
        updatedAt: new Date(),
      });

      // Send notifications for approved cancellation
      if (tripLocation && tripLocation.trip) {
        const trip = tripLocation.trip;

        // Save trip progress for approved cancellation
        await this.saveProgress(
          trip,
          userId,
          trip.status,
          `Task Cancellation Approved for task: ${task.title}`,
          `Task cancellation has been approved. ${dto.note ? 'Note: ' + dto.note : ''}`,
        );

        this.firebaseService.sendNotification({
          path: `/noti/${trip.managerId}/${new Date().getTime()}`,
          data: {
            senderId: userId,
            receiverId: trip.managerId,
            title: `Task Cancellation Approved: ${task.title} (${trip.title})`,
            message: `The cancellation request for task "${task.title}" in trip "${trip.title}" has been approved. ${dto.note ? 'Note: ' + dto.note : ''}`,
          },
          claims,
        });

        if (trip.assigneeId) {
          this.firebaseService.sendNotification({
            path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
            data: {
              senderId: userId,
              receiverId: trip.assigneeId,
              title: `Task Cancellation Approved: ${task.title} (${trip.title})`,
              message: `Your cancellation request for task "${task.title}" in trip "${trip.title}" has been approved.`,
            },
            claims,
          });
        }

        // Check if all tasks in the trip are either canceled or completed
        // If so, update trip status to ENDED
        const allTripLocations = await this.tripLocationRepo.find({
          where: { trip: { id: trip.id } },
          relations: ['task'],
        });

        const hasPendingTasks = allTripLocations.some(
          (location) =>
            location.task &&
            location.task.status !== TaskStatusEnum.COMPLETED &&
            location.task.status !== TaskStatusEnum.CANCELED,
        );

        if (!hasPendingTasks && trip.status !== TripStatusEnum.ENDED) {
          await this.tripRepository.update(
            { id: trip.id },
            { status: TripStatusEnum.ENDED },
          );

          this.logger.log(
            `Trip status updated to ENDED for trip: ${trip.id} (all tasks completed or canceled)`,
          );
        }
      }

      this.logger.log(`Task cancellation approved for task: ${task.id}`);
    } else if (dto.decision === CancelationDecision.REJECT) {
      // Send notifications for rejected cancellation
      if (tripLocation && tripLocation.trip) {
        const trip = tripLocation.trip;

        // Save trip progress for rejected cancellation
        await this.saveProgress(
          trip,
          userId,
          trip.status,
          `Task Cancellation Rejected for task: ${task.title}`,
          `Task cancellation request has been rejected. ${dto.note ? 'Note: ' + dto.note : ''}`,
        );

        this.firebaseService.sendNotification({
          path: `/noti/${trip.managerId}/${new Date().getTime()}`,
          data: {
            senderId: userId,
            receiverId: trip.managerId,
            title: `Task Cancellation Rejected: ${task.title} (${trip.title})`,
            message: `The cancellation request for task "${task.title}" in trip "${trip.title}" has been rejected. ${dto.note ? 'Note: ' + dto.note : ''}`,
          },
          claims,
        });

        if (trip.assigneeId) {
          this.firebaseService.sendNotification({
            path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
            data: {
              senderId: userId,
              receiverId: trip.assigneeId,
              title: `Task Cancellation Rejected: ${task.title} (${trip.title})`,
              message: `Your cancellation request for task "${task.title}" in trip "${trip.title}" has been rejected.`,
            },
            claims,
          });
        }
      }

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
