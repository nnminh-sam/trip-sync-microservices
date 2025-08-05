import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @ApiProperty({
    description: 'Trip location ID to check in at',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tripLocationId: string;

  @ApiProperty({
    description: 'Current latitude coordinate',
    example: 21.0285,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @ApiProperty({
    description: 'Current longitude coordinate',
    example: 105.8542,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @ApiProperty({
    description: 'Timestamp of check-in',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;
}

export class CheckOutDto extends CheckInDto {}

export class CheckInResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Check-in successful',
  })
  message: string;

  @ApiProperty({
    description: 'Distance from location center in meters',
    example: 45.5,
  })
  distanceFromLocation: number;

  @ApiProperty({
    description: 'Check-in record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  checkInId: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Hanoi Office',
  })
  locationName: string;
}

export class CheckOutResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Check-out successful',
  })
  message: string;

  @ApiProperty({
    description: 'Duration at location in minutes',
    example: 120,
  })
  duration: number;

  @ApiProperty({
    description: 'Check-out record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  checkOutId: string;

  @ApiProperty({
    description: 'Check-in timestamp',
    example: '2024-01-15T08:30:00Z',
  })
  checkInTime: string;

  @ApiProperty({
    description: 'Check-out timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  checkOutTime: string;
}