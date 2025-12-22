import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripEvaluation } from 'src/models/trip-evaluation.model';
import { Trip } from 'src/models/trip.model';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { TripService } from '../trip/trip.service';
import { CreateEvaluationDto } from './dtos/create-evaluation.dto';
import { FilterEvaluationDto } from './dtos/filter-evaluation.dto';
import { throwRpcException } from 'src/utils';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { AuthorizeClaimsPayloadDto } from '../trip/dtos/authorize-claims-payload.dto';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    @InjectRepository(TripEvaluation)
    private readonly evaluationRepo: Repository<TripEvaluation>,

    private readonly tripService: TripService,
  ) {}

  async authorizeClaims(payload: AuthorizeClaimsPayloadDto) {
    return this.tripService.authorizeClaims(payload);
  }

  private async getNextVersion(tripId: string): Promise<number> {
    const result = await this.evaluationRepo
      .createQueryBuilder('evaluation')
      .select('MAX(evaluation.version)', 'maxVersion')
      .where('evaluation.tripId = :tripId', { tripId })
      .getRawOne();

    return (result?.maxVersion || 0) + 1;
  }

  private async verifyManagerOwnership(
    tripId: string,
    userId: string,
  ): Promise<Trip> {
    const trip = await this.tripService.findOne(tripId);

    if (trip.managerId !== userId) {
      throwRpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Only the trip manager can evaluate their own trips',
        details: { tripId, userId, managerId: trip.managerId },
      });
    }

    return trip;
  }

  private validateTripStatusForEvaluation(trip: Trip): void {
    const allowedStatuses = [TripStatusEnum.ENDED, TripStatusEnum.CANCELED];

    if (!allowedStatuses.includes(trip.status)) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Only completed or canceled trips can be evaluated',
        details: { currentStatus: trip.status, allowedStatuses },
      });
    }
  }

  async create(
    userId: string,
    dto: CreateEvaluationDto,
  ): Promise<TripEvaluation> {
    this.logger.log(
      `Creating evaluation for trip: ${dto.trip_id} by user: ${userId}`,
    );

    try {
      // Step 1: Verify manager ownership
      const trip = await this.verifyManagerOwnership(dto.trip_id, userId);

      // Step 2: Validate trip status
      this.validateTripStatusForEvaluation(trip);

      // Step 3: Get next version (auto-increment)
      const nextVersion = await this.getNextVersion(dto.trip_id);

      // Step 4: Create evaluation entity
      const evaluation = this.evaluationRepo.create({
        tripId: dto.trip_id,
        version: nextVersion,
        evaluationValue: dto.evaluation_value,
        comment: dto.comment,
      });

      // Step 5: Save to database
      return await this.evaluationRepo.save(evaluation);
    } catch (error) {
      this.logger.error('Failed to create evaluation', error.stack);

      // Re-throw RpcExceptions from verification steps
      if (error instanceof Error && error.message?.includes('RpcException')) {
        throw error;
      }

      // Handle database constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throwRpcException({
          message: 'Duplicate evaluation version. Please retry.',
          statusCode: HttpStatus.CONFLICT,
          details: {
            tripId: dto.trip_id,
            version: await this.getNextVersion(dto.trip_id),
          },
        });
      }

      throwRpcException({
        message: 'Failed to create evaluation',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }

  async findAll(
    filter: FilterEvaluationDto,
  ): Promise<ListDataDto<TripEvaluation>> {
    const {
      trip_id,
      version,
      evaluation_value,
      created_at_before,
      created_at_after,
      page = 1,
      size = 10,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filter;

    const query = this.evaluationRepo.createQueryBuilder('evaluation');

    // Apply filters
    if (trip_id) {
      query.andWhere('evaluation.tripId = :trip_id', { trip_id });
    }

    if (version !== undefined) {
      query.andWhere('evaluation.version = :version', { version });
    }

    if (evaluation_value) {
      query.andWhere('evaluation.evaluationValue = :evaluation_value', {
        evaluation_value,
      });
    }

    if (created_at_after) {
      query.andWhere('evaluation.createdAt >= :created_at_after', {
        created_at_after,
      });
    }

    if (created_at_before) {
      query.andWhere('evaluation.createdAt <= :created_at_before', {
        created_at_before,
      });
    }

    // Sorting and pagination
    query
      .orderBy(`evaluation.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [items, total] = await query.getManyAndCount();
    console.log(
      '🚀 ~ EvaluationService ~ findAll ~ items, total:',
      items,
      total,
    );

    return ListDataDto.build<TripEvaluation>({
      data: items,
      page,
      size,
      total,
    });
  }

  async findOne(id: string): Promise<TripEvaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
    });

    if (!evaluation) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Evaluation with id ${id} not found`,
      });
    }

    return evaluation;
  }
}
