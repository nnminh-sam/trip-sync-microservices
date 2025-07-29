import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class ExportRequestDto {
  @ApiProperty({
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'excel', 'pdf'],
  })
  @IsNotEmpty()
  @IsString()
  format: string;

  @ApiProperty({
    description: 'Export type',
    example: 'trips',
    enum: ['trips', 'tasks', 'users', 'gps_logs', 'notifications'],
  })
  @IsNotEmpty()
  @IsString()
  export_type: string;

  @ApiProperty({
    description: 'Date range start for export data',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({
    description: 'Date range end for export data',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiProperty({
    description: 'Additional filters as JSON string',
    example: '{"status": "completed", "assignee_id": "user-123"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiProperty({
    description: 'Columns to include in export',
    example: '["id", "title", "status", "created_at"]',
    required: false,
  })
  @IsOptional()
  @IsString()
  columns?: string;
}