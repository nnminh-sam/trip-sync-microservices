import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from 'src/types/location.types';

export class CreateLocationDto {
  @ApiProperty({ description: 'Location name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Offset radius in meters', default: 100 })
  @IsNotEmpty()
  @IsNumber()
  offsetRadious: number;

  @ApiProperty({ description: 'Location description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Location type',
    enum: LocationType,
    default: LocationType.OFFICE,
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

  @ApiProperty({ description: 'Location metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Is location active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Created by user ID' })
  @IsNotEmpty()
  @IsUUID()
  createdBy: string;
}
