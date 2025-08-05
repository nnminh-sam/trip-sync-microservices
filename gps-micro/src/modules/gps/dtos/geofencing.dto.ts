import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationInfoDto } from './common.dto';

export class ValidateLocationDto {
  @ApiProperty({
    description: 'Location ID to validate against',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  locationId: string;

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
}

export class ValidateLocationResponseDto {
  @ApiProperty({
    description: 'Whether the coordinates are within the location radius',
    example: true,
  })
  isWithinRadius: boolean;

  @ApiProperty({
    description: 'Distance from location center in meters',
    example: 45.5,
  })
  distance: number;

  @ApiProperty({
    description: 'Location name',
    example: 'Hanoi Office',
  })
  locationName: string;

  @ApiProperty({
    description: 'Location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  locationId: string;

  @ApiProperty({
    description: 'Allowed radius in meters',
    example: 200,
  })
  offsetRadius: number;
}

export class NearbyLocationsQueryDto {
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

  @ApiPropertyOptional({
    description: 'Search radius in meters',
    example: 1000,
    default: 1000,
    minimum: 100,
    maximum: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  @Type(() => Number)
  radius?: number = 1000;
}

export class NearbyLocationsResponseDto {
  @ApiProperty({
    description: 'Array of nearby locations',
    type: [LocationInfoDto],
  })
  locations: LocationInfoDto[];

  @ApiProperty({
    description: 'Total number of locations found',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Search center coordinates',
    example: { latitude: 21.0285, longitude: 105.8542 },
  })
  searchCenter: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: 'Search radius used in meters',
    example: 1000,
  })
  searchRadius: number;
}

export class BatchValidateLocationDto {
  @ApiProperty({
    description: 'Array of location IDs to validate',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
  })
  @IsUUID('4', { each: true })
  locationIds: string[];

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
}

export class BatchValidateLocationResponseDto {
  @ApiProperty({
    description: 'Array of validation results',
    type: [ValidateLocationResponseDto],
  })
  results: ValidateLocationResponseDto[];

  @ApiProperty({
    description: 'Locations within radius',
    type: [String],
  })
  withinRadius: string[];

  @ApiProperty({
    description: 'Closest location',
    type: ValidateLocationResponseDto,
    nullable: true,
  })
  closestLocation: ValidateLocationResponseDto | null;
}