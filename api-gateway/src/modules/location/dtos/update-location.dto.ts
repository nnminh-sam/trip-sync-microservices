import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Name of the location',
    example: 'TripSync HQ',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Location latitude',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Location longitude',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Offset radius for check-in/out accuracy in meters',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  offsetRadious?: number;
}
