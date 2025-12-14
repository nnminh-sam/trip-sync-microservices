import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString,  IsDateString } from 'class-validator';
import { TripStatusEnum } from 'src/models/enums/trip-status.enum';

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
    description: 'Trip purpose',
    required: false,
  })
  @IsOptional()
  @IsString()
  purpose?: string;
  
  @ApiProperty({
    description: 'Trip goal',
    required: false,
  })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiProperty({
    description: "Trip's schedule",
    example: '2024-01-15T08:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  schedule?: Date;

  @ApiProperty({
    description: "Trip's deadline",
    example: '2024-01-17T18:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @ApiProperty({
    description: 'Trip status',
    enum: TripStatusEnum,
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: TripStatusEnum;

  @ApiProperty({
    description: 'Trip notes',
    example: 'Contact client at least 1 day before visit',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
