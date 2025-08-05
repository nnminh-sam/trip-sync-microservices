import { IsNumber, IsUUID, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ValidateCoordinatesDto {
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

  @ApiProperty({ description: 'Location ID to validate against', example: 'uuid-string' })
  @IsUUID()
  locationId: string;
}