import { HttpStatus, Injectable, Logger } from '@nestjs/common';
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
import { RpcException } from '@nestjs/microservices';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { LocationService } from '../location/location.service';
import { Location } from 'src/models/location.model';
import { TripStatusValidator } from './trip-status-validator';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,

    @InjectRepository(TripLocation)
    private readonly tripLocationRepo: Repository<TripLocation>,

    private readonly locationService: LocationService,

    private readonly dataSource: DataSource,
  ) {}

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

  private shouldAutoApproveTrip(dto: CreateTripDto): boolean {
    const schedule = dto.schedule ? new Date(dto.schedule) : null;
    const deadline = dto.deadline ? new Date(dto.deadline) : null;
    const today: Date = new Date();
    const hasPurpose = dto.purpose && dto.purpose.trim().length > 0;
    const hasGoal = dto.goal && dto.goal.trim().length > 0;
    const hasSchedule = schedule && +schedule >= +today;
    const hasDeadline = deadline && +deadline >= +today;
    const meaningfulSchedule =
      hasSchedule && hasDeadline && +schedule <= +deadline;
    const hasLocations = dto.locations && dto.locations.length > 0;
    const result: boolean = hasPurpose && hasGoal && hasSchedule && hasLocations && meaningfulSchedule;

    this.logger.debug(`Create trip DTO: ${JSON.stringify(dto)}`);
    this.logger.debug(`Criteria(Has purpose): ${hasPurpose}`);
    this.logger.debug(`Criteria(Has schedule): ${hasSchedule}`);
    this.logger.debug(`Criteria(Has deadline): ${hasDeadline}`);
    this.logger.debug(`Criteria(Has meaningful schedule): ${meaningfulSchedule}`);
    this.logger.debug(`Criteria(Has goal): ${hasGoal}`);
    this.logger.debug(`Result: ${result ? "Auto approved": "Failed to auto approve"}`)

    return result;
  }

  async create(creatorId: string, dto: CreateTripDto): Promise<Trip> {
    this.logger.log('Creating a new trip with transaction');

    const shouldAutoApprove = this.shouldAutoApproveTrip(dto);
    const locationIds = dto.locations.map((loc) => loc.location_id);
    
    const locations: Location[] = await this.validateLocationIds(locationIds);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const isProposal = creatorId !== dto.manager_id;
    const tripStatus = (isProposal && shouldAutoApprove || !isProposal) ? TripStatusEnum.PENDING : TripStatusEnum.PROPOSING;

    try {
      const trip = this.tripRepo.create({ 
        title: dto.title,
        assigneeId: dto.assignee_id,
        managerId: dto.manager_id,
        purpose: dto.purpose,
        goal: dto.goal,
        schedule: dto.schedule,
        deadline: dto.deadline,
        decidedAt: new Date(),
        ...(dto.note && { note: dto.note }),
        status: tripStatus,
      });

      const savedTrip = await queryRunner.manager.save(trip);

      const tripLocations = locations.map((location: Location, index: number) => {
        return this.tripLocationRepo.create({
          trip: savedTrip,
          baseLocationId: location.id,
          nameSnapshot: location.name,
          latitudeSnapshot: location.latitude,
          longitudeSnapshot: location.longitude,
          offsetRadiusSnapshot: location.offsetRadious,
          locationPointSnapshot: location.locationPoint,
          arrivalOrder: dto.locations[index].arrival_order,
          scheduledAt: dto.locations[index].scheduled_at,
        });
      });

      await queryRunner.manager.save(tripLocations);

      await queryRunner.commitTransaction();

      return await this.findOne(savedTrip.id);

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
    console.log("🚀 ~ TripService ~ update ~ dto:", dto)
    const trip: Trip = await this.findOne(id);
    console.log("🚀 ~ TripService ~ update ~ trip:", trip)
    const { title, status, schedule, deadline, ...rest } = dto;
    if (title) {
      const titleExisted = await this.tripRepo.existsBy({
        title,
      });
      console.log("🚀 ~ TripService ~ update ~ titleExisted:", titleExisted)
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
    if (trip.status !== TripStatusEnum.PENDING) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Only trips with status 'pending' can be deleted`,
      });
    }

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

    if (trip.status !== TripStatusEnum.PROPOSING) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid trip approval',
        details: 'Trip is not propsoing'
      });
    }

    if (dto.note) {
      trip.note = dto.note;
    }
    trip.decidedAt = new Date();
    trip.status =
      dto.decision === 'approve'
        ? TripStatusEnum.PENDING
        : TripStatusEnum.CANCELED;
    return await this.tripRepo.save(trip);
    // return await this.findOne(tripId, claims);
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
          scheduled_at: loc.scheduledAt,
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
}
