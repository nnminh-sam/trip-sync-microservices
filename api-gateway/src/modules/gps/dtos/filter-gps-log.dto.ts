import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterGpsLogDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by trip ID',
    example: 'trip-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  trip_id?: string;

  @ApiProperty({
    description: 'Filter by user ID',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'Filter GPS logs from this timestamp',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp_from?: string;

  @ApiProperty({
    description: 'Filter GPS logs to this timestamp',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp_to?: string;

  @ApiProperty({
    description: 'Filter by minimum latitude',
    example: 20.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude_min?: number;

  @ApiProperty({
    description: 'Filter by maximum latitude',
    example: 22.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude_max?: number;

  @ApiProperty({
    description: 'Filter by minimum longitude',
    example: 105.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude_min?: number;

  @ApiProperty({
    description: 'Filter by maximum longitude',
    example: 106.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude_max?: number;
}