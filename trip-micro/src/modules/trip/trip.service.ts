import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip } from 'src/models/trip.model';
import { TripLocation } from 'src/models/trip-location.model';
import { CreateTripDto } from './dtos/create-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
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

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);
  private readonly userSender: NatsClientSender<{ findById: string }>;

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,

    @InjectRepository(TripLocation)
    private readonly tripLocationRepo: Repository<TripLocation>,

    private readonly locationService: LocationService,

    private readonly taskService: TaskService,

    private readonly dataSource: DataSource,
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
      from_date,
      to_date,
      status,
      page = 1,
      size = 10,
      sortBy = 'id',
      order = 'ASC',
    } = filter;

    const query = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.tripLocations', 'tripLocation')
      .leftJoinAndSelect('tripLocation.location', 'location');

    if (assignee_id) {
      query.andWhere('trip.assignee_id = :assignee_id', { assignee_id });
    }

    if (from_date && to_date) {
      query.andWhere('trip.schedule BETWEEN :from_date AND :to_date', {
        from_date,
        to_date,
      });
    }
    if (status) {
      query.andWhere('trip.status = :status', { status });
    }
    query
      .orderBy(`trip.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [items, total] = await query.getManyAndCount();

    return ListDataDto.build<any>({
      data: items,
      page,
      size,
      total,
    });
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.tripLocations', 'tripLocation')
      .leftJoinAndSelect('tripLocation.location', 'location')
      .leftJoinAndSelect('tripLocation.task', 'task')
      .where('trip.id = :id', { id })
      .getOne();

    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Trip with id ${id} not found`,
      });
    }

    return trip;
  }

  async update(id: string, dto: UpdateTripDto): Promise<Trip> {
    const trip: Trip = await this.findOne(id);
    const { title, status, schedule, deadline, ...rest } = dto;
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
      if (status !== undefined) trip.status = status;
    }

    Object.assign(trip, rest);

    await this.tripRepo.save(trip);
    return trip;
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

  async approve(tripId: string, dto: ApproveTripDto): Promise<Trip> {
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
    trip.status =
      dto.decision === 'approve'
        ? TripStatusEnum.NOT_STARTED
        : TripStatusEnum.NOT_APPROVED;
    return await this.tripRepo.save(trip);
  }

  async getTripLocations(tripId: string): Promise<any[]> {
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
  // TODO(low): add checked-in validation logic
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

      return await this.tripLocationRepo.save(updatePayload);
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

  // TODO(mid): check is valid assignee
  // TODO(low): add checked-out validation logic
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

    if (!rawResult) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location identifier not found.',
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

    return await this.tripLocationRepo.manager.transaction(
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

        this.logger.log(
          `Checkout success for location ${savedLocation.id}. Associated task marked as COMPLETED.`,
        );

        return savedLocation;
      },
    );
  }
}
