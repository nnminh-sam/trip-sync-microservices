import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
export class TripApproval extends BaseModel {
  @ApiProperty({ description: 'Trip ID this approval belongs to' })
  trip_id: string;

  @ApiProperty({ description: 'Approver ID (user from user-micro)' })
  approver_id: string;

  @ApiProperty({
    description: 'Approval status',
    enum: ['pending', 'approved', 'rejected', 'auto_approved'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';

  @ApiProperty({
    description: 'Approval note',
    required: false,
  })
  note?: string;

  @ApiProperty({ description: 'Is this approval automatic?', default: false })
  is_auto: boolean;
}
