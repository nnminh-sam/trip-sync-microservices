import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { TripStatusEnum } from 'src/models/enums/trip-status.enum';

export class FilterTripDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by trip title',
    example: 'Business Meeting',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

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
    example: 'not_started',
    enum: TripStatusEnum,
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter trips scheduled from this date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  from_date_schedule?: string;

  @ApiProperty({
    description: 'Filter trips scheduled to this date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  to_date_schedule?: string;

  @ApiProperty({
    description: 'Filter trips ended from this date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  from_date_deadline?: string;

  @ApiProperty({
    description: 'Filter trips ended to this date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  to_date_deadline?: string;

  @ApiProperty({
    description: 'Filter by manager ID',
    example: 'user-uuid-456',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiProperty({
    description: 'Filter trips that has been evaluated',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  is_evaluated?: 'true' | 'false';
}
