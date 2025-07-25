import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { TripLocation } from './trip-location.model';
import { TripApproval } from './trip-approval.model';

export class Trip extends BaseModel{
    @ApiProperty({ description: 'User ID assigned to the trip' })
    assignee_id: string;

    @ApiProperty({
        description: 'Trip status',
        enum: ['pending', 'accepted', 'canceled', 'in_progress', 'completed'],
        default: 'pending',
    })
    status: 'pending' | 'accepted' | 'canceled' | 'in_progress' | 'completed';

    @ApiProperty({ description: 'Purpose of the trip' })
    purpose: string;

    @ApiProperty({ description: 'Trip goal', required: false })
    goal?: string;

    @ApiProperty({ description: 'Trip schedule (date/time)', required: false })
    schedule?: string;

    @ApiProperty({ description: 'User ID who created the trip' })
    created_by: string;

    @ApiProperty({
        description: 'List of trip locations',
        type: () => [TripLocation],
        required: false,
    })
    locations?: TripLocation[];

    @ApiProperty({
        description: 'List of trip approvals',
        type: () => [TripApproval],
        required: false,
    })
    approvals?: TripApproval[];
}
