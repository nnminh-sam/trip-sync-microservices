import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GPSLocationDto {
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