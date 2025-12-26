import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EmployeeStatisticDto {
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
    description: 'Filter trips that has been evaluated',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  is_evaluated?: 'true' | 'false';
}
