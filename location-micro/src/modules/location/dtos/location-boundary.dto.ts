import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from 'src/types/location.types';

export class LocationBoundaryDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ 
    description: 'Center coordinates of the location',
    example: { latitude: 10.7769, longitude: 106.7009 }
  })
  center: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Radius in meters' })
  radius: number;

  @ApiProperty({ required: false, description: 'Polygon boundary (GeoJSON format)' })
  boundary?: any;

  @ApiProperty({ enum: LocationType, description: 'Location type' })
  type: LocationType;
}