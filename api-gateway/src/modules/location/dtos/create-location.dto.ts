import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Name of the location',
    example: 'TripSync HQ',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Latitude of the location',
    example: 21.028511,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude of the location',
    example: 105.804817,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: 'Offset radius for check-in/out accuracy in meters',
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  offsetRadius: number;
}
