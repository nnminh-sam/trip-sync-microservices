import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DistanceQueryDto {
  @ApiProperty({ description: 'Starting latitude coordinate', example: 10.7769 })
  @IsNumber()
  @IsLatitude()
  @Type(() => Number)
  fromLat: number;

  @ApiProperty({ description: 'Starting longitude coordinate', example: 106.7009 })
  @IsNumber()
  @IsLongitude()
  @Type(() => Number)
  fromLng: number;

  @ApiProperty({ description: 'Destination latitude coordinate', example: 10.8231 })
  @IsNumber()
  @IsLatitude()
  @Type(() => Number)
  toLat: number;

  @ApiProperty({ description: 'Destination longitude coordinate', example: 106.6297 })
  @IsNumber()
  @IsLongitude()
  @Type(() => Number)
  toLng: number;
}