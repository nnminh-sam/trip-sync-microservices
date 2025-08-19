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
import { TripApproval } from 'src/models/trip-approval.model';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { TripApprovalStatusEnum } from 'src/models/trip-approval-status.enum';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,

    @InjectRepository(TripLocation)
    private readonly tripLocationRepo: Repository<TripLocation>,

    @InjectRepository(TripApproval)
    private readonly tripApprovalRepo: Repository<TripApproval>,
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
    const invalidIds: string[] = [];

    for (const id of locationIds) {
      try {
        // const result = await this.locationClient.findOne(id);
        // if (!result) invalidIds.push(id);
      } catch {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      this.logger.warn(`Invalid location_ids: ${invalidIds.join(', ')}`);
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'One or more location_id are invalid',
        details: invalidIds.map((id) => ({
          field: 'location_id',
          value: id,
          error: 'Not found in location-microservice',
        })),
      });
    }
  }

  private shouldAutoApproveTrip(dto: CreateTripDto): boolean {
    // Check if all required fields are provided for auto-approval
    const hasPurpose = dto.purpose && dto.purpose.trim().length > 0;
    const hasGoal = dto.goal && dto.goal.trim().length > 0;
    const hasSchedule = dto.schedule && dto.schedule.trim().length > 0;
    const hasAssigneeId = dto.assignee_id && dto.assignee_id.trim().length > 0;
    const hasLocations = dto.locations && dto.locations.length > 0;

    // All criteria must be met for auto-approval
    return hasPurpose && hasGoal && hasSchedule && hasAssigneeId && hasLocations;
  }

  async create(dto: CreateTripDto, claims: TokenClaimsDto): Promise<Trip> {
    this.logger.log('Creating a new trip');
    try {
      const locationIds = dto.locations.map((loc) => loc.location_id);
      await this.validateLocationIds(locationIds);

      // Check if trip should be auto-approved
      const shouldAutoApprove = this.shouldAutoApproveTrip(dto);
      
      const trip = this.tripRepo.create({
        title: dto.title,
        assignee_id: dto.assignee_id,
        purpose: dto.purpose,
        goal: dto.goal,
        schedule: dto.schedule,
        created_by: dto.created_by,
        status: shouldAutoApprove ? TripStatusEnum.APPROVED : TripStatusEnum.PENDING,
      });
      const savedTrip = await this.tripRepo.save(trip);

      const tripLocations = dto.locations.map((loc) =>
        this.tripLocationRepo.create({
          trip: savedTrip,
          location_id: loc.location_id,
          arrival_order: loc.arrival_order,
          scheduled_at: loc.scheduled_at,
        }),
      );

      await this.tripLocationRepo.save(tripLocations);

      // Create auto-approval record if trip was auto-approved
      if (shouldAutoApprove) {
        const approval = this.tripApprovalRepo.create({
          trip_id: savedTrip.id,
          approver_id: claims.sub, // Use the creator as the approver for auto-approval
          status: TripApprovalStatusEnum.APPROVED,
          note: 'Auto-approved: All required fields provided',
          is_auto: true,
        });
        await this.tripApprovalRepo.save(approval);
        
        this.logger.log(`Trip ${savedTrip.id} was auto-approved - all required fields provided`);
      }

      return await this.findOne(savedTrip.id, claims);
    } catch (error) {
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

  async findAll(
    filter: FilterTripDto,
    claims: TokenClaimsDto,
  ): Promise<ListDataDto<any>> {
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
      .leftJoinAndSelect('trip.locations', 'location')
      .leftJoinAndSelect('trip.approvals', 'approval');

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

    // Gọi locationClient.findOne() cho từng trip location
    const enrichedTrips = await Promise.all(
      items.map(async (trip) => {
        const enrichedLocations = await Promise.all(
          trip.locations.map(async (loc) => {
            let name = null;
            try {
              // const location = await this.locationClient.findOne(
              //   loc.location_id,
              // );
              // name = location?.name ?? null;
            } catch (err) {
              this.logger.warn(
                `Cannot fetch location name for ID: ${loc.location_id}`,
              );
            }
            return {
              id: loc.id,
              location_id: loc.location_id,
              arrival_order: loc.arrival_order,
              scheduled_at: loc.scheduled_at,
              name,
              createdAt: loc.createdAt,
              updatedAt: loc.updatedAt,
            };
          }),
        );

        // Format approvals data
        const formattedApprovals =
          trip.approvals?.map((approval) => ({
            id: approval.id,
            trip_id: approval.trip_id,
            approver_id: approval.approver_id,
            status: approval.status,
            note: approval.note,
            is_auto: approval.is_auto,
            createdAt: approval.createdAt,
            updatedAt: approval.updatedAt,
          })) || [];

        return {
          id: trip.id,
          title: trip.title,
          assignee_id: trip.assignee_id,
          status: trip.status,
          purpose: trip.purpose,
          goal: trip.goal,
          schedule: trip.schedule,
          created_by: trip.created_by,
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,
          locations: enrichedLocations,
          approvals: formattedApprovals,
        };
      }),
    );

    return ListDataDto.build<any>({
      data: enrichedTrips,
      page,
      size,
      total,
    });
  }

  async findOne(id: string, claims: TokenClaimsDto): Promise<any> {
    const trip = await this.tripRepo.findOne({
      where: { id },
      relations: ['locations'],
    });

    if (!trip) {
      this.logger.warn(`Trip not found: ${id}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Trip not found',
      });
    }

    // Enrich location data with location-micro response
    const enrichedLocations = await Promise.all(
      trip.locations.map(async (loc) => {
        let locationDetails = null;
        try {
          // locationDetails = await this.locationClient.findOne(loc.location_id);
        } catch (err) {
          this.logger.warn(
            `Failed to fetch location for ID: ${loc.location_id}`,
          );
        }

        return {
          id: loc.id,
          location_id: loc.location_id,
          arrival_order: loc.arrival_order,
          scheduled_at: loc.scheduled_at,
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

    return {
      id: trip.id,
      title: trip.title,
      purpose: trip.purpose,
      goal: trip.goal,
      schedule: trip.schedule,
      assignee_id: trip.assignee_id,
      status: trip.status,
      created_by: trip.created_by,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      locations: enrichedLocations,
    };
  }

  async update(
    id: string,
    dto: UpdateTripDto,
    claims: TokenClaimsDto,
  ): Promise<Trip> {
    const trip = await this.findOne(id, claims);

    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Trip not found',
      });
    }

    if (trip.status !== 'pending') {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Only trips with status 'pending' can be updated`,
      });
    }

    try {
      Object.assign(trip, {
        title: dto.title,
        purpose: dto.purpose,
        goal: dto.goal,
        schedule: dto.schedule,
        assignee_id: dto.assignee_id,
      });

      const savedTrip = await this.tripRepo.save(trip);

      if (dto.locations && dto.locations.length > 0) {
        // Xoá các trip_location cũ
        await this.tripLocationRepo.delete({ trip: { id } });

        // Tạo mới các trip_location
        const newTripLocations = dto.locations.map((loc) =>
          this.tripLocationRepo.create({
            trip: savedTrip,
            location_id: loc.location_id,
            arrival_order: loc.arrival_order,
            scheduled_at: loc.scheduled_at,
          }),
        );

        await this.tripLocationRepo.save(newTripLocations);
      }

      return await this.findOne(id, claims);
    } catch (error) {
      this.logger.error(`Failed to update trip: ${id}`, error.stack);
      
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
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update trip',
      });
    }
  }

  async remove(
    id: string,
    claims: TokenClaimsDto,
  ): Promise<{ success: boolean; id: string }> {
    const trip = await this.findOne(id, claims);

    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Trip not found',
      });
    }

    if (trip.status !== 'pending') {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Only trips with status 'pending' can be deleted`,
      });
    }

    // Xoá các trip_location trước
    await this.tripLocationRepo.delete({ trip: { id } });

    // Xoá trip
    await this.tripRepo.delete(id);

    this.logger.log(`Trip deleted with id: ${id}`);
    return { success: true, id };
  }

  async approve(
    tripId: string,
    approverId: string,
    dto: ApproveTripDto,
    claims: TokenClaimsDto,
  ): Promise<Trip> {
    const trip = await this.findOne(tripId, claims);

    if (trip.status !== 'pending') {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Only trips with status "pending" can be approved or rejected',
      });
    }

    const approval = this.tripApprovalRepo.create({
      trip_id: tripId,
      approver_id: approverId,
      status: dto.status,
      note: dto.note,
      is_auto: false,
    });

    await this.tripApprovalRepo.save(approval);

    if (dto.status === TripApprovalStatusEnum.APPROVED) {
      trip.assignee_id = dto.assignee_id;
      trip.status = TripStatusEnum.APPROVED;
    }

    if (dto.status === TripApprovalStatusEnum.REJECTED) {
      trip.status = TripStatusEnum.CANCELED;
    }

    await this.tripRepo.save(trip);
    return await this.findOne(tripId, claims);
  }

  async getTripLocations(
    tripId: string,
    claims: TokenClaimsDto,
  ): Promise<any[]> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Trip not found with ID: ${tripId}`,
      });
    }

    const locations = await this.tripLocationRepo.find({
      where: { trip: { id: tripId } },
      order: { arrival_order: 'ASC' },
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
          location_id: loc.location_id,
          arrival_order: loc.arrival_order,
          scheduled_at: loc.scheduled_at,
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

  async getTripApprovals(tripId: string) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Trip not found with ID: ${tripId}`,
      });
    }

    const approvals = await this.tripApprovalRepo.find({
      where: { trip_id: tripId },
      order: { createdAt: 'ASC' },
    });

    return approvals.map((a) => ({
      id: a.id,
      approver_id: a.approver_id,
      status: a.status,
      note: a.note,
      is_auto: a.is_auto,
      created_at: a.createdAt,
    }));
  }
}
