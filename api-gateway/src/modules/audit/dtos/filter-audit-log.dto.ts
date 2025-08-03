import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuditAction } from './create-audit-log.dto';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterAuditLogDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by user ID',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Filter by action type',
    enum: AuditAction,
    required: false,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiProperty({
    description: 'Filter by entity type',
    type: 'string',
    example: 'Trip',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    description: 'Filter by entity ID',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({
    description: 'Filter by IP address',
    type: 'string',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: 'Filter logs from this date (inclusive)',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filter logs until this date (inclusive)',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    description: 'Search in description field',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
