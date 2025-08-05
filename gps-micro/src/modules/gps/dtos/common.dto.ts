import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GPSCoordinatesDto {
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
}

export class GPSLocationDto extends GPSCoordinatesDto {
  @ApiProperty({
    description: 'Timestamp when the GPS location was recorded',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  accuracy?: number;

  @ApiProperty({
    description: 'Speed in km/h',
    example: 60.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  speed?: number;

  @ApiProperty({
    description: 'Heading/bearing in degrees (0-360)',
    example: 45.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  @Type(() => Number)
  heading?: number;
}

export class TripLocationIdDto {
  @ApiProperty({
    description: 'Trip location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tripLocationId: string;
}

export class LocationInfoDto {
  @ApiProperty({
    description: 'Location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Hanoi Office',
  })
  name: string;

  @ApiProperty({
    description: 'Distance from current position in meters',
    example: 150.5,
  })
  distance: number;

  @ApiProperty({
    description: 'Allowed radius in meters',
    example: 200,
  })
  offsetRadius: number;
}