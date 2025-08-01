import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TripLocation } from 'src/models/trip-location.model';

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class Task extends BaseModel {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
  })
  tripLocationId: string;

  @ApiProperty({
    description: 'Trip location object',
    type: () => TripLocation,
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
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

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
    description: "Task's completion timestamp",
    type: 'string',
    format: 'date-time',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: "Task's cancelation timestamp", 
    type: 'string',
    format: 'date-time',
    required: false,
  })
  cancelledAt?: Date;

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
