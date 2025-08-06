import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class UpdateTripDto {
  @ApiProperty({
    description: 'Trip title',
    example: 'Business Meeting in Hanoi',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Trip description',
    example: 'Client meeting and site inspection',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Trip start date',
    example: '2024-01-15T08:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    description: 'Trip end date',
    example: '2024-01-17T18:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({
    description: 'User ID assigned to this trip',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @ApiProperty({
    description: 'Trip status',
    example: 'scheduled',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Trip notes',
    example: 'Contact client at least 1 day before visit',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
