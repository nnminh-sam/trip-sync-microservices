import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from 'src/types/location.types';

export class UpdateLocationDto {
  @ApiProperty({ description: 'Location name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Offset radius in meters', required: false })
  @IsOptional()
  @IsNumber()
  offsetRadious?: number;

  @ApiProperty({ description: 'Location description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Location type',
    enum: LocationType,
    required: false,
  })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiProperty({ description: 'Location address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Timezone', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
