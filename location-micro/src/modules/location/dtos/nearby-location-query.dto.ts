import { IsNumber, IsEnum, IsOptional, Min, Max, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationType } from 'src/types/location.types';

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
    example: 1000 
  })
  @IsNumber()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  radiusMeters: number;

  @ApiProperty({ 
    enum: LocationType, 
    required: false,
    description: 'Filter by location type' 
  })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;
}