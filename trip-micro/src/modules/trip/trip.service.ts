import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    // Check if all required fields are provided for auto-approval
    const today: Date = new Date();
    const hasPurpose = dto.purpose && dto.purpose.trim().length > 0;
    const hasGoal = dto.goal && dto.goal.trim().length > 0;
    const hasSchedule = dto.schedule && +dto.schedule > +today;
    const hasDeadline = dto.deadline && +dto.deadline > +today;
    const meaningfulSchedule =
      hasSchedule && hasDeadline && dto.schedule <= dto.deadline;
    const hasLocations = dto.locations && dto.locations.length > 0;

    // All criteria must be met for auto-approval
    return (
      hasPurpose && hasGoal && hasSchedule && hasLocations && meaningfulSchedule
    );
  }

  async create(dto: CreateTripDto): Promise<Trip> {
    this.logger.log('Creating a new trip');
    try {
      const shouldAutoApprove = this.shouldAutoApproveTrip(dto);
      const locationIds = dto.locations.map((loc) => loc.location_id);
      const locations: Location[] = await this.validateLocationIds(locationIds);

      const trip = this.tripRepo.create({
        title: dto.title,
        assigneeId: dto.assignee_id,
        managerId: dto.manager_id,
        purpose: dto.purpose,
        goal: dto.goal,
        schedule: dto.schedule,
        deadline: dto.deadline,
        decidedAt: new Date(),
        ...(dto.note && {
          note: dto.note,
        }),
        status: shouldAutoApprove
          ? TripStatusEnum.PENDING
          : TripStatusEnum.PROPOSING,
      });
      const savedTrip = await this.tripRepo.save(trip);

      const tripLocations: TripLocation[] = locations.map(
        (location: Location, index: number) => {
          return this.tripLocationRepo.create({
            trip: savedTrip,
            baseLocationId: location.id,
            nameSnapshot: location.name,
            latitudeSnapshot: location.latitude,
            longitudeSnapshot: location.longitude,
            offsetRadiusSnapshot: location.offsetRadious,
            locationPointSnapshot: location.geom,
            arrivalOrder: dto.locations[index].arrival_order,
            scheduledAt: dto.locations[index].scheduled_at,
          });
        },
      );

      await this.tripLocationRepo.save(tripLocations);

      return await this.findOne(savedTrip.id);
    } catch (error) {
      // Fowarding detailed errors
      if (error instanceof RpcException) {
        throw error;
      }

      this.logger.error('Failed to create trip', error.stack);

      // Handle unique constraint violation for title
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throwRpcException({
          message: 'A trip with this title already exists',
          statusCode: HttpStatus.CONFLICT,
          details: {
            field: 'title',
            value: dto.title,
            error: 'Title must be unique',
          },
        });
      }

      throwRpcException({
        message: 'Failed to create trip',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
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
      .leftJoinAndSelect('trip.location', 'tripLocation')
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
      .leftJoinAndSelect('trip.locations', 'tripLocation')
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
    const trip: Trip = await this.findOne(id);
    const { title, status, schedule, deadline, ...rest } = dto;
    const titleExisted = await this.tripRepo.existsBy({
      title,
    });
    if (titleExisted) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Duplicated trip title',
      });
    }

    const isMeaningfulTimeline = +schedule <= +deadline;
    if (!isMeaningfulTimeline) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid trip schedule and deadline',
      });
    }

    try {
      TripStatusValidator.validateTransition(trip.status, status);
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }

    if (title !== undefined) trip.title = title;
    if (status !== undefined) trip.status = status;
    if (schedule !== undefined) trip.schedule = schedule;
    if (deadline !== undefined) trip.deadline = deadline;

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
      await this.tripLocationRepo.delete({
        trip: { id },
      });
      await this.tripRepo.delete(id);
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot delete trip',
      });
    }

    this.logger.log(`Trip deleted with id: ${id}`);
    return { success: true, id };
  }

  async approve(tripId: string, dto: ApproveTripDto): Promise<Trip> {
    const trip = await this.findOne(tripId);

    if (trip.status !== TripStatusEnum.PROPOSING) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid trip approval',
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
