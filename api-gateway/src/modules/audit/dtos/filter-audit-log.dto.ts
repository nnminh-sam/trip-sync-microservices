import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterAuditLogDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by user ID who performed the action',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'Filter by action type',
    example: 'CREATE',
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
    required: false,
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: 'Filter by entity type',
    example: 'Trip',
    enum: ['User', 'Trip', 'Task', 'Location', 'Role', 'Permission'],
    required: false,
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiProperty({
    description: 'Filter by entity ID',
    example: 'entity-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiProperty({
    description: 'Filter audit logs from this timestamp',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp_from?: string;

  @ApiProperty({
    description: 'Filter audit logs to this timestamp',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp_to?: string;

  @ApiProperty({
    description: 'Filter by IP address',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}