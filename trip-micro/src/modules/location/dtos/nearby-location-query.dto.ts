import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationType } from 'src/modules/location/dtos/location.types';

export class NearbyLocationQueryDto {
  @ApiProperty({ description: 'Latitude coordinate', example: 10.7769 })
  @IsNumber()
  @IsLatitude()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 106.7009 })
  @IsNumber()
  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @ApiProperty({
    description: 'Search radius in meters',
    minimum: 1,
    maximum: 50000,
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  radius?: number;

  @ApiProperty({
    description: 'Search radius in meters (alias for radius)',
    minimum: 1,
    maximum: 50000,
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  radiusMeters?: number;

  @ApiProperty({
    enum: LocationType,
    required: false,
    description: 'Filter by location type',
  })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiProperty({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    description: 'Include inactive locations',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;
}
