import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class TripSummaryFilterDto {
  @ApiProperty({
    description: 'Filter by assignee ID',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @ApiProperty({
    description: 'Filter by trip status',
    example: 'completed',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter trips from this start date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date_from?: string;

  @ApiProperty({
    description: 'Filter trips to this start date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date_to?: string;

  @ApiProperty({
    description: 'Filter by created by user ID',
    example: 'user-uuid-456',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  created_by?: string;
}