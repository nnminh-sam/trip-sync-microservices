import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Trip } from 'src/models/trip.model';
import { User } from 'src/models/user.model';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved',
}

export class TripApproval extends BaseModel {
  @ApiProperty({
    description: 'Trip ID being evaluated for approval',
    type: 'string',
  })
  tripId: string;

  @ApiProperty({
    description: 'User ID of the approver',
    type: 'string',
  })
  approverId: string;

  @ApiProperty({
    description: 'Approval status',
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @ApiProperty({
    description: 'Approval note or comment',
    type: 'string',
    required: false,
  })
  note?: string;

  @ApiProperty({
    description: 'Whether this approval was automatic',
    type: 'boolean',
    example: false,
  })
  isAuto: boolean;

  @ApiProperty({
    description: 'Trip object',
    type: () => Trip,
  })
  trip?: Trip;

  @ApiProperty({
    description: 'Approver user object',
    type: () => User,
  })
  approver?: User;
}
