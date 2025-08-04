import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsArray, IsOptional, IsUUID } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  GPX = 'gpx',
}

export enum ExportStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class GPSExportFilterDto {
  @ApiProperty({
    description: 'Start date for export',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for export',
    example: '2024-01-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Array of user IDs to include',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of trip IDs to include',
    type: [String],
    example: ['323e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tripIds?: string[];
}

export class CreateGPSExportDto {
  @ApiProperty({
    description: 'Export filter criteria',
    type: GPSExportFilterDto,
  })
  filter: GPSExportFilterDto;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Include user details in export',
    example: true,
    default: false,
  })
  @IsOptional()
  includeUserDetails?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include trip details in export',
    example: true,
    default: false,
  })
  @IsOptional()
  includeTripDetails?: boolean = false;

  @ApiPropertyOptional({
    description: 'Anonymize user data',
    example: false,
    default: false,
  })
  @IsOptional()
  anonymizeData?: boolean = false;
}

export class CreateGPSExportResponseDto {
  @ApiProperty({
    description: 'Export job ID',
    example: '523e4567-e89b-12d3-a456-426614174000',
  })
  exportId: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: ExportStatus.PROCESSING,
  })
  status: ExportStatus;

  @ApiProperty({
    description: 'Estimated processing time in seconds',
    example: 30,
  })
  estimatedTime: number;

  @ApiProperty({
    description: 'Export creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;
}

export class GPSExportStatusResponseDto {
  @ApiProperty({
    description: 'Export job ID',
    example: '523e4567-e89b-12d3-a456-426614174000',
  })
  exportId: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: ExportStatus.COMPLETED,
  })
  status: ExportStatus;

  @ApiPropertyOptional({
    description: 'Download URL (when completed)',
    example: 'https://storage.example.com/exports/gps-export-523e4567.csv',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Export expiration timestamp',
    example: '2024-01-16T10:30:00Z',
  })
  expiresAt?: string;

  @ApiProperty({
    description: 'Export creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'Export completion timestamp',
    example: '2024-01-15T10:31:00Z',
  })
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'Error message (if failed)',
    example: 'Export failed due to invalid data',
  })
  error?: string;

  @ApiProperty({
    description: 'Export metadata',
    type: Object,
    example: {
      totalRecords: 1500,
      fileSize: '2.5MB',
      format: 'csv',
    },
  })
  metadata: {
    totalRecords?: number;
    fileSize?: string;
    format: string;
    filters?: GPSExportFilterDto;
  };
}