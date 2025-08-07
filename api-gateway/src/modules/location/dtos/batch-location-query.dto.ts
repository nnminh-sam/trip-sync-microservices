import { IsArray, IsNumber, IsString, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class LocationValidationItem {
  @ApiProperty({ 
    description: 'Location ID to validate',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  locationId: string;

  @ApiProperty({ 
    description: 'Latitude coordinate',
    example: 10.7769331
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({ 
    description: 'Longitude coordinate',
    example: 106.7009238
  })
  @IsNumber()
  longitude: number;
}

export class BatchLocationQueryDto {
  @ApiProperty({ 
    type: [LocationValidationItem], 
    description: 'Array of locations to validate',
    example: [{
      locationId: '123e4567-e89b-12d3-a456-426614174000',
      latitude: 10.7769331,
      longitude: 106.7009238
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationValidationItem)
  locations: LocationValidationItem[];

  @ApiProperty({ 
    required: false,
    description: 'Include inactive locations in the results',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;
}