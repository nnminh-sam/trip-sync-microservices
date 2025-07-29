import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateGpsLogDto {
  @ApiProperty({
    description: 'Trip ID this GPS log belongs to',
    example: 'trip-uuid-123',
  })
  @IsNotEmpty()
  @IsUUID()
  trip_id: string;

  @ApiProperty({
    description: 'User ID who logged this GPS location',
    example: 'user-uuid-123',
  })
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 21.0285,
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 105.8542,
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Altitude in meters',
    example: 15.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({
    description: 'Timestamp when GPS location was recorded',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}