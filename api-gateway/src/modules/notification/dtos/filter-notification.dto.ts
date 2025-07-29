import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterNotificationDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by user ID',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'Filter by notification type',
    example: 'trip_approval',
    enum: ['trip_approval', 'task_assignment', 'trip_reminder', 'system_alert'],
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Filter by read status',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiProperty({
    description: 'Filter by priority level',
    example: 'high',
    enum: ['low', 'medium', 'high'],
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string;
}