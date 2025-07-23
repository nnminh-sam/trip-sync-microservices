import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDataDto } from 'src/dtos/list-data.dto';
import { TaskProof } from 'src/models/task-proof.model';
import { CreateTaskProofDto } from 'src/modules/task-proof/dtos/create-task-proof.dto';
import { FilterTaskProofDto } from 'src/modules/task-proof/dtos/filter-task-proof.dto';
import { TaskService } from 'src/modules/task/task.service';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { Repository } from 'typeorm';

@Injectable()
export class TaskProofService {
  private readonly logger: Logger = new Logger(TaskProofService.name);

  constructor(
    @InjectRepository(TaskProof)
    private readonly taskProofRepository: Repository<TaskProof>,
    private readonly taskService: TaskService,
  ) {}

  async create(taskId: string, payload: CreateTaskProofDto) {
    const task = await this.taskService.findOne(taskId);

    const proof = this.taskProofRepository.create(payload);
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
      // TODO: Set deletedAt = now Date();
    } catch (error: any) {
      this.logger.error('Cannot delete proof: ', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }
}
