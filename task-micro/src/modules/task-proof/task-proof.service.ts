import { HttpStatus, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { TaskProof } from 'src/models/task-proof.model';
import { Task } from 'src/models/task.model';
import { CreateTaskProofDto } from 'src/modules/task-proof/dtos/create-task-proof.dto';
import { BulkCreateTaskProofDto } from 'src/modules/task-proof/dtos/bulk-create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task-proof/dtos/filter-task-proof.dto';
import { TaskService } from 'src/modules/task/task.service';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class TaskProofService {
  private readonly logger: Logger = new Logger(TaskProofService.name);

  constructor(
    @InjectRepository(TaskProof)
    private readonly taskProofRepository: Repository<TaskProof>,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    private readonly dataSource: DataSource,
  ) {}

  async create(taskId: string, payload: CreateTaskProofDto) {
    const task = await this.taskService.findOne(taskId);

    // Calculate locationPoint from latitude and longitude
    const proofData = {
      ...payload,
      taskId, // Ensure taskId is set
      locationPoint: payload.latitude && payload.longitude
        ? { x: payload.longitude, y: payload.latitude }
        : null,
    };

    const proof = this.taskProofRepository.create(proofData);
    try {
      const savedProof = await this.taskProofRepository.save(proof);
      return savedProof;
    } catch (error: any) {
      this.logger.error('Cannot create proof: ', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async find(taskId: string, payload: FilterTaskProofDto) {
    const task = await this.taskService.findOne(taskId);

    const {
      page,
      size,
      order,
      sortBy,
      type,
      mediaType,
      uploadedBy,
      timestamp,
    } = payload;

    const [proofs, total] = await this.taskProofRepository.findAndCount({
      where: {
        taskId,
        ...(type && { type }),
        ...(mediaType && { mediaType }),
        ...(uploadedBy && { uploadedBy }),
        ...(timestamp && { timestamp }),
      },
      ...paginateAndOrder({
        page,
        size,
        order,
        sortBy,
      }),
    });

    return ListDataDto.build<TaskProof>({
      data: proofs,
      page,
      size,
      total,
    });
  }

  async findOne(id: string) {
    const proof = await this.taskProofRepository.findOne({
      where: { id },
    });
    if (!proof) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Proof not found',
      });
    }
    return proof;
  }

  async delete(id: string) {
    const proof = await this.findOne(id);

    try {
      // Soft delete using BaseModel method
      proof.softDelete();
      await this.taskProofRepository.save(proof);
    } catch (error: any) {
      this.logger.error('Cannot delete proof: ', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  /**
   * Validates if the proof location is within acceptable range of the task location
   * @param proof TaskProof with location data
   * @param task Task to validate against
   * @param maxDistanceKm Maximum allowed distance in kilometers (default: 1km)
   * @returns Object with validation result and distance
   */
  async validateProofLocation(
    proof: TaskProof, 
    task: Task, 
    maxDistanceKm: number = 1
  ): Promise<{ isValid: boolean; distance?: number; message?: string }> {
    try {
      // Check if proof has location data
      if (!proof.latitude || !proof.longitude) {
        return {
          isValid: false,
          message: 'Proof does not have location data',
        };
      }

      // For now, we'll just validate that location data exists
      // In Phase 4, when we integrate with Location Service,
      // we'll add actual distance calculation and validation
      
      // Placeholder for future location validation logic
      // TODO: Integrate with Location Service to:
      // 1. Get task's trip location coordinates
      // 2. Calculate distance between proof location and trip location
      // 3. Validate distance is within acceptable range

      return {
        isValid: true,
        message: 'Location validation will be implemented in Phase 4',
      };
    } catch (error) {
      this.logger.error('Error validating proof location', error);
      return {
        isValid: false,
        message: 'Failed to validate location',
      };
    }
  }

  /**
   * Creates multiple task proofs in a single transaction
   * @param taskId The task ID for all proofs
   * @param payload Bulk create payload containing multiple proofs
   * @returns Array of created task proofs
   */
  async bulkCreate(taskId: string, payload: BulkCreateTaskProofDto): Promise<TaskProof[]> {
    const task = await this.taskService.findOne(taskId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdProofs: TaskProof[] = [];

      for (const proofData of payload.proofs) {
        const proof = queryRunner.manager.create(TaskProof, {
          ...proofData,
          taskId,
          locationPoint: proofData.latitude && proofData.longitude
            ? { x: proofData.longitude, y: proofData.latitude }
            : null,
        });

        const savedProof = await queryRunner.manager.save(proof);
        createdProofs.push(savedProof);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Created ${createdProofs.length} proofs for task ${taskId}`);
      return createdProofs;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      this.logger.error(`Failed to bulk create proofs for task ${taskId}`, error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create proofs',
      });
    } finally {
      await queryRunner.release();
    }
  }
}
