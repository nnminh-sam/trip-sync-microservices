import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsDateString, Min, Max, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { GPSLocationDto } from './common.dto';

export class TrackGPSDto {
  @ApiProperty({
    description: 'Trip ID for this GPS log',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tripId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
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
    description: 'Longitude coordinate',
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
    description: 'Timestamp when the GPS location was recorded',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;
}

export class BatchTrackGPSDto {
  @ApiProperty({
    description: 'Trip ID for these GPS logs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tripId: string;

  @ApiProperty({
    description: 'Array of GPS locations to track',
    type: [GPSLocationDto],
    maxItems: 1000,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(1000)
  @Type(() => GPSLocationDto)
  locations: GPSLocationDto[];
}

export class TrackGPSResponseDto {
  @ApiProperty({
    description: 'ID of the created GPS log',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Success message',
    example: 'GPS location logged successfully',
  })
  message: string;
}

export class BatchTrackGPSResponseDto {
  @ApiProperty({
    description: 'Number of GPS logs processed',
    example: 25,
  })
  processed: number;

  @ApiProperty({
    description: 'Success message',
    example: 'GPS locations logged successfully',
  })
  message: string;
}