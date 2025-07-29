import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class TaskCompletionFilterDto {
  @ApiProperty({
    description: 'Filter by trip ID',
    example: 'trip-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  trip_id?: string;

  @ApiProperty({
    description: 'Filter by task status',
    example: 'completed',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter tasks from this date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @ApiProperty({
    description: 'Filter tasks to this date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  @ApiProperty({
    description: 'Filter tasks completed from this date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completed_at_from?: string;

  @ApiProperty({
    description: 'Filter tasks completed to this date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completed_at_to?: string;
}