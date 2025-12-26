import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import axios from 'axios';
import { Trip } from 'src/models/trip.model';
import { TripLocation } from 'src/models/trip-location.model';
import { TripProgress } from 'src/models/trip-progress.model';
import { CreateTripDto } from './dtos/create-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { CancelTripDto } from './dtos/cancel-trip.dto';
import { ResolveCancelationDto } from './dtos/resolve-cancelation.dto';
import { throwRpcException } from 'src/utils';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { AuthorizeClaimsPayloadDto } from './dtos/authorize-claims-payload.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { LocationService } from '../location/location.service';
import { Location } from 'src/models/location.model';
import { TripStatusValidator } from './trip-status-validator';
import { TaskService } from '../task/task.service';
import { CreateTaskDto } from '../task/dtos/create-task.dto';
import { CheckInAtLocationDto } from './dtos/check-in-at-location.dto';
import { CheckOutAtLocationDto } from './dtos/check-out-at-location.dto';
import { Task } from 'src/models/task.model';
import { TaskStatusEnum } from 'src/models/task-status.enum';
import { NATSClient } from 'src/client/clients';
import { NatsClientSender } from 'src/utils';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';
import { FirebaseService } from 'src/modules/firebase/firebase.service';
import { Cancelation } from 'src/models/cancelation.model';
import { CancelationTargetEntity } from 'src/models/enums/TargetEntity.enum';
import { CancelationDecision } from 'src/models/enums/CancelationDecision.enum';
import { TripEvaluation } from 'src/models/trip-evaluation.model';
import { isEAN } from 'class-validator';
import { EmployeeStatisticDto } from './dtos/employee-statistic.dto';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);
  private readonly userSender: NatsClientSender<{ findById: string }>;

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,

    @InjectRepository(TripLocation)
    private readonly tripLocationRepo: Repository<TripLocation>,

    @InjectRepository(TripProgress)
    private readonly tripProgressRepo: Repository<TripProgress>,

    @InjectRepository(Cancelation)
    private readonly cancelationRepo: Repository<Cancelation>,

    @InjectRepository(TripEvaluation)
    private readonly tripEvaluationRepo: Repository<TripEvaluation>,

    private readonly locationService: LocationService,

    private readonly taskService: TaskService,

    private readonly dataSource: DataSource,

    private readonly firebaseService: FirebaseService,

    @Inject(NATSClient.name)
    private readonly natsClient: ClientProxy,
  ) {
    this.userSender = new NatsClientSender(this.natsClient, {
      findById: 'user.find.id',
    });
  }

  async authorizeClaims(payload: AuthorizeClaimsPayloadDto) {
    const { claims, required } = payload;
    const claimedRole = claims.role;

    if (!claimedRole) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid Token',
      });
    }

    if (!required.roles.includes(claimedRole)) {
      throwRpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden: Insufficient role',
      });
    }

    this.logger.log(
      `Authorized: ${claims.email} with role ${claims.role} can ${required.permission.action} ${required.permission.resource}`,
    );
    return true;
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

  async validateLocationIds(locationIds: string[]) {
    try {
      return await Promise.all(
        locationIds.map((id) =>
          this.locationService.findOne(id).catch(() => {
            throw new Error(`Invalid location ID: ${id}`);
          }),
        ),
      );
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async create(
    creator: { id: string; role: string },
    dto: CreateTripDto,
  ): Promise<Trip> {
    this.logger.log('Creating a new trip with transaction');

    let managerId: string = null;
    if (creator.role !== 'employee') {
      managerId = creator.id;
    } else {
      try {
        const claims: TokenClaimsDto = {
          jit: '', // not used here
          iat: Date.now(),
          sub: creator.id,
          email: '', // not required for this lookup
          role: creator.role,
        };

        const payload: MessagePayloadDto = {
          claims,
        };

        const user: any = await this.userSender.send({
          messagePattern: 'findById',
          payload,
        });

        if (!user || !user.managerId) {
          this.logger.error(
            `Manager ID not found for creator with id: ${creator.id}`,
          );
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Manager not found for this employee',
          });
        }

        managerId = user.managerId;
      } catch (error) {
        if (error instanceof RpcException) {
          throw error;
        }

        this.logger.error(
          `Failed to fetch manager ID from user service for creator ${creator.id}`,
          error?.stack,
        );

        throwRpcException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'User service unavailable while resolving manager',
        });
      }
    }

    const isTitleExisted = await this.tripRepo.existsBy({ title: dto.title });
    if (isTitleExisted) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Duplicated trip's title",
      });
      return;
    }

    const locationIds = dto.locations.map((loc) => loc.location_id);
    const locations: Location[] = await this.validateLocationIds(locationIds);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    console.log('🚀 ~ TripService ~ create ~ creator:', creator);
    const isProposal = creator.role === 'employee';
    const tripStatus: TripStatusEnum = isProposal
      ? TripStatusEnum.WAITING_FOR_APPROVAL
      : TripStatusEnum.NOT_STARTED;

    try {
      const tripObject: Trip = this.tripRepo.create({
        title: dto.title,
        assigneeId: dto.assignee_id,
        managerId,
        purpose: dto.purpose,
        goal: dto.goal,
        schedule: dto.schedule,
        deadline: dto.deadline,
        decidedAt: new Date(),
        status: tripStatus,
        ...(dto.note && { note: dto.note }),
      });

      const trip = await queryRunner.manager.save(tripObject);

      const tripLocationObjects: TripLocation[] = locations.map(
        (location: Location, index: number) => {
          return this.tripLocationRepo.create({
            trip: trip,
            baseLocationId: location.id,
            nameSnapshot: location.name,
            latitudeSnapshot: location.latitude,
            longitudeSnapshot: location.longitude,
            offsetRadiusSnapshot: location.offsetRadious,
            locationPointSnapshot: location.locationPoint,
            arrivalOrder: dto.locations[index].arrival_order,
          });
        },
      );

      const tripLocations: TripLocation[] =
        await queryRunner.manager.save(tripLocationObjects);

      const createTaskDtos: CreateTaskDto[] = dto.locations.map(
        (tripLocation) => tripLocation.task,
      );
      await Promise.all(
        createTaskDtos.map((dto: CreateTaskDto, index: number) => {
          dto.tripLocationId = tripLocations[index].id;
          return this.taskService.create(dto, queryRunner.manager);
        }),
      );

      await queryRunner.commitTransaction();

      console.log('🚀 ~ TripService ~ create ~ isProposal:', isProposal);
      const claims: TokenClaimsDto = {
        jit: '',
        iat: Date.now(),
        sub: creator.id,
        email: '',
        role: creator.role,
      };
      if (isProposal) {
        await this.saveProgress(
          trip,
          creator.id,
          TripStatusEnum.WAITING_FOR_APPROVAL,
          'Trip Proposed',
          `Employee has proposed a new trip "${trip.title}"`,
        );
        this.firebaseService.sendNotification({
          path: `/noti/${creator.id}/${new Date().getTime()}`,
          data: {
            senderId: managerId,
            receiverId: creator.id,
            title: `New Trip Proposal: ${trip.title}`,
            message: `You have proposed a new trip "${trip.title}" and waiting for approval.`,
          },
          claims,
        });
        this.firebaseService.sendNotification({
          path: `/noti/${managerId}/${new Date().getTime()}`,
          data: {
            senderId: creator.id,
            receiverId: managerId,
            title: `New Trip Proposal: ${trip.title}`,
            message: `A new trip titled "${trip.title}" has been proposed and is awaiting your approval.`,
          },
          claims,
        });
      } else {
        await this.saveProgress(
          trip,
          creator.id,
          TripStatusEnum.NOT_STARTED,
          'Trip Created',
          `Manager has created a new trip "${trip.title}"`,
        );
        if (dto.assignee_id) {
          await this.saveProgress(
            trip,
            creator.id,
            TripStatusEnum.NOT_STARTED,
            'Trip Assigned',
            `Trip "${trip.title}" has been assigned to employee`,
          );
        }
        this.firebaseService.sendNotification({
          path: `/noti/${dto.assignee_id}/${new Date().getTime()}`,
          data: {
            senderId: creator.id,
            receiverId: dto.assignee_id,
            title: `Trip Assigned: ${trip.title}`,
            message: `A new trip titled "${trip.title}" has been assigned to you.`,
          },
          claims,
        });
      }

      return trip;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error('Failed to create trip, rolling back', error.stack);

      if (error instanceof RpcException) throw error;

      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throwRpcException({
          message: 'A trip with this title already exists',
          statusCode: HttpStatus.CONFLICT,
          details: { field: 'title', value: dto.title },
        });
      }

      throwRpcException({
        message: 'Failed to create trip',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filter: FilterTripDto): Promise<ListDataDto<any>> {
    const {
      assignee_id,
      from_date_schedule,
      to_date_schedule,
      from_date_deadline,
      to_date_deadline,
      manager_id,
      status,
      is_evaluated,
      page = 1,
      size = 10,
      sortBy = 'id',
      order = 'ASC',
    } = filter;

    const query = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.tripLocations', 'tripLocation')
      .leftJoinAndSelect('tripLocation.location', 'location')
      .where('trip.deletedAt IS NULL');

    /* -------------------- BASIC FILTERS -------------------- */

    if (assignee_id) {
      query.andWhere('trip.assigneeId = :assignee_id', { assignee_id });
    }

    if (manager_id) {
      query.andWhere('trip.managerId = :manager_id', { manager_id });
    }

    if (status) {
      query.andWhere('trip.status = :status', { status });
    }

    /* -------------------- SCHEDULE FILTER -------------------- */

    if (from_date_schedule && to_date_schedule) {
      query.andWhere(
        'trip.schedule BETWEEN :from_date_schedule AND :to_date_schedule',
        { from_date_schedule, to_date_schedule },
      );
    } else if (from_date_schedule) {
      query.andWhere('trip.schedule >= :from_date_schedule', {
        from_date_schedule,
      });
    } else if (to_date_schedule) {
      query.andWhere('trip.schedule <= :to_date_schedule', {
        to_date_schedule,
      });
    }

    /* -------------------- DEADLINE FILTER -------------------- */

    if (from_date_deadline && to_date_deadline) {
      query.andWhere(
        'trip.deadline BETWEEN :from_date_deadline AND :to_date_deadline',
        { from_date_deadline, to_date_deadline },
      );
    } else if (from_date_deadline) {
      query.andWhere('trip.deadline >= :from_date_deadline', {
        from_date_deadline,
      });
    } else if (to_date_deadline) {
      query.andWhere('trip.deadline <= :to_date_deadline', {
        to_date_deadline,
      });
    }

    /* -------------------- LATEST EVALUATION JOIN -------------------- */

    query.leftJoin(
      (qb) =>
        qb
          .select('te.trip_id', 'trip_id')
          .addSelect('MAX(te.version)', 'max_version')
          .from('trip_evaluations', 'te')
          .groupBy('te.trip_id'),
      'latest_eval',
      'latest_eval.trip_id = trip.id',
    );

    query.leftJoinAndSelect(
      'trip_evaluations',
      'evaluation',
      'evaluation.trip_id = trip.id AND evaluation.version = latest_eval.max_version',
    );

    /* -------------------- EVALUATED FILTER -------------------- */

    if (is_evaluated === 'true') {
      query.andWhere('latest_eval.trip_id IS NOT NULL');
    }

    if (is_evaluated === 'false') {
      query.andWhere('latest_eval.trip_id IS NULL');
    }

    /* -------------------- PAGINATION & SORT -------------------- */

    query
      .orderBy(`trip.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [items, total] = await query.getManyAndCount();

    return ListDataDto.build({
      data: items,
      page,
      size,
      total,
    });
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

  private async enrichTripLocationsWithAttachments(
    tripLocations: any[],
  ): Promise<any[]> {
    return Promise.all(
      tripLocations.map(async (location) => {
        const enrichedLocation = { ...location };

        // Fetch and enrich check-in attachment
        if (location.checkInAttachmentId) {
          const checkInAttachment = await this.fetchAttachmentDetails(
            location.checkInAttachmentId,
          );
          if (checkInAttachment) {
            enrichedLocation.checkInAttachment = checkInAttachment;
          }
        }

        // Fetch and enrich check-out attachment
        if (location.checkOutAttachmentId) {
          const checkOutAttachment = await this.fetchAttachmentDetails(
            location.checkOutAttachmentId,
          );
          if (checkOutAttachment) {
            enrichedLocation.checkOutAttachment = checkOutAttachment;
          }
        }

        return enrichedLocation;
      }),
    );
  }

  async findOne(id: string): Promise<any> {
    const trip = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.tripLocations', 'tripLocation')
      .leftJoinAndSelect('tripLocation.location', 'location')
      .leftJoinAndSelect('tripLocation.task', 'task')
      .leftJoinAndSelect('trip.tripProgress', 'tripProgress')
      .where('trip.id = :id', { id })
      .orderBy('tripProgress.createdAt', 'DESC')
      .getOne();

    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Trip with id ${id} not found`,
      });
    }

    // Fetch trip evaluations ordered by version DESC
    const evaluations = await this.tripEvaluationRepo.find({
      where: { tripId: id },
      order: { version: 'DESC' },
    });

    // Fetch trip-level cancellation requests
    const tripCancelationRequests = await this.cancelationRepo.find({
      where: {
        targetEntity: CancelationTargetEntity.TRIP,
        targetId: id,
      },
      order: { createdAt: 'DESC' },
    });

    // Fetch task-level cancellation requests for all tasks in this trip
    const taskIds = trip.tripLocations
      .filter((location) => location.task && location.task.id)
      .map((location) => location.task.id);

    let taskCancelationRequests: Cancelation[] = [];
    if (taskIds.length > 0) {
      taskCancelationRequests = await this.cancelationRepo.find({
        where: {
          targetEntity: CancelationTargetEntity.TASK,
          targetId: In(taskIds),
        },
        order: { createdAt: 'DESC' },
      });
    }

    // Enrich trip-level cancellation requests with attachment details
    const enrichedTripCancelations =
      await this.enrichCancelationsWithAttachments(tripCancelationRequests);

    // Enrich task-level cancellation requests with attachment details
    const enrichedTaskCancelations =
      await this.enrichCancelationsWithAttachments(taskCancelationRequests);

    // Attach enriched cancellation requests to each task in trip locations
    const tripLocationsWithCancelations = trip.tripLocations.map(
      (location) => ({
        ...location,
        task: location.task
          ? {
              ...location.task,
              cancelationRequests: enrichedTaskCancelations.filter(
                (c) => c.targetId === location.task.id,
              ),
            }
          : null,
      }),
    );

    // Enrich trip locations with check-in and check-out attachments
    const enrichedTripLocations = await this.enrichTripLocationsWithAttachments(
      tripLocationsWithCancelations,
    );

    // Return trip with all enriched data (cancellations, location attachments, and evaluations)
    return {
      ...trip,
      tripLocations: enrichedTripLocations,
      cancelationRequests: enrichedTripCancelations,
      evaluations,
    };
  }

  async update(
    requestId: string,
    id: string,
    dto: UpdateTripDto,
  ): Promise<Trip> {
    const trip: Trip = await this.findOne(id);
    const { title, status, schedule, deadline, ...rest } = dto;
    const oldStatus = trip.status;

    if (
      dto.status &&
      dto.status !== TripStatusEnum.IN_PROGRESS &&
      dto.status !== TripStatusEnum.ENDED
    ) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Can only update trip to IN_PROGRESS or ENDED status',
      });
    }

    if (title) {
      const titleExisted = await this.tripRepo.existsBy({
        title,
      });
      if (titleExisted) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Duplicated trip title',
        });
        return null;
      }
      if (title !== undefined) trip.title = title;
    }

    const formatedSchedule = schedule ? new Date(schedule) : null;
    const formatedDeadline = deadline ? new Date(deadline) : null;
    const isMeaningfulTimeline = formatedSchedule <= formatedDeadline;
    if (!isMeaningfulTimeline) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid trip schedule and deadline',
      });
    }
    if (schedule !== undefined) trip.schedule = schedule;
    if (deadline !== undefined) trip.deadline = deadline;

    if (status) {
      try {
        TripStatusValidator.validateTransition(trip.status, status);
      } catch (error) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        });
      }

      if (
        trip.status === TripStatusEnum.NOT_STARTED &&
        status === TripStatusEnum.IN_PROGRESS
      ) {
        trip.startedAt = new Date();
        const claims: TokenClaimsDto = {
          jit: '',
          iat: Date.now(),
          sub: requestId,
          email: '',
          role: '',
        };
        this.firebaseService.sendNotification({
          path: `/noti/${trip.managerId}/${new Date().getTime()}`,
          data: {
            senderId: requestId,
            receiverId: trip.managerId,
            title: `Trip Started: ${trip.title}`,
            message: `Employee has started the trip: ${trip.title}`,
          },
          claims,
        });
      } else if (
        trip.status === TripStatusEnum.IN_PROGRESS &&
        status === TripStatusEnum.ENDED
      ) {
        const claims: TokenClaimsDto = {
          jit: '',
          iat: Date.now(),
          sub: requestId,
          email: '',
          role: '',
        };
        this.firebaseService.sendNotification({
          path: `/noti/${trip.managerId}/${new Date().getTime()}`,
          data: {
            senderId: requestId,
            receiverId: trip.managerId,
            title: `Trip ended: ${trip.title}`,
            message: `Employee has ended the trip: ${trip.title}`,
          },
          claims,
        });
      }

      if (status !== undefined) trip.status = status;
    }

    Object.assign(trip, rest);

    const updatedTrip = await this.tripRepo.save(trip);

    if (status && status !== oldStatus) {
      await this.saveProgress(
        updatedTrip,
        requestId,
        status,
        `Trip Status Changed to ${status}`,
        `Trip status has been changed from ${oldStatus} to ${status}`,
      );
    }

    return updatedTrip;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const trip = await this.findOne(id);

    try {
      trip.deletedAt = new Date();
      await this.tripRepo.save(trip);
      this.logger.log(`Trip deleted with id: ${id}`);
      return { success: true, id };
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot delete trip',
      });
    }
  }

  async approve(
    tripId: string,
    dto: ApproveTripDto,
    managerId: string,
  ): Promise<Trip> {
    const trip = await this.findOne(tripId);

    if (trip.status !== TripStatusEnum.WAITING_FOR_APPROVAL) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid trip',
        details: 'Only approve trip that is waiting for approval',
      });
    }

    if (dto.note) {
      trip.note = dto.note;
    }
    trip.decidedAt = new Date();
    const newStatus =
      dto.decision === 'approve'
        ? TripStatusEnum.NOT_STARTED
        : TripStatusEnum.NOT_APPROVED;
    trip.status = newStatus;

    const result = await this.tripRepo.save(trip);

    const progressTitle =
      dto.decision === 'approve' ? 'Trip Approved' : 'Trip Rejected';
    const progressDescription =
      dto.decision === 'approve'
        ? `Manager has approved the trip "${trip.title}"`
        : `Manager has rejected the trip "${trip.title}"`;

    await this.saveProgress(
      result,
      managerId,
      newStatus,
      progressTitle,
      progressDescription,
    );

    const claims: TokenClaimsDto = {
      jit: '',
      iat: Date.now(),
      sub: managerId,
      email: '',
      role: '',
    };

    this.firebaseService.sendNotification({
      path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
      data: {
        senderId: managerId,
        receiverId: trip.assigneeId,
        title: `Trip Decision: ${trip.title}`,
        message: 'Your trip has been ' + dto.decision,
      },
      claims,
    });

    return result;
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
    tripId: string,
    dto: CancelTripDto,
    userId: string,
  ): Promise<Cancelation> {
    const trip = await this.findOne(tripId);

    if (trip.status === TripStatusEnum.ENDED) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot cancel a completed trip',
      });
    }

    if (trip.status === TripStatusEnum.CANCELED) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Trip is already canceled',
      });
    }

    if (trip.status === TripStatusEnum.NOT_APPROVED) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot cancel a rejected trip',
      });
    }

    try {
      TripStatusValidator.validateTransition(
        trip.status,
        TripStatusEnum.CANCELED,
      );
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }

    const cancelation = await this.cancelEntity({
      decision: null,
      targetEntity: CancelationTargetEntity.TRIP,
      targetId: trip.id,
      reason: dto.reason,
      attachmentId: dto.attachmentId,
      createdBy: userId,
      resolvedBy: null,
      resolvedAt: null,
    });

    await this.saveProgress(
      trip,
      userId,
      trip.status,
      `Trip Cancelation Request for trip: ${trip.title}`,
      `A trip cancellation request has been created. ${dto.reason ? 'Reason: ' + dto.reason : ''}`,
    );

    const claims: TokenClaimsDto = {
      jit: '',
      iat: Date.now(),
      sub: userId,
      email: '',
      role: '',
    };

    this.firebaseService.sendNotification({
      path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
      data: {
        senderId: userId,
        receiverId: trip.assigneeId,
        title: `Cancellation Request: ${trip.title}`,
        message: `A cancellation request has been made for trip "${trip.title}" ${dto.reason ? 'with reason: ' + dto.reason : ''}`,
      },
      claims,
    });

    this.firebaseService.sendNotification({
      path: `/noti/${trip.managerId}/${new Date().getTime()}`,
      data: {
        senderId: userId,
        receiverId: trip.managerId,
        title: `Cancellation Request: ${trip.title}`,
        message: `A trip has been requested to be canceled. ${dto.reason ? 'Reason: ' + dto.reason : ''}`,
      },
      claims,
    });

    return cancelation;
  }

  async resolveCancel(
    cancelationId: string,
    dto: ResolveCancelationDto,
    userId: string,
  ): Promise<Trip> {
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

    const trip = await this.findOne(cancelation.targetId);

    cancelation.decision = dto.decision;
    cancelation.resolvedBy = userId;
    cancelation.resolvedAt = new Date();
    if (dto.note) {
      cancelation.resolveNote = dto.note;
    }
    await this.cancelationRepo.save(cancelation);

    let updatedTrip = trip;

    const claims: TokenClaimsDto = {
      jit: '',
      iat: Date.now(),
      sub: userId,
      email: '',
      role: '',
    };

    if (dto.decision === CancelationDecision.APPROVE) {
      trip.status = TripStatusEnum.CANCELED;
      if (dto.note) {
        trip.note = dto.note;
      }
      updatedTrip = await this.tripRepo.save(trip);

      await this.saveProgress(
        updatedTrip,
        userId,
        TripStatusEnum.CANCELED,
        `Trip Cancellation Approved for trip: ${trip.title}`,
        `Trip cancellation has been approved. ${dto.note ? 'Note: ' + dto.note : ''}`,
      );

      this.firebaseService.sendNotification({
        path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
        data: {
          senderId: userId,
          receiverId: trip.assigneeId,
          title: `Cancellation request approved for trip: ${trip.title}`,
          message: `Your cancellation request for trip "${trip.title}" has been approved.`,
        },
        claims,
      });

      this.firebaseService.sendNotification({
        path: `/noti/${trip.managerId}/${new Date().getTime()}`,
        data: {
          senderId: userId,
          receiverId: trip.managerId,
          title: `Cancellation request approved for trip: ${trip.title}`,
          message: `Trip "${trip.title}" cancellation has been approved.`,
        },
        claims,
      });
    } else if (dto.decision === CancelationDecision.REJECT) {
      await this.saveProgress(
        trip,
        userId,
        trip.status,
        `Trip Cancellation Rejected for trip: ${trip.title}`,
        `Trip cancellation request has been rejected. ${dto.note ? 'Note: ' + dto.note : ''}`,
      );

      this.firebaseService.sendNotification({
        path: `/noti/${trip.assigneeId}/${new Date().getTime()}`,
        data: {
          senderId: userId,
          receiverId: trip.assigneeId,
          title: `Cancellation request has been rejected for trip: ${trip.title}`,
          message: `Your cancellation request for trip "${trip.title}" has been rejected.`,
        },
        claims,
      });

      this.firebaseService.sendNotification({
        path: `/noti/${trip.managerId}/${new Date().getTime()}`,
        data: {
          senderId: userId,
          receiverId: trip.managerId,
          title: `Cancellation request has been rejected for trip: ${trip.title}`,
          message: `Cancellation request for trip "${trip.title}" has been rejected.`,
        },
        claims,
      });
    }

    return updatedTrip;
  }

  async getCancelationRequests(tripId: string): Promise<Cancelation[]> {
    const trip = await this.findOne(tripId);

    const cancelations = await this.cancelationRepo.find({
      where: {
        targetEntity: CancelationTargetEntity.TRIP,
        targetId: tripId,
      },
      order: { createdAt: 'DESC' },
    });

    this.logger.log(
      `Retrieved ${cancelations.length} cancellation requests for trip: ${tripId}`,
    );

    return cancelations;
  }

  async getTripLocations(requestId: string, tripId: string): Promise<any[]> {
    const trip = await this.findOne(tripId);

    const locations = await this.tripLocationRepo.find({
      where: { trip: { id: tripId } },
      order: { arrivalOrder: 'ASC' },
    });

    const enrichedLocations = await Promise.all(
      locations.map(async (loc) => {
        let locationDetails = null;

        try {
          // locationDetails = await this.locationClient.findOne(loc.location_id);
        } catch {
          locationDetails = null;
        }

        return {
          id: loc.id,
          location_id: loc.baseLocationId,
          arrival_order: loc.arrivalOrder,
          location: locationDetails
            ? {
                name: locationDetails.name,
                latitude: locationDetails.latitude,
                longitude: locationDetails.longitude,
              }
            : null,
        };
      }),
    );

    return enrichedLocations;
  }

  async markTripStartTimestamp(tripId: string, timestamp: Date) {
    const trip: Trip = await this.findOne(tripId);
    if (trip.startedAt) {
      return null;
    }
    trip.startedAt = timestamp;
    try {
      return await this.tripRepo.save(trip);
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot update timestamp of trip',
      });
    }
  }

  // TODO(mid): check is valid assignee
  async checkIn(assigneeId: string, checkInDto: CheckInAtLocationDto) {
    const rawResult = await this.tripLocationRepo
      .createQueryBuilder('tripLocation')
      .addSelect(
        `ST_Distance_Sphere(
        tripLocation.locationPointSnapshot,
        ST_GeomFromText(:userPoint, 4326)
      )`,
        'distanceInMeter',
      )
      .where('tripLocation.id = :id', { id: checkInDto.tripLocationId })
      .setParameter(
        'userPoint',
        `POINT(${checkInDto.latitude} ${checkInDto.longitude})`,
      )
      .getRawOne();

    if (!rawResult) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location identifier not found.',
      });
    }
    const trip = await this.findOne(rawResult.tripLocation_tripId);

    if (trip.status !== TripStatusEnum.IN_PROGRESS) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Trip must be in progress to check in.',
      });
    }

    const distance = parseFloat(rawResult.distanceInMeter);
    const radius = parseFloat(rawResult.tripLocation_offset_radius_snapshot);

    if (distance > radius) {
      this.logger.debug(
        `Check-in failed. Distance: ${distance}m, Radius: ${radius}m`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'You are too far from the check-in point.',
      });
    }

    const updatePayload = {
      id: rawResult.tripLocation_id,
      checkInTimestamp: new Date(checkInDto.timestamp),
      checkInPoint: `POINT(${checkInDto.longitude} ${checkInDto.latitude})`,
      checkInAttachmentId: checkInDto.attachmentId,
    };

    try {
      await this.markTripStartTimestamp(
        rawResult.tripLocation_tripId,
        checkInDto.timestamp,
      );

      const claims: TokenClaimsDto = {
        jit: '',
        iat: Date.now(),
        sub: assigneeId,
        email: '',
        role: '',
      };

      this.firebaseService.sendNotification({
        path: `/noti/${trip.managerId}/${new Date().getTime()}`,
        data: {
          senderId: assigneeId,
          receiverId: trip.managerId,
          title: `Employee checked-in at location ${rawResult.tripLocation_name_snapshot} of trip ${trip.title}`,
          message: `Employee have checked in at location: ${rawResult.tripLocation_name_snapshot} of the trip ${trip.title}`,
        },
        claims,
      });

      const savedLocation = await this.tripLocationRepo.save(updatePayload);

      await this.saveProgress(
        trip,
        assigneeId,
        trip.status,
        'Checked In',
        `Employee checked in at location: ${rawResult.tripLocation_name_snapshot}`,
      );

      return savedLocation;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof RpcException) {
        throw error;
      }
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot process check-out',
      });
    }
  }

  async checkOutAtLocation(assigneeId: string, dto: CheckOutAtLocationDto) {
    const rawResult = await this.tripLocationRepo
      .createQueryBuilder('tripLocation')
      .addSelect(
        `ST_Distance_Sphere(
        tripLocation.locationPointSnapshot,
        ST_GeomFromText(:userPoint, 4326)
      )`,
        'distanceInMeter',
      )
      .where('tripLocation.id = :id', { id: dto.tripLocationId })
      .setParameter('userPoint', `POINT(${dto.latitude} ${dto.longitude})`)
      .getRawOne();
    console.log(
      '🚀 ~ TripService ~ checkOutAtLocation ~ rawResult:',
      rawResult,
    );

    if (!rawResult) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location identifier not found.',
      });
    }

    if (!rawResult.tripLocation_checkin_timestamp) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'You must check in before checking out.',
      });
    }

    const trip = await this.findOne(rawResult.tripLocation_tripId);

    if (trip.status !== TripStatusEnum.IN_PROGRESS) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Trip must be in progress to check out.',
      });
    }

    const distance = parseFloat(rawResult.distanceInMeter);
    const radius = parseFloat(rawResult.tripLocation_offset_radius_snapshot);

    if (distance > radius) {
      this.logger.debug(
        `Check-out failed. Distance: ${distance}m, Radius: ${radius}m`,
      );
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'You are too far from the check-out point.',
      });
    }

    const savedLocation = await this.tripLocationRepo.manager.transaction(
      async (transactionalManager) => {
        const updateLocationPayload = {
          id: rawResult.tripLocation_id,
          checkOutTimestamp: new Date(dto.timestamp),
          checkOutPoint: `POINT(${dto.longitude} ${dto.latitude})`,
          checkOutAttachmentId: dto.attachmentId,
        };

        const savedLocation = await transactionalManager.save(
          TripLocation,
          updateLocationPayload,
        );

        await transactionalManager.update(
          Task,
          { tripLocationId: rawResult.tripLocation_id },
          { status: TaskStatusEnum.COMPLETED },
        );

        const claims: TokenClaimsDto = {
          jit: '',
          iat: Date.now(),
          sub: assigneeId,
          email: '',
          role: '',
        };

        this.firebaseService.sendNotification({
          path: `/noti/${trip.managerId}/${new Date().getTime()}`,
          data: {
            senderId: assigneeId,
            receiverId: trip.managerId,
            title: `Employee checked-out at location ${rawResult.tripLocation_name_snapshot} of trip ${trip.title}`,
            message: `Employee have checked out at location: ${rawResult.tripLocation_name_snapshot} of the trip ${trip.title}`,
          },
          claims,
        });

        this.logger.log(
          `Checkout success for location ${savedLocation.id}. Associated task marked as COMPLETED.`,
        );

        return savedLocation;
      },
    );

    await this.saveProgress(
      trip,
      assigneeId,
      trip.status,
      'Checked Out',
      `Employee checked out from location: ${rawResult.tripLocation_name_snapshot}`,
    );

    return savedLocation;
  }

  async getTripStatisticOfEmployee(
    managerId: string,
    employeeId: string,
    dto: EmployeeStatisticDto,
  ) {
    const {
      from_date_deadline,
      to_date_deadline,
      from_date_schedule,
      to_date_schedule,
    } = dto;

    const query = this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.deletedAt IS NULL')
      .andWhere('trip.assigneeId = :employeeId', { employeeId });

    /* -------------------- DATE FILTERS -------------------- */

    if (from_date_schedule && to_date_schedule) {
      query.andWhere(
        'trip.schedule BETWEEN :from_date_schedule AND :to_date_schedule',
        { from_date_schedule, to_date_schedule },
      );
    } else if (from_date_schedule) {
      query.andWhere('trip.schedule >= :from_date_schedule', {
        from_date_schedule,
      });
    } else if (to_date_schedule) {
      query.andWhere('trip.schedule <= :to_date_schedule', {
        to_date_schedule,
      });
    }

    if (from_date_deadline && to_date_deadline) {
      query.andWhere(
        'trip.deadline BETWEEN :from_date_deadline AND :to_date_deadline',
        { from_date_deadline, to_date_deadline },
      );
    } else if (from_date_deadline) {
      query.andWhere('trip.deadline >= :from_date_deadline', {
        from_date_deadline,
      });
    } else if (to_date_deadline) {
      query.andWhere('trip.deadline <= :to_date_deadline', {
        to_date_deadline,
      });
    }

    /* -------------------- LATEST EVALUATION JOIN -------------------- */

    query.innerJoin(
      (qb) =>
        qb
          .select('te.trip_id', 'trip_id')
          .addSelect('MAX(te.version)', 'max_version')
          .from('trip_evaluations', 'te')
          .where('te.deletedAt IS NULL')
          .groupBy('te.trip_id'),
      'latest_eval',
      'latest_eval.trip_id = trip.id',
    );

    query.innerJoin(
      'trip_evaluations',
      'evaluation',
      `
      evaluation.trip_id = trip.id
      AND evaluation.version = latest_eval.max_version
      AND evaluation.deletedAt IS NULL
    `,
    );

    /* -------------------- SELECT (FLATTENED) -------------------- */

    query.select([
      'trip.id AS trip_id',
      'trip.status AS status',
      'trip.schedule AS schedule',
      'trip.deadline AS deadline',
      'trip.goal AS goal',
      'trip.purpose AS purpose',
      'trip.assigneeId AS assigneeId',
      'trip.managerId AS managerId',
      'evaluation.evaluation_value AS evaluation_value',
    ]);

    // const totalTrips = await this.tripRepo.count({
    //   where: {
    //     assigneeId: employeeId,
    //     decidedAt: IsNull(),
    //   },
    // });
    const [ended, canceled] = await Promise.all([
      this.tripRepo.count({
        where: {
          assigneeId: employeeId,
          status: TripStatusEnum.ENDED,
        },
      }),
      this.tripRepo.count({
        where: {
          assigneeId: employeeId,
          status: TripStatusEnum.CANCELED,
        },
      }),
    ]);

    const items = await query.getRawMany<{
      trip_id: string;
      status: string;
      schedule: Date;
      deadline: Date;
      goal: string;
      purpose: string;
      assigneeId: string;
      managerId: string;
      evaluation_value: 'successful' | 'partially_successful' | 'unsuccessful';
    }>();

    const counter: Record<string, number> = {};
    items.forEach((trip) => {
      if (counter[trip.evaluation_value]) {
        counter[trip.evaluation_value]++;
      } else {
        counter[trip.evaluation_value] = 1;
      }
    });

    return {
      data: items,
      count: items.length,
      evaluated: items.length,
      totalTrips: ended + canceled,
      ended,
      canceled,
      unevaluated: ended + canceled - items.length,
      pagination: {
        page: 1,
        size: items.length,
        totalPages: 1,
      },
      statistic: counter,
    };
  }
}
