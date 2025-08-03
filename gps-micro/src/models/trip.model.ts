import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

export enum TripStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export class Trip extends BaseModel {
  @ApiProperty({
    description: 'User ID assigned to this trip',
    type: 'string',
  })
  assigneeId: string;

  @ApiProperty({
    description: 'Trip status',
    enum: TripStatus,
    example: TripStatus.PENDING,
  })
  status: TripStatus;

  @ApiProperty({
    description: 'Purpose of the trip',
    type: 'string',
  })
  purpose: string;

  @ApiProperty({
    description: 'Goal or objective of the trip',
    type: 'string',
  })
  goal: string;

  @ApiProperty({
    description: 'Trip schedule details',
    type: 'string',
  })
  schedule: string;

  @ApiProperty({
    description: 'User ID who created this trip',
    type: 'string',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Assignee user object',
    type: () => User,
  })
  assignee?: User;

  @ApiProperty({
    description: 'Creator user object',
    type: () => User,
  })
  creator?: User;
}
