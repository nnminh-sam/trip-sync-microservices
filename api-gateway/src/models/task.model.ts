import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskStatusEnum } from 'src/models/task-status.enum';
import { TripLocation } from 'src/models/trip-location.model';

export class Task extends BaseModel {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
  })
  tripLocationId: string;

  @ApiProperty({
    description: 'Trip location object',
    type: () => TripLocation,
    required: false,
  })
  tripLocation?: TripLocation;

  @ApiProperty({
    description: "Task's title",
  })
  title: string;

  @ApiProperty({
    description: "Task's description",
  })
  description: string;

  @ApiProperty({
    description: "Task's status",
    enum: TaskStatusEnum,
    example: TaskStatusEnum.PENDING,
  })
  status: TaskStatusEnum;

  @ApiProperty({
    description: "Task's note",
    required: false,
  })
  note?: string;

  @ApiProperty({
    description: "Task's deadline",
    type: 'string',
    format: 'date-time',
    required: false,
  })
  deadline?: Date;

  @ApiProperty({
    description: "Task's begin timestamp",
    type: 'string',
    format: 'date-time',
    required: false,
  })
  startedAt?: Date;

  @ApiProperty({
    description: "Task's completion timestamp",
    type: 'string',
    format: 'date-time',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Task approval timestamp',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  approvedAt?: Date;

  @ApiProperty({
    description: 'Task approver ID',
    type: 'string',
    format: 'UUID',
    required: false,
  })
  approvedBy?: string;

  @ApiProperty({
    description: 'Task rejection timestamp',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  rejectedAt?: Date;

  @ApiProperty({
    description: 'Task rejecter ID',
    type: 'string',
    format: 'UUID',
    required: false,
  })
  rejectedBy?: string;

  @ApiProperty({
    description: "Task's rejection reason",
    required: false,
  })
  rejectionReason?: string;

  @ApiProperty({
    description: "Task's cancelation timestamp",
    type: 'string',
    format: 'date-time',
    required: false,
  })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Task canceler ID',
    type: 'string',
    format: 'UUID',
    required: false,
  })
  canceledBy?: string;

  @ApiProperty({
    description: "Task's cancel reason",
    required: false,
  })
  cancelReason?: string;

  @ApiProperty({
    description: "Task's proofs",
    type: () => TaskProof,
    isArray: true,
  })
  proofs?: TaskProof[];
}
